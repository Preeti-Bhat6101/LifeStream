// src/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { isAdmin } = require("../middleware/authMiddleware");

// Route: POST /api/auth/register (For creating staff accounts)

router.post("/recipient/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "All fields are required." });

  try {
    const [users] = await db.query(
      "SELECT * FROM RecipientUsers WHERE Username = ?",
      [username]
    );
    if (users.length === 0)
      return res.status(401).json({ message: "Invalid credentials." });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials." });

    // Create a session with the Recipient role and their organization ID
    req.session.user = {
      id: user.UserID,
      name: user.Name,
      role: "Recipient",
      recipientId: user.RecipientID,
    };
    res
      .status(200)
      .json({ message: "Login successful.", user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

// --- THIS IS THE MODIFIED LOGIN ROUTE ---
router.post("/login", async (req, res) => {
  console.log("\n--- New Login Attempt ---");

  // 1. Check what the server is receiving from the browser
  const { username, password } = req.body;
  console.log(
    `[Step 1] Received credentials: Username='${username}', Password='${password}'`
  );

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    // 2. Query the database for the user
    const sql = "SELECT * FROM Staff WHERE Username = ?";
    console.log(`[Step 2] Executing SQL: ${sql.replace("?", `'${username}'`)}`);
    const [staff] = await db.query(sql, [username]);

    // 3. Check if the user was found
    if (staff.length === 0) {
      console.log(
        '[Step 3] Result: User not found in database. Sending "Invalid credentials".'
      );
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = staff[0];
    console.log(
      `[Step 3] Result: User found! ID: ${user.StaffID}, Name: ${user.Name}`
    );
    console.log(`   > Stored Password Hash: ${user.Password}`);

    // 4. Compare the submitted password with the stored hash
    console.log("[Step 4] Comparing submitted password with stored hash...");
    const isMatch = await bcrypt.compare(password, user.Password);

    // 5. Check the result of the comparison
    if (!isMatch) {
      console.log(
        '[Step 5] Result: Password comparison failed. Sending "Invalid credentials".'
      );
      return res.status(401).json({ message: "Invalid credentials." });
    }

    console.log("[Step 5] Result: Password comparison successful!");

    // Create a session
    req.session.user = { id: user.StaffID, name: user.Name, role: user.Role };
    res
      .status(200)
      .json({ message: "Login successful.", user: req.session.user });
  } catch (error) {
    console.error("!!! SERVER ERROR DURING LOGIN:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Route: GET /api/auth/status
router.get("/status", (req, res) => {
  if (req.session.user) {
    res.status(200).json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

// Route: POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out." });
    }
    res.clearCookie("connect.sid"); // Clears the session cookie
    res.status(200).json({ message: "Logout successful." });
  });
});

router.post("/recipient/register", isAdmin, async (req, res) => {
  const { name, username, password, recipientId } = req.body;
  if (!name || !username || !password || !recipientId) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql =
      "INSERT INTO RecipientUsers (Name, Username, Password, RecipientID) VALUES (?, ?, ?, ?)";
    await db.query(sql, [name, username, hashedPassword, recipientId]);

    res
      .status(201)
      .json({ message: "Recipient user account created successfully." });
  } catch (error) {
    console.error("Recipient user registration error:", error);
    res
      .status(500)
      .json({ message: "Failed to create recipient user account." });
  }
});

// In src/routes/auth.js

// Replace your existing '/register' route with this one
router.post("/register", isAdmin, async (req, res) => {
  const { name, username, password, role } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if username already exists
    const [existingUsers] = await db.query(
      "SELECT Username FROM Staff WHERE Username = ?",
      [username]
    );
    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ message: "Username already exists. Please choose another." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // This is the corrected SQL query
    const sql =
      "INSERT INTO Staff (Name, Username, Password, Role) VALUES (?, ?, ?, ?)";
    await db.query(sql, [name, username, hashedPassword, role]);

    res.status(201).json({ message: "Staff member registered successfully." });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({
        message: "Failed to register staff member due to a server error.",
      });
  }
});

module.exports = router;
