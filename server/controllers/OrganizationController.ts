import { Request, Response } from 'express';
import { OrganizationService } from '../services/OrganizationService';
import { TOrganization } from '../../types';
import { safeError } from '../utils/errorHandler';

const orgService = new OrganizationService();

export class OrganizationController {
  static async create(req: Request, res: Response) {
    try {
      const org: TOrganization = req.body;
      const userId = req.user?.uid;
      await orgService.createOrganization(org, userId);
      res.status(201).json({ message: 'Organization created successfully' });
    } catch (error) {
      safeError(res, error, 'OrganizationController.create');
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const { orgId } = req.params as { orgId: string };
      const org = await orgService.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      res.json(org);
    } catch (error) {
      safeError(res, error, 'OrganizationController.get');
    }
  }
}
