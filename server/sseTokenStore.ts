import { randomBytes } from 'crypto';

interface SseTokenEntry {
  userId: string;
  operationId: string;
  expiresAt: number;
}

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes
const sseTokens = new Map<string, SseTokenEntry>();

/** Generate a single-use SSE token tied to a user and operation. */
export function createSseToken(userId: string, operationId: string): string {
  const token = randomBytes(32).toString('hex');
  sseTokens.set(token, {
    userId,
    operationId,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

/**
 * Validate and consume an SSE token. Returns the userId if valid, null otherwise.
 * The token is single-use: it is deleted after validation.
 */
export function validateSseToken(token: string, operationId: string): string | null {
  const entry = sseTokens.get(token);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    sseTokens.delete(token); // clean up expired token
    return null;
  }
  // Don't consume the token on wrong operationId — prevents DoS via token invalidation
  if (entry.operationId !== operationId) return null;

  sseTokens.delete(token); // single-use: consume only on successful validation
  return entry.userId;
}

/** Periodic cleanup of expired tokens (runs every 60s). */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of sseTokens) {
    if (now > entry.expiresAt) sseTokens.delete(key);
  }
}, 60_000);
