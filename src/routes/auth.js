// src/routes/auth.js - The New Unified Version
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { isAdmin } = require("../middleware/authMiddleware");

// A SINGLE login route for ALL users (Admin, Staff, Recipient)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "All fields are required." });
  try {
    const [users] = await db.query("SELECT * FROM Users WHERE Username = ?", [
      username,
    ]);
    if (users.length === 0)
      return res.status(401).json({ message: "Invalid credentials." });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials." });

    // Create a universal session with all necessary info
    req.session.user = {
      id: user.UserID,
      name: user.Name,
      role: user.Role,
      recipientId: user.RecipientID, // This will be NULL for Admins and Staff
    };
    res
      .status(200)
      .json({ message: "Login successful.", user: req.session.user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// A SINGLE registration route for an ADMIN to create ANY type of user
router.post("/register", isAdmin, async (req, res) => {
  const { name, username, password, role, recipientId } = req.body;
  if (!name || !username || !password || !role) {
    return res
      .status(400)
      .json({ message: "Name, username, password, and role are required." });
  }
  if (role === "Recipient" && !recipientId) {
    return res
      .status(400)
      .json({ message: "A recipient user must be assigned to a hospital." });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // The 'RecipientID' will be null if the role is not 'Recipient'
    const finalRecipientId = role === "Recipient" ? recipientId : null;

    const sql =
      "INSERT INTO Users (Name, Username, Password, Role, RecipientID) VALUES (?, ?, ?, ?, ?)";
    await db.query(sql, [
      name,
      username,
      hashedPassword,
      role,
      finalRecipientId,
    ]);

    res.status(201).json({ message: "User account created successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists." });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to create user account." });
  }
});

// GET /status -
router.get("/status", (req, res) => {
  if (req.session.user) {
    res.status(200).json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

// POST /logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Could not log out." });
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logout successful." });
  });
});

module.exports = router;
