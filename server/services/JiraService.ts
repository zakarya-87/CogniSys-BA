
import { TJiraTicket } from '../../types';
import { logger } from '../logger';

export class JiraService {
  private baseUrl = process.env.JIRA_BASE_URL || 'https://sandbox.atlassian.net';
  private apiToken = process.env.JIRA_API_TOKEN;
  private email = process.env.JIRA_EMAIL || '';

  async searchTickets(query: string): Promise<TJiraTicket[]> {
    if (!this.apiToken || !this.email) {
      logger.warn('[JiraService] Missing JIRA_EMAIL or JIRA_API_TOKEN. Returning sandbox data.');
      return this.getSandboxTickets(query);
    }

    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`Jira API Error: ${response.status}`);
      const data = await response.json() as any;
      
      return data.issues.map((issue: any) => ({
        id: issue.key,
        title: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        priority: issue.fields.priority?.name || 'Medium'
      }));
    } catch (error) {
      logger.error({ error }, 'Jira search failed');
      throw error;
    }
  }

  async createTicket(title: string, type: string = 'Task', description?: string): Promise<TJiraTicket> {
    if (!this.apiToken || !this.email) {
      return { 
        id: `SAND-${Math.floor(Math.random() * 1000)}`, 
        title, 
        status: 'To Do', 
        assignee: 'Unassigned', 
        priority: 'Medium' 
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            project: { key: process.env.JIRA_PROJECT_KEY || 'PROJ' },
            summary: title,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: description || title }]
                }
              ]
            },
            issuetype: { name: type }
          }
        })
      });

      if (!response.ok) throw new Error(`Jira Create Error: ${response.status}`);
      const data = await response.json() as any;
      return { 
        id: data.key, 
        title, 
        status: 'To Do', 
        assignee: 'Unassigned', 
        priority: 'Medium' 
      };
    } catch (error) {
      logger.error({ error }, 'Jira ticket creation failed');
      throw error;
    }
  }

  private getSandboxTickets(query: string): TJiraTicket[] {
    const mock = [
      { id: 'PROJ-101', title: 'Fix login timeouts', status: 'In Progress', assignee: 'Alex', priority: 'High' },
      { id: 'PROJ-102', title: 'Update payment gateway API', status: 'To Do', assignee: 'Brenda', priority: 'Medium' },
      { id: 'PROJ-103', title: 'User profile dashboard 404', status: 'Done', assignee: 'Charlie', priority: 'Low' },
    ];
    return mock.filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || query === '*' || !query);
  }
}
