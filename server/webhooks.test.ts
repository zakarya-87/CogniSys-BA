// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app';

// Mock Firebase Admin to return an admin-privileged token
vi.mock('./lib/firebaseAdmin', () => ({
  getAdminDb: vi.fn(),
  getAdminAuth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-1', orgId: 'org-1', role: 'admin' }),
  })),
}));

// Mock WebhookService to return a webhook that contains a secret (server must not return it)
vi.mock('./services/WebhookService', () => ({
  WebhookService: {
    registerWebhook: vi.fn().mockResolvedValue({
      id: 'wh-1',
      orgId: 'org-1',
      url: 'https://example.com',
      events: ['member.joined'],
      secret: 's3cr3t',
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: 'user-1',
    }),
    listWebhooks: vi.fn().mockResolvedValue([]),
    deleteWebhook: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Webhook registration', () => {
  it('does not return the secret in the response', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/v1/organizations/org-1/webhooks')
      .set('Authorization', 'Bearer valid')
      .send({ url: 'https://example.com', events: ['member.joined'] });

    expect(res.status).toBe(201);
    expect(res.body.webhook).toBeDefined();
    expect(res.body.webhook.secret).toBeUndefined();
    expect(res.body.secret).toBeUndefined();
  });
});
