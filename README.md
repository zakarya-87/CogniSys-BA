<div align="center">
<img width="1200" height="475" alt="The Catalyst Hub Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# The Catalyst Hub — CogniSys BA

**AI-native B2B SaaS platform for strategic business analysis, initiative tracking, and multi-model AI orchestration.**

[![CI](https://github.com/zakarya-87/CogniSys-BA/actions/workflows/ci.yml/badge.svg)](https://github.com/zakarya-87/CogniSys-BA/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-20-brightgreen)
![React](https://img.shields.io/badge/react-19-61DAFB)
![TypeScript](https://img.shields.io/badge/typescript-5-3178C6)
![License](https://img.shields.io/badge/license-private-red)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Feature Flags](#feature-flags)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

The Catalyst Hub is an enterprise-grade AI-native platform that helps teams structure strategic thinking, track initiatives, orchestrate multi-model AI workflows, and maintain a persistent vector memory store — all within a secure, role-based collaboration environment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js 20, Express 5, TypeScript, tsx |
| **Auth** | Firebase Auth (GitHub + Google OAuth via `signInWithPopup`) |
| **Database** | Firebase Firestore |
| **AI Providers** | Google Gemini, Mistral AI, Azure OpenAI (fallback) |
| **ML / Embeddings** | TensorFlow.js, Gemini Embeddings API |
| **Validation** | Zod (server-side schema validation) |
| **Testing** | Vitest + Testing Library (unit/integration), Playwright (E2E) |
| **Observability** | Pino structured logging, OpenTelemetry (optional) |
| **CI/CD** | GitHub Actions → Google Cloud Build → Cloud Run |
| **Containerisation** | Docker + docker-compose |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   React 19 SPA (Vite)                │
│  Components · Context · Hooks · i18n (EN/FR/AR)      │
└───────────────────────┬──────────────────────────────┘
                        │ Axios (Bearer token interceptor)
┌───────────────────────▼──────────────────────────────┐
│              Express API Server (Node 20)             │
│                                                      │
│  /api/v1/  ──── Resource Router (versioned)          │
│    organizations · projects · initiatives            │
│    vector-memory (store / query)                     │
│                                                      │
│  /api/     ──── Auth, AI Proxies, GitHub Proxy, SSE  │
│    auth/firebase-session · auth/me · auth/logout     │
│    gemini/generate · gemini/embed · mistral/chat     │
│    azure-openai/chat · github/repos · ai/stream      │
│                                                      │
│  Middleware stack (in order):                        │
│    helmet → cors → rate-limit → cookie-parser        │
│    → pino-http → RBAC (authorize) → Zod validation  │
└──────┬───────────────────────┬───────────────────────┘
       │ Firebase Admin SDK    │ AI SDKs
┌──────▼──────┐        ┌──────▼──────────────────────┐
│  Firestore  │        │  Gemini · Mistral · Azure    │
│  Auth Admin │        │  TensorFlow.js embeddings    │
└─────────────┘        └─────────────────────────────┘
```

---

## Features

- **Multi-model AI orchestration** — Gemini (primary), Mistral, Azure OpenAI with streaming SSE
- **Vector memory** — per-org persistent memory store with cosine similarity search
- **RBAC** — role hierarchy: `viewer → member → admin` enforced server-side via Firebase ID tokens
- **Firebase Auth** — GitHub and Google social login via `signInWithPopup`, zero password storage
- **Zod input validation** — all `POST`/`PUT` endpoints validate body with field-level error responses
- **Feature flags** — 8 env-driven flags, zero-downtime toggling without redeployment
- **Structured logging** — Pino with request/response correlation IDs (pretty-print in dev)
- **OpenTelemetry** — optional OTLP trace exporting (disabled by default)
- **E2E tests** — Playwright suite covering critical user journeys
- **Docker-ready** — `Dockerfile` + `docker-compose.yml` for local full-stack dev

---

## Getting Started

### Prerequisites

- **Node.js ≥ 20** (`node -v`)
- **npm ≥ 10** (`npm -v`)
- A **Firebase project** with Firestore and Authentication enabled
- At least one AI provider key: Gemini, Mistral, or Azure OpenAI

### 1 — Clone & install

```bash
git clone https://github.com/zakarya-87/CogniSys-BA.git
cd CogniSys-BA
npm install --legacy-peer-deps
```

### 2 — Configure environment

```bash
cp .env.example .env.local
# Edit .env.local — see Environment Variables section below
```

### 3 — Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com) → your project → **Project Settings → Service Accounts**
2. Click **Generate new private key** → download JSON
3. Paste the entire JSON as a single line into `FIREBASE_SERVICE_ACCOUNT` in `.env.local`
4. Enable **Authentication → Sign-in method → GitHub** and **Google**
5. For GitHub: add your OAuth App's Client ID + Secret (from [github.com/settings/developers](https://github.com/settings/developers))

### 4 — Run locally

```bash
npm run dev
```

This starts **both** the Vite dev server (port 5173) and the Express API server (port 5000) concurrently.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (server-only, never exposed to browser) |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ | Full Firebase Admin SDK JSON (single-line) |
| `MISTRAL_API_KEY` | Optional | Mistral AI key for `/api/mistral/chat` |
| `AZURE_OPENAI_API_KEY` | Optional | Azure OpenAI key for fallback chat |
| `AZURE_OPENAI_ENDPOINT` | Optional | Azure OpenAI resource endpoint |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Optional | Azure deployment name |
| `GITHUB_CLIENT_ID` | Optional | Legacy GitHub OAuth (only for `/api/auth/url` fallback) |
| `GITHUB_CLIENT_SECRET` | Optional | Legacy GitHub OAuth secret |
| `LOG_LEVEL` | Optional | `trace\|debug\|info\|warn\|error` (default: `debug` in dev) |
| `OTEL_ENABLED` | Optional | Set `true` to enable OpenTelemetry tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional | OTLP collector endpoint |

> **Security:** `GEMINI_API_KEY` and `FIREBASE_SERVICE_ACCOUNT` are **server-only**. They are never injected into the Vite client bundle. All AI calls are proxied through the Express server.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite + Express in development (hot-reload) |
| `npm run build` | Production build (TypeScript compile + Vite bundle) |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit + integration tests |
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run test:e2e:ui` | Run Playwright with interactive UI |
| `npm run lint` | ESLint across all TypeScript files |
| `npm run docker:build` | Build the Docker image |
| `npm run docker:run` | Run the Docker container locally |
| `npm run docker:dev` | Full-stack Docker Compose (app + optional services) |

---

## API Reference

All resource endpoints are versioned under `/api/v1/`. A backward-compatible alias at `/api/` is maintained for existing clients.

### Organizations

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/organizations` | viewer | List all organizations |
| `POST` | `/api/v1/organizations` | member | Create organization |
| `GET` | `/api/v1/organizations/:id` | viewer | Get organization |
| `PUT` | `/api/v1/organizations/:id` | admin | Update organization |
| `DELETE` | `/api/v1/organizations/:id` | admin | Delete organization |

### Projects

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/projects` | viewer | List projects |
| `POST` | `/api/v1/organizations/:orgId/projects` | member | Create project |
| `GET` | `/api/v1/organizations/:orgId/projects/:id` | viewer | Get project |
| `PUT` | `/api/v1/organizations/:orgId/projects/:id` | admin | Update project |
| `DELETE` | `/api/v1/organizations/:orgId/projects/:id` | admin | Delete project |

### Initiatives

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/initiatives` | viewer | List initiatives |
| `POST` | `/api/v1/organizations/:orgId/initiatives` | member | Create initiative |
| `PUT` | `/api/v1/organizations/:orgId/initiatives/:id` | member | Update initiative |
| `DELETE` | `/api/v1/organizations/:orgId/initiatives/:id` | admin | Delete initiative |

### Vector Memory

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/memory/store` | member | Store an embedding in org memory |
| `POST` | `/api/v1/memory/query` | viewer | Query org memory by similarity |

### Auth & AI

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/firebase-session` | Exchange Firebase ID token for session cookie |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `POST` | `/api/gemini/generate` | Gemini text generation proxy |
| `POST` | `/api/gemini/generate/stream` | Gemini streaming (SSE) |
| `POST` | `/api/gemini/embed` | Gemini embeddings proxy |
| `POST` | `/api/mistral/chat` | Mistral chat proxy |
| `POST` | `/api/azure-openai/chat` | Azure OpenAI chat proxy |
| `GET` | `/api/github/repos` | List GitHub repos for authed user |
| `GET` | `/api/ai/stream/:operationId` | SSE stream for async AI operations |
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/feature-flags` | Active feature flags |

### Request Validation

All `POST`/`PUT` endpoints validate the request body with **Zod**. On validation failure the server returns:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "name", "message": "String must contain at least 2 character(s)" }
  ]
}
```

---

## Authentication

The platform uses **Firebase Authentication** with two social providers:

```
Browser                    Firebase              Express Server
  │                           │                       │
  │── signInWithPopup() ──►  │                       │
  │◄── FirebaseUser ─────────│                       │
  │── getIdToken() ──────────────────────────────►  │
  │                           │         verifyIdToken()│
  │◄── session cookie ───────────────────────────────│
  │                           │                       │
  │── API request (Bearer <token>) ─────────────►   │
  │                           │      authorize(role)  │
  │◄── JSON response ────────────────────────────────│
```

- **Client**: `signInWithPopup(auth, githubProvider | googleProvider)` → Firebase manages the OAuth flow
- **Server**: `RBAC middleware` reads `Authorization: Bearer <idToken>`, verifies via Firebase Admin SDK, checks org membership and role
- **Session**: `auth_session` cookie (httpOnly, sameSite=strict) set after server verification
- **Axios interceptor**: automatically attaches the current user's Firebase ID token to every API request

---

## Feature Flags

Eight environment-driven feature flags control optional capabilities. All default to **enabled** except `otel_tracing`.

| Flag | Default | Controls |
|---|---|---|
| `ai_streaming` | on | Server-sent events for streaming AI responses |
| `vector_memory` | on | Per-org vector memory store and query |
| `github_api` | on | GitHub repo/commit integration |
| `google_auth` | on | Google social sign-in provider |
| `predictive_core` | on | TensorFlow.js predictive analytics |
| `war_room` | on | Real-time collaborative war room feature |
| `construct_view` | on | Architecture construct visualization |
| `otel_tracing` | **off** | OpenTelemetry distributed tracing |

Toggle by setting `FEATURE_FLAG_<NAME>=true|false` in `.env.local`.

---

## Deployment

### Docker

```bash
# Build image
npm run docker:build

# Run (pass your .env.local as env-file)
docker run --env-file .env.local -p 5000:5000 cognisys-ba
```

### Google Cloud Run (CI/CD)

The repository ships with a `cloudbuild.yaml` and `.github/workflows/ci.yml`.

**CI pipeline** (on every push to `main` or `dev`):
1. `npm ci --legacy-peer-deps`
2. Stub `generated_schemas.json` → run Vitest (74 tests)
3. TypeScript typecheck
4. Generate full schemas → Vite production build
5. Bundle size report (artifact)

**Deployment**: push to `main` triggers Cloud Build → builds Docker image → deploys to Cloud Run.

Set these secrets in your GitHub repository settings:
- `GEMINI_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT`
- `MISTRAL_API_KEY` (optional)

---

## Contributing

> **Branch strategy**: `feature branches → PR → dev`. The `main` branch is protected; only `dev` merges into `main` via PR.

```bash
# Start a feature
git checkout dev && git pull
git checkout -b feat/my-feature

# Run tests before pushing
npm test

# Open PR targeting dev
gh pr create --base dev
```

- Follow the existing TypeScript strict-mode conventions
- All new API endpoints must have Zod validation and a corresponding Vitest test
- Pre-commit hooks (husky + lint-staged) run ESLint automatically

---

<div align="center">
Built with ❤️ by the CogniSys team
</div>
