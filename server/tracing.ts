/**
 * OpenTelemetry tracing setup.
 * MUST be imported before any other application code in server.ts.
 *
 * Exports traces to:
 *  - Console (dev mode)
 *  - OTLP/HTTP endpoint (production, e.g. Google Cloud Trace via OTel collector)
 *
 * Configure via env vars:
 *  OTEL_SERVICE_NAME      — default: 'cognisys-ba'
 *  OTEL_EXPORTER_OTLP_ENDPOINT — default: http://localhost:4318
 *  OTEL_ENABLED           — set to 'false' to disable (e.g. in test)
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const isEnabled = process.env.OTEL_ENABLED !== 'false';
const isDev = process.env.NODE_ENV !== 'production';

let sdk: NodeSDK | null = null;

export function startTracing(): void {
  if (!isEnabled) return;

  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'cognisys-ba';
  const serviceVersion = process.env.npm_package_version ?? '0.0.0';

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': process.env.NODE_ENV ?? 'development',
  });

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs instrumentation to avoid excessive noise
        '@opentelemetry/instrumentation-fs': { enabled: false },
        // HTTP and Express auto-instrumentation enabled by default
      }),
    ],
  });

  sdk.start();

  if (isDev) {
    console.log(`[OTel] Tracing started — service: ${serviceName}, exporter: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'}`);
  }
}

export async function stopTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}

// Graceful shutdown
process.on('SIGTERM', () => void stopTracing());
process.on('SIGINT', () => void stopTracing());
