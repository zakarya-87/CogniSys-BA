
import { logger } from '../logger';
import { TGitCommit } from '../../types';

export interface TGitHubPR {
    id: number;
    title: string;
    state: string;
    user: string;
    url: string;
}

export class GithubService {
  private baseUrl = 'https://api.github.com';
  private apiToken = process.env.GITHUB_TOKEN;
  private defaultOwner = process.env.GITHUB_OWNER || 'cognisys';
  private defaultRepo = process.env.GITHUB_REPO || 'main';

  private get headers() {
    return {
      'Authorization': `token ${this.apiToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CogniSys-BA'
    };
  }

  async getCommits(repo?: string): Promise<TGitCommit[]> {
    if (!this.apiToken) {
       return [
           { id: 'm0ck1', message: 'Initial commit', author: 'Zak', date: new Date().toISOString() },
           { id: 'm0ck2', message: 'Add analytics dashboard', author: 'Zak', date: new Date().toISOString() }
       ];
    }

    try {
      const targetRepo = repo || this.defaultRepo;
      const response = await fetch(`${this.baseUrl}/repos/${this.defaultOwner}/${targetRepo}/commits`, {
        headers: this.headers
      });

      if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
      const data = await response.json() as any[];

      return data.slice(0, 10).map(c => ({
        id: c.sha.substring(0, 7),
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date
      }));
    } catch (error) {
      logger.error({ error }, 'GitHub commits fetch failed');
      throw error;
    }
  }

  async getPullRequests(repo?: string): Promise<TGitHubPR[]> {
    if (!this.apiToken) return [];

    try {
      const targetRepo = repo || this.defaultRepo;
      const response = await fetch(`${this.baseUrl}/repos/${this.defaultOwner}/${targetRepo}/pulls`, {
        headers: this.headers
      });

      if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
      const data = await response.json() as any[];

      return data.map(pr => ({
        id: pr.number,
        title: pr.title,
        state: pr.state,
        user: pr.user.login,
        url: pr.html_url
      }));
    } catch (error) {
      logger.error({ error }, 'GitHub PRs fetch failed');
      throw error;
    }
  }

  async createIssue(title: string, body: string, repo?: string): Promise<any> {
    if (!this.apiToken) {
        return { id: 123, title, state: 'open', url: '#' };
    }

    try {
      const targetRepo = repo || this.defaultRepo;
      const response = await fetch(`${this.baseUrl}/repos/${this.defaultOwner}/${targetRepo}/issues`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ title, body })
      });

      if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      logger.error({ error }, 'GitHub issue creation failed');
      throw error;
    }
  }
}
