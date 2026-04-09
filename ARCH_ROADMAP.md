# Architecture Roadmap: Closing the Gaps

Based on the [ARCHITECTURE_GAP_ANALYSIS.md](./ARCHITECTURE_GAP_ANALYSIS.md), we have made significant progress (Phase 1 & 2 complete), but several critical and high-priority gaps remain. This plan outlines the strategy for resolving them.

## User Review Required

> [!IMPORTANT]
> - **G1 (LocalStorage Read source)**: My initial check shows `InitiativeContext` and `OrgContext` already use `firestoreWatch*` listeners. I need to verify if there are any *other* data tracks (e.g. Hive state, user settings) that still prioritize `localStorage` over the database.
> - **G4 (External Services)**: Decisions are needed on whether to implement real Jira/SQL integrations or simply create robust mock interfaces for demonstration purposes.

## Proposed Work Streams

### 1. Enterprise Scale: Data Pagination (G3)
The system currently fetches all initiatives and projects at once, which will fail for enterprise-level data volumes.

- **Server**:
  - [MODIFY] `InitiativeController.ts` & `ProjectController.ts`: Add `limit` and `cursor` query parameters.
  - [MODIFY] `InitiativeService.ts` & `ProjectService.ts`: Implement paginated fetch logic using Firestore cursors.
- **Client**:
  - [MODIFY] `api.ts`: Update API methods to support pagination params.
  - [MODIFY] `InitiativeContext.tsx` & `OrgContext.tsx`: Implement "Load More" or infinite scroll state logic.

---

### 2. Eliminating the "God Object" (G2)
While `CatalystContext` is now a wrapper, the individual domain controllers are becoming monoliths (e.g. `InitiativeContext.tsx` at 343 lines).

- **Action**: Move business logic (WBS triggers, message generation, artifact saving) into dedicated service classes or smaller hooks, leaving the Context Provider as a pure state store.

---

### 3. Production Readiness & Integrations (G4, G6)
Transitioning from a mockup-rich environment to a data-ready environment.

- **Mock Removal**: Implement a more sophisticated `IntegrationService` that can toggle between real and mock data via environment variables or feature flags.
- **Migrations**: Create a real migration harness in `migrations/` to handle Firestore collection setups and schema evolutionary changes.

---

### 4. Code Organization (G5, G8)
Refactoring for long-term maintainability.

- **Component Restructuring**: Group components by feature (`hive`, `cortex`, `strategy`) instead of a flat `components/` folder.
- **Microservices Refactoring**: Decompose the 22KB `microservices.ts` into individual service files (e.g., `TranslationService.ts`, `ComputeService.ts`).

## Open Questions

1. **G1 Verification**: Is there a specific part of the app where the user experience still feels "localStorage-first" despite the Firestore listeners?
2. **Jira Integration**: Do we have sandbox Jira credentials available, or should we focus on building the *interface* for it?

## Proposed Next Step

I recommend starting with **Stream 1: Data Pagination**, as identified as a HIGH priority to prevent performance degradation as the database grows.
