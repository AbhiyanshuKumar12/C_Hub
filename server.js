// Import required modules
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');

// --- APP CONFIGURATION ---
const app = express();
const PORT = 3000;
const saltRounds = 10;

// --- MULTER SETUP (for file uploads) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- SESSION SETUP ---
app.use(session({
    secret: 'a-very-secret-key-that-you-should-change',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// --- DATABASE CONNECTION ---
const db = new sqlite3.Database('./collegehub.db', (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to the CollegeHub SQLite database. 🗃️');
});

// --- MIDDLEWARE ---
app.use(express.urlencoded({ extended: true })); // For traditional forms
app.use(express.json()); // Add this line to parse JSON from fetch requests
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- PROTECTION MIDDLEWARE (checks if user is logged in) ---
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login.html');
};

// =================================================================
// --- ROUTES ---
// =================================================================

// --- API ROUTES (for fetching data) ---
app.get('/api/user-status', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, name: req.session.user.name });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/notes', checkAuthenticated, (req, res) => {
    const sql = `SELECT * FROM notes`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/notes/:id', checkAuthenticated, (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM notes WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// --- AUTHENTICATION ROUTES (for login, register, logout) ---
app.post('/register', (req, res) => {
    const { name, usn, password } = req.body;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return console.error(err.message);
        const sql = `INSERT INTO users (name, usn, password) VALUES (?, ?, ?)`;
        db.run(sql, [name, usn.toLowerCase(), hash], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.send('Error: This USN is already registered.');
                }
                return console.error(err.message);
            }
            res.send('Registration successful! Please <a href="/login.html">login</a>.');
        });
    });
});

app.post('/login', (req, res) => {
    const { usn, password } = req.body;
    const sql = `SELECT * FROM users WHERE usn = ?`;
    db.get(sql, [usn.toLowerCase()], (err, user) => {
        if (err) return console.error(err.message);
        if (!user) return res.status(401).send('Login failed: User not found.');
        
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                req.session.user = { id: user.id, name: user.name, usn: user.usn };
                res.redirect('/notes.html');
            } else {
                res.status(401).send('Login failed: Incorrect password.');
            }
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/notes.html');
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});


// In server.js

// --- API ROUTES ---

// ... (existing API routes for user-status, notes, and notes/:id) ...

// ADD THESE TWO NEW ROUTES

// GET all reviews for a specific note
app.get('/api/notes/:id/reviews', checkAuthenticated, (req, res) => {
    const noteId = req.params.id;
    const sql = `SELECT * FROM reviews WHERE note_id = ? ORDER BY created_at DESC`;
    db.all(sql, [noteId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST a new review for a specific note
app.post('/api/notes/:id/reviews', checkAuthenticated, (req, res) => {
    const noteId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.session.user.id;
    const userName = req.session.user.name;

    const sql = `INSERT INTO reviews (note_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [noteId, userId, userName, rating, comment], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Review added successfully!', reviewId: this.lastID });
    });
});

// --- PAGE SERVING ROUTES ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/notes.html', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'notes.html'));
});

app.get('/upload.html', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});

app.get('/note-detail.html', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'note-detail.html'));
});

// --- UPLOAD ACTION ROUTE ---
app.post('/upload', checkAuthenticated, upload.single('noteFile'), (req, res) => {
    const { title, subject, branch } = req.body;
    const filename = req.file.filename;
    const filepath = req.file.path;
    const uploader_id = req.session.user.id;
    const sql = `INSERT INTO notes (title, subject, branch, filename, filepath, uploader_id) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [title, subject, branch, filename, filepath, uploader_id], (err) => {
        if (err) return console.error(err.message);
        console.log('A new note has been uploaded and saved to the database.');
        res.redirect('/notes.html');
    });
});




// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});