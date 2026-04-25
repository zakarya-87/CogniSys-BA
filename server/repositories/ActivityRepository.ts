import { BaseRepository } from './BaseRepository';
import { TActivity } from '../../types';

export class ActivityRepository extends BaseRepository<TActivity> {
  constructor() {
    super('activities');
  }

  async getByOrgIdPaginated(orgId: string, limit: number = 50, cursor?: string): Promise<{ data: TActivity[]; nextCursor: string | null }> {
    return this.getPaginated({
      where: [['orgId', '==', orgId]],
      orderByField: 'timestamp',
      limit,
      cursor
    });
  }

  // Deprecated: used for backward compatibility, should migrate to getByOrgIdPaginated
  async getByOrgId(orgId: string, limit: number = 50): Promise<TActivity[]> {
    const result = await this.getByOrgIdPaginated(orgId, limit);
    return result.data;
  }

  async getByInitiativeId(initiativeId: string): Promise<TActivity[]> {
    // Current requirement is just for org-wide sync, but we could paginate this too if needed.
    const result = await this.getPaginated({
      where: [['initiativeId', '==', initiativeId]],
      orderByField: 'timestamp',
      limit: 100 // High limit for specific initiative history
    });
    return result.data;
  }
}
