
import { TInitiative, TPredictiveInsight } from '../types';
import { withRetry, safeParseJSON } from '../utils/aiUtils';
import { GoogleGenAI } from "@google/genai";

const _getAi = () => { const key = process.env.API_KEY; if (!key) throw new Error("GEMINI_API_KEY not configured"); return new GoogleGenAI({ apiKey: key }); };
const ai = { models: { generateContent: (...a: any[]) => _getAi().models.generateContent(...a as any), embedContent: (...a: any[]) => _getAi().models.embedContent(...a as any) } };
const MODEL = 'gemini-2.5-flash';

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
                const response = await ai.models.generateContent({
                    model: MODEL,
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });
                return safeParseJSON<TPredictiveInsight[]>(response.text || "[]");
            } catch (e: any) {
                console.error("PredictiveService failed:", e);
                throw e;
            }
        });
    }
};
