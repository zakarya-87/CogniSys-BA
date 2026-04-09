import { Request, Response } from 'express';
import { ActivityService } from '../services/ActivityService';
import { safeError } from '../utils/errorHandler';
import { TActivity } from '../../types';

const activityService = new ActivityService();

export class ActivityController {
  static async listByOrg(req: Request, res: Response) {
    try {
      const { orgId } = req.params as { orgId: string };
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await activityService.getRecentActivities(orgId, limit);
      res.json(activities);
    } catch (error: any) {
      safeError(res, error, 'ActivityController.listByOrg');
    }
  }

  static async log(req: Request, res: Response) {
    try {
      const { orgId } = req.params as { orgId: string };
      const activity = req.body as TActivity;
      
      if (!activity.id || !activity.type) {
        return res.status(400).json({ error: 'Invalid activity data' });
      }

      await activityService.logActivity(orgId, activity);
      res.status(201).json({ success: true });
    } catch (error: any) {
      safeError(res, error, 'ActivityController.log');
    }
  }

  static async addComment(req: Request, res: Response) {
    try {
      const { activityId } = req.params as { activityId: string };
      const { comment } = req.body;
      if (!comment) return res.status(400).json({ error: 'Comment is required' });
      await activityService.addComment(activityId, comment);
      res.json({ success: true });
    } catch (error: any) {
      safeError(res, error, 'ActivityController.addComment');
    }
  }
}
