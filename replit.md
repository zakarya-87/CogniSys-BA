# Cognisys BA - The Catalyst Hub

## Overview
A full-stack AI-driven Enterprise Architecture and Business Analysis platform. Helps Business Analysts and Architects manage initiatives, projects, and organizational structures through AI-powered tools.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, Framer Motion, Lucide React, Recharts, D3, Mermaid
- **Backend**: Express 5 (Node.js), Firebase Admin, Google Gemini AI
- **Build**: Vite 6 (used as middleware in development), TypeScript 5.8
- **Package Manager**: npm (with `--legacy-peer-deps` due to `@testing-library/react` peer conflict)
- **Runtime**: tsx for TypeScript execution

## Architecture
The app uses a **unified server** approach: Express serves the API routes, and Vite runs as middleware for serving the React SPA in development. In production, Express serves the built static files.

- `server.ts` — Entry point, boots Express + Vite middleware
- `server/` — Backend controllers, services, repositories, AI agents
- `components/` — React UI components (80+ AI tool components)
- `services/` — Client-side service layers (Gemini, Firebase, etc.)
- `context/` — React Context providers
- `public/locales/` — i18n translation files (en, ar, fr)

## Environment Variables
Required for full functionality (optional to run):
- `GEMINI_API_KEY` — Google Gemini AI (for AI features)
- `MISTRAL_API_KEY` — Mistral AI (optional fallback)
- `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME` — Azure OpenAI (optional fallback)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — GitHub OAuth
- `FIREBASE_SERVICE_ACCOUNT` — Firebase Admin (JSON string)

## Development
```bash
npm run dev   # Starts Express + Vite on port 5000
```

## Port Configuration
- Frontend + Backend: **port 5000** on `0.0.0.0`

## Key Fixes Applied During Import
1. Changed server port from 3000 → 5000 to match Replit webview requirement
2. Added `allowedHosts: true` to Vite config for Replit proxy compatibility
3. Fixed `firebase-admin` v13 import (switched from namespace to named imports)
4. Made `GoogleGenAI` initialization lazy in all service files to prevent crash when no API key is configured
5. Fixed CSS `@import` ordering (Google Fonts import must precede Tailwind)
6. Installed dependencies with `--legacy-peer-deps` due to `@testing-library/react` React 18/19 conflict
