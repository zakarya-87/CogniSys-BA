import { getAdminDb } from '../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export type AuditResourceType = 'organization' | 'project' | 'initiative';
export type AuditAction = 'create' | 'update' | 'delete';
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditContext {
  method?: string;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export interface AuditLogEntry {
  orgId: string;
  userId: string;
  resourceType: AuditResourceType;
  resourceId: string;
  action: AuditAction;
  changes: AuditChange[];
  context: AuditContext;
  severity: AuditSeverity;
  timestamp: admin.firestore.FieldValue;
}

/** Compute a flat list of changed fields between two plain objects. */
function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): AuditChange[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: AuditChange[] = [];
  for (const key of keys) {
    const oldValue = before[key];
    const newValue = after[key];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field: key, oldValue, newValue });
    }
  }
  return changes;
}

export class AuditLogService {
  /**
   * Log a resource mutation with full context.
   * All writes use the Admin SDK and bypass Firestore security rules.
   */
  static async logMutation(
    orgId: string,
    userId: string,
    resourceType: AuditResourceType,
    resourceId: string,
    action: AuditAction,
    options: {
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
      context?: AuditContext;
      severity?: AuditSeverity;
    } = {},
  ): Promise<void> {
    const { before = {}, after = {}, context = {}, severity } = options;

    const changes =
      action === 'update' ? diffObjects(before, after) :
      action === 'create' ? Object.entries(after).map(([field, newValue]) => ({ field, oldValue: undefined, newValue })) :
      Object.entries(before).map(([field, oldValue]) => ({ field, oldValue, newValue: undefined }));

    const resolvedSeverity: AuditSeverity =
      severity ??
      (action === 'delete' ? 'WARNING' : 'INFO');

    const entry: AuditLogEntry = {
      orgId,
      userId,
      resourceType,
      resourceId,
      action,
      changes,
      context,
      severity: resolvedSeverity,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await getAdminDb().collection('audit_logs').add(entry);
  }

  /** Fetch audit logs for an org, newest first, with optional action filter. */
  static async getLogs(
    orgId: string,
    options: {
      limit?: number;
      action?: AuditAction;
      resourceType?: AuditResourceType;
    } = {},
  ): Promise<(AuditLogEntry & { id: string })[]> {
    const { limit = 50, action, resourceType } = options;
    let query = getAdminDb()
      .collection('audit_logs')
      .where('orgId', '==', orgId)
      .orderBy('timestamp', 'desc')
      .limit(Math.min(limit, 200));

    if (action) query = query.where('action', '==', action) as typeof query;
    if (resourceType) query = query.where('resourceType', '==', resourceType) as typeof query;

    const snap = await query.get();
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as AuditLogEntry) }));
  }

  /** @deprecated Use logMutation() instead. Kept for backward compatibility. */
  static async logAction(orgId: string, userId: string, action: string): Promise<void> {
    await getAdminDb().collection('audit_logs').add({
      orgId,
      userId,
      action,
      severity: 'INFO',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

