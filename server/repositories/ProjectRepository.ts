import { BaseRepository } from './BaseRepository';
import { TProject } from '../../types';
import { getAdminDb } from '../lib/firebaseAdmin';

export class ProjectRepository extends BaseRepository<TProject> {
  constructor() {
    super('projects');
  }

  async getByOrgId(orgId: string): Promise<TProject[]> {
    const querySnapshot = await getAdminDb()
      .collection(this.collectionName)
      .where('orgId', '==', orgId)
      .orderBy('lastUpdated', 'desc')
      .get();
    return querySnapshot.docs.map(doc => doc.data() as TProject);
  }

  async getByOrgIdPaginated(orgId: string, limit: number, cursor?: string): Promise<{ data: TProject[]; nextCursor: string | null }> {
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
  }
}
