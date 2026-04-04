/**
 * k6/health.js — Health endpoint load test
 *
 * SLO targets:
 *   p95 latency < 50ms   (health is trivial — should be very fast)
 *   error rate  < 0.1%
 *
 * Run:
 *   k6 run k6/health.js
 *   k6 run --env BASE_URL=https://your-app.run.app k6/health.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const p95Latency = new Trend('p95_latency', true);

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // ramp up to 20 VUs
    { duration: '1m',  target: 20 },  // hold
    { duration: '15s', target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<50'],   // p95 < 50ms
    error_rate:        ['rate<0.001'], // < 0.1% errors
    http_req_failed:   ['rate<0.001'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);

  const ok = check(res, {
    'status 200':          (r) => r.status === 200,
    'body has status ok':  (r) => r.json('status') === 'ok',
    'response time < 50ms': (r) => r.timings.duration < 50,
  });

  errorRate.add(!ok);
  p95Latency.add(res.timings.duration);

  sleep(0.5);
}
