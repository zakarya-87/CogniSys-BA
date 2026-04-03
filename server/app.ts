/**
 * Express app factory — creates and returns the app with all middleware and
 * API routes registered, but WITHOUT Vite/static serving or app.listen().
 * Import this in tests to get a fully wired app without starting a server.
 */
import express from 'express';
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
import { OrganizationController } from './controllers/OrganizationController';
import { ProjectController } from './controllers/ProjectController';
import { InitiativeController } from './controllers/InitiativeController';
import { AIController } from './controllers/AIController';
import { ServerMemoryService } from './services/MemoryService';

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

  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Organizations
  app.post('/api/organizations', apiLimiter, OrganizationController.create);
  app.get('/api/organizations/:orgId', apiLimiter, authorize('viewer'), OrganizationController.get);

  // Projects
  app.post('/api/organizations/:orgId/projects', apiLimiter, authorize('member'), ProjectController.create);
  app.get('/api/organizations/:orgId/projects', apiLimiter, authorize('viewer'), ProjectController.list);

  // Initiatives
  app.post('/api/organizations/:orgId/projects/:projectId/initiatives', apiLimiter, authorize('member'), InitiativeController.create);
  app.get('/api/organizations/:orgId/initiatives', apiLimiter, authorize('viewer'), InitiativeController.listByOrg);
  app.get('/api/organizations/:orgId/projects/:projectId/initiatives', apiLimiter, authorize('viewer'), InitiativeController.listByProject);
  app.put('/api/organizations/:orgId/projects/:projectId/initiatives/:initiativeId', apiLimiter, authorize('member'), InitiativeController.update);

  // AI Operations
  app.post('/api/organizations/:orgId/initiatives/:initiativeId/wbs', aiLimiter, authorize('member'), AIController.triggerWBS);
  app.post('/api/organizations/:orgId/initiatives/:initiativeId/risks', aiLimiter, authorize('member'), AIController.triggerRiskAssessment);

  // Vector Memory — multi-tenant Firestore-backed semantic memory
  // POST /api/organizations/:orgId/memory        → store a memory (content + embedding)
  // POST /api/organizations/:orgId/memory/search → semantic search by query vector
  app.post('/api/organizations/:orgId/memory', apiLimiter, authorize('member'), async (req, res) => {
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

  app.post('/api/organizations/:orgId/memory/search', apiLimiter, authorize('viewer'), async (req, res) => {
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

  // GitHub OAuth
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

  app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.auth_session;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ status: 'authenticated' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_session', { secure: true, sameSite: 'none', httpOnly: true });
    res.json({ status: 'logged_out' });
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

  // JSON 404 for unknown /api/* routes — must come before SPA catch-all
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}
