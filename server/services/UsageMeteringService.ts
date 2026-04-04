import { getAdminDb } from '../lib/firebaseAdmin';

export type AIPlan = 'free' | 'pro' | 'enterprise';

export interface OrgUsage {
  orgId: string;
  month: string; // YYYY-MM
  plan: AIPlan;
  aiCalls: number;
  tokenCount: number;
  updatedAt: string;
}

/** Monthly AI call quotas per plan. Infinity = unlimited. */
const PLAN_QUOTAS: Record<AIPlan, number> = {
  free:       100,
  pro:        Infinity,
  enterprise: Infinity,
};

export class UsageMeteringService {
  private static col() {
    return getAdminDb().collection('usage');
  }

  private static monthKey(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private static docId(orgId: string, month: string): string {
    return `${orgId}_${month}`;
  }

  /** Track an AI call for an org. Returns updated usage. */
  static async trackAICall(
    orgId: string,
    model: string,
    tokens: number,
    plan: AIPlan = 'free',
  ): Promise<OrgUsage> {
    const month = UsageMeteringService.monthKey();
    const docRef = UsageMeteringService.col().doc(UsageMeteringService.docId(orgId, month));

    const snap = await docRef.get();
    const existing = snap.exists ? (snap.data() as OrgUsage) : null;

    const updated: OrgUsage = {
      orgId,
      month,
      plan: existing?.plan ?? plan,
      aiCalls: (existing?.aiCalls ?? 0) + 1,
      tokenCount: (existing?.tokenCount ?? 0) + tokens,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updated, { merge: true });
    return updated;
  }

  /** Get usage for an org for a given month (defaults to current). */
  static async getUsage(orgId: string, month?: string): Promise<OrgUsage | null> {
    const m = month ?? UsageMeteringService.monthKey();
    const snap = await UsageMeteringService.col().doc(UsageMeteringService.docId(orgId, m)).get();
    return snap.exists ? (snap.data() as OrgUsage) : null;
  }

  /** Check whether an org has quota remaining. Throws 429 if quota exceeded. */
  static async enforceQuota(orgId: string, plan: AIPlan = 'free'): Promise<void> {
    const quota = PLAN_QUOTAS[plan];
    if (quota === Infinity) return;

    const usage = await UsageMeteringService.getUsage(orgId);
    const currentCalls = usage?.aiCalls ?? 0;

    if (currentCalls >= quota) {
      throw Object.assign(
        new Error(`AI quota exceeded: ${currentCalls}/${quota} calls used this month`),
        { statusCode: 429 },
      );
    }
  }

  /** Update an org's plan. */
  static async setPlan(orgId: string, plan: AIPlan): Promise<void> {
    const month = UsageMeteringService.monthKey();
    const docRef = UsageMeteringService.col().doc(UsageMeteringService.docId(orgId, month));
    await docRef.set({ orgId, month, plan, updatedAt: new Date().toISOString() }, { merge: true });
  }
}
