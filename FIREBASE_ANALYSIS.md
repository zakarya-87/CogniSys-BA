# Firebase Implementation Analysis — CogniSys BA

> **Generated**: 2026-04-01  
> **Project**: CogniSys BA — The Catalyst Hub  
> **Firebase Project ID**: `gen-lang-client-0744619489`

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project ID** | `gen-lang-client-0744619489` |
| **Project Number** | `940834483787` |
| **App ID** | `1:940834483787:web:502b4e3e876b9096e167ce` |
| **Auth Domain** | `gen-lang-client-0744619489.firebaseapp.com` |
| **Storage Bucket** | `gen-lang-client-0744619489.firebasestorage.app` |
| **Messaging Sender ID** | `940834483787` |
| **Firestore Database** | Named DB: `ai-studio-de7eea7a-1d01-425b-a702-a492d6e00377` (non-default) |
| **GCP Region** | `europe-west2` (inferred from Cloud Run authorized domains) |
| **Firebase Hosting** | ❌ Not deployed — app runs on Cloud Run |

---

## 2. Authorized Domains

The following domains are authorized in Firebase Auth, revealing the full deployment topology:

```
gen-lang-client-0744619489.firebaseapp.com        # Firebase default
gen-lang-client-0744619489.web.app                # Firebase default
ais-dev-pyjas73butfxnu5ouk52sd-131286974609.europe-west2.run.app       # Dev env
ais-shared-pyjas73butfxnu5ouk52sd-131286974609.europe-west2.run.app    # Shared env
ais-pre-pyjas73butfxnu5ouk52sd-131286974609.europe-west2.run.app       # Pre-prod env
ais-dev-2w7sy5wwe36amy62rtaaef-131286974609.europe-west2.run.app       # Dev env 2
ais-shared-2w7sy5wwe36amy62rtaaef-131286974609.europe-west2.run.app    # Shared env 2
ais-pre-2w7sy5wwe36amy62rtaaef-131286974609.europe-west2.run.app       # Pre-prod env 2
```

**Observation**: Three deployment tiers (`dev`, `shared`, `pre`) with two variants each, all hosted on **Google Cloud Run** in `europe-west2`. This is consistent with a CI/CD pipeline generating Cloud Run revisions per environment.

---

## 3. Firebase SDK Integration

### 3.1 Frontend Client (`firebase.ts`)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Uses named Firestore database (NOT the default)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
```

- **SDK Version**: Firebase Client SDK `^12.9.0`
- **Firestore**: Explicitly targets the named database `ai-studio-de7eea7a-...`
- **Auth**: Standard Firebase Auth instance

### 3.2 Backend Admin (`server/lib/firebaseAdmin.ts`)

The Admin SDK uses a **3-tier fallback initialization** strategy:

```typescript
// Priority 1: Service account from environment variable (production)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  initializeApp({ credential: cert(JSON.parse(serviceAccount)), projectId, databaseURL });
}

// Priority 2: Default credentials (GCP-native, e.g., Cloud Run service account)
else {
  initializeApp({ projectId });
}

// Priority 3: Project ID only fallback (limited access)
```

- **SDK Version**: Firebase Admin SDK `^13.7.0`
- **Pattern**: Lazy singleton — `getAdminDb()` and `getAdminAuth()` initialize on first call
- **⚠️ Issue**: Admin SDK calls `getFirestore()` without specifying the named DB ID — this defaults to the `(default)` database, **not** the named database used by the client

```typescript
// Backend uses default DB
export const getAdminDb = () => {
  if (!db) db = getFirestore();  // ← no DB ID specified
  return db;
};

// Frontend uses named DB
export const db = getFirestore(app, "ai-studio-de7eea7a-1d01-425b-a702-a492d6e00377");
```

> **Risk**: Backend and frontend may be operating on **different Firestore databases**, causing data written by the server to be invisible to the client and vice versa.

---

## 4. Firestore Collections

### 4.1 Collection Map

| Collection | Firestore Rules | Blueprint | Backend Code | Client Code | Access Pattern |
|-----------|----------------|-----------|--------------|-------------|----------------|
| `organizations` | ✅ | ✅ | ✅ Repository | ✅ Context | Auth + org claim |
| `projects` | ✅ | ✅ | ✅ Repository | ✅ Context | Auth + org claim |
| `initiatives` | ✅ | ✅ | ✅ Repository | ✅ Context | Auth + org claim |
| `audit_logs` | ✅ | ✅ | ✅ Service | ❌ (admin only) | Admin read / auth write |
| `task_queue` | ❌ no rules | ❌ | ✅ TaskQueue | ❌ (backend only) | Admin SDK only |
| `prompts` | ❌ no rules | ❌ | ✅ PromptManager | ❌ (backend only) | Admin SDK only |

### 4.2 Document Schemas

#### `organizations/{orgId}`
```typescript
{
  id: string;
  name: string;
  ownerId: string;
  members: { userId: string; role: 'admin' | 'member' | 'viewer' }[];
}
```

#### `projects/{projectId}`
```typescript
{
  id: string;
  orgId: string;       // indexed — used for org-scoped queries
  name: string;        // 1–100 chars (enforced by rules)
  description: string;
}
```

#### `initiatives/{initiativeId}`
```typescript
{
  id: string;
  orgId: string;       // indexed
  projectId: string;   // indexed
  title: string;       // 1–200 chars (enforced by rules)
  description: string;
  status: 'Planning' | 'Awaiting Approval' | 'In Development' | 'Live' | 'On Hold';
  sector: string;
  owner: { name: string; avatarUrl: string };
  wbs?: TWorkBreakdown;     // written by WBSGeneratorAgent
  artifacts?: Record<string, any>;
  readinessScore?: number;
  lastUpdated?: string;
}
```

#### `audit_logs/{logId}`
```typescript
{
  orgId: string;
  userId: string;
  action: string;      // e.g., "Created initiative: Mobile App Redesign"
  timestamp: Timestamp; // Firestore server timestamp
}
```

#### `task_queue/{taskId}`
```typescript
{
  orgId: string;
  type: 'GENERATE_WBS' | 'ASSESS_RISKS' | 'ANALYZE_ARTIFACT';
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

#### `prompts/{promptId}`
```typescript
{
  content: string;   // System prompt text for AI agents
}
// Example IDs: 'wbs_generator_system', 'risk_assessor_system'
```

---

## 5. Firestore Security Rules Analysis

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() && request.auth.token.role == 'admin';
    }

    function isOrgMember(orgId) {
      return isAuthenticated() && request.auth.token.orgId == orgId;
    }
  }
}
```

### 5.1 Per-Collection Rules

| Collection | Read | Create | Update | Delete |
|-----------|------|--------|--------|--------|
| `organizations` | `isOrgMember(orgId)` | `isAdmin()` | `isAdmin()` | `isAdmin()` |
| `projects` | `isOrgMember(data.orgId)` | `isOrgMember` + field validation | `isOrgMember` + field validation | ❌ not defined |
| `initiatives` | `isOrgMember(data.orgId)` | `isOrgMember` + field validation | `isOrgMember` + field validation | ❌ not defined |
| `audit_logs` | `isAdmin()` | `isAuthenticated()` | ❌ not defined | ❌ not defined |
| `task_queue` | ❌ no rules | ❌ no rules | ❌ no rules | ❌ no rules |
| `prompts` | ❌ no rules | ❌ no rules | ❌ no rules | ❌ no rules |

### 5.2 Rules Gaps & Issues

| # | Severity | Issue | Recommendation |
|---|---------|-------|----------------|
| 1 | 🔴 High | `task_queue` and `prompts` have no Firestore security rules — if the named DB is ever accessed directly by a client, these collections are fully open | Add `allow read, write: if false;` to block all client access |
| 2 | 🟡 Medium | `delete` is not explicitly allowed or denied on `projects` and `initiatives` — Firestore denies by default, but this should be explicit | Add `allow delete: if isAdmin();` |
| 3 | 🟡 Medium | `audit_logs` allows any authenticated user to `create` — a compromised client could flood with fake audit entries | Restrict to server-side Admin SDK only; block client writes |
| 4 | 🟠 Medium | `hasOnlyAllowedFields` on initiatives update blocks adding `wbs`, `artifacts`, `readinessScore` — these are written by the backend but the rule may reject client-side sync | Extend the allowed fields list or handle via Admin SDK only |

---

## 6. Authentication Flow

### 6.1 GitHub OAuth (Session-based)

```
Client                     Server                        GitHub
  │                           │                             │
  │── GET /api/auth/url ──────►│                             │
  │◄─ { url: github.com/... } ─│                             │
  │                           │                             │
  │── Opens popup ────────────────────────────────────────►│
  │                           │◄── GET /auth/callback?code ─│
  │                           │─── POST exchange code ─────►│
  │                           │◄── { access_token } ────────│
  │                           │─── GET /api/github.com/user►│
  │                           │◄── { id, name, login } ─────│
  │                           │
  │                           │── Set-Cookie: auth_session (httpOnly, secure, sameSite=none, 1 day)
  │◄─ postMessage(OAUTH_AUTH_SUCCESS, user) ──────────────│
```

### 6.2 Firebase Auth + RBAC (API calls)

```
Client                     RBAC Middleware               Firebase Auth
  │                           │                             │
  │── API request ────────────►│                             │
  │   Authorization: Bearer   │                             │
  │   <Firebase JWT>          │── verifyIdToken(token) ────►│
  │                           │◄── DecodedIdToken ──────────│
  │                           │
  │                           │   Extract custom claims:
  │                           │   - token.orgId
  │                           │   - token.role
  │                           │
  │                           │   Validate:
  │                           │   - orgId matches URL param
  │                           │   - role >= requiredRole
  │                           │
  │◄── 200 / 403 / 401 ───────│
```

### 6.3 Custom Claims Schema

```typescript
// Set via AuthService.setCustomUserClaims(uid, claims)
{
  orgId: string;   // Organization the user belongs to
  role: 'viewer' | 'member' | 'admin';  // Role hierarchy: 1 < 2 < 3
}
```

---

## 7. Environment Variables

### 7.1 Required Variables

```bash
# AI
GEMINI_API_KEY=             # Google Gemini API key (ModelRouter, geminiService)

# GitHub OAuth
GITHUB_CLIENT_ID=           # GitHub OAuth App client ID
GITHUB_CLIENT_SECRET=       # GitHub OAuth App client secret

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT=   # JSON-stringified service account key
```

### 7.2 Optional Variables

```bash
# Alternative LLMs (proxy routes)
MISTRAL_API_KEY=                    # Mistral AI API key
AZURE_OPENAI_API_KEY=               # Azure OpenAI subscription key
AZURE_OPENAI_ENDPOINT=              # e.g., https://myresource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=       # Azure deployment name

# Runtime
NODE_ENV=development|production     # Controls Vite middleware vs static serving
```

### 7.3 Current Local State

> **⚠️ Critical**: `.env.local` is **completely empty** (0 bytes). The application cannot connect to Firebase, Gemini, or GitHub OAuth locally without populating this file.

See `.env.local.example` template below.

---

## 8. Local Development Setup

### 8.1 `.env.local` Template

Create `.env.local` in the project root with:

```bash
# ── Required ────────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key_here

GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"gen-lang-client-0744619489",...}

# ── Optional LLM Proxies ─────────────────────────────────────
MISTRAL_API_KEY=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT_NAME=

# ── Runtime ──────────────────────────────────────────────────
NODE_ENV=development
```

### 8.2 Running Locally

```bash
# Frontend only (no backend/AI features)
npx vite --port 5173

# Full stack (requires .env.local populated)
npm run dev         # Runs tsx server.ts on port 5000
```

---

## 9. Issues & Recommendations

### 9.1 Critical

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| C1 | ~~**Admin SDK targets default DB**, client targets named DB `ai-studio-de7eea7a-...`~~ | ~~Backend writes invisible to frontend~~ | ✅ **Fixed** — `getFirestore(firebaseConfig.firestoreDatabaseId)` in `firebaseAdmin.ts` |
| C2 | **`.env.local` is empty** | App cannot run locally | Populate with keys from Firebase/GCP console |

### 9.2 High

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| H1 | `task_queue` and `prompts` have no Firestore security rules | Potential open access if misconfigured | Add `allow read, write: if false;` |
| H2 | `initiatives` update rule blocks writing `wbs`, `artifacts`, `readinessScore` fields | Backend WBS results may fail client-side sync | Extend `hasOnlyAllowedFields` or use Admin SDK for all writes |

### 9.3 Medium

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| M1 | `delete` not explicitly defined on `projects` and `initiatives` | Ambiguous intent | Add explicit `allow delete: if isAdmin();` |
| M2 | `audit_logs` writable by any authenticated client | Fake audit entries possible | Remove client write; use Admin SDK only |
| M3 | CORS is enabled globally with no origin whitelist | Any origin can call the API | Restrict to known domains in production |
| M4 | GitHub OAuth uses `sameSite: 'none'` cookies | Acceptable for cross-origin but review for CSRF | Add CSRF token validation |

---

## 10. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CogniSys BA Frontend                    │
│  React 19 + Vite                                            │
│                                                             │
│  firebase.ts ──────────────────────────────────────────────►│
│  └── Firebase SDK v12.9                                     │
│      ├── Auth: gen-lang-client-0744619489.firebaseapp.com   │
│      └── Firestore: ai-studio-de7eea7a-... (named DB) ◄──┐ │
└─────────────────────────────────────────────────────────────┘
                                                           │
                          ⚠️ Different DB?                 │
                                                           │
┌─────────────────────────────────────────────────────────────┐
│                     CogniSys BA Backend                     │
│  Express 5 + Node.js + tsx                                  │
│                                                             │
│  firebaseAdmin.ts ─────────────────────────────────────────►│
│  └── Firebase Admin SDK v13.7                               │
│      ├── Auth: verifyIdToken, setCustomClaims               │
│      └── Firestore: (default) DB ◄── ⚠️ No named DB set    │
│                                                             │
│  TaskWorker ──── onSnapshot ────► task_queue (Admin SDK)    │
│  WBSGeneratorAgent ────────────► Gemini API                 │
│  RiskAssessorAgent ────────────► Gemini API                 │
│  ArtifactAnalyzerAgent ────────► Gemini API                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Google Firebase / GCP (europe-west2)           │
│                                                             │
│  Firebase Auth ─────────────── Custom claims (orgId, role)  │
│  Firestore (named DB) ──────── organizations, projects,     │
│                                initiatives, audit_logs,     │
│                                task_queue, prompts          │
│  Cloud Run ─────────────────── dev / shared / pre envs      │
└─────────────────────────────────────────────────────────────┘
```

---

*Analysis performed via static code inspection and Firebase REST API probing. Live Firestore data was not accessible due to auth-enforced security rules (expected behavior).*
