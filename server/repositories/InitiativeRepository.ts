import { BaseRepository } from './BaseRepository';
import { TInitiative } from '../../types';
import { getAdminDb } from '../lib/firebaseAdmin';

export class InitiativeRepository extends BaseRepository<TInitiative> {
  constructor() {
    super('initiatives');
  }

  async getByProjectId(projectId: string): Promise<TInitiative[]> {
    const querySnapshot = await getAdminDb().collection(this.collectionName).where('projectId', '==', projectId).get();
    return querySnapshot.docs.map(doc => doc.data() as TInitiative);
  }

  async getByOrgId(orgId: string): Promise<TInitiative[]> {
    try {
      const querySnapshot = await getAdminDb()
        .collection(this.collectionName)
        .where('orgId', '==', orgId)
        .orderBy('lastUpdated', 'desc')
        .get();
      return querySnapshot.docs.map(doc => doc.data() as TInitiative);
    } catch (err: any) {
      // Fallback: if the composite index is missing, query without orderBy
      if (err?.code === 9 || err?.message?.includes('index')) {
        console.warn('InitiativeRepository.getByOrgId: composite index missing, falling back to unordered query');
        const querySnapshot = await getAdminDb()
          .collection(this.collectionName)
          .where('orgId', '==', orgId)
          .get();
        const docs = querySnapshot.docs.map(doc => doc.data() as TInitiative);
        return docs.sort((a, b) => (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? ''));
      }
      throw err;
    }
  }

  async getByOrgIdPaginated(orgId: string, limit: number, cursor?: string): Promise<{ data: TInitiative[]; nextCursor: string | null }> {
    try {
      let query = getAdminDb()
        .collection(this.collectionName)
        .where('orgId', '==', orgId)
        .orderBy('lastUpdated', 'desc')
        .limit(limit);

      if (cursor) {
        const lastDoc = await getAdminDb().collection(this.collectionName).doc(cursor).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();
      const data = snapshot.docs.map(doc => doc.data() as TInitiative);
      const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;
      return { data, nextCursor };
    } catch (err: any) {
      // Fallback: if the composite index is missing, query without orderBy and sort in-memory
      if (err?.code === 9 || err?.message?.includes('index')) {
        console.warn('InitiativeRepository.getByOrgIdPaginated: composite index missing, falling back to unordered query');
        const querySnapshot = await getAdminDb()
          .collection(this.collectionName)
          .where('orgId', '==', orgId)
          .get();
        const all = querySnapshot.docs.map(doc => doc.data() as TInitiative);
        all.sort((a, b) => (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? ''));

        let startIndex = 0;
        if (cursor) {
          const cursorIndex = all.findIndex(item => item.id === cursor);
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
