
import { TUsage } from '../types';

export const COST_CONFIG: Record<string, { input: number; output: number }> = {
    'gemini-1.5-flash': { input: 0.1, output: 0.3 }, // Price per 1M tokens
    'flash': { input: 0.1, output: 0.3 },
    'gemini-1.5-pro': { input: 1.25, output: 5.0 },
    'pro': { input: 1.25, output: 5.0 },
    'mistral-large-latest': { input: 2.0, output: 6.0 },
    'mistral': { input: 2.0, output: 6.0 },
    'azure-openai': { input: 2.5, output: 10.0 },
    'gpt-4o': { input: 2.5, output: 10.0 },
    'default': { input: 0.5, output: 1.5 }
};

export const TelemetryService = {
    /**
     * Calculates the estimated USD cost for an LLM call.
     */
    calculateCost(modelId: string, usage: TUsage): number {
        const config = COST_CONFIG[modelId] || COST_CONFIG['default'];
        const inputCost = (usage.promptTokens / 1_000_000) * config.input;
        const outputCost = (usage.completionTokens / 1_000_000) * config.output;
        return Number((inputCost + outputCost).toFixed(6));
    },

    /**
     * Accumulates token usage across multiple steps.
     */
    accumulateUsage(current: TUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, additional: TUsage): TUsage {
        return {
            promptTokens: current.promptTokens + additional.promptTokens,
            completionTokens: current.completionTokens + additional.completionTokens,
            totalTokens: current.totalTokens + additional.totalTokens
        };
    }
};
