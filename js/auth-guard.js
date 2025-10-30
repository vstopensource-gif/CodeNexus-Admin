import { auth } from './firebase-app.js';
import { onAuthStateChanged, signOut as fbSignOut } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';

const ADMIN_EMAIL = 'vstopensource@gmail.com';

export function requireAdmin() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        await fbSignOut(auth).catch(() => {});
        window.location.href = 'admin-login.html';
        return;
      }
      resolve(user);
    });
  });
}

export function getCurrentAdmin() {
  return auth.currentUser;
}

export async function signOut() {
  await fbSignOut(auth);
  window.location.href = 'admin-login.html';
}


