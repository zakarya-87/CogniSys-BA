import { getAdminDb } from '../lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/** Max retry attempts before a task is moved to the DLQ. */
const MAX_TASK_RETRIES = 3;

export class TaskQueue {
  /**
   * Add a task with idempotency protection.
   * If a task with the same (orgId + initiativeId + type) is already PENDING or
   * PROCESSING, the existing task ID is returned without creating a duplicate.
   */
  static async addTask(orgId: string, type: string, payload: any): Promise<string> {
    const db = getAdminDb();

    // Build idempotency key from the logical composite
    const idempotencyInput = `${orgId}::${payload?.initiativeId ?? ''}::${type}`;
    const idempotencyKey = crypto.createHash('sha256').update(idempotencyInput).digest('hex');

    // Use the idempotency key as the document ID so we can do an atomic
    // read-check-write inside a Firestore transaction — no race condition.
    const taskRef = db.collection('task_queue').doc(idempotencyKey);

    return db.runTransaction(async (txn) => {
      const taskDoc = await txn.get(taskRef);
      if (taskDoc.exists) {
        const status = taskDoc.data()!.status as TaskStatus;
        if (status === TaskStatus.PENDING || status === TaskStatus.PROCESSING) {
          return taskRef.id; // already in-flight — return existing ID
        }
        // Completed or failed — fall through to re-enqueue
      }

      txn.set(taskRef, {
        orgId,
        type,
        payload,
        status: TaskStatus.PENDING,
        idempotencyKey,
        retryCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return taskRef.id;
    });
  }

  static async updateTaskStatus(taskId: string, status: TaskStatus, result?: any): Promise<void> {
    await getAdminDb().collection('task_queue').doc(taskId).update({
      status,
      result,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Record a task failure. If retryCount >= MAX_TASK_RETRIES the task is moved
   * to the dead-letter queue (`task_dlq`) and removed from `task_queue`.
   */
  static async recordFailure(taskId: string, reason: string, taskData: any): Promise<void> {
    const db = getAdminDb();
    const retryCount: number = (taskData.retryCount ?? 0) + 1;

    if (retryCount >= MAX_TASK_RETRIES) {
      // Move to DLQ
      await db.collection('task_dlq').add({
        ...taskData,
        originalTaskId: taskId,
        failureReason: reason,
        retryCount,
        movedToDlqAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await db.collection('task_queue').doc(taskId).delete();
    } else {
      // Increment retry count and mark as failed (worker will re-pick on next snapshot)
      await db.collection('task_queue').doc(taskId).update({
        status: TaskStatus.FAILED,
        lastError: reason,
        retryCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  /** Fetch all DLQ tasks for an org (used by the /tasks/failed endpoint). */
  static async getDlqTasks(orgId: string): Promise<any[]> {
    const snapshot = await getAdminDb()
      .collection('task_dlq')
      .where('orgId', '==', orgId)
      .orderBy('movedToDlqAt', 'desc')
      .limit(100)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}
