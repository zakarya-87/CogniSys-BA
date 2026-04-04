import { ProjectRepository } from '../repositories/ProjectRepository';
import { TProject } from '../../types';
import { AuditLogService, AuditContext } from './AuditLogService';

export class ProjectService {
  private repo = new ProjectRepository();

  async createProject(project: TProject, userId: string, context?: AuditContext): Promise<void> {
    await this.repo.create(project.id, project);
    await AuditLogService.logMutation(project.orgId, userId, 'project', project.id, 'create', {
      after: project as unknown as Record<string, unknown>,
      context,
    });
  }

  async getProjectsByOrg(orgId: string): Promise<TProject[]> {
    return this.repo.getByOrgId(orgId);
  }

  async updateProject(
    project: TProject,
    before: Partial<TProject>,
    after: Partial<TProject>,
    userId: string,
    context?: AuditContext,
  ): Promise<void> {
    await this.repo.update(project.id, after);
    await AuditLogService.logMutation(project.orgId, userId, 'project', project.id, 'update', {
      before: before as unknown as Record<string, unknown>,
      after: after as unknown as Record<string, unknown>,
      context,
    });
  }

  async deleteProject(project: TProject, userId: string, context?: AuditContext): Promise<void> {
    await this.repo.delete(project.id);
    await AuditLogService.logMutation(project.orgId, userId, 'project', project.id, 'delete', {
      before: project as unknown as Record<string, unknown>,
      context,
      severity: 'WARNING',
    });
  }
}

