import { db } from './firebase-app.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { formatDate, exportToCSV, exportToJSON } from './shared-ui.js';
import { getCachedData, setCachedData, clearCache, CACHE_KEYS } from './cache-manager.js';

let allUsers = [];

async function loadUsers() {
  const tbody = document.getElementById('users-table');
  const stats = document.getElementById('users-stats');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading users...</td></tr>';

  try {
    // Check cache first
    const cachedUsers = getCachedData(CACHE_KEYS.USERS);
    
    if (cachedUsers && cachedUsers.length > 0) {
      console.log('[Users] Using cached data, count:', cachedUsers.length);
      allUsers = cachedUsers;
    } else {
      // Fetch from Firebase if cache miss
      console.log('[Users] Fetching from Firebase...');
      const snap = await getDocs(collection(db, 'users'));
      allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort by createdAt (newest first)
      allUsers.sort((a, b) => (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0)));
      
      // Cache the data
      setCachedData(CACHE_KEYS.USERS, allUsers);
    }

    // Update stats
    if (stats) {
      const today = new Date(); 
      today.setHours(0, 0, 0, 0);
      const end = new Date(today); 
      end.setHours(23, 59, 59, 999);
      const todayCount = allUsers.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = new Date(u.createdAt);
        return createdDate >= today && createdDate <= end;
      }).length;

      stats.innerHTML = `
        <div class="stat-card stat-primary">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">${allUsers.length.toLocaleString()}</div>
            <div class="stat-change">All registered users</div>
          </div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-label">New Users Today</div>
            <div class="stat-value">${todayCount.toLocaleString()}</div>
            <div class="stat-change">Joined in last 24 hours</div>
          </div>
        </div>
      `;
    }

    // Render all users at once (no pagination)
    renderUsersTable(allUsers);

    // Setup exports
    const csvBtn = document.getElementById('export-users-csv');
    const jsonBtn = document.getElementById('export-users-json');
    if (csvBtn) csvBtn.onclick = () => exportToCSV(allUsers, 'platform-users.csv');
    if (jsonBtn) jsonBtn.onclick = () => exportToJSON(allUsers, 'platform-users.json');

    // Setup search
    const search = document.getElementById('search-users');
    if (search) {
      search.oninput = () => {
        const q = search.value.toLowerCase().trim();
        if (!q) {
          renderUsersTable(allUsers);
          return;
        }
        
        const filtered = allUsers.filter(u => {
          const name = (u.name || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const phone = (u.phone || '').toLowerCase();
          const college = (u.college || '').toLowerCase();
          return name.includes(q) || email.includes(q) || phone.includes(q) || college.includes(q);
        });
        
        renderUsersTable(filtered);
      };
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-users');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        clearCache(CACHE_KEYS.USERS);
        allUsers = [];
        loadUsers();
      };
    }

  } catch (e) {
    console.error('[Users] Error:', e);
    tbody.innerHTML = `<tr><td colspan="5" class="error">Error: ${e.message}</td></tr>`;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-data">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = '';

  const frag = document.createDocumentFragment();

  users.forEach((u, index) => {
    const tr = document.createElement('tr');

    // Row number
    const numTd = document.createElement('td');
    numTd.textContent = index + 1;
    tr.appendChild(numTd);

    // Create cells with clickable email and phone
    const nameTd = document.createElement('td');
    nameTd.textContent = u.name || 'N/A';
    tr.appendChild(nameTd);

    const emailTd = document.createElement('td');
    if (u.email && u.email !== 'N/A') {
      const emailLink = document.createElement('a');
      emailLink.href = `mailto:${u.email}`;
      emailLink.textContent = u.email;
      emailLink.style.color = 'var(--primary)';
      emailLink.style.textDecoration = 'none';
      emailTd.appendChild(emailLink);
    } else {
      emailTd.textContent = 'N/A';
    }
    tr.appendChild(emailTd);

    const phoneTd = document.createElement('td');
    if (u.phone && u.phone !== 'N/A') {
      const phoneLink = document.createElement('a');
      phoneLink.href = `tel:${u.phone}`;
      phoneLink.textContent = u.phone;
      phoneLink.style.color = 'var(--primary)';
      phoneLink.style.textDecoration = 'none';
      phoneTd.appendChild(phoneLink);
    } else {
      phoneTd.textContent = 'N/A';
    }
    tr.appendChild(phoneTd);

    const collegeTd = document.createElement('td');
    collegeTd.textContent = u.college || 'N/A';
    tr.appendChild(collegeTd);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

document.addEventListener('DOMContentLoaded', loadUsers);
