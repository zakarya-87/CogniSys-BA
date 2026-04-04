import type { Response } from 'express';
import { logger } from '../logger';

/**
 * SseManager — singleton that tracks active SSE connections per userId.
 * NotificationService calls push() to deliver events in real time.
 */
class SseManager {
  private connections = new Map<string, Set<Response>>();

  /** Register a new SSE connection for a user. */
  add(userId: string, res: Response): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(res);
    logger.info({ userId }, 'SSE client connected');
  }

  /** Remove a connection (called on client disconnect). */
  remove(userId: string, res: Response): void {
    this.connections.get(userId)?.delete(res);
    if (this.connections.get(userId)?.size === 0) {
      this.connections.delete(userId);
    }
    logger.info({ userId }, 'SSE client disconnected');
  }

  /** Push a JSON event to all connections for a user. */
  push(userId: string, event: string, data: unknown): void {
    const conns = this.connections.get(userId);
    if (!conns || conns.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of conns) {
      try {
        res.write(payload);
      } catch {
        conns.delete(res);
      }
    }
  }

  /** Number of currently connected users. */
  get connectedUsers(): number {
    return this.connections.size;
  }
}

export const sseManager = new SseManager();
