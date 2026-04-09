import { ActivityRepository } from '../repositories/ActivityRepository';
import { TActivity } from '../../types';
import { logger } from '../logger';

export class ActivityService {
  private repo: ActivityRepository;

  constructor() {
    this.repo = new ActivityRepository();
  }

  async logActivity(orgId: string, activity: TActivity): Promise<void> {
    try {
      // Validate orgId match if provided in activity
      if (activity.orgId && activity.orgId !== orgId) {
        throw new Error(`Organization mismatch: Activity orgId (${activity.orgId}) does not match current orgId (${orgId})`);
      }
      
      // Ensure the activity has the orgId for querying
      const payload = { 
        ...activity, 
        orgId,
        timestamp: activity.timestamp || new Date().toISOString()
      };
      await this.repo.create(activity.id, payload as any);
      logger.info({ activityId: activity.id, orgId }, 'Activity logged successfully');
    } catch (error) {
      logger.error({ error, activityId: activity.id }, 'Failed to log activity');
      throw error;
    }
  }

  async getRecentActivities(orgId: string, limit?: number): Promise<TActivity[]> {
    return this.repo.getByOrgId(orgId, limit);
  }

  async addComment(activityId: string, comment: any): Promise<void> {
    const activity = await this.repo.getById(activityId);
    if (!activity) throw new Error('Activity not found');
    
    const updatedComments = [...(activity.comments || []), comment];
    await this.repo.update(activityId, { comments: updatedComments } as any);
  }

  async getInitiativeActivities(initiativeId: string): Promise<TActivity[]> {
    return this.repo.getByInitiativeId(initiativeId);
  }
}
