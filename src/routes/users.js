// Create new file: src/routes/users.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { isAdmin } = require("../middleware/authMiddleware");

router.get("/", isAdmin, async (req, res) => {
  try {
    const sql = `
            SELECT u.Name, u.Username, u.Role, r.Name AS HospitalName
            FROM Users u
            LEFT JOIN Recipients r ON u.RecipientID = r.RecipientID
            ORDER BY u.Name;
        `;
    const [users] = await db.query(sql);
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
});
module.exports = router;
