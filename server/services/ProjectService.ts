import { ProjectRepository } from '../repositories/ProjectRepository';
import { TProject } from '../../types';
import { AuditLogService } from './AuditLogService';

export class ProjectService {
  private repo = new ProjectRepository();

  async createProject(project: TProject, userId: string): Promise<void> {
    await this.repo.create(project.id, project);
    await AuditLogService.logAction(project.orgId, userId, `Created project: ${project.name}`);
  }

  async getProjectsByOrg(orgId: string): Promise<TProject[]> {
    return this.repo.getByOrgId(orgId);
  }
}
