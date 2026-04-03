/**
 * In-memory store for async AI operations.
 * Tracks status, result, and SSE subscribers for each operation.
 * Operations are cleaned up after TTL_MS (default 5 minutes).
 */

export type OperationStatus = 'pending' | 'running' | 'complete' | 'error';

export interface Operation {
  id: string;
  status: OperationStatus;
  result?: string;
  error?: string;
  createdAt: number;
}

type Subscriber = (event: string, data: string) => void;

const TTL_MS = 5 * 60 * 1000; // 5 minutes

const operations = new Map<string, Operation>();
const subscribers = new Map<string, Set<Subscriber>>();

export function createOperation(id: string): Operation {
  const op: Operation = { id, status: 'pending', createdAt: Date.now() };
  operations.set(id, op);
  subscribers.set(id, new Set());
  // Auto-cleanup after TTL
  setTimeout(() => {
    operations.delete(id);
    subscribers.delete(id);
  }, TTL_MS);
  return op;
}

export function getOperation(id: string): Operation | undefined {
  return operations.get(id);
}

export function updateOperation(id: string, patch: Partial<Operation>): void {
  const op = operations.get(id);
  if (!op) return;
  Object.assign(op, patch);
  // Notify all SSE subscribers
  const subs = subscribers.get(id);
  if (!subs) return;
  if (patch.status === 'complete' && patch.result !== undefined) {
    emit(subs, 'complete', { text: patch.result });
  } else if (patch.status === 'error' && patch.error !== undefined) {
    emit(subs, 'error', { error: patch.error });
  } else if (patch.status === 'running') {
    emit(subs, 'progress', { status: 'running' });
  }
}

export function subscribe(id: string, cb: Subscriber): () => void {
  const subs = subscribers.get(id);
  if (!subs) return () => {};
  subs.add(cb);
  return () => subs.delete(cb);
}

function emit(subs: Set<Subscriber>, event: string, data: unknown): void {
  const payload = JSON.stringify(data);
  for (const cb of subs) {
    try { cb(event, payload); } catch { /* ignore disconnected clients */ }
  }
}
