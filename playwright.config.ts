import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e configuration.
 * Tests run against a running server. Start with `npm run dev` or `npm run server`
 * before executing `npm run test:e2e`.
 * Override base URL: E2E_BASE_URL=https://your-domain.run.app npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/globalSetup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5000',
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
