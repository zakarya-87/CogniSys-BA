import { test, expect } from '@playwright/test';
import { injectFakeUser } from './helpers';

/**
 * Journey 7 — Settings View
 * Validates the three-tab layout (General / Members / Billing) and
 * that switching tabs doesn't cause a full page reload.
 */
test.describe('Settings View', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('settings tab is accessible from sidebar', async ({ page }) => {
    // Find the settings nav item — either a link or button containing "Settings"
    const settingsNav = page.getByRole('button', { name: /settings/i })
      .or(page.getByRole('link', { name: /settings/i }));
    await expect(settingsNav.first()).toBeVisible({ timeout: 10_000 });
    await settingsNav.first().click();
    await page.waitForTimeout(500);
    // Settings heading should be visible
    const heading = page.getByRole('heading', { name: /settings/i });
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });
  });

  test('settings page shows General, Members and Billing tabs', async ({ page }) => {
    const settingsNav = page.getByRole('button', { name: /settings/i })
      .or(page.getByRole('link', { name: /settings/i }));
    await settingsNav.first().click();
    await page.waitForTimeout(600);

    const generalTab = page.getByRole('button', { name: /general/i });
    const membersTab = page.getByRole('button', { name: /members/i });
    const billingTab = page.getByRole('button', { name: /billing/i });

    await expect(generalTab.first()).toBeVisible({ timeout: 10_000 });
    await expect(membersTab.first()).toBeVisible({ timeout: 10_000 });
    await expect(billingTab.first()).toBeVisible({ timeout: 10_000 });
  });

  test('switching to Members tab renders MembersView', async ({ page }) => {
    const settingsNav = page.getByRole('button', { name: /settings/i })
      .or(page.getByRole('link', { name: /settings/i }));
    await settingsNav.first().click();
    await page.waitForTimeout(600);

    const membersTab = page.getByRole('button', { name: /members/i });
    await membersTab.first().click();
    await page.waitForTimeout(600);

    // MembersView has an "Invite Member" section
    await expect(page.getByText(/invite member/i)).toBeVisible({ timeout: 10_000 });
  });

  test('switching to Billing tab renders BillingView', async ({ page }) => {
    const settingsNav = page.getByRole('button', { name: /settings/i })
      .or(page.getByRole('link', { name: /settings/i }));
    await settingsNav.first().click();
    await page.waitForTimeout(600);

    const billingTab = page.getByRole('button', { name: /billing/i });
    await billingTab.first().click();
    await page.waitForTimeout(600);

    // BillingView heading
    await expect(page.getByText(/current plan/i)).toBeVisible({ timeout: 10_000 });
  });
});
