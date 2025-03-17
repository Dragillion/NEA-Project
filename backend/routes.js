const express = require('express');
const router = express.Router();
const pool = require('./app');  // Import pool from app.js

// Route to fetch all products
router.get('/products', async (req, res) => {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    try {
        const result = await pool.query("SELECT * FROM products LIMIT $1 OFFSET $2", [limit, offset]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/products/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
    }

    try {
        const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
        res.json(result.rows.length ? result.rows[0] : { error: "Product not found" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
