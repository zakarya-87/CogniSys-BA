/**
 * Real GitHub API service — replaces MockExternalServices.github.
 * Calls the server-side proxy routes which forward requests to the
 * GitHub REST API v3 using the user's stored OAuth access token.
 *
 * Falls back to mock data when the server returns 401/403 (no token)
 * or when an error occurs, to keep the UI functional during development.
 */
import { TGitCommit } from '../types';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  default_branch: string;
}

export interface GitHubCommit extends TGitCommit {
  sha: string;
  url: string;
}

const FALLBACK_COMMITS: TGitCommit[] = [
  { id: 'a1b2c3d', message: 'feat: add biometric auth logic', author: 'alex@dev.com', date: '2023-10-25' },
  { id: 'e4f5g6h', message: 'fix: payment api timeout limit', author: 'brenda@dev.com', date: '2023-10-24' },
  { id: 'i7j8k9l', message: 'chore: update dependency versions', author: 'bot', date: '2023-10-23' },
  { id: 'm0n1o2p', message: 'refactor: user controller optimization', author: 'sarah@dev.com', date: '2023-10-22' },
];

export const GitHubApiService = {
  /**
   * List repositories the authenticated user has access to.
   * Returns up to 30 repos sorted by last push.
   */
  async listRepos(): Promise<GitHubRepo[]> {
    try {
      const res = await fetch('/api/github/repos', { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json() as GitHubRepo[];
    } catch {
      return [];
    }
  },

  /**
   * List recent commits for a given repo (owner/repo format).
   * Falls back to mock data when unauthenticated.
   */
  async getCommits(repo: string, perPage = 20): Promise<TGitCommit[]> {
    try {
      const [owner, repoName] = repo.includes('/') ? repo.split('/') : ['', repo];
      if (!owner || !repoName) return FALLBACK_COMMITS;

      const res = await fetch(
        `/api/github/commits/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}?per_page=${perPage}`,
        { credentials: 'include' }
      );
      if (!res.ok) return FALLBACK_COMMITS;

      const data = await res.json() as GitHubCommit[];
      return data;
    } catch {
      return FALLBACK_COMMITS;
    }
  },

  /**
   * Get repository metadata.
   */
  async getRepo(owner: string, repo: string): Promise<GitHubRepo | null> {
    try {
      const res = await fetch(
        `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
        { credentials: 'include' }
      );
      if (!res.ok) return null;
      return await res.json() as GitHubRepo;
    } catch {
      return null;
    }
  },
};
