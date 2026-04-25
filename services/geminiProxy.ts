/**
 * geminiProxy.ts
 *
 * SECURITY: The GEMINI_API_KEY must never exist in the client bundle.
 * This module replaces all direct GoogleGenAI client-side calls with fetch()
 * calls to the server-side proxy at POST /api/gemini/generate.
 *
 * Drop-in interface — all existing callers in geminiService.ts and other
 * services remain unchanged. Only the transport layer changes.
 */

import { auth } from './firebase';

const PROXY_URL = '/api/gemini/generate';

export interface GeminiProxyConfig {
  tools?: Record<string, unknown>[];
  [key: string]: unknown;
}

/**
 * Send a prompt to Gemini via the server-side proxy.
 * @param prompt  The full prompt string
 * @param model   'flash' (default, fast/cheap) | 'pro' (reasoning, complex tasks)
 * @param config  Optional extended config (e.g. { tools: [{ googleSearch: {} }] })
 * @returns       The generated text response
 */
export async function callGeminiProxy(
  prompt: string,
  model: 'flash' | 'pro' = 'flash',
  config?: GeminiProxyConfig,
  signal?: AbortSignal
): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  // Attach Bearer token if user is signed in
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers,
    credentials: 'include', // Still send cookies for supplementary auth if needed
    body: JSON.stringify({ prompt, model, config }),
    signal,
  });

  if (!response.ok) {
    let errorMessage = `Gemini proxy error: ${response.status}`;
    try {
      const body = await response.json() as { error?: string };
      if (body.error) errorMessage = body.error;
    } catch {
      // ignore parse error, use status code message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json() as { 
    text: string; 
    usage: { promptTokens: number; completionTokens: number; totalTokens: number } 
  };
  return { 
    text: data.text ?? '', 
    usage: data.usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 } 
  };
}

/**
 * Convenience wrapper that maps the legacy model ID strings used throughout
 * geminiService.ts to 'flash' | 'pro' for the proxy.
 */
export function resolveModelTier(modelId: string): 'flash' | 'pro' {
  if (
    modelId.includes('pro') ||
    modelId.includes('reasoning') ||
    modelId.includes('3.0') ||
    modelId.includes('3.1-pro')
  ) {
    return 'pro';
  }
  return 'flash';
}
