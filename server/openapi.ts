/**
 * OpenAPI 3.1 specification for the CogniSys BA API v1.
 *
 * Served via Swagger UI at GET /api/docs (dev mode only).
 * Spec JSON available at GET /api/docs.json (dev mode only).
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'CogniSys BA — The Catalyst Hub API',
    version: '1.0.0',
    description:
      'REST API for the Catalyst Hub AI-native B2B SaaS platform. All resource endpoints are versioned under `/api/v1/`. A backward-compatible alias exists at `/api/`.',
    contact: {
      name: 'CogniSys Team',
      url: 'https://github.com/zakarya-87/CogniSys-BA',
    },
  },
  servers: [
    { url: '/api/v1', description: 'v1 (canonical)' },
    { url: '/api', description: 'Legacy alias (backward-compat)' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Firebase ID Token',
        description:
          'Firebase ID token obtained after `signInWithPopup`. Pass via `Authorization: Bearer <token>`.',
      },
    },
    schemas: {
      Organization: {
        type: 'object',
        required: ['id', 'name', 'ownerId', 'members'],
        properties: {
          id: { type: 'string', example: 'org_abc123' },
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Acme Corp' },
          ownerId: { type: 'string', example: 'uid_firebase_xyz' },
          members: {
            type: 'array',
            items: {
              type: 'object',
              required: ['userId', 'role'],
              properties: {
                userId: { type: 'string' },
                role: { type: 'string', enum: ['admin', 'member', 'viewer'] },
              },
            },
          },
        },
      },
      CreateOrganizationBody: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Acme Corp' },
        },
      },
      Project: {
        type: 'object',
        required: ['id', 'orgId', 'name', 'description'],
        properties: {
          id: { type: 'string', example: 'proj_abc123' },
          orgId: { type: 'string', example: 'org_abc123' },
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Project Alpha' },
          description: { type: 'string', maxLength: 500, example: 'Core platform modernisation' },
        },
      },
      CreateProjectBody: {
        type: 'object',
        required: ['name', 'description'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Project Alpha' },
          description: { type: 'string', maxLength: 500, example: 'Core platform modernisation' },
        },
      },
      InitiativeStatus: {
        type: 'string',
        enum: ['Planning', 'Awaiting Approval', 'In Development', 'Live', 'On Hold'],
      },
      Sector: {
        type: 'string',
        enum: [
          'Cloud & SaaS',
          'Fintech',
          'Renewable Energy',
          'Circular Economy',
          'Agritech & Foodtech',
          'Industry 4.0 & IoT',
          'Biotech & Pharma',
          'General Business',
        ],
      },
      Initiative: {
        type: 'object',
        required: ['id', 'orgId', 'projectId', 'title', 'description', 'status', 'sector', 'owner'],
        properties: {
          id: { type: 'string', example: 'init_abc123' },
          orgId: { type: 'string', example: 'org_abc123' },
          projectId: { type: 'string', example: 'proj_abc123' },
          title: { type: 'string', minLength: 2, maxLength: 200, example: 'API v1 Router Refactor' },
          description: { type: 'string', maxLength: 1000 },
          status: { $ref: '#/components/schemas/InitiativeStatus' },
          sector: { $ref: '#/components/schemas/Sector' },
          owner: {
            type: 'object',
            required: ['name', 'avatarUrl'],
            properties: {
              name: { type: 'string' },
              avatarUrl: { type: 'string' },
            },
          },
          readinessScore: { type: 'number', minimum: 0, maximum: 100 },
          lastUpdated: { type: 'string', format: 'date-time' },
        },
      },
      CreateInitiativeBody: {
        type: 'object',
        required: ['title', 'description', 'status', 'sector', 'owner'],
        properties: {
          title: { type: 'string', minLength: 2, maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          status: { $ref: '#/components/schemas/InitiativeStatus' },
          sector: { $ref: '#/components/schemas/Sector' },
          owner: {
            type: 'object',
            required: ['name', 'avatarUrl'],
            properties: {
              name: { type: 'string' },
              avatarUrl: { type: 'string' },
            },
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Validation failed' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'name' },
                message: { type: 'string', example: 'String must contain at least 2 character(s)' },
              },
            },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          version: { type: 'string', example: 'v1' },
        },
      },
      FeatureFlags: {
        type: 'object',
        additionalProperties: { type: 'boolean' },
        example: {
          ai_streaming: true,
          vector_memory: true,
          github_api: true,
          google_auth: true,
          predictive_core: true,
          war_room: true,
          construct_view: true,
          otel_tracing: false,
        },
      },
      Error401: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Unauthorized' },
        },
      },
      Error403: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Forbidden: insufficient role' },
        },
      },
      Error404: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Not found' },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Service is healthy',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
          },
        },
      },
    },
    '/feature-flags': {
      get: {
        tags: ['System'],
        summary: 'List all feature flags',
        security: [],
        responses: {
          200: {
            description: 'Current feature flag states',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/FeatureFlags' } } },
          },
        },
      },
    },
    '/organizations': {
      post: {
        tags: ['Organizations'],
        summary: 'Create an organization',
        description: 'Requires **member** role.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrganizationBody' } } },
        },
        responses: {
          201: { description: 'Organization created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } } },
          400: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
        },
      },
    },
    '/organizations/{orgId}': {
      parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Organizations'],
        summary: 'Get an organization',
        description: 'Requires **viewer** role.',
        responses: {
          200: { description: 'Organization', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error404' } } } },
        },
      },
    },
    '/organizations/{orgId}/projects': {
      parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Projects'],
        summary: 'List projects in an organization',
        description: 'Requires **viewer** role.',
        responses: {
          200: { description: 'List of projects', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a project',
        description: 'Requires **member** role.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProjectBody' } } },
        },
        responses: {
          201: { description: 'Project created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
          400: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
        },
      },
    },
    '/organizations/{orgId}/initiatives': {
      parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Initiatives'],
        summary: 'List all initiatives for an organization',
        description: 'Requires **viewer** role.',
        responses: {
          200: { description: 'List of initiatives', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Initiative' } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
        },
      },
    },
    '/organizations/{orgId}/projects/{projectId}/initiatives': {
      parameters: [
        { name: 'orgId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      get: {
        tags: ['Initiatives'],
        summary: 'List initiatives for a project',
        description: 'Requires **viewer** role.',
        responses: {
          200: { description: 'List of initiatives', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Initiative' } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
        },
      },
      post: {
        tags: ['Initiatives'],
        summary: 'Create an initiative',
        description: 'Requires **member** role.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateInitiativeBody' } } },
        },
        responses: {
          201: { description: 'Initiative created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Initiative' } } } },
          400: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
        },
      },
    },
    '/organizations/{orgId}/projects/{projectId}/initiatives/{initiativeId}': {
      parameters: [
        { name: 'orgId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'initiativeId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      put: {
        tags: ['Initiatives'],
        summary: 'Update an initiative',
        description: 'Requires **member** role. All fields are optional.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateInitiativeBody' } } },
        },
        responses: {
          200: { description: 'Initiative updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Initiative' } } } },
          400: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error404' } } } },
        },
      },
    },
    '/organizations/{orgId}/memory': {
      parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string' } }],
      post: {
        tags: ['Vector Memory'],
        summary: 'Store a memory entry',
        description: 'Requires **member** role. Stores content + its embedding vector in Firestore.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content', 'vector', 'type'],
                properties: {
                  content: { type: 'string', example: 'We decided to adopt Zod for validation.' },
                  vector: { type: 'array', items: { type: 'number' }, example: [0.1, 0.2, 0.3] },
                  type: { type: 'string', enum: ['fact', 'decision', 'insight'] },
                  metadata: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Memory stored' },
          400: { description: 'Missing required fields' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
        },
      },
    },
    '/organizations/{orgId}/memory/search': {
      parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string' } }],
      post: {
        tags: ['Vector Memory'],
        summary: 'Semantic search over org memory',
        description: 'Requires **viewer** role. Returns top-k results by cosine similarity.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vector'],
                properties: {
                  vector: { type: 'array', items: { type: 'number' } },
                  limit: { type: 'integer', default: 5, minimum: 1, maximum: 50 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Search results' },
          400: { description: 'Missing vector' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error401' } } } },
        },
      },
    },
  },
  tags: [
    { name: 'System', description: 'Health checks and configuration' },
    { name: 'Organizations', description: 'Organisation management' },
    { name: 'Projects', description: 'Project management within organisations' },
    { name: 'Initiatives', description: 'Strategic initiative tracking' },
    { name: 'Vector Memory', description: 'Per-org persistent semantic memory store' },
  ],
};
