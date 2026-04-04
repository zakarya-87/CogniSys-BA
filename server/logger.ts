import pino from 'pino';
import { getTraceContext } from './tracer';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  /**
   * Inject OTel traceId + spanId into every log record for trace-log correlation.
   * Fields are empty strings when no active span exists (no overhead when OTel is off).
   */
  mixin() {
    return getTraceContext();
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.secret',
      'GEMINI_API_KEY',
      'GITHUB_CLIENT_SECRET',
    ],
    censor: '[REDACTED]',
  },
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

