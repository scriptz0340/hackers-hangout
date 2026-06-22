const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Locate or create database filein the project root dir
const dbPath = path.resolve(__dirname, 'database.db');

// Initialize connection to database
const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
                console.error('[-] CRITICAL: Failed to establish database connection:', err.message);
        } else {
                console.log('[+] DATABASE: Secure connection node initialized at: ' + dbPath);
                initializeTables()
        }
});

// Function to create tables to implement my architexcture for web app
function initializeTables() {
        db.serialize(() => {
                // 1. Operator Accounts Tables
                db.run(`
                CREATE TABLE IF NOT EXISTS users (
                        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT NOT NULL UNIQUE,
                        password_hash TEXT NOT NULL,
                        role TEXT DEFAULT 'operator',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                `, (err) => { if (err) console.error('[-] Error creating users table:', err.message); });

                // 2. Form Submissions table ("Contact a Hacker" entries)
                db.run(`
                  CREATE TABLE IF NOT EXISTS submissions (
                        submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        operator_name TEXT NOT NULL,
                        operator_email TEXT NOT NULL,
                        operator_phone_number TEXT NOT NULL,
                        message TEXT NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                  )
                  `, (err) => { if (err) console.error('[-] Error creating submissions table:', err.message); });
                  
                  // 3. Community and blog posts table
                  db.run(`
                    CREATE TABLE IF NOT EXISTS posts (
                        post_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        author_id INTEGER NOT NULL,
                        title TEXT NOT NULL, 
                        content TEXT NOT NULL, 
                        type TEXT DEFAULT 'feed', -- 'feed' for community, 'blog' for official company updates
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(author_id) REFERENCES users(user_id)
                    )
                    `, (err) => {if (err) console.error('[-] Error creating posts table:', err.message); });

                    // 4. Private user-to-user messages table
                    db.run(`
                      CREATE TABLE IF NOT EXISTS messages (
                        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        sender_id INTEGER NOT NULL,
                        receiver_id INTEGER NOT NULL,
                        message_text TEXT NOT NULL,
                        is_read INTEGER DEFAULT 0, -- 0 for unread, 1 for read
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(sender_id) REFERENCES users(user_id),
                        FOREIGN KEY(receiver_id) REFERENCES users(user_id)
                      )
                      `, (err) => {if (err) console.error('[-] Error creating messages table', err.message); });

                      console.log('[+] DATABASE: All architecture tables verified/created successfully!');
                    });
}          

module.exports = db;
