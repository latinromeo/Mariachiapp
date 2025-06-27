import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

// This file ensures the Firebase Admin SDK is initialized only once.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized using environment credentials.");
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.stack);
    if (!admin.apps.length) {
      throw new Error("Could not initialize Firebase Admin SDK.");
    }
  }
}

export const db = admin.firestore();

// Initialize the @google-cloud/storage client directly.
// It should also pick up the Application Default Credentials from the environment.
export const storage = new Storage();

export default admin;
