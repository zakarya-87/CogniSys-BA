
import { TInitiative, TCortexGraph, TCortexNode, TCortexLink, Sector, TCortexInsight } from '../types';
import { PromptFactory } from './promptFactory';
import { withRetry, safeParseJSON } from '../utils/aiUtils';
import { GoogleGenAI } from "@google/genai";

const _getAi = () => { const key = process.env.API_KEY; if (!key) throw new Error("GEMINI_API_KEY not configured"); return new GoogleGenAI({ apiKey: key }); };
const ai = { models: { generateContent: (...a: any[]) => _getAi().models.generateContent(...a as any), embedContent: (...a: any[]) => _getAi().models.embedContent(...a as any) } };
const MODEL = 'gemini-2.5-flash';

export const CortexService = {
    /**
     * Builds a graph representation from the list of initiatives.
     * This processes initiatives to find shared stakeholders, technologies, and sectors.
     */
    buildGraph(initiatives: TInitiative[]): TCortexGraph {
        const nodes: TCortexNode[] = [];
        const links: TCortexLink[] = [];
        const nodeMap = new Set<string>();

        const addNode = (id: string, label: string, type: TCortexNode['type'], val: number, group: string) => {
            if (!nodeMap.has(id)) {
                nodes.push({ id, label, type, val, group });
                nodeMap.add(id);
            }
        };

        const addLink = (source: string, target: string, label?: string) => {
            links.push({ source, target, label });
        };

        initiatives.forEach(init => {
            // 1. Initiative Node
            addNode(init.id, init.title, 'Initiative', 20, '1');

            // 2. Sector Node
            const sectorId = `sec-${init.sector.replace(/\s+/g, '-')}`;
            addNode(sectorId, init.sector, 'Sector', 15, '2');
            addLink(init.id, sectorId, 'belongs to');

            // 3. Owner (Person) Node
            const ownerId = `per-${init.owner.name.replace(/\s+/g, '-')}`;
            addNode(ownerId, init.owner.name, 'Person', 10, '3');
            addLink(init.id, ownerId, 'owned by');

            // 4. Artifact-derived Nodes (Mocked extraction for now, usually would parse text)
            // Extract Risk Categories
            if (init.artifacts?.risks) {
                init.artifacts.risks.forEach((r: any) => {
                    if (r.probability * r.impact > 12) { // Only high risks
                        const riskId = `risk-${r.category}`;
                        addNode(riskId, r.category, 'Risk', 12, '4');
                        addLink(init.id, riskId, 'exposed to');
                    }
                });
            }

            // Extract Technologies from Description (Simple heuristic)
            const techKeywords = ['Cloud', 'AI', 'Blockchain', 'IoT', 'Mobile', 'API', 'Mainframe'];
            techKeywords.forEach(tech => {
                if (init.description.includes(tech)) {
                    const techId = `tech-${tech}`;
                    addNode(techId, tech, 'Tech', 8, '5');
                    addLink(init.id, techId, 'uses');
                }
            });
        });

        return { nodes, links };
    },

    /**
     * Uses Gemini to analyze the graph structure and find non-obvious insights.
     */
    async generateInsights(initiatives: TInitiative[], graph: TCortexGraph): Promise<TCortexInsight[]> {
        // Prepare a lightweight graph summary for the LLM
        const summary = initiatives.map(i => ({
            title: i.title,
            sector: i.sector,
            risks: i.artifacts?.risks?.length || 0,
            desc: i.description
        }));

        const prompt = `
        You are the "Cortex" engine of an Enterprise Architecture system.
        Analyze this portfolio of projects and the generated knowledge graph structure.
        
        DATA:
        ${JSON.stringify(summary, null, 2)}
        
        GRAPH STATS:
        Nodes: ${graph.nodes.length}, Links: ${graph.links.length}

        TASK:
        Identify 3 critical insights, patterns, or opportunities for consolidation/risk mitigation.
        Look for:
        1. Shared risks across different sectors.
        2. Opportunity to reuse tech (e.g. if multiple projects use AI).
        3. Bottlenecks (e.g. one person owning too many high-risk projects).

        OUTPUT JSON:
        [
            { "title": "...", "type": "Opportunity|Risk|Pattern", "description": "...", "relatedNodes": ["node_id_1", "node_id_2"] }
        ]
        `;

        try {
            return await withRetry(async () => {
                try {
                    const response = await ai.models.generateContent({
                        model: MODEL,
                        contents: prompt,
                        config: { responseMimeType: 'application/json' }
                    });
                    return safeParseJSON<TCortexInsight[]>(response.text || "[]");
                } catch (e: any) {
                    const errorMessage = e.message || e.error?.message || JSON.stringify(e);
                    const errorCode = e.code || e.error?.code;
                    const errorStatus = e.status || e.error?.status;

                    // Specific fallback for RPC errors often seen with strictly structured output
                    if (errorMessage.includes('Rpc') || errorCode === 500 || errorStatus === 500) {
                        console.warn("Cortex JSON mode failed with RPC error. Retrying with text mode...");
                         const response = await ai.models.generateContent({
                            model: MODEL,
                            contents: prompt + "\n\nRETURN ONLY RAW JSON. NO MARKDOWN.",
                            // No responseMimeType
                        });
                        return safeParseJSON<TCortexInsight[]>(response.text || "[]");
                    }
                    throw e;
                }
            });
        } catch (e: any) {
            const errorMessage = e.message || "";
            if (errorMessage.toLowerCase().includes('quota') || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                console.warn("Using fallback Cortex insights due to API limits.");
                return [
                    {
                        id: "fallback-1",
                        title: "API Limit Reached",
                        type: "Trend",
                        description: "The AI service is currently unavailable due to quota limits. Please try again later.",
                        impact: "Low"
                    }
                ];
            }
            throw e;
        }
    }
};
