import { Request, Response } from 'express';
import { TaskQueue } from '../services/TaskQueue';
import { InitiativeService } from '../services/InitiativeService';
import { safeError } from '../utils/errorHandler';

const initiativeService = new InitiativeService();

export class AIController {
  static async triggerWBS(req: Request, res: Response) {
    try {
      const { initiativeId, orgId } = req.params as { initiativeId: string; orgId: string };
      const target = await initiativeService.getInitiativeById(initiativeId);

      if (!target || target.orgId !== orgId) {
        return res.status(404).json({ error: 'Initiative not found' });
      }

      const taskId = await TaskQueue.addTask(orgId, 'GENERATE_WBS', { initiative: target });
      res.status(202).json({ taskId, message: 'WBS generation queued' });
    } catch (error) {
      safeError(res, error, 'AIController.triggerWBS');
    }
  }

  static async triggerRiskAssessment(req: Request, res: Response) {
    try {
      const { initiativeId, orgId } = req.params as { initiativeId: string; orgId: string };
      const target = await initiativeService.getInitiativeById(initiativeId);

      if (!target || target.orgId !== orgId) {
        return res.status(404).json({ error: 'Initiative not found' });
      }

      const taskId = await TaskQueue.addTask(orgId, 'ASSESS_RISKS', { initiative: target, wbs: target.wbs });
      res.status(202).json({ taskId, message: 'Risk assessment queued' });
    } catch (error) {
      safeError(res, error, 'AIController.triggerRiskAssessment');
    }
  }
}
