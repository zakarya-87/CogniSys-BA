import { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';

export type AIStreamStatus = 'idle' | 'pending' | 'running' | 'complete' | 'error';

export interface AIStreamState {
  status: AIStreamStatus;
  result: string | null;
  error: string | null;
}

/**
 * Sends an async AI generation request and streams the result via SSE.
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/gemini/generate/stream', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
      const errorMsg = errData.error ?? 'Request failed';
      setState({ status: 'error', result: null, error: errorMsg });
      throw new Error(errorMsg);
    }

    const { operationId, sseToken } = await res.json() as { operationId: string; sseToken?: string };
    setState(prev => ({ ...prev, status: 'running' }));

    // 2. Open SSE connection to receive progress/complete/error events
    return new Promise((resolve, reject) => {
      // Use the short-lived, single-use sseToken instead of the Firebase ID token
      // to avoid exposing long-lived credentials in URL query params.
      const tokenParam = sseToken
        ? `?sseToken=${encodeURIComponent(sseToken)}`
        : token ? `?token=${encodeURIComponent(token)}` : '';
      const url = `/api/ai/stream/${operationId}${tokenParam}`;
      const es = new EventSource(url, { withCredentials: true });
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
