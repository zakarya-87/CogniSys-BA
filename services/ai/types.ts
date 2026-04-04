/**
 * LLMProvider abstraction layer.
 *
 * Each concrete provider (Gemini, Mistral, Azure) implements this interface.
 * `aiCore.ts` iterates over registered providers instead of hardcoded if/else chains,
 * making it a 1-file change to add a new provider (Anthropic, OpenRouter, Ollama …).
 */

export type ModelTier = 'flash' | 'pro';

export interface LLMCallOptions {
  /** Maximum tokens to generate. Defaults to AI_CONFIG.tokenBudgets.DEFAULT */
  maxOutputTokens?: number;
  /** Extra provider-specific config (passed through as-is) */
  extra?: Record<string, unknown>;
}

/** Unified response shape returned by every provider. */
export interface LLMResponse {
  text: string;
  /** Provider that generated this response */
  provider: string;
}

/**
 * Every LLM provider must implement this interface.
 * The `id` property is used as the key in the circuit breaker and logs.
 */
export interface LLMProvider {
  /** Unique stable provider identifier, e.g. "gemini", "mistral", "azure-openai" */
  readonly id: string;

  /**
   * Generate a text completion for the given prompt.
   * Throw on any non-retriable error; `aiCore.ts` handles retries and fallback.
   */
  generateText(prompt: string, opts?: LLMCallOptions): Promise<LLMResponse>;

  /**
   * Optional: generate a JSON response. Falls back to `generateText` + safeParseJSON
   * if not implemented.
   */
  generateJson?(prompt: string, schema?: unknown, opts?: LLMCallOptions): Promise<LLMResponse>;
}

// ─── Complexity-based model routing ──────────────────────────────────────────

export type TaskComplexity = 'simple' | 'standard' | 'complex';

/** High-reasoning task types that should prefer the 'pro' model tier. */
const HIGH_COMPLEXITY_TASK_TYPES = new Set([
  'BMC', 'INVESTMENT_THESIS', 'STRATEGIC_RECS', 'DECISION_MATRIX',
  'BABOK_ROADMAP', 'OCM_STRATEGY', 'PORTFOLIO_ANALYSIS',
  'C4_DIAGRAM', 'BPMN', 'ERD',
]);

/** Low-effort task types that should always use the 'flash' model tier. */
const LOW_COMPLEXITY_TASK_TYPES = new Set([
  'CHAT', 'REPAIR', 'EMBEDDING', 'INGEST', 'RELEASE_NOTES',
]);

/**
 * Score a task's complexity on a 0-100 scale.
 *
 * Score < 30  → flash
 * Score 30-70 → flash (default fast tier)
 * Score > 70  → pro  (complex reasoning)
 */
export function scoreComplexity(opts: {
  taskType?: string;
  inputLength?: number;
  forceTier?: ModelTier;
}): { score: number; tier: ModelTier } {
  if (opts.forceTier) return { score: opts.forceTier === 'pro' ? 90 : 10, tier: opts.forceTier };

  let score = 30; // baseline

  // Task-type contribution (±40)
  if (opts.taskType) {
    if (HIGH_COMPLEXITY_TASK_TYPES.has(opts.taskType.toUpperCase())) score += 40;
    if (LOW_COMPLEXITY_TASK_TYPES.has(opts.taskType.toUpperCase())) score -= 25;
  }

  // Input length contribution (up to +30 for very long prompts)
  if (opts.inputLength) {
    score += Math.min(30, Math.floor(opts.inputLength / 500));
  }

  score = Math.max(0, Math.min(100, score));
  const tier: ModelTier = score > 70 ? 'pro' : 'flash';
  return { score, tier };
}
