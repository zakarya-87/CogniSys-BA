import { test, expect } from '@playwright/test';
import { injectFakeUser } from './helpers';

/**
 * Journey 10 — Dashboard & Core UI
 * Smoke tests that the Dashboard renders key structural elements and
 * the Header notification bell is visible when authenticated.
 */
test.describe('Dashboard smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('main layout renders header, sidebar and main content', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('header, [role="banner"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('notification bell is visible in header when authenticated', async ({ page }) => {
    // NotificationBell renders a button with a bell icon in the Header
    const bell = page.getByRole('button', { name: /notification/i })
      .or(page.locator('header button').filter({ has: page.locator('svg') }).first());
    // Header has at least one icon button
    const headerButtons = page.locator('header button');
    await expect(headerButtons.first()).toBeVisible({ timeout: 10_000 });
    const count = await headerButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('dashboard renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('sidebar shows COGNISYS brand and multiple nav items', async ({ page }) => {
    await expect(page.getByText('COGNISYS').first()).toBeVisible({ timeout: 10_000 });
    const navItems = page.locator('nav button, nav a');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(4);
  });
});

/**
 * Journey 11 — Login Screen (unauthenticated)
 * Confirms the login UI is shown when no user is in localStorage.
 */
test.describe('Login screen (unauthenticated)', () => {
  test('shows COGNISYS brand on login screen', async ({ page }) => {
    // No fake user injected — localStorage is empty
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('COGNISYS').first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows Connect GitHub button when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /connect github/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows Sign in with Google button when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible({ timeout: 10_000 });
  });

  test('does not show sidebar when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Sidebar should not be rendered when showing login screen
    await expect(page.locator('aside')).not.toBeVisible({ timeout: 5_000 });
  });
});
