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
): Promise<string> {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Send auth_session cookie
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

  const data = await response.json() as { text: string };
  return data.text ?? '';
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
