# Enterprise Architecture Plan: CogniSys BA

This document outlines the enterprise-grade architecture for the CogniSys BA platform, transitioning from a local-state MVP to a secure, multi-tenant, AI-native SaaS platform.

## 1. Data Model (Flat & Query-Optimized)
We are adopting a flat Firestore structure to optimize for query flexibility and performance.

*   **`organizations`**: `{orgId}` (Document)
*   **`projects`**: `{projectId}` (Document, indexed by `orgId`)
*   **`initiatives`**: `{initiativeId}` (Document, indexed by `orgId` and `projectId`)
*   **`audit_logs`**: `{logId}` (Global, indexed by `orgId`)
*   **`roles`**: `{roleId}` (Fine-grained permissions mapping)

*Strategy: Denormalize frequently accessed data to reduce cross-collection reads.*

## 2. RBAC v2 (Fine-Grained & Claims-Based)
We are moving to a permission-based system enforced at the API and Database levels.

*   **Custom Claims**: Cache `orgId` and `permissions` in Firebase Auth tokens for sub-millisecond API authorization.
*   **Permission Mapping**: Granular permissions (e.g., `project:create`, `initiative:update`) mapped to roles.
*   **Audit Trail**: Every mutation records `userId`, `action`, `timestamp`, and `resourceId`.

## 3. Backend Layering (Clean Architecture)
To ensure domain logic is isolated from infrastructure, we are implementing a structured backend:

*   **`/controllers`**: Handle HTTP requests, input validation, and response formatting.
*   **`/services`**: Pure business logic (e.g., "Calculate ROI", "Run Ethical Check").
*   **`/repositories`**: Firestore data access layer.
*   **`/ai-agents`**: Orchestration logic for Gemini, prompt management, and model routing.
*   **`/middleware`**: Auth, RBAC, Rate Limiting, and Logging.

## 4. AI-Native Layer
Core differentiator for the platform:

*   **Prompt Manager**: Versioned prompts stored in Firestore/Config.
*   **Model Router**: Logic to switch between `gemini-3.1-pro` (reasoning) and `gemini-3.1-flash` (speed/cost).
*   **Task Queue**: Async processing for long-running AI tasks (simulations, report generation).

## 5. Observability & Security
*   **Structured Logging**: All logs in JSON format.
*   **Tracing**: Unique `correlationId` passed through API requests, service calls, and AI agent steps.
*   **Hardening**: Implement `express-rate-limit` per organization and strict token validation.

## 6. Implementation Roadmap

### Phase 1: Foundation (The "Enterprise Core")
1.  Define the new flat Firestore schema and indexing strategy.
2.  Implement the `Repository` pattern for all data access.
3.  Set up the `AuditLog` service.

### Phase 2: RBAC v2 & Security
1.  Implement Firebase Auth Custom Claims logic.
2.  Build the RBAC middleware.
3.  Write and deploy the hardened `firestore.rules` (using claims + data validation).

### Phase 3: Backend & AI Orchestration
1.  Implement the Controller/Service/Repository layers.
2.  Build the AI Model Router and Prompt Manager.
3.  Implement the Async Task Queue for AI operations.
