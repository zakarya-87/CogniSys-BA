import { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from '../lib/firebaseAdmin';

export const authorize = (requiredRole: string) => {
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

      // Check if the orgId matches the request (if applicable)
      if (req.params.orgId && req.params.orgId !== orgId) {
        return res.status(403).json({ error: 'Forbidden: Org mismatch' });
      }

      // Role hierarchy check (simplified)
      const roleHierarchy: { [key: string]: number } = { viewer: 1, member: 2, admin: 3 };
      if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      req.user = decodedToken;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };
};
