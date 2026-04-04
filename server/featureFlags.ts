/**
 * server/featureFlags.ts
 *
 * Environment-driven feature flag system.
 *
 * Flags are read from environment variables with the prefix FEATURE_FLAG_.
 * Example: FEATURE_FLAG_AI_STREAMING=true enables the 'ai_streaming' flag.
 *
 * Defaults are defined here so the system works without any env configuration.
 * Override any flag by setting the env var before starting the server.
 *
 * Usage (server-side):
 *   import { isEnabled } from './featureFlags';
 *   if (isEnabled('ai_streaming')) { ... }
 *
 * Usage (via API):
 *   GET /api/v1/feature-flags  → returns all public flags as JSON
 */

export type FlagName =
  | 'ai_streaming'       // SSE-based real-time AI progress
  | 'vector_memory'      // Firestore vector memory search
  | 'github_api'         // Real GitHub API proxy (vs mock)
  | 'google_auth'        // Google sign-in button in sidebar
  | 'otel_tracing'       // OpenTelemetry trace export
  | 'predictive_core'    // PredictiveCoreView (Monte Carlo / Tornado)
  | 'war_room'           // WarRoomView (agent debate engine)
  | 'construct_view';    // ConstructView (code generation IDE)

/** Default values — safe for production without any env config */
const DEFAULTS: Record<FlagName, boolean> = {
  ai_streaming:    true,
  vector_memory:   true,
  github_api:      true,
  google_auth:     true,
  otel_tracing:    false, // requires OTLP endpoint — off by default
  predictive_core: true,
  war_room:        true,
  construct_view:  true,
};

/**
 * Read a flag value from environment.
 * Env var name: FEATURE_FLAG_<UPPERCASE_NAME>
 * Values: 'true' | '1' → true; 'false' | '0' | absent → default
 */
function readEnv(name: FlagName): boolean {
  const envKey = `FEATURE_FLAG_${name.toUpperCase()}`;
  const val = process.env[envKey];
  if (val === undefined || val === '') return DEFAULTS[name];
  return val === 'true' || val === '1';
}

/** Resolved flag map — computed once at startup */
const FLAGS: Record<FlagName, boolean> = Object.fromEntries(
  (Object.keys(DEFAULTS) as FlagName[]).map((name) => [name, readEnv(name)])
) as Record<FlagName, boolean>;

/** Check whether a feature flag is enabled */
export function isEnabled(name: FlagName): boolean {
  return FLAGS[name] ?? false;
}

/** Return all flags as a plain object (for the API response) */
export function getAllFlags(): Record<FlagName, boolean> {
  return { ...FLAGS };
}
