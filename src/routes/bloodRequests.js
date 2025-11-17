// src/routes/bloodRequests.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route: POST /api/requests
// Desc:  Create a new blood request
router.post("/", async (req, res) => {
  // Check if a user is logged in
  if (!req.session.user) {
    return res
      .status(401)
      .json({ message: "You must be logged in to make a request." });
  }

  const { bloodGroupId, quantityRequiredML } = req.body;
  const recipientId = req.session.user.recipientId;

  if (!recipientId || !bloodGroupId || !quantityRequiredML) {
    return res.status(400).json({ message: "Missing required information." });
  }
  try {
    const sql =
      "INSERT INTO BloodRequests (RecipientID, BloodGroupID, QuantityRequiredML) VALUES (?, ?, ?)";
    const [result] = await db.query(sql, [
      recipientId,
      bloodGroupId,
      quantityRequiredML,
    ]);
    res.status(201).json({
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
            SELECT br.RequestID, r.Name AS RecipientName, bg.BloodType, br.QuantityRequiredML, br.RequestDate, br.Status
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

// Route: GET /api/requests/my-requests
// Desc:  Get all requests for the currently logged-in recipient
router.get("/my-requests", async (req, res) => {
  // Check if a user is logged in and is a Recipient
  if (!req.session.user || req.session.user.role !== "Recipient") {
    return res.status(401).json({ message: "Access denied." });
  }

  try {
    const recipientId = req.session.user.recipientId;

    const sql = `
            SELECT br.RequestID, bg.BloodType, br.QuantityRequiredML, br.RequestDate, br.Status
            FROM BloodRequests AS br
            JOIN BloodGroups AS bg ON br.BloodGroupID = bg.BloodGroupID
            WHERE br.RecipientID = ?
            ORDER BY br.RequestDate DESC;
        `;
    const [requests] = await db.query(sql, [recipientId]);
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching recipient requests:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// Route: PUT /api/requests/:id/fulfill
// Desc:  Fulfill a blood request
router.put("/:id/fulfill", async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const staffId = req.session.user.id; // Get the ID of the logged-in staff/admin
    await connection.query(
      "UPDATE BloodRequests SET Status = 'Fulfilled', StaffID = ? WHERE RequestID = ?",
      [staffId, id]
    );
    if (requests.length === 0)
      throw new Error("Request not found or already fulfilled.");

    const bloodGroupId = requests[0].BloodGroupID;
    let quantityNeeded = requests[0].QuantityRequiredML;

    const [availableStock] = await connection.query(
      "SELECT StockID, QuantityML FROM BloodStock WHERE BloodGroupID = ? AND Status = 'Available' ORDER BY ExpiryDate ASC",
      [bloodGroupId]
    );

    let totalAvailable = availableStock.reduce(
      (sum, unit) => sum + unit.QuantityML,
      0
    );
    if (totalAvailable < quantityNeeded)
      throw new Error(
        `Not enough blood in stock. Available: ${totalAvailable}ml, Required: ${quantityNeeded}ml.`
      );

    for (const unit of availableStock) {
      if (quantityNeeded <= 0) break;

      const amountToTake = Math.min(unit.QuantityML, quantityNeeded);
      const newQuantity = unit.QuantityML - amountToTake;
      quantityNeeded -= amountToTake;

      if (newQuantity <= 0) {
        await connection.query(
          "UPDATE BloodStock SET Status = 'Used', QuantityML = 0 WHERE StockID = ?",
          [unit.StockID]
        );
      } else {
        await connection.query(
          "UPDATE BloodStock SET QuantityML = ? WHERE StockID = ?",
          [newQuantity, unit.StockID]
        );
      }
    }

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

// Route: GET /api/requests/history
// Desc:  Get a complete history of all requests (pending, fulfilled, etc.)
router.get("/history", async (req, res) => {
  // We should add an 'isAuthenticated' middleware here for security in a real app,
  // but for now we assume the user is logged in.
  if (!req.session.user) {
    return res.status(401).json({ message: "Access denied." });
  }

  try {
    const sql = `
            SELECT 
                br.RequestID, 
                r.Name AS RecipientName, 
                bg.BloodType, 
                br.QuantityRequiredML, 
                br.RequestDate, 
                br.Status,
                s.Name AS FulfilledBy -- Join with Staff to see who fulfilled it
            FROM BloodRequests AS br
            JOIN Recipients AS r ON br.RecipientID = r.RecipientID
            JOIN BloodGroups AS bg ON br.BloodGroupID = bg.BloodGroupID
            LEFT JOIN Staff AS s ON br.StaffID = s.StaffID -- LEFT JOIN in case it's not fulfilled yet
            ORDER BY br.RequestDate DESC; -- Show the most recent requests first
        `;
    const [history] = await db.query(sql);
    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching request history:", error);
    res.status(500).json({ message: "Failed to fetch request history." });
  }
});

module.exports = router;
