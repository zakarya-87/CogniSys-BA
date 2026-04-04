import { OrganizationRepository } from '../repositories/OrganizationRepository';
import { TOrganization } from '../../types';
import { AuditLogService, AuditContext } from './AuditLogService';
import { AuthService } from './AuthService';
import { BillingService } from './BillingService';

export class OrganizationService {
  private repo = new OrganizationRepository();

  async createOrganization(org: TOrganization, userId: string, context?: AuditContext): Promise<void> {
    await this.repo.create(org.id, org);
    await AuthService.provisionOrgClaims(userId, org.id, 'admin');
    // Create Stripe customer for the org (best-effort — billing may not be configured)
    BillingService.ensureCustomer(org.id, `org-${org.id}@cognisys.io`, org.name).catch(() => {});
    await AuditLogService.logMutation(org.id, userId, 'organization', org.id, 'create', {
      after: org as unknown as Record<string, unknown>,
      context,
    });
  }

  async getOrganization(orgId: string): Promise<TOrganization | null> {
    return this.repo.getById(orgId);
  }

  async updateOrganization(
    orgId: string,
    before: Partial<TOrganization>,
    after: Partial<TOrganization>,
    userId: string,
    context?: AuditContext,
  ): Promise<void> {
    await this.repo.update(orgId, after);
    await AuditLogService.logMutation(orgId, userId, 'organization', orgId, 'update', {
      before: before as unknown as Record<string, unknown>,
      after: after as unknown as Record<string, unknown>,
      context,
    });
  }

  async deleteOrganization(orgId: string, before: TOrganization, userId: string, context?: AuditContext): Promise<void> {
    await this.repo.delete(orgId);
    for (const member of before.members ?? []) {
      await AuthService.revokeOrgClaims(member.userId).catch(() => {/* non-fatal */});
    }
    await AuditLogService.logMutation(orgId, userId, 'organization', orgId, 'delete', {
      before: before as unknown as Record<string, unknown>,
      context,
      severity: 'CRITICAL',
    });
  }
}


