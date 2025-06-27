import admin from 'firebase-admin';

// This file ensures the Firebase Admin SDK is initialized only once.
// A parameter-less initializeApp() is the recommended way for App Hosting,
// as it automatically uses the service account credentials from the environment.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized using environment credentials.");
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.stack);
    // If it's already initialized, we don't need to throw an error.
    if (!admin.apps.length) {
      throw new Error("Could not initialize Firebase Admin SDK.");
    }
  }
}

export const db = admin.firestore();
// The storage object will be instantiated within each API route that needs it
// to avoid potential state issues in the development environment.
export default admin;
