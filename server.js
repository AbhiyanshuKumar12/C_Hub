// =================================================================
// --- IMPORTS ---
// =================================================================
require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// =================================================================
// --- APP CONFIGURATION & MIDDLEWARE ---
// =================================================================
const app = express();
const PORT = process.env.PORT || 3000;
const saltRounds = 10;
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

app.use(session({
    secret: 'a-very-secret-key-that-you-should-change',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// =================================================================
// --- DATABASE CONNECTION & MIDDLEWARE ---
// =================================================================
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
console.log('Connected to the PostgreSQL database. 🐘');

const checkAuthenticated = (req, res, next) => {
    if (req.session.user) { return next(); }
    res.redirect('/login.html');
};
const checkAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') { return next(); }
    return res.status(403).send('Forbidden: You do not have permission to access this page.');
};

// =================================================================
// --- ROUTES START HERE ---
// =================================================================

// --- API ROUTES ---
app.get('/api/user-status', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, name: req.session.user.name, role: req.session.user.role });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/notes', checkAuthenticated, async (req, res) => {
    const searchTerm = req.query.q || '';
    let sql, values;
    if (searchTerm) {
        sql = `SELECT * FROM notes WHERE approved = true AND (title ILIKE $1 OR subject ILIKE $1)`;
        values = [`%${searchTerm}%`];
    } else {
        sql = `SELECT * FROM notes WHERE approved = true`;
        values = [];
    }
    try {
        const { rows } = await db.query(sql, values);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/notes/:id', checkAuthenticated, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM notes WHERE id = $1 AND approved = true`, [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/notes/:id/reviews', checkAuthenticated, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM reviews WHERE note_id = $1 ORDER BY created_at DESC`, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/notes/:id/reviews', checkAuthenticated, async (req, res) => {
    const { rating, comment } = req.body;
    const { id: userId, name: userName } = req.session.user;
    try {
        const { rows } = await db.query(`INSERT INTO reviews (note_id, user_id, user_name, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [req.params.id, userId, userName, rating, comment]);
        res.json({ message: 'Review added successfully!', reviewId: rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/feedback', async (req, res) => {
    const { message } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    const userName = req.session.user ? req.session.user.name : 'Anonymous';
    try {
        await db.query(`INSERT INTO feedback (user_id, user_name, message) VALUES ($1, $2, $3)`, [userId, userName, message]);
        res.json({ success: true, message: 'Feedback submitted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN API ROUTES ---
app.get('/api/admin/users', checkAdmin, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT id, name, usn, role FROM users`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/notes', checkAdmin, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM notes ORDER BY approved ASC, id DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/feedback', checkAdmin, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM feedback ORDER BY submitted_at DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/notes/:id/approve', checkAdmin, async (req, res) => {
    try {
        await db.query(`UPDATE notes SET approved = true WHERE id = $1`, [req.params.id]);
        res.json({ success: true, message: 'Note approved.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/notes/:id', checkAdmin, async (req, res) => {
    const noteId = req.params.id;
    try {
        await db.query(`DELETE FROM reviews WHERE note_id = $1`, [noteId]);
        await db.query(`DELETE FROM notes WHERE id = $1`, [noteId]);
        res.json({ success: true, message: 'Note and associated reviews deleted.' });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- AUTHENTICATION & UPLOAD ROUTES ---
app.post('/register', async (req, res) => {
    const { name, usn, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        await db.query(`INSERT INTO users (name, usn, password) VALUES ($1, $2, $3)`, [name, usn.toLowerCase(), hash]);
        res.send('Registration successful! Please <a href="/login.html">login</a>.');
    } catch (err) {
        if (err.code === '23505') { return res.send('Error: This USN is already registered.'); }
        console.error("Registration Error:", err.message);
        res.status(500).send('Server error during registration.');
    }
});

app.post('/login', async (req, res) => {
    const { usn, password } = req.body;
    try {
        const { rows } = await db.query(`SELECT * FROM users WHERE usn = $1`, [usn.toLowerCase()]);
        const user = rows[0];
        if (!user) return res.status(401).send('Login failed: User not found.');

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { id: user.id, name: user.name, usn: user.usn, role: user.role };
            res.redirect('/notes.html');
        } else {
            res.status(401).send('Login failed: Incorrect password.');
        }
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).send('Server error during login.');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/');
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.post('/upload', checkAuthenticated, upload.single('noteFile'), async (req, res) => {
    if (!req.file) { return res.status(400).send('No file was uploaded.'); }
    const { title, subject, branch, professor_name } = req.body;
    const uploader_id = req.session.user.id;
    const tempFilePath = req.file.path;
    try {
        let resourceType = 'raw';
        if (req.file.mimetype.startsWith('image/')) { resourceType = 'image'; }
        const result = await cloudinary.uploader.upload(tempFilePath, { resource_type: resourceType, folder: 'collegehub_notes' });
        const { original_filename: filename, secure_url: filepath } = result;
        const sql = `INSERT INTO notes (title, subject, branch, professor_name, filename, filepath, uploader_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
        const values = [title, subject, branch, professor_name, filename, filepath, uploader_id];
        await db.query(sql, values);
        res.send(`<div style="font-family: sans-serif; text-align: center; padding-top: 50px;"><h1>Thank You!</h1><p>Your note has been submitted for admin approval.</p><a href="/notes.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Back to Notes</a></div>`);
    } catch (error) {
        console.error('Upload Process Failed:', error);
        res.status(500).send('An error occurred during the upload process. Please try again.');
    } finally {
        if (fs.existsSync(tempFilePath)) { fs.unlinkSync(tempFilePath); }
    }
});

// --- PAGE SERVING ROUTES ---
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/notes.html', checkAuthenticated, (req, res) => { res.sendFile(path.join(__dirname, 'notes.html')); });
app.get('/upload.html', checkAuthenticated, (req, res) => { res.sendFile(path.join(__dirname, 'upload.html')); });
app.get('/note-detail.html', checkAuthenticated, (req, res) => { res.sendFile(path.join(__dirname, 'note-detail.html')); });
app.get('/admin', checkAdmin, (req, res) => { res.sendFile(path.join(__dirname, 'admin.html')); });
app.get('/feedback.html', (req, res) => { res.sendFile(path.join(__dirname, 'feedback.html')); });

// =================================================================
// --- START SERVER ---
// =================================================================
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

