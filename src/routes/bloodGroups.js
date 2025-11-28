// src/routes/bloodGroups.js

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route: POST /api/blood-groups
// Desc:  Add a new blood group
router.post("/", async (req, res) => {
  // Get the blood type from the request body
  const { bloodType } = req.body;

  // Basic validation: Check if bloodType was provided
  if (!bloodType) {
    return res.status(400).json({ message: "Blood type is required" });
  }

  try {
    // SQL query to insert a new blood group
    const sql = "INSERT INTO BloodGroups (BloodType) VALUES (?)";

    // Execute the query
    const [result] = await db.query(sql, [bloodType]);

    // Send a success response
    res.status(201).json({
      message: "Blood group added successfully",
      bloodGroupId: result.insertId,
    });
  } catch (error) {
    // Handle potential errors, like a duplicate entry
    console.error("Error adding blood group:", error);
    res
      .status(500)
      .json({ message: "Failed to add blood group", error: error.message });
  }
});

// Route: GET /api/blood-groups
// Desc:  Get all blood groups
router.get("/", async (req, res) => {
  try {
    // SQL query to select all blood groups
    const sql = "SELECT * FROM BloodGroups ORDER BY BloodType";

    // Execute the query
    const [bloodGroups] = await db.query(sql);

    // Send the list of blood groups as a JSON response
    res.status(200).json(bloodGroups);
  } catch (error) {
    console.error("Error fetching blood groups:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch blood groups", error: error.message });
  }
});

module.exports = router;
