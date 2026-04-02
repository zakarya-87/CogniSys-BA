import { Request, Response } from 'express';
import { InitiativeService } from '../services/InitiativeService';
import { TInitiative } from '../../types';

const initiativeService = new InitiativeService();

export class InitiativeController {
  static async create(req: Request, res: Response) {
    try {
      const initiative: TInitiative = req.body;
      const userId = req.user?.uid;
      await initiativeService.createInitiative(initiative, userId);
      res.status(201).json({ message: 'Initiative created successfully' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  static async listByOrg(req: Request, res: Response) {
    try {
      const { orgId } = req.params as { orgId: string };
      const initiatives = await initiativeService.getInitiativesByOrg(orgId);
      res.json(initiatives);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  static async listByProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params as { projectId: string };
      const initiatives = await initiativeService.getInitiativesByProject(projectId);
      res.json(initiatives);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { initiativeId } = req.params as { initiativeId: string };
      const { orgId } = req.body; // orgId should be passed for logging
      const data = req.body;
      const userId = req.user?.uid;
      await initiativeService.updateInitiative(initiativeId, data, orgId, userId);
      res.json({ message: 'Initiative updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}
