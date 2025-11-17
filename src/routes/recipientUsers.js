// src/routes/recipientUsers.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { isAdmin } = require("../middleware/authMiddleware");

// GET /api/recipient-users - Get a list of all recipient users (Admin only)
router.get("/", isAdmin, async (req, res) => {
  try {
    const sql = `
            SELECT ru.UserID, ru.Name, ru.Username, r.Name as HospitalName
            FROM RecipientUsers ru
            JOIN Recipients r ON ru.RecipientID = r.RecipientID
            ORDER BY r.Name, ru.Name;
        `;
    const [users] = await db.query(sql);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching recipient users:", error);
    res.status(500).json({ message: "Failed to fetch recipient users." });
  }
});

module.exports = router;
