import { InitiativeRepository } from '../repositories/InitiativeRepository';
import { TInitiative } from '../../types';
import { AuditLogService } from './AuditLogService';

export class InitiativeService {
  private repo = new InitiativeRepository();

  async createInitiative(initiative: TInitiative, userId: string): Promise<void> {
    await this.repo.create(initiative.id, initiative);
    await AuditLogService.logAction(initiative.orgId, userId, `Created initiative: ${initiative.title}`);
  }

  async getInitiativeById(id: string): Promise<TInitiative | null> {
    return this.repo.getById(id);
  }

  async getInitiativesByProject(projectId: string): Promise<TInitiative[]> {
    return this.repo.getByProjectId(projectId);
  }

  async getInitiativesByOrg(orgId: string): Promise<TInitiative[]> {
    return this.repo.getByOrgId(orgId);
  }

  async updateInitiative(id: string, data: Partial<TInitiative>, orgId: string, userId: string): Promise<void> {
    await this.repo.update(id, data);
    await AuditLogService.logAction(orgId, userId, `Updated initiative: ${id}`);
  }
}
