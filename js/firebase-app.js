// Firebase v9 modular initialization (ES modules)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBj-vPEk306lnMLsVtTFMC9G5W3cJr3MwA",
  authDomain: "codenexus-b58ae.firebaseapp.com",
  projectId: "codenexus-b58ae",
  storageBucket: "codenexus-b58ae.firebasestorage.app",
  messagingSenderId: "454472605265",
  appId: "1:454472605265:web:616082e4584842f1d5e270",
  measurementId: "G-55M0FPM6JX"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();


