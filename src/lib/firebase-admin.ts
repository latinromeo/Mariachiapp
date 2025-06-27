import admin from 'firebase-admin';

// This file ensures the Firebase Admin SDK is initialized only once.

if (!admin.apps.length) {
  try {
    // When running in a Google Cloud environment (like App Hosting),
    // the SDK automatically discovers service account credentials and project info.
    // Initializing without arguments is the most robust method in this environment.
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized successfully using environment credentials.");
  } catch (error: any) {
    // If running locally, you might need to set up GOOGLE_APPLICATION_CREDENTIALS
    // See: https://firebase.google.com/docs/admin/setup#initialize-sdk
    console.error('Firebase admin initialization error. For local development, ensure GOOGLE_APPLICATION_CREDENTIALS is set. Error:', error.stack);
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export default admin;
