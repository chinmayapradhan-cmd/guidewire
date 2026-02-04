# System Startup Guide

Follow these steps to set up and start the Batch Process Info Viewer system from anywhere.

## Prerequisites
- **Node.js**: Ensure Node.js is installed on your machine. (Download from [nodejs.org](https://nodejs.org/)).

## Step-by-Step Instructions

### 1. Open the Project
Navigate to the project directory containing these files.
```bash
cd "path/to/project_folder"
```

### 2. Install Dependencies
If this is the first time running the system, install the required packages:

```bash
npm install
```

### 3. Initialize/Reset Data
This system uses a local SQLite database (`database.sqlite`).
To initialize it with fresh data from `seed/seed-data.json`:

1.  Stop the server if it is running.
2.  Run the reset command:
    ```bash
    npm run reset
    ```

### 4. Start the Server
Run the following command to start the backend server:

```bash
npm start
```
You should see output similar to:
> Server running on http://localhost:3000

### 5. Access the Application
Open your web browser and go to:
[http://localhost:3000](http://localhost:3000)

### 6. Login
Use the default administrator credentials:
- **Username**: `admin`
- **Password**: `admin123`

## Troubleshooting
- **Port In Use**: If it says "Address already in use", check if another instance is running.
- **Database Locked**: If you cannot reset the DB, ensure the server is stopped (Ctrl+C).
