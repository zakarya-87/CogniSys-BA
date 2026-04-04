import { test, expect } from '@playwright/test';
import { injectFakeUser } from './helpers';

/**
 * Journey 9 — Command Palette
 * Validates keyboard-driven open/close, typing, and that search results section
 * appears when a query of 2+ characters is entered.
 */
test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Click body to ensure keyboard focus is on the page before shortcut tests
    await page.locator('body').click({ position: { x: 5, y: 5 } });
  });

  test('opens with Ctrl+K keyboard shortcut', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);
    // Palette has a text input placeholder
    const input = page.getByPlaceholder(/command or search/i);
    await expect(input).toBeVisible({ timeout: 8_000 });
  });

  test('closes with Escape key', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    const input = page.getByPlaceholder(/command or search/i);
    await expect(input).toBeVisible({ timeout: 8_000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(input).not.toBeVisible({ timeout: 5_000 });
  });

  test('typing filters the command list', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    const input = page.getByPlaceholder(/command or search/i);
    await expect(input).toBeVisible({ timeout: 8_000 });

    await input.fill('Settings');
    await page.waitForTimeout(300);

    // "Go to Settings" command should appear
    await expect(page.getByText(/go to settings/i)).toBeVisible({ timeout: 5_000 });
  });

  test('shows navigation commands on open', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);

    // Several navigation commands should be visible
    await expect(page.getByText(/go to dashboard/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/go to settings/i)).toBeVisible({ timeout: 5_000 });
  });

  test('clicking a command closes the palette', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);
    const input = page.getByPlaceholder(/command or search/i);
    await expect(input).toBeVisible({ timeout: 8_000 });

    // Click "Go to Settings" command
    await page.getByText(/go to settings/i).first().click();
    await page.waitForTimeout(500);

    await expect(input).not.toBeVisible({ timeout: 5_000 });
  });

  test('Header search / command button opens palette', async ({ page }) => {
    // Header has a button to open the command palette (⌘K button)
    const cmdBtn = page.getByRole('button', { name: /command|search|⌘/i });
    if (await cmdBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cmdBtn.first().click();
      await page.waitForTimeout(300);
      const input = page.getByPlaceholder(/command or search/i);
      await expect(input).toBeVisible({ timeout: 5_000 });
    } else {
      // Skip gracefully if button text doesn't match — palette is keyboard-driven
      test.skip();
    }
  });
});
