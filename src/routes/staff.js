// src/routes/staff.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { isAdmin } = require("../middleware/authMiddleware");

// GET /api/staff - Get a list of all staff members (Admin only)
router.get("/", isAdmin, async (req, res) => {
  try {
    // Select all fields except the password hash for security
    const [staff] = await db.query(
      "SELECT StaffID, Name, Username, Role FROM Staff ORDER BY Name"
    );
    res.status(200).json(staff);
  } catch (error) {
    console.error("Error fetching staff list:", error);
    res.status(500).json({ message: "Failed to fetch staff list." });
  }
});

module.exports = router;
