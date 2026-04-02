import { getAdminDb } from '../lib/firebaseAdmin';

export class PromptManager {
  static async getPrompt(promptId: string): Promise<string | null> {
    const promptSnap = await getAdminDb().collection('prompts').doc(promptId).get();
    return promptSnap.exists ? promptSnap.data()?.content : null;
  }
}
