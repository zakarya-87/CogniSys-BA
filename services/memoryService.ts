
import { TVectorMemory } from '../types';
import { getEmbedding } from './geminiService';
import { MathService } from './mathService';
import { openDB } from 'idb';

const DB_NAME = 'cognisys-memory-db';
const STORE_NAME = 'vector-memories';

const getDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        },
    });
};

export const MemoryService = {
    /**
     * Loads the memory store from IndexedDB.
     */
    async loadMemories(): Promise<TVectorMemory[]> {
        const db = await getDB();
        return await db.getAll(STORE_NAME);
    },

    /**
     * Saves the memory store to IndexedDB.
     */
    async saveMemories(memories: TVectorMemory[]) {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await Promise.all(memories.map(m => tx.store.put(m)));
        await tx.done;
    },

    /**
     * Adds a new memory. Generates embedding and persists.
     */
    async addMemory(content: string, type: TVectorMemory['type'], metadata?: any): Promise<TVectorMemory> {
        const vector = await getEmbedding(content);
        
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
     * Returns top N most relevant memories.
     */
    async search(query: string, limit: number = 3): Promise<TVectorMemory[]> {
        const queryVector = await getEmbedding(query);
        const memories = await this.loadMemories();

        if (memories.length === 0) return [];

        // Calculate similarities
        const scoredMemories = memories.map(mem => ({
            ...mem,
            score: MathService.cosineSimilarity(queryVector, mem.vector)
        }));

        // Sort by score descending
        scoredMemories.sort((a, b) => b.score - a.score);

        return scoredMemories.slice(0, limit);
    },

    /**
     * Clear all memories (for testing/reset).
     */
    async clear() {
        const db = await getDB();
        await db.clear(STORE_NAME);
    }
};
