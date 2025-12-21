/**
 * Firestore Configuration
 * Firebase Admin SDK setup with Firestore database
 */

import admin from 'firebase-admin';
import { config } from './env.js';

let db: admin.firestore.Firestore;
let initialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase() {
  if (initialized) {
    return db;
  }

  try {
    // Initialize Firebase Admin with service account
    if (config.firebase.serviceAccountKey) {
      // Production: Use service account key file
      const serviceAccount = JSON.parse(config.firebase.serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebase.projectId,
      });
    } else if (config.firebase.projectId) {
      // Development: Use application default credentials or emulator
      admin.initializeApp({
        projectId: config.firebase.projectId,
      });
    } else {
      throw new Error('Firebase configuration is missing');
    }

    db = admin.firestore();

    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    initialized = true;
    console.log('✅ Firestore initialized successfully');

    return db;
  } catch (error) {
    console.error('❌ Firestore initialization failed:', error);
    throw error;
  }
}

/**
 * Get Firestore instance
 */
export function getFirestore(): admin.firestore.Firestore {
  if (!db) {
    return initializeFirebase();
  }
  return db;
}

/**
 * Collection names
 */
export const Collections = {
  USERS: 'users',
  MEMBERS: 'members',
  TASKS: 'tasks',
  NOTES: 'notes',
  MESSAGES: 'messages',
  RESOURCES: 'resources',
  TAGS: 'tags',
  CHURCH_SETTINGS: 'church_settings',
  SERVICE_TIMES: 'service_times',
  STAGES: 'stages',
  AUTOMATION_RULES: 'automation_rules',
  INTEGRATION_CONFIGS: 'integration_configs',
} as const;

/**
 * Health check for Firestore
 */
export async function checkFirestoreHealth(): Promise<boolean> {
  try {
    const db = getFirestore();
    // Try to read a non-existent document to test connection
    await db.collection(Collections.USERS).limit(1).get();
    return true;
  } catch (error) {
    console.error('Firestore health check failed:', error);
    return false;
  }
}

/**
 * Helper to convert Firestore timestamp to ISO string
 */
export function timestampToISO(timestamp: admin.firestore.Timestamp | Date | string): string {
  if (timestamp instanceof admin.firestore.Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp;
}

/**
 * Helper to convert ISO string to Firestore timestamp
 */
export function isoToTimestamp(iso: string): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(new Date(iso));
}

/**
 * Batch write helper
 */
export async function batchWrite(
  operations: Array<{
    collection: string;
    id: string;
    data: any;
    operation: 'set' | 'update' | 'delete';
  }>
) {
  const db = getFirestore();
  const batch = db.batch();

  for (const op of operations) {
    const ref = db.collection(op.collection).doc(op.id);

    switch (op.operation) {
      case 'set':
        batch.set(ref, op.data);
        break;
      case 'update':
        batch.update(ref, op.data);
        break;
      case 'delete':
        batch.delete(ref);
        break;
    }
  }

  await batch.commit();
}

export { admin };
