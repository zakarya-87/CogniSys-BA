
/**
 * aiStreamService.ts
 * 
 * Consumes the /api/gemini/stream SSE endpoint to provide 
 * real-time streaming capabilities to the UI.
 */

import { auth } from './firebase';

export interface StreamCallbacks {
    onChunk: (text: string) => void;
    onDone: (fullText: string) => void;
    onError: (error: string) => void;
}

export const aiStreamService = {
    /**
     * Streams content from Gemini.
     * Since we use POST for the stream, we use fetch() with a body.
     */
    async streamText(prompt: string, model: 'flash' | 'pro' = 'flash', callbacks: StreamCallbacks): Promise<void> {
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : null;

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/gemini/stream', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ prompt, model })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Streaming failed' }));
                callbacks.onError(errorData.error || `Error ${response.status}`);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                callbacks.onError('Response body is null');
                return;
            }

            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                
                // SSE format is "data: {...}\n\n"
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last partial line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;
                    
                    const dataStr = trimmed.slice(6);
                    if (dataStr === '[DONE]') {
                        callbacks.onDone(fullText);
                        return;
                    }

                    try {
                        const data = JSON.parse(dataStr);
                        if (data.error) {
                            callbacks.onError(data.error);
                            return;
                        }
                        if (data.text) {
                            fullText += data.text;
                            callbacks.onChunk(data.text);
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE chunk', e);
                    }
                }
            }
        } catch (error: any) {
            callbacks.onError(error.message || 'Network error during streaming');
        }
    }
};
