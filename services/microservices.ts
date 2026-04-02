
import { GoogleGenAI } from "@google/genai";
import { THiveMessage, THiveAgent, IAgent, IAgentResponse, TInitiative } from '../types';
import { safeParseJSON, withRetry } from '../utils/aiUtils';
import { MockExternalServices } from './mockExternalServices';
import { generateConceptVideo, generateBpmnFlow, generateSequenceDiagram, generateMindMap, generatePresentation } from './geminiService';
import { MemoryService } from './memoryService';
import { MathService } from './mathService';
import { callMistral, callAzureOpenAI } from './llmProxyService';

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
let _msAi: GoogleGenAI | null = null;
const getAi = () => {
  if (!_msAi) {
    if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");
    _msAi = new GoogleGenAI({ apiKey: API_KEY });
  }
  return _msAi;
};
const ai = { models: { generateContent: (...a: any[]) => getAi().models.generateContent(...a as any) } };
const MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash';

// Global flag to track if the primary model is exhausted (quota reached)
let isPrimaryModelExhausted = false;

// --- BASE AGENT IMPLEMENTATION ---
abstract class BaseAgent implements IAgent {
    abstract name: THiveAgent;
    protected systemPrompt: string;

    constructor(systemPrompt: string) {
        this.systemPrompt = systemPrompt;
    }

    protected buildContext(history: THiveMessage[], instructions: string, initiative?: TInitiative): string {
         let context = `
${this.systemPrompt}

=== CURRENT INSTRUCTIONS ===
${instructions}

=== CONVERSATION HISTORY ===
${history.map(m => `${m.agent || 'User'}: ${m.content}`).join('\n')}
`;
        if (initiative) {
            context += `\n=== PROJECT CONTEXT ===\nTitle: ${initiative.title}\nSector: ${initiative.sector}\nDescription: ${initiative.description}`;
        }
        return context;
    }

    async execute(context: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse> {
        throw new Error("Execute method not implemented.");
    }

    // New method to execute specific tool after approval
    async executeTool(toolName: string, args: any, initiative?: TInitiative): Promise<any> {
        return Promise.resolve({});
    }

    protected async callLLM(prompt: string, tools?: any[]): Promise<any> {
        return withRetry(async () => {
            // 1. Detect if we are using Search (incompatible with JSON mode)
            const isSearchTool = tools?.some(t => t.googleSearch);
            const shouldEnforceJson = !isSearchTool;

            const executeCall = async (modelId: string) => {
                if (modelId === 'mistral') {
                    const response = await callMistral({
                        messages: [{ role: 'user', content: prompt }],
                    });
                    return { text: response.choices[0].message.content, grounding: null };
                } else if (modelId === 'azure-openai') {
                    const response = await callAzureOpenAI({
                        messages: [{ role: 'user', content: prompt }],
                    });
                    return { text: response.choices[0].message.content, grounding: null };
                } else {
                    const response = await ai.models.generateContent({
                        model: modelId,
                        contents: prompt,
                        config: {
                            tools,
                            // Only enforce JSON if NOT using search
                            responseMimeType: shouldEnforceJson ? 'application/json' : undefined
                        }
                    });
                    return {
                        text: response.text || "{}",
                        grounding: response.candidates?.[0]?.groundingMetadata
                    };
                }
            };

            const modelsToTry = [MODEL];
            if ((MODEL as string) !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
            // Only add proxies if NOT using search (proxies don't support Google Search grounding here)
            if (!isSearchTool) {
                modelsToTry.push('mistral');
                modelsToTry.push('azure-openai');
            }

            let lastError: any = null;
            for (const modelId of modelsToTry) {
                if (modelId === MODEL && isPrimaryModelExhausted) continue;

                try {
                    return await executeCall(modelId);
                } catch (error: any) {
                    lastError = error;
                    const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                    const errorStatus = error.status || error.error?.status;
                    const errorCode = error.code || error.error?.code;

                    const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || errorStatus === 'RESOURCE_EXHAUSTED';
                    const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('missing');

                    if (isQuotaError || isConfigError) {
                        if (modelId === MODEL) isPrimaryModelExhausted = true;
                        console.warn(`[${this.name}] Model ${modelId} failed (${isQuotaError ? 'Quota' : 'Config'}). Trying next...`);
                        continue;
                    }

                    // 2. Fallback Logic for 500/RPC Errors (Gemini specific usually)
                    const isNetworkOrServerError = errorMessage.includes('500') || errorMessage.includes('Rpc') || errorStatus === 500 || errorStatus === 'UNKNOWN';

                    if (shouldEnforceJson && isNetworkOrServerError && (modelId === MODEL || modelId === FALLBACK_MODEL)) {
                        console.warn(`[${this.name}] JSON mode failed with RPC error on ${modelId}. Retrying with text mode...`);
                        try {
                            const response = await ai.models.generateContent({
                                model: modelId,
                                contents: prompt,
                                config: {
                                    tools,
                                    responseMimeType: undefined 
                                }
                            });
                            return {
                                text: response.text || "{}",
                                grounding: response.candidates?.[0]?.groundingMetadata
                            };
                        } catch (retryError) {
                            console.error(`[${this.name}] Text mode retry also failed on ${modelId}`);
                            continue; // Try next model in chain
                        }
                    }

                    throw error;
                }
            }

            if (lastError) throw lastError;
            throw new Error("All models in agent fallback chain failed.");
        });
    }
}

// --- SCOUT SERVICE (Research) ---
class ScoutService extends BaseAgent {
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
        // Scout uses Search, so BaseAgent will automatically disable JSON mode to prevent 400 errors
        const raw = await this.callLLM(prompt, [{ googleSearch: {} }]);
        
        const json = safeParseJSON<any>(raw.text);
        
        // Extract Grounding Metadata
        let sources = [];
        if (raw.grounding?.groundingChunks) {
             sources = raw.grounding.groundingChunks
                .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
                .filter(Boolean);
        }

        return {
            content: json.content,
            metadata: { ...json, sources }
        };
    }
}

// --- GUARDIAN SERVICE (Compliance & Ethics) ---
class GuardianService extends BaseAgent {
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
            metadata: { type: json.type || 'compliance', data: json.data || json }
        };
    }
}

// --- SIMULATION SERVICE (Predictive Core v2.1) ---
class SimulationService extends BaseAgent {
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
        // Inject relevant past simulations/outcomes
        const memories = await MemoryService.search(instructions, 3);
        const memoryContext = memories.length > 0
            ? `\n=== RELEVANT PAST SIMULATIONS/OUTCOMES ===\n${memories.map(m => `- [${m.type.toUpperCase()}]: ${m.content}`).join('\n')}`
            : '';

        const prompt = this.buildContext(history, instructions + memoryContext, initiative);
        const raw = await this.callLLM(prompt);
        const json = safeParseJSON<any>(raw.text);

        // Run the actual math simulation client-side for precision
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

        return {
            content: json.content,
            metadata: { type: 'simulation', data: simulationResult || json }
        };
    }
}

// --- INTEGROMAT SERVICE (Integration) ---
class IntegromatService extends BaseAgent {
    name: THiveAgent = 'Integromat';

    constructor() {
        super(`You are The Integromat, a Systems Integrator and Artifact Builder.
        You have access to tools:
        1. 'jira_search' (Read): Search tickets.
        2. 'jira_create' (Write): Create new ticket.
        3. 'git_log' (Read): Read commit history.
        4. 'sql_query' (Read): Query database.
        5. 'generate_video' (Write): Create video using Veo model.
        6. 'generate_bpmn' (Write): Create BPMN process diagram.
        7. 'generate_sequence' (Write): Create Sequence diagram.
        8. 'generate_mindmap' (Write): Create Mind Map.
        9. 'generate_presentation' (Write): Create Slide Deck.
        10. 'save_memory' (Write): Save a key decision or fact to project memory (RAG). Args: { content: string, type: 'fact'|'decision' }
        11. 'read_memory' (Read): Retrieve semantic memories using vector search. Args: { query: string }
        
        Identify user intent and return JSON: { "tool": "name", "args": {...} } or { "content": "msg" } if no tool needed.
        
        IMPORTANT: Use 'jira_create' only when explicitly asked to create or log a ticket.`);
    }

    async execute(history: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse> {
        const prompt = this.buildContext(history, instructions, initiative);
        const raw = await this.callLLM(prompt);
        const json = safeParseJSON<any>(raw.text);

        if (json.tool) {
            console.log(`[Integromat] Proposed Tool: ${json.tool}`);

            // --- GOVERNANCE CHECK ---
            // Intercept WRITE operations (including video gen which costs money/tokens)
            if (['jira_create', 'sql_execute', 'git_push', 'generate_video'].includes(json.tool)) {
                return {
                    content: `I need approval to execute ${json.tool}.`,
                    nextAction: 'approval_required',
                    toolCall: { name: json.tool, args: json.args }
                };
            }

            // Safe to execute immediately (Diagrams, Memories are considered safe/read-only generation)
            const result = await this.executeTool(json.tool, json.args, initiative);
            return result;
        }

        return { content: json.content || "I couldn't process that request." };
    }

    // Actual execution logic (can be called directly or after approval)
    async executeTool(toolName: string, args: any, initiative?: TInitiative): Promise<IAgentResponse> {
         try {
            if (toolName === 'jira_search') {
                const tickets = await MockExternalServices.jira.search(args.query || '');
                return { 
                    content: `Found ${tickets.length} tickets.`, 
                    metadata: { type: 'jira', data: tickets } 
                };
            } else if (toolName === 'jira_create') {
                const ticket = await MockExternalServices.jira.create(args.title, args.type || 'Task');
                return {
                    content: `Ticket created successfully: ${ticket.id}`,
                    metadata: { type: 'jira_ticket_created', data: ticket }
                };
            } else if (toolName === 'git_log') {
                const commits = await MockExternalServices.github.getCommits(args.repo || 'main');
                return { 
                    content: `Retrieved latest commits.`, 
                    metadata: { type: 'github', data: commits } 
                };
            } else if (toolName === 'sql_query') {
                const rows = await MockExternalServices.sql.query(args.sql);
                return { 
                    content: `Query returned ${rows.length} rows.`, 
                    metadata: { type: 'sql', data: rows } 
                };
            } else if (toolName === 'generate_video') {
                const prompt = args.prompt || "A futuristic concept video";
                const uri = await generateConceptVideo(prompt);
                return {
                    content: `I've generated a video based on your prompt: "${prompt}".`,
                    metadata: { 
                        type: 'video', 
                        data: { uri: `${uri}&key=${process.env.API_KEY}`, prompt } 
                    }
                };
            } else if (toolName === 'generate_bpmn') {
                const desc = args.description || "A standard business process";
                const flow = await generateBpmnFlow(desc);
                return {
                    content: `Here is the BPMN process model for: "${desc}"`,
                    metadata: { type: 'bpmn', data: flow }
                };
            } else if (toolName === 'generate_sequence') {
                const scenario = args.scenario || "User interaction";
                const diagram = await generateSequenceDiagram(initiative?.title || 'System', initiative?.sector || 'General', scenario);
                return {
                    content: `I've mapped the sequence diagram for: "${scenario}"`,
                    metadata: { type: 'sequence', data: diagram }
                };
            } else if (toolName === 'generate_mindmap') {
                const topic = args.topic || "Brainstorming";
                const map = await generateMindMap(topic, initiative?.sector || 'General');
                return {
                    content: `Here is a mind map exploring: "${topic}"`,
                    metadata: { type: 'mindmap', data: map }
                };
            } else if (toolName === 'generate_presentation') {
                const title = args.title || initiative?.title || "Project Summary";
                const desc = args.description || initiative?.description || "Project Details";
                const slides = await generatePresentation(title, desc, initiative?.sector || 'General');
                return {
                    content: `I've generated a slide deck for: "${title}"`,
                    metadata: { type: 'presentation', data: slides }
                };
            } else if (toolName === 'save_memory') {
                // Phase 2: Vector Memory Write
                const memory = await MemoryService.addMemory(
                    args.content, 
                    args.type || 'fact', 
                    { initiativeId: initiative?.id }
                );
                return {
                    content: `Saved to Long-Term Semantic Memory (ID: ${memory.id}).`,
                    metadata: { type: 'memory_saved', data: memory }
                };
            } else if (toolName === 'read_memory') {
                // Phase 2: Vector Memory Search (RAG)
                const results = await MemoryService.search(args.query, 3);
                const memoryText = results.map(r => `[${r.type.toUpperCase()}] ${r.content} (Score: ${r.score?.toFixed(2)})`).join('\n');
                
                return {
                     content: results.length > 0 ? `Retrieved semantic memories:\n${memoryText}` : "No relevant long-term memories found.",
                     metadata: { type: 'memory_read', data: results }
                };
            }
        } catch (e) {
            return { content: `Error executing ${toolName}: ${e}` };
        }
        return { content: `Tool ${toolName} not found.` };
    }
}

// --- ORCHESTRATOR SERVICE (The Brain) ---
class OrchestratorService extends BaseAgent {
    name: THiveAgent = 'Orchestrator';

    constructor() {
        super(`You are the Orchestrator. Break down requests into a plan.
        Decide: 'delegate' to (Scout/Guardian/Integromat/Simulation) or 'reply' to User.
        
        - If user wants a PREDICTION, SIMULATION, or "What-if" analysis, delegate to Simulation.
        - If user wants to check COMPLIANCE, ETHICS, BIAS, or RISKS, delegate to Guardian.
        - If user wants to create tickets or modify data, delegate to Integromat.
        - If user wants to create a video, delegate to Integromat with 'generate_video'.
        - If user wants a DIAGRAM (BPMN, Sequence, Mind Map), delegate to Integromat.
        - If user wants a PRESENTATION or SLIDES, delegate to Integromat.
        - If user wants to SAVE or RECALL information (Memory, RAG, Long-term), delegate to Integromat.
        
        OUTPUT FORMAT:
        { 
            "thought": "Internal monologue explaining your reasoning...", 
            "action": "delegate|reply", 
            "target": "AgentName", 
            "instructions": "..." 
        }`);
    }

    async execute(history: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse> {
        // Inject relevant long-term memories
        const memories = await MemoryService.search(instructions, 3);
        const memoryContext = memories.length > 0
            ? `\n=== RELEVANT LONG-TERM MEMORIES ===\n${memories.map(m => `- [${m.type.toUpperCase()}]: ${m.content}`).join('\n')}`
            : '';

        const prompt = this.buildContext(history, instructions + memoryContext, initiative);
        // Orchestrator relies on JSON mode. If it fails (500), BaseAgent fallback will handle it.
        const raw = await this.callLLM(prompt);
        const json = safeParseJSON<any>(raw.text);

        return {
            content: json.content || json.thought, // Fallback if content missing
            thought: json.thought,
            nextAction: json.action,
            targetAgent: json.target,
            instructions: json.instructions
        };
    }
}

// --- SERVICE REGISTRY ---
export const Microservices = {
    Orchestrator: new OrchestratorService(),
    Scout: new ScoutService(),
    Guardian: new GuardianService(),
    Integromat: new IntegromatService(),
    Simulation: new SimulationService()
};
