// src/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { isAdmin } = require("../middleware/authMiddleware");

// Route: POST /api/auth/register (For creating staff accounts)
router.post("/register", isAdmin, async (req, res) => {
  const { name, username, password, role } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql =
      "INSERT INTO Staff (Name, Username, Password, Role) VALUES (?, ?, ?, ?)";
    await db.query(sql, [name, username, hashedPassword, role]);

    res.status(201).json({ message: "Staff member registered successfully." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register staff member." });
  }
});

// Route: POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    const sql = "SELECT * FROM Staff WHERE Username = ?";
    const [staff] = await db.query(sql, [username]);

    if (staff.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = staff[0];
    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Create a session
    req.session.user = {
      id: user.StaffID,
      name: user.Name,
      role: user.Role,
    };

    res
      .status(200)
      .json({ message: "Login successful.", user: req.session.user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Route: GET /api/auth/status
router.get("/status", (req, res) => {
  if (req.session.user) {
    res.status(200).json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

// Route: POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out." });
    }
    res.clearCookie("connect.sid"); // Clears the session cookie
    res.status(200).json({ message: "Logout successful." });
  });
});

module.exports = router;
