
import { Request, Response } from 'express';
import { JiraService } from '../services/JiraService';
import { SqlService } from '../services/SqlService';
import { GithubService } from '../services/GithubService';
import { safeError } from '../utils/errorHandler';
import { parseBody, CreateJiraTicketSchema, CreateGithubIssueSchema, ExecuteSqlQuerySchema } from '../schemas';
import { logger } from '../logger';

const jiraService = new JiraService();
const sqlService = new SqlService();
const githubService = new GithubService();

/**
 * Integration controller for external services (Jira, GitHub, SQL).
 *
 * NOTE: Credentials are currently shared (global env vars), not per-org.
 * All requests are logged with orgId for audit. When per-org credentials
 * are needed, store them in Firestore and look up by orgId here.
 */
export class IntegrationController {
  static async searchJira(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.orgId;
      const query = typeof req.query.query === 'string' ? req.query.query : '';
      logger.info({ orgId, query }, 'Integration: Jira search');
      const tickets = await jiraService.searchTickets(query);
      res.json(tickets);
    } catch (error) {
      safeError(res, error, 'IntegrationController.searchJira');
    }
  }

  static async createJiraTicket(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.orgId;
      const data = parseBody(CreateJiraTicketSchema, req.body, res);
      if (!data) return;
      logger.info({ orgId, title: data.title }, 'Integration: Jira create ticket');
      const ticket = await jiraService.createTicket(data.title, data.type, data.description);
      res.status(201).json(ticket);
    } catch (error) {
      safeError(res, error, 'IntegrationController.createJiraTicket');
    }
  }

  static async getGithubCommits(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.orgId;
      const repo = typeof req.query.repo === 'string' ? req.query.repo : undefined;
      logger.info({ orgId, repo }, 'Integration: GitHub commits');
      const commits = await githubService.getCommits(repo);
      res.json(commits);
    } catch (error) {
      safeError(res, error, 'IntegrationController.getGithubCommits');
    }
  }

  static async getGithubPRs(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.orgId;
      const repo = typeof req.query.repo === 'string' ? req.query.repo : undefined;
      logger.info({ orgId, repo }, 'Integration: GitHub PRs');
      const prs = await githubService.getPullRequests(repo);
      res.json(prs);
    } catch (error) {
      safeError(res, error, 'IntegrationController.getGithubPRs');
    }
  }

  static async createGithubIssue(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.orgId;
      const data = parseBody(CreateGithubIssueSchema, req.body, res);
      if (!data) return;
      logger.info({ orgId, title: data.title }, 'Integration: GitHub create issue');
      const issue = await githubService.createIssue(data.title, data.body, data.repo);
      res.status(201).json(issue);
    } catch (error) {
      safeError(res, error, 'IntegrationController.createGithubIssue');
    }
  }

  static async executeSqlQuery(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.orgId;
      const data = parseBody(ExecuteSqlQuerySchema, req.body, res);
      if (!data) return;
      logger.info({ orgId, sql: data.sql }, 'Integration: SQL query');
      const results = await sqlService.query(data.sql);
      res.json(results);
    } catch (error) {
      safeError(res, error, 'IntegrationController.executeSqlQuery');
    }
  }
}
