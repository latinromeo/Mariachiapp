
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration provided by you.
// This ensures the app is always connected to the correct Firebase project.
const firebaseConfig = {
  apiKey: "AIzaSyDXhKOt63UuXVBOQFXM6LgnpWQFwC5wJhs",
  authDomain: "mariachi-app-ygp7h.firebaseapp.com",
  projectId: "mariachi-app-ygp7h",
  storageBucket: "mariachi-app-ygp7h.appspot.com",
  messagingSenderId: "932231459466",
  appId: "1:932231459466:web:75998c80aba808c7f9b373",
  measurementId: "G-6SY8WZ5PF5"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Analytics has been removed from this file to prevent server-side errors.
// If needed, it should be initialized only within client-side components.

export { app, db };
