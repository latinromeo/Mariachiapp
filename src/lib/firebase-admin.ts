import admin from 'firebase-admin';

// This file ensures the Firebase Admin SDK is initialized only once.

if (!admin.apps.length) {
  try {
    // Forcing explicit configuration is more robust in some environments.
    // This directly tells the SDK which project and bucket to use.
    admin.initializeApp({
      projectId: "mariachi-app-ygp7h",
      storageBucket: "mariachi-app-ygp7h.appspot.com"
    });
    console.log("Firebase Admin SDK initialized successfully with explicit config.");
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.stack);
    // If it's already initialized, we don't need to throw an error.
    if (!admin.apps.length) {
      throw new Error("Could not initialize Firebase Admin SDK.");
    }
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export default admin;
