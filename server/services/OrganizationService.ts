import { OrganizationRepository } from '../repositories/OrganizationRepository';
import { TOrganization } from '../../types';
import { AuditLogService, AuditContext } from './AuditLogService';
import { AuthService } from './AuthService';
import { BillingService } from './BillingService';
import { logger } from '../logger';

export class OrganizationService {
  private repo = new OrganizationRepository();

  async createOrganization(org: TOrganization, userId: string, context?: AuditContext): Promise<void> {
    logger.info({ orgId: org.id, userId }, 'Starting organization creation');
    
    try {
      await this.repo.create(org.id, org);
      logger.info({ orgId: org.id }, 'Organization record created in repository');
    } catch (err) {
      logger.error({ err, orgId: org.id }, 'Failed to create organization in repository');
      throw new Error(`Database failure: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    if (userId !== 'anonymous') {
      try {
        await AuthService.provisionOrgClaims(userId, org.id, 'admin');
        logger.info({ userId, orgId: org.id }, 'Admin claims provisioned for user');
      } catch (err) {
        logger.error({ err, userId, orgId: org.id }, 'Failed to provision admin claims');
        // We don't necessarily want to fail the whole request if claims fail (as the org is created), 
        // but for onboarding, it's critical. We'll throw a specific error.
        throw new Error(`Auth failure: Could not assign admin permissions. ${err instanceof Error ? err.message : ''}`);
      }
    }

    // Secondary steps (non-blocking for the API response if they fail internally, but we log them)
    BillingService.ensureCustomer(org.id, `org-${org.id}@cognisys.io`, org.name)
      .then(() => logger.info({ orgId: org.id }, 'Stripe customer ensured'))
      .catch((err) => logger.warn({ err, orgId: org.id }, 'Failed to ensure Stripe customer (non-fatal)'));

    AuditLogService.logMutation(org.id, userId, 'organization', org.id, 'create', {
      after: org as unknown as Record<string, unknown>,
      context,
    }).catch((err) => logger.warn({ err, orgId: org.id }, 'Failed to log creation audit (non-fatal)'));
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


