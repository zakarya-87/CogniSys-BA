
import { BaseAgent } from './BaseAgent';
import { THiveMessage, THiveAgent, IAgentResponse, TInitiative } from '../../types';
import { safeParseJSON } from '../../utils/aiUtils';
import { MockExternalServices } from '../../mockExternalServices';
import { IntegrationAPI } from '../../../src/services/api';
import { 
    generateConceptVideo, 
    generateBpmnFlow, 
    generateSequenceDiagram, 
    generateMindMap, 
    generatePresentation 
} from '../../geminiService';
import { MemoryService } from '../../memoryService';

export class IntegromatService extends BaseAgent {
    name: THiveAgent = 'Integromat';

    constructor() {
        super(`You are The Integromat, a Systems Integrator and Artifact Builder.
        You have absolute control over external systems integration:
        1. 'jira_search': { query: string }
        2. 'jira_create': { title: string, type: 'Task'|'Bug'|'Story', description?: string }
        3. 'github_commits': { repo?: string } - List last 10 commits.
        4. 'github_prs': { repo?: string } - List pull requests.
        5. 'github_create_issue': { title: string, body: string, repo?: string }
        6. 'confluence_create_page': { title: string, space: string, content: string }
        7. 'sql_query': { sql: string }
        8. 'generate_video': { prompt: string }
        9. 'generate_bpmn' | 'generate_sequence' | 'generate_mindmap' | 'generate_presentation'
        10. 'save_memory' | 'read_memory'
        
        Return JSON: { "tool": "name", "args": {...} }`);
    }

    async execute(history: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse> {
        const prompt = this.buildContext(history, instructions, initiative);
        const raw = await this.callLLM(prompt);
        const json = safeParseJSON<any>(raw.text);

        if (json.tool) {
            console.log(`[Integromat] Proposed Tool: ${json.tool}`);

            // These tools require human-in-the-loop approval as they perform standard Writes
            if (['jira_create', 'github_create_issue', 'confluence_create_page', 'sql_execute', 'git_push', 'generate_video'].includes(json.tool)) {
                return {
                    content: `I am ready to perform the **${json.tool}** action. Please review and approve.`,
                    nextAction: 'approval_required',
                    toolCall: { name: json.tool, args: json.args },
                    usage: raw.usage
                };
            }

            const result = await this.executeTool(json.tool, json.args, initiative);
            return { ...result, usage: raw.usage };
        }

        return { 
            content: json.content || "I am connected to your enterprise systems. What integration can I perform for you?",
            usage: raw.usage
        };
    }

    async executeTool(toolName: string, args: any, initiative?: TInitiative): Promise<IAgentResponse> {
         try {
            switch (toolName) {
                case 'jira_search': {
                    const response = await IntegrationAPI.jira.search(args.query || '');
                    return { content: `Found ${response.data.length} tickets.`, metadata: { type: 'jira', data: response.data } };
                }
                case 'jira_create': {
                    const response = await IntegrationAPI.jira.create(args.title, args.type || 'Task', args.description);
                    return { content: `Jira ticket created: ${response.data.id}`, metadata: { type: 'jira_ticket', data: response.data } };
                }
                case 'github_commits': {
                    const response = await IntegrationAPI.github.commits(args.repo);
                    return { content: `Retrieved latest commits.`, metadata: { type: 'github_commits', data: response.data } };
                }
                case 'github_prs': {
                    const response = await IntegrationAPI.github.prs(args.repo);
                    return { content: `Found ${response.data.length} active PRs.`, metadata: { type: 'github_prs', data: response.data } };
                }
                case 'github_create_issue': {
                    const response = await IntegrationAPI.github.createIssue(args.title, args.body, args.repo);
                    return { content: `GitHub issue created: #${response.data.id}`, metadata: { type: 'github_issue', data: response.data } };
                }
                case 'confluence_create_page': {
                    // Mock confluence for now
                    return { content: `Confluence page "${args.title}" created in space ${args.space}.`, metadata: { type: 'confluence', data: args } };
                }
                case 'sql_query': {
                    const response = await IntegrationAPI.sql.query(args.sql);
                    return { content: `Query executed. returned ${response.data.length} rows.`, metadata: { type: 'sql_results', data: response.data } };
                }
                case 'generate_video': {
                    const uri = await generateConceptVideo(args.prompt);
                    return { content: `Veo video generated.`, metadata: { type: 'video', data: { uri, prompt: args.prompt } } };
                }
                case 'generate_bpmn': {
                     const flow = await generateBpmnFlow(args.description);
                     return { content: `BPMN Generated.`, metadata: { type: 'bpmn', data: flow } };
                }
                case 'generate_sequence': {
                    const diag = await generateSequenceDiagram(initiative?.title || 'System', initiative?.sector || 'General', args.scenario);
                    return { content: `Sequence Diagram Generated.`, metadata: { type: 'sequence', data: diag } };
                }
                case 'save_memory': {
                    const memory = await MemoryService.addMemory(args.content, args.type || 'fact', { initiativeId: initiative?.id });
                    return { content: `Saved to memory.`, metadata: { type: 'memory_saved', data: memory } };
                }
                case 'read_memory': {
                    const results = await MemoryService.search(args.query, 3);
                    return { content: `Retrieved ${results.length} memories.`, metadata: { type: 'memory_results', data: results } };
                }
                default: 
                    return { content: `Tool ${toolName} not implemented.` };
            }
        } catch (e) {
            return { content: `Error executing ${toolName}: ${e}` };
        }
    }
}
