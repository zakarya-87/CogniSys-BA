# CogniSys BA — SaaS Modernization Plan
> Generated: 2026-04-02 | Version: 1.0 | Status: Active

## Phase 0 — Implementation Checklist (Quick Wins) ✅ COMPLETE

All 10 Quick Wins merged to `main`. CI pipeline green (33–56s). Dependabot active.

| # | Task | PR | Status |
|---|---|---|---|
| QW1 | Move `GEMINI_API_KEY` server-side — create `/api/gemini/generate` proxy | #1 | ✅ Done |
| QW2 | Install + configure `helmet.js` | #3 | ✅ Done |
| QW3 | Install + configure `express-rate-limit` (3 tiers: api/ai/auth) | #5 | ✅ Done |
| QW4 | Sanitize OAuth error responses + fix CSP/XSS | #7 | ✅ Done |
| QW5 | Add GitHub Actions CI pipeline (37 tests, 56s) | #12+#13 | ✅ Done |
| QW6 | Add Vite `lazy()` code splitting for 18 views | #17 | ✅ Done |
| QW7 | Add `correlationId` middleware (UUID per request) | #15 | ✅ Done |
| QW8 | Add Husky + lint-staged pre-commit hooks | #16 | ✅ Done |
| QW9 | Add Dependabot (`.github/dependabot.yml`) | #14 | ✅ Done |
| QW10 | Validate `event.origin` in OAuth postMessage | #7 (QW4) | ✅ Done |
| DEPS | Bump all dev+prod dependencies (lucide-react v1.x breaking fix) | #18+#20 | ✅ Done |

---

## Phase 1 — Foundation ✅ COMPLETE

| Sprint | Item | PR | Status |
|---|---|---|---|
| S1-F1 | Fix `/api/*` 404 handler (JSON not HTML) | #21 | ✅ Done |
| S1-F2 | Remove stale importmap from `index.html` | #21 | ✅ Done |
| S1-F3 | Add `tsc --noEmit` to CI pipeline | #21 | ✅ Done |
| S1-F4 | Update MODERNIZATION_PLAN.md | #21 | ✅ Done |
| S2 | Structured logging with `pino` + `pino-http` | #22 | ✅ Done |
| S3 | API test coverage (37→62 tests, supertest + app factory) | #23 | ✅ Done |
| S4 | Implement `/api/gemini/embed` + fix `getEmbedding()` stub | #24 | ✅ Done → `dev` |
| S5 | Firestore persistence (replace localStorage, onSnapshot) | #25 | ✅ Done → `dev` |
| S6 | SSE streaming for real-time AI progress + `useAIStream()` | #26 | ✅ Done → `dev` |

---

## Phase 2 — Scale ✅ COMPLETE (sprints)

All 5 sprints implemented. PRs open → `dev`.

| Sprint | Item | PR | Status |
|---|---|---|---|
| P2-S1 | API versioning — `/api/v1/` router + backward compat `/api/` | #27 | ✅ Done → `dev` |
| P2-S2 | Vector memory → Firestore (server-side, multi-tenant, cosine search) | #28 | ✅ Done → `dev` |
| P2-S3 | Containerize — Dockerfile (multi-stage) + docker-compose + cloudbuild.yaml | #29 | ✅ Done → `dev` |
| P2-S4 | OpenTelemetry tracing — OTLP/HTTP, auto-instrumentation, W3C traceparent | #30 | ✅ Done → `dev` |
| P2-S5 | Real GitHub API — replace mock with live REST proxy using OAuth token | #31 | ✅ Done → `dev` |



---

---

## [1] EXECUTIVE SUMMARY

### Current State Diagnosis

CogniSys BA is an **AI-native, feature-rich B2B SaaS platform** in advanced MVP stage (v2.2.0) with 12 shipped product phases and 60+ modules. The product vision is exceptional — multi-agent orchestration, predictive modeling, ethical governance, knowledge graphs — but the **engineering foundations have not scaled at the same pace as the features**.

Critical gaps threatening enterprise readiness:

| Severity | Issue |
|---|---|
| 🔴 CRITICAL | `GEMINI_API_KEY` injected into the **client-side bundle** via Vite `define` — exposed to all users |
| 🔴 CRITICAL | All state is **ephemeral React Context** — no persistence across sessions |
| 🔴 CRITICAL | No CI/CD pipeline — deployments are manual |
| 🟠 HIGH | AI operations are **synchronous** — blocking the HTTP thread |
| 🟠 HIGH | RBAC partially implemented — Custom Claims not fully enforced |
| 🟠 HIGH | No observability — zero structured logging, tracing, or APM |
| 🟡 MEDIUM | No vector memory — Simulation agent cannot learn from past outcomes |
| 🟡 MEDIUM | Math is LLM-simulated, not computed (imprecise for enterprise finance) |
| 🟡 MEDIUM | Only 6 test files, ~<5% estimated coverage |

### Transformation Vision

Transform CogniSys BA from a **brilliant MVP** into a **hardened, observable, multi-tenant enterprise SaaS** — without breaking existing features — through 4 phases: secure the foundation, harden the backend, scale the AI layer, then optimize for growth.

---

## APPLICATION CONTEXT

```
App Name           : CogniSys BA — The Catalyst Hub

Current Tech Stack : React 19 / TypeScript 5.8 / Vite 6 / Express.js 5
                     / Firebase Firestore & Auth / Google Gemini API
                     (2.5 Flash, 3.0 Pro, Veo) / TensorFlow.js / Tailwind CSS 4
                     / Vitest / Recharts + D3 / i18next / Mermaid

Target Tech Stack  : React 19 / TypeScript 5.8 / Vite 6 / Express.js 5
                     / Firebase Firestore (flat schema, optimized indexing)
                     / Firebase Auth (Custom Claims RBAC v2)
                     / Google Gemini (model-routed: Flash ↔ Pro)
                     / Async Task Queue (Cloud Tasks)
                     / Vector Memory Store (Firestore Vector Search)
                     / Structured Logging + Tracing (correlationId + OpenTelemetry)
                     / Rate Limiting (express-rate-limit per org)
                     / helmet.js (security headers)
                     / shadcn/ui (design system layer)

Application Type   : B2B SaaS — AI-native enterprise platform
                     for Business Analysis & Requirements Management

User Scale (now)   : MVP / Early-access (pre-scale, local state)

User Scale (target): Multi-tenant enterprise SaaS
                     (Organization → Project → Initiative hierarchy,
                      RBAC roles: Admin / Member / Viewer)

Core Domain        : AI-powered autonomous business analysis —
                     Multi-agent orchestration (The Hive) for
                     requirements elicitation, predictive modeling
                     (Monte Carlo / Tornado), ethical governance,
                     knowledge graph management, and code generation

Primary Pain Points:
  • GEMINI_API_KEY exposed in client-side bundle (critical security risk)
  • Local/client state (no persistent multi-tenant backend yet)
  • LLM-simulated math instead of real computation engines
  • No vector memory (Simulation agent can't recall past outcomes)
  • Missing async task queue (AI long-ops block the UI thread)
  • RBAC is partially implemented (needs Custom Claims enforcement)
  • No structured observability (logging, tracing, correlationId)
  • No CI/CD pipeline defined
  • Prompt versioning not yet persisted (hardcoded in services)
```

---

## [2] MODERNIZATION ROADMAP

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 0 — QUICK WINS          (Weeks 1–2, zero feature risk)   │
├─────────────────────────────────────────────────────────────────┤
│ • Move GEMINI_API_KEY server-side (eliminate bundle exposure)   │
│ • Add helmet.js (security headers in 1 line)                   │
│ • Add express-rate-limit (per-org throttling)                  │
│ • Add .github/workflows CI (lint + test + build on push)       │
│ • Fix OAuth token validation (remove mock path)                 │
│ • Add Vite code splitting (lazy() for heavy views)             │
│ • Add structured console logging (JSON format, correlationId)  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1 — FOUNDATION          (Weeks 3–8)                      │
├─────────────────────────────────────────────────────────────────┤
│ • Full Firebase Auth Custom Claims RBAC v2                     │
│ • Persistent Firestore state (replace React Context MVP data)  │
│ • Async task queue for AI ops (Cloud Tasks)                    │
│ • Server-Sent Events (SSE) for real-time AI progress UI        │
│ • Firestore flat schema finalized + indexing                   │
│ • Audit log service (all mutations recorded)                   │
│ • Prompt versioning in Firestore (PromptManager service)       │
│ • Test coverage lift to 40% (unit + integration)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2 — SCALE               (Weeks 9–16)                     │
├─────────────────────────────────────────────────────────────────┤
│ • Vector memory store (v2.3 — Simulation agent recall)         │
│ • Replace LLM-simulated math with math.js real engines         │
│ • Replace mockExternalServices with real Jira/GitHub APIs      │
│ • Billing integration (Stripe)                                 │
│ • Real-time collaboration (Firestore listeners)                │
│ • Multi-region Firestore configuration                         │
│ • Containerize backend (Dockerfile + Cloud Run autoscaling)    │
│ • OpenTelemetry tracing + Google Cloud Monitoring              │
│ • Design system formalization (Storybook + design tokens)      │
│ • WCAG 2.2 AA audit + RTL layout pass (MENA market)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3 — OPTIMIZE            (Weeks 17–24)                    │
├─────────────────────────────────────────────────────────────────┤
│ • SOC 2 Type I preparation                                     │
│ • Chaos engineering (failure mode testing)                     │
│ • Load testing (k6 benchmarks against SLOs)                   │
│ • Bundle < 500KB (D3 / TensorFlow.js lazy chunking)           │
│ • CDN optimization (Firebase Hosting cache rules)              │
│ • Playwright e2e test suite (critical user journeys)           │
│ • Feature flag system (safe rollouts)                          │
│ • API versioning (/api/v1/...)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## [3] PER-DIMENSION GAP ANALYSIS

### 1. Design System & UI/UX

| Dimension | Current | Target | Gap | Priority |
|---|---|---|---|---|
| Token architecture | Partial (`@theme` in CSS) | Formalized Tailwind tokens + Storybook | Medium | P2 |
| Component library | Ad-hoc custom components | shadcn/ui (Radix primitives + Tailwind) | Medium | P2 |
| Accessibility | Unknown, no audit | WCAG 2.2 AA certified | High | P1 |
| RTL support | Font loaded (IBM Plex Sans Arabic), not implemented | Full RTL layout for MENA market | High | P2 |
| Dark/Light mode | Implemented via className | Polished, system-aware, persistent | Low | P3 |
| Design-to-code | None | Figma tokens → `@theme` sync | Medium | P3 |
| Style guide | None | Living Storybook + brand guide | Medium | P2 |

**Current design state:** Tailwind CSS 4 with `@theme` custom tokens defined in `index.css` (colors, fonts: Inter + IBM Plex Sans Arabic + JetBrains Mono). Partial design token system exists but is NOT enforced through a component library — components use ad-hoc Tailwind utility classes directly. No Storybook, no Figma token pipeline, no formal accessibility audit. Dark/light mode toggle implemented. No WCAG audit performed.

**Design priorities:** Data-dense B2B SaaS dashboards (AI outputs, charts, graphs, Mermaid diagrams). Dark-first aesthetic (deep navy `#050a1f` base). Arabic RTL support for MENA market. Consistent AI-native brand (cyan `#00d4ff` accent, purple/pink secondary palette).

---

### 2. Technical Architecture

| Dimension | Current | Target | Gap | Priority |
|---|---|---|---|---|
| API key exposure | Client-side bundle 🔴 | Server-side proxy only | **CRITICAL** | P0 |
| API versioning | None | `/api/v1/` prefix | Medium | P2 |
| State persistence | React Context (ephemeral) | Firestore multi-tenant | Critical | P1 |
| Async AI ops | Synchronous (blocking) | Cloud Tasks queue + SSE progress | High | P1 |
| IaC | None | Cloud Run + Firebase config-as-code | Medium | P2 |
| Backend separation | Monolith (Vite + Express in one process) | Separate API service container | Medium | P2 |
| OAuth validation | Mock placeholder 🔴 | Real server-side GitHub token validation | Critical | P0 |

**Key architectural issues:**
- Monolith: Express.js serves both the REST API and the Vite frontend from a single process
- `GEMINI_API_KEY` exposed client-side via Vite `define()` — all users can extract from browser DevTools
- No API versioning (routes are `/api/...` with no version prefix)
- GitHub OAuth session validation is mocked ("In a real app, validate the token against your DB")
- No Infrastructure as Code — deployment is manual
- No async task queue — AI operations block the Node.js event loop
- React Context as sole state management — not persistent, not shareable across sessions or users

**Preferred cloud provider:** GCP / Firebase (already committed) + Cloud Run for containerized backend + Firebase Hosting for frontend CDN

---

### 3. Functional Requirements

| Feature | Status | Action | Priority |
|---|---|---|---|
| The Hive (multi-agent orchestration) | ✅ Shipped | Migrate to async queue | P1 |
| Predictive Core (Monte Carlo + Tornado) | ✅ Shipped | Replace LLM math with math.js | P2 |
| Cortex (knowledge graph) | ✅ Shipped | Add vector memory | P2 |
| War Room (agent debate) | ✅ Shipped | Keep, add persistence | P1 |
| The Construct (code generation) | ✅ Shipped | Keep | P2 |
| Vision Board (multimodal) | ✅ Shipped | Keep | P3 |
| The Pulse (collaborative feed) | ✅ Shipped | Keep, add real-time listeners | P2 |
| Vector Memory Store | ❌ Missing | Build (v2.3 — Firestore Vector Search) | P1 |
| Async Task Queue | ❌ Missing | Build (Cloud Tasks) | **P0** |
| Real External Integrations | 🟡 Mocked | Replace mocks with real Jira/GitHub APIs | P2 |
| Billing / Subscriptions | ❌ Missing | Stripe integration | P2 |
| Real-time Collaboration | ❌ Missing | Firestore realtime listeners | P3 |
| Prompt Versioning | 🟡 Hardcoded in services | Firestore PromptManager service | P1 |
| Full Firestore Persistence | 🟡 Partial backend wired | Complete multi-tenant wiring | P1 |

**Top 5 current features:**
1. The Hive — 6-agent multi-agent orchestration engine
2. Predictive Core — Monte Carlo + Tornado sensitivity + Ethical auditing
3. The Cortex — Knowledge graph (enterprise portfolio view)
4. War Room — Real-time multi-agent debate & consensus
5. The Construct — AI-driven code generation IDE (SQL/TS/Python)

---

### 4. Performance Engineering

| Metric | Current (Est.) | Target | Gap | Priority |
|---|---|---|---|---|
| LCP | ~4–6s (unoptimized bundle) | < 2.5s | High | P1 |
| Initial JS bundle | Unknown (large — D3+TF.js+Recharts+Mermaid) | < 500KB | High | P1 |
| AI op UX | Blocking (synchronous) 🔴 | Non-blocking + SSE progress bar | Critical | P0 |
| CDN caching | None | Firebase Hosting cache rules | Medium | P1 |
| APM / monitoring | None | OpenTelemetry + Google Cloud Monitoring | High | P1 |
| Code splitting | None configured in vite.config.ts | Lazy views + dynamic imports | High | P1 |
| Image optimization | None (Vision Board uploads uncached) | Firebase Storage + CDN | Low | P3 |

**Performance SLO targets:**
- LCP < 2.5s (cold), < 1.5s (warm, CDN-cached)
- INP < 200ms for all dashboard interactions
- p95 API latency < 300ms (non-AI endpoints)
- p95 AI task queue completion < 30s (async, with progress SSE)
- Uptime: 99.9% (Firebase SLA inherited)
- Bundle: < 500KB initial JS (lazy-load heavy libs)

---

### 5. Security & Compliance

| Issue | Current State | Target | Priority |
|---|---|---|---|
| API key in client bundle | 🔴 EXPOSED | Server-side proxy — key never leaves server | **P0** |
| OAuth token validation | 🔴 MOCK CODE | Real GitHub API validation | **P0** |
| Security headers | 🔴 None | helmet.js (CSP, HSTS, X-Frame-Options, X-Content-Type) | P0 |
| Rate limiting | 🔴 None | express-rate-limit per org + per IP | P0 |
| Error message leakage | 🟠 Stack traces sent to client | Sanitized generic error responses | P0 |
| RBAC Custom Claims | 🟡 Partial | Fully enforced server-side + Firestore rules | P1 |
| Dependency scanning | ❌ None | Dependabot weekly PRs + Snyk | P1 |
| postMessage origin check | 🟠 Missing | Validate `event.origin` in OAuth callback | P0 |
| GDPR compliance | ❌ None | Data processing policies + EU Firestore region | P2 |
| MFA | ❌ None | Firebase MFA (optional, recommended for admins) | P3 |

**Current auth mechanism:** GitHub OAuth 2.0 → cookie (`auth_session`) set with Secure + SameSite=None. Firebase Auth also in use. RBAC middleware (`authorize()`) on API routes but Custom Claims not fully validated server-side. No MFA. No session expiry.

**Known vulnerabilities:**
- 🔴 `GEMINI_API_KEY` exposed in client bundle via `Vite define()` — extractable from browser DevTools
- 🔴 GitHub OAuth token not validated server-side (placeholder comment in code)
- 🟠 No `helmet.js` — missing `X-Frame-Options`, `CSP`, `HSTS` headers
- 🟠 No `express-rate-limit` — API is fully open to abuse
- 🟠 `error.message` sent raw to client in OAuth error handler
- 🟡 No Dependabot / Snyk — dependency CVEs unmonitored

---

### 6. Scalability & Reliability

| Dimension | Current | Target | Priority |
|---|---|---|---|
| AI job queue | None — synchronous blocking | Cloud Tasks (managed, GCP-native) | **P0** |
| Horizontal scaling | Single process, not containerized | Cloud Run autoscaling (min 1, max N) | P1 |
| Circuit breaker | None | Gemini API circuit breaker + fallback | P1 |
| Retry / backoff | None | Exponential backoff on AI service calls | P1 |
| Load testing | None | k6 benchmarks against defined SLOs | P3 |
| Disaster recovery | Firebase-inherited only | Multi-region Firestore + backup policy | P2 |
| Context token management | Manual pruning (>12 messages) | Automatic token budget enforcement | P2 |

**Current bottlenecks:**
- Single synchronous Express process handles AI + API + static serving
- No job queue — Gemini API calls block the Node.js event loop
- No horizontal scaling (single Cloud Run instance presumed)
- No circuit breaker for Gemini API failures
- No retry/backoff logic for AI service calls

---

### 7. Quality Standards & Engineering Practices

| Dimension | Current | Target | Priority |
|---|---|---|---|
| Test coverage | < 5% (6 test files) | ≥ 60% (unit + integration) | P1 |
| CI/CD pipeline | None ❌ | GitHub Actions: lint → test → build → deploy | **P0** |
| e2e tests | None | Playwright (critical user journeys) | P2 |
| ADRs | Partial (doc files exist) | ADR for every major architectural decision | P2 |
| Pre-commit hooks | None | Husky + lint-staged (ESLint + Prettier + tsc) | P1 |
| API documentation | None | OpenAPI / Swagger spec | P2 |
| Branching strategy | Undefined | Trunk-based with short-lived feature branches | P1 |
| Dependency scanning | None | Dependabot (weekly, auto-merge patches) | P1 |

---

## [4] PRIORITIZED ACTION BACKLOG (MoSCoW)

### 🔴 MUST (Phase 0 — Weeks 1–2)

| # | Action | Effort |
|---|---|---|
| M1 | Move `GEMINI_API_KEY` server-side — create `/api/ai/generate` proxy endpoint | 2h |
| M2 | Fix GitHub OAuth token validation (remove mock, validate against GitHub API) | 2h |
| M3 | Install + configure `helmet.js` (CSP, HSTS, X-Frame-Options) | 30min |
| M4 | Install + configure `express-rate-limit` (100 req/min per IP, 1000/min per org) | 1h |
| M5 | Sanitize all error responses (no raw stack traces to client) | 30min |
| M6 | Set up GitHub Actions CI pipeline (lint → test → build on every push) | 3h |
| M7 | Validate `event.origin` in OAuth postMessage handler | 30min |

### 🟠 SHOULD (Phase 1 — Weeks 3–8)

| # | Action | Effort |
|---|---|---|
| S1 | Implement Firebase Custom Claims fully (org/role in token, server-side verified) | 1 day |
| S2 | Wire full Firestore persistence (replace ephemeral React Context data) | 3 days |
| S3 | Build async AI task queue (Cloud Tasks) with SSE progress to UI | 3 days |
| S4 | Implement PromptManager service (version + store prompts in Firestore) | 1 day |
| S5 | Add correlationId middleware + JSON structured logging (OpenTelemetry) | 1 day |
| S6 | Lift test coverage to 40% (Vitest unit + integration) | 3 days |
| S7 | Add Dependabot + Snyk for dependency vulnerability scanning | 30min |
| S8 | Add Husky + lint-staged (ESLint + Prettier + `tsc --noEmit` pre-commit) | 1h |
| S9 | Finalize Firestore flat schema + composite index configuration | 1 day |
| S10 | Implement AuditLog service (every mutation: userId, action, timestamp, resourceId) | 1 day |
| S11 | Add Vite `lazy()` code splitting for all 14 views | 2h |

### 🟡 COULD (Phase 2 — Weeks 9–16)

| # | Action |
|---|---|
| C1 | Vector memory store for Simulation agent (Firestore Vector Search — v2.3) |
| C2 | Replace LLM-simulated math with math.js real computation (Monte Carlo precision) |
| C3 | Replace `mockExternalServices.ts` with real Jira/GitHub/SQL APIs |
| C4 | Stripe billing integration (per-org subscription tiers) |
| C5 | Storybook design system + WCAG 2.2 AA accessibility audit |
| C6 | RTL layout support (Arabic — MENA market) |
| C7 | Containerize backend (Dockerfile + Cloud Run autoscaling) |
| C8 | API versioning (`/api/v1/` prefix) |
| C9 | OpenAPI/Swagger spec auto-generation |
| C10 | Firebase Hosting cache rules + CDN optimization |
| C11 | Playwright e2e test suite (critical user journeys) |

### ⚫ WON'T (this cycle)

| # | Action | Reason |
|---|---|---|
| W1 | Migrate from Firebase to self-hosted DB | High cost/risk; Firebase sufficient at current scale |
| W2 | Full SOC 2 Type II certification | Requires 12 months of evidence collection |
| W3 | Switch from Gemini to multi-LLM (OpenAI/Anthropic) | Deeply integrated; out of scope |
| W4 | Native mobile app (iOS/Android) | Web-first is correct for B2B enterprise |

---

## [5] RISK REGISTER

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | API key extracted by user → abuse / cost spike | 🔴 Certain (currently exposed) | 🔴 Critical | M1: Move to server proxy immediately (Week 1) |
| R2 | Firestore migration breaks existing MVP data | 🟠 Medium | 🟠 High | Migration script + feature flags for rollout |
| R3 | Gemini API quota exhaustion under load | 🟠 Medium | 🟠 High | Rate limit per org + task queue backpressure |
| R4 | Async queue complexity delays Phase 1 | 🟠 Medium | 🟡 Medium | Use Cloud Tasks (managed, zero-ops) not BullMQ |
| R5 | Low test coverage causes silent regressions | 🔴 High | 🟠 High | CI test gate blocks merges below threshold |
| R6 | GDPR violation (EU user data in wrong Firestore region) | 🟡 Low | 🔴 Critical | Configure Firestore region to `europe-west1` |
| R7 | Large bundle causes bounce on slow connections | 🟠 Medium | 🟠 High | Vite code splitting (S11 — quick win) |
| R8 | RBAC bypass via malformed Firebase token | 🟡 Low | 🔴 Critical | Enforce Custom Claims server-side, not just in Firestore rules |
| R9 | XSS escalation via OAuth postMessage | 🟡 Low | 🟠 High | Validate `event.origin` before processing (M7) |
| R10 | Solo team velocity bottleneck | 🔴 High | 🟠 High | Phase 0 quick wins deliverable in 1 sprint; build momentum |

---

## [6] SUCCESS METRICS DASHBOARD

| Dimension | KPI | Baseline | Target |
|---|---|---|---|
| **Security** | API key exposed in client bundle | ✅ YES (exposed) | ❌ NO (server-only) |
| **Security** | OWASP critical findings | 4+ | 0 |
| **Security** | Dependency CVEs (high severity) | Unknown | 0 unpatched within 7 days |
| **Security** | Security headers present | 0/7 | 7/7 (via helmet) |
| **Performance** | LCP (cold load, estimated) | ~5s | < 2.5s |
| **Performance** | Initial JS bundle size | Unknown (large) | < 500KB |
| **Performance** | AI task UX | Blocking 🔴 | Non-blocking + progress bar ✅ |
| **Performance** | p95 API latency (non-AI) | Unknown | < 300ms |
| **Quality** | Test coverage | < 5% | ≥ 60% |
| **Quality** | CI/CD pipeline on all PRs | 0% | 100% |
| **Quality** | Deployment frequency | Manual/ad-hoc | Daily automated |
| **Quality** | Pre-commit gates | None | ESLint + tsc + tests |
| **Reliability** | Error rate (non-AI endpoints) | Unknown | < 0.1% |
| **Reliability** | Uptime (measured) | Firebase SLA | 99.9% measured + alerted |
| **Architecture** | AI ops running async | 0% | 100% |
| **Architecture** | Prompts versioned in Firestore | 0% | 100% |
| **Architecture** | State persisted to Firestore | ~10% (partial) | 100% |
| **Scalability** | Concurrent users supported | ~1 (dev) | 500+ |

---

## [7] TECHNOLOGY DECISION RECORDS (TDRs)

### TDR-001: Async AI Task Queue — Cloud Tasks vs BullMQ

| | Cloud Tasks (GCP) | BullMQ (Redis) |
|---|---|---|
| Ops overhead | Zero (managed) | Medium (Redis instance) |
| Cost | ~$0.40 / million tasks | Redis ~$30/mo |
| Retry logic | Built-in | Built-in |
| GCP/Firebase fit | ✅ Native | External |
| **Decision** | ✅ **Cloud Tasks** | |

**Rationale:** Already on GCP/Firebase. Managed, zero-ops, scales to millions. Add Redis only if job state visibility becomes critical in Phase 3.

---

### TDR-002: Vector Memory Store — Firestore Vector Search vs Pinecone vs pgvector

| | Firestore Vector Search | Pinecone | pgvector |
|---|---|---|---|
| Ops overhead | Zero (native) | Zero (managed) | High (Postgres needed) |
| Cost | Firebase pricing | $70+/mo | Self-hosted |
| GCP fit | ✅ Native | External | External |
| **Decision** | ✅ **Firestore Vector Search** | | |

**Rationale:** Firebase already in use. Firestore native vector search (released 2024). No new vendor, no new billing relationship.

---

### TDR-003: Real-time Collaboration — WebSockets vs Firestore Listeners

| | WebSockets (Socket.io) | Firestore Realtime Listeners |
|---|---|---|
| Ops overhead | High (stateful server) | Zero (managed) |
| Horizontal scaling | Requires sticky sessions | Stateless, trivial |
| Cost | Server compute | Firebase reads |
| **Decision** | ✅ **Firestore Listeners** | |

**Rationale:** Stateless, Firebase-native, zero extra ops. Use WebSockets only if sub-100ms latency becomes critical (Phase 3+).

---

### TDR-004: Observability Stack — Google Cloud Monitoring vs Datadog

| | Google Cloud Monitoring | Datadog |
|---|---|---|
| GCP integration | ✅ Native | Requires agent |
| Cost | Included in GCP billing | $15+/host/mo |
| OpenTelemetry support | ✅ Full | ✅ Full |
| **Decision** | ✅ **Google Cloud Monitoring + OpenTelemetry** | |

**Rationale:** GCP-native, zero new vendor contracts, covered by existing Firebase billing. Migrate to Datadog if multi-cloud or advanced ML anomaly detection is needed.

---

### TDR-005: Design Component Layer — Radix UI vs Headless UI vs shadcn/ui

| | Radix UI | Headless UI | shadcn/ui |
|---|---|---|---|
| Accessibility | ✅ ARIA-complete | ✅ ARIA-complete | ✅ (Radix-based) |
| Tailwind compatibility | ✅ | ✅ | ✅ Native |
| Bundle impact | Modular | Modular | Zero runtime (copy-paste) |
| **Decision** | | | ✅ **shadcn/ui** |

**Rationale:** Zero extra runtime dependency (components are copied in). Built on Radix (WCAG-compliant). Tailwind-native. Perfect fit for existing stack. No version lock-in.

---

## [8] QUICK WINS — ACHIEVABLE IN 2 WEEKS

| # | Action | Effort | Impact |
|---|---|---|---|
| QW1 | Remove `GEMINI_API_KEY` from `Vite define()` → create `/api/ai/generate` proxy | 2h | 🔴 Critical security fix |
| QW2 | Install + configure `helmet.js` | 30min | 🟠 7 security headers instantly |
| QW3 | Install + configure `express-rate-limit` (per IP + per org) | 1h | 🟠 Abuse prevention |
| QW4 | Fix OAuth error response (remove `error.message` leakage) | 30min | 🟠 Info disclosure fix |
| QW5 | Add GitHub Actions CI pipeline (`.github/workflows/ci.yml`) | 3h | 🟠 Every push is now verified |
| QW6 | Add Vite `lazy()` code splitting for all 14+ views in `App.tsx` | 2h | 🟡 ~40-60% bundle reduction |
| QW7 | Add `correlationId` middleware (UUID injected on every request) | 1h | 🟡 Foundation for tracing |
| QW8 | Add Husky + lint-staged (`tsc --noEmit` + Vitest on pre-commit) | 1h | 🟡 Prevents broken commits |
| QW9 | Add Dependabot (`.github/dependabot.yml`) | 15min | 🟡 CVE monitoring for free |
| QW10 | Validate `event.origin` in OAuth postMessage callback | 30min | 🟠 XSS escalation prevention |

**Total estimated effort: ~12 hours**
**Combined impact: Eliminates 4 critical/high security vulnerabilities + establishes CI/CD foundation**

---

## CONSTRAINTS & PREFERENCES

```
Budget sensitivity    : Bootstrapped / early-stage — prefer GCP-native managed
                        services over new paid SaaS tools

Migration tolerance   : Must stay live during migration (feature-flag driven
                        rollout, no big-bang migrations)

Must-avoid tech       : No additional paid SaaS above existing Firebase/GCP costs
                        No heavy vendor lock-in beyond current Firebase commitment
                        No self-hosted databases (ops burden too high for team size)

Regulatory region     : MENA + EU users
                        → Firestore region: europe-west1 for EU compliance
                        → GDPR data processing policies required

Timeline pressure     : Phase 0 (Quick Wins) should complete within 2 weeks
                        Phase 1 (Foundation) before any enterprise customer demos
```

---

*Last updated: 2026-04-02 | Next review: After Phase 0 completion*
