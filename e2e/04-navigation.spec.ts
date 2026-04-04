import { test, expect } from '@playwright/test';
import { injectFakeUser } from './helpers';

/**
 * Journey 4 — Navigation
 * Validates that sidebar navigation links are rendered and the app can
 * switch views without a full page reload (SPA navigation).
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeUser(page);
  });

  test('sidebar is visible on load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('aside')).toBeVisible({ timeout: 10_000 });
  });

  test('COGNISYS logo / brand text is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Brand text visible in expanded sidebar
    await expect(page.getByText('COGNISYS').first()).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar contains navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // At least one nav button must be present (dashboard, settings, help, etc.)
    const navButtons = page.locator('nav button, nav a');
    await expect(navButtons.first()).toBeVisible({ timeout: 10_000 });
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(3);
  });

  test('clicking a nav item does not cause a full page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Track navigation events — SPA nav should NOT trigger a full reload
    let fullReload = false;
    page.on('load', () => { fullReload = true; });

    // Click the first nav button (whatever it is)
    const firstNavBtn = page.locator('nav button').first();
    if (await firstNavBtn.isVisible()) {
      await firstNavBtn.click();
      await page.waitForTimeout(500);
    }

    expect(fullReload).toBe(false);
  });
});
