import { Request, Response } from 'express';
import { InitiativeService } from '../services/InitiativeService';
import { safeError } from '../utils/errorHandler';
import { auditContextFromRequest } from '../utils/auditContext';
import { CreateInitiativeSchema, UpdateInitiativeSchema, parseBody } from '../schemas';

const initiativeService = new InitiativeService();

export class InitiativeController {
  static async create(req: Request, res: Response) {
    try {
      const initiative = parseBody(CreateInitiativeSchema, req.body, res);
      if (!initiative) return;
      const userId = req.user?.uid ?? 'anonymous';
      await initiativeService.createInitiative(initiative as any, userId, auditContextFromRequest(req));
      res.status(201).json({ message: 'Initiative created successfully' });
    } catch (error) {
      safeError(res, error, 'InitiativeController.create');
    }
  }

  static async listByOrg(req: Request, res: Response) {
    try {
      const { orgId } = req.params as { orgId: string };
      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string | undefined;

      const { data, nextCursor } = await initiativeService.getInitiativesByOrgPaginated(orgId, limit, cursor);
      res.json({ data, nextCursor });
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
      const userId = req.user?.uid ?? 'anonymous';
      // Fetch current state for before/after diff
      const before = await initiativeService.getInitiativeById(initiativeId);
      await initiativeService.updateInitiative(
        initiativeId,
        (before ?? {}) as any,
        data as any,
        orgId,
        userId,
        auditContextFromRequest(req),
      );
      res.json({ message: 'Initiative updated successfully' });
    } catch (error) {
      safeError(res, error, 'InitiativeController.update');
    }
  }
}

