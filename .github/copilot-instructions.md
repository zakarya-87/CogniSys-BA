# Copilot Instructions — CogniSys BA (The Catalyst Hub)

AI-native B2B SaaS platform for strategic business analysis and initiative tracking.
React 19 SPA + Express 5 server in a single monorepo, backed by Firebase Firestore and multi-model AI orchestration.

---

## Commands

```bash
# Install (legacy-peer-deps is required)
npm install --legacy-peer-deps

# Development (starts both Vite :5173 and Express :5000 concurrently)
npm run dev

# Type-check (no ESLint gate — tsc --noEmit only)
npm run lint

# Unit + integration tests (Vitest)
npm test

# Run a single test file
npx vitest run server/app.test.ts
npx vitest run components/Dashboard.test.tsx

# E2E tests (Playwright)
npm run test:e2e

# Production build (requires generated_schemas.json to exist first)
node generate_all_schemas.cjs
npm run build

# Firebase Cloud Functions build (esbuild)
npm run build:functions
```

> **CI note**: Before running `npm test` in a fresh checkout, create a stub schemas file:
> `echo '{}' > generated_schemas.json`

---

## Architecture

```
React 19 SPA (Vite)
  components/  context/  hooks/  services/ (client)
       │
       │  Axios (Bearer token interceptor — auto-attaches Firebase ID token)
       ▼
Express 5 API Server  (server/)
  Middleware: helmet → cors → rate-limit → cookie-parser → correlationId → pino-http
  /api/v1/   — resource routes (organizations, projects, initiatives, memory)
  /api/       — auth, AI proxies, SSE, GitHub proxy
       │                          │
  Firebase Admin SDK         AI Providers
  (Firestore, Auth)      Gemini → Mistral → Azure OpenAI
```

### Key directories

| Path | Purpose |
|---|---|
| `server/` | Express app factory (`createApp()`), all server-side code |
| `server/controllers/` | Thin HTTP handlers — delegate to services |
| `server/services/` | Business logic (AuthService, MemoryService, BillingService, etc.) |
| `server/repositories/` | Firestore CRUD — extend `BaseRepository<T>` |
| `server/middleware/rbac.ts` | Auth guards: `requireAuth`, `authorize(role)`, `can(Permission)` |
| `server/middleware/permissions.ts` | `Permission` enum and `ROLE_PERMISSIONS` map |
| `server/schemas/index.ts` | All Zod schemas + `parseBody()` helper |
| `server/ai-agents/` | `ModelRouter` (Gemini/Mistral/Azure), specialized agents (WBS, Risk, Artifact) |
| `server/featureFlags.ts` | `isEnabled(flag)` — reads `FEATURE_FLAG_<UPPERCASE>` env vars |
| `services/ai/aiConfig.ts` | Centralized AI constants: model IDs, timeouts, retry, token budgets |
| `components/` | Top-level React views |
| `context/` | React Context providers (Auth, Org, Initiative, AI, UI, etc.) |
| `hooks/` | Custom hooks (`useAI`, `useAIStream`, `useFeatureFlag`, etc.) |
| `services/` | Client-side services (Firebase client, Gemini proxy, Hive, etc.) |

---

## Key Conventions

### RBAC middleware — two patterns

Use `can(Permission.X)` for **new routes** (fine-grained); keep `authorize(role)` only for legacy routes.

```ts
// Legacy — coarse role check
router.get('/orgs', authorize('viewer'), handler);

// New — explicit permission check (preferred)
router.post('/initiatives', can(Permission.INITIATIVE_CREATE), handler);
```

Role hierarchy: `viewer (1) → member (2) → admin (3)`. RBAC claims (`orgId`, `role`) live in the Firebase ID token.

### API request validation

Every `POST`/`PUT` handler must use `parseBody()` from `server/schemas/index.ts`:

```ts
const data = parseBody(CreateInitiativeSchema, req.body, res);
if (!data) return; // parseBody already sent the 400
```

Add new schemas to `server/schemas/index.ts` alongside the existing ones.

### Server tests

- Add `// @vitest-environment node` at the top of any server test file.
- Always mock Firebase Admin to avoid real Firestore calls:

```ts
vi.mock('./lib/firebaseAdmin', () => ({
  getAdminDb: vi.fn(),
  getAdminAuth: vi.fn(() => ({ verifyIdToken: vi.fn().mockRejectedValue(new Error('mock')) })),
}));
```

### AI calls — server-only

`GEMINI_API_KEY` is **never** injected into the Vite bundle. All AI calls are proxied through the Express server. Client code uses `services/geminiProxy.ts` (fetch to `/api/gemini/*`), not the SDK directly.

AI model IDs, timeouts, retry logic, and token budgets are centralized in `services/ai/aiConfig.ts` — import from there, don't hardcode values.

### Feature flags

```ts
// Server-side
import { isEnabled } from './featureFlags';
if (isEnabled('vector_memory')) { ... }

// Client-side
const enabled = useFeatureFlag('vector_memory');
```

Toggle via env var: `FEATURE_FLAG_VECTOR_MEMORY=false`. All flags default `true` except `otel_tracing`.

### SSE endpoints

SSE routes accept `?token=<idToken>` as a query-param fallback because `EventSource` cannot set `Authorization` headers:

```ts
router.get('/ai/stream/:opId', authorize('viewer'), handler); // authorize() already handles ?token=
```

### Firestore data access

Extend `BaseRepository<T>` for standard CRUD; call `getAdminDb()` directly for custom queries:

```ts
export class MyRepository extends BaseRepository<MyDoc> {
  constructor() { super('my-collection'); }
  // custom queries use getAdminDb().collection(...)
}
```

### i18n

Translations live in `public/locales/<lang>/<namespace>.json`. Namespaces: `common`, `dashboard`, `projectHub`, `reports`, `settings`, `sidebar`. `vitest.setup.ts` initializes i18n so components render real English strings in tests (no raw translation keys).

### Stripe webhook

The Stripe webhook handler in `server/app.ts` is registered **before** `express.json()` — it needs the raw request body for signature verification. Never move it below `app.use(express.json())`.

### Path alias

`@` resolves to the repo root (configured in both `tsconfig.json` and `vite.config.ts`):

```ts
import { AI_CONFIG } from '@/services/ai/aiConfig';
```

### Branch strategy

`feature/xyz → dev → main`. PRs target `dev`; `main` is protected and only receives merges from `dev`.

### TypeScript

`tsc --noEmit` has known pre-existing errors (D3 generics in ConceptModeler, ErrorBoundary class typing) that are documented and not treated as blocking. The CI runs `npm run lint || true`. Fix new errors you introduce but don't block on the existing ones.
