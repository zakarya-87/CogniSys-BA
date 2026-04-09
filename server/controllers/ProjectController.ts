import { Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';
import { safeError } from '../utils/errorHandler';
import { auditContextFromRequest } from '../utils/auditContext';
import { CreateProjectSchema, parseBody } from '../schemas';

const projectService = new ProjectService();

export class ProjectController {
  static async create(req: Request, res: Response) {
    try {
      const project = parseBody(CreateProjectSchema, req.body, res);
      if (!project) return;
      const userId = req.user?.uid ?? 'anonymous';
      await projectService.createProject(project, userId, auditContextFromRequest(req));
      res.status(201).json({ message: 'Project created successfully' });
    } catch (error) {
      safeError(res, error, 'ProjectController.create');
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { orgId } = req.params as { orgId: string };
      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string | undefined;

      const { data, nextCursor } = await projectService.getProjectsByOrgPaginated(orgId, limit, cursor);
      res.json({ data, nextCursor });
    } catch (error) {
      safeError(res, error, 'ProjectController.list');
    }
  }
}

