import { Request } from 'express';
import { AuditContext } from '../services/AuditLogService';

/** Extract AuditContext from an Express request. */
export function auditContextFromRequest(req: Request): AuditContext {
  return {
    method: req.method,
    endpoint: req.originalUrl,
    ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()
      ?? req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    correlationId: req.headers['x-correlation-id'] as string | undefined,
  };
}
