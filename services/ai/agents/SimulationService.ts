
import { BaseAgent } from './BaseAgent';
import { THiveMessage, THiveAgent, IAgentResponse, TInitiative } from '../../types';
import { safeParseJSON } from '../../utils/aiUtils';
import { MemoryService } from '../../memoryService';
import { MathService } from '../../mathService';

export class SimulationService extends BaseAgent {
    name: THiveAgent = 'Simulation';

    constructor() {
        super(`You are The Simulation Agent, a Predictive Modeling Expert.
        Your goal is to run 'What-If' scenarios using Monte Carlo simulations.
        Instead of guessing the statistical distribution, you MUST provide the input parameters for the simulation, and the system will calculate the exact distribution.
        
        Identify the key variables from the user's request and estimate their minimum and maximum values (e.g., cost, days, hours).
        
        USE THE PROVIDED "RELEVANT PAST SIMULATIONS/OUTCOMES" TO CALIBRATE YOUR ESTIMATES.
        
        OUTPUT FORMAT (Strict JSON):
        {
            "content": "Analysis of the simulation parameters and what they represent...",
            "parameters": [
                { "name": "Development Time (Days)", "min": 10, "max": 25 },
                { "name": "QA Lag (Days)", "min": 2, "max": 8 },
                { "name": "Vendor Delay (Days)", "min": 0, "max": 14 }
            ],
            "recommendation": "Based on these inputs, we should prepare for the worst-case scenario."
        }`);
    }

    async execute(history: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse> {
        const memories = await MemoryService.search(instructions, 3);
        const memoryContext = memories.length > 0
            ? `\n=== RELEVANT PAST SIMULATIONS/OUTCOMES ===\n${memories.map(m => `- [${m.type.toUpperCase()}]: ${m.content}`).join('\n')}`
            : '';

        const prompt = this.buildContext(history, instructions + memoryContext, initiative);
        const raw = await this.callLLM(prompt);
        const json = safeParseJSON<any>(raw.text);

        let simulationResult = null;
        if (json.parameters && Array.isArray(json.parameters) && json.parameters.length > 0) {
            try {
                simulationResult = MathService.runMonteCarlo(json.parameters, 1000);
                simulationResult.content = json.content;
                simulationResult.recommendation = json.recommendation;
            } catch (e) {
                console.error("Failed to run Monte Carlo simulation:", e);
            }
        }

        if (simulationResult) {
            void MemoryService.store(
                `Monte Carlo Simulation for "${initiative?.title || 'Project'}": Mean ${simulationResult.mean}, P10 ${simulationResult.p10}, P90 ${simulationResult.p90}. Parameters: ${JSON.stringify(json.parameters)}`,
                'insight',
                { ...simulationResult, initiativeId: initiative?.id }
            );
        }

        return {
            content: json.content,
            metadata: { type: 'simulation', data: simulationResult || json },
            usage: raw.usage
        };
    }
}
