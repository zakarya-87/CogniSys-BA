/**
 * Playwright global setup — pre-warms the Vite dev server so the first test
 * doesn't spend 30–40 s waiting for on-demand module compilation.
 */
import { request } from '@playwright/test';

export default async function globalSetup() {
  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';

  // Give the server a moment to be fully ready
  await new Promise((r) => setTimeout(r, 1000));

  // Fetch the root HTML — this triggers Vite to compile the full module graph
  const ctx = await request.newContext({ baseURL });
  try {
    await ctx.get('/', { timeout: 60_000 });
  } catch {
    // Ignore errors here — the real tests will surface them
  } finally {
    await ctx.dispose();
  }

  // Wait for Vite to finish any pending HMR / background transforms
  await new Promise((r) => setTimeout(r, 3000));
}
