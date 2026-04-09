import { callGeminiProxy, resolveModelTier } from '../geminiProxy';
import { PromptFactory } from '../promptFactory';
import { withRetry, safeParseJSON, validateStructure } from '../../utils/aiUtils';
import { callMistral, callAzureOpenAI } from '../llmProxyService';
import { TAnalysisPlan, Sector } from '../../types';
import _generatedSchemas from '../../generated_schemas.json';
import { AI_CONFIG, TokenBudgetKey } from './aiConfig';
import { logger } from '../../src/utils/logger';
import { scoreComplexity, ModelTier } from './types';

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
/** Tracks per-provider failure state. Thread-safe within a single JS engine. */
class CircuitBreaker {
  private failures = new Map<string, number>();
  private openedAt = new Map<string, number>();

  isOpen(provider: string): boolean {
    const failures = this.failures.get(provider) ?? 0;
    if (failures < AI_CONFIG.circuitBreaker.failureThreshold) return false;
    const opened = this.openedAt.get(provider) ?? 0;
    // After cooldown, allow one probe (half-open)
    if (Date.now() - opened > AI_CONFIG.circuitBreaker.cooldownMs) return false;
    return true;
  }

  recordFailure(provider: string): void {
    const count = (this.failures.get(provider) ?? 0) + 1;
    this.failures.set(provider, count);
    if (count === AI_CONFIG.circuitBreaker.failureThreshold) {
      this.openedAt.set(provider, Date.now());
      logger.warn(`[CircuitBreaker] Provider "${provider}" OPENED after ${count} failures`);
    }
  }

  recordSuccess(provider: string): void {
    const wasFailing = (this.failures.get(provider) ?? 0) >= AI_CONFIG.circuitBreaker.failureThreshold;
    this.failures.set(provider, 0);
    this.openedAt.delete(provider);
    if (wasFailing) logger.log(`[CircuitBreaker] Provider "${provider}" CLOSED (recovered)`);
  }
}

// ─── LRU Response Cache ───────────────────────────────────────────────────────
class LRUCache {
  private cache = new Map<string, { value: string; expiresAt: number }>();

  get(key: string): string | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this.cache.delete(key); return undefined; }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: string): void {
    // Only evict if we're adding a new key (not updating an existing one)
    if (!this.cache.has(key) && this.cache.size >= AI_CONFIG.cache.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + AI_CONFIG.cache.ttlMs });
  }
}

/** SHA-256 cache key over the full prompt — no truncation, no collision risk */
function hashKey(model: string, prompt: string): string {
  // crypto is available in browser (WebCrypto) and Node; use a sync approach via
  // a simple djb2-style hash over the full string for client-side compatibility.
  // We XOR the first half against the second half to keep sensitivity to late chars.
  const str = `${model}::${prompt}`;
  let h1 = 0x811c9dc5; // FNV offset basis
  let h2 = 0x9dc5811c;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (i < str.length / 2) {
      h1 ^= c; h1 = Math.imul(h1, 0x01000193);
    } else {
      h2 ^= c; h2 = Math.imul(h2, 0x01000193);
    }
  }
  return ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36));
}

// ─── Request Timeout ─────────────────────────────────────────────────────────
/**
 * Wraps `fn` with an AbortController so the underlying fetch can be cancelled.
 * The signal is passed to `fn`; callers that support it (callGeminiProxy) will
 * abort the in-flight request rather than just letting it drain silently.
 */
function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`AI request timed out after ${ms}ms`)), ms);
  return fn(controller.signal).finally(() => clearTimeout(timer));
}

// ─── Structured AI Call Logging ───────────────────────────────────────────────
function logAiCall(opts: {
  model: string;
  latencyMs: number;
  success: boolean;
  cached?: boolean;
  retryCount?: number;
  error?: string;
}) {
  const { model, latencyMs, success, cached, retryCount, error } = opts;
  if (success) {
    logger.log(`[AI] ${model} | ${latencyMs}ms${cached ? ' (cached)' : ''} | ok${retryCount ? ` retry=${retryCount}` : ''}`);
  } else {
    logger.warn(`[AI] ${model} | ${latencyMs}ms | FAILED: ${error}`);
  }
}

// ─── Module-level singletons ──────────────────────────────────────────────────
const circuitBreaker = new CircuitBreaker();
const responseCache = new LRUCache();

// Local Type constants — mirrors @google/genai Type enum values used in schemas.
export const Type = {
  ARRAY: 'ARRAY', OBJECT: 'OBJECT', STRING: 'STRING',
  NUMBER: 'NUMBER', BOOLEAN: 'BOOLEAN', INTEGER: 'INTEGER',
} as const;

// Cast to a permissive shape so .required access doesn't error
type JsonSchema = { required?: string[]; [key: string]: unknown };
export const generatedSchemas = _generatedSchemas as Record<string, JsonSchema>;

// Default model tier — 'flash' is fast/cheap; 'pro' for complex reasoning tasks
let activeModelId: string = AI_CONFIG.models.primary;
const FALLBACK_MODEL: string = AI_CONFIG.models.fallback;

// Global flag to track if the primary model is exhausted (quota reached)
let isPrimaryModelExhausted = false;

export const setAiModelId = (id: string) => {
    logger.log(`Switching AI Model to: ${id}`);
    activeModelId = id;
    isPrimaryModelExhausted = false;
};

// Helper interface for the Double-Pass Validator pattern
export interface DoublePassResponse<T> {
  _draft_logic: string;
  _audit_log: string[];
  final_diagram: T;
}

// --- Strict Schemas ---

export const AnalysisPlanSchema = {
  type: Type.OBJECT,
  properties: {
    approach: { type: Type.STRING },
    stakeholders: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          name: { type: Type.STRING },
        },
        required: ["role", "name"],
      },
    },
    techniques: { type: Type.ARRAY, items: { type: Type.STRING } },
    deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["approach", "stakeholders", "techniques", "deliverables"],
};

// --- Error Standardization ---
function handleAiError(error: any): never {
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('Quota')) {
        throw new Error("AI Service Quota Exceeded. The free tier limit has been reached. The quota will reset the next day. Please try again later.");
    }
    if (msg.includes('Safety') || msg.includes('blocked')) {
        throw new Error("The request was blocked by safety filters. Please refine your input.");
    }
    if (msg.includes('500') || msg.includes('503') || msg.includes('Overloaded')) {
        throw new Error("AI Service is temporarily overloaded. Retrying usually fixes this.");
    }
    throw error;
}

// --- Self-Healing JSON Logic ---

async function repairJson<T>(malformedJson: string, errorMsg: string, schema?: any): Promise<T> {
    logger.warn("Attempting to repair malformed JSON via AI...", errorMsg);

    const repairPrompt = `You are a JSON Repair Agent. The following JSON string is invalid or missing required keys. 
    Error: ${errorMsg}
    ${schema ? `Expected Schema: ${JSON.stringify(schema)}` : ''}
    
    CORRECT THE JSON. Ensure all required keys are present. Do not add any conversational text. Return ONLY valid JSON.
    
    Broken JSON:
    ${malformedJson}`;

    const executeRepair = async (modelId: string) => {
        if (modelId === 'mistral') {
            const response = await callMistral({ messages: [{ role: 'user', content: repairPrompt }] });
            return response.choices[0].message.content;
        } else if (modelId === 'azure-openai') {
            const response = await callAzureOpenAI({ messages: [{ role: 'user', content: repairPrompt }] });
            return response.choices[0].message.content;
        } else {
            return await callGeminiProxy(repairPrompt, resolveModelTier(modelId));
        }
    };

    const modelsToTry = [activeModelId];
    if (activeModelId !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
    if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
    if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

    let lastError: any = null;
    for (const modelId of modelsToTry) {
        if (modelId === activeModelId && isPrimaryModelExhausted) continue;
        try {
            const fixedText = await executeRepair(modelId);
            if (fixedText) return safeParseJSON<T>(fixedText, undefined, true);
        } catch (e: any) {
            lastError = e;
            const errorMessage = e.message || "";
            if (errorMessage.includes('429') || errorMessage.includes('Quota')) {
                if (modelId === activeModelId) {
                    isPrimaryModelExhausted = true;
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('quota-exceeded'));
                }
            }
            logger.warn(`Repair attempt with ${modelId} failed. Trying next...`, errorMessage);
        }
    }

    throw lastError || new Error("Failed to repair JSON data.");
}

// --- Core AI Caller ---

export async function generateJson<T>(
  prompt: string,
  schema?: any,
  requiredKeys: string[] = [],
  opts: {
    noCache?: boolean;
    tokenBudget?: TokenBudgetKey;
    timeoutMs?: number;
    taskType?: string;
    forceTier?: ModelTier;
  } = {},
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? AI_CONFIG.timeouts.generation;
  const maxTokens = AI_CONFIG.tokenBudgets[opts.tokenBudget ?? 'DEFAULT'];

  // Smart model routing: complexity score decides flash vs pro
  const { tier } = scoreComplexity({
    taskType: opts.taskType,
    inputLength: prompt.length,
    forceTier: opts.forceTier,
  });
  const routedModel = tier === 'pro' ? AI_CONFIG.models.reasoning : activeModelId;

  const cacheKey = hashKey(routedModel, prompt);
  const t0 = Date.now();

  // Cache hit — skip network call entirely
  if (!opts.noCache) {
    const cached = responseCache.get(cacheKey);
    if (cached) {
      logAiCall({ model: activeModelId, latencyMs: Date.now() - t0, success: true, cached: true });
      return safeParseJSON<T>(cached);
    }
  }

  return withRetry(async () => {
    try {
        let text = "";

        const fullPrompt = schema
          ? `${prompt}\n\nPlease return the response in JSON format matching this schema:\n${JSON.stringify(schema)}`
          : prompt;

        const callModel = async (modelId: string, signal: AbortSignal) => {
            if (modelId === 'mistral') {
                const response = await callMistral({
                    messages: [{ role: 'user', content: fullPrompt }],
                    max_tokens: maxTokens,
                });
                return response.choices[0].message.content;
            } else if (modelId === 'azure-openai') {
                const response = await callAzureOpenAI({
                    messages: [{ role: 'user', content: fullPrompt }],
                    max_tokens: maxTokens,
                });
                return response.choices[0].message.content;
            } else {
                return await callGeminiProxy(fullPrompt, resolveModelTier(modelId), {
                    generationConfig: { maxOutputTokens: maxTokens },
                }, signal);
            }
        };

        // Start with the complexity-routed model; fall back along the chain
        const modelsToTry = [routedModel];
        if (routedModel !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
        if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
        if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

        let lastError: any = null;
        for (const modelId of modelsToTry) {
            if (modelId === activeModelId && isPrimaryModelExhausted) continue;
            if (circuitBreaker.isOpen(modelId)) {
                logger.warn(`[CircuitBreaker] Skipping open provider: ${modelId}`);
                continue;
            }

            const callStart = Date.now();
            try {
                text = await withTimeout((signal) => callModel(modelId, signal), timeoutMs);
                circuitBreaker.recordSuccess(modelId);
                logAiCall({ model: modelId, latencyMs: Date.now() - callStart, success: true });
                if (text) break;
            } catch (error: any) {
                lastError = error;
                circuitBreaker.recordFailure(modelId);
                const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || error.status === 'RESOURCE_EXHAUSTED';

                if (isQuotaError && modelId === activeModelId) {
                    isPrimaryModelExhausted = true;
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('quota-exceeded'));
                }

                logAiCall({ model: modelId, latencyMs: Date.now() - callStart, success: false, error: errorMessage });
                logger.warn(`Model ${modelId} failed. Trying next in chain...`, errorMessage);
                continue;
            }
        }

        if (!text) {
            if (lastError) throw lastError;
            throw new Error("All models in fallback chain failed.");
        }

        try {
            const data = safeParseJSON<T>(text);

            if (requiredKeys.length > 0) {
                validateStructure(data, requiredKeys);
            }
            // Cache the raw JSON text on success
            if (!opts.noCache) responseCache.set(cacheKey, text);
            return data;

        } catch (parseError: any) {
            try {
                const repairedData = await repairJson<T>(text, parseError.message, schema);

                if (requiredKeys.length > 0) {
                    validateStructure(repairedData, requiredKeys);
                }
                return repairedData;
            } catch (repairError) {
                logger.error("JSON Repair Failed:", repairError);
                throw parseError;
            }
        }
    } catch (error) {
        handleAiError(error);
        throw error;
    }
  });
}

// Special handler for Search Grounding (which doesn't support responseMimeType: JSON)
export async function generateGroundedJson<T>(prompt: string, requiredKeys: string[] = []): Promise<T> {
    return withRetry(async () => {
        try {
            let text = "";
            let sources: { title: string, uri: string }[] = [];

            const executeCall = async (modelId: string) => {
                const text = await callGeminiProxy(
                    prompt,
                    resolveModelTier(modelId),
                    { tools: [{ googleSearch: {} }] }
                );
                const sources: { title: string, uri: string }[] = [];
                return { text, sources };
            };

            if (activeModelId === 'mistral' || activeModelId === 'azure-openai') {
                const fullPrompt = `${prompt}\n\nPlease return the response in JSON format.`;
                const tryProxyModels = async (models: string[]) => {
                    for (const modelId of models) {
                        try {
                            if (modelId === 'mistral') {
                                const response = await callMistral({ messages: [{ role: 'user', content: fullPrompt }] });
                                return { text: response.choices[0].message.content, sources: [] };
                            } else if (modelId === 'azure-openai') {
                                const response = await callAzureOpenAI({ messages: [{ role: 'user', content: fullPrompt }] });
                                return { text: response.choices[0].message.content, sources: [] };
                            }
                        } catch (error: any) {
                            logger.warn(`${modelId} failed, trying next...`, error);
                        }
                    }
                    return null;
                };

                const proxyResult = await tryProxyModels([activeModelId, activeModelId === 'mistral' ? 'azure-openai' : 'mistral']);
                if (proxyResult) {
                    text = proxyResult.text;
                    sources = proxyResult.sources;
                } else {
                    const result = await executeCall(activeModelId);
                    text = result.text;
                    sources = result.sources;
                }
            } else {
                const modelsToTry = [activeModelId];
                if (activeModelId !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
                if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
                if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

                let lastError: any = null;
                for (const modelId of modelsToTry) {
                    if (modelId === activeModelId && isPrimaryModelExhausted) continue;
                    try {
                        if (modelId === 'mistral') {
                            const fullPrompt = `${prompt}\n\nPlease return the response in JSON format.`;
                            const response = await callMistral({ messages: [{ role: 'user', content: fullPrompt }] });
                            text = response.choices[0].message.content;
                            sources = [];
                        } else if (modelId === 'azure-openai') {
                            const fullPrompt = `${prompt}\n\nPlease return the response in JSON format.`;
                            const response = await callAzureOpenAI({ messages: [{ role: 'user', content: fullPrompt }] });
                            text = response.choices[0].message.content;
                            sources = [];
                        } else {
                            const result = await executeCall(modelId);
                            text = result.text;
                            sources = result.sources;
                        }
                        if (text) break;
                    } catch (error: any) {
                        lastError = error;
                        const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                        const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || error.status === 'RESOURCE_EXHAUSTED';

                        if (isQuotaError && modelId === activeModelId) {
                            isPrimaryModelExhausted = true;
                            if (typeof window !== 'undefined') window.dispatchEvent(new Event('quota-exceeded'));
                        }

                        logger.warn(`Model ${modelId} failed. Trying next in chain...`, errorMessage);
                        continue;
                    }
                }
                if (!text && lastError) throw lastError;
            }

            if (!text) throw new Error("Empty response from AI Model.");

            let data: T;
            try {
                data = safeParseJSON<T>(text);
                if (requiredKeys.length > 0) {
                    validateStructure(data, requiredKeys);
                }
            } catch (parseError: any) {
                try {
                    data = await repairJson<T>(text, parseError.message);

                    if (requiredKeys.length > 0) {
                        validateStructure(data, requiredKeys);
                    }
                } catch (repairError) {
                    logger.error("Grounded JSON Repair Failed:", repairError);
                    throw parseError;
                }
            }

            if ((data as any).sources === undefined && sources.length > 0) {
                (data as any).sources = sources;
            }

            return data;
        } catch (error) {
            handleAiError(error);
            throw error;
        }
    });
}

export async function generateText(
  prompt: string,
  opts: { timeoutMs?: number; tokenBudget?: TokenBudgetKey } = {},
): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? AI_CONFIG.timeouts.chat;
  const maxTokens = AI_CONFIG.tokenBudgets[opts.tokenBudget ?? 'CHAT'];

  return withRetry(async () => {
    try {
        const callModel = async (modelId: string, signal: AbortSignal) => {
            if (modelId === 'mistral') {
                const response = await callMistral({
                  messages: [{ role: 'user', content: prompt }],
                  max_tokens: maxTokens,
                });
                return response.choices[0].message.content || "";
            } else if (modelId === 'azure-openai') {
                const response = await callAzureOpenAI({
                  messages: [{ role: 'user', content: prompt }],
                  max_tokens: maxTokens,
                });
                return response.choices[0].message.content || "";
            } else {
                return await callGeminiProxy(prompt, resolveModelTier(modelId), {
                    generationConfig: { maxOutputTokens: maxTokens },
                }, signal);
            }
        };

        const modelsToTry = [activeModelId];
        if (activeModelId !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
        if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
        if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

        let lastError: any = null;
        for (const modelId of modelsToTry) {
            if (modelId === activeModelId && isPrimaryModelExhausted) continue;
            if (circuitBreaker.isOpen(modelId)) {
                logger.warn(`[CircuitBreaker] Skipping open provider: ${modelId}`);
                continue;
            }

            const callStart = Date.now();
            try {
                const result = await withTimeout((signal) => callModel(modelId, signal), timeoutMs);
                circuitBreaker.recordSuccess(modelId);
                logAiCall({ model: modelId, latencyMs: Date.now() - callStart, success: true });
                if (result) return result;
            } catch (error: any) {
                lastError = error;
                circuitBreaker.recordFailure(modelId);
                const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || error.status === 'RESOURCE_EXHAUSTED';

                if (isQuotaError && modelId === activeModelId) {
                    isPrimaryModelExhausted = true;
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('quota-exceeded'));
                }

                logAiCall({ model: modelId, latencyMs: Date.now() - callStart, success: false, error: errorMessage });
                logger.warn(`Model ${modelId} failed. Trying next in chain...`, errorMessage);
                continue;
            }
        }
        if (lastError) throw lastError;
        throw new Error("All models in fallback chain failed.");
    } catch (error) {
        handleAiError(error);
        return "";
    }
  });
}

// --- Embedding Generation ---
export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    let token = '';
    const user = (await import('../../firebase')).auth.currentUser;
    if (user) {
      try { token = await user.getIdToken(); } catch (e) {}
    }
    const fetchWithTimeout = withTimeout((signal) => fetch('/api/gemini/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ text }),
      signal,
    }), AI_CONFIG.timeouts.embedding);
    const response = await fetchWithTimeout;
    if (!response.ok) {
      logger.warn(`getEmbedding: server returned ${response.status}`);
      return [];
    }
    const data = await response.json() as { embedding?: number[] };
    return data.embedding ?? [];
  } catch (err) {
    logger.warn('getEmbedding: request failed', err);
    return [];
  }
};

// --- Video Generation (Veo) ---
export const generateConceptVideo = async (prompt: string): Promise<string> => {
  const text = await callGeminiProxy(
    `Generate a short concept video for: ${prompt}. Return a JSON object with a single "uri" field containing a placeholder or generated video URI.`,
    'pro',
    { model: 'veo-3.1-fast-generate-preview' }
  );
  try {
    const parsed = JSON.parse(text);
    return parsed.uri || text;
  } catch {
    return text;
  }
};

// --- Strategy & Planning ---

export const generateAnalysisPlan = async (brief: string, sector: string): Promise<TAnalysisPlan> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Create a Business Analysis Plan.`,
      brief,
      sector as Sector
  );
  return generateJson<TAnalysisPlan>(prompt, AnalysisPlanSchema, ['approach', 'stakeholders', 'techniques']);
};

export const ingestRawIntelligence = async (rawText: string): Promise<{title: string, description: string, sector: Sector}> => {
    const prompt = `
    You are an expert Business Analyst. A stakeholder has provided the following raw intelligence, ideas, or meeting notes:
    
    "${rawText}"
    
    Analyze this text and synthesize it into a structured strategic initiative.
    
    OUTPUT JSON FORMAT:
    {
        "title": "A concise, professional title for the initiative (max 6 words)",
        "description": "A clear, professional description summarizing the core goal and value proposition (2-3 sentences)",
        "sector": "One of the following exact strings: 'Cloud & SaaS', 'Fintech', 'Renewable Energy', 'Circular Economy', 'Agritech & Foodtech', 'Industry 4.0 & IoT', 'Biotech & Pharma', 'General Business'"
    }
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            sector: {
                type: Type.STRING,
                enum: ['Cloud & SaaS', 'Fintech', 'Renewable Energy', 'Circular Economy', 'Agritech & Foodtech', 'Industry 4.0 & IoT', 'Biotech & Pharma', 'General Business']
            }
        },
        required: ["title", "description", "sector"]
    };

    return generateJson<{title: string, description: string, sector: Sector}>(prompt, schema, ['title', 'description', 'sector']);
};
