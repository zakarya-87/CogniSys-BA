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
    return this.getPaginated({
      where: [['orgId', '==', orgId]],
      limit,
      cursor
    });
  }
}
