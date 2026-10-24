// =================================================================
// --- IMPORTS ---
// =================================================================
require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
// const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const cloudinary = require('./cloudinary');

// =================================================================
// --- APP CONFIGURATION & MIDDLEWARE ---
// =================================================================
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const saltRounds = 10;
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { 
        secure: 'auto',
        httpOnly: true,
        sameSite: 'lax'
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const frontendDist = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
} else {
    app.use(express.static(path.join(__dirname)));
}

// =================================================================
// --- DATABASE CONNECTION & MIDDLEWARE ---
// =================================================================
const sqlite3 = require('sqlite3').verbose();

const sqliteDb = new sqlite3.Database('./collegehub.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("SQLite Connection Error:", err.message);
    } else {
        console.log('Connected to the local SQLite database. 🗄️');
    }
});

const db = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            // Convert PostgreSQL parameters ($1, $2, etc.) to SQLite parameters (?)
            let sqliteSql = sql.replace(/\$[0-9]+/g, '?');
            // Convert ILIKE to LIKE for SQLite
            sqliteSql = sqliteSql.replace(/ILIKE/g, 'LIKE');

            if (sqliteSql.trim().toUpperCase().startsWith('SELECT') || sqliteSql.includes('RETURNING')) {
                sqliteDb.all(sqliteSql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows });
                });
            } else {
                sqliteDb.run(sqliteSql, params, function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            err.code = '23505'; // Mock PG's unique constraint error code
                        }
                        reject(err);
                    } else {
                        resolve({ rows: [], rowCount: this.changes });
                    }
                });
            }
        });
    }
};

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

// --- USER PROFILE API ROUTES ---
app.get('/api/user/notes', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const sql = `
            SELECT n.*, 
                   (SELECT AVG(rating) FROM reviews r WHERE r.note_id = n.id) as avg_rating,
                   (SELECT COUNT(*) FROM reviews r WHERE r.note_id = n.id) as review_count
            FROM notes n 
            WHERE n.uploader_id = $1 
            ORDER BY n.id DESC
        `;
        const { rows } = await db.query(sql, [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/user/notes/:id', checkAuthenticated, async (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.session.user.id;
        
        // Ensure the note belongs to this user
        const { rows } = await db.query(`SELECT id FROM notes WHERE id = $1 AND uploader_id = $2`, [noteId, userId]);
        if (rows.length === 0) {
            return res.status(403).json({ error: 'You do not have permission to delete this note.' });
        }

        await db.query(`DELETE FROM reviews WHERE note_id = $1`, [noteId]);
        await db.query(`DELETE FROM notes WHERE id = $1`, [noteId]);
        res.json({ success: true, message: 'Note deleted successfully.' });
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
            req.session.save((err) => {
                if (err) {
                    console.error("Session save error:", err);
                    return res.status(500).send('Session error during login.');
                }
                if (req.headers.accept?.includes('application/json')) {
                    return res.json({ success: true, redirect: '/notes' });
                }
                res.redirect('/notes.html');
            });
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



app.post('/upload', upload.single('noteFile'), async (req, res) => {
    try {
        const title = req.body.title;
        const subject = req.body.subject;
        const branch = req.body.branch;
        const uploaderId = req.session.user ? req.session.user.id : null;

        // The file is already saved locally by multer.
        // Let's use the local URL instead of Cloudinary to avoid 401 permissions errors.
        const fileUrl = '/uploads/' + req.file.filename; 
        const filename = req.file.originalname;

        // INSERT INTO Database
        await db.query(
            `INSERT INTO notes (title, subject, branch, filename, filepath, uploader_id, approved) VALUES ($1, $2, $3, $4, $5, $6, false)`,
            [title, subject, branch, filename, fileUrl, uploaderId]
        );

        res.redirect('/notes.html');

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).send("File Upload Failed");
    }
});


// --- PAGE SERVING ROUTES ---
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            return res.sendFile(path.join(frontendDist, 'index.html'));
        }
        next();
    });
} else {
    app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
    app.get('/notes.html', checkAuthenticated, (req, res) => { res.sendFile(path.join(__dirname, 'notes.html')); });
    app.get('/upload.html', checkAuthenticated, (req, res) => { res.sendFile(path.join(__dirname, 'upload.html')); });
    app.get('/note-detail.html', checkAuthenticated, (req, res) => { res.sendFile(path.join(__dirname, 'note-detail.html')); });
    app.get('/admin', checkAdmin, (req, res) => { res.sendFile(path.join(__dirname, 'admin.html')); });
    app.get('/feedback.html', (req, res) => { res.sendFile(path.join(__dirname, 'feedback.html')); });
    app.get('/profile.html', checkAuthenticated, (req, res) => { res.sendFile(path.join(__dirname, 'profile.html')); });
}

// =================================================================
// --- START SERVER ---
// =================================================================
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

