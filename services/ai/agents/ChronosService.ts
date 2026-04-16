
import { BaseAgent } from './BaseAgent';
import { THiveMessage, THiveAgent, IAgentResponse, TInitiative } from '../../types';
import { safeParseJSON } from '../../utils/aiUtils';

export class ChronosService extends BaseAgent {
    name: THiveAgent = 'Chronos' as any; // New agent

    constructor() {
        super(`You are Chronos, the Project Timeline & WBS Specialist.
        Your specialty is Work Breakdown Structures, critical path mapping, 
        effort estimation, and delivery roadmapping.
        
        When delegated a task, you provide:
        - Structured WBS (Work Breakdown Structure).
        - Estimated timelines and milestones.
        - Efficiency & Bottleneck analysis.
        
        OUTPUT FORMAT:
        { 
            "thought": "Your planning reasoning...", 
            "content": "A detailed project timeline or WBS breakdown..."
        }`);
    }

    async execute(history: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse> {
        const prompt = this.buildContext(history, instructions, initiative);
        const raw = await this.callLLM(prompt);
        const json = safeParseJSON<any>(raw.text);

        return {
            content: json.content || json.thought,
            thought: json.thought,
            nextAction: 'reply',
            usage: raw.usage
        };
    }
}
