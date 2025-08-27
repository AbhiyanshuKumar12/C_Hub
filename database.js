const sqlite3 = require('sqlite3').verbose();

// Connect to the database
// --- DATABASE CONNECTION ---
const { Pool } = require('pg');
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
console.log('Connected to the PostgreSQL database. 🐘');

// Use serialize to run commands in order
db.serialize(() => {
    // 1. Create the users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usn TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL
    )`, (err) => {
        if (err) return console.error('Error creating users table:', err.message);
        console.log('Successfully created/verified the "users" table.');
    });

    // In database.js
db.serialize(() => {
    // ... (users and notes table creation is the same) ...

    // Add this new table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) return console.error('Error creating reviews table:', err.message);
        console.log('Successfully created/verified the "reviews" table.');
    });

    // ... (db.close() should be in the final callback)
});

    // 2. Create the notes table
    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        branch TEXT NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        uploader_id INTEGER,
        FOREIGN KEY (uploader_id) REFERENCES users (id)
    )`, (err) => {
        if (err) return console.error('Error creating notes table:', err.message);
        console.log('Successfully created/verified the "notes" table.');
        
        // 3. Close the database connection only after the last command is queued
        db.close((err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log('Closed the database connection.');
        });
    });
});