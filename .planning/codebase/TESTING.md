# Testing Patterns

**Analysis Date:** 2026-04-12

## Test Framework

**Runner:**
- **Vitest 4.1.2** - Primary runner for unit and integration tests.
- Config: Integrated into `vite.config.ts`.

**Assertion Library:**
- Vitest built-in `expect`.
- Supporting `@testing-library/react` and `@testing-library/jest-dom` for UI/DOM assertions.

**Run Commands:**
```bash
npm test                              # Run all Vitest tests
npm test -- path/to/file.test.ts      # Run a specific test file
npm run test:e2e                      # Run Playwright E2E tests
npm run test:e2e:ui                   # Run Playwright with UI mode
```

## Test File Organization

**Location:**
- Unit and integration tests are collocated with source files (e.g., `services/hiveService.test.ts`).
- E2E tests are located in the `e2e/` directory.

**Naming:**
- `*.test.ts` for logic/service tests.
- `*.test.tsx` for React component tests.
- `*.spec.ts` typically used for Playwright E2E tests.

**Structure:**
```
services/
  hiveService.ts
  hiveService.test.ts          # Unit/Integration tests
e2e/
  auth.spec.ts                 # E2E tests
  dashboard.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ServiceName', () => {
  describe('methodName', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should satisfy a specific requirement', async () => {
      // Arrange
      const input = { ... };

      // Act
      const result = await ServiceName.methodName(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
    });
  });
});
```

**Patterns:**
- **Arrange-Act-Assert:** Required for readability.
- **Isolated State:** Each test should be independent; use `beforeEach` to reset services or clear Firestore mocks.

## Mocking

**Framework:**
- Vitest built-in `vi` for spying and mocking.
- `mockExternalServices.ts` provides reusable stubs for third-party integrations.

**Patterns:**
```typescript
import { vi } from 'vitest';
import { aiClient } from './aiClient';

vi.mock('./aiClient', () => ({
  aiClient: {
    generate: vi.fn(),
  },
}));

// Usage in test
vi.mocked(aiClient.generate).mockResolvedValue({ text: 'Mock Response' });
```

**What to Mock:**
- External AI Provider APIs (Gemini, Mistral).
- Firebase Authentication and Firestore writes.
- Network requests (using `msw` or simple `vi.mock`).

## E2E Testing

**Framework:**
- **Playwright** - Cross-browser testing for critical user paths.
- Config: `playwright.config.ts`.

**Key Areas:**
- Authentication flow (Login/Signup).
- Mission creation in the Hive.
- Real-time updates in the Cortex dashboard.

---

*Testing analysis: 2026-04-12*
*Update when test patterns change*
