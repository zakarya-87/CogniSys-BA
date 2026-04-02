import { getAdminDb } from '../lib/firebaseAdmin';
import type { DocumentData, WithFieldValue } from 'firebase-admin/firestore';

export abstract class BaseRepository<T extends DocumentData> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getById(id: string): Promise<T | null> {
    const docRef = getAdminDb().collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();
    return docSnap.exists ? (docSnap.data() as T) : null;
  }

  async create(id: string, data: WithFieldValue<T>): Promise<void> {
    await getAdminDb().collection(this.collectionName).doc(id).set(data);
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await getAdminDb().collection(this.collectionName).doc(id).update(data as any);
  }

  async delete(id: string): Promise<void> {
    await getAdminDb().collection(this.collectionName).doc(id).delete();
  }
}
