# Test Strategy & Quality Assurance Plan

> **Date:** 2026-04-04
> **Scope:** CogniSys BA — Comprehensive testing strategy with frontend-backend-DB consistency guarantees and resilience testing
> **Audience:** Engineering team
> **Coverage Target:** 80%+ (blocking in CI)

---

## 1. Current State Assessment

### 1.1 Testing Infrastructure Inventory

| Category | Tool | Status |
|---|---|---|
| **Unit Testing** | Vitest v4.1.2 + jsdom | Configured, minimal coverage |
| **Component Testing** | Vitest + React Testing Library | Configured, 2/119 components tested |
| **E2E Testing** | Playwright (Chromium only) | Configured, 5 journeys, NOT in CI |
| **Load Testing** | k6 | 3 scripts, NOT in CI |
| **API Testing** | Supertest (via Vitest) | 1 integration test file (app.test.ts) |
| **Coverage** | None configured | No coverage tool, no thresholds |
| **Static Analysis** | TypeScript (non-strict) | `npm run lint` = `tsc --noEmit`, non-blocking in CI |
| **Linting** | None | No ESLint, no Prettier |
| **Pre-commit** | Husky + lint-staged | Runs `npm run test` on staged `.ts/.tsx` files |
| **CI Pipeline** | GitHub Actions | Unit tests only; E2E and load tests excluded |
| **Deploy Pipeline** | GitHub Actions | Build → push → deploy → minimal smoke test |

### 1.2 Coverage Statistics

| Metric | Current | Target |
|---|---|---|
| Components tested | 2/119 (1.7%) | 80%+ |
| Services tested (client) | 1/17 (5.9%) | 80%+ |
| Server services tested | 0/19 (all mocked) | 80%+ |
| AI agents tested | 0/5 (all mocked) | 80%+ |
| Repositories tested | 0/4 | 80%+ |
| Hooks tested | 0/3 | 90%+ |
| Context providers tested | 0/2 | 80%+ |
| Middleware tested | 0/3 | 90%+ |
| Utils tested | 2/6 (33%) | 90%+ |
| E2E journeys | 5 (unauthenticated only) | 10+ (full authenticated flows) |
| Load test profiles | 3 | 6+ (including soak test) |

### 1.3 Critical Gaps

| Gap | Impact | Severity |
|---|---|---|
| **No coverage tracking** | No visibility into what's tested | **HIGH** |
| **No ESLint/Prettier** | Inconsistent code quality | **HIGH** |
| **TypeScript non-strict** | Hidden type bugs | **HIGH** |
| **E2E not in CI** | UI regressions ship to production | **HIGH** |
| **No authenticated E2E flows** | Auth/CRUD never tested end-to-end | **HIGH** |
| **All server services mocked** | Real DB interactions never tested | **HIGH** |
| **No contract testing** | Frontend-backend API drift undetected | **MEDIUM** |
| **No chaos/resilience testing** | Failure modes unknown | **MEDIUM** |
| **No test factories** | Test data hardcoded, hard to maintain | **MEDIUM** |
| **No visual regression testing** | UI changes undetected | **LOW** |
| **No accessibility testing** | a11y issues ship to production | **LOW** |

---

## 2. 7-Layer Testing Strategy

```
Layer 7 ┌─────────────────────────────────────────────┐  Resilience & Chaos
        │  Chaos Engineering, Failover, Soak Tests    │
Layer 6 └─────────────────────────────────────────────┘  Load & Performance
        │  k6: Health, API, AI, Auth, SSE, Soak       │
Layer 5 └─────────────────────────────────────────────┘  Contract Testing
        │  API Contracts (Pact), Schema Validation     │
Layer 4 └─────────────────────────────────────────────┘  E2E Integration
        │  Full user journeys, CRUD, Auth, Billing     │
Layer 3 └─────────────────────────────────────────────┘  Integration Tests
        │  Service-to-service, DB, Auth, Stripe        │
Layer 2 └─────────────────────────────────────────────┘  Unit Tests
        │  Services, utils, hooks, agents, repos       │
Layer 1 └─────────────────────────────────────────────┘  Static Analysis
        │  TypeScript strict, ESLint, Prettier         │
        └─────────────────────────────────────────────┘
```

---

## 3. Layer 1: Static Analysis & Code Quality

### 3.1 TypeScript Strict Mode

**Current:** `strict: false` in `tsconfig.json`
**Target:** `strict: true` with incremental migration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Migration strategy:**
1. Enable `strict: true` globally
2. Use `// @ts-nocheck` on files with pre-existing errors (ConceptModeler, ErrorBoundary)
3. Fix files incrementally, removing `@ts-nocheck` one by one
4. Block new code from using `@ts-nocheck`

### 3.2 ESLint Configuration

```javascript
// eslint.config.js (flat config)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', 'generated_schemas.json'],
  }
);
```

### 3.3 Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### 3.4 Updated Pre-commit Hook

```javascript
// .lintstagedrc.cjs
module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write', 'vitest run --changed --bail=1'],
  '*.{json,md,css}': ['prettier --write'],
};
```

### 3.5 New Package Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=junit --outputFile=./test-results/junit.xml",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test:ci && npm run test:e2e",
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "audit": "npm audit --audit-level=moderate"
  }
}
```

---

## 4. Layer 2: Unit Tests

### 4.1 Coverage Configuration

```typescript
// vite.config.ts — vitest section
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './vitest.setup.ts',
  exclude: ['node_modules', 'dist', 'e2e'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html', 'lcov'],
    reportsDirectory: './coverage',
    thresholds: {
      global: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    include: [
      'server/services/**/*.ts',
      'server/ai-agents/**/*.ts',
      'server/repositories/**/*.ts',
      'server/middleware/**/*.ts',
      'services/**/*.ts',
      'utils/**/*.ts',
      'hooks/**/*.ts',
      'context/**/*.tsx',
      'components/**/*.tsx',
    ],
    exclude: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.d.ts',
      'server/lib/**',
      'firebase.ts',
      'mockExternalServices.ts',
    ],
  },
}
```

### 4.2 Test Factories

```typescript
// test/factories/organizationFactory.ts
import { Organization } from '../../types';

let idCounter = 1;

export function createOrganization(overrides: Partial<Organization> = {}): Organization {
  return {
    id: `org_test_${idCounter++}`,
    name: `Test Organization ${idCounter}`,
    sector: 'GENERAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: 'user_test_001',
    ...overrides,
  };
}

// test/factories/projectFactory.ts
export function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: `proj_test_${idCounter++}`,
    name: `Test Project ${idCounter}`,
    orgId: overrides.orgId || 'org_test_001',
    status: 'DRAFT',
    sector: 'GENERAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// test/factories/initiativeFactory.ts
export function createInitiative(overrides: Partial<Initiative> = {}): Initiative {
  return {
    id: `init_test_${idCounter++}`,
    name: `Test Initiative ${idCounter}`,
    projectId: overrides.projectId || 'proj_test_001',
    orgId: overrides.orgId || 'org_test_001',
    status: 'DRAFT',
    type: 'FEATURE',
    priority: 'MEDIUM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// test/factories/userFactory.ts
export function createAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    uid: `user_test_${idCounter++}`,
    email: `test${idCounter}@example.com`,
    displayName: `Test User ${idCounter}`,
    customClaims: { role: 'admin', orgId: 'org_test_001' },
    ...overrides,
  };
}
```

### 4.3 Server Services Test Plan

**Priority: HIGH — All 19 services need real tests (not mocks)**

| Service | Test Focus | Est. Tests |
|---|---|---|
| `OrganizationService` | CRUD, validation, member management | 12 |
| `ProjectService` | CRUD, status transitions, org association | 12 |
| `InitiativeService` | CRUD, artifact generation, traceability | 15 |
| `AuthService` | Token verification, role resolution, session | 10 |
| `AuditLogService` | Log creation, query, retention | 8 |
| `BillingService` | Checkout, portal, webhook sync, Stripe events | 15 |
| `UsageMeteringService` | Call tracking, quota enforcement, plan changes | 10 |
| `TaskQueue` | Task creation, state transitions, retry | 10 |
| `TaskWorker` | Task processing, error handling, completion | 10 |
| `SseManager` | Connection management, event streaming, cleanup | 8 |
| `NotificationService` | Notification creation, delivery, read status | 8 |
| `InvitationService` | Invite creation, acceptance, expiration | 8 |
| `MemberService` | Role assignment, removal, permission checks | 8 |
| `EmailService` | Email template rendering, send (mocked SMTP) | 5 |
| `AnalyticsService` | Metric aggregation, trend calculation | 8 |
| `WebhookService` | Webhook registration, delivery, retry | 8 |
| `SearchService` | Full-text search, filtering, pagination | 8 |
| `MemoryService` | Memory storage, retrieval, similarity search | 8 |
| `JobService` | Job scheduling, execution, reporting | 5 |

**Test pattern (example):**
```typescript
// server/services/OrganizationService.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { OrganizationService } from './OrganizationService';
import { createOrganization } from '../../test/factories/organizationFactory';
import { initializeFirebaseEmulators, cleanupFirestore } from '../../test/setup/firebaseEmulator';

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeAll(async () => {
    await initializeFirebaseEmulators();
  });

  beforeEach(async () => {
    await cleanupFirestore();
    service = new OrganizationService();
  });

  afterAll(async () => {
    await cleanupFirestore();
  });

  describe('createOrganization', () => {
    it('creates an organization with valid data', async () => {
      const org = createOrganization({ name: 'Acme Corp', sector: 'FINTECH' });
      const result = await service.create(org);
      expect(result.id).toBeTruthy();
      expect(result.name).toBe('Acme Corp');
      expect(result.sector).toBe('FINTECH');
    });

    it('throws on duplicate organization name', async () => {
      const org = createOrganization({ name: 'Duplicate Corp' });
      await service.create(org);
      await expect(service.create(org)).rejects.toThrow();
    });
  });

  describe('getOrganization', () => {
    it('returns organization by ID', async () => {
      const created = await service.create(createOrganization());
      const found = await service.get(created.id);
      expect(found).toBeTruthy();
      expect(found!.id).toBe(created.id);
    });

    it('returns null for non-existent organization', async () => {
      const found = await service.get('non-existent');
      expect(found).toBeNull();
    });
  });
});
```

### 4.4 AI Agents Test Plan

| Agent | Test Focus | Est. Tests |
|---|---|---|
| `WBSGeneratorAgent` | Input validation, output structure, error handling | 8 |
| `RiskAssessorAgent` | Risk identification, scoring, mitigation suggestions | 8 |
| `ArtifactAnalyzerAgent` | Document parsing, analysis, recommendations | 8 |
| `ModelRouter` | Provider selection, fallback, error routing | 10 |
| `PromptManager` | Prompt retrieval, versioning, caching | 6 |

**Test pattern (deterministic LLM mock):**
```typescript
// server/ai-agents/WBSGeneratorAgent.test.ts
import { describe, it, expect, vi } from 'vitest';
import { WBSGeneratorAgent } from './WBSGeneratorAgent';

const mockGenerate = vi.fn().mockResolvedValue({
  text: JSON.stringify({
    phases: [
      {
        name: 'Phase 1',
        tasks: [{ name: 'Task 1', estimate: '2d', dependencies: [] }]
      }
    ]
  })
});

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerate }
  }))
}));

describe('WBSGeneratorAgent', () => {
  it('generates valid WBS structure from project description', async () => {
    const agent = new WBSGeneratorAgent();
    const result = await agent.generate({
      projectId: 'proj_001',
      description: 'Build a user authentication system',
      sector: 'SAAS_CLOUD'
    });
    expect(result.phases).toBeDefined();
    expect(result.phases.length).toBeGreaterThan(0);
  });

  it('falls back to secondary model on primary failure', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('Quota exceeded'));
    // Verify fallback model is called
  });
});
```

### 4.5 Client Services Test Plan

| Service | Test Focus | Est. Tests |
|---|---|---|
| `geminiService` | Prompt construction, response parsing, error handling | 15 |
| `promptFactory` | Sector-specific prompts, multi-language, context injection | 12 |
| `mathService` | Monte Carlo, cosine similarity, quantile calculation | 10 |
| `memoryService` | Vector storage, retrieval, similarity search | 8 |
| `cortexService` | Knowledge graph, insight generation | 8 |
| `oracleService` | RAG query, semantic search | 8 |
| `hiveService` | Already tested — expand coverage | 5 |
| `microservices` | Agent behaviors, tool execution | 10 |
| `predictiveService` | Forecasting, trend analysis | 6 |

### 4.6 Hooks & Context Test Plan

| Module | Test Focus | Est. Tests |
|---|---|---|
| `useAIStream` | Stream connection, message handling, reconnection | 8 |
| `useFeatureFlag` | Flag resolution, env override, caching | 5 |
| `useHivePersistence` | State save/restore, conflict resolution | 5 |
| `ApiStatusContext` | Status state management, quota detection | 5 |
| `CatalystContext` | Org/project/initiative selection, navigation | 8 |

---

## 5. Layer 3: Integration Tests

### 5.1 Firestore Emulator Setup

```typescript
// test/setup/firebaseEmulator.ts
import { execSync } from 'child_process';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let emulatorProcess: ReturnType<typeof require('child_process').spawn>;

export async function initializeFirebaseEmulators() {
  // Start Firestore emulator
  emulatorProcess = execSync('firebase emulators:start --only firestore --project test-project', {
    stdio: 'inherit'
  });
  
  // Wait for emulator to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Initialize Firebase Admin against emulator
  initializeApp({
    projectId: 'test-project',
    credential: cert({
      projectId: 'test-project',
      clientEmail: 'test@test-project.iam.gserviceaccount.com',
      privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----\n'
    })
  });
}

export async function cleanupFirestore() {
  const db = getFirestore();
  const collections = await db.listCollections();
  for (const collection of collections) {
    const docs = await collection.listDocuments();
    for (const doc of docs) {
      await doc.delete();
    }
  }
}
```

### 5.2 Integration Test Categories

| Category | What | How |
|---|---|---|
| **DB Integration** | Repositories against real Firestore emulator | Vitest + Firestore Emulator |
| **Auth Integration** | Firebase Auth flow with emulator | Firebase Auth Emulator + programmatic user creation |
| **Stripe Integration** | BillingService with Stripe test mode | Stripe test keys, webhook test signatures |
| **AI Integration** | AI agents with deterministic mocked LLM | Vitest mocks with controlled responses |
| **SSE Integration** | Stream delivery, operation tracking, cleanup | Supertest + SSE parser |
| **Task Queue** | Task creation → processing → completion → SSE notification | Firestore emulator + mocked agents |

### 5.3 Auth Integration Test Example

```typescript
// test/integration/auth.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/app';
import { createAuthUser } from '../factories/userFactory';
import { getAuth } from 'firebase-admin/auth';

describe('Auth Integration', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    app = createApp();
  });

  describe('token verification', () => {
    it('accepts valid Firebase token', async () => {
      const user = createAuthUser();
      const token = await getAuth().createCustomToken(user.uid);
      
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).not.toBe(401);
    });

    it('rejects expired token', async () => {
      const token = 'expired.token.value';
      
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(401);
    });
  });
});
```

---

## 6. Layer 4: E2E Tests (Playwright)

### 6.1 E2E Test Plan

| Journey | Description | Priority | Est. Tests |
|---|---|---|---|
| **Full Auth Flow** | Sign up → verify → login → session → logout | **HIGH** | 5 |
| **Organization CRUD** | Create → edit → view → delete → verify in DB | **HIGH** | 6 |
| **Project Lifecycle** | Create project → add initiatives → generate AI artifact → verify | **HIGH** | 8 |
| **Billing Flow** | View plan → upgrade via Stripe → verify plan change → portal | **HIGH** | 5 |
| **AI Generation** | Submit prompt → stream response → validate JSON → save artifact | **HIGH** | 8 |
| **Hive Orchestration** | Start hive → delegate → HITL approval → complete | **MEDIUM** | 5 |
| **Multi-user** | Invite member → accept → verify permissions → collaborate | **MEDIUM** | 5 |
| **Error States** | Network failure → offline mode → recovery | **MEDIUM** | 4 |
| **Settings** | Update profile → change theme → feature flags | **LOW** | 3 |
| **Reports** | Generate report → download → verify content | **LOW** | 3 |

### 6.2 Updated Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html'], ['junit', { outputFile: 'test-results/e2e-junit.xml' }]] : 'html',
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 6.3 Authenticated E2E Test Pattern

```typescript
// e2e/06-authenticated-crud.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateUser, cleanupTestData } from './helpers/auth';

test.describe('Authenticated CRUD Operations', () => {
  test('create organization persists and reads back correctly', async ({ page }) => {
    // 1. Authenticate
    await authenticateUser(page, 'admin@test.com', 'password123');
    
    // 2. Navigate to organizations
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Create Organization' }).click();
    
    // 3. Fill and submit form
    await page.getByLabel('Organization Name').fill('E2E Test Org');
    await page.getByLabel('Sector').selectOption('FINTECH');
    await page.getByRole('button', { name: 'Create' }).click();
    
    // 4. Verify in UI (frontend read)
    await expect(page.getByText('E2E Test Org')).toBeVisible();
    
    // 5. Verify via API (backend read)
    const apiResponse = await page.request.get('/api/v1/organizations');
    const orgs = await apiResponse.json();
    const testOrg = orgs.find((o: any) => o.name === 'E2E Test Org');
    expect(testOrg).toBeTruthy();
    expect(testOrg.sector).toBe('FINTECH');
    
    // 6. Cleanup
    await cleanupTestData(testOrg.id);
  });
});
```

### 6.4 E2E Test Helpers

```typescript
// e2e/helpers/auth.ts
import { Page } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function authenticateUser(page: Page, email: string, password: string) {
  // Create Firebase custom token for test user
  const userRecord = await getAuth().getUserByEmail(email).catch(() => 
    getAuth().createUser({ email, password, emailVerified: true })
  );
  
  const token = await getAuth().createCustomToken(userRecord.uid, {
    role: 'admin',
    orgId: 'org_test_001'
  });
  
  // Set token in browser storage
  await page.evaluate((tok) => {
    window.localStorage.setItem('firebaseAuthToken', tok);
  }, token);
  
  await page.goto('/');
}

export async function cleanupTestData(orgId: string) {
  const db = getFirestore();
  // Delete test organization and all related data
  await db.collection('organizations').doc(orgId).delete();
  await db.collection('projects').where('orgId', '==', orgId).get()
    .then(snapshot => snapshot.docs.forEach(doc => doc.ref.delete()));
}
```

---

## 7. Layer 5: Contract Testing

### 7.1 API Contract Architecture

```
server/schemas/                    # Zod schemas (single source of truth)
  ├── organization.schema.ts
  ├── project.schema.ts
  ├── initiative.schema.ts
  └── ai.schema.ts
       │
       │  Code generation script
       ▼
services/types.ts                  # Auto-generated TypeScript types
       │
       │  Pact consumer tests
       ▼
frontend validates request shapes  # Frontend sends requests matching schema
       │
       │  Pact provider tests
       ▼
backend validates response shapes  # Backend returns responses matching schema
```

### 7.2 Pact Setup

```typescript
// test/contracts/organization.contract.test.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { OrganizationSchema } from '../../server/schemas/organization.schema';

const provider = new PactV3({
  consumer: 'cognisys-frontend',
  provider: 'cognisys-backend',
});

describe('Organization API Contract', () => {
  provider
    .given('an organization exists')
    .uponReceiving('a request for an organization')
    .withRequest({
      method: 'GET',
      path: `/api/v1/organizations/org_001`,
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: MatchersV3.like({
        id: 'org_001',
        name: 'Test Org',
        sector: 'FINTECH',
        createdAt: MatchersV3.iso8601DateTime(),
        updatedAt: MatchersV3.iso8601DateTime(),
      }),
    });

  test('organization response matches contract', async () => {
    await provider.executeTest(async (mockserver) => {
      const response = await fetch(`${mockserver.url}/api/v1/organizations/org_001`);
      const data = await response.json();
      expect(data).toMatchObject({
        id: 'org_001',
        name: 'Test Org',
        sector: 'FINTECH',
      });
    });
  });
});
```

---

## 8. Layer 6: Load & Performance Tests

### 8.1 k6 Test Suite

| Script | VU Profile | SLO | Duration |
|---|---|---|---|
| `health.js` | 0→20→0 steady | p95 < 50ms, errors < 0.1% | 1m45s |
| `api.js` | 0→10→50→100→0 spike | p95 < 200ms, errors < 1% | 3m30s |
| `ai.js` | 0→5→10→0 | p95 < 500ms, errors < 2% | 1m40s |
| `auth.js` (NEW) | 0→20→50→20→0 | p95 < 100ms, errors < 0.5% | 3m |
| `sse.js` (NEW) | 20 concurrent streams | First chunk < 2s, no drops | 5m |
| `soak.js` (NEW) | 20 VUs steady for 1h | No memory leaks, stable p95 | 60m |

### 8.2 New Authenticated Load Test

```javascript
// k6/auth.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('auth_errors');
const authLatency = new Trend('auth_latency');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    auth_errors: ['rate<0.005'],
    auth_latency: ['p(95)<100'],
  },
};

export default function () {
  const res = http.post(`${__ENV.BASE_URL}/api/v1/auth/token`, {
    email: 'loadtest@example.com',
    password: 'testpassword',
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).token !== undefined,
    'latency < 100ms': (r) => {
      authLatency.add(r.timings.duration);
      return r.timings.duration < 100;
    },
  });

  errorRate.add(res.status !== 200);
  sleep(1);
}
```

### 8.3 SSE Stream Load Test

```javascript
// k6/sse.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const firstChunkLatency = new Trend('sse_first_chunk_ms');
const totalChunks = new Counter('sse_total_chunks');
const droppedChunks = new Counter('sse_dropped_chunks');

export const options = {
  vus: 20,
  duration: '5m',
  thresholds: {
    sse_first_chunk_ms: ['p(95)<2000'],
    sse_dropped_chunks: ['count==0'],
  },
};

export default function () {
  const params = {
    headers: {
      'Authorization': `Bearer ${__ENV.AUTH_COOKIE}`,
      'Accept': 'text/event-stream',
    },
  };

  const res = http.get(`${__ENV.BASE_URL}/api/ai/stream/test-operation`, params);
  
  check(res, {
    'SSE connection established': (r) => r.status === 200,
    'Content-Type is text/event-stream': (r) => 
      r.headers['Content-Type']?.includes('text/event-stream'),
  });

  sleep(30);
}
```

---

## 9. Layer 7: Resilience & Chaos Testing

### 9.1 Chaos Test Plan

| Failure Scenario | Expected Behavior | Test Method |
|---|---|---|
| **Primary AI provider (Gemini) down** | Fallback to Mistral → Azure → graceful error with user message | Mock 503 on all Gemini calls |
| **All AI providers down** | Graceful degradation: cached results or clear error message | Mock 503 on all providers |
| **Firestore unavailable** | Retry with exponential backoff → cached data → error banner | Stop Firestore emulator mid-test |
| **Stripe webhook delayed (30s)** | Idempotent processing → eventual consistency | Delay webhook delivery in test |
| **Stripe webhook delivered twice** | Processed exactly once (idempotency) | Send duplicate webhook events |
| **Database connection pool exhausted** | Queue requests → timeout → 503 with retry-after | Simulate pool exhaustion |
| **Memory leak under sustained load** | HPA scales → pods restart → no data loss | Soak test + memory profiling |
| **Network partition (client ↔ server)** | SSE reconnects → task queue persists → eventual sync | Simulate network drop with Playwright |
| **Concurrent writes to same document** | Last-write-wins or conflict resolution | Parallel mutation tests |
| **Token quota exceeded mid-request** | 429 response → quota banner → upgrade prompt | Enforce quota in test |
| **SSE stream drops mid-generation** | Client reconnects → resumes from last event ID | Kill SSE connection mid-stream |
| **Task worker crashes mid-processing** | Task reverts to pending → picked up by new worker | Kill TaskWorker process |

### 9.2 AI Provider Failure Test

```typescript
// test/resilience/ai-provider-failure.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AI Provider Resilience', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('falls back to Mistral when Gemini returns 503', async () => {
    // Mock Gemini to fail
    vi.mocked(geminiGenerate).mockRejectedValue(new Error('503 Service Unavailable'));
    
    const result = await geminiService.generate('test prompt');
    
    expect(mistralChat).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('falls back to Azure when both Gemini and Mistral fail', async () => {
    vi.mocked(geminiGenerate).mockRejectedValue(new Error('503'));
    vi.mocked(mistralChat).mockRejectedValue(new Error('503'));
    
    const result = await geminiService.generate('test prompt');
    
    expect(azureChat).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('returns graceful error when all providers fail', async () => {
    vi.mocked(geminiGenerate).mockRejectedValue(new Error('503'));
    vi.mocked(mistralChat).mockRejectedValue(new Error('503'));
    vi.mocked(azureChat).mockRejectedValue(new Error('503'));
    
    await expect(geminiService.generate('test prompt')).rejects.toThrow(
      'AI service is temporarily unavailable'
    );
  });

  it('handles quota exhaustion with proper user message', async () => {
    vi.mocked(geminiGenerate).mockRejectedValue(new Error('429 RESOURCE_EXHAUSTED'));
    
    await expect(geminiService.generate('test prompt')).rejects.toThrow(
      'AI Service Quota Exceeded'
    );
  });
});
```

### 9.3 Database Failure Test

```typescript
// test/resilience/database-failure.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OrganizationService } from '../../server/services/OrganizationService';
import { createOrganization } from '../factories/organizationFactory';
import { stopFirestoreEmulator, startFirestoreEmulator } from '../setup/firebaseEmulator';

describe('Database Resilience', () => {
  let service: OrganizationService;

  beforeAll(async () => {
    service = new OrganizationService();
  });

  it('retries on transient database failure', async () => {
    // Simulate transient failure
    let callCount = 0;
    const originalCreate = service.create.bind(service);
    service.create = vi.fn().mockImplementation(async (data) => {
      callCount++;
      if (callCount < 3) throw new Error('ECONNRESET');
      return originalCreate(data);
    });

    const org = createOrganization();
    const result = await service.create(org);
    expect(result).toBeDefined();
    expect(callCount).toBe(3);
  });

  it('fails gracefully after max retries', async () => {
    stopFirestoreEmulator();
    
    const org = createOrganization();
    await expect(service.create(org)).rejects.toThrow();
    
    startFirestoreEmulator();
  });
});
```

### 9.4 Webhook Idempotency Test

```typescript
// test/resilience/webhook-idempotency.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/app';
import { getFirestore } from 'firebase-admin/firestore';

describe('Webhook Idempotency', () => {
  const app = createApp();
  const webhookPayload = { /* Stripe checkout.session.completed event */ };
  const signature = 'test-signature';

  it('processes the same webhook event exactly once', async () => {
    // Send webhook twice with same event ID
    await request(app)
      .post('/api/webhooks/stripe')
      .send(webhookPayload)
      .set('stripe-signature', signature);

    await request(app)
      .post('/api/webhooks/stripe')
      .send(webhookPayload)
      .set('stripe-signature', signature);

    // Verify only one plan sync occurred
    const billing = await getFirestore().collection('billing').doc('org_test_001').get();
    const syncCount = billing.data()?.syncHistory?.length ?? 0;
    expect(syncCount).toBe(1);
  });
});
```

---

## 10. Frontend-Backend-DB Consistency Guarantees

### 10.1 Data Flow Validation Architecture

```
┌──────────────┐     ┌───────────────┐     ┌───────────────┐     ┌──────────┐
│   Frontend   │────▶│  API Gateway  │────▶│ Service Layer │────▶│ Firestore│
│   (React)    │     │  (Express 5)  │     │               │     │          │
└──────────────┘     └───────────────┘     └───────────────┘     └──────────┘
       ▲                      │                      │                    │
       │                      │                      │                    │
       │          Zod Validation          Repository Pattern              │
       │                      │                      │                    │
       │         ┌────────────▼────────────┐          │                    │
       │         │   Response Validation   │          │                    │
       │         │   (Zod schema check)    │          │                    │
       │         └─────────────────────────┘          │                    │
       │                                              │                    │
       └─────────────── UI State Update ◀─────────────┘                    │
                                                                          │
       ┌──────────────────────────────────────────────────────────────────┘
       │  E2E Verification: Create → Read → Verify in UI → Verify via API
       └──────────────────────────────────────────────────────────────────┘
```

### 10.2 Consistency Guarantee Mechanisms

| Guarantee | Mechanism | Verification |
|---|---|---|
| **Type safety** | Zod schemas → auto-generated TypeScript types | Typecheck in CI |
| **Request validation** | Zod middleware on every API endpoint | Integration tests |
| **Response validation** | Zod schema check before sending to client | Integration tests |
| **Write consistency** | Create → read back → verify equality | E2E tests |
| **Eventual consistency** | Poll for expected state with timeout | E2E + integration tests |
| **Schema evolution** | Zod schemas versioned; breaking changes detected | Contract tests |
| **Data integrity** | Firestore security rules + server-side validation | Security rule tests |

### 10.3 Write-After-Read E2E Pattern

```typescript
// e2e/07-data-consistency.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Frontend-Backend-DB Consistency', () => {
  test('create → read → update → delete cycle maintains consistency', async ({ page }) => {
    // 1. CREATE via UI
    await createProject(page, { name: 'Consistency Test', sector: 'FINTECH' });
    
    // 2. Verify in UI (frontend state)
    await expect(page.getByText('Consistency Test')).toBeVisible();
    await expect(page.getByText('FINTECH')).toBeVisible();
    
    // 3. Verify via API (backend state)
    const apiRes = await page.request.get('/api/v1/projects');
    const projects = await apiRes.json();
    const testProject = projects.find((p: any) => p.name === 'Consistency Test');
    expect(testProject.sector).toBe('FINTECH');
    
    // 4. UPDATE via UI
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Sector').selectOption('SAAS_CLOUD');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // 5. Verify update in UI
    await expect(page.getByText('SAAS_CLOUD')).toBeVisible();
    
    // 6. Verify update via API
    const updatedRes = await page.request.get(`/api/v1/projects/${testProject.id}`);
    const updated = await updatedRes.json();
    expect(updated.sector).toBe('SAAS_CLOUD');
    
    // 7. DELETE via UI
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // 8. Verify deletion (not in UI, not in API)
    await expect(page.getByText('Consistency Test')).not.toBeVisible();
    const deletedRes = await page.request.get(`/api/v1/projects/${testProject.id}`);
    expect(deletedRes.status()).toBe(404);
  });
});
```

### 10.4 Eventual Consistency Pattern (for async operations)

```typescript
// e2e/helpers/waitForConsistency.ts
export async function waitForConsistency(
  check: () => Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 30000, interval = 500 } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await check()) return;
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(`Consistency check timed out after ${timeout}ms`);
}

// Usage in E2E test
test('async WBS generation produces consistent results', async ({ page }) => {
  await triggerWBSGeneration(page, projectId);
  
  await waitForConsistency(async () => {
    const artifacts = await page.request.get(`/api/v1/projects/${projectId}/artifacts`);
    const data = await artifacts.json();
    return data.some((a: any) => a.type === 'WBS' && a.status === 'completed');
  });
  
  // Now verify the WBS content
  const wbs = await page.request.get(`/api/v1/projects/${projectId}/artifacts/wbs`);
  const wbsData = await wbs.json();
  expect(wbsData.phases.length).toBeGreaterThan(0);
});
```

---

## 11. CI/CD Pipeline Integration

### 11.1 Updated GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]

jobs:
  # ── Stage 1: Static Analysis ──
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --legacy-peer-deps
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck
      - run: npm run audit

  # ── Stage 2: Unit Tests with Coverage ──
  unit-tests:
    needs: static-analysis
    runs-on: ubuntu-latest
    services:
      firestore-emulator:
        image: google/cloud-sdk:latest
        ports:
          - 8080:8080
        options: >-
          --entrypoint="firebase"
          --name="firestore-emulator"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --legacy-peer-deps
      - run: echo '{}' > generated_schemas.json
      - run: npm run test:ci
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: true
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: unit-test-results
          path: test-results/

  # ── Stage 3: E2E Tests ──
  e2e-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --legacy-peer-deps
      - run: echo '{}' > generated_schemas.json
      - run: npx playwright install --with-deps chromium firefox webkit
      - run: npm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:5000
      - name: Upload E2E results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-test-results
          path: test-results/
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  # ── Stage 4: Load Tests (non-blocking) ──
  load-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.3.0
        with:
          filename: k6/health.js
          flags: --out json=results.json
        env:
          BASE_URL: http://localhost:5000
      - uses: grafana/k6-action@v0.3.0
        with:
          filename: k6/api.js
        env:
          BASE_URL: http://localhost:5000

  # ── Stage 5: Contract Tests ──
  contract-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --legacy-peer-deps
      - run: npm run test:contracts

  # ── Stage 6: Build ──
  build:
    needs: [unit-tests, e2e-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --legacy-peer-deps
      - run: npm run build
      - name: Bundle size report
        run: node scripts/bundle-report.js
```

### 11.2 Deploy Pipeline with Staging Validation

```yaml
# .github/workflows/deploy.yml
name: Deploy & Validate
on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      # Build, push, deploy to staging...
      - name: Smoke test
        run: |
          curl -f https://staging.cognisys.example.com/api/health || exit 1
      - name: Run critical E2E against staging
        run: npx playwright test e2e/01-health.spec.ts e2e/06-authenticated-crud.spec.ts
        env:
          E2E_BASE_URL: https://staging.cognisys.example.com

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      # Build, push, deploy to production...
      - name: Smoke test
        run: |
          curl -f https://app.cognisys.example.com/api/health || exit 1
      - name: Run critical E2E against production
        run: npx playwright test e2e/01-health.spec.ts
        env:
          E2E_BASE_URL: https://app.cognisys.example.com
```

---

## 12. Test Data Strategy

### 12.1 Test Data Architecture

```
test/
├── factories/              # Test data generators
│   ├── organizationFactory.ts
│   ├── projectFactory.ts
│   ├── initiativeFactory.ts
│   ├── userFactory.ts
│   └── artifactFactory.ts
├── fixtures/               # Known-good response data
│   ├── wbs-response.json
│   ├── risk-assessment.json
│   ├── swot-analysis.json
│   └── stripe-events/
│       ├── checkout.session.completed.json
│       ├── customer.subscription.updated.json
│       └── customer.subscription.deleted.json
├── seeds/                  # Pre-populated DB state
│   ├── base-seed.ts        # Minimal org + user + project
│   ├── full-seed.ts        # Full dataset with initiatives, artifacts
│   └── billing-seed.ts     # Org with billing state
├── setup/                  # Test infrastructure
│   ├── firebaseEmulator.ts
│   ├── authEmulator.ts
│   └── globalSetup.ts
└── helpers/                # Shared test utilities
    ├── waitForConsistency.ts
    ├── mockLLM.ts
    └── apiClient.ts
```

### 12.2 Test Isolation Strategy

- Each test gets a unique ID prefix (`org_test_${counter}`)
- Firestore emulator is cleaned between test suites (`beforeEach`)
- No shared mutable state between tests
- Parallel test execution is safe

---

## 13. Implementation Phases

| Phase | Deliverable | Effort | Dependencies |
|---|---|---|---|
| **Phase 1: Foundation** | TypeScript strict, ESLint, Prettier, coverage config, test factories, new scripts | 3-4 days | None |
| **Phase 2: Server Unit Tests** | All 19 server services + 5 AI agents + 4 repositories against Firestore emulator | 5-7 days | Phase 1 |
| **Phase 3: Client Unit Tests** | All client services + hooks + context providers | 4-5 days | Phase 1 |
| **Phase 4: Component Tests** | Critical UI components (forms, tables, AI tools) | 5-7 days | Phase 1 |
| **Phase 5: E2E Expansion** | Authenticated flows, CRUD journeys, billing, AI generation | 5-7 days | Phase 2 |
| **Phase 6: Contract Testing** | Pact setup, Zod-to-client type generation, API contract tests | 3-4 days | Phase 2 |
| **Phase 7: CI/CD Integration** | E2E + k6 + coverage in CI, staging smoke tests, Codecov | 2-3 days | Phase 5 |
| **Phase 8: Resilience Testing** | Chaos tests, failover tests, soak tests, webhook idempotency | 3-4 days | Phase 2 |
| **Phase 9: Monitoring & Dashboards** | Coverage dashboard, performance baseline tracking, alerting | 2-3 days | Phase 7 |

**Total estimated effort:** 32-44 engineering days (6-9 weeks for a single engineer)

---

## 14. Quality Gates

| Gate | Check | Enforcement | Blocker |
|---|---|---|---|
| **Pre-commit** | ESLint + Prettier + unit tests on changed files | Husky + lint-staged | Yes |
| **CI - Static** | TypeScript strict, ESLint, format check, audit | GitHub Actions | Yes |
| **CI - Unit** | 80%+ coverage threshold, all tests pass | Vitest coverage | Yes |
| **CI - E2E** | All E2E journeys pass (3 browsers) | Playwright | Yes |
| **CI - Contracts** | API contracts match | Pact | Yes |
| **CI - Load** | k6 SLOs met (non-blocking, alert only) | k6 | No (alert) |
| **Deploy - Staging** | Smoke test + critical E2E | GitHub Actions | Yes |
| **Deploy - Production** | Smoke test + health E2E | GitHub Actions | Yes |
| **Weekly** | Soak test (1h), dependency audit, coverage trend | Scheduled workflow | No (alert) |

---

## 15. Key Files Reference

| File | Current Status | Planned Change |
|---|---|---|
| `vite.config.ts` | Vitest config inline | Add coverage configuration |
| `vitest.setup.ts` | i18next init | Add test factory imports |
| `playwright.config.ts` | Chromium only, no webServer | Add Firefox, WebKit, webServer |
| `tsconfig.json` | Non-strict | Enable strict mode |
| `.lintstagedrc.cjs` | Runs full test suite | Add ESLint + Prettier |
| `.github/workflows/ci.yml` | Unit tests only | Add E2E, k6, contracts, coverage |
| `.github/workflows/deploy.yml` | Minimal smoke test | Add staging E2E validation |
| `server/app.test.ts` | 669 lines, all mocks | Keep for API routes; add service-level tests |
| `k6/health.js` | Existing | Keep |
| `k6/api.js` | Existing | Keep |
| `k6/ai.js` | Existing | Keep |
| `test/factories/` | Not exists | Create |
| `test/fixtures/` | Not exists | Create |
| `test/setup/` | Not exists | Create |
| `test/helpers/` | Not exists | Create |
| `test/contracts/` | Not exists | Create |
| `test/resilience/` | Not exists | Create |

---

## 16. Summary

CogniSys BA has a **solid testing foundation** (Vitest, Playwright, k6, Supertest) but **critical gaps** in coverage, enforcement, and CI integration. The current state ships code with only 1.7% component coverage and no E2E tests in CI.

**Critical priorities:**
1. **Coverage enforcement** — 80% threshold blocking in CI
2. **Real server service tests** — Replace mocks with Firestore emulator tests
3. **Authenticated E2E flows** — Full CRUD journeys with real auth
4. **CI pipeline expansion** — E2E + k6 + coverage + contracts in every PR
5. **Resilience testing** — Chaos tests for AI provider failure, DB failure, webhook issues

**Quality guarantees:**
- Frontend-backend consistency via Zod schema validation + contract testing
- DB consistency via write-after-read E2E verification
- Resilience via chaos testing and graceful degradation verification
- Performance via k6 SLOs with baseline tracking

**Estimated impact:**
- Reduce production bugs by 60-80%
- Catch API drift before it reaches users
- Ensure system survives real-world failures gracefully
- Maintain performance under load with measurable SLOs
