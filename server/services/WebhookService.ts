import { createHmac, randomUUID } from 'crypto';
import { getAdminDb } from '../lib/firebaseAdmin';
import { logger } from '../logger';

export type WebhookEvent =
  | 'member.joined'
  | 'member.removed'
  | 'initiative.created'
  | 'initiative.updated'
  | 'ai.complete'
  | 'invitation.accepted';

export interface OrgWebhook {
  id: string;
  orgId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface WebhookDeliveryResult {
  webhookId: string;
  status: number | null;
  success: boolean;
  error?: string;
}

export class WebhookService {
  private static col() {
    return getAdminDb().collection('webhooks');
  }

  /** Register a new webhook for an org. */
  static async registerWebhook(
    orgId: string,
    url: string,
    events: WebhookEvent[],
    createdBy: string,
  ): Promise<OrgWebhook> {
    const webhook: OrgWebhook = {
      id: randomUUID(),
      orgId,
      url,
      events,
      secret: randomUUID().replace(/-/g, ''),
      active: true,
      createdAt: new Date().toISOString(),
      createdBy,
    };
    await WebhookService.col().doc(webhook.id).set(webhook);
    return webhook;
  }

  /** List webhooks for an org. */
  static async listWebhooks(orgId: string): Promise<Omit<OrgWebhook, 'secret'>[]> {
    const snap = await WebhookService.col().where('orgId', '==', orgId).get();
    return snap.docs.map((d) => {
      const { secret: _secret, ...rest } = d.data() as OrgWebhook;
      return rest;
    });
  }

  /** Delete a webhook. */
  static async deleteWebhook(webhookId: string, orgId: string): Promise<void> {
    const doc = await WebhookService.col().doc(webhookId).get();
    if (!doc.exists) throw Object.assign(new Error('Webhook not found'), { statusCode: 404 });
    const wh = doc.data() as OrgWebhook;
    if (wh.orgId !== orgId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    await doc.ref.delete();
  }

  /** Deliver an event to all matching org webhooks. Fires-and-forgets individual deliveries. */
  static async deliverEvent(
    orgId: string,
    event: WebhookEvent,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const snap = await WebhookService.col()
      .where('orgId', '==', orgId)
      .where('active', '==', true)
      .get();

    const webhooks = snap.docs
      .map((d) => d.data() as OrgWebhook)
      .filter((wh) => wh.events.includes(event));

    await Promise.allSettled(
      webhooks.map((wh) => WebhookService.deliver(wh, event, payload)),
    );
  }

  private static async deliver(
    wh: OrgWebhook,
    event: WebhookEvent,
    payload: Record<string, unknown>,
  ): Promise<WebhookDeliveryResult> {
    const body = JSON.stringify({ event, orgId: wh.orgId, timestamp: new Date().toISOString(), payload });
    const sig = createHmac('sha256', wh.secret).update(body).digest('hex');

    try {
      const res = await fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CogniSys-Event': event,
          'X-CogniSys-Signature': `sha256=${sig}`,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      const result: WebhookDeliveryResult = {
        webhookId: wh.id,
        status: res.status,
        success: res.ok,
      };

      if (!res.ok) {
        logger.warn({ webhookId: wh.id, status: res.status, url: wh.url }, 'Webhook delivery failed');
      } else {
        logger.info({ webhookId: wh.id, event }, 'Webhook delivered');
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      logger.error({ webhookId: wh.id, url: wh.url, error }, 'Webhook delivery error');
      return { webhookId: wh.id, status: null, success: false, error };
    }
  }
}
