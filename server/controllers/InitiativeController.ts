import { Request, Response } from 'express';
import { InitiativeService } from '../services/InitiativeService';
import { TInitiative } from '../../types';
import { safeError } from '../utils/errorHandler';

const initiativeService = new InitiativeService();

export class InitiativeController {
  static async create(req: Request, res: Response) {
    try {
      const initiative: TInitiative = req.body;
      const userId = req.user?.uid;
      await initiativeService.createInitiative(initiative, userId);
      res.status(201).json({ message: 'Initiative created successfully' });
    } catch (error) {
      safeError(res, error, 'InitiativeController.create');
    }
  }

  static async listByOrg(req: Request, res: Response) {
    try {
      const { orgId } = req.params as { orgId: string };
      const initiatives = await initiativeService.getInitiativesByOrg(orgId);
      res.json(initiatives);
    } catch (error) {
      safeError(res, error, 'InitiativeController.listByOrg');
    }
  }

  static async listByProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params as { projectId: string };
      const initiatives = await initiativeService.getInitiativesByProject(projectId);
      res.json(initiatives);
    } catch (error) {
      safeError(res, error, 'InitiativeController.listByProject');
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { initiativeId } = req.params as { initiativeId: string };
      const { orgId } = req.body;
      const data = req.body;
      const userId = req.user?.uid;
      await initiativeService.updateInitiative(initiativeId, data, orgId, userId);
      res.json({ message: 'Initiative updated successfully' });
    } catch (error) {
      safeError(res, error, 'InitiativeController.update');
    }
  }
}
