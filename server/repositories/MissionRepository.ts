
import { getAdminDb } from '../lib/firebaseAdmin';
import { BaseRepository } from './BaseRepository';
import { THiveState } from '../../types';

export interface TMission {
    id: string;
    orgId: string;
    initiativeId: string;
    state: THiveState;
    status: THiveState['status'];
    updatedAt: number;
}

export class MissionRepository extends BaseRepository<TMission> {
    constructor() {
        super('missions');
    }

    async saveMission(mission: TMission): Promise<void> {
        await this.save(mission.id, mission);
    }

    async getByInitiativeId(initiativeId: string): Promise<TMission[]> {
        const snapshot = await getAdminDb().collection(this.collectionName)
            .where('initiativeId', '==', initiativeId)
            .orderBy('updatedAt', 'desc')
            .limit(5)
            .get();
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TMission));
    }

    async deleteByInitiativeId(initiativeId: string): Promise<void> {
        const missions = await this.getByInitiativeId(initiativeId);
        const batch = getAdminDb().batch();
        missions.forEach(m => {
            const ref = getAdminDb().collection(this.collectionName).doc(m.id);
            batch.delete(ref);
        });
        await batch.commit();
    }
}
