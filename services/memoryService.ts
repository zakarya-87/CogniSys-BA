
import { TVectorMemory } from '../types';
import { getEmbedding } from './geminiService';
import { MathService } from './mathService';
import { openDB } from 'idb';

const DB_NAME = 'cognisys-memory-db';
const STORE_NAME = 'vector-memories';

/**
 * Local IndexedDB fallback — used when no orgId is available (unauthenticated).
 */
const getDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        },
    });
};

/**
 * The current org context — set by CatalystContext when user authenticates.
 * When set, all memory operations go through the server (Firestore).
 * When null, falls back to local IndexedDB.
 */
let _orgId: string | null = null;

export function setMemoryOrgContext(orgId: string | null) {
    _orgId = orgId;
}

export const MemoryService = {
    /**
     * Loads the memory store from IndexedDB (local fallback only).
     */
    async loadMemories(): Promise<TVectorMemory[]> {
        const db = await getDB();
        return await db.getAll(STORE_NAME);
    },

    /**
     * Saves the memory store to IndexedDB (local fallback only).
     */
    async saveMemories(memories: TVectorMemory[]) {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await Promise.all(memories.map(m => tx.store.put(m)));
        await tx.done;
    },

    /**
     * Adds a new memory.
     * - If orgId context is set: stores via server API (Firestore, multi-tenant).
     * - Otherwise: falls back to IndexedDB (single-user, client-only).
     */
    async addMemory(content: string, type: TVectorMemory['type'], metadata?: Record<string, unknown>): Promise<TVectorMemory> {
        const vector = await getEmbedding(content);

        if (_orgId) {
            // Server-side Firestore storage
            const response = await fetch(`/api/organizations/${_orgId}/memory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content, vector, type, metadata }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
                throw new Error(err.error ?? 'Memory store failed');
            }
            const data = await response.json() as { memory: TVectorMemory };
            return data.memory;
        }

        // Local IndexedDB fallback
        const newMemory: TVectorMemory = {
            id: `mem-${Date.now()}`,
            content,
            vector,
            type,
            timestamp: Date.now(),
            metadata
        };
        const db = await getDB();
        await db.put(STORE_NAME, newMemory);

        // Pruning: Keep only last 100 memories
        const all = await db.getAll(STORE_NAME);
        if (all.length > 100) {
            all.sort((a, b) => a.timestamp - b.timestamp);
            await db.delete(STORE_NAME, all[0].id);
        }

        return newMemory;
    },

    /**
     * Semantic search against the vector store.
     * - If orgId context is set: searches via server API (Firestore).
     * - Otherwise: falls back to local cosine similarity over IndexedDB.
     */
    async search(query: string, limit: number = 3): Promise<TVectorMemory[]> {
        const queryVector = await getEmbedding(query);

        if (_orgId) {
            // Server-side Firestore search
            const response = await fetch(`/api/organizations/${_orgId}/memory/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ vector: queryVector, limit }),
            });
            if (!response.ok) return [];
            const data = await response.json() as { results: TVectorMemory[] };
            return data.results;
        }

        // Local IndexedDB fallback
        const memories = await this.loadMemories();
        if (memories.length === 0) return [];

        const scoredMemories = memories.map(mem => ({
            ...mem,
            score: MathService.cosineSimilarity(queryVector, mem.vector)
        }));
        scoredMemories.sort((a, b) => b.score - a.score);
        return scoredMemories.slice(0, limit);
    },

    /**
     * Clear all memories (local IndexedDB only — use admin API for server-side).
     */
    async clear() {
        const db = await getDB();
        await db.clear(STORE_NAME);
    }
};
