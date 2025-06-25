
import admin from 'firebase-admin';

// This file ensures the Firebase Admin SDK is initialized only once.

if (!admin.apps.length) {
  try {
    // When running in a Google Cloud environment (like App Hosting),
    // the SDK automatically discovers service account credentials.
    admin.initializeApp();
  } catch (error: any) {
    // If running locally, you might need to set up GOOGLE_APPLICATION_CREDENTIALS
    // See: https://firebase.google.com/docs/admin/setup#initialize-sdk
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export default admin;
