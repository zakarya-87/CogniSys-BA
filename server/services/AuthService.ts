import { getAdminAuth } from '../lib/firebaseAdmin';
import { UserRole } from '../../types';

export interface OrgClaims {
  orgId: string;
  role: UserRole;
  claimsVersion: number;
}

/** Current version — bump whenever the claims schema changes. */
const CLAIMS_VERSION = 1;

export class AuthService {
  /**
   * Set org-scoped RBAC claims on a Firebase user.
   * Called when a user creates or joins an organisation.
   * The new claims take effect on the user's NEXT token refresh (≤ 1 hour).
   */
  static async provisionOrgClaims(uid: string, orgId: string, role: UserRole): Promise<void> {
    const claims: OrgClaims = { orgId, role, claimsVersion: CLAIMS_VERSION };
    await getAdminAuth().setCustomUserClaims(uid, claims);
  }

  /**
   * Revoke org claims (e.g. when a user is removed from the org).
   * Sets claims to null, which clears all custom claims.
   */
  static async revokeOrgClaims(uid: string): Promise<void> {
    await getAdminAuth().setCustomUserClaims(uid, null);
  }

  /** Read the current custom claims for a user. */
  static async getOrgClaims(uid: string): Promise<OrgClaims | null> {
    const user = await getAdminAuth().getUser(uid);
    const claims = user.customClaims as OrgClaims | undefined;
    if (!claims?.orgId) return null;
    return claims;
  }

  /**
   * Force-revoke all existing sessions for a user so new claims are
   * picked up immediately (does not wait for the 1-hour token expiry).
   */
  static async revokeRefreshTokens(uid: string): Promise<void> {
    await getAdminAuth().revokeRefreshTokens(uid);
  }
}

