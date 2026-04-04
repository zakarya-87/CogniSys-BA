/**
 * services/firebase.ts
 *
 * Single-source auth helpers — re-exports from the root firebase.ts so there
 * is only ONE Firebase app instance across the whole client bundle.
 */
export {
  auth,
  db,
  githubProvider,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from '../firebase';
export type { FirebaseUser } from '../firebase';

