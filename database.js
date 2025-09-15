const sqlite3 = require('sqlite3').verbose();

// Connect to the local SQLite database file
const db = new sqlite3.Database('./collegehub.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the local SQLite database.');
});

// Run all table creation commands in order
db.serialize(() => {
    
    // 1. Create the 'users' table with the 'role' column
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usn TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student'
    )`, (err) => {
        if (err) return console.error('Error creating users table:', err.message);
        console.log('Table "users" is ready.');
    });

    // 2. Create the 'notes' table with the 'branch' column
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
        console.log('Table "notes" is ready.');
    });

    // 3. Create the 'reviews' table
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
        console.log('Table "reviews" is ready.');

        // 4. Close the connection only after the last table is created
        db.close((err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log('Database setup complete. Connection closed.');
        });
    });

});