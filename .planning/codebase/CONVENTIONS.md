# Coding Conventions

**Analysis Date:** 2026-04-12

## Naming Patterns

**Files:**
- `PascalCase.tsx` - All React components (e.g., `CortexView.tsx`, `Sidebar.tsx`).
- `camelCase.ts` - Services, hooks, utilities, and server-side logic (e.g., `useAIStream.ts`, `hiveService.ts`).
- `*.test.ts` / `*.test.tsx` - Test files located alongside their source.
- `index.ts` - Entry point for directory re-exports (barrel files).

**Functions:**
- `camelCase` for all functions.
- `handle[Event]` for event handlers in React components (e.g., `handleSendMessage`, `handleStatusChange`).
- `get[Resource]` / `set[Resource]` for data access patterns.

**Variables:**
- `camelCase` for variables and parameters.
- `UPPER_SNAKE_CASE` for global constants (e.g., `AI_MODEL_DEFAULTS`, `FIREBASE_COLLECTIONS`).
- `_` prefix for truly private/internal members in class-based services.

**Types:**
- `PascalCase` for Interfaces and Types (e.g., `MissionPlan`, `StreamState`).
- Avoid `I` prefix for interfaces.
- `PascalCase` for Enums with `UPPER_SNAKE_CASE` values (e.g., `MissionStatus.COMPLETED`).

## Code Style

**Formatting:**
- Automated via **Prettier** (standard config).
- Semicolons are required.
- Single quotes for string literals.
- 2-space indentation.

**Linting:**
- **ESLint** enforced with TypeScript recommendations.
- Strict type checking enabled (`noImplicitAny`, etc.).
- No `console.log` in production; use the dedicated `pino` logger or OTel metrics.

## Import Organization

**Order:**
1. React and React-related libraries.
2. Third-party packages (Firebase, HeroIcons, Framer Motion).
3. Context and State providers (`@/context`).
4. Custom Hooks (`@/hooks`).
5. Components (`@/components`).
6. Services and Utils (`@/services`, `@/utils`).
7. Types (`import type { ... }`).

**Path Aliases:**
- `@/` maps to the project root for simplified absolute imports.

## Error Handling

**Patterns:**
- **Throw Early, Catch Late:** Use `try/catch` at UI boundaries or service entry points. Bubbling up is preferred for transparency.
- **Custom Error Objects:** Extend the base `Error` class for domain-specific issues (e.g., `AuthError`, `AIProviderError`).
- **Graceful Retries:** AI-bound tasks should implement exponential backoff logic (handled in `llmProxyService.ts`).

## Logging & Observability

**Framework:**
- `pino` for production-ready structured logging.
- `OpenTelemetry` for tracing critical AI request lifecycles.

**Conventions:**
- Always include context (IDs, user context) in logs.
- Never log sensitive data (API keys, PII, raw session tokens).

## Comments

**When to Comment:**
- Explain "Why" rather than "What".
- Document complex business logic in the `Hive` mission execution.
- Use `// TODO:` for pending features and `// FIXME:` for known bugs.

**JSDoc:**
- Required for public-facing service methods.
- Should include `@param`, `@returns`, and `@throws` for complex functions.

---

*Convention analysis: 2026-04-12*
*Update when patterns change*
