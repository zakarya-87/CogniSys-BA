# Migrations

This directory contains Firestore data migration scripts — one-time transformations
applied when the data model changes.

## Naming convention

```
YYYYMMDD_NNN_short-description.ts
```

Example:
```
20260401_001_add-org-members-array.ts
20260410_002_rename-initiative-status.ts
```

## Running a migration

```bash
npx tsx migrations/20260401_001_add-org-members-array.ts
```

Each migration script must be:
- **Idempotent** — safe to run more than once
- **Self-contained** — initialises its own Firebase connection
- **Logged** — prints what it changed and how many documents it affected

## Template

```ts
import 'dotenv/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initFirebase() {
  if (getApps().length) return;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  sa ? initializeApp({ credential: cert(JSON.parse(sa)) }) : initializeApp();
}

async function migrate() {
  initFirebase();
  const db = getFirestore();

  // TODO: implement migration
  // e.g. const snap = await db.collection('organizations').get();
  //      const batch = db.batch();
  //      snap.docs.forEach(d => batch.update(d.ref, { newField: 'default' }));
  //      await batch.commit();

  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
```

## Tracking

Migrations are tracked manually. After running a migration in production, note it in
the table below:

| Migration | Applied (prod) | Applied (staging) | Notes |
|---|---|---|---|
| _(none yet)_ | — | — | — |
