import { db } from './firebase-app.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { formatDate } from './shared-ui.js';
import { getCachedData, setCachedData, clearCache, CACHE_KEYS } from './cache-manager.js';

async function loadOverviewStats() {
  try {
    console.log('[Overview] Loading stats...');
    
    // Check cache first
    const cachedOverview = getCachedData(CACHE_KEYS.OVERVIEW);
    
    if (cachedOverview) {
      console.log('[Overview] Using cached data');
      updateUI(cachedOverview);
      return;
    }

    // Fetch from Firebase if cache miss
    console.log('[Overview] Fetching from Firebase...');
    
    const [usersSnap, registrationsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'event_registrations'))
    ]);

    const users = usersSnap.docs.map(d => ({ ...d.data() }));
    const registrations = registrationsSnap.docs.map(d => ({ ...d.data() }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Calculate stats
    const totalUsers = users.length;
    const totalRegistrations = registrations.length;
    
    const todayRegistrations = registrations.filter(r => {
      const date = r.timestamp?.toDate?.() || 
                   (r.registeredAt ? new Date(r.registeredAt) : null) ||
                   (r.timestamp ? new Date(r.timestamp) : null);
      return date && date >= today && date <= todayEnd;
    }).length;

    const newUsersToday = users.filter(u => {
      const date = u.createdAt ? new Date(u.createdAt) : null;
      return date && date >= today && date <= todayEnd;
    }).length;

    // Top college
    const collegeCounts = {};
    registrations.forEach(r => {
      const college = r.college || 'Not specified';
      collegeCounts[college] = (collegeCounts[college] || 0) + 1;
    });
    const topCollege = Object.entries(collegeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Average per day (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }
    const last7DaysRegs = registrations.filter(r => {
      const date = r.timestamp?.toDate?.() || 
                   (r.registeredAt ? new Date(r.registeredAt) : null) ||
                   (r.timestamp ? new Date(r.timestamp) : null);
      if (!date) return false;
      const dateStr = date.toISOString().split('T')[0];
      return last7Days.includes(dateStr);
    }).length;
    const avgPerDay = Math.round(last7DaysRegs / 7);

    // Recent activity
    const recentRegs = registrations
      .map(r => ({
        ...r,
        date: r.timestamp?.toDate?.() || 
              (r.registeredAt ? new Date(r.registeredAt) : null) ||
              (r.timestamp ? new Date(r.timestamp) : null) ||
              new Date()
      }))
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    const overviewData = {
      totalUsers,
      totalRegistrations,
      todayRegistrations,
      newUsersToday,
      topCollege,
      avgPerDay,
      recentRegs
    };

    // Cache the computed data
    setCachedData(CACHE_KEYS.OVERVIEW, overviewData);
    
    updateUI(overviewData);
    console.log('[Overview] Stats loaded successfully');
  } catch (error) {
    console.error('[Overview] Error loading stats:', error);
  }
}

function updateUI(data) {
  updateElement('stat-total-users', data.totalUsers.toLocaleString());
  updateElement('stat-total-registrations', data.totalRegistrations.toLocaleString());
  updateElement('stat-today-registrations', data.todayRegistrations.toLocaleString());
  updateElement('stat-new-users', data.newUsersToday.toLocaleString());

  updateElement('stat-users-change', `${data.newUsersToday} new today`);
  updateElement('stat-registrations-change', `${data.todayRegistrations} registered today`);
  updateElement('stat-today-change', 'Last 24 hours');
  updateElement('stat-new-users-change', 'Joined today');

  updateElement('quick-active-events', '1');
  updateElement('quick-top-college', data.topCollege.substring(0, 30));
  updateElement('quick-avg-per-day', data.avgPerDay);

  // Recent activity
  const activityEl = document.getElementById('recent-activity');
  if (activityEl) {
    if (data.recentRegs.length === 0) {
      activityEl.innerHTML = '<p class="no-data-text">No recent activity</p>';
    } else {
      activityEl.innerHTML = data.recentRegs.map(r => `
        <div class="activity-item">
          <div class="activity-icon">📝</div>
          <div class="activity-content">
            <div class="activity-title">${r.name || 'Unknown'} registered</div>
            <div class="activity-time">${formatDate(r.date)}</div>
          </div>
        </div>
      `).join('');
    }
  }
}

function updateElement(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

document.addEventListener('DOMContentLoaded', loadOverviewStats);
