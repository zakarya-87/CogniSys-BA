
import { TInitiative, TPredictiveInsight } from '../types';
import { withRetry, safeParseJSON } from '../utils/aiUtils';
import { callGeminiProxy } from './geminiProxy';

export const PredictiveService = {
    /**
     * Analyzes initiatives to predict future risks, opportunities, and trends.
     */
    async generatePredictions(initiatives: TInitiative[]): Promise<TPredictiveInsight[]> {
        
        // Prepare a concise summary for the LLM
        const summary = initiatives.map(i => ({
            id: i.id,
            title: i.title,
            description: i.description,
            status: i.status,
            sector: i.sector,
            risks: i.artifacts?.risks?.length || 0,
            requirements: i.artifacts?.backlog?.length || 0
        }));

        const prompt = `
        You are the "Predictive Core" of an Enterprise Architecture system.
        Analyze this portfolio of projects and predict future outcomes.
        
        DATA:
        ${JSON.stringify(summary, null, 2)}
        
        TASK:
        Identify 3-5 predictive insights for the portfolio.
        Look for:
        1. Emerging risks based on project status and complexity.
        2. Strategic opportunities for cross-project synergy.
        3. Trends in project health or resource allocation.

        OUTPUT JSON (TPredictiveInsight[]):
        [
            { 
                "initiativeId": "...", 
                "initiativeTitle": "...", 
                "predictionType": "Risk|Opportunity|Trend", 
                "probability": 0.0-1.0, 
                "description": "...", 
                "mitigationOrAction": "..." 
            }
        ]
        `;

        return withRetry(async () => {
            try {
                const text = await callGeminiProxy(prompt, 'flash');
                return safeParseJSON<TPredictiveInsight[]>(text || "[]");
            } catch (e: any) {
                console.error("PredictiveService failed:", e);
                throw e;
            }
        });
    }
};
