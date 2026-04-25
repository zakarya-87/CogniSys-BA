import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "../../services/ai/aiConfig";
import { UsageMetrics } from "../types/Usage";

export enum ModelType {
  REASONING   = AI_CONFIG.models.reasoning,
  SPEED       = AI_CONFIG.models.primary,
  MISTRAL     = 'mistral',
  AZURE       = 'azure-openai',
}

export class ModelRouter {
  private _ai: GoogleGenAI | null = null;

  private getAi(): GoogleGenAI {
    if (!this._ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY must be set when using the Gemini API.");
      }
      this._ai = new GoogleGenAI({ apiKey });
    }
    return this._ai;
  }

  async generateContent(prompt: string, type: ModelType = ModelType.SPEED): Promise<{ text: string; usage: UsageMetrics }> {
    switch (type) {
      case ModelType.MISTRAL:
        return this.callMistral(prompt);
      case ModelType.AZURE:
        return this.callAzure(prompt);
      default:
        return this.callGemini(prompt, type);
    }
  }

  async generateContentWithImage(prompt: string, type: ModelType = ModelType.SPEED, image: { mimeType: string; data: string }): Promise<{ text: string; usage: UsageMetrics }> {
    const response = await this.getAi().models.generateContent({
      model: type === ModelType.REASONING ? type : ModelType.SPEED,
      contents: {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: image.mimeType, data: image.data } }
        ]
      } as any,
    });

    const usage: UsageMetrics = {
      promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
    };

    return { text: response.text ?? '', usage };
  }

  async generateContentWithConfig(prompt: string, type: ModelType = ModelType.SPEED, config: Record<string, unknown>): Promise<{ text: string; usage: UsageMetrics }> {
    // Only Gemini supports extended config (e.g. Google Search Grounding tools)
    if (type === ModelType.MISTRAL) return this.callMistral(prompt);
    if (type === ModelType.AZURE) return this.callAzure(prompt);
    
    const response = await this.getAi().models.generateContent({
      model: type,
      contents: prompt,
      ...config,
    });

    const usage: UsageMetrics = {
      promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
    };

    return { text: response.text ?? '', usage };
  }

  private async callGemini(prompt: string, model: string): Promise<{ text: string; usage: UsageMetrics }> {
    const response = await this.getAi().models.generateContent({
      model,
      contents: prompt,
    });

    const usage: UsageMetrics = {
      promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
    };

    return { text: response.text ?? '', usage };
  }

  private async callMistral(prompt: string): Promise<{ text: string; usage: UsageMetrics }> {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured.");

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mistral API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json() as { 
      choices: { message: { content: string } }[],
      usage?: { prompt_tokens: number, completion_tokens: number, total_tokens: number }
    };

    const usage: UsageMetrics = {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    };

    return { text: data.choices[0]?.message?.content ?? '', usage };
  }

  private async callAzure(prompt: string): Promise<{ text: string; usage: UsageMetrics }> {
    const apiKey        = process.env.AZURE_OPENAI_API_KEY;
    const endpoint      = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    if (!apiKey || !endpoint || !deploymentName) {
      const missing = [
        !apiKey         && 'AZURE_OPENAI_API_KEY',
        !endpoint       && 'AZURE_OPENAI_ENDPOINT',
        !deploymentName && 'AZURE_OPENAI_DEPLOYMENT_NAME',
      ].filter(Boolean).join(', ');
      throw new Error(`Azure OpenAI is not configured. Missing: ${missing}`);
    }

    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Azure OpenAI error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json() as { 
      choices: { message: { content: string } }[],
      usage?: { prompt_tokens: number, completion_tokens: number, total_tokens: number }
    };

    const usage: UsageMetrics = {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    };

    return { text: data.choices[0]?.message?.content ?? '', usage };
  }
}

