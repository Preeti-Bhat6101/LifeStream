const express = require("express");
const path = require("path");
const db = require("./config/db");
const session = require("express-session");

const authRoutes = require("./routes/auth");
const bloodGroupRoutes = require("./routes/bloodGroups");
const donorRoutes = require("./routes/donors");
const stockRoutes = require("./routes/bloodStock");
const recipientRoutes = require("./routes/recipients");
const requestRoutes = require("./routes/bloodRequests");

const app = express();
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Replace with a long, random string
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if you're using HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // Cookie expires in 1 day
    },
  })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "home.html"));
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/blood-groups", bloodGroupRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/requests", requestRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Get a connection from the pool to test
    const connection = await db.getConnection();
    console.log("Successfully connected to the database.");
    // Release the connection back to the pool
    connection.release();

    // Start the server only if the database connection is successful
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Exit the process with an error code
  }
}

startServer();
