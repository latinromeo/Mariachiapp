
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration provided by you.
// This ensures the app is always connected to the correct Firebase project.
const firebaseConfig = {
  apiKey: "AIzaSyDXhKOt63UuXVBOQFXM6LgnpWQFwC5wJhs",
  authDomain: "mariachiappdefirebase.firebaseapp.com",
  projectId: "mariachiappdefirebase",
  storageBucket: "mariachiappdefirebase.appspot.com",
  messagingSenderId: "932231459466",
  appId: "1:932231459466:web:75998c80aba808c7f9b373",
  measurementId: "G-6SY8WZ5PF5"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
