import { randomUUID } from 'crypto';
import { getAdminDb } from '../lib/firebaseAdmin';
import { AuthService } from './AuthService';
import { AuditLogService } from './AuditLogService';
import { EmailService } from './EmailService';
import { WebhookService } from './WebhookService';
import { NotificationService } from './NotificationService';
import { UserRole } from '../../types';

export interface OrgInvitation {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class InvitationService {
  private static col() {
    return getAdminDb().collection('invitations');
  }

  /** Create a new invitation. Upserts if a pending invite for same org+email exists. */
  static async createInvitation(
    orgId: string,
    email: string,
    role: UserRole,
    invitedBy: string,
  ): Promise<OrgInvitation> {
    // Revoke any existing pending invite for this org+email
    const existing = await InvitationService.col()
      .where('orgId', '==', orgId)
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .get();
    for (const doc of existing.docs) {
      await doc.ref.update({ status: 'revoked' });
    }

    const now = new Date();
    const invitation: OrgInvitation = {
      id: randomUUID(),
      orgId,
      email,
      role,
      invitedBy,
      token: randomUUID(),
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + INVITATION_TTL_MS).toISOString(),
    };

    await InvitationService.col().doc(invitation.id).set(invitation);
    await AuditLogService.logMutation(orgId, invitedBy, 'organization', orgId, 'update', {
      after: { invitedEmail: email, role } as Record<string, unknown>,
      context: undefined,
    });

    // Send invitation email (non-fatal if SMTP not configured)
    await EmailService.sendInvitation({
      to: email,
      orgName: orgId, // caller can pass org name; orgId is a safe fallback
      inviterName: invitedBy,
      role,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
    }).catch(() => {/* email is best-effort */});

    return invitation;
  }

  /** Accept an invitation by token. Adds the user to the org in Firestore + provisions claims. */
  static async acceptInvitation(
    token: string,
    userId: string,
  ): Promise<{ orgId: string; role: UserRole }> {
    const snap = await InvitationService.col()
      .where('token', '==', token)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (snap.empty) throw Object.assign(new Error('Invalid or expired invitation'), { statusCode: 404 });

    const doc = snap.docs[0];
    const inv = doc.data() as OrgInvitation;

    if (new Date(inv.expiresAt) < new Date()) {
      await doc.ref.update({ status: 'expired' });
      throw Object.assign(new Error('Invitation has expired'), { statusCode: 410 });
    }

    // Add member to org
    const orgRef = getAdminDb().collection('organizations').doc(inv.orgId);
    const orgSnap = await orgRef.get();
    if (!orgSnap.exists) throw Object.assign(new Error('Organization not found'), { statusCode: 404 });

    const org = orgSnap.data() as { members: { userId: string; role: UserRole }[] };
    const members = org.members ?? [];
    const alreadyMember = members.some((m) => m.userId === userId);

    if (!alreadyMember) {
      members.push({ userId, role: inv.role });
      await orgRef.update({ members });
    }

    // Provision Firebase custom claims
    await AuthService.provisionOrgClaims(userId, inv.orgId, inv.role);

    // Mark invitation accepted
    await doc.ref.update({ status: 'accepted', acceptedAt: new Date().toISOString() });

    await AuditLogService.logMutation(inv.orgId, userId, 'organization', inv.orgId, 'update', {
      after: { memberJoined: userId, role: inv.role } as Record<string, unknown>,
    });

    // Fire webhook + notification (best-effort)
    WebhookService.deliverEvent(inv.orgId, 'invitation.accepted', { userId, role: inv.role, email: inv.email }).catch(() => {});
    NotificationService.createNotification(
      inv.invitedBy, 'member_joined',
      'New member joined',
      `${inv.email} accepted your invitation and joined as ${inv.role}.`,
      { userId, orgId: inv.orgId },
    ).catch(() => {});

    return { orgId: inv.orgId, role: inv.role };
  }

  /** Revoke a pending invitation. */
  static async revokeInvitation(invitationId: string, revokedBy: string): Promise<void> {
    const docRef = InvitationService.col().doc(invitationId);
    const snap = await docRef.get();
    if (!snap.exists) throw Object.assign(new Error('Invitation not found'), { statusCode: 404 });

    const inv = snap.data() as OrgInvitation;
    if (inv.status !== 'pending') throw Object.assign(new Error('Invitation is not pending'), { statusCode: 409 });

    await docRef.update({ status: 'revoked' });
    await AuditLogService.logMutation(inv.orgId, revokedBy, 'organization', inv.orgId, 'update', {
      after: { revokedInvitation: invitationId } as Record<string, unknown>,
    });
  }

  /** List invitations for an org. */
  static async listInvitations(orgId: string, status?: OrgInvitation['status']): Promise<OrgInvitation[]> {
    let query: FirebaseFirestore.Query = InvitationService.col().where('orgId', '==', orgId);
    if (status) query = query.where('status', '==', status);
    const snap = await query.orderBy('createdAt', 'desc').limit(50).get();
    return snap.docs.map((d) => d.data() as OrgInvitation);
  }
}
