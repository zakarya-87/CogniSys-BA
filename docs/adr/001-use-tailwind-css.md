# ADR 001: Use Tailwind CSS for Styling

## Status
Accepted

## Context
The project requires a styling solution that is efficient, scalable, and integrates well with React and Vite. We need to avoid CSS-in-JS libraries or separate CSS files to keep the codebase clean and maintainable.

## Decision
We have decided to use Tailwind CSS as our primary styling framework.

## Consequences
- **Pros:**
  - Rapid development with utility classes.
  - Consistent design system via Tailwind configuration.
  - No need to manage separate CSS files or complex CSS-in-JS setups.
  - Small bundle size.
- **Cons:**
  - Requires learning Tailwind utility classes.
  - Can lead to long class strings in JSX.
