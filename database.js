const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Batch Processes Table
        db.run(`CREATE TABLE IF NOT EXISTS batch_processes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            description TEXT,
            last_run_at DATETIME,
            last_run_status TEXT,
            next_scheduled_run DATETIME,
            schedule TEXT,
            cron_expr TEXT
        )`);

        // Batch Runs Table
        db.run(`CREATE TABLE IF NOT EXISTS batch_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            process_id INTEGER,
            start_requested DATETIME,
            started DATETIME,
            completed DATETIME,
            scheduled INTEGER,
            server TEXT,
            description TEXT,
            ops INTEGER,
            failed INTEGER,
            failure_reason TEXT,
            FOREIGN KEY (process_id) REFERENCES batch_processes(id)
        )`);

        // Seed Data if Users table is empty
        db.get("SELECT count(*) as count FROM users", [], (err, row) => {
            if (err) return console.error(err.message);
            if (row.count === 0) {
                console.log("Seeding database...");
                seedData();
            } else {
                console.log("Database already seeded.");
            }
        });
    });
}

function seedData() {
    // Seed Admin User
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`, ['admin', passwordHash]);

    // Read seed file
    try {
        const seedPath = path.join(__dirname, 'seed', 'seed-data.json');
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

        db.serialize(() => {
            const insertProcess = db.prepare(`INSERT INTO batch_processes (name, description, last_run_at, last_run_status, next_scheduled_run, schedule, cron_expr) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            const insertRun = db.prepare(`INSERT INTO batch_runs (process_id, start_requested, started, completed, scheduled, server, description, ops, failed, failure_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            seedData.processes.forEach(proc => {
                insertProcess.run([
                    proc.name,
                    proc.description,
                    proc.last_run_at,
                    proc.last_run_status,
                    proc.next_scheduled_run,
                    proc.schedule,
                    proc.cron_expr
                ], function (err) {
                    if (err) {
                        console.error("Error inserting process " + proc.name + ": " + err.message);
                        return;
                    }
                    const processId = this.lastID;
                    const runs = seedData.runs.filter(r => r.process_name === proc.name);

                    runs.forEach(run => {
                        insertRun.run([
                            processId,
                            run.start_requested,
                            run.started,
                            run.completed,
                            run.scheduled,
                            run.server,
                            run.description,
                            run.ops,
                            run.failed,
                            run.failure_reason
                        ]);
                    });
                });
            });

            // We cannot finalize immediately due to async nature of callbacks inside the loop.
            // For a simple seed script, relying on process exit or garbage collection is acceptable,
            // OR we can wrap in promises.
            // Given the original error was premature finalization, effectively removing the explicit finalize call 
            // is the safest fix for this specific sync/async mix without rewriting into Promises.
            // The statements will ensure they execute. 

            // To be cleaner, we can just execute raw SQL inserts or use `db.run` directly which manages its own statement lifecycle.
        });

    } catch (error) {
        console.error("Error reading seed data:", error);
    }
}

module.exports = {
    db,
    initDatabase
};
