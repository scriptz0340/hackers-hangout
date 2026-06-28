const bcrypt = require("bcryptjs");
const express = require("express");
const path = require("path");
const db = require("./database"); // Imported your SQLite connection node
const session = require('express-session');
const app = express();
const PORT = 3000;

// Middleware to parse incoming form data and json payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware to initialize session management 
app.use(session({
  // Crypto string generated with node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" command on server
  secret: "d8c80c03b019d6ccf590e8e04a178edc68b60b7a8f46b980e31226402f54988e8c7acf0f3446180867c79fca1689a97b23611cdfd5115dc55907a1648ec3f91f",

  // Compliance and resource optimization
  resave: false,                         // Prevents resaving sessions that haven't modified any data
  saveUninitialized: false,              // Don't create a cookie/session until a user actually logs in
  
  // Cookie security parameters
  cookie: {
    httpOnly: true,                      // CRITICAL: Prevents frontend JavaScript/XSS attacks from reading the cookie
    secure: false,                       // Set to 'true' ONLY after you configure HTTPS/SSL on your Debian server
    maxAge: 1000 * 60 * 60 * 24          // Cookie lifespan: 24 hours (in milliseconds)
  }
}));

// SECURITY BOUNDARY: Lock static access exclusively to the public folder
// This prevents visitors from downloading server.js, database.js, or database.db
app.use(express.static(path.join(__dirname, "public")));

// Setup the find user function for sqlite3
const findUserInDB = (email) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT id, username, password_hash FROM users WHERE username = ?`;
    db.get(query, [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row); // returns undefined if no user found, or the user object 
      }
    });
  }); 
};

/* ==========================================
   ROUTE HANDLERS
   ========================================== */

// Handle the contact form submission endpoint securely (index.html -> contact.js -> server.js)
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;

  console.log(`\n[ALERT] Incoming transmission intercepted! (contact form) Routing to database...`);

  // SQL statement using parameterized inputs (?) to prevent SQL Injection attacks
  const query = `
    INSERT INTO submissions (operator_name, operator_email, operator_phone_number, message)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [name, email, phone, message], (err) => {
    if (err) {
      console.error("[-] DATABASE ERROR: Failed to log submission:", err.message);
      return res.status(500).json({
        status: "error",
        message: "Internal data pipeline failure. Transmission dropped.",
      });
    }

    console.log(`[+] SUCCESS: Transmission permanently logged in submissions table.`);

    return res.status(200).json({
      status: "success",
      message: "Transmission encrypted and routed safely into the vault.",
    });
  });
});

// Handle the signup form submission endpoint securely (signup.html -> signup.js -> server.js)
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  console.log(`\n[ALERT] Incoming transmission intercepted! (signup) Routing to database...`);

  // Basic input validation
  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Missing email or password" });
  }
  
  if (password.length < 12) {
    return res.status(400).json({
      status: "error",
      message: "Password does not meet complexity requirements. (at least 12 characters)",
    });
  }

  try {
    // Encrypt plain-text password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // SQL statement using parameterized inputs to prevent SQL injection
    const query = `
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
    `;

    // Wrap db.run in a Promise to integrate natively with async/await try/catch
    await new Promise((resolve, reject) => {
      db.run(query, [email, passwordHash], function (err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    console.log("[+] SUCCESS: New user account successfully created!");

    return res.status(201).json({
      status: "success",
      message: "New user account successfully created!",
    });

  } catch (error) {
    if (error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({
        status: "error",
        message: "This email is already associated with an existing account.",
      });
    }

    console.error("[-] SERVER ERROR:", error.message || error);
    return res.status(500).json({ 
      status: "error", 
      message: "Internal data pipeline failure or encryption fault. Transmission dropped." 
    });
  }
});

// Handle the login form submission endpoint securely (login.html -> login.js -> server.js)
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  console.log(`\n[ALERT] Incoming transmission intercepted! (login) Routing to database...`);

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Missing email or password."
    });
  }

  try {
    // Look up user in DB
    const user = await findUserInDB(email);
    
    // Generic error message to prevent user enumeration
    if (!user) {
      return res.status(401).json({ status: "error", message: "Invalid username or password." });
    }

    // Compare incoming password with stored hash (bcrypt.compare handles timing attacks safely)
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ status: "error", message: "Invalid username or password." });
    }

    // Authentication successful, establish session variables
    req.session.userId = user.id;
    req.session.email = user.username;

    console.log(`[+] SUCCESS: Operator '${user.username}' successfully authenticated!`);

    return res.status(200).json({
      status: "success",
      message: "Access granted!",
      user: {
        id: user.id,
        email: user.username
      }
    });

  } catch (error) {
    console.error('[-] Login error:', error);
    return res.status(500).json({ 
      status: "error",
      message: "An internal server error has occurred."
    });
  }
});

/* ==========================================
   ENGINE START
   ========================================== */
app.listen(PORT, () => {
  console.log(`[SYSTEM] Hacker's Hangout backend online and listening on port ${PORT}`);
});