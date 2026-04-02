
import { TInitiative, TOracleResponse } from '../types';
import { withRetry, safeParseJSON } from '../utils/aiUtils';
import { GoogleGenAI } from "@google/genai";

const _getAi = () => { const key = process.env.API_KEY; if (!key) throw new Error("GEMINI_API_KEY not configured"); return new GoogleGenAI({ apiKey: key }); };
const ai = { models: { generateContent: (...a: any[]) => _getAi().models.generateContent(...a as any), embedContent: (...a: any[]) => _getAi().models.embedContent(...a as any) } };
const MODEL = 'gemini-2.5-flash';

export const OracleService = {
    /**
     * Performs a semantic search across all initiative artifacts using Gemini's long-context window.
     * This acts as a RAG (Retrieval Augmented Generation) system without a vector DB.
     */
    async ask(query: string, initiatives: TInitiative[]): Promise<TOracleResponse> {
        
        // 1. Serialize the Knowledge Base
        // We strip unnecessary UI state to save tokens and focus on content.
        const knowledgeBase = initiatives.map(init => ({
            id: init.id,
            title: init.title,
            sector: init.sector,
            description: init.description,
            status: init.status,
            owner: init.owner.name,
            // Flatten critical artifacts
            artifacts: {
                risks: init.artifacts?.risks?.map((r: any) => `${r.category}: ${r.description} (Risk Level: ${r.probability * r.impact})`),
                requirements: init.artifacts?.backlog?.filter((b: any) => b.type === 'Requirement').map((b: any) => b.title),
                decisions: init.artifacts?.decisionModel?.nodes?.filter((n: any) => n.type === 'Decision').map((n: any) => n.label),
                stakeholders: init.artifacts?.stakeholderRegistry?.map((s: any) => `${s.role} (${s.attitude})`),
                architecture: init.artifacts?.c4Model?.nodes?.map((n: any) => `${n.label} [${n.type}]`),
                compliance: init.artifacts?.complianceMatrix?.items?.filter((i: any) => i.status !== 'Compliant').map((i: any) => `Gap: ${i.clause}`)
            }
        }));

        const prompt = `
        You are **The Oracle**, the collective intelligence engine of CogniSys.
        You have access to the entire project portfolio database.

        === KNOWLEDGE BASE ===
        ${JSON.stringify(knowledgeBase, null, 2)}
        
        === USER QUERY ===
        "${query}"

        === INSTRUCTIONS ===
        1. Search the Knowledge Base for relevant information.
        2. Synthesize a direct answer.
        3. CITE YOUR SOURCES. For every fact, identify which Initiative and Artifact it came from.
        4. If the answer is not in the data, say "I cannot find information about that in the current portfolio."
        
        === OUTPUT FORMAT (JSON) ===
        {
            "answer": "Markdown formatted answer...",
            "citations": [
                { "initiativeId": "...", "initiativeTitle": "...", "artifactType": "Risk Register/Backlog/etc", "snippet": "..." }
            ],
            "suggestedFollowUps": ["Question 1", "Question 2"]
        }
        `;

        return withRetry(async () => {
            const response = await ai.models.generateContent({
                model: MODEL,
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            return safeParseJSON<TOracleResponse>(response.text || "{}");
        });
    }
};
