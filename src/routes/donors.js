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
    const finalLastDonationDate = lastDonationDate ? lastDonationDate : null;

    const [result] = await db.query(sql, [
      name,
      contact,
      location,
      bloodGroupId,
      finalLastDonationDate,
    ]);

    res.status(201).json({
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

// Route: POST /api/donors/search
// Desc:  Search for eligible donors by blood group and location
router.post("/search", async (req, res) => {
  const { bloodGroupId, location } = req.body;

  if (!bloodGroupId) {
    return res
      .status(400)
      .json({ message: "Blood group is required for search." });
  }

  try {
    // Start with the base query
    let sql = `
            SELECT Name, Contact, Location, LastDonationDate, bg.BloodType
            FROM Donors
            JOIN BloodGroups bg ON Donors.BloodGroupID = bg.BloodGroupID
            WHERE Donors.BloodGroupID = ?
        `;
    const params = [bloodGroupId];

    // Add location to the query if it was provided
    if (location) {
      // Using LIKE to allow for partial matches
      sql += " AND Location LIKE ?";
      params.push(`%${location}%`);
    }

    sql += " ORDER BY Name;";

    const [donors] = await db.query(sql, params);
    res.status(200).json(donors);
  } catch (error) {
    console.error("Error searching donors:", error);
    res
      .status(500)
      .json({ message: "Failed to search for donors", error: error.message });
  }
});

module.exports = router;
