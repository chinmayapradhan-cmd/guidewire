# Batch Process Info Viewer

A static, read-only viewer for Batch Process Information, designed to mimic an enterprise admin console. Built with Node.js, Express, and SQLite.

## System Overview

This application provides a dashboard to view the status, schedule, and execution history of various batch processes. It is designed as a read-only tool for monitoring purposes.

### Key Features
- **Enterprise UI**: Dark sidebar, cyan headers, and tabbed interfaces matching enterprise standards.
- **Secure Authentication**: Session-based login (default: `admin` / `admin123`).
- **Dashboard**: Searchable process list with status badges.
- **Context Details**: Bottom panel with history view and pagination controls.
- **Data Persistence**: SQLite database with automatic seeding.

## Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: Plain HTML5, CSS3, Vanilla JavaScript
- **Auth**: express-session, bcryptjs

## API Endpoints

The backend provides the following REST API endpoints:

### Authentication
- **POST** `/api/auth/login` - Login with credentials.
- **POST** `/api/auth/logout` - Clear session.
- **GET** `/api/auth/me` - Get current user info.

### Data
- **GET** `/api/processes`
  - Query Param: `?q=searchterm` (optional)
  - Returns a list of all batch processes.
- **GET** `/api/processes/:id/runs`
  - Returns the execution history for a specific process ID.

## Project Structure
```
/
├── database.js         # SQLite connection & seeding logic
├── reset-db.js         # Database reset utility
├── package.json        # Dependencies & scripts
├── server.js           # Express server & API routes
├── seed/
│   └── seed-data.json  # Initial source data
└── public/
    ├── app.js          # Frontend controller
    ├── index.html      # Main dashboard
    ├── login.html      # Login page
    └── styles.css      # Styling
```

## Data Management

### Resetting Data
To reset the database and reload data from `seed/seed-data.json`:

```bash
npm run reset
```
*Note: This must be run when the server is stopped.*

## Setup & Running
See [startup.md](./startup.md) for detailed instructions.
