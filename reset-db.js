const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

console.log('--- Database Reset Utility ---');

// 1. Delete existing database file
if (fs.existsSync(dbPath)) {
    try {
        fs.unlinkSync(dbPath);
        console.log('Existing database deleted.');
    } catch (e) {
        console.error('ERROR: Could not delete database file.');
        console.error('Make sure the server is STOPPED before running this script.');
        console.error(e.message);
        process.exit(1);
    }
} else {
    console.log('No existing database found.');
}

// 2. Import database.js to trigger initialization
// Note: database.js initializes the DB connection at the top level, which creates the file.
// Then we call initDatabase() to create tables and seed.
try {
    const { initDatabase } = require('./database');

    console.log('Initializing new database...');
    initDatabase();

    // Give it a moment to complete async operations (SQLite serialize ensures order, but node process might exit)
    setTimeout(() => {
        console.log('Database reset and seeded successfully.');
        console.log('You can now start the server with: npm start');
    }, 1000);

} catch (e) {
    console.error('Failed to initialize database:', e);
}
