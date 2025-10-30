// Get all events
async function getAllEvents() {
  try {
    const snapshot = await db.collection('events').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// Get event registrations for a specific event
async function getEventRegistrations(eventId) {
  try {
    const snapshot = await db.collection('event_registrations').where('eventId', '==', eventId).get();
    let registrations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by registeredAt (can be timestamp, ISO string, or date)
    registrations.sort((a, b) => {
      const timeA = getTimestampValue(a);
      const timeB = getTimestampValue(b);
      return timeB - timeA; // Descending order (newest first)
    });
    
    return registrations;
  } catch (error) {
    console.error('Error fetching registrations:', error);
    throw error;
  }
}

// Helper to get timestamp value from various formats
function getTimestampValue(reg) {
  // Try registeredAt first (ISO string)
  if (reg.registeredAt) {
    return new Date(reg.registeredAt).getTime();
  }
  // Try timestamp (Firestore timestamp)
  if (reg.timestamp) {
    if (reg.timestamp.toDate) {
      return reg.timestamp.toDate().getTime();
    }
    return new Date(reg.timestamp).getTime();
  }
  // Try createdAt
  if (reg.createdAt) {
    if (reg.createdAt.toDate) {
      return reg.createdAt.toDate().getTime();
    }
    return new Date(reg.createdAt).getTime();
  }
  return 0;
}

// Get all users
async function getAllUsers() {
  try {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Get registration statistics for an event
async function getEventStats(eventId) {
  try {
    const registrations = await getEventRegistrations(eventId);
    
    // Get today's registrations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayRegistrations = registrations.filter(reg => {
      const regDate = getRegistrationDate(reg);
      return regDate >= today && regDate <= todayEnd;
    }).length;

    // Count by college
    const colleges = {};
    registrations.forEach(reg => {
      const college = reg.college || reg.university || 'Not specified';
      colleges[college] = (colleges[college] || 0) + 1;
    });

    // Count registrations per day
    const dailyRegistrations = {};
    registrations.forEach(reg => {
      const regDate = getRegistrationDate(reg);
      const dateKey = regDate.toISOString().split('T')[0]; // YYYY-MM-DD
      dailyRegistrations[dateKey] = (dailyRegistrations[dateKey] || 0) + 1;
    });

    // Convert to array sorted by date
    const dailyData = Object.entries(dailyRegistrations)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRegistrations: registrations.length,
      todayRegistrations: todayRegistrations,
      colleges: colleges,
      dailyRegistrations: dailyData
    };
  } catch (error) {
    console.error('Error fetching event stats:', error);
    throw error;
  }
}

// Helper to get registration date from various formats
function getRegistrationDate(reg) {
  // Try registeredAt first (ISO string)
  if (reg.registeredAt) {
    return new Date(reg.registeredAt);
  }
  // Try timestamp (Firestore timestamp)
  if (reg.timestamp) {
    if (reg.timestamp.toDate) {
      return reg.timestamp.toDate();
    }
    return new Date(reg.timestamp);
  }
  // Try createdAt
  if (reg.createdAt) {
    if (reg.createdAt.toDate) {
      return reg.createdAt.toDate();
    }
    return new Date(reg.createdAt);
  }
  return new Date();
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format date for registration (handles registeredAt field)
function formatRegistrationDate(reg) {
  const date = getRegistrationDate(reg);
  return formatDate(date);
}

// Export data to CSV
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '""';
        // Handle timestamp objects
        if (value && typeof value === 'object' && value.toDate) {
          const dateValue = value.toDate();
          const stringValue = dateValue.toISOString().replace(/"/g, '""');
          return `"${stringValue}"`;
        }
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Export data to JSON
function exportToJSON(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Convert Firestore timestamps to ISO strings
  const cleanData = data.map(item => {
    const clean = {};
    for (const [key, value] of Object.entries(item)) {
      if (value && typeof value === 'object' && value.toDate) {
        clean[key] = value.toDate().toISOString();
      } else {
        clean[key] = value;
      }
    }
    return clean;
  });

  const jsonContent = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'export.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
