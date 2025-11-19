// src/routes/recipients.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { isAdmin } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

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

// Route: Onboard a new recipient
// Desc: Register a new recipient
router.post("/onboard", isAdmin, async (req, res) => {
  const { hospitalName, hospitalContact, employeeName, username, password } =
    req.body;

  if (!hospitalName || !employeeName || !username || !password) {
    return res
      .status(400)
      .json({ message: "All required fields are not filled." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let [recipients] = await connection.query(
      "SELECT RecipientID FROM Recipients WHERE Name = ?",
      [hospitalName]
    );
    let recipientId;

    if (recipients.length === 0) {
      const [newRecipient] = await connection.query(
        "INSERT INTO Recipients (Name, Contact) VALUES (?, ?)",
        [hospitalName, hospitalContact]
      );
      recipientId = newRecipient.insertId;
    } else {
      recipientId = recipients[0].RecipientID;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.query(
      "INSERT INTO Users (Name, Username, Password, Role, RecipientID) VALUES (?, ?, ?, ?, ?)",
      [employeeName, username, hashedPassword, "Recipient", recipientId]
    );

    await connection.commit();
    res
      .status(201)
      .json({ message: "Hospital partner onboarded successfully." });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "That username is already taken." });
    }
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Server error during onboarding." });
  } finally {
    connection.release();
  }
});

module.exports = router;
