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

  async getByProjectIdPaginated(projectId: string, limit: number, cursor?: string): Promise<{ data: TInitiative[]; nextCursor: string | null }> {
    return this.getPaginated({
      where: [['projectId', '==', projectId]],
      limit,
      cursor
    });
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
    return this.getPaginated({
      where: [['orgId', '==', orgId]],
      limit,
      cursor
    });
  }
}
