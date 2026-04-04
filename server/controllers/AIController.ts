import { Request, Response } from 'express';
import { TaskQueue } from '../services/TaskQueue';
import { InitiativeService } from '../services/InitiativeService';
import { safeError } from '../utils/errorHandler';
import { withSpan } from '../tracer';

const initiativeService = new InitiativeService();

export class AIController {
  static async triggerWBS(req: Request, res: Response) {
    try {
      const { initiativeId, orgId } = req.params as { initiativeId: string; orgId: string };

      const taskId = await withSpan(
        'ai.triggerWBS',
        { initiativeId, orgId, userId: req.user?.uid ?? 'unknown' },
        async () => {
          const target = await initiativeService.getInitiativeById(initiativeId);
          if (!target || target.orgId !== orgId) {
            throw Object.assign(new Error('Initiative not found'), { statusCode: 404 });
          }
          return TaskQueue.addTask(orgId, 'GENERATE_WBS', { initiative: target });
        },
      );

      res.status(202).json({ taskId, message: 'WBS generation queued' });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      safeError(res, error, 'AIController.triggerWBS');
    }
  }

  static async triggerRiskAssessment(req: Request, res: Response) {
    try {
      const { initiativeId, orgId } = req.params as { initiativeId: string; orgId: string };

      const taskId = await withSpan(
        'ai.triggerRiskAssessment',
        { initiativeId, orgId, userId: req.user?.uid ?? 'unknown' },
        async () => {
          const target = await initiativeService.getInitiativeById(initiativeId);
          if (!target || target.orgId !== orgId) {
            throw Object.assign(new Error('Initiative not found'), { statusCode: 404 });
          }
          return TaskQueue.addTask(orgId, 'ASSESS_RISKS', { initiative: target, wbs: target.wbs });
        },
      );

      res.status(202).json({ taskId, message: 'Risk assessment queued' });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      safeError(res, error, 'AIController.triggerRiskAssessment');
    }
  }
}

