import { getAdminAuth } from '../lib/firebaseAdmin';
import { UserRole } from '../../types';

export interface OrgClaims {
  orgId: string;
  role: UserRole;
  claimsVersion: number;
}

const CLAIMS_VERSION = 1;

export class AuthService {
  static async provisionOrgClaims(uid: string, orgId: string, role: UserRole): Promise<void> {
    const claims: OrgClaims = { orgId, role, claimsVersion: CLAIMS_VERSION };
    await getAdminAuth().setCustomUserClaims(uid, claims);
  }

  static async revokeOrgClaims(uid: string): Promise<void> {
    await getAdminAuth().setCustomUserClaims(uid, null);
  }

  static async getOrgClaims(uid: string): Promise<OrgClaims | null> {
    const user = await getAdminAuth().getUser(uid);
    const claims = user.customClaims as OrgClaims | undefined;
    if (!claims?.orgId) return null;
    return claims;
  }

  static async revokeRefreshTokens(uid: string): Promise<void> {
    await getAdminAuth().revokeRefreshTokens(uid);
  }
}

