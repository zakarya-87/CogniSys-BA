# Codebase Structure

**Analysis Date:** 2026-04-12

## Directory Layout

```
cognisys-ba/
├── components/          # React UI components
│   ├── features/       # Feature-specific components (Hive, Cortex, etc.)
│   ├── layout/         # Shared layout components (Sidebar, Shell)
│   └── shared/         # Reusable atomic UI components
├── context/             # React Context providers for global state
├── docs/                # Project documentation and GSD resources
├── functions/           # Firebase Cloud Functions (Backend API)
├── hooks/               # Custom React hooks (useAIStream, etc.)
├── public/              # Static assets and i18n locales
├── scripts/             # Utility and seed scripts
├── server/              # Local dev server and API proxies
├── services/            # Business logic and external API clients
├── types.ts             # Global TypeScript type definitions
├── firebase.json        # Firebase configuration
├── package.json         # Project manifest
└── vite.config.ts       # Build and development configuration
```

## Directory Purposes

**components/features/**
- Purpose: Goal-oriented UI modules.
- Contains: `HiveView`, `CortexView`, `PredictiveCoreView`, `SettingsView`.
- Key files: `CortexView.tsx` - Main AI visualization hub.
- Subdirectories: `hive/`, `cortex/`, `analytics/`, `onboarding/`.

**services/**
- Purpose: Application business logic and state management.
- Contains: TypeScript service classes/modules.
- Key files: `hiveService.ts` - Orchestration logic; `aiService.ts` - AI provider management.
- Subdirectories: `ai/` - Specialized AI agent implementations.

**context/**
- Purpose: Global state providers for the React application.
- Contains: Context objects and Provider components.
- Key files: `CatalystContext.tsx` - Core application state; `AIContext.tsx`.

**hooks/**
- Purpose: Reusable UI logic and state synchronization.
- Contains: Functional React hooks.
- Key files: `useAIStream.ts` - Real-time AI response handling.

**functions/**
- Purpose: Serverless backend logic.
- Maintains: Independent Node.js environment.
- Key files: `index.ts` - Cloud Function entry points.

## Key File Locations

**Entry Points:**
- `index.tsx`: Client-side application entry.
- `server.ts`: Local development server entry.
- `functions/src/index.ts`: Production API entry points.

**Configuration:**
- `vite.config.ts`: Frontend build and dev server config.
- `firebase.json`: Firebase deployment and local emulator config.
- `tsconfig.json`: TypeScript compiler rules.
- `.env.local`: Local environment secrets.

**Core Logic:**
- `services/hiveService.ts`: Core mission orchestration hub.
- `services/aiService.ts`: Central AI routing and processing.
- `types.ts`: Centralized domain models and interfaces.

## Naming Conventions

**Files:**
- `PascalCase.tsx`: React components.
- `camelCase.ts`: Services, hooks, and utility modules.
- `*.test.ts`: Unit and integration tests.
- `NAME.md`: Core architectural documentation.

**Directories:**
- `kebab-case`: All directory names.
- Plural names: `components`, `services`, `hooks`, `functions`.

## Where to Add New Code

**New Feature:**
- UI components: `components/features/[feature-name]/`
- Business logic: `services/[feature-name]Service.ts`
- State: `context/[Feature]Context.tsx`

**New API Integration:**
- Client service: `services/[service]Service.ts`
- Backend proxy: `server/api/[service].ts` (for local) and `functions/src/` (for production).

**Shared UI Component:**
- Implementation: `components/shared/`

---

*Structure analysis: 2026-04-12*
*Update when directory structure changes*
