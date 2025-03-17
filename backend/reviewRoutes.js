const express = require('express');
const router = express.Router();
const pool = require('./app'); // Import pool from app.js
const jwt = require("jsonwebtoken");

// JWT Secret Key
const SECRET_KEY = process.env.JWT_SECRET || "b7c1596a55c607ebf8dfd11a737d25e9d83e249f175af24266645a483be4c9e6";

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

// GET /api/products/:id/reviews - Retrieve all reviews for a given product
router.get('/products/:id/reviews', async (req, res) => {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
    }

    try {
        const result = await pool.query(
            `SELECT r.*, (u.first_name || ' ' || u.last_name) AS user_name 
             FROM reviews r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.product_id = $1
             ORDER BY r.created_at DESC`,
            [productId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /api/products/:id/reviews - Submit a new review (requires authentication)
router.post("/products/:id/reviews", authenticateJWT, async (req, res) => {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
    }

    const { rating, description } = req.body;
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    if (!description || description.trim() === "") {
        return res.status(400).json({ error: "Description is required" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO reviews (product_id, user_id, rating, description)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [productId, req.user.userId, rating, description]
        );

        const review = result.rows[0];
        const userResult = await pool.query(
            `SELECT (first_name || ' ' || last_name) AS user_name FROM users WHERE id = $1`,
            [req.user.userId]
        );

        review.user_name = userResult.rows[0].user_name;
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE /reviews/:id - Delete a review
router.delete('/reviews/:id', authenticateJWT, async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    const userId = req.user.userId; // Use the authenticated user's ID from the token

    if (isNaN(reviewId)) {
        return res.status(400).json({ error: "Invalid review ID" });
    }

    try {
        // Fetch the review to check ownership
        const reviewResult = await pool.query("SELECT * FROM reviews WHERE id = $1", [reviewId]);
        if (reviewResult.rows.length === 0) {
            return res.status(404).json({ error: "Review not found" });
        }

        // Check if the authenticated user is the review owner
        if (reviewResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Delete the review
        await pool.query("DELETE FROM reviews WHERE id = $1", [reviewId]);
        res.json({ message: "Review deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
