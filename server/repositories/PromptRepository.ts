
import { getAdminDb } from '../lib/firebaseAdmin';
import { TPrompt, TPromptVersion } from '../types/prompts';
import { logger } from '../logger';

export class PromptRepository {
  private collection = getAdminDb().collection('prompts');

  async getLatest(promptId: string): Promise<TPrompt | null> {
    const doc = await this.collection.doc(promptId).get();
    if (!doc.exists) return null;
    return doc.data() as TPrompt;
  }

  async getVersion(promptId: string, version: string): Promise<TPromptVersion | null> {
    const doc = await this.collection.doc(promptId).collection('versions').doc(version).get();
    if (!doc.exists) return null;
    return doc.data() as TPromptVersion;
  }

  async save(prompt: TPrompt, author: string, comment?: string): Promise<void> {
    const batch = getAdminDb().batch();
    
    // Update main document (Latest)
    batch.set(this.collection.doc(prompt.id), {
      ...prompt,
      updatedAt: new Date().toISOString(),
      updatedBy: author
    });

    // Save to version history
    const versionDoc = this.collection.doc(prompt.id).collection('versions').doc(prompt.version);
    batch.set(versionDoc, {
      version: prompt.version,
      content: prompt.content,
      createdAt: new Date().toISOString(),
      author,
      comment
    });

    await batch.commit();
    logger.info({ promptId: prompt.id, version: prompt.version }, 'Prompt version saved');
  }

  async list(): Promise<TPrompt[]> {
    const snap = await this.collection.get();
    return snap.docs.map(d => d.data() as TPrompt);
  }
}
