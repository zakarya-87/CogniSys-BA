import { BaseRepository } from './BaseRepository';
import { TProject } from '../../types';
import { getAdminDb } from '../lib/firebaseAdmin';

export class ProjectRepository extends BaseRepository<TProject> {
  constructor() {
    super('projects');
  }

  async getByOrgId(orgId: string): Promise<TProject[]> {
    try {
      const querySnapshot = await getAdminDb()
        .collection(this.collectionName)
        .where('orgId', '==', orgId)
        .orderBy('lastUpdated', 'desc')
        .get();
      return querySnapshot.docs.map(doc => doc.data() as TProject);
    } catch (err: any) {
      // Fallback: if the composite index is missing, query without orderBy
      if (err?.code === 9 || err?.message?.includes('index')) {
        console.warn('ProjectRepository.getByOrgId: composite index missing, falling back to unordered query');
        const querySnapshot = await getAdminDb()
          .collection(this.collectionName)
          .where('orgId', '==', orgId)
          .get();
        const docs = querySnapshot.docs.map(doc => doc.data() as TProject);
        return docs.sort((a, b) => (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? ''));
      }
      throw err;
    }
  }

  async getByOrgIdPaginated(orgId: string, limit: number, cursor?: string): Promise<{ data: TProject[]; nextCursor: string | null }> {
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
      const data = snapshot.docs.map(doc => doc.data() as TProject);
      const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;
      return { data, nextCursor };
    } catch (err: any) {
      // Fallback: if the composite index is missing, query without orderBy and sort in-memory
      if (err?.code === 9 || err?.message?.includes('index')) {
        console.warn('ProjectRepository.getByOrgIdPaginated: composite index missing, falling back to unordered query');
        const querySnapshot = await getAdminDb()
          .collection(this.collectionName)
          .where('orgId', '==', orgId)
          .get();
        const all = querySnapshot.docs.map(doc => doc.data() as TProject);
        all.sort((a, b) => (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? ''));
        const data = all.slice(0, limit);
        const nextCursor = all.length > limit ? all[limit - 1].id : null;
        return { data, nextCursor };
      }
      throw err;
    }
  }
}
