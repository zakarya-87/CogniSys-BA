/**
 * Express app factory — creates and returns the app with all middleware and
 * API routes registered, but WITHOUT Vite/static serving or app.listen().
 * Import this in tests to get a fully wired app without starting a server.
 */
import express, { Router } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './logger';
import { authorize } from './middleware/rbac';
import { correlationId } from './middleware/correlationId';
import { safeError, safeErrorHtml } from './utils/errorHandler';
import { ModelRouter, ModelType } from './ai-agents/ModelRouter';
import { createOperation, getOperation, subscribe, updateOperation } from './operationStore';
import { OrganizationController } from './controllers/OrganizationController';
import { ProjectController } from './controllers/ProjectController';
import { InitiativeController } from './controllers/InitiativeController';
import { AIController } from './controllers/AIController';
import { ServerMemoryService } from './services/MemoryService';
import { AuthService } from './services/AuthService';
import { getAdminAuth } from './lib/firebaseAdmin';
import { getAllFlags } from './featureFlags';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi';

export function createApp() {
  const app = express();
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://www.gstatic.com',
          'https://apis.google.com',
          ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleapis.com', 'https://*.firebaseapp.com', 'https://*.web.app'],
        connectSrc: [
          "'self'",
          'https://*.googleapis.com',
          'https://*.firebaseio.com',
          'https://*.cloudfunctions.net',
          ...(isDev ? ['ws://localhost:*', 'wss://localhost:*'] : []),
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(isDev ? {} : { upgradeInsecureRequests: [] }),
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
  }));

  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:5173',
    /\.run\.app$/,
    /\.firebaseapp\.com$/,
    /\.web\.app$/,
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some(o =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );
      allowed ? callback(null, true) : callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }));

  app.use(cookieParser());
  app.use(correlationId);
  app.use(pinoHttp({
    logger,
    customProps: (req) => ({ correlationId: req.headers['x-correlation-id'] }),
    autoLogging: { ignore: (req) => req.url === '/api/health' },
  }));
  app.use(express.json());

  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests, please try again later.' } });
  const aiLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,  standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'AI request limit reached, please try again later.' } });
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many auth requests, please try again later.' } });

  // Health (keep legacy /api/health for backward compat)
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // ── /api/v1 Router ────────────────────────────────────────────────────────
  // All resource routes live here. /api/* aliases below keep backward compat.
  const v1 = Router();

  v1.get('/health', (_req, res) => res.json({ status: 'ok', version: 'v1' }));
  v1.get('/feature-flags', (_req, res) => res.json(getAllFlags()));

  // Swagger UI — dev mode only
  if (isDev) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'CogniSys BA API Docs',
      swaggerOptions: { persistAuthorization: true },
    }));
    app.get('/api/docs.json', (_req, res) => res.json(openApiSpec));
  }

  // Organizations
  v1.post('/organizations', apiLimiter, authorize('member'), OrganizationController.create);
  v1.get('/organizations/:orgId', apiLimiter, authorize('viewer'), OrganizationController.get);

  // Projects
  v1.post('/organizations/:orgId/projects', apiLimiter, authorize('member'), ProjectController.create);
  v1.get('/organizations/:orgId/projects', apiLimiter, authorize('viewer'), ProjectController.list);

  // Initiatives
  v1.post('/organizations/:orgId/projects/:projectId/initiatives', apiLimiter, authorize('member'), InitiativeController.create);
  v1.get('/organizations/:orgId/initiatives', apiLimiter, authorize('viewer'), InitiativeController.listByOrg);
  v1.get('/organizations/:orgId/projects/:projectId/initiatives', apiLimiter, authorize('viewer'), InitiativeController.listByProject);
  v1.put('/organizations/:orgId/projects/:projectId/initiatives/:initiativeId', apiLimiter, authorize('member'), InitiativeController.update);

  // AI Operations
  v1.post('/organizations/:orgId/initiatives/:initiativeId/wbs', aiLimiter, authorize('member'), AIController.triggerWBS);
  v1.post('/organizations/:orgId/initiatives/:initiativeId/risks', aiLimiter, authorize('member'), AIController.triggerRiskAssessment);

  // Vector Memory
  v1.post('/organizations/:orgId/memory', apiLimiter, authorize('member'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const { content, vector, type, metadata } = req.body as {
        content?: string;
        vector?: number[];
        type?: 'fact' | 'decision' | 'insight';
        metadata?: Record<string, unknown>;
      };
      if (!content || typeof content !== 'string') return res.status(400).json({ error: 'content is required' });
      if (!vector || !Array.isArray(vector) || vector.length === 0) return res.status(400).json({ error: 'vector (number[]) is required' });
      if (!type || !['fact', 'decision', 'insight'].includes(type)) return res.status(400).json({ error: 'type must be fact | decision | insight' });
      const memory = await ServerMemoryService.addMemory(orgId, content, vector, type, metadata);
      res.status(201).json({ memory });
    } catch (error) {
      safeError(res, error, 'Memory Store');
    }
  });

  v1.post('/organizations/:orgId/memory/search', apiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const { vector, limit } = req.body as { vector?: number[]; limit?: number };
      if (!vector || !Array.isArray(vector) || vector.length === 0) return res.status(400).json({ error: 'vector (number[]) is required' });
      const results = await ServerMemoryService.search(orgId, vector, limit ?? 5);
      res.json({ results });
    } catch (error) {
      safeError(res, error, 'Memory Search');
    }
  });

  // Mount versioned router
  app.use('/api/v1', v1);

  // Backward-compat aliases — /api/* proxies to /api/v1/*
  app.use('/api', (req, res, next) => {
    // Only proxy unmatched /api/* routes that aren't auth/health/ai/github/mistral/azure
    if (
      req.path.startsWith('/organizations') ||
      req.path.startsWith('/v1')
    ) {
      req.url = req.url; // already handled above or will 404 via catch-all
    }
    next();
  });
  app.use('/api', v1);

  // ── Firebase Auth Session ────────────────────────────────────────────────────
  // Verifies a Firebase ID token (GitHub or Google) and sets a server-side
  // httpOnly session cookie. Client calls this after signInWithPopup succeeds.
  app.post('/api/auth/firebase-session', authLimiter, async (req, res) => {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'idToken is required' });
    }
    try {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(idToken);
      res.cookie('auth_session', decoded.uid, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({
        status: 'authenticated',
        uid: decoded.uid,
        name: decoded.name ?? null,
        email: decoded.email ?? null,
        picture: decoded.picture ?? null,
        provider: decoded.firebase?.sign_in_provider ?? 'unknown',
      });
    } catch (err) {
      logger.error({ err }, 'Firebase token verification failed');
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const session = req.cookies.auth_session;
    if (!session) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ status: 'authenticated' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_session', { secure: true, sameSite: 'none', httpOnly: true });
    res.json({ status: 'logged_out' });
  });

  // Claims refresh — call after org creation/join so new claims are reflected immediately.
  // Forces a token refresh by revoking the current refresh token.
  app.post('/api/auth/claims/refresh', authLimiter, async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      await AuthService.revokeRefreshTokens(decoded.uid);
      res.json({ status: 'refreshed', message: 'Sign out and sign in again to receive updated claims.' });
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // Legacy GitHub OAuth routes — kept for backward compatibility during migration
  const PORT = process.env.PORT || 5000;
  app.get('/api/auth/url', authLimiter, (req, res) => {
    const origin = req.headers.origin || req.headers.referer || `http://localhost:${PORT}`;
    const baseUrl = new URL(origin as string).origin;
    const redirectUri = `${baseUrl}/auth/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
  });

  app.get(['/auth/callback', '/auth/callback/'], authLimiter, async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');
    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
      });
      const tokenData = await tokenResponse.json() as { error?: string; error_description?: string; access_token?: string };
      if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
      const accessToken = tokenData.access_token;

      const userResponse = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}` } });
      const userData = await userResponse.json() as { id?: number; name?: string; login?: string; avatar_url?: string };

      res.cookie('auth_session', accessToken, { secure: true, sameSite: 'none', httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

      const safeId = String(userData.id ?? '');
      const safeName = (userData.name || userData.login || '').replace(/"/g, '&quot;');
      const safeAvatar = String(userData.avatar_url ?? '').replace(/"/g, '&quot;');

      res.send(`<!DOCTYPE html><html><body>
        <div id="oauth-data" data-status="success" data-user-id="${safeId}" data-user-name="${safeName}" data-user-avatar="${safeAvatar}"></div>
        <p>Authentication successful. This window should close automatically.</p>
        <script src="/auth-callback.js"></script>
      </body></html>`);
    } catch (error) {
      safeErrorHtml(res, error, 'OAuth Callback');
    }
  });

  // GitHub API Proxy — uses user's OAuth access token from auth_session cookie
  // Routes: /api/github/repos, /api/github/commits/:owner/:repo, /api/github/repos/:owner/:repo
  const ghHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  });

  app.get('/api/github/repos', authLimiter, async (req, res) => {
    const token = req.cookies.auth_session;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=pushed&per_page=30', {
        headers: ghHeaders(token),
      });
      if (!response.ok) {
        logger.warn({ status: response.status }, 'GitHub repos API error');
        return res.status(response.status).json({ error: 'GitHub API error' });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      safeError(res, error, 'GitHub Repos Proxy');
    }
  });

  app.get('/api/github/commits/:owner/:repo', authLimiter, async (req, res) => {
    const token = req.cookies.auth_session;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const { owner, repo } = req.params;
    const perPage = Math.min(Number(req.query.per_page) || 20, 100);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=${perPage}`,
        { headers: ghHeaders(token) }
      );
      if (!response.ok) {
        logger.warn({ status: response.status, owner, repo }, 'GitHub commits API error');
        return res.status(response.status).json({ error: 'GitHub API error' });
      }
      const raw = await response.json() as Array<{
        sha: string;
        html_url: string;
        commit: { message: string; author: { email: string; date: string } };
        author: { login: string } | null;
      }>;
      // Normalise to TGitCommit shape
      const commits = raw.map(c => ({
        id: c.sha.slice(0, 7),
        sha: c.sha,
        message: c.commit.message.split('\n')[0], // first line only
        author: c.author?.login ?? c.commit.author.email,
        date: c.commit.author.date.slice(0, 10),
        url: c.html_url,
      }));
      res.json(commits);
    } catch (error) {
      safeError(res, error, 'GitHub Commits Proxy');
    }
  });

  app.get('/api/github/repos/:owner/:repo', authLimiter, async (req, res) => {
    const token = req.cookies.auth_session;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const { owner, repo } = req.params;
    try {
      const response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
        { headers: ghHeaders(token) }
      );
      if (!response.ok) {
        return res.status(response.status).json({ error: 'GitHub API error' });
      }
      res.json(await response.json());
    } catch (error) {
      safeError(res, error, 'GitHub Repo Proxy');
    }
  });

  // Gemini AI Proxy
  app.post('/api/gemini/generate', aiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const { prompt, model, config } = req.body as { prompt: string; model?: 'flash' | 'pro'; config?: Record<string, unknown> };
      if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt is required and must be a string' });
      const modelType = model === 'pro' ? ModelType.REASONING : ModelType.SPEED;
      const router = new ModelRouter();
      let text: string;
      if (config?.inlineImage) {
        text = await router.generateContentWithImage(prompt, modelType, config.inlineImage as { mimeType: string; data: string });
      } else if (config?.tools) {
        text = await router.generateContentWithConfig(prompt, modelType, config);
      } else {
        text = await router.generateContent(prompt, modelType);
      }
      res.json({ text });
    } catch (error) {
      logger.error({ err: error }, 'Gemini Proxy Error');
      res.status(500).json({ error: 'AI generation failed. Please try again.' });
    }
  });

  // Mistral Proxy
  app.post('/api/mistral/chat', async (req, res) => {
    try {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'MISTRAL_API_KEY is not configured' });
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      if (!response.ok) {
        logger.error({ status: response.status, body: JSON.stringify(data) }, 'Mistral API error');
        return res.status(502).json({ error: 'Upstream AI service error' });
      }
      res.json(data);
    } catch (error) {
      safeError(res, error, 'Mistral Proxy');
    }
  });

  // Azure OpenAI Proxy
  app.post('/api/azure-openai/chat', async (req, res) => {
    try {
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
      if (!apiKey || !endpoint || !deploymentName) {
        return res.status(500).json({ error: 'Azure OpenAI configuration is missing.' });
      }
      const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      if (!response.ok) {
        logger.error({ status: response.status, body: JSON.stringify(data) }, 'Azure OpenAI API error');
        return res.status(502).json({ error: 'Upstream AI service error' });
      }
      res.json(data);
    } catch (error) {
      safeError(res, error, 'Azure OpenAI Proxy');
    }
  });

  // --- Gemini Embedding Proxy ---
  // Unblocks vector memory (Phase 2). Uses text-embedding-004 model.
  app.post('/api/gemini/embed', aiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const { text } = req.body as { text?: string };
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'text is required and must be a string' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        logger.error({ status: response.status, body: JSON.stringify(errData) }, 'Gemini Embed API error');
        return res.status(502).json({ error: 'Embedding service error' });
      }

      const data = await response.json() as { embedding?: { values?: number[] } };
      const embedding = data?.embedding?.values ?? [];
      res.json({ embedding });
    } catch (error) {
      safeError(res, error, 'Gemini Embed Proxy');
    }
  });

  // --- Async AI Generation with SSE progress ---
  // POST /api/gemini/generate/stream  → 202 { operationId }
  // Caller then opens GET /api/ai/stream/:operationId to receive SSE events.
  app.post('/api/gemini/generate/stream', aiLimiter, authorize('viewer'), (req, res) => {
    const { prompt, model, config } = req.body as { prompt: string; model?: 'flash' | 'pro'; config?: Record<string, unknown> };
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required and must be a string' });
    }

    const operationId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    createOperation(operationId);
    updateOperation(operationId, { status: 'running' });

    // Fire-and-forget background generation
    (async () => {
      try {
        const modelType = model === 'pro' ? ModelType.REASONING : ModelType.SPEED;
        const router = new ModelRouter();
        let text: string;
        if (config?.inlineImage) {
          text = await router.generateContentWithImage(prompt, modelType, config.inlineImage as { mimeType: string; data: string });
        } else if (config?.tools) {
          text = await router.generateContentWithConfig(prompt, modelType, config);
        } else {
          text = await router.generateContent(prompt, modelType);
        }
        updateOperation(operationId, { status: 'complete', result: text });
      } catch (err) {
        logger.error({ err }, 'Async Gemini generation failed');
        updateOperation(operationId, { status: 'error', error: 'AI generation failed. Please try again.' });
      }
    })();

    res.status(202).json({ operationId });
  });

  // GET /api/ai/stream/:operationId  → SSE stream
  // Emits: progress | complete | error events, then closes.
  app.get('/api/ai/stream/:operationId', authorize('viewer'), (req, res) => {
    const { operationId } = req.params;
    const op = getOperation(operationId);
    if (!op) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: string, data: string) => {
      res.write(`event: ${event}\ndata: ${data}\n\n`);
      if (event === 'complete' || event === 'error') {
        res.end();
      }
    };

    // If already done, reply immediately
    if (op.status === 'complete') {
      send('complete', JSON.stringify({ text: op.result ?? '' }));
      return;
    }
    if (op.status === 'error') {
      send('error', JSON.stringify({ error: op.error ?? 'Unknown error' }));
      return;
    }

    // Subscribe to future updates
    const unsub = subscribe(operationId, send);
    req.on('close', unsub);
  });

  // JSON 404 for unknown /api/* routes — must come before SPA catch-all
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}
