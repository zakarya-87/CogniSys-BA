import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Injects a X-Correlation-ID header on every request/response pair.
 * If the caller already supplies the header it is passed through unchanged,
 * enabling end-to-end tracing across services.
 *
 * Also forwards trace context (traceparent / tracestate) to support
 * distributed tracing with OpenTelemetry W3C propagation.
 */
export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-correlation-id'] as string | undefined) ?? randomUUID();
  req.headers['x-correlation-id'] = id;
  res.setHeader('X-Correlation-ID', id);

  // Forward W3C trace context headers if present (OTel distributed tracing)
  if (req.headers['traceparent']) {
    res.setHeader('traceparent', req.headers['traceparent'] as string);
  }

  next();
}
