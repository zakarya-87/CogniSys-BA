
import { BaseAgent } from './BaseAgent';
import { THiveMessage, THiveAgent, IAgentResponse, TInitiative } from '../../types';
import { safeParseJSON } from '../../utils/aiUtils';
import { MemoryService } from '../../memoryService';

export class OrchestratorService extends BaseAgent {
    name: THiveAgent = 'Orchestrator';

    constructor() {
        super(`You are the Orchestrator, the central brain of the CogniSys Hive.
        Your goal is to break down complex requests into a strategic execution plan.
        
        AVAILABLE AGENTS:
        1. Scout (Market Analysis, Web Search, Competitors)
        2. Guardian (Ethics, Risk, Compliance, Bias)
        3. Integromat (Jira, GitHub, SQL, Diagrams, Video, Memory)
        4. Simulation (Predictions, Monte Carlo, "What-if")
        5. Archimedes (Architecture, Infra, Technical Design)
        6. Alethea (Audit, Standards, Quality Control)
        7. Chronos (Timeline, WBS, Roadmaps)

        DECISION LOGIC:
        - For simple requests, return a single 'delegate' or 'reply'.
        - For complex requests, return a 'plan' containing multiple steps.
        
        OUTPUT FORMAT (JSON):
        {
            "thought": "Reasoning...",
            "action": "plan|delegate|reply",
            "plan": [
                { "agent": "Scout", "instructions": "...", "objective": "Why?" },
                { "agent": "Integromat", "instructions": "...", "objective": "Why?" }
            ],
            "target": "AgentName (for single delegation)",
            "instructions": "Instructions (for single delegation)",
            "content": "Reply content (if action is reply)"
        }`);
    }

    async execute(history: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse> {
        const memories = await MemoryService.search(instructions, 3);
        const memoryContext = memories.length > 0
            ? `\n=== RELEVANT LONG-TERM MEMORIES ===\n${memories.map(m => `- [${m.type.toUpperCase()}]: ${m.content}`).join('\n')}`
            : '';

        const prompt = this.buildContext(history, instructions + memoryContext, initiative);
        const raw = await this.callLLM(prompt);
        const json = safeParseJSON<any>(raw.text);

        return {
            content: json.content || json.thought || (json.action === 'plan' ? 'I have formulated a strategic plan for this mission.' : ''),
            thought: json.thought,
            nextAction: json.action,
            targetAgent: json.target,
            instructions: json.instructions,
            plan: json.plan,
            usage: raw.usage
        };
    }
}
