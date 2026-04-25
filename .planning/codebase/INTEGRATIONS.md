# External Integrations

**Analysis Date:** 2026-04-12

## APIs & External Services

**AI Providers:**
- **Google Gemini API** - Primary generative AI provider for synthesis and analytics.
  - SDK/Client: `@google/genai` (Node.js)
  - Auth: API Key stored in `GEMINI_API_KEY` (Server-side environment).
  - Integration: Proxied through `/api/gemini/generate` on the backend.
- **Mistral AI / Azure OpenAI** - Secondary fallback and specialized model providers.
  - Integration: REST API via `Axios` in `llmProxyService.ts`.
  - Auth: API keys in `MISTRAL_API_KEY`, `AZURE_OPENAI_API_KEY`.

**Automation & Webhooks:**
- **Integromat (Make.com)** - External workflow orchestration for the Hive system.
  - Integration method: Outgoing webhooks via `IntegromatService.ts`.
  - Auth: Webhook IDs and secrets in environment variables.
- **GitHub API** - Source code and repository intelligence gathering.
  - SDK/Client: `githubApiService.ts` (custom wrapper around REST API).
  - Auth: GitHub Personal Access Token in `GITHUB_TOKEN`.

**Payment Processing:**
- **Stripe** - Enterprise subscription and seat management.
  - SDK/Client: `stripe` npm package.
  - Auth: `STRIPE_SECRET_KEY` (Server-side) and `STRIPE_PUBLISHABLE_KEY` (Client-side).
  - Endpoints used: Checkout Sessions, Billing Portal, Webhooks.

## Data Storage

**Databases:**
- **Firebase Firestore** - Primary real-time data store for all application entities.
  - Connection: Native Firebase SDK (Web and Admin).
  - Security: `firestore.rules` (RBAC enforced).
- **Offline Cache** - Browser-side persistence for low-connectivity environments.
  - Implementation: `idb` (IndexedDB) via `offlineCache.ts`.

**Authentication & Identity:**
- **Firebase Authentication** - Primary identity provider.
  - Implementation: Firebase Auth SDK (Client) + Admin SDK (Server).
  - Providers: Email/Password, Google Sign-In.
  - Session management: Firebase ID Tokens (JWT) exchanged for session cookies.

## Monitoring & Observability

**Error Tracking:**
- **Sentry** - Frontend and backend crash reporting.
  - DSN: `SENTRY_DSN` env var.
  - Config: `vitest.setup.ts` and `App.tsx`.

**Observability:**
- **OpenTelemetry** - Detailed tracing for AI request lifecycles.
  - Exporter: OTLP/HTTP to monitoring backend.
  - Instrumentations: `express`, `http`, `pg`, `genai`.

## CI/CD & Deployment

**Hosting:**
- **Firebase Hosting** - Static asset and React SPA hosting.
- **Cloud Run / Functions** - Managed server-side logic and AI proxies.

**Build Pipeline:**
- **GitHub Actions / Cloud Build** - Automated testing and deployment.
  - Workflows: `test.yml`, `deploy.yml`.

## Webhooks & Callbacks

**Incoming:**
- **Stripe Webhooks** - Handler at `/api/webhooks/stripe`.
  - Verification: Signature validation via `stripe.webhooks.constructEvent`.
  - Events: `invoice.paid`, `customer.subscription.deleted`.

**Outgoing:**
- **Hive Mission Hooks** - Triggered by `hiveService.ts`.
  - Trigger: Step completion or mission failure.
  - Target: External notification systems or Integromat workflows.

---

*Integration audit: 2026-04-12*
*Update when adding/removing external services*
