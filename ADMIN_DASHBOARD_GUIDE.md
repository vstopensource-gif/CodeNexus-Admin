# Admin Dashboard Guide - Code-Nexus

## Overview
This guide outlines the structure and implementation approach for a basic admin dashboard to manage the Code-Nexus website, events, and user registrations.

## Table of Contents
1. [Features & Functionality](#features--functionality)
2. [Firebase Setup](#firebase-setup)
3. [Authentication & Security](#authentication--security)
4. [Page Structure](#page-structure)
5. [Database Schema](#database-schema)
6. [Implementation Steps](#implementation-steps)
7. [UI Components](#ui-components)
8. [API Functions](#api-functions)

---

## Features & Functionality

### Core Features
1. **Event Management**
   - Create, edit, and delete events
   - View event registrations
   - Export registration data (CSV/JSON)
   - Mark events as active/inactive

2. **User Management**
   - View all registered users
   - Filter users by college, registration date
   - View user profiles and registered events
   - Export user data

3. **Analytics Dashboard**
   - Total users count
   - Total events count
   - Active registrations
   - Registration trends (chart/graph)

4. **Content Management**
   - Update homepage content
   - Manage featured events
   - Edit community links

---

## Firebase Setup

### Additional Collections Needed

#### `admin_users` Collection
```javascript
{
  userId: "string",          // Firebase Auth UID
  email: "string",           // Admin email
  role: "admin" | "super_admin",
  createdAt: timestamp,
  lastLogin: timestamp
}
```

#### `events` Collection (for admin management)
```javascript
{
  eventId: "string",         // auto-generated ID
  title: "string",
  description: "string",
  date: timestamp,
  time: "string",            // e.g., "2:30 PM"
  location: "string",        // e.g., "Online Zoom"
  imageUrl: "string",
  isOpen: boolean,           // Registration open/closed
  isFeatured: boolean,       // Featured on homepage
  maxCapacity: number,       // Optional
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Authentication & Security

### Admin Authentication Flow
1. Create admin login page (`admin-login.html`)
2. Use Firebase Admin SDK or custom claims
3. Check admin role before accessing dashboard
4. Implement role-based access control (RBAC)

### Security Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only admins can access admin_users collection
    match /admin_users/{userId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Only admins can write to events collection
    match /events/{eventId} {
      allow read: if true;  // Public read
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Admins can read all user data
    match /users/{userId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Admins can read all event registrations
    match /event_registrations/{registrationId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## Page Structure

### File: `admin-dashboard.html`
```
admin-dashboard.html
├── Navigation Bar
│   ├── Logo/Brand
│   ├── Dashboard Menu
│   └── Admin Name + Logout
├── Sidebar (Optional)
│   ├── Overview
│   ├── Events
│   ├── Users
│   ├── Analytics
│   └── Settings
└── Main Content Area
    ├── Dashboard Overview (Cards)
    │   ├── Total Users
    │   ├── Total Events
    │   ├── Active Registrations
    │   └── Today's Registrations
    ├── Recent Activity Section
    └── Quick Actions
```

### File: `admin-login.html`
```
admin-login.html
├── Admin Login Form
│   ├── Email Input
│   ├── Password Input
│   └── Login Button
└── Error Messages
```

### File: `admin-events.html` (Alternative: Single Page App)
```
admin-events.html (or section)
├── Events List/Table
│   ├── Search/Filter
│   ├── Event Cards or Table Rows
│   │   ├── Event Image
│   │   ├── Event Title
│   │   ├── Date/Time
│   │   ├── Registration Count
│   │   ├── Status (Active/Inactive)
│   │   └── Actions (Edit/Delete/View Registrations)
│   └── Pagination
└── Create/Edit Event Modal
    ├── Form Fields
    ├── Image Upload
    └── Save/Cancel Buttons
```

---

## Database Schema

### Current Collections (Already Exists)
- `users` - User profiles
- `event_registrations` - Event registrations

### New Collections to Create
- `admin_users` - Admin authentication/roles
- `events` - Event metadata (admin-managed)

### Query Examples

#### Get All Users
```javascript
const usersRef = collection(db, 'users');
const usersSnapshot = await getDocs(usersRef);
```

#### Get Event Registrations
```javascript
const registrationsRef = collection(db, 'event_registrations');
const q = query(registrationsRef, where('eventId', '==', 'event-gsoc'));
const snapshot = await getDocs(q);
```

#### Get Event Statistics
```javascript
// Total registrations for an event
const registrationsRef = collection(db, 'event_registrations');
const q = query(registrationsRef, where('eventId', '==', 'event-gsoc'));
const snapshot = await getDocs(q);
const count = snapshot.size;
```

---

## Implementation Steps

### Step 1: Create Admin Authentication
1. Create `admin-login.html`
2. Create `admin-auth.js` with admin login logic
3. Verify admin credentials against `admin_users` collection
4. Store admin session

### Step 2: Create Admin Dashboard Layout
1. Create `admin-dashboard.html`
2. Add navigation and sidebar
3. Import `nav-auth.js` or create admin-specific navigation
4. Add logout functionality

### Step 3: Implement Event Management
1. Create event list view
2. Add create/edit event functionality
3. Implement event deletion
4. Add image upload (Firebase Storage)
5. Connect events to registration system

### Step 4: Implement User Management
1. Create user list/table view
2. Add search and filter functionality
3. Add user detail view
4. Implement export functionality

### Step 5: Add Analytics
1. Create dashboard overview cards
2. Fetch statistics from Firestore
3. Add charts/graphs (use Chart.js or similar)
4. Display recent activity

### Step 6: Security & Testing
1. Implement Firestore security rules
2. Add role-based access checks
3. Test all CRUD operations
4. Add error handling

---

## UI Components

### Dashboard Cards
```html
<div class="admin-card">
  <div class="admin-card-header">
    <h3>Total Users</h3>
    <span class="card-icon">👥</span>
  </div>
  <div class="admin-card-body">
    <p class="stat-value">1,234</p>
    <p class="stat-change">+12% this month</p>
  </div>
</div>
```

### Events Table
```html
<table class="admin-table">
  <thead>
    <tr>
      <th>Event Name</th>
      <th>Date</th>
      <th>Registrations</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <!-- Dynamic rows -->
  </tbody>
</table>
```

### Event Form Modal
```html
<div class="modal-overlay" id="event-modal">
  <div class="modal-content admin-modal">
    <h2>Create/Edit Event</h2>
    <form id="event-form">
      <input type="text" placeholder="Event Title" required>
      <textarea placeholder="Description" required></textarea>
      <input type="datetime-local" required>
      <input type="text" placeholder="Location">
      <input type="file" accept="image/*">
      <button type="submit">Save Event</button>
    </form>
  </div>
</div>
```

---

## API Functions

### Firebase Functions (JavaScript)

#### Check Admin Role
```javascript
async function isAdmin(userId) {
  try {
    const adminDoc = await getDoc(doc(db, 'admin_users', userId));
    if (adminDoc.exists()) {
      return adminDoc.data().role === 'admin' || adminDoc.data().role === 'super_admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}
```

#### Create Event
```javascript
async function createEvent(eventData) {
  try {
    const eventsRef = collection(db, 'events');
    const newEvent = {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isOpen: true,
      isFeatured: false
    };
    const docRef = await addDoc(eventsRef, newEvent);
    return docRef.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}
```

#### Get Event Registrations
```javascript
async function getEventRegistrations(eventId) {
  try {
    const registrationsRef = collection(db, 'event_registrations');
    const q = query(registrationsRef, where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching registrations:', error);
    throw error;
  }
}
```

#### Get Dashboard Statistics
```javascript
async function getDashboardStats() {
  try {
    const [usersSnapshot, eventsSnapshot, registrationsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'event_registrations'))
    ]);

    return {
      totalUsers: usersSnapshot.size,
      totalEvents: eventsSnapshot.size,
      totalRegistrations: registrationsSnapshot.size,
      activeEvents: eventsSnapshot.docs.filter(doc => doc.data().isOpen).length
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}
```

#### Export Data to CSV
```javascript
function exportToCSV(data, filename) {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

## Styling Recommendations

### Admin Dashboard Theme
- Use distinct color scheme from main site (e.g., dark theme, blue/admin colors)
- Clear visual hierarchy
- Responsive design for mobile/tablet access
- Consistent card/table styling

### CSS Classes Suggestions
```css
.admin-dashboard { }
.admin-card { }
.admin-table { }
.admin-modal { }
.admin-sidebar { }
.admin-nav { }
.stat-card { }
.export-btn { }
```

---

## Next Steps

1. **Initial Setup**: Create admin user manually in Firestore `admin_users` collection
2. **Build Login Page**: Implement `admin-login.html` with authentication
3. **Create Dashboard**: Build `admin-dashboard.html` with overview cards
4. **Event Management**: Implement CRUD operations for events
5. **User Management**: Add user viewing and filtering
6. **Analytics**: Add charts and statistics
7. **Security**: Implement and test Firestore security rules
8. **Testing**: Test all functionality thoroughly

---

## Additional Features (Future Enhancements)

1. **Email Notifications**: Send emails to registered users
2. **Bulk Actions**: Select multiple users/events for batch operations
3. **Activity Logs**: Track admin actions
4. **Advanced Filters**: Filter by date ranges, college, etc.
5. **Export Formats**: PDF, Excel exports
6. **Real-time Updates**: Use Firestore listeners for live data
7. **User Blocking**: Ability to block/disable users
8. **Event Capacity Management**: Set and manage event limits

---

## Notes

- Keep admin dashboard separate from main site styling for security
- Always verify admin permissions on every admin action
- Use Firebase Storage for event image uploads
- Consider implementing pagination for large datasets
- Add loading states and error handling throughout
- Test on mobile devices for responsive design

---

**End of Guide**

