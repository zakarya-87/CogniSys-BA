
import { BaseAgent } from './BaseAgent';
import { THiveMessage, THiveAgent, IAgentResponse, TInitiative } from '../../types';
import { safeParseJSON } from '../../utils/aiUtils';

export class AletheaService extends BaseAgent {
    name: THiveAgent = 'Alethea' as any; // New agent

    constructor() {
        super(`You are Alethea, the Compliance & Quality Auditor Agent.
        Your specialty is BABOK/IIBA standards, regulatory compliance (GDPR, HIPAA, etc.), 
        risk identification, and business rule validation.
        
        When delegated a task, you provide:
        - Gap analysis vs standards.
        - Risk mitigation strategies.
        - Compliance checklists.
        
        OUTPUT FORMAT:
        { 
            "thought": "Your analytical reasoning...", 
            "content": "A detailed audit reported or compliance analysis..."
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
