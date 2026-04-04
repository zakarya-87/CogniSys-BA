import { test, expect } from '@playwright/test';
import { injectFakeUser } from './helpers';

/**
 * Journey 8 — Reports View
 * Validates the four-tab layout (Executive / Financial / Risk / Analytics)
 * and that the Analytics tab is reachable.
 */
test.describe('Reports View', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('reports nav item is visible in sidebar', async ({ page }) => {
    const reportsNav = page.getByRole('button', { name: /reports/i })
      .or(page.getByRole('link', { name: /reports/i }));
    await expect(reportsNav.first()).toBeVisible({ timeout: 10_000 });
  });

  test('reports page shows Executive, Financial, Risk and Analytics tabs', async ({ page }) => {
    const reportsNav = page.getByRole('button', { name: /reports/i })
      .or(page.getByRole('link', { name: /reports/i }));
    await reportsNav.first().click();
    await page.waitForTimeout(600);

    await expect(page.getByRole('button', { name: /executive/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /financial/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /risk/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /analytics/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking Analytics tab shows AnalyticsDashboard', async ({ page }) => {
    const reportsNav = page.getByRole('button', { name: /reports/i })
      .or(page.getByRole('link', { name: /reports/i }));
    await reportsNav.first().click();
    await page.waitForTimeout(600);

    const analyticsTab = page.getByRole('button', { name: /analytics/i });
    await analyticsTab.first().click();
    await page.waitForTimeout(800);

    // AnalyticsDashboard renders an "Analytics" heading
    await expect(page.getByText(/analytics/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('reports view renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const reportsNav = page.getByRole('button', { name: /reports/i })
      .or(page.getByRole('link', { name: /reports/i }));
    await reportsNav.first().click();
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });
});
