
import { logger } from '../logger';

export class SqlService {
  /**
   * Execute a "Safe" read-only query.
   * In a real app, this would use a read-replica and strict sanitization.
   */
  async query(sql: string): Promise<any[]> {
    logger.info({ sql }, '[SqlService] Executing query');
    
    // Allowlist approach: the query must be a single SELECT statement.
    // Strip leading/trailing whitespace and trailing semicolons, then verify
    // the entire query is a plain SELECT (no UNION, sub-selects via WITH/CTE,
    // semicolons that could chain statements, or write keywords).
    const trimmed = sql.trim().replace(/;\s*$/, '');

    const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|MERGE|GRANT|REVOKE|EXEC|EXECUTE|CALL|UNION|INTO\s+OUTFILE|INTO\s+DUMPFILE|LOAD_FILE)\b/i;
    const hasComments = /(--|\/\*|\*\/|#)/.test(trimmed);
    const hasMultipleStatements = /;/.test(trimmed);
    const hasSubquery = /\(\s*SELECT\b/i.test(trimmed);
    const startsWithSelect = /^\s*SELECT\b/i.test(trimmed);

    if (!startsWithSelect || hasMultipleStatements || hasComments || hasSubquery || forbidden.test(trimmed)) {
      throw new Error('Only simple SELECT queries are allowed via this interface.');
    }

    if (!process.env.EXTERNAL_DB_URL) {
      return this.getSandboxData(sql);
    }

    // Real DB implementation (e.g., using pg or mysql2) would go here
    return [];
  }

  private getSandboxData(sql: string): any[] {
    const s = sql.toLowerCase();
    if (s.includes('users')) {
      return [
        { id: 1, name: 'Sample User 1', role: 'Admin', status: 'Active' },
        { id: 2, name: 'Sample User 2', role: 'User', status: 'Inactive' }
      ];
    }
    if (s.includes('orders')) {
      return [
        { id: 101, user_id: 1, total: 50.00, status: 'Shipped' },
        { id: 102, user_id: 2, total: 120.00, status: 'Processing' }
      ];
    }
    return [];
  }
}
