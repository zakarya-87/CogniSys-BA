// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';

// Mock Firebase Admin before any imports that trigger it
vi.mock('./lib/firebaseAdmin', () => ({
  getAdminDb: vi.fn(),
  getAdminAuth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockRejectedValue(new Error('Token verification failed')),
  })),
}));

// Mock controllers and services to avoid Firestore calls in tests
vi.mock('./controllers/OrganizationController', () => ({
  OrganizationController: {
    create: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
    get: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
  },
}));

vi.mock('./controllers/ProjectController', () => ({
  ProjectController: {
    create: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
    list: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
  },
}));

vi.mock('./controllers/InitiativeController', () => ({
  InitiativeController: {
    create: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
    listByOrg: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
    listByProject: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
    update: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
  },
}));

vi.mock('./controllers/AIController', () => ({
  AIController: {
    triggerWBS: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
    triggerRiskAssessment: vi.fn((_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
      res.status(501).json({ error: 'Not implemented in tests' })
    ),
  },
}));

vi.mock('./ai-agents/ModelRouter', () => ({
  ModelRouter: vi.fn().mockImplementation(() => ({
    generateContent: vi.fn().mockResolvedValue('mock response'),
    generateContentWithImage: vi.fn().mockResolvedValue('mock response'),
    generateContentWithConfig: vi.fn().mockResolvedValue('mock response'),
  })),
  ModelType: { SPEED: 'speed', REASONING: 'reasoning' },
}));

import { createApp } from './app';

describe('API Server', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  // ── Health ────────────────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    it('returns 200 with { status: ok }', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('includes X-Correlation-ID header on every response', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-correlation-id']).toBeDefined();
      expect(typeof res.headers['x-correlation-id']).toBe('string');
      expect(res.headers['x-correlation-id'].length).toBeGreaterThan(0);
    });

    it('echoes back a provided X-Correlation-ID', async () => {
      const id = 'test-correlation-id-123';
      const res = await request(app).get('/api/health').set('X-Correlation-ID', id);
      expect(res.headers['x-correlation-id']).toBe(id);
    });
  });

  // ── Unknown /api/* routes ──────────────────────────────────────────────────
  describe('Unknown /api/* routes', () => {
    it('returns 404 JSON (not HTML) for unknown GET /api route', async () => {
      const res = await request(app).get('/api/unknown-route-xyz');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 404 JSON for unknown POST /api route', async () => {
      const res = await request(app).post('/api/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('returns 404 JSON for /api/gemini/embed (stub — not yet implemented)', async () => {
      const res = await request(app).post('/api/gemini/embed').send({ text: 'hello' });
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  // ── Security headers ──────────────────────────────────────────────────────
  describe('Security headers (helmet)', () => {
    it('sets X-Content-Type-Options: nosniff', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('sets X-Frame-Options: DENY', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('sets Content-Security-Policy header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

  // ── Auth — /api/auth/url ───────────────────────────────────────────────────
  describe('GET /api/auth/url', () => {
    it('returns 200 with a GitHub OAuth URL', async () => {
      const res = await request(app)
        .get('/api/auth/url')
        .set('Origin', 'http://localhost:5000');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('url');
      expect(res.body.url).toContain('https://github.com/login/oauth/authorize');
    });

    it('OAuth URL includes required scope and redirect_uri params', async () => {
      const res = await request(app)
        .get('/api/auth/url')
        .set('Origin', 'http://localhost:5000');
      const url = new URL(res.body.url);
      expect(url.searchParams.get('scope')).toContain('read:user');
      expect(url.searchParams.get('redirect_uri')).toContain('/auth/callback');
    });
  });

  // ── Auth — /api/auth/me ────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('returns 401 when no auth_session cookie is set', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 200 when auth_session cookie is present', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'auth_session=some-valid-token');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'authenticated' });
    });
  });

  // ── Auth — /api/auth/logout ────────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('returns 200 with logged_out status', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'logged_out' });
    });

    it('clears the auth_session cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
      expect(cookieStr).toContain('auth_session=');
      expect(cookieStr).toMatch(/Expires=.*1970|Max-Age=0/i);
    });
  });

  // ── RBAC — Protected routes return 401 without auth ───────────────────────
  describe('RBAC — protected routes reject unauthenticated requests', () => {
    it('GET /api/organizations/:id returns 401 without Authorization header', async () => {
      const res = await request(app).get('/api/organizations/org-123');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('POST /api/gemini/generate returns 401 without Authorization header', async () => {
      const res = await request(app)
        .post('/api/gemini/generate')
        .send({ prompt: 'hello' });
      expect(res.status).toBe(401);
    });

    it('GET /api/organizations/:orgId/projects returns 401 without auth', async () => {
      const res = await request(app).get('/api/organizations/org-123/projects');
      expect(res.status).toBe(401);
    });

    it('Invalid Bearer token returns 401', async () => {
      const res = await request(app)
        .get('/api/organizations/org-123')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });

  // ── AI proxies — unconfigured keys ────────────────────────────────────────
  describe('AI proxy routes — missing API keys', () => {
    it('POST /api/mistral/chat returns 500 when MISTRAL_API_KEY is not set', async () => {
      const originalKey = process.env.MISTRAL_API_KEY;
      delete process.env.MISTRAL_API_KEY;
      const res = await request(app).post('/api/mistral/chat').send({ messages: [] });
      process.env.MISTRAL_API_KEY = originalKey;
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('MISTRAL_API_KEY');
    });

    it('POST /api/azure-openai/chat returns 500 when Azure config is missing', async () => {
      const res = await request(app).post('/api/azure-openai/chat').send({ messages: [] });
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Azure OpenAI');
    });
  });

  // ── /auth/callback — missing code ─────────────────────────────────────────
  describe('GET /auth/callback', () => {
    it('returns 400 when no code query param is provided', async () => {
      const res = await request(app).get('/auth/callback');
      expect(res.status).toBe(400);
    });
  });
});
