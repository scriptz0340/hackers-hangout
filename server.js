const bcrypt = require("bcryptjs");
const express = require("express");
const path = require("path");
const db = require("./database"); // Imported your SQLite connection node
const app = express();
const session = require('express-session');
const PORT = 3000;

// Middleware to parse incoming form data and json payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware to initialize session management 
app.use(session({
  // Crypto string generated with   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  command on server
  secret: "d8c80c03b019d6ccf590e8e04a178edc68b60b7a8f46b980e31226402f54988e8c7acf0f3446180867c79fca1689a97b23611cdfd5115dc55907a1648ec3f91f",

  // compliance and resource optimization
  resave: false,                         // Prevents resaving sessions that haven't modified any data
  saveUninitialized: false,              // Don't create a cookie/session until a user actually logs in
  
  //Cookie security parameters
  cookie: {
    httpOnly: true,                      // CRITICAL: Prevents frontend JavaScript/XSS attacks from reading the cookie
    secure: false,                       // Set to 'true' ONLY after you configure HTTPS/SSL on your Debian server
    maxAge: 1000 * 60 * 60 * 24          // Cookie lifespan: 24 hours (in milliseconds)
  }
}));

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

// setup the find user function for sqlite3
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
}

// Handle the login form submission endpoint securely (login.html -> login.js -> server.js)
app.post("/api/auth/login", async (req, res)  => {
  const { email, password} = req.body;

  console.log(`
    [ALERT] Incoming transmission intercepted! (login) routing to database...`,
  )

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Missing email or password."
    });
  }
  try {
    // look up user in DB
    const user = await findUserInDB(email)
    // generic error message to prevent user enumeration
    if (!user) {
      return res.status(401).json({ status: "error", message: "Invalid username or password."});
    }
    // compare incoming password with stored hash (bcrypt.compare handles timing attacks safely)
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ status: "error", message: "invalid username or password."});
    }

    // authentication successful establish session
    req.session.userId = user.id;
    req.session.email = user.username;

    console.log(`[+] SUCESS: Operator '${user.username}' successfully authenticated!`);

    //Send a success response to the browser (dont send the passw hash!)
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
    // dont leak specific error details to the client
    return res.status(500).json({ message: "An internal server error has occured."});
  }
});

// Start the server engine
app.listen(PORT, () => {
  console.log(
    `[SYSTEM] Hacker's Hangout backend online and listening on port ${PORT}`,
  );
});
