// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Esta configuración asegura que la app de admin se inicialice una sola vez.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.message);
  }
}

// Exportamos la instancia de la base de datos para usarla en todo el backend.
const db = admin.firestore();

export { db };
