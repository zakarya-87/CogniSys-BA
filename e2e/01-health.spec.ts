import { test, expect } from '@playwright/test';

/**
 * Journey 1 — API Health
 * The server must respond to health checks on both the legacy and versioned routes.
 */
test.describe('API health', () => {
  test('GET /api/health returns 200 with status ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok' });
  });

  test('GET /api/v1/health returns 200 with version', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok', version: 'v1' });
  });

  test('unknown /api/* route returns JSON 404 not HTML', async ({ request }) => {
    const res = await request.get('/api/does-not-exist-xyz');
    expect(res.status()).toBe(404);
    expect(res.headers()['content-type']).toContain('application/json');
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});
