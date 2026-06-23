const express = require("express");
const path = require("path");
const db = require("./database"); // Imported your SQLite connection node
const app = express();
const PORT = 3000;

// Middleware to parse incoming form data and json payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SECURITY BOUNDARY: Lock static access exclusively to the public folder
// This prevents visitors from downloading server.js, database.js, or database.db
app.use(express.static(path.join(__dirname, "public")));

// Handle the contact form submission endpoint securely
app.post("/api/transmit", (req, res) => {
  // Destructuring fields sent by transmit.js (mapping match to your html input names)
  const { name, email, phone, message } = req.body;

  // Server log alert
  console.log(
    `\n[ALERT] Incoming transmission intercepted! Routing to database...`,
  );

  // SQL statement using parameterized inputs (?) to prevent SQL Injection attacks
  const query = `
        INSERT INTO submissions (operator_name, operator_email, operator_phone_number, message)
        VALUES (?, ?, ?, ?)
    `;

  db.run(query, [name, email, phone || "NOT PROVIDED", message], (err) => {
    if (err) {
      console.error(
        "[-] DATABASE ERROR: Failed to log submission:",
        err.message,
      );
      return res.status(500).json({
        status: "error",
        message: "Internal data pipeline failure. Transmission dropped.",
      });
    }

    console.log(
      `[+] SUCCESS: Transmission permanently logged in submissions table.`,
    );

    // Send a secure response back to the client browser
    res.status(200).json({
      status: "success",
      message: "Transmission encrypted and routed safely into the vault.",
    });
  });
});

// Start the server engine
app.listen(PORT, () => {
  console.log(
    `[SYSTEM] Hacker's Hangout backend online and listening on port ${PORT}`,
  );
});
