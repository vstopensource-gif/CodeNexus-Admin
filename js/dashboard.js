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

  // Tabs switching
  const tabs = document.querySelectorAll('.tab-btn');
  if (tabs && tabs.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        if (!target) return;
        switchTab(target);
      });
    });
    // On load, open hash tab if present
    const initial = (location.hash || '#overview').replace('#', '');
    const map = { overview: 'tab-overview', users: 'tab-users', registrations: 'tab-registrations' };
    const targetId = map[initial] || 'tab-overview';
    switchTab(targetId);
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

function getScoped(selector, fallbackId) {
  const el = document.querySelector(selector);
  if (el) return el;
  return document.getElementById(fallbackId) || null;
}

// Load registrations
async function loadRegistrations() {
  const registrationsTable = getScoped('#tab-registrations #registrations-table', 'registrations-table');
  
  if (!registrationsTable) return;

  registrationsTable.innerHTML = '<tr><td colspan="8" class="loading">Loading registrations...</td></tr>';

  try {
    const registrations = await getEventRegistrations(EVENT_ID);
    currentRegistrations = registrations;
    const regBadge = document.getElementById('count-registrations');
    if (regBadge) regBadge.textContent = registrations.length;
    console.log('[Registrations] Loaded count:', registrations.length);

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
  const usersTable = getScoped('#tab-users #users-table', 'users-table');
  const usersStatsContainer = document.getElementById('users-stats');
  
  if (usersTable) {
    usersTable.innerHTML = '<tr><td colspan="8" class="loading">Loading users...</td></tr>';
  }

  try {
    const users = await getAllUsers();
    currentUsers = users;
    const usersBadge = document.getElementById('count-users');
    if (usersBadge) usersBadge.textContent = users.length;
    console.log('[Users] Loaded count:', users.length);

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
  const usersTable = getScoped('#tab-users #users-table', 'users-table');
  if (!usersTable) return;
  usersTable.innerHTML = '';
  if (!users || users.length === 0) {
    usersTable.innerHTML = '<tr><td colspan="8" class="no-data">No users found</td></tr>';
    return;
  }
  const frag = document.createDocumentFragment();
  users.forEach((user, index) => {
    const tr = document.createElement('tr');
    const cells = [
      index + 1,
      null, // photo cell handled separately
      user.name || 'N/A',
      user.email || 'N/A',
      user.phone || 'N/A',
      user.college || 'N/A',
      user.createdAt ? formatDate(new Date(user.createdAt)) : 'N/A',
      user.lastLogin ? formatDate(new Date(user.lastLogin)) : 'Never'
    ];

    // index
    let td = document.createElement('td');
    td.textContent = String(cells[0]);
    tr.appendChild(td);

    // photo
    td = document.createElement('td');
    if (user.photoURL) {
      const img = document.createElement('img');
      img.src = user.photoURL;
      img.alt = user.name || 'User';
      img.className = 'user-photo';
      td.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.className = 'user-avatar';
      span.textContent = '👤';
      td.appendChild(span);
    }
    tr.appendChild(td);

    // remaining cells
    for (let i = 2; i < cells.length; i++) {
      const ctd = document.createElement('td');
      ctd.textContent = String(cells[i]);
      tr.appendChild(ctd);
    }

    frag.appendChild(tr);
  });
  usersTable.appendChild(frag);
  console.log('[Users] Rendered rows:', usersTable.children.length);

  // Fallback: ensure visible/painted
  const uwrapper = usersTable.closest('.table-wrapper');
  if (uwrapper) {
    const h1 = uwrapper.scrollHeight;
    const h2 = usersTable.offsetHeight;
    if (h1 === 0 || h2 === 0) {
      uwrapper.style.overflowY = 'visible';
      usersTable.style.display = 'table-row-group';
      usersTable.style.visibility = 'visible';
      requestAnimationFrame(() => {
        usersTable.appendChild(document.createComment('repaint'));
      });
    }
  }
}

function renderRegistrationsTable(registrations) {
  const registrationsTable = getScoped('#tab-registrations #registrations-table', 'registrations-table');
  if (!registrationsTable) return;
  registrationsTable.innerHTML = '';
  if (!registrations || registrations.length === 0) {
    registrationsTable.innerHTML = '<tr><td colspan="8" class="no-data">No registrations found</td></tr>';
    return;
  }
  const frag = document.createDocumentFragment();
  registrations.forEach((reg, index) => {
    const tr = document.createElement('tr');
    const cells = [
      index + 1,
      reg.name || 'N/A',
      reg.email || 'N/A',
      reg.phone || 'N/A',
      reg.college || 'N/A',
      reg.eventId || EVENT_ID,
      formatRegistrationDate(reg),
      reg.status || 'Registered'
    ];

    cells.forEach(val => {
      const td = document.createElement('td');
      td.textContent = String(val);
      tr.appendChild(td);
    });
    frag.appendChild(tr);
  });
  registrationsTable.appendChild(frag);
  console.log('[Registrations] Rendered rows:', registrationsTable.children.length);

  // Fallback: ensure visible/painted
  const wrapper = registrationsTable.closest('.table-wrapper');
  if (wrapper) {
    const h1 = wrapper.scrollHeight;
    const h2 = registrationsTable.offsetHeight;
    if (h1 === 0 || h2 === 0) {
      wrapper.style.overflowY = 'visible';
      registrationsTable.style.display = 'table-row-group';
      registrationsTable.style.visibility = 'visible';
      requestAnimationFrame(() => {
        registrationsTable.appendChild(document.createComment('repaint'));
      });
    }
  }
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

function switchTab(targetId) {
  const groups = document.querySelectorAll('.section-group');
  groups.forEach(g => { g.style.display = (g.id === targetId) ? 'block' : 'none'; });

  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(t => {
    if (t.getAttribute('data-target') === targetId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  // Update hash for deep links
  const rev = { 'tab-overview': '#overview', 'tab-users': '#users', 'tab-registrations': '#registrations' };
  const newHash = rev[targetId] || '#overview';
  if (location.hash !== newHash) {
    history.replaceState(null, '', newHash);
  }

  // Ensure content renders when switching
  if (targetId === 'tab-registrations') {
    if (currentRegistrations && currentRegistrations.length) {
      renderRegistrationsTable(currentRegistrations);
    } else {
      loadRegistrations();
    }
  } else if (targetId === 'tab-users') {
    if (currentUsers && currentUsers.length) {
      renderUsersTable(currentUsers);
    } else {
      loadUsers();
    }
  }
}
