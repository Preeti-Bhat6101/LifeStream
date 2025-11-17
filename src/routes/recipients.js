// src/routes/recipients.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { isAdmin } = require("../middleware/authMiddleware");

// Route: POST /api/recipients
// Desc:  Add a new recipient (e.g., a hospital)
router.post("/", async (req, res) => {
  const { name, contact } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Recipient name is required." });
  }
  try {
    const sql = "INSERT INTO Recipients (Name, Contact) VALUES (?, ?)";
    const [result] = await db.query(sql, [name, contact]);
    res.status(201).json({
      message: "Recipient added successfully",
      recipientId: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add recipient" });
  }
});

// Route: GET /api/recipients
// Desc:  Get all recipients
router.get("/", async (req, res) => {
  try {
    const [recipients] = await db.query(
      "SELECT * FROM Recipients ORDER BY Name"
    );
    res.status(200).json(recipients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch recipients" });
  }
});

module.exports = router;
