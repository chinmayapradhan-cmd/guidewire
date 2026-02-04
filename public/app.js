// App State
let currentProcessId = null;

// DOM Elements
const processTableBody = document.querySelector('#process-table tbody');
const historyTableBody = document.querySelector('#history-table tbody');
const bottomPanel = document.getElementById('bottom-panel');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameDisplay = document.getElementById('username-display');
const tabBtns = document.querySelectorAll('.panel-tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProcesses();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', () => loadProcesses(searchInput.value));

    searchInput.addEventListener('input', debounce(() => {
        loadProcesses(searchInput.value);
    }, 300));

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.panel-tab-pane').forEach(p => p.style.display = 'none');

            // Activate clicked
            btn.classList.add('active');
            const targetId = btn.dataset.tab;
            document.getElementById(targetId).style.display = 'block';
        });
    });
}

// Authentication Check
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        if (res.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        const data = await res.json();
        usernameDisplay.textContent = `User: ${data.username}`;
    } catch (err) {
        console.error("Auth check failed", err);
    }
}

// Data Fetching
async function loadProcesses(query = '') {
    try {
        const url = query ? `/api/processes?q=${encodeURIComponent(query)}` : '/api/processes';
        const res = await fetch(url);
        if (res.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        const processes = await res.json();
        renderProcesses(processes);
    } catch (err) {
        console.error("Failed to load processes", err);
    }
}

async function loadHistory(processId) {
    try {
        const res = await fetch(`/api/processes/${processId}/runs`);
        if (res.status === 401) return window.location.href = '/login.html';
        const runs = await res.json();
        renderHistory(runs);
    } catch (err) {
        console.error("Failed to load history", err);
    }
}

// Rendering
function renderProcesses(processes) {
    processTableBody.innerHTML = '';
    processes.forEach(proc => {
        const tr = document.createElement('tr');
        if (currentProcessId === proc.id) tr.classList.add('selected');
        tr.dataset.id = proc.id;

        // Exact button layout
        const actionButtons = `
            <div class="btn-group">
                <button class="btn-action btn-run">Run</button>
                <button class="btn-action btn-stop" disabled>Stop</button>
                <button class="btn-action btn-history">Download History</button>
            </div>
        `;

        const scheduleButtons = `
            <div class="btn-group">
                <button class="btn-action btn-run" ${proc.schedule !== 'Enabled' ? 'disabled style="background:#f0f0f0; color:#aaa; border:1px solid #ccc"' : ''}>Stop</button>
                <button class="btn-action btn-stop" ${proc.schedule === 'Disabled' ? 'disabled' : ''}>Start</button>
            </div>
        `;
        // Correction: In screenshot "Stop" is blue (active) for Enabled items. "Start" is gray.
        // If disabled, Start should probably be blue? But let's stick to the visual provided.
        // It seems "Stop" button STOPS the scheduler, so if it is Enabled, Stop is the primary action.

        tr.innerHTML = `
            <td>${proc.name}</td>
            <td>${proc.description || ''}</td>
            <td style="width: 180px;">${actionButtons}</td>
            <td>${formatDateDateOnly(proc.last_run_at)}<br><span style="color:#666">${formatTimeOnly(proc.last_run_at)}</span></td>
            <td>${renderStatus(proc.last_run_status)}</td>
            <td>${formatDateDateOnly(proc.next_scheduled_run)} ${formatTimeOnly(proc.next_scheduled_run)}</td>
            <td style="width: 90px;">${scheduleButtons}</td>
            <td>${proc.cron_expr || ''}</td>
        `;

        tr.addEventListener('click', (e) => {
            // Prevent if button clicked
            if (e.target.tagName === 'BUTTON') return;

            document.querySelectorAll('#process-table tr').forEach(r => r.classList.remove('selected'));
            tr.classList.add('selected');

            currentProcessId = proc.id;
            bottomPanel.classList.add('open');
            loadHistory(proc.id);
        });

        processTableBody.appendChild(tr);
    });
}

function renderHistory(runs) {
    historyTableBody.innerHTML = '';
    if (runs.length === 0) {
        historyTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem;">No history found.</td></tr>';
        return;
    }

    runs.forEach(run => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(run.start_requested)}</td>
            <td>${formatDate(run.started)}</td>
            <td>${formatDate(run.completed)}</td>
            <td>${run.scheduled ? 'Yes' : 'No'}</td>
            <td>${run.server || ''}</td>
            <td>${run.description || ''}</td>
            <td>${run.ops}</td>
            <td>${run.failed}</td>
            <td>${run.failure_reason || ''}</td>
        `;
        historyTableBody.appendChild(tr);
    });
}

function renderStatus(status) {
    if (!status || status === 'Not available') return '<span class="status-muted">Not available</span>';
    if (status === 'Completed') return '<span class="status-completed">Completed</span>';
    if (status === 'Failed') return '<span class="status-failed">Failed</span>';
    if (status.includes('Executing')) return '<span class="status-executing">' + status + '</span>';
    return `<span class="status-muted">${status}</span>`;
}

// Helpers
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateDateOnly(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function formatTimeOnly(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
