// src/routes/donors.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route: POST /api/donors
// Desc:  Register a new donor
router.post("/", async (req, res) => {
  const { name, contact, location, bloodGroupId, lastDonationDate } = req.body;

  if (!name || !contact || !bloodGroupId) {
    return res
      .status(400)
      .json({ message: "Name, Contact, and Blood Group are required." });
  }

  try {
    const sql =
      "INSERT INTO Donors (Name, Contact, Location, BloodGroupID, LastDonationDate) VALUES (?, ?, ?, ?, ?)";
    // Use null for an empty date string
    const finalLastDonationDate = lastDonationDate ? lastDonationDate : null;

    const [result] = await db.query(sql, [
      name,
      contact,
      location,
      bloodGroupId,
      finalLastDonationDate,
    ]);

    res
      .status(201)
      .json({
        message: "Donor registered successfully",
        donorId: result.insertId,
      });
  } catch (error) {
    console.error("Error registering donor:", error);
    res
      .status(500)
      .json({ message: "Failed to register donor", error: error.message });
  }
});

// Route: GET /api/donors
// Desc:  Get all donors
router.get("/", async (req, res) => {
  try {
    // Join with BloodGroups to show the blood type string instead of just the ID
    const sql = `
            SELECT DonorID, Name, Contact, Location, LastDonationDate, BloodGroups.BloodType 
            FROM Donors 
            JOIN BloodGroups ON Donors.BloodGroupID = BloodGroups.BloodGroupID
            ORDER BY Name;
        `;
    const [donors] = await db.query(sql);
    res.status(200).json(donors);
  } catch (error) {
    console.error("Error fetching donors:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch donors", error: error.message });
  }
});

module.exports = router;
