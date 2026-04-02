# UI/UX Improvement Plan - CogniSys BA

## 1. Design Audit Findings

### Visual Hierarchy & Layout
* **Dashboard Overload**: The dashboard and intelligence center views present a lot of data without clear visual anchors.
* **Inconsistent Spacing**: Padding and margins vary between components, leading to a "jittery" layout.
* **Navigation**: The sidebar is functional but could be more refined with better active states and grouping.

### Typography
* **Scale**: The current typography scale is inconsistent. Headings and body text need better definition.
* **Readability**: Line heights and letter spacing are mostly defaults, which can be improved for better legibility in data-heavy views.

### Color & Contrast
* **Mixed Systems**: The app uses a mix of hardcoded Tailwind colors (e.g., `bg-gray-100`) and semantic colors (e.g., `bg-background-light`).
* **Dark Mode**: Dark mode is implemented but some components lack proper contrast or use inconsistent surface colors.

### UX Friction
* **Feedback**: Loading states and empty states are minimal.
* **Interactions**: Hover and active states for buttons and cards could be more distinct.

---

## 2. Design System Definition

### Colors (Semantic Palette)
* **Primary**: `#050a1f` (Deep Navy) - Brand identity.
* **Secondary**: `#00d4ff` (Cyan) - Accents and highlights.
* **Background**:
    * Light: `#f8fafc` (Slate 50)
    * Dark: `#020617` (Slate 950)
* **Surface**:
    * Light: `#ffffff`
    * Dark: `#0f172a` (Slate 900)
* **Border**:
    * Light: `#e2e8f0` (Slate 200)
    * Dark: `#1e293b` (Slate 800)
* **Text**:
    * Primary: `Slate 900` (Light) / `Slate 50` (Dark)
    * Secondary: `Slate 600` (Light) / `Slate 400` (Dark)
    * Muted: `Slate 400` (Light) / `Slate 500` (Dark)

### Typography (Inter)
* **H1**: 2.25rem (36px), Bold, Tracking-tight
* **H2**: 1.875rem (30px), Bold, Tracking-tight
* **H3**: 1.5rem (24px), SemiBold
* **Body**: 1rem (16px), Regular, Leading-relaxed
* **Small**: 0.875rem (14px), Medium

### Spacing
* **Base Unit**: 4px
* **Scale**: 4, 8, 12, 16, 24, 32, 48, 64

---

## 3. Implementation Roadmap

### Phase 1: Foundation (Design System)
1. **Refactor Tailwind Configuration**: Move to a centralized CSS file or refine the `index.html` config to be more comprehensive.
2. **Standardize UI Components**: Update `Button`, `Card`, and `Input` to use the new semantic palette.

### Phase 2: Layout & Navigation
1. **Sidebar Redesign**: Improve grouping, icons, and active states.
2. **Header Optimization**: Standardize the header across all views with clear breadcrumbs or titles.

### Phase 3: View Refactoring
1. **Dashboard**: Implement a bento-grid style layout for key metrics.
2. **Initiatives List**: Improve card layout and filtering UI.
3. **Intelligence Center**: Simplify the layout and improve the AI interaction experience.

### Phase 4: UX & Polish
1. **Animations**: Use `motion` for subtle transitions between views and modal entries.
2. **Empty States**: Add meaningful empty states for all views.
3. **Accessibility**: Audit and fix contrast and keyboard navigation.
