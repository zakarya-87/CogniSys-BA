import { test, expect } from '@playwright/test';

/**
 * Journey 2 — App Shell Loads
 * The SPA must render without a white screen and with no uncaught JS errors.
 */
test.describe('App shell', () => {
  test('homepage loads — root element is populated', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('no uncaught JS errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('non-API paths serve index.html for SPA routing', async ({ request }) => {
    const res = await request.get('/dashboard');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
  });

  test('static assets are served correctly', async ({ request }) => {
    // The Vite-built app always emits an index.html — it must be present
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<div id="root">');
  });
});
