
import { TInitiative } from '../../types';
import { NotificationService } from './NotificationService';
import { WebhookService } from './WebhookService';
import { logger } from '../logger';

/** In-memory deduplication: key → timestamp of last alert fired */
const recentAlerts = new Map<string, number>();

/** Minimum interval between duplicate alerts for the same initiative+type (ms) */
const ALERT_COOLDOWN_MS = 5 * 60 * 1_000; // 5 minutes

/** Evict stale entries periodically to prevent unbounded growth */
const EVICTION_INTERVAL_MS = 15 * 60 * 1_000;
setInterval(() => {
  const cutoff = Date.now() - ALERT_COOLDOWN_MS;
  for (const [key, ts] of recentAlerts) {
    if (ts < cutoff) recentAlerts.delete(key);
  }
}, EVICTION_INTERVAL_MS).unref();

/**
 * Check-and-set with minimal race window.
 * Sets the timestamp eagerly so concurrent calls see the update immediately.
 * Not fully atomic without an external lock (e.g., Redis SETNX), but the
 * window is reduced to near-zero for single-process deployments.
 */
function shouldAlert(initiativeId: string, alertType: string): boolean {
  const key = `${initiativeId}:${alertType}`;
  const now = Date.now();
  const last = recentAlerts.get(key);

  if (last && now - last < ALERT_COOLDOWN_MS) return false;

  // Set immediately before any async work to minimise the race window
  recentAlerts.set(key, now);
  return true;
}

export class AlertService {
    /** 
     * Scan an initiative for threshold violations and trigger notifications.
     * This is intended to be called after updates or by a background worker.
     * Alerts are deduplicated per initiative+alertType with a cooldown window.
     */
    static async checkThresholds(initiative: TInitiative, userId: string): Promise<void> {
        try {
            const { readinessScore, artifacts, title, orgId, id } = initiative;

            const readinessThreshold = initiative.thresholds?.readiness ?? 0.6;
            const financialThreshold = initiative.thresholds?.financial ?? 0.9;

            // 1. Readiness Score Alert
            if (readinessScore !== undefined && readinessScore < readinessThreshold && shouldAlert(id, 'low_readiness')) {
                await NotificationService.createNotification(
                    userId,
                    'risk_low_readiness',
                    'High Risk Detected',
                    `Initiative "${title}" readiness score: ${(readinessScore * 100).toFixed(0)}% (Threshold: ${(readinessThreshold * 100).toFixed(0)}%).`,
                    { initiativeId: id, orgId, score: readinessScore }
                );
                await WebhookService.deliverEvent(orgId, 'alert.high_priority', {
                    alertType: 'low_readiness',
                    initiativeId: id,
                    title,
                    score: readinessScore,
                    threshold: readinessThreshold
                });
                logger.warn({ initiativeId: id, score: readinessScore }, 'Low readiness alert triggered');
            }

            // 2. Financial Threshold Alert
            const financials = artifacts?.financials;
            if (financials && financials.budget > 0) {
                const burnRate = financials.spend / financials.budget;
                if (burnRate > financialThreshold && shouldAlert(id, 'budget_burn')) {
                     await NotificationService.createNotification(
                        userId,
                        'financial_threshold_met',
                        'Budget Alert: High Burn Rate',
                        `Initiative "${title}" budget burn: ${(burnRate * 100).toFixed(0)}% (Threshold: ${(financialThreshold * 100).toFixed(0)}%).`,
                        { initiativeId: id, orgId, burnRate }
                    );

                    await WebhookService.deliverEvent(orgId, 'alert.high_priority', {
                        alertType: 'budget_burn',
                        initiativeId: id,
                        title,
                        burnRate,
                        threshold: financialThreshold
                    });
                    logger.warn({ initiativeId: id, burnRate }, 'Financial threshold alert triggered');
                }
            }

        } catch (error) {
            logger.error({ error, initiativeId: initiative.id }, 'Alert check failed');
        }
    }
}
