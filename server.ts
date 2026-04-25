import { config } from 'dotenv';
// Load .env.local first (takes precedence), then fall back to .env
// Must run before startTracing() so OTEL_* env vars are available
config({ path: '.env.local' });
config();

// Sentry must be initialised before any other imports for full instrumentation
import { initServerSentry } from './server/sentryInit';
initServerSentry();

// OTel tracing initialized after dotenv so OTEL_SERVICE_NAME etc. are set
import { startTracing } from './server/tracing';
startTracing();
import { createServer as createViteServer } from 'vite';
import { logger } from './server/logger';
import { createApp } from './server/app';
import { TaskWorker } from './server/services/TaskWorker';

async function startServer() {
  const app = createApp();
  const PORT = 5000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      try {
        const worker = new TaskWorker();
        worker.start();
        logger.info('TaskWorker initialized successfully.');
      } catch (error) {
        logger.error({ err: error }, 'Failed to start TaskWorker');
      }
    });

  } else {
    const path = await import('path');
    const distPath = path.join(process.cwd(), 'dist');
    const express = await import('express');
    app.use(express.default.static(distPath));
    app.get('*path', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      try {
        const worker = new TaskWorker();
        worker.start();
        logger.info('TaskWorker initialized successfully.');
      } catch (error) {
        logger.error({ err: error }, 'Failed to start TaskWorker');
      }
    });
  }
}

startServer().catch(err => {
  logger.error({ err }, 'CRITICAL: Server failed to start');
  process.exit(1);
});

