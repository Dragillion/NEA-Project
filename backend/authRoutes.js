const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const pool = require("./app");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "b7c1596a55c607ebf8dfd11a737d25e9d83e249f175af24266645a483be4c9e6";

// Middleware to Verify JWT and Check Blacklist
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Compute SHA256 hash of the token
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // Check if the hashed token exists in the blacklist table
        const result = await pool.query(
            "SELECT hashed_token FROM token_blacklist WHERE hashed_token = $1",
            [tokenHash]
        );
        if (result.rows.length > 0) {
            return res.status(401).json({ error: "Token has been revoked. Please log in again." });
        }

        req.user = jwt.verify(token, SECRET_KEY); // Decode JWT
        next(); // Move to next middleware/route
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// REGISTER USER
router.post(
    "/register",
    [
        body("email").isEmail().withMessage("Invalid email format"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { first_name, last_name, email, password, phone } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const phoneValue = phone && phone.trim() !== "" ? phone : null;

            const query = `
                INSERT INTO users (first_name, last_name, email, password_hash, phone, created_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                RETURNING id, first_name, last_name, email;
            `;
            const values = [first_name, last_name, email, hashedPassword, phoneValue];
            const result = await pool.query(query, values);

            res.status(201).json({ user: result.rows[0] });
        } catch (error) {
            console.error("Registration error:", error);

            if (error.code === "23505") {
                if (error.detail && error.detail.includes("(email)=")) {
                    return res.status(400).json({
                        error: "This email is already registered. Please use a different email.",
                    });
                }
                if (error.detail && error.detail.includes("(phone)=")) {
                    return res.status(400).json({
                        error: "This phone number is already registered. Please use a different phone number.",
                    });
                }
            }
            
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

// LOGIN USER 
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email" });
        }

        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: "2h" });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET USER ACCOUNT DETAILS (Protected Route)
router.get("/account", verifyToken, async (req, res) => {
    try {
        const userResult = await pool.query(
            "SELECT id, first_name, last_name, email FROM users WHERE id = $1",
            [req.user.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user: userResult.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// LOGOUT USER (Blacklist JWT)
router.post("/logout", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Compute SHA256 hash of the token
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // Insert the hashed token into the token_blacklist table
        await pool.query(
            "INSERT INTO token_blacklist (hashed_token, created_at) VALUES ($1, CURRENT_TIMESTAMP)",
            [tokenHash]
        );
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// New endpoint to check if an email exists
router.post("/check-email", async (req, res) => {
    const { email } = req.body;
    try {
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        res.json({ exists: userResult.rows.length > 0 });
    } catch (error) {
        console.error("Error checking email:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
