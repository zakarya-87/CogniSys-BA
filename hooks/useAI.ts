import { useState, useCallback, useRef } from 'react';
import * as strategy from '../services/ai/strategyService';
import * as requirements from '../services/ai/requirementsService';
import * as diagrams from '../services/ai/diagramService';
import * as analysis from '../services/ai/analysisService';
import * as content from '../services/ai/contentService';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message || 'AI error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run, strategy, requirements, diagrams, analysis, content };
}
