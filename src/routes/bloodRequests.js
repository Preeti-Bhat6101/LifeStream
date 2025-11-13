// src/routes/bloodRequests.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route: POST /api/requests
// Desc:  Create a new blood request
router.post("/", async (req, res) => {
  const { recipientId, bloodGroupId } = req.body;
  if (!recipientId || !bloodGroupId) {
    return res
      .status(400)
      .json({ message: "Recipient and Blood Group are required." });
  }
  try {
    const sql =
      "INSERT INTO BloodRequests (RecipientID, BloodGroupID) VALUES (?, ?)";
    const [result] = await db.query(sql, [recipientId, bloodGroupId]);
    res
      .status(201)
      .json({
        message: "Blood request created successfully",
        requestId: result.insertId,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create request" });
  }
});

// Route: GET /api/requests
// Desc:  Get all pending blood requests
router.get("/", async (req, res) => {
  try {
    const sql = `
            SELECT br.RequestID, r.Name AS RecipientName, bg.BloodType, br.RequestDate, br.Status
            FROM BloodRequests AS br
            JOIN Recipients AS r ON br.RecipientID = r.RecipientID
            JOIN BloodGroups AS bg ON br.BloodGroupID = bg.BloodGroupID
            WHERE br.Status = 'Pending'
            ORDER BY br.RequestDate ASC;
        `;
    const [requests] = await db.query(sql);
    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// Route: PUT /api/requests/:id/fulfill
// Desc:  Fulfill a blood request
router.put("/:id/fulfill", async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection(); // Use a transaction

  try {
    await connection.beginTransaction();

    // 1. Get the required blood group ID from the request
    const [requests] = await connection.query(
      "SELECT BloodGroupID FROM BloodRequests WHERE RequestID = ?",
      [id]
    );
    if (requests.length === 0) throw new Error("Request not found.");
    const bloodGroupId = requests[0].BloodGroupID;

    // 2. Find the oldest available blood unit of that type
    const [stock] = await connection.query(
      "SELECT StockID FROM BloodStock WHERE BloodGroupID = ? AND Status = 'Available' ORDER BY ExpiryDate ASC LIMIT 1",
      [bloodGroupId]
    );
    if (stock.length === 0)
      throw new Error("No compatible blood units available in stock.");
    const stockId = stock[0].StockID;

    // 3. Update the blood stock unit to 'Used'
    await connection.query(
      "UPDATE BloodStock SET Status = 'Used' WHERE StockID = ?",
      [stockId]
    );

    // 4. Update the request to 'Fulfilled'
    await connection.query(
      "UPDATE BloodRequests SET Status = 'Fulfilled' WHERE RequestID = ?",
      [id]
    );

    await connection.commit();
    res.status(200).json({ message: "Request fulfilled successfully." });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fulfill request", error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
