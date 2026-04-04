/**
 * k6/api.js — Core API endpoints load test
 *
 * SLO targets:
 *   p95 latency < 200ms  (non-AI API calls)
 *   error rate  < 1%
 *
 * Run:
 *   k6 run k6/api.js
 *   k6 run --env BASE_URL=https://your-app.run.app k6/api.js
 *
 * Auth note: most endpoints require auth_session cookie.
 * Set AUTH_COOKIE env var to run authenticated scenarios:
 *   k6 run --env AUTH_COOKIE=<firebase-uid> k6/api.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const apiLatency = new Trend('api_latency', true);

const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:5000';
const AUTH_COOKIE = __ENV.AUTH_COOKIE || '';

const authHeaders = AUTH_COOKIE
  ? { Cookie: `auth_session=${AUTH_COOKIE}` }
  : {};

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp up
    { duration: '2m',  target: 50 },  // sustained load
    { duration: '30s', target: 100 }, // spike
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // p95 < 200ms
    error_rate:        ['rate<0.01'],  // < 1% errors
    http_req_failed:   ['rate<0.01'],
  },
};

export default function () {
  group('Health endpoints', () => {
    const health = http.get(`${BASE_URL}/api/health`);
    check(health, { 'health 200': (r) => r.status === 200 });
    apiLatency.add(health.timings.duration);

    const v1Health = http.get(`${BASE_URL}/api/v1/health`);
    check(v1Health, {
      'v1 health 200': (r) => r.status === 200,
      'v1 health has version': (r) => r.json('version') === 'v1',
    });
  });

  group('Feature flags', () => {
    const flags = http.get(`${BASE_URL}/api/v1/feature-flags`);
    const ok = check(flags, {
      'flags 200': (r) => r.status === 200,
      'flags is object': (r) => typeof r.json() === 'object',
    });
    errorRate.add(!ok);
    apiLatency.add(flags.timings.duration);
  });

  group('Auth endpoints', () => {
    // Unauthenticated check — must return 401 not 500
    const me = http.get(`${BASE_URL}/api/auth/me`);
    check(me, { 'auth/me returns 401 or 200': (r) => [200, 401].includes(r.status) });

    // Firebase session with missing token — must return 400
    const session = http.post(
      `${BASE_URL}/api/auth/firebase-session`,
      JSON.stringify({}),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(session, { 'firebase-session 400 on missing token': (r) => r.status === 400 });
  });

  group('Protected routes return 401 without auth', () => {
    const endpoints = [
      '/api/gemini/generate',
      '/api/gemini/embed',
      '/api/mistral/chat',
      '/api/github/repos',
    ];

    for (const path of endpoints) {
      const res = path.includes('generate') || path.includes('embed') || path.includes('chat')
        ? http.post(`${BASE_URL}${path}`, JSON.stringify({ prompt: 'test' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        : http.get(`${BASE_URL}${path}`);

      check(res, { [`${path} → 401`]: (r) => r.status === 401 });
      errorRate.add(res.status === 500); // 500s are real errors
    }
  });

  sleep(1);
}
