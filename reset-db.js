const { db, initDatabase } = require('./database');
const { dbPath } = require('./database');

console.log('--- Database Reset Utility ---');
console.log(`Target Database: ${dbPath}`);

db.serialize(() => {
    console.log('Dropping existing tables...');
    db.run("DROP TABLE IF EXISTS batch_runs");
    db.run("DROP TABLE IF EXISTS batch_processes");
    db.run("DROP TABLE IF EXISTS users");

    console.log('Tables dropped. Re-initializing...');
    // initDatabase will create tables and seed data
    initDatabase();
});

// Monitoring completion
// Since sqlite3 operations are async but serialized, we can wait a bit or just rely on console logs from initDatabase
setTimeout(() => {
    console.log('Database reset process initiated.');
}, 1000);
