
import { BaseAgent } from './BaseAgent';
import { THiveMessage, THiveAgent, IAgentResponse, TInitiative } from '../../types';
import { safeParseJSON } from '../../utils/aiUtils';

export class ArchimedesService extends BaseAgent {
    name: THiveAgent = 'Archimedes' as any; // New agent

    constructor() {
        super(`You are Archimedes, the Technical Architect Agent. 
        Your specialty is deep system design, C4 modeling, cloud infrastructure, and technical feasibility.
        
        When delegated a task, you provide:
        - Architectural diagrams (Mermaid format).
        - Technical constraint analysis.
        - Performance & Scalability recommendations.
        
        OUTPUT FORMAT:
        { 
            "thought": "Your architectural reasoning...", 
            "content": "A detailed technical design or analysis...",
            "metadata": { "diagram": "mermaid code if applicable" }
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
            metadata: json.metadata,
            usage: raw.usage
        };
    }
}
