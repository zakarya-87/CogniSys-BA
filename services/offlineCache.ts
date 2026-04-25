/**
 * Offline cache service using IndexedDB via `idb` library.
 * Implements stale-while-revalidate pattern.
 */
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CogniSysDB extends DBSchema {
  initiatives: {
    key: string;
    value: { id: string; data: any; updatedAt: number };
    indexes: { 'by-updated': number };
  };
  artifacts: {
    key: string;
    value: { id: string; data: any; type: string; updatedAt: number };
    indexes: { 'by-type': string; 'by-updated': number };
  };
  hiveState: {
    key: string;
    value: { id: string; data: any; updatedAt: number };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'cognisys-ba-cache';
const DB_VERSION = 1;
const MAX_ARTIFACTS = 500;

let dbInstance: IDBPDatabase<CogniSysDB> | null = null;

async function getDB(): Promise<IDBPDatabase<CogniSysDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<CogniSysDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const initStore = db.createObjectStore('initiatives', { keyPath: 'id' });
      initStore.createIndex('by-updated', 'updatedAt');

      const artStore = db.createObjectStore('artifacts', { keyPath: 'id' });
      artStore.createIndex('by-type', 'type');
      artStore.createIndex('by-updated', 'updatedAt');

      db.createObjectStore('hiveState', { keyPath: 'id' });
      db.createObjectStore('settings');
    },
  });
  return dbInstance;
}

export async function cacheInitiative(id: string, data: any): Promise<void> {
  const db = await getDB();
  await db.put('initiatives', { id, data, updatedAt: Date.now() });
}

export async function cacheInitiatives(items: Array<{ id: string; [key: string]: any }>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('initiatives', 'readwrite');
  for (const item of items) {
    tx.store.put({ id: item.id, data: item, updatedAt: Date.now() });
  }
  await tx.done;
}

export async function getCachedInitiatives(): Promise<any[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('initiatives', 'by-updated');
  return all.map(entry => entry.data).reverse();
}

export async function removeCachedInitiative(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('initiatives', id);
}

export async function cacheArtifact(id: string, data: any, type: string): Promise<void> {
  const db = await getDB();
  await db.put('artifacts', { id, data, type, updatedAt: Date.now() });
  await evictOldArtifacts();
}

export async function getCachedArtifacts(type?: string): Promise<any[]> {
  const db = await getDB();
  if (type) {
    const items = await db.getAllFromIndex('artifacts', 'by-type', type);
    return items.map(e => e.data);
  }
  const all = await db.getAllFromIndex('artifacts', 'by-updated');
  return all.map(e => e.data).reverse();
}

async function evictOldArtifacts(): Promise<void> {
  const db = await getDB();
  const count = await db.count('artifacts');
  if (count <= MAX_ARTIFACTS) return;
  const oldest = await db.getAllFromIndex('artifacts', 'by-updated');
  const toRemove = oldest.slice(0, count - MAX_ARTIFACTS);
  const tx = db.transaction('artifacts', 'readwrite');
  for (const item of toRemove) {
    tx.store.delete(item.id);
  }
  await tx.done;
}

export async function cacheHiveState(id: string, data: any): Promise<void> {
  const db = await getDB();
  await db.put('hiveState', { id, data, updatedAt: Date.now() });
}

export async function getCachedHiveState(id: string): Promise<any | null> {
  const db = await getDB();
  const entry = await db.get('hiveState', id);
  return entry?.data ?? null;
}

export async function setSetting(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}

export async function getSetting<T = any>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get('settings', key) as Promise<T | undefined>;
}

export async function clearAllCaches(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['initiatives', 'artifacts', 'hiveState', 'settings'], 'readwrite');
  await Promise.all([
    tx.objectStore('initiatives').clear(),
    tx.objectStore('artifacts').clear(),
    tx.objectStore('hiveState').clear(),
    tx.objectStore('settings').clear(),
    tx.done,
  ]);
}

export async function getCacheStats(): Promise<{ initiatives: number; artifacts: number }> {
  const db = await getDB();
  return {
    initiatives: await db.count('initiatives'),
    artifacts: await db.count('artifacts'),
  };
}
