import { config } from 'dotenv';
// Load .env.local first (takes precedence), then fall back to .env
config({ path: '.env.local' });
config();
import express from 'express';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authorize } from './server/middleware/rbac';
import { ModelRouter, ModelType } from './server/ai-agents/ModelRouter';
import { OrganizationController } from './server/controllers/OrganizationController';
import { ProjectController } from './server/controllers/ProjectController';
import { InitiativeController } from './server/controllers/InitiativeController';
import { AIController } from './server/controllers/AIController';
import { TaskWorker } from './server/services/TaskWorker';

async function startServer() {
  const app = express();
  const PORT = 5000;

  const isDev = process.env.NODE_ENV !== 'production';

  // Security headers — must be first middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          // Firebase SDK loads scripts from these origins
          'https://www.gstatic.com',
          'https://apis.google.com',
          // Dev-only: Vite HMR uses new Function() and inline scripts
          ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",  // TailwindCSS 4 injects styles at runtime — unavoidable
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
        ],
        imgSrc: [
          "'self'",
          'data:',   // base64 images (Vision Board, charts)
          'blob:',   // Blob URLs (generated diagrams, exports)
          'https://*.googleapis.com',
          'https://*.firebaseapp.com',
          'https://*.web.app',
        ],
        connectSrc: [
          "'self'",
          'https://*.googleapis.com',      // Firestore, Firebase Auth, Gemini
          'https://*.firebaseio.com',      // Firebase Realtime DB
          'https://*.cloudfunctions.net',  // Cloud Functions
          ...(isDev ? ['ws://localhost:*', 'wss://localhost:*'] : []),  // Vite HMR
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(isDev ? {} : { upgradeInsecureRequests: [] }),
      },
    },
    hsts: {
      maxAge: 31536000,       // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
  }));

  // Allowed origins: localhost dev + all authorized Cloud Run environments
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:5173',
    /\.run\.app$/,           // matches all *.run.app Cloud Run domains
    /\.firebaseapp\.com$/,
    /\.web\.app$/,
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, mobile)
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some(o =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );
      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json());

  // Rate limiters — defined here, applied per route group below
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  // Tighter limit for AI proxy — each call costs money and CPU
  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'AI request limit reached, please try again later.' },
  });

  // Strict limit for auth endpoints to slow brute-force attempts
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many auth requests, please try again later.' },
  });

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // --- Enterprise API Routes ---
  
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

  // AI Operations — tight limit (expensive calls)
  app.post('/api/organizations/:orgId/initiatives/:initiativeId/wbs', aiLimiter, authorize('member'), AIController.triggerWBS);
  app.post('/api/organizations/:orgId/initiatives/:initiativeId/risks', aiLimiter, authorize('member'), AIController.triggerRiskAssessment);

  // --- GitHub OAuth Flow ---
  
  // 1. Construct OAuth URL Endpoint
  app.get('/api/auth/url', authLimiter, (req, res) => {
    // We use the referrer or origin to construct the redirect URI dynamically
    const origin = req.headers.origin || req.headers.referer || `http://localhost:${PORT}`;
    const baseUrl = new URL(origin).origin;
    const redirectUri = `${baseUrl}/auth/callback`;

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params}`;
    res.json({ url: authUrl });
  });

  // 2. Callback Handler with postMessage
  app.get(['/auth/callback', '/auth/callback/'], authLimiter, async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('No code provided');
    }

    try {
      // Exchange code for token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      const accessToken = tokenData.access_token;

      // Fetch user data
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = await userResponse.json();

      // In a real app, you would create a session and set a secure cookie here.
      // For this demo, we'll just send the user data back to the client via postMessage.
      
      // Set a secure cookie for the session
      res.cookie('auth_session', accessToken, {
        secure: true,      // Required for SameSite=None
        sameSite: 'none',  // Required for cross-origin iframe
        httpOnly: true,    // Security best practice
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS',
                  user: {
                    id: '${userData.id}',
                    name: '${userData.name || userData.login}',
                    avatarUrl: '${userData.avatar_url}'
                  }
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth Error:', error);
      res.status(500).send(`
        <html>
          <body>
            <p>Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
  });

  // Get current user (mock session check)
  app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.auth_session;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // In a real app, validate the token against your DB or GitHub
    res.json({ status: 'authenticated' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_session', {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
    });
    res.json({ status: 'logged_out' });
  });

  // --- Gemini AI Proxy (SECURITY: keeps API key server-side only) ---
  // All client-side AI calls must go through this endpoint.
  app.post('/api/gemini/generate', aiLimiter, authorize('viewer'), async (req, res) => {
    try {
      const { prompt, model, config } = req.body as {
        prompt: string;
        model?: 'flash' | 'pro';
        config?: Record<string, unknown>;
      };

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'prompt is required and must be a string' });
      }

      const modelType = model === 'pro' ? ModelType.REASONING : ModelType.SPEED;
      const router = new ModelRouter();

      let text: string;
      if (config?.inlineImage) {
        // Multimodal call (e.g. Vision Board image analysis)
        text = await router.generateContentWithImage(prompt, modelType, config.inlineImage as { mimeType: string; data: string });
      } else if (config?.tools) {
        text = await router.generateContentWithConfig(prompt, modelType, config);
      } else {
        text = await router.generateContent(prompt, modelType);
      }

      res.json({ text });
    } catch (error) {
      console.error('Gemini Proxy Error:', error);
      res.status(500).json({ error: 'AI generation failed. Please try again.' });
    }
  });

  // --- Mistral API Proxy ---
  app.post('/api/mistral/chat', async (req, res) => {
    try {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'MISTRAL_API_KEY is not configured' });
      }

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status} - ${JSON.stringify(data)}`);
      }

      res.json(data);
    } catch (error) {
      console.error('Mistral Proxy Error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // --- Azure OpenAI API Proxy ---
  app.post('/api/azure-openai/chat', async (req, res) => {
    try {
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

      if (!apiKey || !endpoint || !deploymentName) {
        return res.status(500).json({ 
          error: 'Azure OpenAI configuration is missing. Ensure AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT_NAME are set.' 
        });
      }

      // Format: https://{endpoint}/openai/deployments/{deploymentName}/chat/completions?api-version=2024-02-15-preview
      const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.status} - ${JSON.stringify(data)}`);
      }

      res.json(data);
    } catch (error) {
      console.error('Azure OpenAI Proxy Error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    const httpServer = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
      
      // Start Task Worker in the background
      try {
        const worker = new TaskWorker();
        worker.start();
        console.log('TaskWorker initialized successfully.');
      } catch (error) {
        console.error('Failed to start TaskWorker:', error);
      }
    });

  } else {
    const path = await import('path');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
      
      // Start Task Worker in the background
      try {
        const worker = new TaskWorker();
        worker.start();
        console.log('TaskWorker initialized successfully.');
      } catch (error) {
        console.error('Failed to start TaskWorker:', error);
      }
    });
  }
}

startServer().catch(err => {
  console.error('CRITICAL: Server failed to start:', err);
  process.exit(1);
});
