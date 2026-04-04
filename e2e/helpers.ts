import { Page } from '@playwright/test';

/**
 * Injects a fake authenticated user and a fake organization into localStorage
 * so the auth gate renders the main app and org-scoped views load correctly.
 * Also sets __playwright_skip_auth__ so Firebase's onAuthStateChanged callback
 * doesn't override the fake user with null.
 */
export async function injectFakeUser(page: Page) {
  await page.addInitScript(() => {
    const fakeUser = {
      id: 'e2e-test-user',
      name: 'E2E Tester',
      email: 'e2e@cognisys.io',
      avatarUrl: null,
    };
    const fakeOrg = {
      id: 'e2e-org-1',
      name: 'E2E Organisation',
      ownerId: 'e2e-test-user',
      members: [{ userId: 'e2e-test-user', role: 'admin' }],
    };
    localStorage.setItem('cognisys-user', JSON.stringify(fakeUser));
    localStorage.setItem('cognisys-organizations', JSON.stringify([fakeOrg]));
    // Prevent Firebase onAuthStateChanged from overriding the fake user with null
    localStorage.setItem('__playwright_skip_auth__', '1');
  });
}
