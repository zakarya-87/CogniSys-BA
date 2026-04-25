import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use named database if specified in config, otherwise use the default database
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);

// In dev (http://localhost) Edge Tracking Prevention blocks cross-site storage
// access from Firebase's GAPI iframe, preventing auth state from persisting.
// browserSessionPersistence uses same-origin sessionStorage — not blocked by
// tracking prevention. In prod use browserLocalPersistence (stays across tabs).
const isDev = import.meta.env.DEV ?? process.env.NODE_ENV === 'development';
setPersistence(auth, isDev ? browserSessionPersistence : browserLocalPersistence)
  .catch(() => {/* ignore — falls back to default */});

// ── Auth Providers ────────────────────────────────────────────────────────────
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// ── Auth helpers ──────────────────────────────────────────────────────────────
export { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged };
export type { FirebaseUser };
