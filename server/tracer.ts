/**
 * Application-level tracer utility.
 *
 * Wraps OpenTelemetry's trace API to provide:
 *  - Typed span attribute helpers
 *  - `withSpan()` — run async work inside a named span
 *  - `getTraceContext()` — extract traceId/spanId for log correlation
 */
import { trace, context, SpanStatusCode, SpanKind, Attributes } from '@opentelemetry/api';

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'cognisys-ba';

export const tracer = trace.getTracer(SERVICE_NAME, process.env.npm_package_version ?? '0.0.0');

/**
 * Execute `fn` inside a named OTel span.
 * On error the span is marked as ERROR and the exception is re-thrown.
 *
 * @example
 * const result = await withSpan('initiative.generateWBS', { initiativeId, orgId }, async () => {
 *   return aiService.generateWBS(initiative);
 * });
 */
export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { kind: SpanKind.INTERNAL, attributes }, async span => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
      span.recordException(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Extract the current trace context for injecting into log records.
 * Returns `{ traceId, spanId }` from the active span, or empty strings
 * when tracing is disabled or no span is active.
 */
export function getTraceContext(): { traceId: string; spanId: string } {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) return { traceId: '', spanId: '' };
  const ctx = activeSpan.spanContext();
  return { traceId: ctx.traceId, spanId: ctx.spanId };
}
