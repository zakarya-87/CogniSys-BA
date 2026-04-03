/**
 * server/featureFlags.ts
 *
 * Environment-driven feature flag system.
 * Override any flag: FEATURE_FLAG_<UPPERCASE_NAME>=true|false
 */

export type FlagName =
  | 'ai_streaming'
  | 'vector_memory'
  | 'github_api'
  | 'google_auth'
  | 'otel_tracing'
  | 'predictive_core'
  | 'war_room'
  | 'construct_view';

const DEFAULTS: Record<FlagName, boolean> = {
  ai_streaming:    true,
  vector_memory:   true,
  github_api:      true,
  google_auth:     true,
  otel_tracing:    false,
  predictive_core: true,
  war_room:        true,
  construct_view:  true,
};

function readEnv(name: FlagName): boolean {
  const val = process.env[`FEATURE_FLAG_${name.toUpperCase()}`];
  if (val === undefined || val === '') return DEFAULTS[name];
  return val === 'true' || val === '1';
}

const FLAGS: Record<FlagName, boolean> = Object.fromEntries(
  (Object.keys(DEFAULTS) as FlagName[]).map((n) => [n, readEnv(n)])
) as Record<FlagName, boolean>;

export function isEnabled(name: FlagName): boolean {
  return FLAGS[name] ?? false;
}

export function getAllFlags(): Record<FlagName, boolean> {
  return { ...FLAGS };
}
