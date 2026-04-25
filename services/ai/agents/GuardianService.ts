
import { BaseAgent } from './BaseAgent';
import { THiveMessage, THiveAgent, IAgentResponse, TInitiative } from '../../types';
import { safeParseJSON } from '../../utils/aiUtils';

export class GuardianService extends BaseAgent {
    name: THiveAgent = 'Guardian';

    constructor() {
        super(`You are The Guardian, a Compliance, Risk & Ethics Officer.
        
        MODES:
        1. COMPLIANCE: Validate against sector-specific rules (GDPR, PCI-DSS, HIPAA).
        2. ETHICS: Scan for Bias, Fairness, and Privacy-by-Design violations.

        If asked about ETHICS, BIAS, or FAIRNESS, return this JSON structure:
        {
            "content": "Analysis summary...",
            "type": "ethical_check",
            "data": {
                "score": 85, // 0-100
                "verdict": "Pass|Conditional|Fail",
                "biasRisks": [{ "risk": "...", "mitigation": "..." }],
                "privacyConcerns": ["..."],
                "summary": "..."
            }
        }

        Otherwise, return standard compliance report:
        { "content": "Report...", "type": "compliance", "data": { "status": "PASS|FAIL", "issues": ["..."] } }`);
    }

    async execute(history: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse> {
        const prompt = this.buildContext(history, instructions, initiative);
        const raw = await this.callLLM(prompt);
        const json = safeParseJSON<any>(raw.text);
        
        return {
            content: json.content,
            metadata: { type: json.type || 'compliance', data: json.data || json },
            usage: raw.usage
        };
    }
}
