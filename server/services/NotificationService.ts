import { randomUUID } from 'crypto';
import { getAdminDb } from '../lib/firebaseAdmin';
import { sseManager } from './SseManager';

export type NotificationType =
  | 'org_invitation'
  | 'member_joined'
  | 'member_removed'
  | 'role_changed'
  | 'initiative_created'
  | 'initiative_approved'
  | 'ai_complete';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export class NotificationService {
  private static col(userId: string) {
    return getAdminDb().collection('notifications').doc(userId).collection('items');
  }

  /** Create a notification for a user. */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    payload?: Record<string, unknown>,
  ): Promise<AppNotification> {
    const notification: AppNotification = {
      id: randomUUID(),
      userId,
      type,
      title,
      message,
      payload,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await NotificationService.col(userId).doc(notification.id).set(notification);
    // Push to SSE stream if user is connected
    sseManager.push(userId, 'notification', notification);
    return notification;
  }

  /** Get notifications for a user (newest first). */
  static async getNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<AppNotification[]> {
    let query: FirebaseFirestore.Query = NotificationService.col(userId).orderBy('createdAt', 'desc');
    if (options?.unreadOnly) query = query.where('read', '==', false);
    query = query.limit(options?.limit ?? 50);
    const snap = await query.get();
    return snap.docs.map((d) => d.data() as AppNotification);
  }

  /** Mark a notification as read. */
  static async markRead(userId: string, notificationId: string): Promise<void> {
    const ref = NotificationService.col(userId).doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
    await ref.update({ read: true });
  }

  /** Mark all notifications as read for a user. */
  static async markAllRead(userId: string): Promise<void> {
    const snap = await NotificationService.col(userId).where('read', '==', false).get();
    const batch = getAdminDb().batch();
    for (const doc of snap.docs) batch.update(doc.ref, { read: true });
    await batch.commit();
  }
}
