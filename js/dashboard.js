const EVENT_ID = 'gsoc-2024-10-31';
let currentRegistrations = [];
let currentUsers = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState((isAuthenticated, user) => {
    if (!isAuthenticated) {
      window.location.href = 'admin-login.html';
      return;
    }

    // Set admin name
    if (user) {
      const adminNameEl = document.getElementById('admin-name');
      if (adminNameEl) {
        adminNameEl.textContent = user.displayName || user.email;
      }
    }

    loadData();
    setupEventHandlers();
  });
});

// Setup event handlers
function setupEventHandlers() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', adminSignOut);
  }

  const exportCSVBtn = document.getElementById('export-csv');
  const exportJSONBtn = document.getElementById('export-json');
  const exportUsersCSVBtn = document.getElementById('export-users-csv');
  const exportUsersJSONBtn = document.getElementById('export-users-json');

  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', () => {
      if (currentRegistrations.length > 0) {
        exportToCSV(currentRegistrations, 'gsoc-2024-registrations.csv');
      } else {
        alert('No registrations to export');
      }
    });
  }

  if (exportJSONBtn) {
    exportJSONBtn.addEventListener('click', () => {
      if (currentRegistrations.length > 0) {
        exportToJSON(currentRegistrations, 'gsoc-2024-registrations.json');
      } else {
        alert('No registrations to export');
      }
    });
  }

  if (exportUsersCSVBtn) {
    exportUsersCSVBtn.addEventListener('click', () => {
      if (currentUsers.length > 0) {
        exportToCSV(currentUsers, 'platform-users.csv');
      } else {
        alert('No users to export');
      }
    });
  }

  if (exportUsersJSONBtn) {
    exportUsersJSONBtn.addEventListener('click', () => {
      if (currentUsers.length > 0) {
        exportToJSON(currentUsers, 'platform-users.json');
      } else {
        alert('No users to export');
      }
    });
  }

  // Search filters
  const searchUsersInput = document.getElementById('search-users');
  const searchRegsInput = document.getElementById('search-registrations');

  if (searchUsersInput) {
    searchUsersInput.addEventListener('input', () => {
      filterAndRenderUsers(searchUsersInput.value);
    });
  }

  if (searchRegsInput) {
    searchRegsInput.addEventListener('input', () => {
      filterAndRenderRegistrations(searchRegsInput.value);
    });
  }
}

// Load all data
async function loadData() {
  await Promise.all([
    loadEventInfo(),
    loadRegistrations(),
    loadStats(),
    loadUsers()
  ]);
}

// Load event info
async function loadEventInfo() {
  const eventTitleEl = document.getElementById('event-title');
  const eventDetailsEl = document.getElementById('event-details');
  
  if (eventTitleEl) {
    eventTitleEl.textContent = 'GSoC 2024 - Event Registrations';
  }
  
  if (eventDetailsEl) {
    eventDetailsEl.innerHTML = `
      <p><strong>Event ID:</strong> ${EVENT_ID}</p>
      <p>View all registrations and analytics for this event below.</p>
    `;
  }
}

// Load registrations
async function loadRegistrations() {
  const registrationsTable = document.getElementById('registrations-table');
  
  if (!registrationsTable) return;

  registrationsTable.innerHTML = '<tr><td colspan="8" class="loading">Loading registrations...</td></tr>';

  try {
    const registrations = await getEventRegistrations(EVENT_ID);
    currentRegistrations = registrations;

    if (registrations.length === 0) {
      registrationsTable.innerHTML = '<tr><td colspan="8" class="no-data">No registrations found for this event</td></tr>';
      return;
    }

    // Initial render
    renderRegistrationsTable(currentRegistrations);
  } catch (error) {
    registrationsTable.innerHTML = `<tr><td colspan="8" class="error">Error loading registrations: ${error.message}</td></tr>`;
    console.error('Error loading registrations:', error);
  }
}

// Load statistics
async function loadStats() {
  const statsContainer = document.getElementById('stats-container');
  if (!statsContainer) return;

  statsContainer.innerHTML = '<div class="loading">Loading stats...</div>';

  try {
    const stats = await getEventStats(EVENT_ID);
    
    // Get college breakdown
    const collegeBreakdown = Object.entries(stats.colleges)
      .sort((a, b) => b[1] - a[1]) // Sort by count
      .map(([college, count]) => `<li>${college}: ${count}</li>`)
      .join('');

    // Build daily registration chart data
    const dailyChart = stats.dailyRegistrations.length > 0 ? `
      <div class="stat-card full-width">
        <h4>Daily Registrations</h4>
        <div class="daily-registrations">
          ${stats.dailyRegistrations.map(day => `
            <div class="daily-item">
              <div class="daily-date">${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div class="daily-bar">
                <div class="daily-bar-fill" style="width: ${(day.count / Math.max(...stats.dailyRegistrations.map(d => d.count))) * 100}%"></div>
              </div>
              <div class="daily-count">${day.count}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '<div class="stat-card full-width"><p class="no-data">No registration data available</p></div>';

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.totalRegistrations}</div>
        <div class="stat-label">Total Registrations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.todayRegistrations}</div>
        <div class="stat-label">Today's Registrations</div>
      </div>
      <div class="stat-card full-width">
        <h4>College Distribution</h4>
        <ul class="college-list">${collegeBreakdown || '<li>No data available</li>'}</ul>
      </div>
      ${dailyChart}
    `;
  } catch (error) {
    statsContainer.innerHTML = `<div class="error">Error loading stats: ${error.message}</div>`;
    console.error('Error loading stats:', error);
  }
}

// Load users
async function loadUsers() {
  const usersTable = document.getElementById('users-table');
  const usersStatsContainer = document.getElementById('users-stats');
  
  if (usersTable) {
    usersTable.innerHTML = '<tr><td colspan="8" class="loading">Loading users...</td></tr>';
  }

  try {
    const users = await getAllUsers();
    currentUsers = users;

    // Sort by createdAt (newest first)
    users.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Show users stats
    if (usersStatsContainer) {
      // Get today's new users
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todayUsers = users.filter(user => {
        if (user.createdAt) {
          const createdDate = new Date(user.createdAt);
          return createdDate >= today && createdDate <= todayEnd;
        }
        return false;
      }).length;

      usersStatsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${users.length}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${todayUsers}</div>
          <div class="stat-label">New Users Today</div>
        </div>
      `;
    }

    if (users.length === 0) {
      if (usersTable) {
        usersTable.innerHTML = '<tr><td colspan="8" class="no-data">No users found</td></tr>';
      }
      return;
    }

    // Initial render
    renderUsersTable(users);
  } catch (error) {
    if (usersTable) {
      usersTable.innerHTML = `<tr><td colspan="8" class="error">Error loading users: ${error.message}</td></tr>`;
    }
    console.error('Error loading users:', error);
  }
}

// Helpers: filtering and rendering
function normalize(str) {
  return (str || '').toString().toLowerCase();
}

function renderUsersTable(users) {
  const usersTable = document.getElementById('users-table');
  if (!usersTable) return;
  if (!users || users.length === 0) {
    usersTable.innerHTML = '<tr><td colspan="8" class="no-data">No users found</td></tr>';
    return;
  }
  usersTable.innerHTML = users.map((user, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        ${user.photoURL ? `<img src="${user.photoURL}" alt="${user.name || 'User'}" class="user-photo">` : '<span class="user-avatar">👤</span>'}
      </td>
      <td>${user.name || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.phone || 'N/A'}</td>
      <td>${user.college || 'N/A'}</td>
      <td>${user.createdAt ? formatDate(new Date(user.createdAt)) : 'N/A'}</td>
      <td>${user.lastLogin ? formatDate(new Date(user.lastLogin)) : 'Never'}</td>
    </tr>
  `).join('');
}

function renderRegistrationsTable(registrations) {
  const registrationsTable = document.getElementById('registrations-table');
  if (!registrationsTable) return;
  if (!registrations || registrations.length === 0) {
    registrationsTable.innerHTML = '<tr><td colspan="8" class="no-data">No registrations found</td></tr>';
    return;
  }
  registrationsTable.innerHTML = registrations.map((reg, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${reg.name || 'N/A'}</td>
      <td>${reg.email || 'N/A'}</td>
      <td>${reg.phone || 'N/A'}</td>
      <td>${reg.college || 'N/A'}</td>
      <td>${reg.eventId || EVENT_ID}</td>
      <td>${formatRegistrationDate(reg)}</td>
      <td>${reg.status || 'Registered'}</td>
    </tr>
  `).join('');
}

function filterAndRenderUsers(query) {
  const q = normalize(query);
  if (!q) {
    return renderUsersTable(currentUsers);
  }
  const filtered = currentUsers.filter(u => {
    return normalize(u.name).includes(q) ||
           normalize(u.email).includes(q) ||
           normalize(u.college).includes(q) ||
           normalize(u.phone).includes(q);
  });
  renderUsersTable(filtered);
}

function filterAndRenderRegistrations(query) {
  const q = normalize(query);
  if (!q) {
    return renderRegistrationsTable(currentRegistrations);
  }
  const filtered = currentRegistrations.filter(r => {
    return normalize(r.name).includes(q) ||
           normalize(r.email).includes(q) ||
           normalize(r.college).includes(q) ||
           normalize(r.phone).includes(q) ||
           normalize(r.status).includes(q);
  });
  renderRegistrationsTable(filtered);
}
