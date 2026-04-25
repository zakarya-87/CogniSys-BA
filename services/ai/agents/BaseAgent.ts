
import { callGeminiProxy, resolveModelTier } from '../geminiProxy';
import { THiveMessage, THiveAgent, IAgent, IAgentResponse, TInitiative } from '../../types';
import { withRetry } from '../../utils/aiUtils';
import { AI_CONFIG } from '../ai/aiConfig';

const MODEL = AI_CONFIG.models.primary;
const FALLBACK_MODEL = AI_CONFIG.models.fallback;
let isPrimaryModelExhausted = false;

export abstract class BaseAgent implements IAgent {
    abstract name: THiveAgent;
    protected systemPrompt: string;

    constructor(systemPrompt: string) {
        this.systemPrompt = systemPrompt;
    }

    protected buildContext(history: THiveMessage[], instructions: string, initiative?: TInitiative): string {
         let context = `
${this.systemPrompt}

=== CURRENT INSTRUCTIONS ===
${instructions}

=== CONVERSATION HISTORY ===
${history.map(m => `${m.agent || 'User'}: ${m.content}`).join('\n')}
`;
        if (initiative) {
            context += `\n=== PROJECT CONTEXT ===\nTitle: ${initiative.title}\nSector: ${initiative.sector}\nDescription: ${initiative.description}`;
        }
        return context;
    }

    abstract execute(context: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse>;

    async *executeStream(context: THiveMessage[], instructions: string, initiative?: TInitiative): AsyncGenerator<string, IAgentResponse, unknown> {
        const prompt = this.buildContext(context, instructions, initiative);
        let fullContent = '';
        
        for await (const chunk of this.callLLMStream(prompt)) {
            fullContent += chunk;
            yield chunk;
        }

        // Final structured parse
        const defaultUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        try {
            const { safeParseJSON } = await import('../../utils/aiUtils');
            const json = safeParseJSON<any>(fullContent);
            return {
                content: json.content || fullContent,
                thought: json.thought,
                nextAction: json.action || 'reply',
                targetAgent: json.target,
                instructions: json.instructions,
                metadata: json.metadata,
                usage: defaultUsage
            };
        } catch {
            return {
                content: fullContent,
                nextAction: 'reply',
                usage: defaultUsage
            };
        }
    }

    async executeTool(toolName: string, args: any, initiative?: TInitiative): Promise<any> {
        return Promise.resolve({});
    }

    protected async *callLLMStream(prompt: string): AsyncGenerator<string, void, unknown> {
        const { aiStreamService } = await import('../aiStreamService');
        
        let chunkQueue: string[] = [];
        let isDone = false;
        let error: string | null = null;

        aiStreamService.streamText(prompt, resolveModelTier(MODEL), {
            onChunk: (text) => chunkQueue.push(text),
            onDone: () => { isDone = true },
            onError: (err) => { error = err; isDone = true; }
        });

        while (!isDone || chunkQueue.length > 0) {
            if (error) throw new Error(error);
            if (chunkQueue.length > 0) {
                yield chunkQueue.shift()!;
            } else {
                await new Promise(r => setTimeout(r, 50));
            }
        }
    }

    protected async callLLM(prompt: string, tools?: any[]): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {

        return withRetry(async () => {
            const isSearchTool = tools?.some(t => t.googleSearch);
            const shouldEnforceJson = !isSearchTool;

            const executeCall = async (modelId: string) => {
                if (modelId === 'mistral') {
                    const { callMistral } = await import('../llmProxyService');
                    const response = await callMistral({
                        messages: [{ role: 'user', content: prompt }],
                    });
                    return { 
                        text: response.choices[0].message.content, 
                        usage: response.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 } 
                    };
                } else if (modelId === 'azure-openai') {
                    const { callAzureOpenAI } = await import('../llmProxyService');
                    const response = await callAzureOpenAI({
                        messages: [{ role: 'user', content: prompt }],
                    });
                    return { 
                        text: response.choices[0].message.content, 
                        usage: response.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 } 
                    };
                } else {
                    const proxyConfig = tools ? { tools } : undefined;
                    const result = await callGeminiProxy(prompt, resolveModelTier(modelId), proxyConfig);
                    return { 
                        text: result.text || '{}', 
                        usage: result.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 } 
                    };
                }
            };

            const modelsToTry = [MODEL];
            if ((MODEL as string) !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
            if (!isSearchTool) {
                modelsToTry.push('mistral');
                modelsToTry.push('azure-openai');
            }

            let lastError: any = null;
            for (const modelId of modelsToTry) {
                if (modelId === MODEL && isPrimaryModelExhausted) continue;

                try {
                    return await executeCall(modelId);
                } catch (error: any) {
                    lastError = error;
                    const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                    const errorStatus = error.status || error.error?.status;

                    if (errorMessage.includes('429') || errorMessage.includes('Quota') || errorStatus === 'RESOURCE_EXHAUSTED') {
                        if (modelId === MODEL) isPrimaryModelExhausted = true;
                        console.warn(`[${this.name}] Model ${modelId} failed (Quota). Trying next...`);
                        continue;
                    }

                    const isNetworkOrServerError = errorMessage.includes('500') || errorMessage.includes('Rpc') || errorStatus === 500 || errorStatus === 'UNKNOWN';

                    if (shouldEnforceJson && isNetworkOrServerError && (modelId === MODEL || modelId === FALLBACK_MODEL)) {
                        console.warn(`[${this.name}] JSON mode failed with RPC error on ${modelId}. Retrying with text mode...`);
                        try {
                            const result = await callGeminiProxy(prompt, resolveModelTier(modelId), tools ? { tools } : undefined);
                            return { 
                                text: result.text || "{}", 
                                usage: result.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 } 
                            };
                        } catch (retryError) {
                            continue;
                        }
                    }
                    throw error;
                }
            }
            if (lastError) throw lastError;
            throw new Error("All models in agent fallback chain failed.");
        });
    }
}
