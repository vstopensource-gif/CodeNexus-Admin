import { db } from './firebase-app.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { formatDate, exportToCSV, exportToJSON } from './shared-ui.js';
import { getCachedData, setCachedData, clearCache, CACHE_KEYS } from './cache-manager.js';
import { generateSeminarEmail, openEmailComposer, createIndividualEmailLink } from './email-templates.js';
import { updateSeminarEmailStatus, bulkUpdateSeminarEmailStatus, showStatusToggleWarning } from './email-status-manager.js';

const DEFAULT_EVENT_ID = 'gsoc-2024-10-31';
let allRegistrations = [];

async function loadRegistrations() {
  const tbody = document.getElementById('registrations-table');
  if (!tbody) {
    console.error('[Registrations] Table body not found');
    return;
  }

  tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading registrations...</td></tr>';

  try {
    // Check cache first
    const cachedRegs = getCachedData(CACHE_KEYS.REGISTRATIONS);
    
    if (cachedRegs && cachedRegs.length > 0) {
      console.log('[Registrations] Using cached data, count:', cachedRegs.length);
      allRegistrations = cachedRegs;
    } else {
      // Fetch from Firebase if cache miss
      console.log('[Registrations] Fetching from Firebase...');
      const snap = await getDocs(collection(db, 'event_registrations'));
      allRegistrations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort by timestamp (newest first)
      allRegistrations.sort((a, b) => {
        const getTime = (r) => {
          if (r.timestamp && typeof r.timestamp.toDate === 'function') {
            return r.timestamp.toDate().getTime();
          }
          if (r.timestamp) return new Date(r.timestamp).getTime();
          if (r.registeredAt) return new Date(r.registeredAt).getTime();
          if (r.createdAt) {
            if (r.createdAt.toDate) return r.createdAt.toDate().getTime();
            return new Date(r.createdAt).getTime();
          }
          return 0;
        };
        return getTime(b) - getTime(a);
      });
      
      // Cache the data
      setCachedData(CACHE_KEYS.REGISTRATIONS, allRegistrations);
    }

    if (allRegistrations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="no-data">No registrations found in database</td></tr>';
      return;
    }

    // Render all registrations at once (no pagination)
    renderRegistrationsTable(allRegistrations);

    // Setup exports
    const csvBtn = document.getElementById('export-csv');
    const jsonBtn = document.getElementById('export-json');
    if (csvBtn) {
      csvBtn.onclick = () => {
        console.log('[Registrations] Exporting CSV, count:', allRegistrations.length);
        exportToCSV(allRegistrations, 'registrations.csv');
      };
    }
    if (jsonBtn) {
      jsonBtn.onclick = () => {
        console.log('[Registrations] Exporting JSON, count:', allRegistrations.length);
        exportToJSON(allRegistrations, 'registrations.json');
      };
    }

    // Setup search
    const search = document.getElementById('search-registrations');
    if (search) {
      search.oninput = () => {
        const q = search.value.toLowerCase().trim();
        if (!q) {
          renderRegistrationsTable(allRegistrations);
          return;
        }
        const filtered = allRegistrations.filter(r => {
          const name = (r.name || '').toLowerCase();
          const email = (r.email || '').toLowerCase();
          const phone = (r.phone || '').toLowerCase();
          const college = (r.college || '').toLowerCase();
          return name.includes(q) || email.includes(q) || phone.includes(q) || college.includes(q);
        });
        renderRegistrationsTable(filtered);
      };
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-registrations');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        clearCache(CACHE_KEYS.REGISTRATIONS);
        allRegistrations = [];
        loadRegistrations();
      };
    }

    // Bulk seminar email button
    const emailBtn = document.getElementById('send-seminar-email');
    if (emailBtn) {
      emailBtn.onclick = () => {
        const validRegs = allRegistrations.filter(r => r.email && r.email !== 'N/A' && r.email.includes('@'));
        if (validRegs.length === 0) {
          alert('No valid email addresses found.');
          return;
        }
        const subject = '🎉 You’re Registered for the GSoC Session! Here’s Your Zoom Link 🔗';
        // Open email type selector (personalized or BCC)
        openEmailComposer([], subject, '', false, validRegs, generateSeminarEmail);
      };
    }

    // Setup bulk actions
    setupBulkActions();

  } catch (error) {
    console.error('[Registrations] Error:', error);
    tbody.innerHTML = `<tr><td colspan="8" class="error">Error loading registrations: ${error.message}</td></tr>`;
  }
}

function setupBulkActions() {
  const selectAll = document.getElementById('select-all-registrations');
  const bulkMarkSent = document.getElementById('bulk-mark-sent-reg');
  const bulkMarkUnsent = document.getElementById('bulk-mark-unsent-reg');
  
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('#registrations-table input[type="checkbox"][data-reg-id]');
      checkboxes.forEach(cb => cb.checked = e.target.checked);
      updateBulkButtons();
    });
  }
  
  if (bulkMarkSent) {
    bulkMarkSent.addEventListener('click', async () => {
      const selected = getSelectedRegistrationIds();
      if (selected.length === 0) {
        alert('Please select at least one registration.');
        return;
      }
      
      const confirmed = await showStatusToggleWarning(false, 'seminar', null, selected.length);
      if (!confirmed) return;
      
      try {
        bulkMarkSent.disabled = true;
        bulkMarkSent.textContent = 'Updating...';
        await bulkUpdateSeminarEmailStatus(selected, true);
        clearCache(CACHE_KEYS.REGISTRATIONS);
        await loadRegistrations();
        alert(`✓ Marked ${selected.length} registration(s) as sent successfully!`);
      } catch (error) {
        console.error('[Registrations] Error bulk marking:', error);
        alert('Error updating status. Please try again.');
      } finally {
        bulkMarkSent.disabled = false;
        bulkMarkSent.textContent = '✓ Mark Selected as Sent';
      }
    });
  }
  
  if (bulkMarkUnsent) {
    bulkMarkUnsent.addEventListener('click', async () => {
      const selected = getSelectedRegistrationIds();
      if (selected.length === 0) {
        alert('Please select at least one registration.');
        return;
      }
      
      const confirmed = await showStatusToggleWarning(true, 'seminar', null, selected.length);
      if (!confirmed) return;
      
      try {
        bulkMarkUnsent.disabled = true;
        bulkMarkUnsent.textContent = 'Updating...';
        await bulkUpdateSeminarEmailStatus(selected, false);
        clearCache(CACHE_KEYS.REGISTRATIONS);
        await loadRegistrations();
        alert(`✓ Marked ${selected.length} registration(s) as unsent successfully!`);
      } catch (error) {
        console.error('[Registrations] Error bulk marking:', error);
        alert('Error updating status. Please try again.');
      } finally {
        bulkMarkUnsent.disabled = false;
        bulkMarkUnsent.textContent = '✗ Mark Selected as Unsent';
      }
    });
  }
}

function getSelectedRegistrationIds() {
  const checkboxes = document.querySelectorAll('#registrations-table input[type="checkbox"][data-reg-id]:checked');
  return Array.from(checkboxes).map(cb => cb.dataset.regId);
}

function updateBulkButtons() {
  const selected = getSelectedRegistrationIds();
  const bulkMarkSent = document.getElementById('bulk-mark-sent-reg');
  const bulkMarkUnsent = document.getElementById('bulk-mark-unsent-reg');
  
  if (selected.length > 0) {
    if (bulkMarkSent) bulkMarkSent.style.display = 'inline-block';
    if (bulkMarkUnsent) bulkMarkUnsent.style.display = 'inline-block';
  } else {
    if (bulkMarkSent) bulkMarkSent.style.display = 'none';
    if (bulkMarkUnsent) bulkMarkUnsent.style.display = 'none';
  }
}

function renderRegistrationsTable(registrations) {
  const tbody = document.getElementById('registrations-table');
  if (!tbody) {
    console.error('[Registrations] Table body not found for rendering');
    return;
  }

  if (!registrations || registrations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="no-data">No registrations found</td></tr>';
    return;
  }

  // Clear existing content
  tbody.innerHTML = '';

  // Create document fragment for better performance
  const frag = document.createDocumentFragment();

  registrations.forEach((reg, index) => {
    const tr = document.createElement('tr');
    tr.dataset.regId = reg.id;

    // Checkbox column
    const checkboxTd = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.regId = reg.id;
    checkbox.addEventListener('change', updateBulkButtons);
    checkboxTd.appendChild(checkbox);
    tr.appendChild(checkboxTd);

    // Row number
    const numTd = document.createElement('td');
    numTd.textContent = index + 1;
    tr.appendChild(numTd);

    // Name
    const nameTd = document.createElement('td');
    nameTd.textContent = reg.name || 'N/A';
    tr.appendChild(nameTd);

    // Email (clickable)
    const emailTd = document.createElement('td');
    if (reg.email && reg.email !== 'N/A') {
      const emailLink = document.createElement('a');
      emailLink.href = `mailto:${reg.email}`;
      emailLink.textContent = reg.email;
      emailLink.style.color = 'var(--primary)';
      emailLink.style.textDecoration = 'none';
      emailTd.appendChild(emailLink);
    } else {
      emailTd.textContent = 'N/A';
    }
    tr.appendChild(emailTd);

    // Phone (clickable)
    const phoneTd = document.createElement('td');
    if (reg.phone && reg.phone !== 'N/A') {
      const phoneLink = document.createElement('a');
      phoneLink.href = `tel:${reg.phone}`;
      phoneLink.textContent = reg.phone;
      phoneLink.style.color = 'var(--primary)';
      phoneLink.style.textDecoration = 'none';
      phoneTd.appendChild(phoneLink);
    } else {
      phoneTd.textContent = 'N/A';
    }
    tr.appendChild(phoneTd);

    // College
    const collegeTd = document.createElement('td');
    collegeTd.textContent = reg.college || 'N/A';
    tr.appendChild(collegeTd);

    // Status column - Seminar Email Status
    const statusTd = document.createElement('td');
    const statusBadge = document.createElement('span');
    const isSent = reg.seminarEmailSent === true;
    statusBadge.className = `email-status-badge ${isSent ? 'sent' : 'unsent'}`;
    statusBadge.textContent = isSent ? '✓ Sent' : '✗ Not Sent';
    statusBadge.style.cursor = 'pointer';
    statusBadge.title = `Click to mark as ${isSent ? 'NOT sent' : 'sent'}`;
    statusBadge.addEventListener('click', async () => {
      const confirmed = await showStatusToggleWarning(isSent, 'seminar', reg.name || reg.email, 1);
      if (!confirmed) return;
      
      try {
        statusBadge.style.opacity = '0.5';
        await updateSeminarEmailStatus(reg.id, !isSent);
        clearCache(CACHE_KEYS.REGISTRATIONS);
        await loadRegistrations();
      } catch (error) {
        console.error('[Registrations] Error updating status:', error);
        alert('Error updating status. Please try again.');
        statusBadge.style.opacity = '1';
      }
    });
    statusTd.appendChild(statusBadge);
    tr.appendChild(statusTd);

    // Action column - Email button
    const actionTd = document.createElement('td');
    if (reg.email && reg.email !== 'N/A') {
      const emailBtn = document.createElement('a');
      emailBtn.href = createIndividualEmailLink(
        reg.email,
        '🎉 You’re Registered for the GSoC Session! Here’s Your Zoom Link 🔗',
        generateSeminarEmail(reg.name || '')
      );
      emailBtn.className = 'btn-email-row';
      emailBtn.title = 'Send seminar email';
      emailBtn.textContent = '📧';
      emailBtn.target = '_blank';
      
      // Mark as sent when email is opened
      emailBtn.addEventListener('click', async () => {
        if (!reg.seminarEmailSent) {
          try {
            await updateSeminarEmailStatus(reg.id, true);
            clearCache(CACHE_KEYS.REGISTRATIONS);
            // Refresh after a delay to allow Gmail to open
            setTimeout(() => loadRegistrations(), 1000);
          } catch (error) {
            console.error('[Registrations] Error marking as sent:', error);
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

  console.log('[Registrations] Successfully rendered', tbody.children.length, 'rows');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadRegistrations);
} else {
  loadRegistrations();
}
