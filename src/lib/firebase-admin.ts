
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Check if the app is already initialized to prevent errors in hot-reloading environments
if (!admin.apps.length) {
  admin.initializeApp({
    // The projectId should be automatically detected in the Firebase environment
    // If not, you might need to specify it:
    // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const adminDb = getFirestore();

export { adminDb };
