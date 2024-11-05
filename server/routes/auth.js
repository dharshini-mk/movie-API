const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");  // bcrypt for password hashing
const User = require("../models/User");
const router = express.Router();

// Middleware to verify the JWT token
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).send("Token is required");
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send("Invalid token");
        req.user = user;
        next();
    });
};

// Add favorite movie
router.post("/favorites", authenticateToken, async (req, res) => {
    const { imdbID, title, year, poster } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.favorites.some(movie => movie.imdbID === imdbID)) {
            user.favorites.push({ imdbID, title, year, poster });
            await user.save();
            res.json({ message: "Movie added to favorites", favorites: user.favorites });
        } else {
            res.status(400).json({ message: "Movie is already in favorites" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Remove favorite movie
router.delete("/favorites/:imdbID", authenticateToken, async (req, res) => {
    const { imdbID } = req.params;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.favorites = user.favorites.filter(movie => movie.imdbID !== imdbID);
        await user.save();
        res.json({ message: "Movie removed from favorites", favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Register user
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if the user already exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        user = new User({
            username,
            password: hashedPassword
        });

        // Save the user to the database
        await user.save();

        // Create a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Send the token to the client
        res.status(201).json({ message: "Registration successful", token });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Login user
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
