const bcrypt = require("bcryptjs");
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

// Handle the contact form submission endpoint securely (index.html -> contact.js -> server.js)
app.post("/api/contact", (req, res) => {
  // Destructuring fields sent by transmit.js (mapping match to your html input names)
  const { name, email, phone, message } = req.body;

  // Server log alert
  console.log(
    `\n[ALERT] Incoming transmission intercepted! (contact form) Routing to database...`,
  );

  // SQL statement using parameterized inputs (?) to prevent SQL Injection attacks
  const query = `
        INSERT INTO submissions (operator_name, operator_email, operator_phone_number, message)
        VALUES (?, ?, ?, ?)
    `;

  db.run(query, [name, email, phone, message], (err) => {
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

// Handle the signup form submission enpoint securely (signup.html -> signup.js -> server.js)
app.post("/api/auth/signup", async (req, res) => {
  // async keyword tells Nodejs to keep handling traffic and run this process in the background
  // Destructing fields sent by signup.js (mapping to match html input field names)
  const { email, password } = req.body;

  // server log alert
  console.log(
    `\n[ALERT] Incoming transmission intercepted! (signup) Routing to database...`,
  );

  // Basic input validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ status: "error", message: "Missing email or password" }); // ensures that the user actually inputs an email and password
  }
  if (password.length < 12) {
    return res
      .status(400)
      .json({
        status: "error",
        message:
          "Password does not meet complexity requirements. (at least 12 characters)",
      }); // ensures the password is at least 12 chars long
  }

  try {
    // we 'await' the hashing process so plain-text password is encrypted so it can be stored securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // SQL statement using parameterized inputs to prevent SQL injection
    // Note: we are mapping the 'email' vaariable to the username column in the users table
    const query = `
          INSERT INTO users (username, password_hash)
          VALUES (?, ?)
    `;

    db.run(query, [email, passwordHash], function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({
            status: "error",
            message:
              "This email is already associated with an existing acoount.",
          });
        }

        console.error(
          "[-] DATABASE ERROR: Failed to create user account",
          err.message,
        );
        return res.status(500).json({
          status: "error",
          message: "Internal data pipline failure. Transmission dropped.",
        });
      }

      console.log("[+] SUCCESS: New user account successfully created!");

      // send a secure response back to the client browser
      res.status(201).json({
        status: "success",
        message: "New user account successfully created!",
      });
    });
  } catch (error) {
    console.error("[-] Hashing fault:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server encryption error." });
  }
});

// Handle the login form submission endpoint securely (login.html -> login.js -> server.js)

// Start the server engine
app.listen(PORT, () => {
  console.log(
    `[SYSTEM] Hacker's Hangout backend online and listening on port ${PORT}`,
  );
});
