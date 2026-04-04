import * as Sentry from '@sentry/react';

/**
 * Initialise Sentry for the React client bundle.
 * Only activates when VITE_SENTRY_DSN is set; silent no-op otherwise.
 * Call this ONCE before ReactDOM.createRoot().
 */
export function initClientSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'development' | 'production'
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Capture 5% of sessions for Session Replay
    replaysSessionSampleRate: 0.05,
    // Capture 100% of sessions where an error occurred
    replaysOnErrorSampleRate: 1.0,
    // Drop all events in development so local noise doesn't pollute Sentry
    beforeSend(event) {
      if (import.meta.env.DEV) return null;
      return event;
    },
  });
}

export { Sentry };
