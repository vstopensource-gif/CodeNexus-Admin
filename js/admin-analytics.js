import { collection, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { db } from "./firebase-app.js";
import { formatDate } from "./admin-utils.js";

let registrationChart = null;

// Get dashboard statistics
export async function getDashboardStats() {
  try {
    const [usersSnapshot, eventsSnapshot, registrationsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'event_registrations'))
    ]);

    // Get today's registrations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayRegistrations = registrationsSnapshot.docs.filter(doc => {
      const data = doc.data();
      if (data.timestamp && data.timestamp.toDate) {
        const regDate = data.timestamp.toDate();
        return regDate >= today && regDate <= todayEnd;
      }
      return false;
    }).length;

    // Get active events count
    const activeEvents = eventsSnapshot.docs.filter(doc => doc.data().isOpen).length;

    return {
      totalUsers: usersSnapshot.size,
      totalEvents: eventsSnapshot.size,
      totalRegistrations: registrationsSnapshot.size,
      activeEvents: activeEvents,
      todayRegistrations: todayRegistrations
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// Render dashboard stats
export async function renderDashboardStats() {
  const statsContainer = document.getElementById('dashboard-stats');
  if (!statsContainer) return;

  statsContainer.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const stats = await getDashboardStats();
    
    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-header">
          <h3>Total Users</h3>
          <span class="card-icon">👥</span>
        </div>
        <div class="stat-card-body">
          <p class="stat-value">${stats.totalUsers.toLocaleString()}</p>
          <p class="stat-change">Registered users</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-header">
          <h3>Total Events</h3>
          <span class="card-icon">📅</span>
        </div>
        <div class="stat-card-body">
          <p class="stat-value">${stats.totalEvents.toLocaleString()}</p>
          <p class="stat-change">${stats.activeEvents} active</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-header">
          <h3>Total Registrations</h3>
          <span class="card-icon">📝</span>
        </div>
        <div class="stat-card-body">
          <p class="stat-value">${stats.totalRegistrations.toLocaleString()}</p>
          <p class="stat-change">All time registrations</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-header">
          <h3>Today's Registrations</h3>
          <span class="card-icon">✨</span>
        </div>
        <div class="stat-card-body">
          <p class="stat-value">${stats.todayRegistrations.toLocaleString()}</p>
          <p class="stat-change">New registrations today</p>
        </div>
      </div>
    `;
  } catch (error) {
    statsContainer.innerHTML = `<div class="error-message">Error loading statistics: ${error.message}</div>`;
  }
}

// Get registration trends for chart
export async function getRegistrationTrends(days = 30) {
  try {
    const registrationsRef = collection(db, 'event_registrations');
    const q = query(registrationsRef, orderBy('timestamp', 'desc'), limit(1000));
    const snapshot = await getDocs(q);

    const trends = {};
    const today = new Date();
    
    // Initialize last N days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      trends[dateKey] = 0;
    }

    // Count registrations per day
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.timestamp && data.timestamp.toDate) {
        const regDate = data.timestamp.toDate();
        const dateKey = regDate.toISOString().split('T')[0];
        if (trends.hasOwnProperty(dateKey)) {
          trends[dateKey]++;
        }
      }
    });

    return Object.entries(trends).map(([date, count]) => ({
      date,
      count
    }));
  } catch (error) {
    console.error('Error fetching registration trends:', error);
    throw error;
  }
}

// Render registration trends chart
export async function renderRegistrationChart() {
  const chartContainer = document.getElementById('registration-chart');
  if (!chartContainer) return;

  try {
    const trends = await getRegistrationTrends(30);
    
    // Load Chart.js dynamically if not already loaded
    if (typeof Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = () => renderChartWithData(trends, chartContainer);
      document.head.appendChild(script);
    } else {
      renderChartWithData(trends, chartContainer);
    }
  } catch (error) {
    chartContainer.innerHTML = `<div class="error-message">Error loading chart: ${error.message}</div>`;
  }
}

function renderChartWithData(trends, container) {
  const ctx = container.getContext ? container : container.querySelector('canvas')?.getContext('2d');
  
  if (!ctx) {
    container.innerHTML = '<canvas id="registration-chart-canvas"></canvas>';
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    const newCtx = canvas.getContext('2d');
    if (!newCtx) return;
    
    if (registrationChart) {
      registrationChart.destroy();
    }
    
    registrationChart = new Chart(newCtx, {
      type: 'line',
      data: {
        labels: trends.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Registrations',
          data: trends.map(t => t.count),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Registration Trends (Last 30 Days)'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  } else {
    if (registrationChart) {
      registrationChart.destroy();
    }
    
    registrationChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trends.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Registrations',
          data: trends.map(t => t.count),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Registration Trends (Last 30 Days)'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }
}

// Get recent activity
export async function getRecentActivity(limitCount = 10) {
  try {
    const registrationsRef = collection(db, 'event_registrations');
    const q = query(registrationsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
}

// Render recent activity
export async function renderRecentActivity() {
  const activityContainer = document.getElementById('recent-activity');
  if (!activityContainer) return;

  activityContainer.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const activities = await getRecentActivity(10);
    
    if (activities.length === 0) {
      activityContainer.innerHTML = '<p class="no-data">No recent activity</p>';
      return;
    }

    activityContainer.innerHTML = `
      <ul class="activity-list">
        ${activities.map(activity => `
          <li class="activity-item">
            <div class="activity-info">
              <strong>${activity.name || 'Unknown User'}</strong> registered for 
              <strong>${activity.eventId || 'Event'}</strong>
            </div>
            <div class="activity-time">${formatDate(activity.timestamp)}</div>
          </li>
        `).join('')}
      </ul>
    `;
  } catch (error) {
    activityContainer.innerHTML = `<div class="error-message">Error loading activity: ${error.message}</div>`;
  }
}

