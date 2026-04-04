import { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from '../lib/firebaseAdmin';
import { Permission, roleHasPermission, LEGACY_ROLE_ORDER } from './permissions';

/**
 * Backward-compatible role-based guard.
 * Verifies the Firebase Bearer token, checks that the token's `role`
 * claim meets the required minimum role level.
 */
export const authorize = (requiredRole: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Support ?token= query param as fallback for SSE (EventSource can't set headers)
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    } else if (typeof req.query.token === 'string' && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const decodedToken = await getAdminAuth().verifyIdToken(token);
      const { orgId, role } = decodedToken;

      if (!orgId || !role) {
        return res.status(403).json({ error: 'Forbidden: Missing RBAC claims' });
      }

      if (req.params.orgId && req.params.orgId !== orgId) {
        return res.status(403).json({ error: 'Forbidden: Org mismatch' });
      }

      const userLevel = LEGACY_ROLE_ORDER[role] ?? 0;
      const requiredLevel = LEGACY_ROLE_ORDER[requiredRole] ?? 99;
      if (userLevel < requiredLevel) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      req.user = decodedToken;
      next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };
};

/**
 * Fine-grained permission guard.
 * Use instead of `authorize()` for new routes where you want explicit
 * permission checking rather than coarse role hierarchy.
 *
 * @example
 * router.post('/initiatives', can(Permission.INITIATIVE_CREATE), handler)
 */
export const can = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await getAdminAuth().verifyIdToken(token);
      const { orgId, role } = decodedToken;

      if (!orgId || !role) {
        return res.status(403).json({ error: 'Forbidden: Missing RBAC claims' });
      }

      if (req.params.orgId && req.params.orgId !== orgId) {
        return res.status(403).json({ error: 'Forbidden: Org mismatch' });
      }

      if (!roleHasPermission(role, permission)) {
        return res.status(403).json({ error: `Forbidden: requires permission '${permission}'` });
      }

      req.user = decodedToken;
      next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };
};

