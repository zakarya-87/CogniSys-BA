import * as Sentry from '@sentry/node';

/**
 * Initialise Sentry for the Node/Express server.
 * Only activates when SENTRY_DSN env var is set; silent no-op otherwise.
 * Must be called as early as possible in server.ts — before createApp().
 */
export function initServerSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    // Capture 10% of requests for performance monitoring
    tracesSampleRate: 0.1,
    // Attach user context to error reports
    sendDefaultPii: false,
  });
}

export { Sentry };
