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
    const querySnapshot = await getAdminDb().collection(this.collectionName).where('orgId', '==', orgId).get();
    return querySnapshot.docs.map(doc => doc.data() as TInitiative);
  }
}
