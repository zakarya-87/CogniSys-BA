/**
 * k6/ai.js — AI endpoint load test
 *
 * SLO targets (async AI tasks via SSE):
 *   p95 initial response  < 500ms  (202 Accepted — not generation time)
 *   error rate            < 2%
 *
 * These routes require authentication. Pass a valid Firebase UID:
 *   k6 run --env AUTH_COOKIE=<uid> --env ORG_ID=<orgId> k6/ai.js
 *
 * Without AUTH_COOKIE: verifies auth guards return 401 under load.
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate    = new Rate('error_rate');
const aiAcceptTime = new Trend('ai_accept_time_ms', true);

const BASE_URL    = __ENV.BASE_URL    || 'http://localhost:5000';
const AUTH_COOKIE = __ENV.AUTH_COOKIE || '';
const ORG_ID      = __ENV.ORG_ID      || 'test-org';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_COOKIE ? { Cookie: `auth_session=${AUTH_COOKIE}` } : {}),
};

export const options = {
  stages: [
    { duration: '20s', target: 5  }, // ramp — AI calls are expensive
    { duration: '1m',  target: 10 }, // sustained
    { duration: '20s', target: 0  }, // ramp down
  ],
  thresholds: {
    // Initial 202 response (not full generation) must be fast
    http_req_duration: ['p(95)<500'],
    error_rate:        ['rate<0.02'],  // < 2% errors (AI endpoints are best-effort)
    http_req_failed:   ['rate<0.02'],
  },
};

export default function () {
  if (!AUTH_COOKIE) {
    // Auth guard test — no credentials
    group('AI routes return 401 without auth (no AUTH_COOKIE set)', () => {
      const gen = http.post(`${BASE_URL}/api/gemini/generate`,
        JSON.stringify({ prompt: 'test' }), { headers });
      check(gen, { 'gemini/generate → 401': (r) => r.status === 401 });

      const embed = http.post(`${BASE_URL}/api/gemini/embed`,
        JSON.stringify({ text: 'test' }), { headers });
      check(embed, { 'gemini/embed → 401': (r) => r.status === 401 });
    });
  } else {
    // Authenticated load test
    group('AI generation (authenticated)', () => {
      const res = http.post(
        `${BASE_URL}/api/gemini/generate/stream`,
        JSON.stringify({
          prompt: 'Generate a one-sentence summary of business analysis.',
          orgId: ORG_ID,
        }),
        { headers }
      );

      const ok = check(res, {
        'stream accepted 202':    (r) => r.status === 202,
        'returns operationId':    (r) => !!r.json('operationId'),
        'accepted time < 500ms':  (r) => r.timings.duration < 500,
      });

      errorRate.add(!ok);
      aiAcceptTime.add(res.timings.duration);
    });
  }

  sleep(2); // AI endpoints need breathing room
}
