# CogniSys BA — Architecture Assessment

## ✅ POSITIVES

### 1. Multi-Provider AI Fallback Chain
Every LLM call cascades through Gemini → fallback Gemini → Mistral → Azure OpenAI. Quota exhaustion, 500s, and RPC errors are all handled with automatic retry and model switching. This is production-grade resilience for AI apps.

### 2. Self-Healing JSON Parsing
When the AI returns malformed JSON, a dedicated `repairJson()` function sends the broken output back to an LLM with the schema and asks it to fix it. Falls back across all providers. This is a clever solution to the #1 failure mode in AI-generated structured data.

### 3. Double-Pass Validator Pattern
Complex structured generation (ERDs, BPMN, traceability graphs) uses a `_draft_logic → _audit_log → final_diagram` protocol. The LLM plans, self-audits, then outputs. This significantly reduces structural errors in complex outputs.

### 4. Solid Server Security Layer
- Helmet CSP with strict directives
- Per-route rate limiting (API: 100/15min, AI: 20/15min, Auth: 10/15min)
- RBAC middleware with role hierarchy (viewer < member < admin) and org-scoped isolation
- Correlation ID middleware for request tracing
- httpOnly, secure, sameSite=none session cookies

### 5. Clean Repository Pattern
`BaseRepository<T>` provides generic CRUD over Firestore. Concrete repos (Organization, Project, Initiative) extend it. This is standard, testable, and maintainable.

### 6. Lazy Firebase Admin Initialization
3-tier fallback: Service Account env var → GCP default credentials → project ID only. Prevents crashes when env vars are missing.

### 7. Agentic Orchestration (The Hive)
Multi-agent graph with Orchestrator → Scout/Guardian/Integromat/Simulation workers. Includes:
- Context pruning (summarizes history when >12 messages to prevent token overflow)
- Human-in-the-Loop approval gates for write operations
- Chain-of-thought capture in agent thoughts

### 8. Semantic Vector Memory (RAG)
Gemini embedding proxy + cosine similarity search in Firestore. Agents can save/retrieve past decisions and calibrate simulations against historical data. Multi-tenant by orgId.

### 9. SSE Streaming for Async AI
Long-running AI operations return `202 { operationId }` immediately, then clients subscribe via `/api/ai/stream/:operationId` for real-time progress events. Proper `req.on('close')` cleanup.

### 10. OpenTelemetry Tracing
OTel initialized at server startup with proper dotenv ordering. Distributed tracing across the full request lifecycle.

### 11. Lazy Vite Middleware
Unified server pattern — Vite runs as Express middleware in dev, static files in prod. Single port, no CORS headaches between frontend and backend.

### 12. Comprehensive Type System
1685 lines of TypeScript types covering every domain entity, AI response shape, and UI state. Generated schemas from `typescript-json-schema` for runtime validation.

---

## ❌ NEGATIVES

### 1. CatalystContext is a God Object (CRITICAL)
`CatalystContext.tsx` (585 lines) holds **everything**: initiatives, organizations, projects, activities, user, auth, theme, toast, AI model, hive command, export/import, domain rules, AI reactions, Firebase auth listeners. Every state change re-renders every consumer. The `contextValue` useMemo dependency array has **20+ entries**, meaning it recreates on almost every render.

**Fix:** Split into `AuthContext`, `InitiativeContext`, `UIContext`, `ActivityContext`. Use Zustand or Jotai for granular subscriptions.

### 2. Dual Persistence: LocalStorage vs Firestore
The frontend stores initiatives/organizations/projects in **LocalStorage** with debounced saves, while the backend has full Firestore repositories. These two data stores are **not synchronized**. The API endpoints exist but the context never calls them for reads/writes — `fetchInitialData` is an empty stub.

**Impact:** The app works offline but data is siloed per browser. Multi-user collaboration is impossible. The Firestore backend is essentially dead code for the main data flow.

### 3. Massive `geminiService.ts` File
This single file is **1600+ lines** containing: schemas, error handling, JSON repair, model fallback, and 50+ generation functions (SWOT, BPMN, wireframes, presentations, etc.). It violates SRP catastrophically.

**Fix:** Split into `schemas/`, `aiCore.ts` (generateJson, repairJson), and per-domain services (`strategyService.ts`, `analysisService.ts`, etc.).

### 4. Hardcoded Mock Data Everywhere
`constants.ts` has 10 mock initiatives with hardcoded IDs, avatars, and descriptions. `mockExternalServices.ts` returns fake Jira tickets, GitHub commits, and SQL rows. The app feels functional but most "integrations" are smoke and mirrors.

### 5. No Client-Side API Data Fetching
`src/services/api.ts` defines OrganizationAPI, ProjectAPI, InitiativeAPI, AIAPI — but the CatalystContext never uses them for reading data. The only API calls are `triggerWBS` and `triggerRisks`. The app runs entirely on LocalStorage mock data.

### 6. Monolithic Component Structure
92 components in `components/ai/` with no clear organization. No feature-based folder structure. Components likely share massive prop drilling through CatalystContext instead of composable hooks.

### 7. Tight Coupling Between AI and UI
Every AI generation function is directly imported and called from React components. There's no service abstraction layer on the client. If you wanted to swap the AI provider or add caching, you'd need to touch dozens of components.

### 8. No Database Migrations or Seeding
Firestore collections are created ad-hoc. No migration strategy, no seed scripts, no schema versioning. The `generated_schemas.json` exists for AI validation but has no relationship to Firestore document structure.

### 9. TaskWorker Has No Concurrency Control
`TaskWorker.ts` processes tasks via `onSnapshot` but fires `async` handlers without limiting concurrency. If 50 tasks arrive simultaneously, all 50 AI agents fire at once. No worker pool, no backpressure, no rate limiting on the AI calls.

### 10. No Input Validation on API Routes
Controllers accept `req.body as { ... }` with no runtime validation (no Zod, no Joi). A malformed request can crash an AI agent or write garbage to Firestore.

### 11. `.env.local` is Empty
The project ships with a completely empty `.env.local`. Without API keys, the app degrades to mock data only. There's no `.env.example` or setup wizard.

### 12. No CI/CD Pipeline
Despite having `cloudbuild.yaml`, `.github/`, Docker files, and Playwright tests, there's no evidence of an actual CI pipeline being configured. The Cloud Run environments (dev/shared/pre) exist but deployment is manual.

### 13. Console.log in Production Code
`console.log("CatalystProvider rendered")`, `console.warn`, `console.error` scattered throughout. No proper client-side logging strategy (no Sentry, no structured logging).

### 14. No Pagination or Infinite Scroll
All initiatives load at once. All activities load at once. At scale, this will cause performance degradation and excessive LocalStorage usage (5MB limit).

---

## Summary

| Category | Rating | Notes |
|---|---|---|
| AI Resilience | ⭐⭐⭐⭐⭐ | Best-in-class fallback chains, self-healing JSON |
| Server Security | ⭐⭐⭐⭐ | Good CSP, RBAC, rate limiting. Missing input validation |
| Backend Architecture | ⭐⭐⭐ | Clean repos/controllers, but Firestore disconnected from frontend |
| Frontend State | ⭐⭐ | God object context, LocalStorage-only, no sync |
| Code Organization | ⭐⭐ | Massive files, no feature boundaries, tight coupling |
| Testing | ⭐⭐ | Vitest + Playwright exist but coverage unclear |
| Production Readiness | ⭐⭐ | Empty env, no CI/CD, mock data, no pagination |
