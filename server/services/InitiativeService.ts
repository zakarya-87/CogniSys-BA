import { InitiativeRepository } from '../repositories/InitiativeRepository';
import { TInitiative } from '../../types';
import { AuditLogService, AuditContext } from './AuditLogService';

export class InitiativeService {
  private repo = new InitiativeRepository();

  async createInitiative(initiative: TInitiative, userId: string, context?: AuditContext): Promise<void> {
    await this.repo.create(initiative.id, initiative);
    await AuditLogService.logMutation(initiative.orgId, userId, 'initiative', initiative.id, 'create', {
      after: initiative as unknown as Record<string, unknown>,
      context,
    });
  }

  async getInitiativesByProject(projectId: string): Promise<TInitiative[]> {
    return this.repo.getByProjectId(projectId);
  }

  async getInitiativesByOrg(orgId: string): Promise<TInitiative[]> {
    return this.repo.getByOrgId(orgId);
  }

  async getInitiativesByOrgPaginated(orgId: string, limit: number, cursor?: string): Promise<{ data: TInitiative[]; nextCursor: string | null }> {
    return this.repo.getByOrgIdPaginated(orgId, limit, cursor);
  }

  async getInitiativeById(id: string): Promise<TInitiative | null> {
    return this.repo.getById(id);
  }

  async updateInitiative(
    id: string,
    before: Partial<TInitiative>,
    after: Partial<TInitiative>,
    orgId: string,
    userId: string,
    context?: AuditContext,
  ): Promise<void> {
    await this.repo.update(id, after);
    await AuditLogService.logMutation(orgId, userId, 'initiative', id, 'update', {
      before: before as unknown as Record<string, unknown>,
      after: after as unknown as Record<string, unknown>,
      context,
    });
  }

  async deleteInitiative(initiative: TInitiative, userId: string, context?: AuditContext): Promise<void> {
    await this.repo.delete(initiative.id);
    await AuditLogService.logMutation(initiative.orgId, userId, 'initiative', initiative.id, 'delete', {
      before: initiative as unknown as Record<string, unknown>,
      context,
      severity: 'WARNING',
    });
  }
}

