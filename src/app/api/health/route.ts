
import { NextRequest, NextResponse } from 'next/server';
import admin, { db } from '@/lib/firebase-admin';

// This endpoint acts as a health check for the backend server and its connection to Firebase services.
export async function GET(req: NextRequest) {
    let dbStatus = 'ok';
    let storageStatus = 'ok';
    let dbError = null;
    let storageError = null;

    // --- Check Firestore Connection ---
    try {
        // Perform a simple read operation to verify connection and permissions.
        await db.collection('health_checks').doc('last_check').get();
    } catch (error: any) {
        dbStatus = 'error';
        dbError = error.message || 'An unknown Firestore error occurred.';
        console.error("Health Check - Firestore Error:", error);
    }

    // --- Check Storage Connection ---
    try {
        // Get the metadata of a non-existent file to verify bucket access without creating files.
        const storage = admin.storage();
        const bucket = storage.bucket("mariachi-app-ygp7h.appspot.com");
        await bucket.file('health_check_test.txt').getMetadata().catch(e => {
            // We expect a "Not Found" error (code 404), which means we successfully communicated with the bucket.
            if (e.code !== 404) {
                // Any other error indicates a problem.
                throw e;
            }
        });
    } catch (error: any) {
        storageStatus = 'error';
        storageError = error.message || 'An unknown Storage error occurred.';
        console.error("Health Check - Storage Error:", error);
    }

    const isHealthy = dbStatus === 'ok' && storageStatus === 'ok';
    const status = isHealthy ? 200 : 503; // 503 Service Unavailable

    return NextResponse.json(
      {
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
        checks: {
          firestore: {
            status: dbStatus,
            error: dbError,
          },
          storage: {
            status: storageStatus,
            error: storageError,
          },
        },
        message: isHealthy ? 'Backend and Firebase services are connected.' : 'One or more backend services are experiencing issues.'
      },
      { status }
    );
}
