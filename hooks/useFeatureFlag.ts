import { useState, useEffect } from 'react';

type FlagName =
  | 'ai_streaming'
  | 'vector_memory'
  | 'github_api'
  | 'google_auth'
  | 'otel_tracing'
  | 'predictive_core'
  | 'war_room'
  | 'construct_view';

type FlagMap = Partial<Record<FlagName, boolean>>;

let cachedFlags: FlagMap | null = null;
let fetchPromise: Promise<FlagMap> | null = null;

async function fetchFlags(): Promise<FlagMap> {
  if (cachedFlags) return cachedFlags;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch('/api/v1/feature-flags')
    .then((r) => (r.ok ? r.json() : {}))
    .then((data: FlagMap) => {
      cachedFlags = data;
      return data;
    })
    .catch(() => ({}));
  return fetchPromise;
}

/**
 * useFeatureFlag — React hook for reading a feature flag.
 *
 * Fetches all flags from GET /api/v1/feature-flags on first call
 * (cached in module scope — one request per page load).
 *
 * @param name  — flag name
 * @param defaultValue — shown while loading (default: false)
 *
 * @example
 *   const googleAuthEnabled = useFeatureFlag('google_auth');
 *   if (!googleAuthEnabled) return null;
 */
export function useFeatureFlag(name: FlagName, defaultValue = false): boolean {
  const [value, setValue] = useState<boolean>(defaultValue);

  useEffect(() => {
    fetchFlags().then((flags) => {
      setValue(flags[name] ?? defaultValue);
    });
  }, [name, defaultValue]);

  return value;
}

/**
 * useAllFeatureFlags — returns the full flag map.
 * Returns empty object while loading.
 */
export function useAllFeatureFlags(): FlagMap {
  const [flags, setFlags] = useState<FlagMap>({});

  useEffect(() => {
    fetchFlags().then(setFlags);
  }, []);

  return flags;
}
