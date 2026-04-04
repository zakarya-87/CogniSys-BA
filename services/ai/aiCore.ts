import { callGeminiProxy, resolveModelTier } from '../geminiProxy';
import { PromptFactory } from '../promptFactory';
import { withRetry, safeParseJSON, validateStructure } from '../../utils/aiUtils';
import { callMistral, callAzureOpenAI } from '../llmProxyService';
import { TAnalysisPlan, Sector } from '../../types';
import _generatedSchemas from '../../generated_schemas.json';

// Logger shim — replace with your actual logger if available
const logger = {
  log: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

// Local Type constants — mirrors @google/genai Type enum values used in schemas.
export const Type = {
  ARRAY: 'ARRAY', OBJECT: 'OBJECT', STRING: 'STRING',
  NUMBER: 'NUMBER', BOOLEAN: 'BOOLEAN', INTEGER: 'INTEGER',
} as const;

// Cast to a permissive shape so .required access doesn't error
type JsonSchema = { required?: string[]; [key: string]: unknown };
export const generatedSchemas = _generatedSchemas as Record<string, JsonSchema>;

// Default model tier — 'flash' is fast/cheap; 'pro' for complex reasoning tasks
let activeModelId = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash';

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
        if (modelId === 'gemini-3-flash-preview' && isPrimaryModelExhausted) continue;
        try {
            const fixedText = await executeRepair(modelId);
            if (fixedText) return safeParseJSON<T>(fixedText, undefined, true);
        } catch (e: any) {
            lastError = e;
            const errorMessage = e.message || "";
            if (errorMessage.includes('429') || errorMessage.includes('Quota')) {
                if (modelId === 'gemini-3-flash-preview') {
                    isPrimaryModelExhausted = true;
                    window.dispatchEvent(new Event('quota-exceeded'));
                }
            }
            logger.warn(`Repair attempt with ${modelId} failed. Trying next...`, errorMessage);
        }
    }

    throw lastError || new Error("Failed to repair JSON data.");
}

// --- Core AI Caller ---

export async function generateJson<T>(prompt: string, schema?: any, requiredKeys: string[] = []): Promise<T> {
  return withRetry(async () => {
    try {
        let text = "";

        const fullPrompt = schema ? `${prompt}\n\nPlease return the response in JSON format matching this schema:\n${JSON.stringify(schema)}` : prompt;

        const callModel = async (modelId: string) => {
            if (modelId === 'mistral') {
                const response = await callMistral({
                    messages: [{ role: 'user', content: fullPrompt }],
                });
                return response.choices[0].message.content;
            } else if (modelId === 'azure-openai') {
                const response = await callAzureOpenAI({
                    messages: [{ role: 'user', content: fullPrompt }],
                });
                return response.choices[0].message.content;
            } else {
                return await callGeminiProxy(fullPrompt, resolveModelTier(modelId));
            }
        };

        const modelsToTry = [activeModelId];
        if (activeModelId !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
        if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
        if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

        let lastError: any = null;
        for (const modelId of modelsToTry) {
            if (modelId === 'gemini-3-flash-preview' && isPrimaryModelExhausted) continue;

            try {
                text = await callModel(modelId);
                if (text) break;
            } catch (error: any) {
                lastError = error;
                const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || error.status === 'RESOURCE_EXHAUSTED';

                if (isQuotaError && modelId === 'gemini-3-flash-preview') {
                    isPrimaryModelExhausted = true;
                    window.dispatchEvent(new Event('quota-exceeded'));
                }

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
                    const result = await executeCall('gemini-3-flash-preview');
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
                    if (modelId === 'gemini-3-flash-preview' && isPrimaryModelExhausted) continue;
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

                        if (isQuotaError && modelId === 'gemini-3-flash-preview') {
                            isPrimaryModelExhausted = true;
                            window.dispatchEvent(new Event('quota-exceeded'));
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

export async function generateText(prompt: string): Promise<string> {
  return withRetry(async () => {
    try {
        const callModel = async (modelId: string) => {
            if (modelId === 'mistral') {
                const response = await callMistral({ messages: [{ role: 'user', content: prompt }] });
                return response.choices[0].message.content || "";
            } else if (modelId === 'azure-openai') {
                const response = await callAzureOpenAI({ messages: [{ role: 'user', content: prompt }] });
                return response.choices[0].message.content || "";
            } else {
                return await callGeminiProxy(prompt, resolveModelTier(modelId));
            }
        };

        const modelsToTry = [activeModelId];
        if (activeModelId !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
        if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
        if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

        let lastError: any = null;
        for (const modelId of modelsToTry) {
            if (modelId === 'gemini-3-flash-preview' && isPrimaryModelExhausted) continue;
            try {
                const result = await callModel(modelId);
                if (result) return result;
            } catch (error: any) {
                lastError = error;
                const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || error.status === 'RESOURCE_EXHAUSTED';

                if (isQuotaError && modelId === 'gemini-3-flash-preview') {
                    isPrimaryModelExhausted = true;
                    window.dispatchEvent(new Event('quota-exceeded'));
                }

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
    const response = await fetch('/api/gemini/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
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
