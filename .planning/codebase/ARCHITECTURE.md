# Architecture

**Analysis Date:** 2026-04-12

## Pattern Overview

**Overall:** Service-Oriented Full-Stack Application with AI Orchestration

**Key Characteristics:**
- **Proxy-Based AI Access:** All client-side AI requests are proxied through a secure backend layer to protect credentials and enforce RBAC.
- **Mission-Driven Orchestration:** The "Hive" pattern manages complex, multi-step AI workflows asynchronously.
- **Real-Time Synthesis:** Streaming AI responses (SSE/WebSockets) integrated directly into the UI.
- **Hybrid Data Model:** Real-time Firebase Firestore for application state + External AI for synthesis.

## Layers

**UI Layer (React):**
- Purpose: Goal-oriented views and interactive dashboards.
- Contains: Feature components, state hooks, and context providers.
- Location: `components/features/`, `hooks/`, `context/`.
- Depends on: Service Layer (Client-side), CatalystContext.
- Used by: End user.

**Service Layer (Client-side):**
- Purpose: Application logic, data fetching, and AI proxy routing.
- Contains: Feature services (Hive, Cortex, Predictive), Firebase integration.
- Location: `services/*.ts`.
- Depends on: Server API (Proxies), Firestore.
- Used by: UI Components.

**Orchestration Layer (Hive):**
- Purpose: Managing complex AI missions that involve multiple providers and tools.
- Contains: Mission planning, step execution, and state persistence.
- Location: `services/hiveService.ts`, `services/ai/agents/`.
- Depends on: AI Services, External Integrations.
- Used by: Specialized high-level features (e.g., automated analytics).

**API Proxy Layer (Express/Functions):**
- Purpose: Securely routing requests to external AI providers and cloud services.
- Contains: Route handlers, token injection, and usage tracking.
- Location: `server/`, `functions/src/`.
- Depends on: External API providers (Gemini, Stripe, etc.).
- Used by: Client-side services.

## Data Flow

**AI Request Lifecycle:**

1. **Trigger:** `CortexView.tsx` uses `useAIStream` hook to initiate a prompt.
2. **Proxy Call:** Client-side `aiService.ts` makes a POST request to `/api/gemini/generate` on the backend.
3. **Auth/Tracking:** Backend middleware validates the user's Firebase token and begins logging usage via OpenTelemetry.
4. **Execution:** Backend calls Google Gemini API using secure credentials.
5. **Streaming:** AI response is streamed back to the client in real-time.
6. **State Update:** `CatalystContext` updates the global UI state with the synthesized results.

**Hive Mission Flow:**

1. **Planning:** `hiveService.ts` creates a `MissionPlan` with discrete `Steps`.
2. **Execution:** `microservices.ts` orchestrates the sequential or parallel execution of steps.
3. **Integration:** `IntegromatService.ts` or `ScoutService.ts` calls external webhooks or data sources.
4. **Completion:** Results are aggregated and stored in Firestore for persistent access.

## Key Abstractions

**Service:**
- Purpose: Encapsulate domain-specific business logic.
- Examples: `services/firestoreService.ts`, `services/predictiveService.ts`.
- Pattern: Stateless class-based services or functional modules.

**Provider Proxy:**
- Purpose: Unified interface for multiple AI models.
- Examples: `server/api/gemini.ts`, `services/llmProxyService.ts`.
- Pattern: Adapter pattern for provider-neutral interactions.

**Agent:**
- Purpose: Specialized AI task execution.
- Examples: `services/ai/agents/BaseAgent.ts`, `services/ai/agents/IntegromatService.ts`.
- Pattern: Strategy pattern for different agent capabilities.

## Entry Points

**Client Entry:**
- Location: `index.tsx`
- Triggers: Browser page load.
- Responsibilities: Initialize Firebase, mount React app, setup routing.

**Server Entry:**
- Location: `server.ts`
- Triggers: `npm run dev` or production startup.
- Responsibilities: Initialize Express, setup proxies, enable CORS.

**Background Workers:**
- Location: `functions/src/index.ts`
- Triggers: Firestore triggers, Cron jobs, or direct HTTPS calls.

## Error Handling

**Strategy:** Centralized error boundary in UI + Middleware-based error trapping in API.

**Patterns:**
- **Resilient AI:** AI requests automatically retry with exponential backoff if the proxy returns a 5xx error.
- **Graceful Degradation:** Dashboard components show "Offline Mode" indicators if Firestore connection is lost.

---

*Architecture analysis: 2026-04-12*
*Update when major patterns change*
