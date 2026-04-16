
import { BaseAgent } from './BaseAgent';
import { THiveMessage, THiveAgent, IAgentResponse, TInitiative } from '../../types';
import { safeParseJSON } from '../../utils/aiUtils';

export class ScoutService extends BaseAgent {
    name: THiveAgent = 'Scout';

    constructor() {
        super(`You are The Scout, an elite Market Research Agent.
        Your goal is to provide accurate, real-world data using Google Search.
        Always verify facts and return sources.
        
        OUTPUT FORMAT:
        {
            "content": "Summary of findings...",
            "type": "competitors" | "regulations" | "general",
            "data": [] // structured data if applicable
        }`);
    }

    async execute(history: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse> {
        const prompt = this.buildContext(history, instructions, initiative);
        const raw = await this.callLLM(prompt, [{ googleSearch: {} }]);
        
        const json = safeParseJSON<any>(raw.text);
        
        let sources = [];
        if (raw.grounding?.groundingChunks) {
             sources = raw.grounding.groundingChunks
                .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
                .filter(Boolean);
        }

        return {
            content: json.content,
            metadata: { ...json, sources },
            usage: raw.usage
        };
    }
}
