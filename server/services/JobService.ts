import { getAdminDb } from '../lib/firebaseAdmin';
import { NotificationService } from './NotificationService';
import { EmailService } from './EmailService';
import { UsageMeteringService } from './UsageMeteringService';
import { logger } from '../logger';

export class JobService {
  /**
   * Send notification digest emails to all users with unread notifications.
   * Designed to be called by Cloud Scheduler (POST /api/v1/admin/jobs/trigger-digest)
   * or run on a cron schedule.
   */
  static async triggerNotificationDigest(): Promise<{ processed: number; sent: number }> {
    logger.info('Starting notification digest job');

    // Get all user notification docs with unread items
    const usersSnap = await getAdminDb().collection('notifications').listDocuments();
    let processed = 0;
    let sent = 0;

    for (const userDoc of usersSnap) {
      const userId = userDoc.id;
      try {
        const unread = await NotificationService.getNotifications(userId, { unreadOnly: true, limit: 10 });
        if (unread.length === 0) continue;

        // Get user email from Firebase Auth
        const { getAdminAuth } = await import('../lib/firebaseAdmin');
        const user = await getAdminAuth().getUser(userId).catch(() => null);
        if (!user?.email) continue;

        await EmailService.sendNotificationDigest(
          user.email,
          unread.map((n) => ({ title: n.title, message: n.message })),
        );
        sent++;
      } catch (err) {
        logger.warn({ userId, err }, 'Digest job: failed for user');
      }
      processed++;
    }

    logger.info({ processed, sent }, 'Notification digest job complete');
    return { processed, sent };
  }

  /**
   * Generate and log monthly usage reports for all orgs.
   * Designed for Cloud Scheduler trigger on 1st of each month.
   */
  static async triggerUsageReport(): Promise<{ orgsReported: number }> {
    logger.info('Starting monthly usage report job');

    const orgsSnap = await getAdminDb().collection('organizations').listDocuments();
    let orgsReported = 0;

    for (const orgDoc of orgsSnap) {
      const orgId = orgDoc.id;
      try {
        const usage = await UsageMeteringService.getUsage(orgId);
        if (!usage) continue;

        logger.info(
          { orgId, plan: usage.plan, aiCalls: usage.aiCalls, tokenCount: usage.tokenCount, month: usage.month },
          'Monthly usage report',
        );
        orgsReported++;
      } catch (err) {
        logger.warn({ orgId, err }, 'Usage report: failed for org');
      }
    }

    logger.info({ orgsReported }, 'Monthly usage report job complete');
    return { orgsReported };
  }
}
