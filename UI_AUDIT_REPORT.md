# Catalyst Hub — UI/UX Audit Report

> **Audited:** 2026-04-14  
> **Auditor:** Antigravity (AI Quality Assurance)  
> **Environment:** `localhost:5000` — Vite dev server, Chrome  
> **Design Reference:** Aether Carbon Design System (Electric Teal `#00D4AA`, Deep Blue `#0A2463`, Glassmorphism)  
> **Methodology:** Live browser screenshots + static code analysis across 4 critical viewport widths

---

## Scope & Viewports

| Viewport | Width | Height | Device |
|---|---|---|---|
| Mobile | 375px | 812px | iPhone-class |
| Tablet | 768px | 1024px | iPad-class |
| Desktop | 1280px | 900px | Standard laptop |
| Large Desktop | 1920px | 1080px | Full HD monitor |

---

## 🚨 CRITICAL (Red) — Broken Experience

### C-01 · Purple accent color — widespread violation of design tokens

- **Issue:** `accent-purple` (`#8B5CF6`) remains the **dominant** interactive color across all views, directly contradicting the Aether Carbon mandate. Purple is visible in: active nav links, the Hive FAB button, the "Force Consensus" button, active mode pills in Vision Board, all Oracle chat bubbles, avatar rings, send buttons, and the entire Cortex insights sidebar.
- **Viewport(s):** All — 375px, 768px, 1280px, 1920px
- **Affected Files:**
  - `components/CortexView.tsx` — lines 118, 121, 125, 134, 138, 142, 177, 209, 280, 290–322, 335
  - `components/OracleView.tsx` — lines 57, 63–66, 79, 91, 99, 118, 124, 128, 143, 159, 195
  - `components/Dashboard.tsx` — line 90 (stat card 0: Folder icon)
- **Root Cause:** The Purple → Teal token swap was applied to node link colors in the SVG graph but **not** extended to the surrounding UI shell, toolbar, insights panel, or Oracle interface.
- **Fix:** Global find-and-replace of all `accent-purple` utility classes with `accent-teal` equivalents throughout `OracleView.tsx` and `CortexView.tsx`.

---

### C-02 · Mobile sidebar does not collapse — layout broken below 768px

- **Issue:** The right-side insights sidebar (`w-96`) is a **fixed-width, always-visible** panel. At 375px it occupies ~30% of the viewport width, occludes the main content, and provides no escape mechanism (no hamburger menu, no drawer, no collapse button). The application is functionally inaccessible on mobile devices.
- **Viewport(s):** 375px, 768px
- **Affected Files:** `components/CortexView.tsx` line 277 (`<aside className="w-96 ...">`); main layout shell in `App.tsx` or equivalent
- **Fix:** Add a responsive drawer pattern — at `md:` breakpoint the sidebar should become a slide-over panel triggered by a floating action button. The `w-96` should become `hidden md:flex` with a toggle state.

---

### C-03 · Hardcoded SVG stroke colors bypass the design system

- **Issue:** The Cortex graph SVG uses inline hex values (`stroke="#00d4ff"`, `fill="#0F172A"`) that bypass CSS variables entirely. These will not respond to theme changes and use **cyan** (`#00d4ff`) rather than **teal** (`#00D4AA`) — a perceptibly different hue (blue-green vs green-teal).
- **Viewport(s):** Desktop+
- **Affected Files:** `components/CortexView.tsx` — lines 238, 244, 252
- **Fix:** Replace all inline `stroke` and `fill` hex values with `currentColor` or CSS variable references.

---

## ⚠️ INCONSISTENT (Yellow) — Design Drift

### Y-01 · CortexView toolbar hover states — purple instead of teal

- **Issue:** Zoom controls, select tool, pan tool, and filter button all use `hover:bg-accent-purple/10 hover:text-accent-purple`. The active filter state uses `bg-accent-purple/10 text-accent-purple`. The Maximize button uses `bg-accent-purple shadow-accent-purple/20`.
- **Example 1 (Select/Pan):** `hover:text-accent-purple` — `CortexView.tsx` lines 118, 121
- **Example 2 (Maximize):** `bg-accent-purple shadow-accent-purple/20` — `CortexView.tsx` line 142
- **Fix:** Replace with `hover:bg-accent-teal/10 hover:text-accent-teal` and `bg-accent-teal shadow-accent-teal/20`.

---

### Y-02 · Cortex insights sidebar — all icons and badges are purple

- **Issue:** Brain icon, Zap icon, Lightbulb icon, "Pattern / Opportunity / Risk" badge labels, textarea focus ring, and the Send button in the Cortex right panel all use `accent-purple`.
- **Example 1:** `<Brain className="text-accent-purple">` — `CortexView.tsx` line 280
- **Example 2:** `<button className="bg-accent-purple ...">` (Send) — `CortexView.tsx` line 335
- **Fix:** Replace all `accent-purple` references in the aside block with `accent-teal`.

---

### Y-03 · OracleView — purple leakage across header, chat bubbles, and input

- **Issue:** The Oracle ambient background gradient is `from-accent-purple/10`, the title gradient is `from-accent-purple to-accent-purple/60`, the user chat bubble is `bg-accent-purple`, the AI avatar is `from-accent-purple to-accent-purple/80`, the send button is `bg-accent-purple`, and the focus ring is `focus:ring-accent-purple`.
- **Example 1:** `bg-accent-purple text-white rounded-3xl` (user bubble) — `OracleView.tsx` line 91
- **Example 2:** `bg-gradient-to-br from-accent-purple to-accent-purple/80` (avatar) — `OracleView.tsx` line 99
- **Fix:** Full purple-to-teal token swap in `OracleView.tsx`. The ambient gradient should become `from-accent-teal/5`.

---

### Y-04 · Dashboard stats — four different icon colors, not unified

- **Issue:** The four stat cards use four different accent colors (`accent-purple`, `accent-blue`, `accent-green`, `accent-teal`), creating a rainbow of token exceptions rather than a unified Aether Carbon identity. Only the 4th card (AI Confidence) correctly uses teal.
- **Example 1 (Card 0):** `color: 'text-accent-purple', bg: 'bg-accent-purple/10'` — `Dashboard.tsx` line 90
- **Example 2 (Card 2):** `color: 'text-accent-green', bg: 'bg-accent-green/10'` — `Dashboard.tsx` line 106
- **Current State:** All card hover states (`group-hover:bg-accent-teal/10`) correctly animate to teal on hover — the issue is the resting state only.
- **Fix:** Unify all four stat cards to `text-accent-teal / bg-accent-teal/10`.

---

### Y-05 · Touch target violations at 375px

- **Issue:** Several interactive elements fail the **44×44px** minimum tap target threshold required for accessible mobile design.
- **Example 1 (Toolbar buttons):** `p-2.5` padding with `w-5 h-5` icon = ~42px computed hit area — `CortexView.tsx` lines 119, 122
- **Example 2 (Zoom controls):** `p-2` padding with `w-4 h-4` icon = ~32px computed hit area — `CortexView.tsx` lines 135, 139
- **Fix:** Increase toolbar button padding to `p-3` minimum; zoom controls to `p-2.5`.

---

### Y-06 · Mixed RTL / LTR localization in sidebar navigation

- **Issue:** Navigation labels alternate between Arabic RTL (`غرفة العمليات`, `لوحة الرؤية`, `البناء`) and English LTR (`Initiatives`, `The Oracle`) within the same flex column, without per-item `dir` attribute overrides. This causes inconsistent text alignment and breaks the visual grid rhythm of the sidebar.
- **Viewport(s):** All
- **Fix:** Either fully localize all nav labels via `i18n` keys, or apply `dir="auto"` to each nav item element.

---

## ✅ PASS (Green) — Noteworthy Good Practice

### G-01 · Glassmorphism — correctly scales to 1920px

The `.glass-card` and `.glass-surface` utilities maintain consistent `backdrop-filter: blur(24px) saturate(160%)`, specular top-border highlights, and `box-shadow: 0 20px 50px -12px rgba(0,0,0,0.5)` across all viewport widths. Depth is achieved entirely through light and shadow — the "No-Line" rule is executed correctly at larger viewports.

### G-02 · Electric Teal CTA — correctly implemented

The "New Initiative" primary button is the single best-implemented element in the codebase. It correctly uses `bg-accent-teal`, `text-primary` (deep blue text on teal background), `shadow-[0_20px_50px_rgba(0,212,170,0.3)]` ambient glow, and `hover:-translate-y-2` micro-lift — fully aligned with Aether Carbon intent.

### G-03 · Entry animations — premium spring physics

`AnimatePresence` + `motion.div` entry animations use custom easing `[0.16, 1, 0.3, 1]` (a spring-like overshoot curve), staggered delays per card, and varied entry states (`fade-in`, `slide-in-from-bottom-4`, `zoom-in-95`). This gives the interface a premium, alive quality that significantly elevates the perceived design fidelity.

### G-04 · Custom scrollbar — subtle and brand-coherent

The `.custom-scrollbar` and global `::-webkit-scrollbar` styles use `w-1.5` thin tracks with `bg-slate-600/30` thumbs that darken on hover — invisible at rest but discoverable. This avoids the harsh OS-default scrollbar that would break the glassmorphism aesthetic.

---

## Priority Fix Matrix

| ID | Priority | Issue | Files | Estimated Effort |
|---|---|---|---|---|
| C-01 | 🔴 P0 | Replace `accent-purple` → `accent-teal` in Oracle | `OracleView.tsx` | ~30 min |
| C-02 | 🔴 P0 | Add mobile sidebar collapse / hamburger drawer | `CortexView.tsx`, layout shell | ~2 hrs |
| C-03 | 🔴 P0 | Fix hardcoded SVG strokes (`#00d4ff` → `#00D4AA`) | `CortexView.tsx` | ~15 min |
| Y-01 | 🟡 P1 | Replace `accent-purple` → `accent-teal` in Cortex toolbar | `CortexView.tsx` | ~20 min |
| Y-02 | 🟡 P1 | Replace `accent-purple` → `accent-teal` in Cortex sidebar | `CortexView.tsx` | ~20 min |
| Y-03 | 🟡 P1 | Full purple-to-teal swap in Oracle view | `OracleView.tsx` | ~30 min |
| Y-04 | 🟡 P1 | Unify Dashboard stat card colors to teal | `Dashboard.tsx` | ~10 min |
| Y-05 | 🟡 P2 | Increase toolbar touch targets to 44px minimum | `CortexView.tsx` | ~10 min |
| Y-06 | 🟢 P3 | Resolve RTL/LTR nav label mixing | Sidebar / i18n keys | ~45 min |

---

## Final Verdict

**Design System Health: 4/10** — The Aether Carbon structural layer (glassmorphism, shadows, grid, typography scale, animations) is well-implemented. However, the color token system is only ~40% applied. `accent-purple` dominates the two most-visited modules (Oracle and Cortex), directly undermining the Electric Teal brand identity.

**Frontend Resilience Score: 3/10** — The layout is polished and fluid at desktop breakpoints. However, the complete absence of a responsive sidebar collapse mechanism makes the application non-functional on mobile devices — a foundational gap that must be closed before any production or user testing deployment.

---

*Report generated by Antigravity AI — CogniSys BA / Catalyst Hub Modernization Sprint*
