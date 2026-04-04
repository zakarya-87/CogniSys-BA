import { test, expect } from '@playwright/test';

/**
 * Journey 5 — AI API endpoints
 * Validates that AI proxy routes are reachable and return proper auth guards
 * (401 when unauthenticated — not 404 which would mean routes don't exist).
 */
test.describe('AI API endpoints', () => {
  test('POST /api/gemini/generate returns 401 without auth (not 404)', async ({ request }) => {
    const res = await request.post('/api/gemini/generate', {
      data: { prompt: 'hello' },
    });
    // Route exists and enforces auth — 401 is expected, 404 would mean route missing
    expect(res.status()).toBe(401);
  });

  test('POST /api/gemini/embed returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/gemini/embed', {
      data: { text: 'hello' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/mistral/chat returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/mistral/chat', {
      data: { messages: [] },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/github/repos returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/github/repos');
    expect(res.status()).toBe(401);
  });

  test('GET /api/ai/stream/:id returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/ai/stream/test-op-id');
    expect(res.status()).toBe(401);
  });
});
