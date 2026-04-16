# Technology Stack

**Analysis Date:** 2026-04-12

## Languages

**Primary:**
- TypeScript 5.7+ - All application code (client and server)

**Secondary:**
- JavaScript (Node.js/ESM) - Build scripts, configuration files, legacy utilities

## Runtime

**Environment:**
- Node.js 20.x+ - Server-side execution and build environment
- Modern Browsers - Client-side execution (ES2020 target)

**Package Manager:**
- npm 10.x+
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.0 - UI Framework
- Express 5.2.1 - Backend Server Framework
- Vite 8.0.3 - Build Tooling and Dev Server

**Testing:**
- Vitest 4.1.2 - Unit and Integration testing
- Playwright 1.59.1 - End-to-End testing
- JSDOM - Browser environment simulation for tests

**Styling:**
- TailwindCSS 4.2.2 - Utility-first styling
- Motion (Framer) 12.38.0 - UI animations

## Key Dependencies

**Critical:**
- Firebase 12.11.0 - Client-side auth, hosting, and data sync
- Firebase Admin 13.7.0 - Server-side operations and secure access
- @google/genai 1.48.0 - Primary AI integration (Gemini)
- mathjs 15.1.1 - Precision mathematical calculations for Predictive Core
- Axios 1.14.0 - HTTP client for API proxies and external integrations
- Zod 4.3.6 - Schema validation and type safety

**Infrastructure:**
- Pino 10.3.1 - High-performance logging
- OpenTelemetry - Observability and tracing
- Sentry - Error monitoring and reporting

## Configuration

**Environment:**
- `.env.local`, `.env.example` - Environment variable management
- Key configs: `FIREBASE_API_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY` (server-only)

**Build:**
- `vite.config.ts` - Integrated build and test configuration
- `tsconfig.json` - TypeScript compiler parameters
- `firebase.json` - Firebase services configuration

## Platform Requirements

**Development:**
- Windows (Local), Unix-compatible (Docker/Deployment)
- Docker - Optional containerized development environment

**Production:**
- Google Cloud / Firebase Hosting - Frontend and static assets
- Cloud Functions / Cloud Run - Backend services and AI proxies

---

*Stack analysis: 2026-04-12*
*Update after major dependency changes*
