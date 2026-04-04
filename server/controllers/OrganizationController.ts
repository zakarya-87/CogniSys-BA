import { Request, Response } from 'express';
import { OrganizationService } from '../services/OrganizationService';
import { safeError } from '../utils/errorHandler';
import { auditContextFromRequest } from '../utils/auditContext';
import { CreateOrganizationSchema, parseBody } from '../schemas';

const orgService = new OrganizationService();

export class OrganizationController {
  static async create(req: Request, res: Response) {
    try {
      const org = parseBody(CreateOrganizationSchema, req.body, res);
      if (!org) return;
      const userId = req.user?.uid ?? 'anonymous';
      await orgService.createOrganization(org, userId, auditContextFromRequest(req));
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

