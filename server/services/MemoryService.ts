/**
 * Server-side vector memory service using Firestore Admin SDK.
 * Stores embeddings in /organizations/{orgId}/memories/{memId}
 * and performs cosine-similarity search server-side.
 *
 * This replaces the client-only IndexedDB implementation with a
 * multi-tenant, persistent backend store.
 */
import { getAdminDb } from '../lib/firebaseAdmin';
import { logger } from '../logger';

export interface VectorMemory {
  id: string;
  orgId: string;
  content: string;
  vector: number[];
  type: 'fact' | 'decision' | 'insight';
  timestamp: number;
  metadata?: Record<string, unknown>;
  score?: number;
}

const MAX_MEMORIES_PER_ORG = 200;

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const ServerMemoryService = {
  /**
   * Store a new memory. Prunes oldest when limit is exceeded.
   */
  async addMemory(
    orgId: string,
    content: string,
    vector: number[],
    type: VectorMemory['type'],
    metadata?: Record<string, unknown>
  ): Promise<VectorMemory> {
    const db = getAdminDb();
    const col = db.collection('organizations').doc(orgId).collection('memories');

    const memory: VectorMemory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orgId,
      content,
      vector,
      type,
      timestamp: Date.now(),
      metadata,
    };

    await col.doc(memory.id).set(memory);
    logger.info({ orgId, memId: memory.id, type }, 'Vector memory stored');

    // Prune: keep only the last MAX_MEMORIES_PER_ORG entries
    const all = await col.orderBy('timestamp', 'asc').get();
    if (all.size > MAX_MEMORIES_PER_ORG) {
      const toDelete = all.docs.slice(0, all.size - MAX_MEMORIES_PER_ORG);
      const batch = db.batch();
      toDelete.forEach(d => batch.delete(d.ref));
      await batch.commit();
      logger.info({ orgId, pruned: toDelete.length }, 'Pruned old vector memories');
    }

    return memory;
  },

  /**
   * Semantic search: compare query vector against all stored memories,
   * return top N by cosine similarity.
   */
  async search(
    orgId: string,
    queryVector: number[],
    limit = 5
  ): Promise<VectorMemory[]> {
    const db = getAdminDb();
    const snapshot = await db
      .collection('organizations')
      .doc(orgId)
      .collection('memories')
      .orderBy('timestamp', 'desc')
      .limit(500) // scan latest 500 for similarity
      .get();

    if (snapshot.empty) return [];

    const scored = snapshot.docs
      .map(d => {
        const mem = d.data() as VectorMemory;
        return { ...mem, score: cosineSimilarity(queryVector, mem.vector) };
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return scored.slice(0, limit);
  },

  /**
   * Clear all memories for an org (admin/testing only).
   */
  async clear(orgId: string): Promise<number> {
    const db = getAdminDb();
    const col = db.collection('organizations').doc(orgId).collection('memories');
    const snapshot = await col.get();
    const batch = db.batch();
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    logger.info({ orgId, count: snapshot.size }, 'Cleared vector memories');
    return snapshot.size;
  },
};
