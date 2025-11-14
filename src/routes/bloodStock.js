// src/routes/bloodStock.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route: POST /api/stock
// Desc:  Add a new blood unit to the stock
router.post("/", async (req, res) => {
  // Now accepting quantityML
  const { donorId, collectionDate, quantityML } = req.body;

  if (!donorId || !collectionDate) {
    return res
      .status(400)
      .json({ message: "Donor and Collection Date are required." });
  }

  try {
    const [donors] = await db.query(
      "SELECT BloodGroupID FROM Donors WHERE DonorID = ?",
      [donorId]
    );
    if (donors.length === 0)
      return res.status(404).json({ message: "Donor not found." });

    const bloodGroupId = donors[0].BloodGroupID;

    const collection = new Date(collectionDate);
    const expiryDate = new Date(
      new Date(collection).setDate(collection.getDate() + 42)
    )
      .toISOString()
      .slice(0, 10);

    // Use the provided quantity, or default to 470
    const finalQuantity = quantityML || 470;

    const sql =
      "INSERT INTO BloodStock (DonorID, BloodGroupID, QuantityML, CollectionDate, ExpiryDate) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.query(sql, [
      donorId,
      bloodGroupId,
      finalQuantity,
      collectionDate,
      expiryDate,
    ]);

    res.status(201).json({
      message: "Blood unit added to stock successfully",
      stockId: result.insertId,
    });
  } catch (error) {
    console.error("Error adding blood to stock:", error);
    res
      .status(500)
      .json({ message: "Failed to add blood to stock", error: error.message });
  }
});

// Route: GET /api/stock
// Desc:  Get all available blood units in stock
router.get("/", async (req, res) => {
  try {
    const sql = `
            SELECT 
                bs.StockID,
                d.Name AS DonorName,
                bg.BloodType,
                bs.QuantityML,
                bs.CollectionDate,
                bs.ExpiryDate,
                bs.Status
            FROM BloodStock AS bs
            JOIN Donors AS d ON bs.DonorID = d.DonorID
            JOIN BloodGroups AS bg ON bs.BloodGroupID = bg.BloodGroupID
            WHERE 
                bs.Status = 'Available' 
                AND bs.ExpiryDate >= CURDATE() -- <-- THE NEW, IMPORTANT LINE
            ORDER BY bs.ExpiryDate ASC;
        `;
    const [stock] = await db.query(sql);
    res.status(200).json(stock);
  } catch (error) {
    console.error("Error fetching blood stock:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch blood stock", error: error.message });
  }
});

module.exports = router;
