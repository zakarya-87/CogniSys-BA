import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Lazy initialization — runs on first use, AFTER dotenv has loaded env vars
function ensureApp() {
  if (getApps().length) return getApp();

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccount) {
      const parsed = JSON.parse(serviceAccount);
      const projectId = parsed.project_id ?? firebaseConfig.projectId;
      const app = initializeApp({
        credential: cert(parsed),
        projectId,
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
      console.log(`Firebase Admin initialized with Service Account (project: ${projectId}).`);
      return app;
    }

    console.log('Firebase Admin initialized with default credentials.');
    return initializeApp({ projectId: firebaseConfig.projectId });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return initializeApp({ projectId: firebaseConfig.projectId });
  }
}

let db: Firestore;
let auth: Auth;

export const getAdminDb = () => {
  ensureApp();
  if (!db) {
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    db = dbId ? getFirestore(dbId) : getFirestore();
  }
  return db;
};

export const getAdminAuth = () => {
  ensureApp();
  if (!auth) auth = getAuth();
  return auth;
};


