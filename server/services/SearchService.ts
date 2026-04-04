import { getAdminDb } from '../lib/firebaseAdmin';

export interface SearchResult {
  type: 'initiative' | 'project';
  id: string;
  orgId: string;
  name: string;
  description?: string;
  score: number; // simple relevance: 2=name match, 1=description match
}

export class SearchService {
  /**
   * Case-insensitive substring search across initiatives and projects for an org.
   * Firestore doesn't support full-text search natively; this fetches the collection
   * and filters in-memory. For scale, replace with Algolia/Typesense.
   */
  static async search(
    orgId: string,
    query: string,
    type: 'initiatives' | 'projects' | 'all' = 'all',
    limit = 20,
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    if (type === 'all' || type === 'initiatives') {
      const snap = await getAdminDb()
        .collection('initiatives')
        .where('orgId', '==', orgId)
        .limit(200)
        .get();

      for (const doc of snap.docs) {
        const d = doc.data();
        const nameMatch = (d.name as string ?? '').toLowerCase().includes(q);
        const descMatch = (d.description as string ?? '').toLowerCase().includes(q);
        if (nameMatch || descMatch) {
          results.push({
            type: 'initiative',
            id: doc.id,
            orgId,
            name: d.name as string,
            description: d.description as string | undefined,
            score: nameMatch ? 2 : 1,
          });
        }
      }
    }

    if (type === 'all' || type === 'projects') {
      const snap = await getAdminDb()
        .collection('projects')
        .where('orgId', '==', orgId)
        .limit(200)
        .get();

      for (const doc of snap.docs) {
        const d = doc.data();
        const nameMatch = (d.name as string ?? '').toLowerCase().includes(q);
        const descMatch = (d.description as string ?? '').toLowerCase().includes(q);
        if (nameMatch || descMatch) {
          results.push({
            type: 'project',
            id: doc.id,
            orgId,
            name: d.name as string,
            description: d.description as string | undefined,
            score: nameMatch ? 2 : 1,
          });
        }
      }
    }

    // Sort by score desc, then name asc
    return results
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, limit);
  }
}
