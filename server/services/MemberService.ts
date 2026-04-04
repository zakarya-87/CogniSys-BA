import { getAdminDb } from '../lib/firebaseAdmin';
import { AuthService } from './AuthService';
import { AuditLogService, AuditContext } from './AuditLogService';
import { WebhookService } from './WebhookService';
import { UserRole } from '../../types';

export interface OrgMember {
  userId: string;
  role: UserRole;
}

export class MemberService {
  private static orgRef(orgId: string) {
    return getAdminDb().collection('organizations').doc(orgId);
  }

  /** List all members of an org. */
  static async listMembers(orgId: string): Promise<OrgMember[]> {
    const snap = await MemberService.orgRef(orgId).get();
    if (!snap.exists) throw Object.assign(new Error('Organization not found'), { statusCode: 404 });
    return (snap.data()?.members ?? []) as OrgMember[];
  }

  /** Remove a member from an org and revoke their custom claims. */
  static async removeMember(
    orgId: string,
    targetUserId: string,
    actorId: string,
    context?: AuditContext,
  ): Promise<void> {
    const orgRef = MemberService.orgRef(orgId);
    const snap = await orgRef.get();
    if (!snap.exists) throw Object.assign(new Error('Organization not found'), { statusCode: 404 });

    const members: OrgMember[] = snap.data()?.members ?? [];
    const before = members.find((m) => m.userId === targetUserId);
    if (!before) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

    const updated = members.filter((m) => m.userId !== targetUserId);
    await orgRef.update({ members: updated });
    await AuthService.revokeOrgClaims(targetUserId).catch(() => {/* non-fatal */});

    await AuditLogService.logMutation(orgId, actorId, 'organization', orgId, 'update', {
      before: { member: before } as Record<string, unknown>,
      after: { memberRemoved: targetUserId } as Record<string, unknown>,
      severity: 'HIGH',
      context,
    });
    WebhookService.deliverEvent(orgId, 'member.removed', { userId: targetUserId, removedBy: actorId }).catch(() => {});
  }

  /** Change a member's role and re-provision their custom claims. */
  static async changeMemberRole(
    orgId: string,
    targetUserId: string,
    newRole: UserRole,
    actorId: string,
    context?: AuditContext,
  ): Promise<void> {
    const orgRef = MemberService.orgRef(orgId);
    const snap = await orgRef.get();
    if (!snap.exists) throw Object.assign(new Error('Organization not found'), { statusCode: 404 });

    const members: OrgMember[] = snap.data()?.members ?? [];
    const memberIdx = members.findIndex((m) => m.userId === targetUserId);
    if (memberIdx === -1) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

    const before = { ...members[memberIdx] };
    members[memberIdx] = { userId: targetUserId, role: newRole };
    await orgRef.update({ members });
    await AuthService.provisionOrgClaims(targetUserId, orgId, newRole);

    await AuditLogService.logMutation(orgId, actorId, 'organization', orgId, 'update', {
      before: { member: before } as Record<string, unknown>,
      after: { member: members[memberIdx] } as Record<string, unknown>,
      context,
    });
  }
}
