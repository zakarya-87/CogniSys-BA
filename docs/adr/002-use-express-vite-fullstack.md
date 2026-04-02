# ADR 002: Use Express + Vite for Full-Stack Architecture

## Status
Accepted

## Context
The application requires server-side logic for API key management, database interactions, and secure proxying for third-party AI APIs (e.g., Mistral, Azure OpenAI). A simple client-side SPA is insufficient.

## Decision
We have decided to use an Express server integrated with Vite as middleware to support full-stack capabilities while maintaining a unified development and production build process.

## Consequences
- **Pros:**
  - Secure handling of sensitive API keys on the server side.
  - Unified codebase (TypeScript) for both frontend and backend.
  - Efficient development with Vite middleware.
  - Simplified production deployment as a single Node.js application.
- **Cons:**
  - Increased complexity compared to a pure SPA.
  - Requires careful management of server-side dependencies and environment variables.
