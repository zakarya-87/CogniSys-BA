import { test, expect } from '@playwright/test';

/**
 * Journey 3 — Authentication Entry Point
 * Validates sign-in buttons are visible and the Firebase Auth redirect chain
 * is reachable. Full OAuth flow is not testable in e2e (requires GitHub/Google
 * redirect), so we validate the UI prompt and server redirect.
 */
test.describe('Authentication UI', () => {
  test('shows Connect GitHub button when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const btn = page.getByRole('button', { name: /connect github/i });
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });

  test('shows Sign in with Google button when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const btn = page.getByRole('button', { name: /sign in with google/i });
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });

  test('POST /api/auth/firebase-session without token returns 400', async ({ request }) => {
    const res = await request.post('/api/auth/firebase-session', { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('POST /api/auth/logout clears session and returns 200', async ({ request }) => {
    const res = await request.post('/api/auth/logout');
    expect(res.status()).toBe(200);
    expect((await res.json())).toMatchObject({ status: 'logged_out' });
  });
});
