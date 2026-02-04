# API Documentation

This guide details how an external system can interact with the Batch Process Info Viewer API.

## Authentication Flow

All API endpoints are protected and require a valid session. You must first log in and store the returned session cookie for subsequent requests.

### 1. Login
**Endpoint**: `POST /api/auth/login`

**Request Body** (JSON):
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response**:
- **200 OK**: Login successful.
- **401 Unauthorized**: Invalid credentials.

**Important**: The response will include a `Set-Cookie` header containing the session ID (e.g., `connect.sid`). You **must** include this cookie in the `Cookie` header of all subsequent requests.

---

## Retrieving Batch Process Info

### 2. Fetch Process Details (Search by Name)
To find a specific process (e.g., to check its "Last Run" status), use the search endpoint.

**Endpoint**: `GET /api/processes?q={ProcessName}`

**Headers**:
- `Cookie`: `connect.sid=...` (from login)

**Example Request**:
`GET /api/processes?q=Account%20Workflow%20Evaluation`

**Response Example**:
```json
[
  {
    "id": 1,
    "name": "Account Workflow Evaluation",
    "description": "Evaluates accounts and closes them.",
    "last_run_at": "2026-02-02 10:12:00",
    "last_run_status": "Completed",
    "next_scheduled_run": "2026-02-03 02:00:00",
    "schedule": "Enabled",
    "cron_expr": "0 2 * * *"
  }
]
```

**Key Fields for External Systems**:
- `id`: Unique identifier (Required for fetching history).
- `last_run_at`: Timestamp of the last execution.
- `last_run_status`: Status string (e.g., "Completed", "Failed", "Executing").

---

## Retrieving History

### 3. Fetch Execution History
Once you have the `id` from the previous step, you can fetch the full run history.

**Endpoint**: `GET /api/processes/{id}/runs`

**Headers**:
- `Cookie`: `connect.sid=...` (from login)

**Example Request**:
`GET /api/processes/1/runs`

**Response Example** (Array of runs, sorted by start time descending):
```json
[
  {
    "id": 101,
    "process_id": 1,
    "start_requested": "2026-02-02 10:10:00",
    "started": "2026-02-02 10:12:00",
    "completed": "2026-02-02 10:15:30",
    "scheduled": 1,
    "server": "proc00",
    "description": "Evaluates accounts",
    "ops": 81,
    "failed": 0,
    "failure_reason": null
  },
  ...
]
```

**Key Fields**:
- `ops`: Operational count/metric for that run.
- `started` / `completed`: Execution timestamps.
- `failed`: `0` for success, `1` for failure.
- `failure_reason`: Error message if failed.

---

## Integration Workflow Example

1.  **POST** `/api/auth/login`
    - Save the `connect.sid` cookie.
2.  **GET** `/api/processes?q=MyBatchProcess`
    - Parse the JSON response.
    - Check `last_run_status` to see if it failed recently.
    - Extract the `id` (e.g., `5`).
3.  **GET** `/api/processes/5/runs`
    - Iterate through the array to analyze specific past runs, check `ops` counts, or identical failure patterns.
