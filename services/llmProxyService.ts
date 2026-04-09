/**
 * Service to interact with the backend proxies for Mistral, Azure OpenAI, and OpenAI.
 * These functions call the local /api routes which securely hold the API keys.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Call the Mistral API via the backend proxy.
 * Supports all Mistral models: mistral-large-latest, mistral-medium-latest,
 * mistral-small-latest, codestral-latest.
 */
export async function callMistral(request: ChatCompletionRequest) {
  const response = await fetch('/api/mistral/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || 'mistral-large-latest',
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `Mistral API error: ${response.status}`;
    try {
      const data = JSON.parse(text);
      errorMsg = data.error || errorMsg;
    } catch (e) {
      errorMsg = `${errorMsg} - ${text.slice(0, 100)}...`;
    }
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Call the Azure OpenAI API via the backend proxy.
 * Uses the deployment configured in AZURE_OPENAI_DEPLOYMENT_NAME env var.
 */
export async function callAzureOpenAI(request: ChatCompletionRequest) {
  const response = await fetch('/api/azure-openai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `Azure OpenAI API error: ${response.status}`;
    try {
      const data = JSON.parse(text);
      errorMsg = data.error || errorMsg;
    } catch (e) {
      errorMsg = `${errorMsg} - ${text.slice(0, 100)}...`;
    }
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Unified LLM caller — routes to the correct provider based on model ID.
 * Supports Gemini model IDs (routed client-side), Mistral model IDs, and Azure OpenAI.
 * Use this when you want to call a specific model by ID from a component.
 */
export async function callLLM(request: ChatCompletionRequest): Promise<string> {
  const modelId = request.model || 'mistral-large-latest';

  // Mistral model IDs
  const mistralModels = ['mistral', 'mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'codestral-latest'];
  if (mistralModels.includes(modelId) || modelId === 'mistral') {
    const response = await callMistral({ ...request, model: modelId === 'mistral' ? 'mistral-large-latest' : modelId });
    return response.choices[0]?.message?.content || '';
  }

  // Azure OpenAI model IDs
  const azureModels = ['azure-openai', 'azure-gpt-4o', 'azure-gpt-4-turbo'];
  if (azureModels.includes(modelId)) {
    const response = await callAzureOpenAI(request);
    return response.choices[0]?.message?.content || '';
  }

  throw new Error(`Model "${modelId}" is not a proxy-routable model. Use geminiService for Gemini models.`);
}

