# CogniSys BA — Dashboard Design Implementation Plan

## Overview

This document outlines the remaining implementation work needed to complete the premium data display dashboard for CogniSys BA — The Catalyst Hub. The dashboard targets an enterprise-ready, futuristic UI with glassmorphism, the new Electric Teal brand palette, and structured data display for initiatives, artifacts, predictive analytics, and the War Room.

---

## Completed Work (Phases 1–3)

| Component | File | Description |
|-----------|------|-------------|
| **Design System Colors** | `index.css` | Replaced full @theme palette: Deep Blue `#0A2463`, Medium Blue `#3E92CC`, Electric Teal `#00D4AA`, Light Teal `#7FDBDA`, Silver `#C5D5E0`. Aliased `accent-purple` → `#00D4AA` for 100+ existing references. |
| **Glassmorphism Utilities** | `index.css` | `.glass-card`, `.glass-card-light`, `.glass-surface`, `.glass-surface-light`, `.metallic-sheen` |
| **Typography** | `index.css` | `.tabular-nums`, heading `tracking-tight`, `font-semibold` defaults |
| **Skeleton Loader** | `components/ui/Skeleton.tsx` | Variants: `line`, `circle`, `rect`, `card`. Composites: `SkeletonTable`, `SkeletonCard`. CSS shimmer animation. |
| **DataTable** | `components/ui/DataTable.tsx` | Generic `<DataTable<T>>` — sortable columns, pagination, custom cell renderers, loading/empty states |
| **ComplianceBadge** | `components/ui/ComplianceBadge.tsx` | Maps sector → compliance standard (PCI-DSS, HIPAA, SOC 2, FedRAMP, CMMC, NERC CIP, ISO 27001) |
| **Dashboard KPI Upgrade** | `components/Dashboard.tsx` | Glass KPI cards (4-column grid), AI Confidence stat, `metallic-sheen` overlay |
| **InitiativesList Upgrade** | `components/InitiativesList.tsx` | Uses DataTable + ComplianceBadge + ConfidenceBar. Replaced manual table. |
| **ArtifactGrid** | `components/features/artifacts/ArtifactGrid.tsx` | Masonry grid with SWOT/BMC/C4 mini-previews, type filtering, search |
| **WarRoomDebateFeed** | `components/features/strategy/WarRoomDebateFeed.tsx` | Structured debate feed with agent avatars, sentiment indicators, consensus progress bar |
| **IndexedDB Cache** | `services/offlineCache.ts` | `idb`-based offline cache for initiatives, artifacts, hive state, settings. LRU eviction. |

---

## Remaining Work (8 Tasks)

### Phase A — Data Wiring & Card Enhancements

#### A1. Initiative Card Enhancement
**File:** `components/ui/Card.tsx`
**Dependencies:** Completed (design-system-colors, compliance-badge, glassmorphism)
**Scope:**
- Add `ComplianceBadge` showing the sector's compliance standard
- Add circular confidence score arc (SVG ring, 0–100%) 
- Add glassmorphism hover effect using `.glass-card` on dark mode
- Staggered entrance animation via `motion/react` with configurable delay
- Show "readiness" indicator (green/amber/red dot) based on status

#### A2. Predictive Charts — Real Data Wiring
**File:** `components/PredictiveCoreView.tsx`
**Dependencies:** Completed (design-system-colors)
**Scope:**
- Replace hardcoded Monte Carlo data with initiative artifact data (`initiative.artifacts.estimation`)
- Replace hardcoded Tornado variables with dynamic risk factors from `initiative.artifacts.risks`
- Add scenario selector dropdown (optimistic / baseline / pessimistic)
- Add "Export Chart" button (PNG via Chart.js `toBase64Image()`)
- Add skeleton loaders during data fetch
- Update Chart.js color palette to brand colors (teal gradients instead of purple)

#### A3. Artifact Detail Modal
**File:** `components/features/artifacts/ArtifactDetailModal.tsx` (new)
**Dependencies:** Completed (artifact-grid, glassmorphism)
**Scope:**
- Full-screen glassmorphism overlay modal
- Type-specific rendering:
  - **SWOT**: Interactive 2×2 grid with editable quadrants
  - **BMC**: Editable 9-block Business Model Canvas
  - **C4/BPMN**: Mermaid diagram rendered via existing `components/ui/Mermaid.tsx`
- Action toolbar: download JSON, export PNG, copy to clipboard, delete
- Version history sidebar (if `artifact.versions` array exists)
- Keyboard shortcut: `Escape` to close, `←/→` to navigate between artifacts

### Phase B — War Room & Debate Completion

#### B1. War Room Debate Controls
**File:** `components/features/strategy/WarRoomDebateFeed.tsx` (extend)
**Dependencies:** Completed (war-room-debate-log)
**Scope:**
- Topic input field with AI-powered suggestion autocomplete
- Agent selector: checkboxes to include/exclude Orchestrator, Scout, Guardian
- Speed control slider (debate generation pace: slow/normal/fast)
- The existing pause/resume/reset buttons are already wired — connect to actual Hive service
- Inject user argument that appears as a "Human" message in the debate feed

#### B2. War Room Consensus Visualization
**File:** `components/features/strategy/WarRoomConsensus.tsx` (new)
**Dependencies:** Completed (war-room-debate-log)
**Scope:**
- Animated consensus progress bar (already in WarRoomDebateFeed header — extract into reusable component)
- Position summary panel: side-by-side comparison showing each agent's current stance
- Force consensus button (triggers Orchestrator to synthesize final position)
- Outcome card with confidence score, risk assessment, and recommended action
- Transcript export (markdown download of full debate)

### Phase C — Offline & Performance

#### C1. Offline Integration
**File:** `context/InitiativeContext.tsx`, `context/ArtifactContext.tsx`, `hooks/useHivePersistence.ts`
**Dependencies:** Completed (indexeddb-cache)
**Scope:**
- **InitiativeContext**: On load, read from IndexedDB first (stale-while-revalidate), then fetch from API. On save, write to both IndexedDB and API.
- **ArtifactContext**: Cache generated artifacts to IndexedDB after server save. Serve from cache on offline.
- **useHivePersistence**: Migrate from `localStorage` to IndexedDB via `services/offlineCache.ts` (larger capacity, structured queries).
- **Online/Offline indicator**: Small dot in the Sidebar header — green when online, amber when offline.
- **Mutation queue**: When offline, queue `create`/`update`/`delete` operations. Replay on reconnect with conflict detection (server timestamp wins).

#### C2. Performance Polish
**Files:** Multiple (all new components)
**Dependencies:** All above tasks
**Scope:**
- Audit all new components for missing `useMemo` / `useCallback` (DataTable, ArtifactGrid, WarRoomDebateFeed)
- Verify code splitting: ensure ArtifactGrid, WarRoomDebateFeed, PredictiveCoreView are behind `React.lazy` in `App.tsx`
- Measure bundle size — target < 600KB initial JS (currently ~40–60% reduction via lazy loading)
- Add skeleton loaders to every async-loading view (replace `<Spinner />` fallbacks with contextual skeletons)
- Smooth motion transitions between views (fade + slide using `motion/react`)
- Run Lighthouse audit — target Performance ≥ 90, Accessibility ≥ 90

---

## Architecture Notes

### Chart Libraries
| Library | Usage | Files |
|---------|-------|-------|
| **Recharts** | Primary — ReportsView, IntelligenceCenter, AnalyticsDashboard | 3 files |
| **Chart.js** | Monte Carlo & Tornado diagrams (canvas-based, good for large datasets) | PredictiveCoreView |
| **D3** | Available for custom viz (ConceptModeler uses it) | As needed |
| **Mermaid** | C4, BPMN, sequence diagrams in artifact rendering | ArtifactDetailModal |

### State Management
| Store | Mechanism | Offline Plan |
|-------|-----------|------|
| Initiatives | Firestore real-time + in-memory state | IndexedDB cache + sync queue |
| Artifacts | Server-side via InitiativeAPI | IndexedDB cache |
| Hive State | localStorage per initiative | Migrate to IndexedDB |
| User Preferences | Firestore user doc | IndexedDB settings store |

### Brand Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#0A2463` | Deep Blue — backgrounds, structural elements |
| `--color-secondary` | `#3E92CC` | Medium Blue — secondary elements |
| `--color-accent-teal` | `#00D4AA` | Electric Teal — primary actions, highlights |
| `--color-accent-teal-light` | `#7FDBDA` | Light Teal — accents, hover states |
| `--color-silver` | `#C5D5E0` | Metallic Silver — text, borders, muted elements |
| `--color-accent-purple` | `#00D4AA` | Aliased to teal (backward compat for 100+ refs) |

---

## Task Priority & Dependency Graph

```
Phase A (Parallel — no inter-dependencies):
  A1 Initiative Card Enhancement ──┐
  A2 Predictive Charts Data ───────┼──→ Phase C
  A3 Artifact Detail Modal ────────┘

Phase B (Parallel — no inter-dependencies):
  B1 War Room Controls ────────────┐
  B2 War Room Consensus ───────────┼──→ Phase C

Phase C (Sequential — depends on A + B):
  C1 Offline Integration ──→ C2 Performance Polish
```

**Recommended execution:** Run Phase A and Phase B in parallel, then do Phase C last as the final polish pass.

---

## Verification Checklist

- [ ] All new components render without errors in both light and dark mode
- [ ] DataTable sorts, paginates, and handles empty/loading states
- [ ] ComplianceBadge maps all existing sectors to correct standards
- [ ] ArtifactGrid filters by type and renders mini-previews
- [ ] WarRoomDebateFeed scrolls, shows typing indicator, and accepts user input
- [ ] PredictiveCoreView charts use brand color palette
- [ ] IndexedDB cache stores and retrieves data correctly
- [ ] Bundle size < 600KB initial JS
- [ ] Lighthouse Performance ≥ 90
- [ ] No new TypeScript errors introduced (pre-existing errors are documented)
- [ ] Tests pass (101 passing, 1 pre-existing failure)
