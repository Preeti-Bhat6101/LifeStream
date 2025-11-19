// src/routes/bloodRequests.js - FINAL CORRECTED VERSION
const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.post("/", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "Recipient") {
    return res
      .status(403)
      .json({ message: "Only recipients can create requests." });
  }
  const { bloodGroupId, quantityRequiredML } = req.body;
  const recipientId = req.session.user.recipientId; // Get from session
  if (!recipientId || !bloodGroupId || !quantityRequiredML) {
    return res.status(400).json({ message: "Missing required information." });
  }
  try {
    const sql =
      "INSERT INTO BloodRequests (RecipientID, BloodGroupID, QuantityRequiredML) VALUES (?, ?, ?)";
    await db.query(sql, [recipientId, bloodGroupId, quantityRequiredML]);
    res.status(201).json({ message: "Blood request created successfully" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/requests - Fetch pending requests (for Staff/Admin)
router.get("/", async (req, res) => {
  try {
    const sql = `
            SELECT br.RequestID, r.Name AS RecipientName, bg.BloodType, br.QuantityRequiredML, br.RequestDate
            FROM BloodRequests AS br
            JOIN Recipients AS r ON br.RecipientID = r.RecipientID
            JOIN BloodGroups AS bg ON br.BloodGroupID = bg.BloodGroupID
            WHERE br.Status = 'Pending'
            ORDER BY br.RequestDate ASC;
        `;
    const [requests] = await db.query(sql);
    res.status(200).json(requests);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// GET /api/requests/my-requests - Fetch requests for a logged-in Recipient
router.get("/my-requests", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "Recipient") {
    return res.status(401).json({ message: "Access denied." });
  }
  try {
    const recipientId = req.session.user.recipientId;
    const sql = `
            SELECT bg.BloodType, br.QuantityRequiredML, br.RequestDate, br.Status
            FROM BloodRequests AS br
            JOIN BloodGroups AS bg ON br.BloodGroupID = bg.BloodGroupID
            WHERE br.RecipientID = ?
            ORDER BY br.RequestDate DESC;
        `;
    const [requests] = await db.query(sql, [recipientId]);
    res.status(200).json(requests);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// GET /api/requests/history - Fetch ALL requests (for Staff/Admin)
router.get("/history", async (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: "Access denied." });
  try {
    const sql = `
            SELECT r.Name AS RecipientName, bg.BloodType, br.QuantityRequiredML, br.RequestDate, br.Status, u.Name AS FulfilledBy
            FROM BloodRequests AS br
            JOIN Recipients AS r ON br.RecipientID = r.RecipientID
            JOIN BloodGroups AS bg ON br.BloodGroupID = bg.BloodGroupID
            LEFT JOIN Users AS u ON br.FulfilledByUserID = u.UserID
            ORDER BY br.RequestDate DESC;
        `;
    const [history] = await db.query(sql);
    res.status(200).json(history);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch history." });
  }
});

// PUT /api/requests/:id/fulfill - Fulfill a request
router.put("/:id/fulfill", async (req, res) => {
  if (
    !req.session.user ||
    !["Admin", "Staff"].includes(req.session.user.role)
  ) {
    return res
      .status(403)
      .json({ message: "Only staff or admins can fulfill requests." });
  }
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [requests] = await connection.query(
      'SELECT BloodGroupID, QuantityRequiredML FROM BloodRequests WHERE RequestID = ? AND Status = "Pending"',
      [id]
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
        `Not enough blood. Available: ${totalAvailable}ml, Required: ${quantityNeeded}ml.`
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

    const fulfilledBy = req.session.user.id;
    await connection.query(
      "UPDATE BloodRequests SET Status = 'Fulfilled', FulfilledByUserID = ? WHERE RequestID = ?",
      [fulfilledBy, id]
    );

    await connection.commit();
    res.status(200).json({ message: "Request fulfilled successfully." });
  } catch (error) {
    await connection.rollback();
    res
      .status(500)
      .json({ message: error.message || "Failed to fulfill request" });
  } finally {
    connection.release();
  }
});

module.exports = router;
