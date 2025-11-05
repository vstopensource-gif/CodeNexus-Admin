const ADMIN_EMAIL = "vstopensource@gmail.com";

// Google Sign-In
async function signInWithGoogle() {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    
    // Check if email matches admin email
    if (user.email !== ADMIN_EMAIL) {
      await auth.signOut();
      throw new Error('Access denied. Only vstopensource@gmail.com can access this dashboard.');
    }
    
    // Store session
    localStorage.setItem('admin_session', JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      timestamp: Date.now()
    }));
    
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

// Sign out
async function adminSignOut() {
  try {
    await auth.signOut();
    localStorage.removeItem('admin_session');
    window.location.href = 'admin-login.html';
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Check auth state
function checkAuthState(callback) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Verify email matches
      if (user.email !== ADMIN_EMAIL) {
        await adminSignOut();
        callback(false);
        return;
      }
      callback(true, user);
    } else {
      callback(false);
    }
  });
}

// Get current admin user
function getCurrentAdmin() {
  return auth.currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
  const session = localStorage.getItem('admin_session');
  if (!session) return false;
  
  try {
    const sessionData = JSON.parse(session);
    // Session expires after 24 hours
    if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('admin_session');
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}
