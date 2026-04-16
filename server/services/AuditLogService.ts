import { getAdminDb } from '../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export type AuditResourceType = 'organization' | 'project' | 'initiative' | 'ai_operation';
export type AuditAction = 'create' | 'update' | 'delete' | 'audit' | 'safety_scan';
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SAFETY_VIOLATION';

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
  agentName?: string;
  missionId?: string;
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
  timestamp: FieldValue;
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

/** Recursively remove 'undefined' values from an object for Firestore compatibility. */
function cleanObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(cleanObject);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanObject(v)])
    );
  }
  return obj;
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
      changes: cleanObject(changes),
      context: cleanObject(context),
      severity: resolvedSeverity,
      timestamp: FieldValue.serverTimestamp(),
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
      timestamp: FieldValue.serverTimestamp(),
    });
  }

  /** Log an AI agentic event for transparency and ethics tracking. */
  static async logAIAction(
    orgId: string,
    userId: string,
    agent: string,
    action: string,
    metadata: {
      thought?: string;
      instructions?: string;
      toolCall?: any;
      safetyVerdict?: string;
      score?: number;
      missionId?: string;
      initiativeId?: string;
      usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    }
  ): Promise<void> {
    const entry = {
      orgId,
      userId,
      resourceType: 'ai_operation' as AuditResourceType,
      resourceId: metadata.missionId || 'system',
      action: 'audit' as AuditAction,
      changes: [
        { field: 'thought', oldValue: null, newValue: metadata.thought },
        { field: 'safety', oldValue: null, newValue: metadata.safetyVerdict }
      ],
      context: {
        agentName: agent,
        missionId: metadata.missionId,
      },
      severity: metadata.safetyVerdict === 'Fail' ? 'SAFETY_VIOLATION' : 'INFO',
      timestamp: FieldValue.serverTimestamp(),
      ...cleanObject(metadata)
    };

    await getAdminDb().collection('audit_logs').add(entry);

    // Hardened Telemetry: If usage is present, track it detailed in usage metering
    if (metadata.usage) {
        try {
            const { UsageMeteringService } = await import('./UsageMeteringService');
            // Extract modelId if possible, or default to general class
            const modelId = (metadata as any).modelId || (agent === 'Orchestrator' ? 'pro' : 'flash');
            await UsageMeteringService.trackDetailedUsage(orgId, userId, modelId, metadata.usage, {
                agentName: agent,
                action,
                missionId: metadata.missionId,
                initiativeId: metadata.initiativeId
            });
        } catch (e) {
            console.warn("[AuditLogService] Failed to track detailed AI usage:", e);
        }
    }
  }
}

