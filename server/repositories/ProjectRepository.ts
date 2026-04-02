import { BaseRepository } from './BaseRepository';
import { TProject } from '../../types';
import { getAdminDb } from '../lib/firebaseAdmin';

export class ProjectRepository extends BaseRepository<TProject> {
  constructor() {
    super('projects');
  }

  async getByOrgId(orgId: string): Promise<TProject[]> {
    const querySnapshot = await getAdminDb().collection(this.collectionName).where('orgId', '==', orgId).get();
    return querySnapshot.docs.map(doc => doc.data() as TProject);
  }
}
