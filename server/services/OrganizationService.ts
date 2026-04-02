import { OrganizationRepository } from '../repositories/OrganizationRepository';
import { TOrganization } from '../../types';
import { AuditLogService } from './AuditLogService';

export class OrganizationService {
  private repo = new OrganizationRepository();

  async createOrganization(org: TOrganization, userId: string): Promise<void> {
    await this.repo.create(org.id, org);
    await AuditLogService.logAction(org.id, userId, `Created organization: ${org.name}`);
  }

  async getOrganization(orgId: string): Promise<TOrganization | null> {
    return this.repo.getById(orgId);
  }
}
