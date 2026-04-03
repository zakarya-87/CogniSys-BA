import { useState, useEffect, useRef } from 'react';

export type AIStreamStatus = 'idle' | 'pending' | 'running' | 'complete' | 'error';

export interface AIStreamState {
  status: AIStreamStatus;
  result: string | null;
  error: string | null;
}

/**
 * Sends an async AI generation request and streams the result via SSE.
 *
 * Usage:
 *   const { stream, state } = useAIStream();
 *   await stream({ prompt: '...', model: 'flash' });
 *   // state.status tracks: idle → pending → running → complete | error
 *   // state.result contains the final text when complete
 */
export function useAIStream() {
  const [state, setState] = useState<AIStreamState>({ status: 'idle', result: null, error: null });
  const esRef = useRef<EventSource | null>(null);

  // Cleanup EventSource on unmount
  useEffect(() => () => { esRef.current?.close(); }, []);

  const stream = async (
    body: { prompt: string; model?: 'flash' | 'pro'; config?: Record<string, unknown> }
  ): Promise<string> => {
    // Close any previous stream
    esRef.current?.close();
    setState({ status: 'pending', result: null, error: null });

    // 1. Kick off async generation — get operationId
    const res = await fetch('/api/gemini/generate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
      const errorMsg = errData.error ?? 'Request failed';
      setState({ status: 'error', result: null, error: errorMsg });
      throw new Error(errorMsg);
    }

    const { operationId } = await res.json() as { operationId: string };
    setState(prev => ({ ...prev, status: 'running' }));

    // 2. Open SSE connection to receive progress/complete/error events
    return new Promise((resolve, reject) => {
      const es = new EventSource(`/api/ai/stream/${operationId}`, { withCredentials: true });
      esRef.current = es;

      es.addEventListener('progress', () => {
        setState(prev => ({ ...prev, status: 'running' }));
      });

      es.addEventListener('complete', (e: MessageEvent) => {
        es.close();
        const data = JSON.parse(e.data) as { text: string };
        setState({ status: 'complete', result: data.text, error: null });
        resolve(data.text);
      });

      es.addEventListener('error', (e: MessageEvent) => {
        es.close();
        const errMsg = e.data
          ? (JSON.parse(e.data) as { error: string }).error
          : 'Stream error';
        setState({ status: 'error', result: null, error: errMsg });
        reject(new Error(errMsg));
      });

      es.onerror = () => {
        es.close();
        const msg = 'SSE connection failed';
        setState({ status: 'error', result: null, error: msg });
        reject(new Error(msg));
      };
    });
  };

  const reset = () => {
    esRef.current?.close();
    setState({ status: 'idle', result: null, error: null });
  };

  return { stream, state, reset };
}
