/**
 * AI Usage & Pricing Types
 */

export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface Pricing {
  inputPer1k: number;
  outputPer1k: number;
}

export const PRICING_TABLE: Record<string, Pricing> = {
  // Gemini 1.5 Flash
  'gemini-1.5-flash': { inputPer1k: 0.000075, outputPer1k: 0.0003 },
  'flash':            { inputPer1k: 0.000075, outputPer1k: 0.0003 },
  
  // Gemini 1.5 Pro
  'gemini-1.5-pro':   { inputPer1k: 0.00125,  outputPer1k: 0.005 },
  'pro':               { inputPer1k: 0.00125,  outputPer1k: 0.005 },

  // Mistral Large
  'mistral-large-latest': { inputPer1k: 0.002, outputPer1k: 0.006 },
  'mistral':              { inputPer1k: 0.002, outputPer1k: 0.006 },

  // Azure OpenAI (GPT-4o standard rates)
  'azure-gpt-4o':     { inputPer1k: 0.005, outputPer1k: 0.015 },
  'azure-openai':     { inputPer1k: 0.005, outputPer1k: 0.015 },
};

export function estimateCost(model: string, usage: UsageMetrics): number {
  const rates = PRICING_TABLE[model] || PRICING_TABLE['flash'];
  const inputCost = (usage.promptTokens / 1000) * rates.inputPer1k;
  const outputCost = (usage.completionTokens / 1000) * rates.outputPer1k;
  return inputCost + outputCost;
}
