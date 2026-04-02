import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export class AuthService {
  static async setCustomUserClaims(uid: string, claims: object): Promise<void> {
    await admin.auth().setCustomUserClaims(uid, claims);
  }

  static async getUserClaims(uid: string): Promise<object | undefined> {
    const user = await admin.auth().getUser(uid);
    return user.customClaims;
  }
}
