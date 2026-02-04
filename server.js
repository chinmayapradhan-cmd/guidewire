const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

// Initialize Database
initDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Authentication Middleware
// Authentication Middleware
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        return res.redirect('/login.html');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        return next();
    } catch (err) {
        // Invalid token
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        return res.redirect('/login.html');
    }
};

// API Routes

// Login
// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        if (bcrypt.compareSync(password, user.password_hash)) {
            // Generate JWT
            const token = jwt.sign({
                userId: user.id,
                username: user.username
            }, JWT_SECRET, { expiresIn: '24h' });

            // Set Cookie
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                // secure: process.env.NODE_ENV === 'production' // Uncomment if HTTPS (Vercel is HTTPS)
            });

            return res.json({ message: "Login successful" });
        } else {
            return res.status(401).json({ error: "Invalid credentials" });
        }
    });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out" });
});

// Get Current User
app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return res.status(401).json({ error: "Invalid token" });
            res.json({ username: decoded.username });
        });
    } else {
        res.status(401).json({ error: "Not logged in" });
    }
});

// Get Batch Processes
app.get('/api/processes', isAuthenticated, (req, res) => {
    const query = req.query.q;
    let sql = "SELECT * FROM batch_processes";
    let params = [];

    if (query) {
        sql += " WHERE name LIKE ? OR description LIKE ?";
        params.push(`%${query}%`, `%${query}%`);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Batch Process Runs (History)
app.get('/api/processes/:id/runs', isAuthenticated, (req, res) => {
    const processId = req.params.id;
    const sql = `SELECT * FROM batch_runs WHERE process_id = ? ORDER BY started DESC`;

    db.all(sql, [processId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Default Route
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all for other HTML pages that should be protected
app.get('*.html', (req, res, next) => {
    if (req.path === '/login.html') return next();
    isAuthenticated(req, res, next);
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
