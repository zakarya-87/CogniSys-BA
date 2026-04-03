# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps separately for layer caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --legacy-peer-deps

# Copy source and build the Vite frontend
COPY . .
RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S cognisys -u 1001 -G nodejs
WORKDIR /app

# Only install production deps in runtime stage
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --legacy-peer-deps --omit=dev

# Copy built frontend and server source
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Generated schemas are required by server at runtime
COPY --from=builder /app/generated_schemas.json ./generated_schemas.json

# tsx is needed to run server.ts in production (install as prod dep)
RUN npm install tsx --ignore-scripts --legacy-peer-deps

USER cognisys

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

CMD ["node", "--loader", "tsx", "server.ts"]
