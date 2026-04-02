import { getAdminDb } from '../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export class AuditLogService {
  static async logAction(orgId: string, userId: string, action: string): Promise<void> {
    await getAdminDb().collection('audit_logs').add({
      orgId,
      userId,
      action,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
