// Firebase configuration using compat mode (CDN)
const firebaseConfig = {
  apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta?.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta?.env?.VITE_FIREBASE_APP_ID,
  // Optional: only if provided in env
  measurementId: import.meta?.env?.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (compat mode)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
