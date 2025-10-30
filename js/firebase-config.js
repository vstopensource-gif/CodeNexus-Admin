// Firebase configuration using compat mode (CDN)
const firebaseConfig = {
  apiKey: "AIzaSyBj-vPEk306lnMLsVtTFMC9G5W3cJr3MwA",
  authDomain: "codenexus-b58ae.firebaseapp.com",
  projectId: "codenexus-b58ae",
  storageBucket: "codenexus-b58ae.firebasestorage.app",
  messagingSenderId: "454472605265",
  appId: "1:454472605265:web:616082e4584842f1d5e270",
  measurementId: "G-55M0FPM6JX"
};

// Initialize Firebase (compat mode)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
