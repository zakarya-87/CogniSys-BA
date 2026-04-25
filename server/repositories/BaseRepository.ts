import { getAdminDb } from '../lib/firebaseAdmin';
import { toErrorInfo } from '../utils/errorHandler';
import type { DocumentData, Query, QueryDocumentSnapshot, WithFieldValue } from 'firebase-admin/firestore';

export abstract class BaseRepository<T extends DocumentData> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getById(id: string): Promise<T | null> {
    const docRef = getAdminDb().collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();
    return docSnap.exists ? (docSnap.data() as T) : null;
  }

  async create(id: string, data: WithFieldValue<T>): Promise<void> {
    await getAdminDb().collection(this.collectionName).doc(id).set(data);
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await getAdminDb().collection(this.collectionName).doc(id).update(data as DocumentData);
  }

  async delete(id: string): Promise<void> {
    await getAdminDb().collection(this.collectionName).doc(id).delete();
  }

  /**
   * Standardized pagination helper for Firestore collections.
   */
  async getPaginated(params: {
    where?: [string, '==' | '<' | '>' | '<=' | '>=', unknown][];
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limit: number;
    cursor?: string;
  }): Promise<{ data: T[]; nextCursor: string | null }> {
    const { where = [], orderByField = 'lastUpdated', orderDirection = 'desc', limit, cursor } = params;

    try {
      let query: Query<DocumentData> = getAdminDb().collection(this.collectionName);

      for (const [field, op, val] of where) {
        query = query.where(field, op, val);
      }

      query = query.orderBy(orderByField, orderDirection).limit(limit);

      if (cursor) {
        const lastDoc = await getAdminDb().collection(this.collectionName).doc(cursor).get();
        if (!lastDoc.exists) {
          throw new Error(`Pagination cursor document '${cursor}' not found. It may have been deleted.`);
        }
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const data = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as T);
      const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;
      
      return { data, nextCursor };
    } catch (err: unknown) {
      // Standard Fallback: Composite index missing (Error Code 9)
      const info = toErrorInfo(err);
      if (info.code === 9 || info.message?.includes('index')) {
        console.warn(`${this.collectionName} Repository: composite index missing, falling back to in-memory sort`);
        
        let query: Query<DocumentData> = getAdminDb().collection(this.collectionName);
        for (const [field, op, val] of where) {
          query = query.where(field, op, val);
        }
        // Cap fallback to avoid fetching unbounded data
        query = query.limit(500);
        
        const snapshot = await query.get();
        const all = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as T);
        
        // In-memory sort
        all.sort((a, b) => {
          const valA = a[orderByField] ?? '';
          const valB = b[orderByField] ?? '';
          return orderDirection === 'desc' 
            ? String(valB).localeCompare(String(valA))
            : String(valA).localeCompare(String(valB));
        });

        let startIndex = 0;
        if (cursor) {
          const cursorIndex = all.findIndex((item) => (item as Record<string, unknown>).id === cursor);
          if (cursorIndex !== -1) startIndex = cursorIndex + 1;
        }

        const data = all.slice(startIndex, startIndex + limit);
        const nextCursor = startIndex + limit < all.length ? data[data.length - 1]?.id ?? null : null;
        
        return { data, nextCursor };
      }
      throw err;
    }
  }
}
