# k6 Load Tests

Load test scripts for CogniSys BA using [k6](https://k6.io).

## SLO Targets

| Endpoint type | p95 latency | Error rate |
|--------------|-------------|------------|
| Health       | < 50ms      | < 0.1%     |
| API (non-AI) | < 200ms     | < 1%       |
| AI initial response (202) | < 500ms | < 2% |

## Scripts

| Script | Tests | VUs |
|--------|-------|-----|
| `health.js` | `/api/health` | 0→20→0 over 1m45s |
| `api.js`    | All non-AI endpoints, auth guards | 0→50→100→0 over 3m30s |
| `ai.js`     | AI generation endpoints | 0→10→0 over 1m40s |

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Windows (scoop)
scoop install k6

# Linux
sudo snap install k6
```

## Running

```bash
# Health endpoint (no server needed except localhost)
k6 run k6/health.js

# All API endpoints
k6 run k6/api.js

# Against a remote server
k6 run --env BASE_URL=https://your-app.run.app k6/api.js

# AI endpoints (requires auth)
k6 run --env BASE_URL=https://your-app.run.app \
       --env AUTH_COOKIE=<firebase-uid> \
       --env ORG_ID=<your-org-id> \
       k6/ai.js

# Generate HTML report
k6 run --out json=k6/results.json k6/api.js
```

## CI Integration

In CI, run against a live staging URL before promoting to production:

```yaml
- name: Load test (staging)
  run: |
    k6 run --env BASE_URL=${{ secrets.STAGING_URL }} k6/health.js
    k6 run --env BASE_URL=${{ secrets.STAGING_URL }} k6/api.js
```

Add `k6/results.json` to `.gitignore` (already done).
