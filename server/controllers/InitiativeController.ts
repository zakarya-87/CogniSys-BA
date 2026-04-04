import { Request, Response } from 'express';
import { InitiativeService } from '../services/InitiativeService';
import { safeError } from '../utils/errorHandler';
import { CreateInitiativeSchema, UpdateInitiativeSchema, parseBody } from '../schemas';

const initiativeService = new InitiativeService();

export class InitiativeController {
  static async create(req: Request, res: Response) {
    try {
      const initiative = parseBody(CreateInitiativeSchema, req.body, res);
      if (!initiative) return;
      const userId = req.user?.uid;
      await initiativeService.createInitiative(initiative as any, userId);
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
      const data = parseBody(UpdateInitiativeSchema, req.body, res);
      if (!data) return;
      const { orgId } = data;
      const userId = req.user?.uid;
      await initiativeService.updateInitiative(initiativeId, data, orgId, userId);
      res.json({ message: 'Initiative updated successfully' });
    } catch (error) {
      safeError(res, error, 'InitiativeController.update');
    }
  }
}
