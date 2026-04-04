/**
 * Firestore Seed Script
 *
 * Populates Firestore with a demo organization, projects, and initiatives
 * for local development and staging environments.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *   npx tsx scripts/seed.ts --clear   # wipe existing seed data first
 *
 * Prerequisites:
 *   - FIREBASE_SERVICE_ACCOUNT or Application Default Credentials in .env.local
 */

import 'dotenv/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { InitiativeStatus, Sector } from '../types';

// ── Firebase Init ────────────────────────────────────────────────────────────

function initFirebase() {
  if (getApps().length) return;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    initializeApp({ credential: cert(JSON.parse(sa)) });
  } else {
    // Fall back to Application Default Credentials (gcloud auth)
    initializeApp();
  }
}

// ── Seed Data ────────────────────────────────────────────────────────────────

const SEED_ORG_ID = 'seed-org-demo';
const SEED_USER_ID = 'seed-user-admin';

const organization = {
  id: SEED_ORG_ID,
  name: 'Demo Organisation',
  ownerId: SEED_USER_ID,
  members: [
    { userId: SEED_USER_ID, role: 'admin' },
    { userId: 'seed-user-member', role: 'member' },
    { userId: 'seed-user-viewer', role: 'viewer' },
  ],
  _seeded: true,
};

const projects = [
  {
    id: 'seed-project-alpha',
    orgId: SEED_ORG_ID,
    name: 'Project Alpha',
    description: 'Core platform modernisation — Phase 1',
    _seeded: true,
  },
  {
    id: 'seed-project-beta',
    orgId: SEED_ORG_ID,
    name: 'Project Beta',
    description: 'AI feature expansion — multi-model orchestration',
    _seeded: true,
  },
];

const initiatives = [
  {
    id: 'seed-initiative-1',
    orgId: SEED_ORG_ID,
    projectId: 'seed-project-alpha',
    title: 'API v1 Router Refactor',
    description: 'Move all resource routes to versioned /api/v1 Express Router',
    status: InitiativeStatus.LIVE,
    sector: Sector.SAAS_CLOUD,
    owner: { name: 'Admin User', avatarUrl: '🧑‍💻' },
    readinessScore: 95,
    lastUpdated: new Date().toISOString(),
    _seeded: true,
  },
  {
    id: 'seed-initiative-2',
    orgId: SEED_ORG_ID,
    projectId: 'seed-project-alpha',
    title: 'Zod Input Validation',
    description: 'Add Zod schema validation to all POST/PUT endpoints',
    status: InitiativeStatus.LIVE,
    sector: Sector.SAAS_CLOUD,
    owner: { name: 'Admin User', avatarUrl: '🧑‍💻' },
    readinessScore: 100,
    lastUpdated: new Date().toISOString(),
    _seeded: true,
  },
  {
    id: 'seed-initiative-3',
    orgId: SEED_ORG_ID,
    projectId: 'seed-project-beta',
    title: 'Vector Memory Store',
    description: 'Per-org persistent vector memory with cosine similarity search',
    status: InitiativeStatus.IN_DEVELOPMENT,
    sector: Sector.SAAS_CLOUD,
    owner: { name: 'Member User', avatarUrl: '👷' },
    readinessScore: 70,
    lastUpdated: new Date().toISOString(),
    _seeded: true,
  },
  {
    id: 'seed-initiative-4',
    orgId: SEED_ORG_ID,
    projectId: 'seed-project-beta',
    title: 'OpenAPI / Swagger Spec',
    description: 'Auto-generated OpenAPI 3.1 spec with Swagger UI in dev mode',
    status: InitiativeStatus.PLANNING,
    sector: Sector.SAAS_CLOUD,
    owner: { name: 'Member User', avatarUrl: '👷' },
    readinessScore: 20,
    lastUpdated: new Date().toISOString(),
    _seeded: true,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function clearSeedData(db: ReturnType<typeof getFirestore>) {
  console.log('🗑  Clearing existing seed data...');
  const collections = ['organizations', 'projects', 'initiatives'];
  for (const col of collections) {
    const snap = await db.collection(col).where('_seeded', '==', true).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(`   Deleted ${snap.size} seeded docs from ${col}`);
  }
}

async function seedCollection<T extends { id: string }>(
  db: ReturnType<typeof getFirestore>,
  collectionName: string,
  docs: T[],
) {
  const batch = db.batch();
  for (const doc of docs) {
    const ref = db.collection(collectionName).doc(doc.id);
    batch.set(ref, { ...doc, seededAt: Timestamp.now() }, { merge: true });
  }
  await batch.commit();
  console.log(`✅  Seeded ${docs.length} docs into ${collectionName}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const shouldClear = process.argv.includes('--clear');

  initFirebase();
  const db = getFirestore();

  console.log('\n🌱 CogniSys BA — Firestore Seed Script\n');

  if (shouldClear) {
    await clearSeedData(db);
    console.log();
  }

  await seedCollection(db, 'organizations', [organization]);
  await seedCollection(db, 'projects', projects);
  await seedCollection(db, 'initiatives', initiatives);

  console.log('\n🎉 Seed complete!');
  console.log(`   Org ID  : ${SEED_ORG_ID}`);
  console.log(`   Projects: ${projects.length}`);
  console.log(`   Initiatives: ${initiatives.length}`);
  console.log('\n   Run with --clear to wipe seed data before re-seeding.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
