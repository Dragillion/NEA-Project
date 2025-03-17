const express = require('express');
const router = express.Router();
const pool = require('./app');  // Import your database connection
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

// GET Cart for Logged-in User
router.get('/cart', authenticateJWT, async (req, res) => {
    try {
        // Get the cart id for the user
        const cartResult = await pool.query(
            'SELECT id FROM carts WHERE user_id = $1',
            [req.user.userId]
        );

        if (cartResult.rows.length === 0) {
            return res.json({ products: [] });
        }

        const cartId = cartResult.rows[0].id;
        // Retrieve cart items for the cart id
        const itemsResult = await pool.query(
            'SELECT product_id, quantity FROM cart_items WHERE cart_id = $1',
            [cartId]
        );
        res.json({ products: itemsResult.rows });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST Add Item to Cart (Normalized)
router.post('/cart', authenticateJWT, async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        // Check if a cart exists for the user; if not, create one.
        let cartResult = await pool.query(
            'SELECT id FROM carts WHERE user_id = $1',
            [req.user.userId]
        );
        let cartId;
        if (cartResult.rows.length === 0) {
            const insertCartResult = await pool.query(
                'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
                [req.user.userId]
            );
            cartId = insertCartResult.rows[0].id;
        } else {
            cartId = cartResult.rows[0].id;
        }

        // Insert or update the cart item
        await pool.query(
            `INSERT INTO cart_items (cart_id, product_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (cart_id, product_id)
             DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
            [cartId, productId, quantity]
        );

        // Retrieve updated cart items to send back
        const itemsResult = await pool.query(
            'SELECT product_id, quantity FROM cart_items WHERE cart_id = $1',
            [cartId]
        );

        res.status(200).json({ message: 'Item added to cart', products: itemsResult.rows });
    } catch (error) {
        console.error("Error adding item to cart:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE Remove Item from Cart (Normalized)
router.delete('/cart/:productId', authenticateJWT, async (req, res) => {
    const { productId } = req.params;
    try {
        // Get the cart id for the user
        const cartResult = await pool.query(
            'SELECT id FROM carts WHERE user_id = $1',
            [req.user.userId]
        );

        if (cartResult.rows.length === 0) {
            return res.status(404).json({ error: "Cart not found" });
        }

        const cartId = cartResult.rows[0].id;
        // Delete the specified product from the cart_items table
        await pool.query(
            'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
            [cartId, productId]
        );

        // Retrieve updated cart items to send back
        const itemsResult = await pool.query(
            'SELECT product_id, quantity FROM cart_items WHERE cart_id = $1',
            [cartId]
        );

        res.status(200).json({ message: 'Item removed from cart', products: itemsResult.rows });
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
