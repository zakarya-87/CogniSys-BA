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
import { Sentry } from './sentryInit';
import pinoHttp from 'pino-http';
import { logger } from './logger';
import { authorize, requireAuth } from './middleware/rbac';
import { correlationId } from './middleware/correlationId';
import { safeError, safeErrorHtml } from './utils/errorHandler';
import { ModelRouter, ModelType } from './ai-agents/ModelRouter';
import { createOperation, getOperation, subscribe, updateOperation } from './operationStore';
import { createSseToken, validateSseToken } from './sseTokenStore';
import { OrganizationController } from './controllers/OrganizationController';
import { ProjectController } from './controllers/ProjectController';
import { InitiativeController } from './controllers/InitiativeController';
import { ActivityController } from './controllers/ActivityController';
import { AIController } from './controllers/AIController';
import { ServerMemoryService } from './services/MemoryService';
import { AuthService } from './services/AuthService';
import { AuditLogService } from './services/AuditLogService';
import { InvitationService } from './services/InvitationService';
import { MemberService } from './services/MemberService';
import { MissionController } from './controllers/MissionController';
import { NotificationService } from './services/NotificationService';
import { UsageMeteringService } from './services/UsageMeteringService';
import { EmailService } from './services/EmailService';
import { sseManager } from './services/SseManager';
import { AnalyticsService } from './services/AnalyticsService';
import { WebhookService } from './services/WebhookService';
import { BillingService } from './services/BillingService';
import { SearchService } from './services/SearchService';
import { JobService } from './services/JobService';
import { TaskQueue } from './services/TaskQueue';
import { can } from './middleware/rbac';
import { Permission } from './middleware/permissions';
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
        imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleapis.com', 'https://*.firebaseapp.com', 'https://*.web.app', 'https://i.pravatar.cc', 'https://*.gravatar.com', 'https://lh3.googleusercontent.com'],
        connectSrc: [
          "'self'",
          'https://*.googleapis.com',
          'https://*.firebaseio.com',
          'https://*.cloudfunctions.net',
          ...(isDev ? ['ws://localhost:*', 'wss://localhost:*'] : []),
        ],
        // Firebase Auth requires iframes from firebaseapp.com and accounts.google.com
        frameSrc: ['https://*.firebaseapp.com', 'https://accounts.google.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(isDev ? {} : { upgradeInsecureRequests: [] }),
      },
    },
    crossOriginOpenerPolicy: { policy: isDev ? 'unsafe-none' : 'same-origin-allow-popups' },
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
  // Stripe webhook — must be BEFORE express.json() to get raw body for signature verification
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    if (!sig) return res.status(400).json({ error: 'Missing Stripe-Signature' });

    const event = BillingService.constructWebhookEvent(req.body as Buffer, sig);
    if (!event) return res.status(400).json({ error: 'Invalid signature or billing not configured' });

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { metadata?: { orgId?: string; plan?: string }; subscription?: string };
        const orgId = session.metadata?.orgId;
        const plan = (session.metadata?.plan ?? 'pro') as 'pro' | 'enterprise';
        if (orgId) await BillingService.syncPlan(orgId, plan, session.subscription as string, 'active');
      } else if (event.type === 'customer.subscription.updated') {
        const sub = event.data.object as unknown as { metadata?: { orgId?: string; plan?: string }; id: string; status: string; current_period_end: number };
        const orgId = sub.metadata?.orgId;
        if (orgId) {
          const plan = (sub.metadata?.plan ?? 'pro') as 'pro' | 'enterprise';
          const status = sub.status as 'active' | 'trialing' | 'past_due' | 'canceled';
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          await BillingService.syncPlan(orgId, plan, sub.id, status, periodEnd);
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object as unknown as { metadata?: { orgId?: string }; id: string };
        const orgId = sub.metadata?.orgId;
        if (orgId) await BillingService.syncPlan(orgId, 'free', sub.id, 'canceled');
      }
      res.json({ received: true });
    } catch (err) {
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.use(express.json());

  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: isDev ? 10000 : 100, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests, please try again later.' } });
  const aiLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, limit: isDev ? 1000 : 20,  standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'AI request limit reached, please try again later.' } });
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: isDev ? 1000 : 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many auth requests, please try again later.' } });

  // Health (keep legacy /api/health for backward compat)
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // ── /api/v1 Router ────────────────────────────────────────────────────────
  // All resource routes live here. /api/* aliases below keep backward compat.
  const v1 = Router();

  v1.get('/health', (_req, res) => res.json({ status: 'ok', version: 'v1' }));
  v1.get('/ping', (_req, res) => res.json({ pong: true }));
  v1.get('/feature-flags', (_req, res) => res.json(getAllFlags()));

  // Debug: Router ingress log
  v1.use((req, _res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug({ url: req.url, method: req.method }, 'API V1 Ingress');
    }
    next();
  });

  // ── Auth Section (Moved from app) ──────────────────────────────────────────
  v1.post('/auth/firebase-session', authLimiter, async (req, res) => {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'idToken is required' });
    }
    try {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(idToken);
      res.cookie('auth_session', decoded.uid, {
        httpOnly: true,
        secure: !isDev,
        sameSite: isDev ? 'lax' : 'none',
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

  v1.get('/auth/me', (req, res) => {
    const session = req.cookies.auth_session;
    if (!session) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ status: 'authenticated' });
  });

  v1.post('/auth/logout', (req, res) => {
    res.clearCookie('auth_session', { secure: !isDev, sameSite: isDev ? 'lax' : 'none', httpOnly: true });
    res.json({ status: 'logged_out' });
  });

  v1.post('/auth/claims/refresh', authLimiter, async (req, res) => {
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

  // Swagger UI — dev mode only
  if (isDev) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'CogniSys BA API Docs',
      swaggerOptions: { persistAuthorization: true },
    }));
    app.get('/api/docs.json', (_req, res) => res.json(openApiSpec));
  }

  // Organizations — POST uses requireAuth (not authorize) because new users have no org claims yet
  v1.post('/organizations', apiLimiter, requireAuth, OrganizationController.create);
  v1.get('/organizations/:orgId', apiLimiter, authorize('viewer'), OrganizationController.get);

  // Projects
  v1.post('/organizations/:orgId/projects', apiLimiter, authorize('member'), ProjectController.create);
  v1.get('/organizations/:orgId/projects', apiLimiter, authorize('viewer'), ProjectController.list);

  // Initiatives
  v1.post('/organizations/:orgId/projects/:projectId/initiatives', apiLimiter, authorize('member'), InitiativeController.create);
  v1.get('/organizations/:orgId/initiatives', apiLimiter, authorize('viewer'), InitiativeController.listByOrg);
  v1.get('/organizations/:orgId/projects/:projectId/initiatives', apiLimiter, authorize('viewer'), InitiativeController.listByProject);
  v1.put('/organizations/:orgId/projects/:projectId/initiatives/:initiativeId', apiLimiter, authorize('member'), InitiativeController.update);

  // Activities
  v1.get('/organizations/:orgId/activities', apiLimiter, authorize('viewer'), ActivityController.listByOrg);
  v1.post('/organizations/:orgId/activities', apiLimiter, authorize('member'), ActivityController.log);
  v1.post('/activities/:activityId/comments', apiLimiter, authorize('member'), ActivityController.addComment);

  // Audit Logs — admin only; field-level change history for all org mutations
  v1.get('/organizations/:orgId/audit-logs', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const limit = Number(req.query.limit ?? 50);
      const action = req.query.action as string | undefined;
      const resourceType = req.query.resourceType as string | undefined;
      const logs = await AuditLogService.getLogs(orgId, {
        limit: isNaN(limit) ? 50 : limit,
        action: action as any,
        resourceType: resourceType as any,
      });
      res.json({ logs });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  });

  // AI Operations — enforce usage quota before dispatching
  const enforceAIQuota = async (req: any, res: any, next: any) => {
    try {
      const orgId = req.params.orgId;
      const billing = await BillingService.getBilling(orgId);
      const plan = (billing?.plan ?? 'free') as import('./services/UsageMeteringService').AIPlan;
      await UsageMeteringService.enforceQuota(orgId, plan);
      next();
    } catch (err: any) {
      res.status(err?.statusCode ?? 429).json({ error: err?.message ?? 'Quota exceeded' });
    }
  };

  v1.post('/organizations/:orgId/initiatives/:initiativeId/wbs', aiLimiter, authorize('member'), enforceAIQuota, AIController.triggerWBS);
  v1.post('/organizations/:orgId/initiatives/:initiativeId/risks', aiLimiter, authorize('member'), enforceAIQuota, AIController.triggerRiskAssessment);

  // Dead-letter queue — failed tasks after max retries
  v1.get('/organizations/:orgId/tasks/failed', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const tasks = await TaskQueue.getDlqTasks(orgId as string);
      res.json({ tasks });
    } catch (err) {
      safeError(res, err, 'Get DLQ Tasks');
    }
  });

  // Missions (The Hive Persistence)
  v1.post('/organizations/:orgId/missions', apiLimiter, authorize('member'), MissionController.save);
  v1.post('/organizations/:orgId/missions/audit', apiLimiter, authorize('member'), MissionController.logAudit);
  v1.get('/organizations/:orgId/missions/:id', apiLimiter, authorize('viewer'), MissionController.getById);
  v1.get('/organizations/:orgId/initiatives/:initiativeId/missions', apiLimiter, authorize('viewer'), MissionController.getByInitiative);

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
      const memory = await ServerMemoryService.addMemory(orgId as string, content as string, vector as number[], type as any, metadata);
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
      const results = await ServerMemoryService.search(orgId as string, vector as number[], limit ?? 5);
      res.json({ results });
    } catch (error) {
      safeError(res, error, 'Memory Search');
    }
  });

  // ── Invitations ───────────────────────────────────────────────────────────
  v1.post('/organizations/:orgId/invitations', apiLimiter, can(Permission.ORGANIZATION_INVITE_MEMBER), async (req, res) => {
    try {
      const { orgId } = req.params;
      const { email, role } = req.body as { email?: string; role?: string };
      if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email is required' });
      if (!role || !['admin', 'member', 'viewer'].includes(role)) return res.status(400).json({ error: 'role must be admin | member | viewer' });
      const userId = (req as any).user?.uid ?? 'unknown';
      const invitation = await InvitationService.createInvitation(orgId as string, email, role as any, userId);
      res.status(201).json({ invitation });
    } catch (error) {
      safeError(res, error, 'Create Invitation');
    }
  });

  v1.get('/organizations/:orgId/invitations', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const status = req.query.status as string | undefined;
      const invitations = await InvitationService.listInvitations(orgId, status as any);
      res.json({ invitations });
    } catch (error) {
      safeError(res, error, 'List Invitations');
    }
  });

  v1.delete('/organizations/:orgId/invitations/:invitationId', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { invitationId } = req.params;
      const userId = (req as any).user?.uid ?? 'unknown';
      await InvitationService.revokeInvitation(invitationId as string, userId);
      res.json({ status: 'revoked' });
    } catch (error) {
      safeError(res, error, 'Revoke Invitation');
    }
  });

  // Public: accept an invitation by token (no org auth required — token is the credential)
  v1.post('/invitations/:token/accept', apiLimiter, async (req, res) => {
    try {
      const { token } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
      const idToken = authHeader.split('Bearer ')[1];
      const decoded = await (await import('./lib/firebaseAdmin')).getAdminAuth().verifyIdToken(idToken);
      const result = await InvitationService.acceptInvitation(token as string, decoded.uid);
      res.json({ status: 'accepted', ...result });
    } catch (error) {
      safeError(res, error, 'Accept Invitation');
    }
  });

  // ── Member Management ─────────────────────────────────────────────────────
  v1.get('/organizations/:orgId/members', apiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const members = await MemberService.listMembers(orgId as string);
      res.json({ members });
    } catch (error) {
      safeError(res, error, 'List Members');
    }
  });

  v1.delete('/organizations/:orgId/members/:userId', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId, userId: targetUserId } = req.params;
      const actorId = (req as any).user?.uid ?? 'unknown';
      await MemberService.removeMember(orgId as string, targetUserId as string, actorId);
      res.json({ status: 'removed' });
    } catch (error) {
      safeError(res, error, 'Remove Member');
    }
  });

  v1.patch('/organizations/:orgId/members/:userId/role', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId, userId: targetUserId } = req.params;
      const { role } = req.body as { role?: string };
      if (!role || !['admin', 'member', 'viewer'].includes(role)) return res.status(400).json({ error: 'role must be admin | member | viewer' });
      const actorId = (req as any).user?.uid ?? 'unknown';
      await MemberService.changeMemberRole(orgId as string, targetUserId as string, role as any, actorId);
      res.json({ status: 'updated', role });
    } catch (error) {
      safeError(res, error, 'Change Member Role');
    }
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  v1.get('/notifications', apiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const unreadOnly = req.query.unreadOnly === 'true';
      const limitRaw = req.query.limit;
      const limit = Number(typeof limitRaw === 'string' ? limitRaw : 50);
      const notifications = await NotificationService.getNotifications(userId, { unreadOnly, limit: isNaN(limit) ? 50 : limit });
      res.json({ notifications });
    } catch (error) {
      safeError(res, error, 'Get Notifications');
    }
  });

  v1.patch('/notifications/:notificationId/read', apiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      await NotificationService.markRead(userId, req.params.notificationId);
      res.json({ status: 'read' });
    } catch (error) {
      safeError(res, error, 'Mark Notification Read');
    }
  });

  v1.post('/notifications/mark-all-read', apiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      await NotificationService.markAllRead(userId);
      res.json({ status: 'all_read' });
    } catch (error) {
      safeError(res, error, 'Mark All Notifications Read');
    }
  });


  // ── Usage Metering ────────────────────────────────────────────────────────
  v1.get('/organizations/:orgId/usage', apiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const month = req.query.month as string | undefined;
      const usage = await UsageMeteringService.getUsage(orgId as string, month);
      res.json({ usage: usage ?? { orgId, month: month ?? 'current', aiCalls: 0, tokenCount: 0 } });
    } catch (error) {
      safeError(res, error, 'Get Usage');
    }
  });

  v1.get('/organizations/:orgId/usage/logs', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const limit = Math.min(Number(req.query.limit ?? 50), 200);
      const logs = await getAdminDb()
        .collection('ai_usage_logs')
        .where('orgId', '==', orgId)
        .orderBy('timestamp', 'desc')
        .limit(isNaN(limit) ? 50 : limit)
        .get();
      
      const results = logs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ logs: results });
    } catch (error) {
      safeError(res, error, 'Get Usage Logs');
    }
  });

  // ── SSE — Real-time notification stream ───────────────────────────────────
  v1.get('/notifications/stream', authorize('viewer'), (req, res) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      // Send initial heartbeat and connection event
      res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);

      sseManager.add(userId, res);

      // Heartbeat every 30s to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try { res.write(':heartbeat\n\n'); } catch { clearInterval(heartbeat); }
      }, 30_000);

      req.on('close', () => {
        clearInterval(heartbeat);
        sseManager.remove(userId, res);
        res.end();
      });
    } catch (error) {
      logger.error({ err: error }, 'SSE Connection Error');
      if (!res.headersSent) res.status(500).end();
    }
  });

  // ── Analytics ─────────────────────────────────────────────────────────────
  v1.get('/organizations/:orgId/analytics/activity', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const days = Math.min(Number(req.query.days ?? 30), 90);
      const activity = await AnalyticsService.getOrgActivity(orgId, isNaN(days) ? 30 : days);
      res.json({ activity });
    } catch (error) {
      safeError(res, error, 'Analytics Activity');
    }
  });

  v1.get('/organizations/:orgId/analytics/initiatives', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const metrics = await AnalyticsService.getInitiativeMetrics(req.params.orgId);
      res.json({ metrics });
    } catch (error) {
      safeError(res, error, 'Analytics Initiatives');
    }
  });

  v1.get('/organizations/:orgId/analytics/ai-usage', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const months = Math.min(Number(req.query.months ?? 6), 12);
      const trend = await AnalyticsService.getAIUsageTrend(orgId, isNaN(months) ? 6 : months);
      res.json({ trend });
    } catch (error) {
      safeError(res, error, 'Analytics AI Usage');
    }
  });

  // ── Webhooks ──────────────────────────────────────────────────────────────
  v1.post('/organizations/:orgId/webhooks', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const { url, events } = req.body as { url?: string; events?: string[] };
      if (!url || typeof url !== 'string') return res.status(400).json({ error: 'url is required' });
      // Basic webhook URL validation to reduce SSRF risk
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return res.status(400).json({ error: 'webhook url must use https' });
        const host = parsed.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return res.status(400).json({ error: 'webhook url hostname not allowed' });
      } catch (e) {
        return res.status(400).json({ error: 'invalid url' });
      }
      if (!events || !Array.isArray(events) || events.length === 0) return res.status(400).json({ error: 'events[] is required' });
      const actorId = (req as any).user?.uid ?? 'unknown';
      const webhook = await WebhookService.registerWebhook(orgId, url, events as any, actorId);
      // Return webhook without secret in response — secret is for verification only
      const { secret: _s, ...safe } = webhook;
      res.status(201).json({ webhook: safe });
    } catch (error) {
      safeError(res, error, 'Register Webhook');
    }
  });

  v1.get('/organizations/:orgId/webhooks', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const webhooks = await WebhookService.listWebhooks(req.params.orgId);
      res.json({ webhooks });
    } catch (error) {
      safeError(res, error, 'List Webhooks');
    }
  });

  v1.delete('/organizations/:orgId/webhooks/:webhookId', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      await WebhookService.deleteWebhook(req.params.webhookId, req.params.orgId);
      res.json({ status: 'deleted' });
    } catch (error) {
      safeError(res, error, 'Delete Webhook');
    }
  });

  // ── Search ────────────────────────────────────────────────────────────────
  v1.get('/organizations/:orgId/search', apiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const q = req.query.q as string | undefined;
      const type = (req.query.type as string | undefined) ?? 'all';
      const limit = Math.min(Number(req.query.limit ?? 20), 50);
      if (!q) return res.status(400).json({ error: 'q (query) is required' });
      if (!['initiatives', 'projects', 'all'].includes(type)) {
        return res.status(400).json({ error: 'type must be initiatives | projects | all' });
      }
      const results = await SearchService.search(orgId, q, type as any, isNaN(limit) ? 20 : limit);
      res.json({ results, query: q, type });
    } catch (error) {
      safeError(res, error, 'Search');
    }
  });

  // ── Billing ───────────────────────────────────────────────────────────────
  v1.get('/organizations/:orgId/billing', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const billing = await BillingService.getBilling(req.params.orgId);
      res.json({ billing: billing ?? { plan: 'free', status: 'none' } });
    } catch (error) {
      safeError(res, error, 'Get Billing');
    }
  });

  v1.post('/organizations/:orgId/billing/checkout', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { orgId } = req.params;
      const { plan, successUrl, cancelUrl } = req.body as { plan?: string; successUrl?: string; cancelUrl?: string };
      if (!plan || !['pro', 'enterprise'].includes(plan)) return res.status(400).json({ error: 'plan must be pro | enterprise' });
      if (!successUrl || !cancelUrl) return res.status(400).json({ error: 'successUrl and cancelUrl are required' });
      const session = await BillingService.createCheckoutSession(orgId, plan as any, successUrl, cancelUrl);
      if (!session) return res.status(503).json({ error: 'Billing not configured' });
      res.json(session);
    } catch (error) {
      safeError(res, error, 'Billing Checkout');
    }
  });

  v1.post('/organizations/:orgId/billing/portal', apiLimiter, authorize('admin'), async (req, res) => {
    try {
      const { returnUrl } = req.body as { returnUrl?: string };
      if (!returnUrl) return res.status(400).json({ error: 'returnUrl is required' });
      const session = await BillingService.createPortalSession(req.params.orgId, returnUrl);
      if (!session) return res.status(503).json({ error: 'Billing not configured' });
      res.json(session);
    } catch (error) {
      safeError(res, error, 'Billing Portal');
    }
  });

  // ── Admin Jobs ────────────────────────────────────────────────────────────
  // Triggers for background jobs (usually called by Cloud Scheduler)
  v1.post('/admin/jobs/trigger-digest', apiLimiter, authorize('admin', true), async (_req, res) => {
    try {
      const result = await JobService.triggerNotificationDigest();
      res.json({ status: 'ok', ...result });
    } catch (error) {
      safeError(res, error, 'Trigger Notification Digest');
    }
  });

  v1.post('/admin/jobs/trigger-usage-report', apiLimiter, authorize('admin', true), async (_req, res) => {
    try {
      const result = await JobService.triggerUsageReport();
      res.json({ status: 'ok', ...result });
    } catch (error) {
      safeError(res, error, 'Trigger Usage Report');
    }
  });

  // ── GitHub Section (Moved from app) ────────────────────────────────────────
  const PORT = process.env.PORT || 5000;
  v1.get('/auth/url', authLimiter, (req, res) => {
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

  // GitHub API Proxy — uses user's OAuth access token from auth_session cookie
  const ghHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  });

  v1.get('/github/repos', authLimiter, async (req, res) => {
    const token = req.cookies.auth_session;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=pushed&per_page=30', {
        headers: ghHeaders(token),
      });
      if (!response.ok) return res.status(response.status).json({ error: 'GitHub API error' });
      res.json(await response.json());
    } catch (error) {
      safeError(res, error, 'GitHub Repos Proxy');
    }
  });

  v1.get('/github/commits/:owner/:repo', authLimiter, async (req, res) => {
    const token = req.cookies.auth_session;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const { owner, repo } = req.params;
    const perPage = Math.min(Number(req.query.per_page) || 20, 100);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=${perPage}`,
        { headers: ghHeaders(token) }
      );
      if (!response.ok) return res.status(response.status).json({ error: 'GitHub API error' });
      const raw = await response.json() as any[];
      const commits = raw.map(c => ({
        id: c.sha.slice(0, 7),
        sha: c.sha,
        message: c.commit.message.split('\n')[0],
        author: c.author?.login ?? c.commit.author.email,
        date: c.commit.author.date.slice(0, 10),
        url: c.html_url,
      }));
      res.json(commits);
    } catch (error) {
      safeError(res, error, 'GitHub Commits Proxy');
    }
  });

  v1.get('/github/repos/:owner/:repo', authLimiter, async (req, res) => {
    const token = req.cookies.auth_session;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const { owner, repo } = req.params;
    try {
      const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers: ghHeaders(token) });
      if (!response.ok) return res.status(response.status).json({ error: 'GitHub API error' });
      res.json(await response.json());
    } catch (error) {
      safeError(res, error, 'GitHub Repo Proxy');
    }
  });

  // ── AI Section (Moved from app) ────────────────────────────────────────────
  v1.post('/gemini/generate', aiLimiter, requireAuth, async (req, res) => {
    const startTime = Date.now();
    try {
      const { prompt, model, config } = req.body as { prompt: string; model?: 'flash' | 'pro'; config?: Record<string, unknown> };
      if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt is required' });
      const modelType = model === 'pro' ? ModelType.REASONING : ModelType.SPEED;
      const router = new ModelRouter();
      let result = config?.inlineImage ? await router.generateContentWithImage(prompt, modelType, config.inlineImage as any) : await router.generateContent(prompt, modelType);
      void UsageMeteringService.trackDetailedUsage({
        orgId: (req as any).user?.orgId || 'unknown',
        userId: (req as any).user?.uid || 'unknown',
        model: model === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash',
        usage: result.usage,
        latencyMs: Date.now() - startTime,
        correlationId: req.headers['x-correlation-id'],
      });
      res.json({ text: result.text, usage: result.usage });
    } catch (error) {
      safeError(res, error, 'Gemini Proxy');
    }
  });

  v1.post('/mistral/chat', aiLimiter, requireAuth, async (req, res) => {
    const startTime = Date.now();
    try {
      const router = new ModelRouter();
      const promptText = req.body.prompt || req.body.messages?.[req.body.messages?.length - 1]?.content;
      const result = await router.generateContent(promptText, ModelType.MISTRAL);
      void UsageMeteringService.trackDetailedUsage({
        orgId: (req as any).user?.orgId || 'unknown',
        userId: (req as any).user?.uid || 'unknown',
        model: 'mistral-large-latest',
        usage: result.usage,
        latencyMs: Date.now() - startTime,
        correlationId: req.headers['x-correlation-id'],
      });
      res.json({ text: result.text, usage: result.usage, choices: [{ message: { content: result.text } }] });
    } catch (error) {
      safeError(res, error, 'Mistral Proxy');
    }
  });

  v1.post('/azure-openai/chat', aiLimiter, requireAuth, async (req, res) => {
    const startTime = Date.now();
    try {
      const router = new ModelRouter();
      const promptText = req.body.prompt || req.body.messages?.[req.body.messages?.length - 1]?.content;
      const result = await router.generateContent(promptText, ModelType.AZURE);
      void UsageMeteringService.trackDetailedUsage({
        orgId: (req as any).user?.orgId || 'unknown',
        userId: (req as any).user?.uid || 'unknown',
        model: 'azure-gpt-4o',
        usage: result.usage,
        latencyMs: Date.now() - startTime,
        correlationId: req.headers['x-correlation-id'],
      });
      res.json({ text: result.text, usage: result.usage, choices: [{ message: { content: result.text } }] });
    } catch (error) {
      safeError(res, error, 'Azure Proxy');
    }
  });

  v1.post('/gemini/embed', aiLimiter, requireAuth, async (req, res) => {
    try {
      const { text } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
      });
      if (!response.ok) return res.status(502).json({ error: 'Embedding error' });
      const data = await response.json() as any;
      res.json({ embedding: data?.embedding?.values ?? [] });
    } catch (error) {
      safeError(res, error, 'Gemini Embed Proxy');
    }
  });

  v1.post('/gemini/generate/stream', aiLimiter, requireAuth, (req, res) => {
    const { prompt } = req.body;
    const operationId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    createOperation(operationId);
    updateOperation(operationId, { status: 'running' });
    (async () => {
      try {
        const router = new ModelRouter();
        const result = await router.generateContent(prompt, ModelType.SPEED);
        updateOperation(operationId, { status: 'complete', result: result.text, usage: result.usage });
      } catch (err) {
        updateOperation(operationId, { status: 'error', error: 'Generation failed' });
      }
    })();
    const userId = (req as any).user?.uid;
    res.status(202).json({ operationId, sseToken: createSseToken(userId, operationId) });
  });

  v1.get('/ai/stream/:operationId', (req, res, next) => {
    const { operationId } = req.params;
    const sseToken = req.query.sseToken as string;
    if (sseToken) {
      const userId = validateSseToken(sseToken, operationId);
      if (!userId) return res.status(401).json({ error: 'Invalid token' });
      (req as any).user = { uid: userId };
      return next();
    }
    return requireAuth(req, res, next);
  }, (req, res) => {
    const op = getOperation(req.params.operationId);
    if (!op) return res.status(404).json({ error: 'Operation not found' });
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const send = (event: string, data: string) => {
      res.write(`event: ${event}\ndata: ${data}\n\n`);
      if (event === 'complete' || event === 'error') res.end();
    };
    if (op.status === 'complete') return send('complete', JSON.stringify({ text: op.result }));
    if (op.status === 'error') return send('error', JSON.stringify({ error: op.error }));
    const unsub = subscribe(req.params.operationId, send);
    req.on('close', unsub);
  });
  // Auth routes moved to v1 router above

  // ── API Routing ───────────────────────────────────────────────────────────
  // Mount v1 router at /api/v1 and /api (backward-compat alias)
  app.use('/api/v1', v1);
  app.use('/api', v1);

  // JSON 404 for unknown /api/* routes — must come before SPA catch-all
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // Legacy GitHub OAuth Callback (at root, not /api)
  app.get(['/auth/callback', '/auth/callback/'], authLimiter, async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');
    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ 
          client_id: process.env.GITHUB_CLIENT_ID, 
          client_secret: process.env.GITHUB_CLIENT_SECRET, 
          code 
        }),
      });
      const tokenData = await tokenResponse.json() as { error?: string; error_description?: string; access_token?: string };
      if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
      const accessToken = tokenData.access_token;

      const userResponse = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}` } });
      const userData = await userResponse.json() as { id?: number; name?: string; login?: string; avatar_url?: string };

      res.cookie('auth_session', accessToken, { secure: !isDev, sameSite: isDev ? 'lax' : 'none', httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

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

  // Global Error Handler
  app.use((err: any, req: any, res: any, _next: any) => {
    logger.error({ 
      err: err.message, 
      stack: err.stack,
      url: req.url,
      method: req.method 
    }, 'Unhandled Server Error');
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', reference: req.headers['x-correlation-id'] });
    }
  });

  // Sentry error handler must come AFTER all routes
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  return app;
}
