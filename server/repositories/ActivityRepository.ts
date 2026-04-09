import { BaseRepository } from './BaseRepository';
import { TActivity } from '../../types';
import { getAdminDb } from '../lib/firebaseAdmin';

export class ActivityRepository extends BaseRepository<TActivity> {
  constructor() {
    super('activities');
  }

  async getByOrgId(orgId: string, limit: number = 50): Promise<TActivity[]> {
    try {
      const querySnapshot = await getAdminDb()
        .collection(this.collectionName)
        .where('orgId', '==', orgId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      return querySnapshot.docs.map(doc => doc.data() as TActivity);
    } catch (error: any) {
      // Handle the case where a composite index is required but hasn't been created yet
      if (error.code === 9 || error.message?.includes('FAILED_PRECONDITION')) {
        console.error('[FIRESTORE] Missing composite index for activities. Follow this link to create it:', error.message);
        throw new Error('Database error: Missing required index for activity queries.');
      }
      throw error;
    }
  }

  async getByInitiativeId(initiativeId: string): Promise<TActivity[]> {
    const querySnapshot = await getAdminDb()
      .collection(this.collectionName)
      .where('initiativeId', '==', initiativeId)
      .orderBy('timestamp', 'desc')
      .get();
    return querySnapshot.docs.map(doc => doc.data() as TActivity);
  }
}
