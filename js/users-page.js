import { db } from './firebase-app.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { formatDate, exportToCSV, exportToJSON } from './shared-ui.js';
import { getCachedData, setCachedData, clearCache, CACHE_KEYS } from './cache-manager.js';
import { generateWelcomeEmail, openEmailComposer, createIndividualEmailLink } from './email-templates.js';
import { updateWelcomeEmailStatus, bulkUpdateWelcomeEmailStatus, showStatusToggleWarning } from './email-status-manager.js';

let allUsers = [];

async function loadUsers() {
  const tbody = document.getElementById('users-table');
  const stats = document.getElementById('users-stats');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading users...</td></tr>';

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

    // Bulk welcome email button
    const emailBtn = document.getElementById('send-welcome-email');
    if (emailBtn) {
      emailBtn.onclick = () => {
        const validUsers = allUsers.filter(u => u.email && u.email !== 'N/A' && u.email.includes('@'));
        if (validUsers.length === 0) {
          alert('No valid email addresses found.');
          return;
        }
        const subject = 'Welcome to Code Nexus!';
        // Open email type selector (personalized or BCC)
        openEmailComposer([], subject, '', false, validUsers, generateWelcomeEmail);
      };
    }

    // Setup bulk actions
    setupBulkActions();

  } catch (e) {
    console.error('[Users] Error:', e);
    tbody.innerHTML = `<tr><td colspan="8" class="error">Error: ${e.message}</td></tr>`;
  }
}

function setupBulkActions() {
  const selectAll = document.getElementById('select-all-users');
  const bulkMarkSent = document.getElementById('bulk-mark-sent');
  const bulkMarkUnsent = document.getElementById('bulk-mark-unsent');
  
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('#users-table input[type="checkbox"][data-user-id]');
      checkboxes.forEach(cb => cb.checked = e.target.checked);
      updateBulkButtons();
    });
  }
  
  if (bulkMarkSent) {
    bulkMarkSent.addEventListener('click', async () => {
      const selected = getSelectedUserIds();
      if (selected.length === 0) {
        alert('Please select at least one user.');
        return;
      }
      
      const confirmed = await showStatusToggleWarning(false, 'welcome', null, selected.length);
      if (!confirmed) return;
      
      try {
        bulkMarkSent.disabled = true;
        bulkMarkSent.textContent = 'Updating...';
        await bulkUpdateWelcomeEmailStatus(selected, true);
        clearCache(CACHE_KEYS.USERS);
        await loadUsers();
        alert(`✓ Marked ${selected.length} user(s) as sent successfully!`);
      } catch (error) {
        console.error('[Users] Error bulk marking:', error);
        alert('Error updating status. Please try again.');
      } finally {
        bulkMarkSent.disabled = false;
        bulkMarkSent.textContent = '✓ Mark Selected as Sent';
      }
    });
  }
  
  if (bulkMarkUnsent) {
    bulkMarkUnsent.addEventListener('click', async () => {
      const selected = getSelectedUserIds();
      if (selected.length === 0) {
        alert('Please select at least one user.');
        return;
      }
      
      const confirmed = await showStatusToggleWarning(true, 'welcome', null, selected.length);
      if (!confirmed) return;
      
      try {
        bulkMarkUnsent.disabled = true;
        bulkMarkUnsent.textContent = 'Updating...';
        await bulkUpdateWelcomeEmailStatus(selected, false);
        clearCache(CACHE_KEYS.USERS);
        await loadUsers();
        alert(`✓ Marked ${selected.length} user(s) as unsent successfully!`);
      } catch (error) {
        console.error('[Users] Error bulk marking:', error);
        alert('Error updating status. Please try again.');
      } finally {
        bulkMarkUnsent.disabled = false;
        bulkMarkUnsent.textContent = '✗ Mark Selected as Unsent';
      }
    });
  }
}

function getSelectedUserIds() {
  const checkboxes = document.querySelectorAll('#users-table input[type="checkbox"][data-user-id]:checked');
  return Array.from(checkboxes).map(cb => cb.dataset.userId);
}

function updateBulkButtons() {
  const selected = getSelectedUserIds();
  const bulkMarkSent = document.getElementById('bulk-mark-sent');
  const bulkMarkUnsent = document.getElementById('bulk-mark-unsent');
  
  if (selected.length > 0) {
    if (bulkMarkSent) bulkMarkSent.style.display = 'inline-block';
    if (bulkMarkUnsent) bulkMarkUnsent.style.display = 'inline-block';
  } else {
    if (bulkMarkSent) bulkMarkSent.style.display = 'none';
    if (bulkMarkUnsent) bulkMarkUnsent.style.display = 'none';
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="no-data">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = '';

  const frag = document.createDocumentFragment();

  users.forEach((u, index) => {
    const tr = document.createElement('tr');
    tr.dataset.userId = u.id;

    // Checkbox column
    const checkboxTd = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.userId = u.id;
    checkbox.addEventListener('change', updateBulkButtons);
    checkboxTd.appendChild(checkbox);
    tr.appendChild(checkboxTd);

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

    // Status column - Welcome Email Status
    const statusTd = document.createElement('td');
    const statusBadge = document.createElement('span');
    const isSent = u.welcomeEmailSent === true;
    statusBadge.className = `email-status-badge ${isSent ? 'sent' : 'unsent'}`;
    statusBadge.textContent = isSent ? '✓ Sent' : '✗ Not Sent';
    statusBadge.style.cursor = 'pointer';
    statusBadge.title = `Click to mark as ${isSent ? 'NOT sent' : 'sent'}`;
    statusBadge.addEventListener('click', async () => {
      const confirmed = await showStatusToggleWarning(isSent, 'welcome', u.name || u.email, 1);
      if (!confirmed) return;
      
      try {
        statusBadge.style.opacity = '0.5';
        await updateWelcomeEmailStatus(u.id, !isSent);
        clearCache(CACHE_KEYS.USERS);
        await loadUsers();
      } catch (error) {
        console.error('[Users] Error updating status:', error);
        alert('Error updating status. Please try again.');
        statusBadge.style.opacity = '1';
      }
    });
    statusTd.appendChild(statusBadge);
    tr.appendChild(statusTd);

    // Action column - Email button
    const actionTd = document.createElement('td');
    if (u.email && u.email !== 'N/A') {
      const emailBtn = document.createElement('a');
      emailBtn.href = createIndividualEmailLink(
        u.email,
        'Welcome to Code Nexus!',
        generateWelcomeEmail(u.name || '')
      );
      emailBtn.className = 'btn-email-row';
      emailBtn.title = 'Send welcome email';
      emailBtn.textContent = '📧';
      emailBtn.target = '_blank';
      
      // Mark as sent when email is opened
      emailBtn.addEventListener('click', async () => {
        if (!u.welcomeEmailSent) {
          try {
            await updateWelcomeEmailStatus(u.id, true);
            clearCache(CACHE_KEYS.USERS);
            // Refresh after a delay to allow Gmail to open
            setTimeout(() => loadUsers(), 1000);
          } catch (error) {
            console.error('[Users] Error marking as sent:', error);
          }
        }
      });
      
      actionTd.appendChild(emailBtn);
    } else {
      actionTd.textContent = '-';
    }
    tr.appendChild(actionTd);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

document.addEventListener('DOMContentLoaded', loadUsers);
