const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("./app");  // Use the same pool from app.js

const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Configure Passport’s Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        // Extract profile information
        const email = profile.emails[0].value;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;

        // Check if user already exists by email
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        let user;

        if (result.rows.length > 0) {
            // User exists
            user = result.rows[0];
        } else {
            // Create a new user
            // Generate a dummy password hash since password is required (user won’t use it)
            const dummyPassword = await bcrypt.hash(Math.random().toString(36).substring(2), 10);
            const insertResult = await pool.query(
                `INSERT INTO users (first_name, last_name, email, password_hash, created_at)
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [firstName, lastName, email, dummyPassword]
            );
            user = insertResult.rows[0];
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// Serialize/deserialize user info for session support
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (result.rows.length > 0) {
            done(null, result.rows[0]);
        } else {
            done(new Error("User not found"), null);
        }
    } catch (error) {
        done(error, null);
    }
});

// Start Google OAuth flow
router.get("/google", passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account"
}));


// Google OAuth callback endpoint
router.get("/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        // Successful authentication
        // Generate a JWT token using secret key
        const token = jwt.sign(
            { userId: req.user.id, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );
        // Redirect to the frontend with the token and a loginMethod flag as query parameters.
        res.redirect(`http://127.0.0.1:5501/index.html?token=${token}&loginMethod=google`);
    }
);

// Google logout endpoint to clear the Passport session
router.get("/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.json({ message: "Google logout successful" });
    });
});


module.exports = router;
