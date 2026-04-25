/**
 * Client-side Firestore service — CRUD wrappers for initiatives,
 * organizations, and projects. Uses the Firebase client SDK (not Admin).
 * All writes go through the server API for RBAC enforcement;
 * reads use Firestore client directly with security rules.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { TInitiative, TOrganization, TProject, TActivity } from '../types';

// ── Initiatives ──────────────────────────────────────────────────────────────

export const firestoreGetInitiative = async (id: string): Promise<TInitiative | null> => {
  const snap = await getDoc(doc(db, 'initiatives', id));
  return snap.exists() ? (snap.data() as TInitiative) : null;
};

export const firestoreGetInitiativesByOrg = async (orgId: string): Promise<TInitiative[]> => {
  const q = query(collection(db, 'initiatives'), where('orgId', '==', orgId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as TInitiative);
};

export const firestoreSetInitiative = async (initiative: TInitiative): Promise<void> => {
  await setDoc(doc(db, 'initiatives', initiative.id), { ...initiative, updatedAt: new Date().toISOString() });
};

export const firestoreUpdateInitiative = async (id: string, data: Partial<TInitiative>): Promise<void> => {
  await updateDoc(doc(db, 'initiatives', id), { ...data, updatedAt: new Date().toISOString() });
};

export const firestoreDeleteInitiative = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'initiatives', id));
};

/** Real-time listener — calls onChange whenever initiatives change for an org */
export const firestoreWatchInitiatives = (
  orgId: string,
  onChange: (initiatives: TInitiative[]) => void
): Unsubscribe => {
  const q = query(collection(db, 'initiatives'), where('orgId', '==', orgId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    onChange(snap.docs.map(d => d.data() as TInitiative));
  });
};

// ── Organizations ─────────────────────────────────────────────────────────────

export const firestoreGetOrganization = async (orgId: string): Promise<TOrganization | null> => {
  const snap = await getDoc(doc(db, 'organizations', orgId));
  return snap.exists() ? (snap.data() as TOrganization) : null;
};

export const firestoreSetOrganization = async (org: TOrganization): Promise<void> => {
  await setDoc(doc(db, 'organizations', org.id), { ...org, updatedAt: new Date().toISOString() });
};

/** Real-time listener for a single organization */
export const firestoreWatchOrganization = (
  orgId: string,
  onChange: (org: TOrganization | null) => void
): Unsubscribe => {
  return onSnapshot(doc(db, 'organizations', orgId), snap => {
    onChange(snap.exists() ? (snap.data() as TOrganization) : null);
  });
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const firestoreGetProjectsByOrg = async (orgId: string): Promise<TProject[]> => {
  const q = query(collection(db, 'projects'), where('orgId', '==', orgId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as TProject);
};

export const firestoreSetProject = async (project: TProject): Promise<void> => {
  await setDoc(doc(db, 'projects', project.id), { ...project, updatedAt: new Date().toISOString() });
};

/** Real-time listener — calls onChange whenever projects change for an org */
export const firestoreWatchProjects = (
  orgId: string,
  onChange: (projects: TProject[]) => void
): Unsubscribe => {
  const q = query(collection(db, 'projects'), where('orgId', '==', orgId));
  return onSnapshot(q, snap => {
    onChange(snap.docs.map(d => d.data() as TProject));
  });
};

// ── User preferences ──────────────────────────────────────────────────────────

export const firestoreGetUserPrefs = async (userId: string): Promise<Record<string, unknown> | null> => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
};

export const firestoreSetUserPrefs = async (userId: string, prefs: Record<string, unknown>): Promise<void> => {
  await setDoc(doc(db, 'users', userId), { ...prefs, updatedAt: new Date().toISOString() }, { merge: true });
};

// ── Activities ────────────────────────────────────────────────────────────────

/** Real-time listener — calls onChange whenever activities change for an org */
export const firestoreWatchActivities = (
  orgId: string,
  onChange: (activities: TActivity[]) => void,
  limitNum = 50
): Unsubscribe => {
  const q = query(
    collection(db, 'activities'), 
    where('orgId', '==', orgId), 
    orderBy('timestamp', 'desc'),
    limit(limitNum)
  );
  return onSnapshot(q, snap => {
    onChange(snap.docs.map(d => d.data() as TActivity));
  });
};

// ── Hive States ──────────────────────────────────────────────────────────────

/** Real-time listener for hive agent state */
export const firestoreWatchHiveState = (
  initiativeId: string,
  onChange: (state: any) => void
): Unsubscribe => {
  return onSnapshot(doc(db, 'hive_states', initiativeId), (snap) => {
    onChange(snap.exists() ? snap.data() : null);
  });
};

export const firestoreSetHiveState = async (initiativeId: string, state: any): Promise<void> => {
  await setDoc(doc(db, 'hive_states', initiativeId), { ...state, updatedAt: new Date().toISOString() });
};

export const firestoreDeleteHiveState = async (initiativeId: string): Promise<void> => {
  await deleteDoc(doc(db, 'hive_states', initiativeId));
};
