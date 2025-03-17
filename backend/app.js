require("dotenv").config();  // Load environment variables
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

// Initialize Express app
const app = express();

// Enable CORS for all routes
app.use(cors());

// Create a connection pool to the database
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5433,
});

// Middleware to parse incoming JSON requests
app.use(express.json());

// Setup session middleware (required for Passport)
app.use(session({
    secret: "your_session_secret",
    resave: false,
    saveUninitialized: false,
}));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Test the database connection
pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL"))
    .catch(err => console.error("❌ Database connection error:", err));

// Export pool so it can be used in other files
module.exports = pool;

// Import routes
const productRoutes = require("./routes");
const authRoutes = require("./authRoutes");
const googleAuthRoutes = require("./googleAuthRoutes");
const cartRoutes = require("./cartRoutes");
const reviewRoutes = require("./reviewRoutes");

// Use routes with appropriate prefixes
app.use("/api", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api", cartRoutes);
app.use("/api", reviewRoutes);

const PORT = process.env.PORT || 3001;
console.log("PORT from .env:", process.env.PORT);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

