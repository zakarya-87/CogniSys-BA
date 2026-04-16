import { getAdminDb } from '../lib/firebaseAdmin';

export interface OrgActivityPoint {
  date: string; // YYYY-MM-DD
  events: number;
}

export interface InitiativeMetrics {
  total: number;
  byStatus: Record<string, number>;
  bySector: Record<string, number>;
}

export interface AIUsagePoint {
  month: string; // YYYY-MM
  aiCalls: number;
  tokenCount: number;
}

export class AnalyticsService {
  /**
   * Daily event counts for an org over the last N days, sourced from audit logs.
   */
  static async getOrgActivity(orgId: string, days = 30): Promise<OrgActivityPoint[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Query both collections (new audit_logs and legacy auditLogs) for backward compatibility during migration
    const [newSnap, legacySnap] = await Promise.all([
      getAdminDb()
        .collection('audit_logs')
        .where('orgId', '==', orgId)
        .where('timestamp', '>=', since)
        .orderBy('timestamp', 'asc')
        .get(),
      getAdminDb()
        .collection('auditLogs')
        .where('orgId', '==', orgId)
        .where('timestamp', '>=', since)
        .orderBy('timestamp', 'asc')
        .get()
    ]);

    const counts: Record<string, number> = {};
    
    // Process new audit_logs collection
    for (const doc of newSnap.docs) {
      const data = doc.data();
      let ts = "";
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        ts = data.timestamp.toDate().toISOString().slice(0, 10);
      } else if (typeof data.timestamp === 'string') {
        ts = data.timestamp.slice(0, 10);
      }
      
      if (ts) {
        counts[ts] = (counts[ts] ?? 0) + 1;
      }
    }
    
    // Process legacy auditLogs collection
    for (const doc of legacySnap.docs) {
      const data = doc.data();
      let ts = "";
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        ts = data.timestamp.toDate().toISOString().slice(0, 10);
      } else if (typeof data.timestamp === 'string') {
        ts = data.timestamp.slice(0, 10);
      }
      
      if (ts) {
        counts[ts] = (counts[ts] ?? 0) + 1;
      }
    }

    // Fill zeros for days with no activity
    const result: OrgActivityPoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, events: counts[key] ?? 0 });
    }
    return result;
  }

  /**
   * Initiative counts grouped by status and sector.
   */
  static async getInitiativeMetrics(orgId: string): Promise<InitiativeMetrics> {
    const snap = await getAdminDb()
      .collection('initiatives')
      .where('orgId', '==', orgId)
      .get();

    const byStatus: Record<string, number> = {};
    const bySector: Record<string, number> = {};

    for (const doc of snap.docs) {
      const d = doc.data();
      const status = (d.status as string) ?? 'unknown';
      const sector = (d.sector as string) ?? 'unknown';
      byStatus[status] = (byStatus[status] ?? 0) + 1;
      bySector[sector] = (bySector[sector] ?? 0) + 1;
    }

    return { total: snap.size, byStatus, bySector };
  }

  /**
   * Monthly AI call + token usage trend over the last N months.
   */
  static async getAIUsageTrend(orgId: string, months = 6): Promise<AIUsagePoint[]> {
    const result: AIUsagePoint[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
      const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const docId = `${orgId}_${month}`;
      const snap = await getAdminDb().collection('usage').doc(docId).get();
      const data = snap.exists ? snap.data()! : {};
      result.push({
        month,
        aiCalls: (data.aiCalls as number) ?? 0,
        tokenCount: (data.tokenCount as number) ?? 0,
      });
    }

    return result;
  }
}
