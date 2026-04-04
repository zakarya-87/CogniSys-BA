/**
 * Centralised AI configuration — single source of truth for all AI constants.
 * Import from here instead of scattering values across service files.
 */

export const AI_CONFIG = {
  /** Default model IDs */
  models: {
    primary: 'gemini-2.5-flash',
    fallback: 'gemini-2.5-flash',
    reasoning: 'gemini-3.1-pro-preview',
  },

  /** Per-request timeout in milliseconds */
  timeouts: {
    chat: 30_000,
    generation: 120_000,
    embedding: 10_000,
    repair: 60_000,
  },

  /** Retry configuration (used in utils/aiUtils.ts withRetry) */
  retry: {
    maxAttempts: 5,
    initialDelayMs: 2_000,
    backoffFactor: 2,
    jitterMs: 1_000,
  },

  /** Per-provider circuit breaker */
  circuitBreaker: {
    failureThreshold: 3,   // open after N consecutive failures
    cooldownMs: 60_000,    // half-open probe after 60s
  },

  /** In-memory LRU response cache */
  cache: {
    maxSize: 200,
    ttlMs: 5 * 60 * 1_000, // 5 minutes
  },

  /**
   * maxOutputTokens per operation type.
   * Passed directly to provider APIs to cap spend.
   * Use the key that best matches your operation in generateJson calls.
   */
  tokenBudgets: {
    DEFAULT:      4_096,
    CHAT:           512,
    SWOT:         2_048,
    ANALYSIS:     2_048,
    RISKS:        2_048,
    USER_STORIES: 3_072,
    WBS:          4_096,
    PRESENTATION: 4_096,
    REPORT:       6_144,
    DIAGRAM:      8_192,
    WIREFRAME:    1_024,
    REPAIR:       2_048,
    EMBEDDING:      256,
  },
} as const;

export type TokenBudgetKey = keyof typeof AI_CONFIG.tokenBudgets;
