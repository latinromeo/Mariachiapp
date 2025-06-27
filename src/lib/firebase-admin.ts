import admin from 'firebase-admin';

// This file ensures the Firebase Admin SDK is initialized only once.
const projectId = 'mariachi-app-ygp7h';
const storageBucket = `${projectId}.appspot.com`;

if (!admin.apps.length) {
  try {
    // When running in a Google Cloud environment (like App Hosting),
    // the SDK automatically discovers service account credentials.
    // Explicitly providing the projectId and storageBucket makes the initialization more robust.
    admin.initializeApp({
      projectId: projectId,
      storageBucket: storageBucket,
    });
    console.log("Firebase Admin SDK initialized successfully for project:", projectId);
  } catch (error: any) {
    // If running locally, you might need to set up GOOGLE_APPLICATION_CREDENTIALS
    // See: https://firebase.google.com/docs/admin/setup#initialize-sdk
    console.error('Firebase admin initialization error. Ensure you have the correct permissions and the project ID is correct.', error.stack);
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export default admin;
