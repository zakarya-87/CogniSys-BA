import { getAdminDb } from '../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class TaskQueue {
  static async addTask(orgId: string, type: string, payload: any): Promise<string> {
    const taskRef = await getAdminDb().collection('task_queue').add({
      orgId,
      type,
      payload,
      status: TaskStatus.PENDING,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return taskRef.id;
  }

  static async updateTaskStatus(taskId: string, status: TaskStatus, result?: any): Promise<void> {
    await getAdminDb().collection('task_queue').doc(taskId).update({
      status,
      result,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
