const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
initDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'supersecretkey_change_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    // If API request, return 401
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Otherwise redirect to login
    res.redirect('/login.html');
};

// API Routes

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        if (bcrypt.compareSync(password, user.password_hash)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            return res.json({ message: "Login successful" });
        } else {
            return res.status(401).json({ error: "Invalid credentials" });
        }
    });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.json({ message: "Logged out" });
    });
});

// Get Current User
app.get('/api/auth/me', (req, res) => {
    if (req.session.userId) {
        res.json({ username: req.session.username });
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
