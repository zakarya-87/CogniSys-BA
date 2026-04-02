
import { TJiraTicket, TGitCommit } from '../types';

export const MockExternalServices = {
    jira: {
        search: async (query: string): Promise<TJiraTicket[]> => {
            await new Promise(r => setTimeout(r, 800)); // Latency
            return [
                { id: 'PROJ-101', title: 'Fix login timeouts', status: 'In Progress', assignee: 'Alex', priority: 'High' },
                { id: 'PROJ-102', title: 'Update payment gateway API', status: 'To Do', assignee: 'Brenda', priority: 'Medium' },
                { id: 'PROJ-103', title: 'User profile dashboard 404', status: 'Done', assignee: 'Charlie', priority: 'Low' },
                { id: 'PROJ-104', title: 'Implement biometric security', status: 'To Do', assignee: 'Unassigned', priority: 'High' },
                { id: 'PROJ-105', title: 'Audit log export failure', status: 'In Progress', assignee: 'Sarah', priority: 'High' },
            ].filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || query === '*' || query === '');
        },
        create: async (title: string, type: string): Promise<TJiraTicket> => {
             await new Promise(r => setTimeout(r, 800));
             return { id: `PROJ-${Math.floor(Math.random() * 1000)}`, title, status: 'To Do', assignee: 'Unassigned', priority: 'Medium' };
        }
    },
    github: {
        getCommits: async (repo: string): Promise<TGitCommit[]> => {
            await new Promise(r => setTimeout(r, 800));
            return [
                { id: 'a1b2c3d', message: 'feat: add biometric auth logic', author: 'alex@dev.com', date: '2023-10-25' },
                { id: 'e4f5g6h', message: 'fix: payment api timeout limit', author: 'brenda@dev.com', date: '2023-10-24' },
                { id: 'i7j8k9l', message: 'chore: update dependency versions', author: 'bot', date: '2023-10-23' },
                { id: 'm0n1o2p', message: 'refactor: user controller optimization', author: 'sarah@dev.com', date: '2023-10-22' },
            ];
        }
    },
    sql: {
        query: async (sql: string): Promise<any[]> => {
            await new Promise(r => setTimeout(r, 800));
            if (sql.toLowerCase().includes('users')) {
                return [
                    { id: 1, name: 'Alice', role: 'Admin', status: 'Active' },
                    { id: 2, name: 'Bob', role: 'User', status: 'Inactive' },
                    { id: 3, name: 'Charlie', role: 'User', status: 'Active' }
                ];
            }
             if (sql.toLowerCase().includes('orders')) {
                return [
                    { id: 101, user_id: 1, total: 50.00, status: 'Shipped' },
                    { id: 102, user_id: 3, total: 120.00, status: 'Processing' }
                ];
            }
            return [];
        }
    }
};
