# Codebase Concerns

**Analysis Date:** 2026-04-12

## Tech Debt

**"Fetch-All" Data Pattern:**
- **Issue:** Many services (e.g., `firestoreService.ts`) fetch all documents in a collection without pagination or cursors.
- **Why:** Initial architecture optimized for low data volumes.
- **Impact:** Performance will degrade linearly with enterprise data growth; browser memory issues for large organizations.
- **Fix approach:** Implement limit and cursor-based pagination in `InitiativeController` and `firestoreService.ts`.

**Service Monoliths:**
- **Issue:** `hiveService.ts` and `microservices.ts` have grown to over 500 lines with multiple responsibilities.
- **Why:** Centralized orchestration logic was easier to manage during the rapid iteration of the Hive mission system.
- **Impact:** Harder to test in isolation; higher risk of side effects from small changes.
- **Fix approach:** Extract mission planning, step execution, and state persistence into separate specialized services.

## Known Bugs

**AI Proxy Authentication Failures:**
- **Symptoms:** Intermittent 401/403 errors when calling AI proxy endpoints.
- **Trigger:** Frontend service calls made before the Firebase ID token is fully refreshed or when organization claims are missing.
- **Files:** `services/aiService.ts`, `server/api/proxy.ts`.
- **Workaround:** Client-side retry logic catches most failures, but causes a 1-2s delay.
- **Root cause:** Token propagation timing issues between the React context and Axios interceptors.

## Security Considerations

**AI Proxy Endpoint Exposure:**
- **Risk:** If auth middleware is misconfigured or bypassed, external actors could consume expensive Gemini tokens.
- **Files:** `server.ts`, `firebase.json` (function access rules).
- **Current mitigation:** Firebase ID token validation required for all `/api/` calls.
- **Recommendations:** Implement per-user rate limiting and organization-level budget caps for AI consumption.

**PII in AI Prompts:**
- **Risk:** User data might be leaked to external AI providers if not scrubbed before synthesis.
- **Files:** `services/promptFactory.ts`, `services/ai/agents/BaseAgent.ts`.
- **Current mitigation:** Developer awareness; no automated scrubbing.
- **Recommendations:** Implement a PII scrubber middleware in the prompt factory.

## Performance Bottlenecks

**Large Component Re-renders:**
- **Problem:** `CortexView.tsx` and `AnalyticsDashboard.tsx` re-render frequently during AI streams.
- **Measurement:** ~200ms frame drops noted during heavy data synthesis.
- **Cause:** Large global state updates in `CatalystContext` trigger deep component trees.
- **Improvement path:** Use `React.memo` for static UI elements and implement local "buffering" hooks for real-time AI streams.

## Fragile Areas

**Integromat Webhook Integration:**
- **Why fragile:** Relies on hardcoded webhook IDs and specific JSON schemas that are managed externally (in Make.com).
- **Common failures:** Changes in the Make.com scenario break the `IntegromatService.ts` without local errors.
- **Safe modification:** Always use the `mockExternalServices.ts` to verify integration contracts before deploying.
- **Test coverage:** Low; mostly relies on manual verification.

---

*Concerns audit: 2026-04-12*
*Update as issues are fixed or new ones discovered*
