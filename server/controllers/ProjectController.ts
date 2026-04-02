import { Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';
import { TProject } from '../../types';

const projectService = new ProjectService();

export class ProjectController {
  static async create(req: Request, res: Response) {
    try {
      const project: TProject = req.body;
      const userId = req.user?.uid;
      await projectService.createProject(project, userId);
      res.status(201).json({ message: 'Project created successfully' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { orgId } = req.params as { orgId: string };
      const projects = await projectService.getProjectsByOrg(orgId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}
