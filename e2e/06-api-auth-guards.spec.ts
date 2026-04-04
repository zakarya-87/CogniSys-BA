import { test, expect } from '@playwright/test';

/**
 * Journey 6 — Backend API Auth Guards (Phase 6-10 routes)
 * Every protected endpoint must return 401 (not 404) when called without
 * a valid Authorization token. 401 proves the route exists and is guarded.
 * 404 would mean the route is missing or mis-registered.
 */

const ORG_ID = 'test-org-123';

test.describe('Organisation API auth guards', () => {
  test('POST /api/v1/organizations returns 401', async ({ request }) => {
    const res = await request.post('/api/v1/organizations', { data: { name: 'Test' } });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/organizations/:orgId returns 401', async ({ request }) => {
    const res = await request.get(`/api/v1/organizations/${ORG_ID}`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Members API auth guards', () => {
  test('GET /api/v1/organizations/:orgId/members returns 401', async ({ request }) => {
    const res = await request.get(`/api/v1/organizations/${ORG_ID}/members`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/organizations/:orgId/members/:userId returns 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/organizations/${ORG_ID}/members/user-abc`);
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/organizations/:orgId/members/:userId/role returns 401', async ({ request }) => {
    const res = await request.patch(`/api/v1/organizations/${ORG_ID}/members/user-abc/role`, {
      data: { role: 'member' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Invitations API auth guards', () => {
  test('GET /api/v1/organizations/:orgId/invitations returns 401', async ({ request }) => {
    const res = await request.get(`/api/v1/organizations/${ORG_ID}/invitations`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/organizations/:orgId/invitations returns 401', async ({ request }) => {
    const res = await request.post(`/api/v1/organizations/${ORG_ID}/invitations`, {
      data: { email: 'test@example.com', role: 'member' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Billing API auth guards', () => {
  test('GET /api/v1/organizations/:orgId/billing returns 401', async ({ request }) => {
    const res = await request.get(`/api/v1/organizations/${ORG_ID}/billing`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/organizations/:orgId/billing/checkout returns 401', async ({ request }) => {
    const res = await request.post(`/api/v1/organizations/${ORG_ID}/billing/checkout`, {
      data: { plan: 'pro', successUrl: 'http://x', cancelUrl: 'http://x' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/organizations/:orgId/billing/portal returns 401', async ({ request }) => {
    const res = await request.post(`/api/v1/organizations/${ORG_ID}/billing/portal`, {
      data: { returnUrl: 'http://x' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Search API auth guards', () => {
  test('GET /api/v1/organizations/:orgId/search returns 401', async ({ request }) => {
    const res = await request.get(`/api/v1/organizations/${ORG_ID}/search?q=test`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Notifications API auth guards', () => {
  test('GET /api/v1/notifications returns 401', async ({ request }) => {
    const res = await request.get('/api/v1/notifications');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/notifications/stream returns 401 without token', async ({ request }) => {
    const res = await request.get('/api/v1/notifications/stream');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/notifications/:id/read returns 401', async ({ request }) => {
    const res = await request.patch('/api/v1/notifications/notif-abc/read');
    expect(res.status()).toBe(401);
  });
});

test.describe('Usage & Analytics API auth guards', () => {
  test('GET /api/v1/organizations/:orgId/usage returns 401', async ({ request }) => {
    const res = await request.get(`/api/v1/organizations/${ORG_ID}/usage`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/organizations/:orgId/analytics/activity returns 401', async ({ request }) => {
    const res = await request.get(`/api/v1/organizations/${ORG_ID}/analytics/activity`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/organizations/:orgId/analytics/initiatives returns 401', async ({ request }) => {
    const res = await request.get(`/api/v1/organizations/${ORG_ID}/analytics/initiatives`);
    expect(res.status()).toBe(401);
  });
});

test.describe('WBS & Risk AI endpoints auth guards', () => {
  test('POST /api/v1/organizations/:orgId/initiatives/:iid/wbs returns 401', async ({ request }) => {
    const res = await request.post(`/api/v1/organizations/${ORG_ID}/initiatives/init-abc/wbs`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/organizations/:orgId/initiatives/:iid/risks returns 401', async ({ request }) => {
    const res = await request.post(`/api/v1/organizations/${ORG_ID}/initiatives/init-abc/risks`);
    expect(res.status()).toBe(401);
  });
});
