const express = require("express");
const path = require("path");
const db = require("./config/db");

const bloodGroupRoutes = require("./routes/bloodGroups");

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/api/blood-groups", bloodGroupRoutes);

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
