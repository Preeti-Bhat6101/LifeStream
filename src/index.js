require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./config/db");
const { isAuthenticated } = require("./middleware/authMiddleware");

// --- Import All API Routers ---
const authRoutes = require("./routes/auth");
const bloodGroupRoutes = require("./routes/bloodGroups");
const donorRoutes = require("./routes/donors");
const stockRoutes = require("./routes/bloodStock");
const recipientRoutes = require("./routes/recipients");
const requestRoutes = require("./routes/bloodRequests");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Core Middleware ---
// To parse JSON request bodies
app.use(express.json());

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// --- Frontend Serving ---

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "home.html"));
});

app.get("/index.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use(express.static(path.join(__dirname, "..", "public")));

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/blood-groups", bloodGroupRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/users", userRoutes);

// --- Start Server ---
async function startServer() {
  try {
    const connection = await db.getConnection();
    console.log("Successfully connected to the database.");
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
}

startServer();
