/**
 * Fine-grained permission definitions for CogniSys BA.
 *
 * Permissions follow the pattern `resource:action`.
 * Roles map to a set of permissions; the RBAC middleware checks
 * whether the token's role grants the required permission.
 */

export enum Permission {
  // Organizations
  ORGANIZATION_READ            = 'organization:read',
  ORGANIZATION_UPDATE          = 'organization:update',
  ORGANIZATION_DELETE          = 'organization:delete',
  ORGANIZATION_INVITE_MEMBER   = 'organization:invite-member',

  // Projects
  PROJECT_CREATE  = 'project:create',
  PROJECT_READ    = 'project:read',
  PROJECT_UPDATE  = 'project:update',
  PROJECT_DELETE  = 'project:delete',

  // Initiatives
  INITIATIVE_CREATE  = 'initiative:create',
  INITIATIVE_READ    = 'initiative:read',
  INITIATIVE_UPDATE  = 'initiative:update',
  INITIATIVE_DELETE  = 'initiative:delete',
  INITIATIVE_APPROVE = 'initiative:approve',

  // AI / Artifacts
  ARTIFACT_GENERATE_WBS    = 'artifact:generate-wbs',
  ARTIFACT_GENERATE_RISKS  = 'artifact:generate-risks',
  ARTIFACT_VIEW            = 'artifact:view',

  // Vector Memory
  MEMORY_STORE  = 'memory:store',
  MEMORY_QUERY  = 'memory:query',

  // Audit Logs
  AUDIT_READ = 'audit:read',
}

/** Permissions granted to each coarse role. */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  viewer: [
    Permission.ORGANIZATION_READ,
    Permission.PROJECT_READ,
    Permission.INITIATIVE_READ,
    Permission.ARTIFACT_VIEW,
    Permission.MEMORY_QUERY,
  ],
  member: [
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_INVITE_MEMBER,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.INITIATIVE_CREATE,
    Permission.INITIATIVE_READ,
    Permission.INITIATIVE_UPDATE,
    Permission.INITIATIVE_APPROVE,
    Permission.ARTIFACT_GENERATE_WBS,
    Permission.ARTIFACT_GENERATE_RISKS,
    Permission.ARTIFACT_VIEW,
    Permission.MEMORY_STORE,
    Permission.MEMORY_QUERY,
  ],
  admin: [
    // Admin inherits all permissions
    ...Object.values(Permission),
  ],
};

/** Check whether a role grants the given permission. */
export function roleHasPermission(role: string, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

/**
 * Map legacy coarse roles used by `authorize()` to the minimum
 * permission level required — for backward-compat.
 */
export const LEGACY_ROLE_ORDER: Record<string, number> = {
  viewer: 1,
  member: 2,
  admin:  3,
};
