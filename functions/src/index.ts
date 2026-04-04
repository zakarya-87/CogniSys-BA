import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from '../../server/app';

// Create the Express app once (reused across warm invocations)
const app = createApp();

/**
 * Firebase Cloud Function — HTTP handler for all /api/* routes.
 * Firebase Hosting rewrites /api/** to this function.
 * Memory and timeout match the Cloud Run settings in deploy.yml.
 */
export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    minInstances: 0,
    maxInstances: 10,
    concurrency: 80,
  },
  app,
);
