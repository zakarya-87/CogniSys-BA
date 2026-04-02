
import { GoogleGenAI, Type } from "@google/genai";
import { PromptFactory } from './promptFactory';
import { withRetry, safeParseJSON, validateStructure, cleanJsonString } from '../utils/aiUtils';
import { MathService } from './mathService';
import {
  TAnalysisPlan,
  TSwotAnalysis,
  TBusinessModelCanvas,
  TReportDetailLevel,
  TSuggestedKpi,
  TRecommendedTechnique,
  TWireframeElement,
  TValidationResult,
  TDataModel,
  TElicitationAnalysis,
  TTraceabilityGraphData,
  TGapAnalysisResult,
  TKpi,
  TPerformanceAnalysis,
  TFeedbackAnalysis,
  TInitiative,
  Sector,
  TPortfolioFinancials,
  TPortfolioRisks,
  TWorkBreakdown,
  TProjectVitalsAdvanced,
  TStrategicRecommendation,
  TKpiForecast,
  TDecisionMatrix,
  TBpmnFlow,
  TDomainSpecificArtifact,
  TImpactAnalysis,
  TRisk,
  TPersona,
  TSlide,
  TUatTestCase,
  TReleaseChecklistItem,
  TReadinessAssessment,
  TRetroItem,
  TStakeholderProfile,
  TDecisionTable,
  TRuleAudit,
  TKnowledgeArticle,
  TNfr,
  TRbacMatrix,
  TApiEndpoint,
  TStateModel,
  TJourneyMap,
  TVendorAssessment,
  TOCMPlan,
  TGapReport,
  TIdea,
  TVSMAnalysis,
  TGlossaryTerm,
  TCompetitorAnalysis,
  TServiceBlueprint,
  TPrioritizationAnalysis,
  TCapability,
  TBalancedScorecard,
  TDFDModel,
  TSequenceDiagram,
  TComplianceMatrix,
  TComplianceReport,
  TADR,
  TEstimationReport,
  TReleaseNote,
  TBenefitsAnalysis,
  TDailyBriefing,
  TRoadmap,
  TMigrationPlan,
  TScenarioEvent,
  TSimulationResult,
  TThreat,
  TTechniqueGuide,
  TRequirementPackage,
  TStoryMap,
  TC4Model,
  TAPMAnalysis,
  TPersonalBriefing,
  TScopeStatement,
  TDPIA,
  TPestleAnalysis,
  TSplitSuggestion,
  TUseCaseDiagram,
  TRootCauseAnalysis,
  TSurvey,
  TWorkshopPlan,
  TDMNModel,
  TForceFieldAnalysis,
  TMindMapNode,
  TUserPersona,
  TDecompositionNode,
  TOrgNode,
  TCBA,
  TSimulationRun,
  TFocusGroupResult,
  TDocumentAnalysis,
  TObservationPlan,
  TIssue,
  THatAnalysis,
  TSIPOC,
  TConceptModel,
  TConflictAnalysis,
  TValuePropCanvas,
  THiveMessage,
  TMonteCarloResult,
  TTornadoItem,
  TEthicalCheck,
  TTeamMember,
  TDebateTurn,
  TCodeArtifact,
  TVisionResult,
  TVisionAnalysisType,
  TSimulationParameter
} from '../types';

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
let _ai: GoogleGenAI | null = null;
const getAi = () => {
  if (!_ai) {
    if (!API_KEY) {
      throw new Error("An API Key must be set when running in a browser");
    }
    _ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return _ai;
};
const ai = { models: { generateContent: (...args: any[]) => getAi().models.generateContent(...args as any), embedContent: (...args: any[]) => getAi().models.embedContent(...args as any) } };

// Default model — gemini-2.5-flash is stable; gemini-3-flash-preview used when explicitly selected
let activeModelId = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash';

// Global flag to track if the primary model is exhausted (quota reached)
let isPrimaryModelExhausted = false;

export const setAiModelId = (id: string) => {
    console.log(`Switching AI Model to: ${id}`);
    activeModelId = id;
    isPrimaryModelExhausted = false; // Reset on model change
};

// ... [Keep existing schemas and helper functions] ...

// --- Strict Schemas ---

const ParameterExtractionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            min: { type: Type.NUMBER },
            max: { type: Type.NUMBER },
            distributionType: { type: Type.STRING, enum: ['Normal', 'Uniform', 'Triangular'] }
        },
        required: ["name", "min", "max", "distributionType"]
    }
};

const TornadoSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            variable: { type: Type.STRING },
            impactLow: { type: Type.NUMBER },
            impactHigh: { type: Type.NUMBER },
            base: { type: Type.NUMBER }
        },
        required: ["variable", "impactLow", "impactHigh", "base"]
    }
};

const EthicalCheckSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER },
        verdict: { type: Type.STRING, enum: ['Pass', 'Conditional', 'Fail'] },
        biasRisks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    area: { type: Type.STRING },
                    risk: { type: Type.STRING },
                    mitigation: { type: Type.STRING }
                },
                required: ["area", "risk", "mitigation"]
            }
        },
        privacyConcerns: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        summary: { type: Type.STRING }
    },
    required: ["score", "verdict", "biasRisks", "privacyConcerns", "summary"]
};

const AnalysisPlanSchema = {
  type: Type.OBJECT,
  properties: {
    approach: { type: Type.STRING },
    stakeholders: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          name: { type: Type.STRING },
        },
        required: ["role", "name"],
      },
    },
    techniques: { type: Type.ARRAY, items: { type: Type.STRING } },
    deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["approach", "stakeholders", "techniques", "deliverables"],
};

// --- Error Standardization ---
function handleAiError(error: any): never {
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('Quota')) {
        throw new Error("AI Service Quota Exceeded. The free tier limit has been reached. The quota will reset the next day. Please try again later.");
    }
    if (msg.includes('Safety') || msg.includes('blocked')) {
        throw new Error("The request was blocked by safety filters. Please refine your input.");
    }
    if (msg.includes('500') || msg.includes('503') || msg.includes('Overloaded')) {
        throw new Error("AI Service is temporarily overloaded. Retrying usually fixes this.");
    }
    throw error;
}


// --- Self-Healing JSON Logic ---

async function repairJson<T>(malformedJson: string, errorMsg: string, schema?: any): Promise<T> {
    console.warn("Attempting to repair malformed JSON via AI...", errorMsg);
    
    const repairPrompt = `You are a JSON Repair Agent. The following JSON string is invalid or missing required keys. 
    Error: ${errorMsg}
    ${schema ? `Expected Schema: ${JSON.stringify(schema)}` : ''}
    
    CORRECT THE JSON. Ensure all required keys are present. Do not add any conversational text. Return ONLY valid JSON.
    
    Broken JSON:
    ${malformedJson}`;

    const executeRepair = async (modelId: string) => {
        if (modelId === 'mistral') {
            const response = await callMistral({ messages: [{ role: 'user', content: repairPrompt }] });
            return response.choices[0].message.content;
        } else if (modelId === 'azure-openai') {
            const response = await callAzureOpenAI({ messages: [{ role: 'user', content: repairPrompt }] });
            return response.choices[0].message.content;
        } else {
            const response = await ai.models.generateContent({
                model: modelId,
                contents: repairPrompt,
                config: { responseMimeType: "application/json" }
            });
            return response.text || "";
        }
    };

    const modelsToTry = [activeModelId];
    if (activeModelId !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
    if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
    if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

    let lastError: any = null;
    for (const modelId of modelsToTry) {
        if (modelId === 'gemini-3-flash-preview' && isPrimaryModelExhausted) continue;
        try {
            const fixedText = await executeRepair(modelId);
            if (fixedText) return safeParseJSON<T>(fixedText, undefined, true);
        } catch (e: any) {
            lastError = e;
            const errorMessage = e.message || "";
            if (errorMessage.includes('429') || errorMessage.includes('Quota')) {
                if (modelId === 'gemini-3-flash-preview') {
                    isPrimaryModelExhausted = true;
                    window.dispatchEvent(new Event('quota-exceeded'));
                }
            }
            console.warn(`Repair attempt with ${modelId} failed. Trying next...`, errorMessage);
        }
    }
    
    throw lastError || new Error("Failed to repair JSON data.");
}

import generatedSchemas from '../generated_schemas.json';
import { callMistral, callAzureOpenAI } from './llmProxyService';

// --- Core AI Caller ---

async function generateJson<T>(prompt: string, schema?: any, requiredKeys: string[] = []): Promise<T> {
  return withRetry(async () => {
    try {
        let text = "";
        
        // Always append schema to prompt for all models to ensure robust JSON structure
        const fullPrompt = schema ? `${prompt}\n\nPlease return the response in JSON format matching this schema:\n${JSON.stringify(schema)}` : prompt;

        const callModel = async (modelId: string) => {
            if (modelId === 'mistral') {
                const response = await callMistral({
                    messages: [{ role: 'user', content: fullPrompt }],
                });
                return response.choices[0].message.content;
            } else if (modelId === 'azure-openai') {
                const response = await callAzureOpenAI({
                    messages: [{ role: 'user', content: fullPrompt }],
                });
                return response.choices[0].message.content;
            } else {
                const response = await ai.models.generateContent({
                    model: modelId,
                    contents: fullPrompt,
                    config: {
                        responseMimeType: "application/json",
                    },
                });
                return response.text || "";
            }
        };

        const modelsToTry = [activeModelId];
        if (activeModelId !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
        if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
        if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

        let lastError: any = null;
        for (const modelId of modelsToTry) {
            if (modelId === 'gemini-3-flash-preview' && isPrimaryModelExhausted) continue;
            
            try {
                text = await callModel(modelId);
                if (text) break;
            } catch (error: any) {
                lastError = error;
                const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || error.status === 'RESOURCE_EXHAUSTED';
                
                if (isQuotaError && modelId === 'gemini-3-flash-preview') {
                    isPrimaryModelExhausted = true;
                    window.dispatchEvent(new Event('quota-exceeded'));
                }
                
                console.warn(`Model ${modelId} failed. Trying next in chain...`, errorMessage);
                continue; // Always try next model
            }
        }

        if (!text) {
            if (lastError) throw lastError;
            throw new Error("All models in fallback chain failed.");
        }

        if (!text) throw new Error("Empty response from AI Model.");

        try {
            // Robust Parsing
            const data = safeParseJSON<T>(text);

            // Optional: Structural Validation
            if (requiredKeys.length > 0) {
                validateStructure(data, requiredKeys);
            }
            return data;

        } catch (parseError: any) {
            // --- Self-Healing Trigger ---
            // If parsing fails or structure validation fails, try to repair it once.
            try {
                const repairedData = await repairJson<T>(text, parseError.message, schema);
                
                // Re-validate the repaired data
                if (requiredKeys.length > 0) {
                    validateStructure(repairedData, requiredKeys);
                }
                return repairedData;
            } catch (repairError) {
                console.error("JSON Repair Failed:", repairError);
                throw parseError; // Throw original error if repair fails
            }
        }
    } catch (error) {
        handleAiError(error);
        throw error; // unreachable due to handleAiError throwing
    }
  });
}

// Special handler for Search Grounding (which doesn't support responseMimeType: JSON)
async function generateGroundedJson<T>(prompt: string, requiredKeys: string[] = []): Promise<T> {
    return withRetry(async () => {
        try {
            let text = "";
            let sources: { title: string, uri: string }[] = [];

            const executeCall = async (modelId: string) => {
                const response = await ai.models.generateContent({
                    model: modelId,
                    contents: prompt,
                    config: {
                        tools: [{ googleSearch: {} }],
                    },
                });

                const resText = response.text || "";
                const resSources: { title: string, uri: string }[] = [];

                // Extract sources
                const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (chunks) {
                    chunks.forEach((chunk: any) => {
                        if (chunk.web) {
                            resSources.push({ title: chunk.web.title, uri: chunk.web.uri });
                        }
                    });
                }
                return { text: resText, sources: resSources };
            };

            if (activeModelId === 'mistral' || activeModelId === 'azure-openai') {
                // Mistral and Azure OpenAI don't have built-in Google Search grounding in this setup
                // We'll just call them normally
                const fullPrompt = `${prompt}\n\nPlease return the response in JSON format.`;
                const tryProxyModels = async (models: string[]) => {
                    for (const modelId of models) {
                        try {
                            if (modelId === 'mistral') {
                                const response = await callMistral({ messages: [{ role: 'user', content: fullPrompt }] });
                                return { text: response.choices[0].message.content, sources: [] };
                            } else if (modelId === 'azure-openai') {
                                const response = await callAzureOpenAI({ messages: [{ role: 'user', content: fullPrompt }] });
                                return { text: response.choices[0].message.content, sources: [] };
                            }
                        } catch (error: any) {
                            console.warn(`${modelId} failed, trying next...`, error);
                        }
                    }
                    return null;
                };

                const proxyResult = await tryProxyModels([activeModelId, activeModelId === 'mistral' ? 'azure-openai' : 'mistral']);
                if (proxyResult) {
                    text = proxyResult.text;
                    sources = proxyResult.sources;
                } else {
                    // Fallback to Gemini if all proxies fail
                    const result = await executeCall('gemini-3-flash-preview');
                    text = result.text;
                    sources = result.sources;
                }
            } else {
                const modelsToTry = [activeModelId];
                if (activeModelId !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
                if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
                if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

                let lastError: any = null;
                for (const modelId of modelsToTry) {
                    if (modelId === 'gemini-3-flash-preview' && isPrimaryModelExhausted) continue;
                    try {
                        if (modelId === 'mistral') {
                            const fullPrompt = `${prompt}\n\nPlease return the response in JSON format.`;
                            const response = await callMistral({ messages: [{ role: 'user', content: fullPrompt }] });
                            text = response.choices[0].message.content;
                            sources = [];
                        } else if (modelId === 'azure-openai') {
                            const fullPrompt = `${prompt}\n\nPlease return the response in JSON format.`;
                            const response = await callAzureOpenAI({ messages: [{ role: 'user', content: fullPrompt }] });
                            text = response.choices[0].message.content;
                            sources = [];
                        } else {
                            const result = await executeCall(modelId);
                            text = result.text;
                            sources = result.sources;
                        }
                        if (text) break;
                    } catch (error: any) {
                        lastError = error;
                        const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                        const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || error.status === 'RESOURCE_EXHAUSTED';
                        
                        if (isQuotaError && modelId === 'gemini-3-flash-preview') {
                            isPrimaryModelExhausted = true;
                            window.dispatchEvent(new Event('quota-exceeded'));
                        }
                        
                        console.warn(`Model ${modelId} failed. Trying next in chain...`, errorMessage);
                        continue; // Always try next model
                    }
                }
                if (!text && lastError) throw lastError;
            }

            if (!text) throw new Error("Empty response from AI Model.");

            // Clean & Parse JSON (since model returns text with potential JSON block)
            let data: T;
            try {
                data = safeParseJSON<T>(text);
                if (requiredKeys.length > 0) {
                    validateStructure(data, requiredKeys);
                }
            } catch (parseError: any) {
                // --- Self-Healing Trigger ---
                try {
                    data = await repairJson<T>(text, parseError.message);
                    
                    // Re-validate the repaired data
                    if (requiredKeys.length > 0) {
                        validateStructure(data, requiredKeys);
                    }
                } catch (repairError) {
                    console.error("Grounded JSON Repair Failed:", repairError);
                    throw parseError;
                }
            }

            // Inject sources if the type supports it
            if ((data as any).sources === undefined && sources.length > 0) {
                (data as any).sources = sources;
            }

            return data;
        } catch (error) {
            handleAiError(error);
            throw error;
        }
    });
}

export async function generateText(prompt: string): Promise<string> {
  return withRetry(async () => {
    try {
        const callModel = async (modelId: string) => {
            if (modelId === 'mistral') {
                const response = await callMistral({ messages: [{ role: 'user', content: prompt }] });
                return response.choices[0].message.content || "";
            } else if (modelId === 'azure-openai') {
                const response = await callAzureOpenAI({ messages: [{ role: 'user', content: prompt }] });
                return response.choices[0].message.content || "";
            } else {
                const response = await ai.models.generateContent({
                    model: modelId,
                    contents: prompt,
                });
                return response.text || "";
            }
        };

        const modelsToTry = [activeModelId];
        if (activeModelId !== FALLBACK_MODEL) modelsToTry.push(FALLBACK_MODEL);
        if (!modelsToTry.includes('mistral')) modelsToTry.push('mistral');
        if (!modelsToTry.includes('azure-openai')) modelsToTry.push('azure-openai');

        let lastError: any = null;
        for (const modelId of modelsToTry) {
            if (modelId === 'gemini-3-flash-preview' && isPrimaryModelExhausted) continue;
            try {
                const result = await callModel(modelId);
                if (result) return result;
            } catch (error: any) {
                lastError = error;
                const errorMessage = error.message || error.error?.message || JSON.stringify(error);
                const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || error.status === 'RESOURCE_EXHAUSTED';
                
                if (isQuotaError && modelId === 'gemini-3-flash-preview') {
                    isPrimaryModelExhausted = true;
                    window.dispatchEvent(new Event('quota-exceeded'));
                }
                
                console.warn(`Model ${modelId} failed. Trying next in chain...`, errorMessage);
                continue; // Always try next model
            }
        }
        if (lastError) throw lastError;
        throw new Error("All models in fallback chain failed.");
    } catch (error) {
        handleAiError(error);
        return ""; // Unreachable
    }
  });
}

// --- Embedding Generation (New for Phase 2) ---

export const getEmbedding = async (text: string): Promise<number[]> => {
  return withRetry(async () => {
    try {
        const model = "gemini-embedding-2-preview";
        const result = await ai.models.embedContent({ 
            model, 
            contents: text
        });
        
        if (!result.embeddings || !result.embeddings[0].values) {
            throw new Error("No embedding returned from API.");
        }
        
        return result.embeddings[0].values;
    } catch (error) {
        console.error("Embedding generation failed", error);
        throw error;
    }
  });
};


// ... [Rest of the existing exports: generateConceptVideo, generateAnalysisPlan, etc. NO CHANGES BELOW THIS LINE NEEDED] ...

// Helper interface for the Double-Pass Validator pattern
interface DoublePassResponse<T> {
  _draft_logic: string;
  _audit_log: string[];
  final_diagram: T;
}

// --- Video Generation (Veo) ---
export const generateConceptVideo = async (prompt: string): Promise<string> => {
  // IMPORTANT: Re-instantiate with latest key for Veo requests as per best practice
  const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let operation = await veoAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: '16:9'
    }
  });

  // Polling Loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll interval
    operation = await veoAi.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  
  if (!downloadLink) throw new Error("Video generation failed or returned no URI.");

  // Note: The UI must fetch with the API key appended
  return downloadLink;
};


// --- Strategy & Planning ---

export const generateAnalysisPlan = async (brief: string, sector: string): Promise<TAnalysisPlan> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Create a Business Analysis Plan.`,
      brief,
      sector as Sector
  );
  return generateJson<TAnalysisPlan>(prompt, AnalysisPlanSchema, ['approach', 'stakeholders', 'techniques']);
};

const SwotAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["strengths", "weaknesses", "opportunities", "threats"]
};

export const generateSwotAnalysis = async (context: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TSwotAnalysis> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Perform a SWOT analysis. Return JSON.`,
    context,
    sector,
    "JSON",
    language
  );
  return generateJson<TSwotAnalysis>(prompt, SwotAnalysisSchema, ['strengths', 'weaknesses']);
};

const BusinessModelCanvasSchema = {
    type: Type.OBJECT,
    properties: {
        customerSegments: { type: Type.ARRAY, items: { type: Type.STRING } },
        valuePropositions: { type: Type.ARRAY, items: { type: Type.STRING } },
        channels: { type: Type.ARRAY, items: { type: Type.STRING } },
        customerRelationships: { type: Type.ARRAY, items: { type: Type.STRING } },
        revenueStreams: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyResources: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyPartnerships: { type: Type.ARRAY, items: { type: Type.STRING } },
        costStructure: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["customerSegments", "valuePropositions", "channels", "customerRelationships", "revenueStreams", "keyActivities", "keyResources", "keyPartnerships", "costStructure"]
};

export const generateBusinessModelCanvas = async (context: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TBusinessModelCanvas> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Generate a Business Model Canvas. Return JSON.`,
    context,
    sector,
    "JSON",
    language
  );
  return generateJson<TBusinessModelCanvas>(prompt, BusinessModelCanvasSchema, ['customerSegments', 'valuePropositions', 'channels', 'customerRelationships', 'revenueStreams', 'keyActivities', 'keyResources', 'keyPartnerships', 'costStructure']);
};

export const generateInvestmentAnalysis = async (context: string, cost: string, revenue: string, timeframe: string, detail: TReportDetailLevel, sector: Sector = Sector.GENERAL, language?: string): Promise<string> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Perform an investment analysis (${detail} level). Cost: ${cost}, Revenue: ${revenue}, Timeframe: ${timeframe}.`,
    context,
    sector,
    "Text",
    language
  );
  return generateText(prompt);
};

const RecommendedTechniqueSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            justification: { type: Type.STRING }
        },
        required: ["name", "justification"]
    }
};

export const recommendTechniques = async (context: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TRecommendedTechnique[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Recommend 3 BABOK techniques. Return JSON.`,
    context,
    sector,
    "JSON",
    language
  );
  try {
      return await generateJson<TRecommendedTechnique[]>(prompt, RecommendedTechniqueSchema);
  } catch (error: any) {
      if (error.message?.includes('Quota') || error.message?.includes('PERMISSION')) {
          console.warn("Using fallback techniques due to API limits.");
          return [
              { name: "Brainstorming", justification: "Generate creative ideas and solutions." },
              { name: "Document Analysis", justification: "Review existing documentation to gather context." },
              { name: "Interviews", justification: "Conduct structured interviews with stakeholders." }
          ];
      }
      throw error;
  }
};

export const suggestKpis = async (goal: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TSuggestedKpi[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Suggest 3 KPIs for the business goal: "${goal}". Return JSON.`,
    goal,
    sector,
    "JSON",
    language
  );
  return generateJson<TSuggestedKpi[]>(prompt, { type: 'array', items: generatedSchemas['TSuggestedKpi'] }, []);
};

// --- Analysis & Design ---

export const generateAcceptanceCriteria = async (story: string, sector: Sector = Sector.GENERAL, language?: string): Promise<string> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Write Gherkin acceptance criteria for: "${story}".`,
    story,
    sector,
    "Text",
    language
  );
  return generateText(prompt);
};

export const generateWireframe = async (requirements: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TWireframeElement> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Generate a JSON tree for a low-fidelity wireframe based on: "${requirements}". Use 'div', 'h1', 'p', 'button', 'input', 'img'.`,
    requirements,
    sector,
    "JSON",
    language
  );
  return generateJson<TWireframeElement>(prompt, generatedSchemas['TWireframeElement'], ['type']);
};

export const validateRequirement = async (req: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TValidationResult> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Validate this requirement against INVEST and SMART criteria. Requirement: "${req}"`,
      `Requirement Validation`,
      sector,
      "JSON",
      language
  );
  return generateJson<TValidationResult>(prompt, generatedSchemas['TValidationResult'], ['score', 'critique', 'improvedVersion']);
};

export const generateDataModel = async (description: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TDataModel> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Goal: Create a logical Entity Relationship Diagram (ERD).
       PROTOCOL (Double-Pass Validator):
       1. _draft_logic: List entities, attributes, and relationships.
       2. _audit_log: Verify relationships reference existing entities.
       3. final_diagram: TDataModel JSON.`,
       description,
       sector,
       "JSON",
       language
  );
  const response = await generateJson<DoublePassResponse<TDataModel>>(prompt);
  return response.final_diagram;
};

export const analyzeTranscript = async (transcript: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TElicitationAnalysis> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Analyze this transcript. Extract requirements, decisions, action items, and key terms. Return JSON.`,
    transcript,
    sector,
    "JSON",
    language
  );
  return generateJson<TElicitationAnalysis>(prompt, generatedSchemas['TElicitationAnalysis'], ['requirements', 'decisions']);
};

export const generateBABOKRoadmap = async (ka: string, sector: Sector = Sector.GENERAL, currentArtifacts: string[], missingModules: string[], language?: string): Promise<string> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a concise, high-impact "Maturity Roadmap" to improve BABOK compliance for the Knowledge Area: ${ka}.
        
        STRUCTURE:
        1. **Current State Analysis**: Briefly assess the current artifacts and their contribution to this KA.
        2. **Gap Identification**: What's missing according to BABOK v3 standards? Focus on the missing modules.
        3. **Actionable Roadmap**: 3-4 specific, sequential steps to reach "Full Maturity". Each step should link to one or more missing modules.
        4. **Recommended Techniques**: Suggest 2 specific BABOK techniques that would be most effective for the next steps in this roadmap.`,
        `Knowledge Area: ${ka}\nImplemented: ${currentArtifacts.join(', ')}\nMissing: ${missingModules.join(', ')}`,
        sector,
        "Text",
        language
    );
    
    return generateText(prompt);
};

export const generateTraceabilityData = async (title: string, sector: string): Promise<TTraceabilityGraphData> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Goal: Create a traceability graph linking Goals -> Requirements -> Features -> Tests.
       PROTOCOL:
       1. _draft_logic: Define nodes.
       2. _audit_log: Ensure links are valid.
       3. final_diagram: TTraceabilityGraphData.`,
       title,
       sector as Sector
  );
  const response = await generateJson<DoublePassResponse<TTraceabilityGraphData>>(prompt);
  return response.final_diagram;
};

export const analyzeTraceabilityGaps = async (data: TTraceabilityGraphData, sector: string): Promise<TGapAnalysisResult> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Analyze this traceability graph for gaps (orphans, missing tests). Data: ${JSON.stringify(data)}`,
      "Traceability Audit",
      sector as Sector
  );
  return generateJson<TGapAnalysisResult>(prompt, generatedSchemas['TGapAnalysisResult'], generatedSchemas['TGapAnalysisResult']?.required || []);
};

export const generatePerformanceAnalysis = async (kpis: TKpi[], sector: Sector = Sector.GENERAL, language?: string): Promise<TPerformanceAnalysis> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Analyze these KPIs. Identify anomalies and root causes. Return JSON.`,
    JSON.stringify(kpis),
    sector,
    "JSON",
    language
  );
  return generateJson<TPerformanceAnalysis>(prompt, generatedSchemas['TPerformanceAnalysis'], ['anomalies', 'rootCauseSummary']);
};

const FeedbackAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    overallSentiment: { type: Type.NUMBER, description: "Number from -100 to 100" },
    summary: { type: Type.STRING },
    insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          theme: { type: Type.STRING },
          sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] },
          count: { type: Type.NUMBER },
          recommendation: { type: Type.STRING }
        },
        required: ["theme", "sentiment", "count", "recommendation"]
      }
    }
  },
  required: ["overallSentiment", "summary", "insights"]
};

export const analyzeUserFeedback = async (feedback: string, sector: string): Promise<TFeedbackAnalysis> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Analyze user feedback. Extract themes and sentiment. Feedback: "${feedback}". 
      Return JSON with root keys: "overallSentiment" (number from -100 to 100), "summary" (string), and "insights" (array of objects with theme, sentiment, count, recommendation).`,
      "VoC Analysis",
      sector as Sector
  );
  return generateJson<TFeedbackAnalysis>(prompt, FeedbackAnalysisSchema, ['overallSentiment', 'insights']);
};

export const generatePortfolioReport = async (initiatives: TInitiative[], sector: Sector = Sector.GENERAL, language?: string): Promise<string> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Generate an executive portfolio summary for these initiatives.`,
    JSON.stringify(initiatives.map(i => ({ title: i.title, status: i.status }))),
    sector,
    "Text",
    language
  );
  return generateText(prompt);
};

export const generatePortfolioFinancials = async (initiatives: TInitiative[], sector: Sector = Sector.GENERAL, language?: string): Promise<TPortfolioFinancials> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Generate financial projections for this portfolio. Return JSON.`,
    JSON.stringify(initiatives.map(i => i.title)),
    sector,
    "JSON",
    language
  );
  return generateJson<TPortfolioFinancials>(prompt, generatedSchemas['TPortfolioFinancials'], generatedSchemas['TPortfolioFinancials']?.required || []);
};

export const generatePortfolioRisks = async (initiatives: TInitiative[], sector: Sector = Sector.GENERAL, language?: string): Promise<TPortfolioRisks> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Generate a risk profile for this portfolio. Return JSON.`,
    JSON.stringify(initiatives.map(i => i.title)),
    sector,
    "JSON",
    language
  );
  return generateJson<TPortfolioRisks>(prompt, generatedSchemas['TPortfolioRisks'], generatedSchemas['TPortfolioRisks']?.required || []);
};

export const generateUserStories = async (title: string, sector: string, additionalContext: string = ''): Promise<{title: string, priority: any}[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate 5 user stories.`,
      `${title}\n${additionalContext}`,
      sector as Sector
  );
  return generateJson<{title: string, priority: any}[]>(prompt);
};

export const generateWbs = async (initiative: TInitiative, backlog: any[]): Promise<TWorkBreakdown> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Create a detailed Work Breakdown Structure (WBS) and Sprint Plan based on this backlog: ${JSON.stringify(backlog)}. 
        Ensure the plan aligns with the strategic objectives of the initiative: "${initiative.title}".
        Description: "${initiative.description}".
        Return JSON with two root keys: "sprints" (array of sprints with goals and stories/tasks) and "dependencies" (array of dependencies between tasks).`,
        "Project Planning",
        initiative.sector
    );
    return generateJson<TWorkBreakdown>(prompt, generatedSchemas['TWorkBreakdown'], ['sprints', 'dependencies']);
};

export const analyzeCriticalPath = async (wbs: string, sector: string): Promise<TProjectVitalsAdvanced> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Analyze Critical Path and Resources for this WBS. WBS: ${wbs}. 
      Return JSON with root keys: "tasks" (array of tasks with id, name, start, duration, dependencies, isCritical, assignee, progress (0-100), status ('todo'|'in-progress'|'done')), "resources" (array of resource utilization), "criticalPathDuration" (number), and "riskAnalysis" (string).`,
      "Project Execution",
      sector as Sector
  );
  return generateJson<TProjectVitalsAdvanced>(prompt, generatedSchemas['TProjectVitalsAdvanced'], ['tasks', 'resources', 'criticalPathDuration', 'riskAnalysis']);
};

export const autoPrioritizeTasks = async (tasks: any[], strategicGoal: string, sector: string): Promise<any[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Auto-prioritize and adjust the schedule for these tasks based on the strategic goal: "${strategicGoal}". 
      Ensure dependencies are respected and critical tasks are scheduled earlier.
      Tasks: ${JSON.stringify(tasks)}.
      Return JSON with a single root key "tasks" containing the updated array of tasks.`,
      "Project Execution",
      sector as Sector
  );
  const result = await generateJson<{tasks: any[]}>(prompt, undefined, ['tasks']);
  return result.tasks;
};

export const generateStrategicRecommendations = async (initiatives: TInitiative[], kpis: TKpi[], sector: Sector = Sector.GENERAL, language?: string): Promise<TStrategicRecommendation[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Recommend 3 strategic initiatives based on portfolio and KPIs. Return JSON.
    IMPORTANT: The 'source' field MUST remain strictly one of ["Underperforming Feature", "High-Engagement Segment", "Market Threat"] in English, regardless of the requested language.`,
    `Initiatives: ${JSON.stringify(initiatives.map(i => i.title))}\nKPIs: ${JSON.stringify(kpis)}`,
    sector,
    "JSON",
    language
  );
  return generateJson<TStrategicRecommendation[]>(prompt, { type: 'array', items: generatedSchemas['TStrategicRecommendation'] }, []);
};

export const generateKpiForecast = async (kpiName: string, currentValue: number, sector: string, language?: string): Promise<TKpiForecast> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Forecast ${kpiName} (current: ${currentValue}) for next 6 months.`,
      "Predictive Analytics",
      sector as Sector,
      "JSON",
      language
  );
  return generateJson<TKpiForecast>(prompt, generatedSchemas['TKpiForecast'], ['forecast', 'insight']);
};

export const generateDecisionMatrixAnalysis = async (criteria: {name: string, weight: number}[], alternatives: string[], sector: Sector = Sector.GENERAL, language?: string): Promise<TDecisionMatrix> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Create a decision matrix for alternatives: ${alternatives.join(', ')} using criteria: ${JSON.stringify(criteria)}. Score 1-10. Return JSON.`,
    `Alternatives: ${alternatives.join(', ')}`,
    sector,
    "JSON",
    language
  );
  return generateJson<TDecisionMatrix>(prompt, generatedSchemas['TDecisionMatrix'], generatedSchemas['TDecisionMatrix']?.required || []);
};

export const generateBpmnFlow = async (description: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TBpmnFlow> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Goal: Generate executable BPMN 2.0 structures.
    PROTOCOL:
    1. _draft_logic: Brief scratchpad.
    2. _audit_log: Self-critique (check source/target IDs).
    3. final_diagram: The TBpmnFlow JSON.`,
    description,
    sector,
    "JSON",
    language
  );
  const response = await generateJson<DoublePassResponse<TBpmnFlow>>(prompt);
  return response.final_diagram;
};

export const generateDomainSpecificAnalysis = async (initiative: TInitiative, context: string): Promise<TDomainSpecificArtifact> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate a domain-specific artifact based on: "${context}".`,
      initiative.title,
      initiative.sector
  );
  return generateJson<TDomainSpecificArtifact>(prompt, generatedSchemas['TDomainSpecificArtifact'], generatedSchemas['TDomainSpecificArtifact']?.required || []);
};

export const generateProjectDocument = async (initiative: TInitiative, type: string): Promise<string> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Draft a ${type}.`,
      initiative.title,
      initiative.sector,
      "Markdown"
  );
  return generateText(prompt);
};

export const generateImpactAnalysis = async (description: string, title: string, sector: string): Promise<TImpactAnalysis> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Analyze impact of change "${description}".`,
      title,
      sector as Sector
  );
  return generateJson<TImpactAnalysis>(prompt, generatedSchemas['TImpactAnalysis'], generatedSchemas['TImpactAnalysis']?.required || []);
};

export const generateRiskAssessment = async (title: string, desc: string, sector: string, additionalContext: string = ''): Promise<TRisk[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Identify risks. Description: "${desc}". \n${additionalContext}`,
      title,
      sector as Sector
  );
  return generateJson<TRisk[]>(prompt, { type: 'array', items: generatedSchemas['TRisk'] }, []);
};

export const generateStakeholderPersonas = async (title: string, desc: string, sector: string): Promise<TPersona[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate 3 stakeholder personas.`,
      title,
      sector as Sector
  );
  return generateJson<TPersona[]>(prompt, { type: 'array', items: generatedSchemas['TPersona'] }, []);
};

export const getPersonaResponse = async (persona: TPersona, history: any[], input: string, context: string): Promise<string> => {
  const prompt = `Roleplay as ${persona.name} (${persona.role}). Context: ${context}. User says: "${input}". Reply briefly.`;
  return generateText(prompt);
};

export const generatePresentation = async (title: string, desc: string, sector: string): Promise<{ slides: TSlide[], executiveSummary: string }> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `أنت خبير في ريادة الأعمال والابتكار وفقًا للقرار 1275 في الجزائر الخاص بالمؤسسات الناشئة والمشاريع المبتكرة.
مهمتك إعداد عرض تقديمي احترافي (Pitch Deck) لفكرة مشروع مبتكر بطريقة أكاديمية وريادية في آنٍ واحد.

يجب أن يكون العرض منظمًا في شرائح واضحة، وكل شريحة تحتوي على عنوان ومحتوى مركز ومقنع.

هيكل العرض يجب أن يتضمن ما يلي:
- تقديم عام عن المشروع (اسم المشروع، الرؤية والرسالة، القطاع المستهدف)
- المشكلة المطروحة (وصف دقيق وعميق للمشكلة، حجم وتأثير المشكلة اقتصاديًا أو اجتماعيًا، لماذا الحلول الحالية غير كافية)
- الحل المقترح (شرح واضح لكيفية عمل الحل، التكنولوجيا أو المنهجية المستخدمة، كيف يعالج الحل جوهر المشكلة، القيمة المضافة)
- الجوانب الابتكارية وفق القرار 1275 (توضيح عنصر الابتكار، كيف يحقق المشروع صفة “مبتكر” حسب معايير القرار 1275، عنصر التفرد وعدم التقليدية)
- نموذج الأعمال (مصادر الإيرادات، الفئة المستهدفة، استراتيجية الوصول للسوق)
- الأثر الاقتصادي والاجتماعي (خلق مناصب شغل، دعم الاقتصاد الرقمي أو الصناعي، المساهمة في التنمية الوطنية)
- خطة التطوير المستقبلية (مراحل النمو، التوسع، الشراكات المحتملة)

يجب أن يكون الأسلوب: رسمي، احترافي، مقنع، بلغة واضحة وقوية، خالٍ من الحشو، موجه للجنة تقييم جامعية أو لجنة وسم “مشروع مبتكر”.

في النهاية، قدم ملخصًا تنفيذيًا قصيرًا يمكن قراءته في أقل من دقيقة.

Return a JSON object with two properties:
1. "slides": An array of slide objects. Each slide object must have:
   - "title": string
   - "bullets": array of strings (the content)
   - "footer": string
   - "type": string (e.g., "Vision", "Problem", "Solution", "Business Model", etc.)
2. "executiveSummary": string (the short executive summary)`,
      `${title}: ${desc}`,
      sector as Sector
  );
  return generateJson<{ slides: TSlide[], executiveSummary: string }>(prompt);
};

export const generateUatScripts = async (stories: {title: string}[], sector: string): Promise<TUatTestCase[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate UAT test cases for stories: ${JSON.stringify(stories)}.`,
      "UAT Planning",
      sector as Sector
  );
  return generateJson<TUatTestCase[]>(prompt, { type: 'array', items: generatedSchemas['TUatTestCase'] }, []);
};

export const generateReleaseChecklist = async (sector: string): Promise<TReleaseChecklistItem[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate a release checklist.`,
      "Release Management",
      sector as Sector
  );
  return generateJson<TReleaseChecklistItem[]>(prompt, { type: 'array', items: generatedSchemas['TReleaseChecklistItem'] }, []);
};

export const analyzeLaunchReadiness = async (checklist: TReleaseChecklistItem[], openBugs: number, sector: string): Promise<TReadinessAssessment> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Assess launch readiness. Checklist: ${JSON.stringify(checklist)}. Open bugs: ${openBugs}.`,
      "Release Gate",
      sector as Sector
  );
  return generateJson<TReadinessAssessment>(prompt, generatedSchemas['TReadinessAssessment'], generatedSchemas['TReadinessAssessment']?.required || []);
};

export const generateRetrospectiveAnalysis = async (context: string, summary: string): Promise<TRetroItem[]> => {
  const prompt = `Generate retrospective items. Context: "${context}". Summary: "${summary}". Return JSON.`;
  return generateJson<TRetroItem[]>(prompt, { type: 'array', items: generatedSchemas['TRetroItem'] }, []);
};

export const analyzeStakeholder = async (role: string, desc: string, sector: string): Promise<TStakeholderProfile> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Analyze stakeholder "${role}".`,
      desc,
      sector as Sector
  );
  return generateJson<TStakeholderProfile>(prompt, generatedSchemas['TStakeholderProfile'], generatedSchemas['TStakeholderProfile']?.required || []);
};

export const generateDecisionTable = async (policy: string, sector: string): Promise<TDecisionTable> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Create a Decision Table for logic: "${policy}".`,
        "Business Rules",
        sector as Sector
    );
    return generateJson<TDecisionTable>(prompt, generatedSchemas['TDecisionTable'], generatedSchemas['TDecisionTable']?.required || []);
};

export const auditBusinessRules = async (table: TDecisionTable): Promise<TRuleAudit> => {
    const prompt = `Audit this decision table for gaps and overlaps: ${JSON.stringify(table)}. Return JSON.`;
    return generateJson<TRuleAudit>(prompt, generatedSchemas['TRuleAudit'], generatedSchemas['TRuleAudit']?.required || []);
};

export const generateKnowledgeArticles = async (title: string, desc: string, sector: string): Promise<TKnowledgeArticle[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate 3 knowledge articles (SOPs/FAQs).`,
        title,
        sector as Sector
    );
    return generateJson<TKnowledgeArticle[]>(prompt, { type: 'array', items: generatedSchemas['TKnowledgeArticle'] }, []);
};

export const generateNfrs = async (title: string, desc: string, sector: string): Promise<TNfr[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate Non-Functional Requirements (NFRs).`,
        title,
        sector as Sector
    );
    return generateJson<TNfr[]>(prompt, { type: 'array', items: generatedSchemas['TNfr'] }, []);
};

export const generateRbacMatrix = async (title: string, desc: string, sector: string): Promise<TRbacMatrix> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate an RBAC security matrix.`,
        title,
        sector as Sector
    );
    return generateJson<TRbacMatrix>(prompt, generatedSchemas['TRbacMatrix'], generatedSchemas['TRbacMatrix']?.required || []);
};

export const generateApiSpec = async (title: string, desc: string, sector: string): Promise<TApiEndpoint[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate REST API endpoints specification.`,
        title,
        sector as Sector
    );
    return generateJson<TApiEndpoint[]>(prompt, { type: 'array', items: generatedSchemas['TApiEndpoint'] }, []);
};

export const generateStateModel = async (title: string, sector: string, entityName: string): Promise<TStateModel> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a State Machine Diagram for entity: "${entityName}".`,
        title,
        sector as Sector
    );
    return generateJson<TStateModel>(prompt, generatedSchemas['TStateModel'], generatedSchemas['TStateModel']?.required || []);
};

export const generateJourneyMap = async (title: string, sector: string, persona: string, scenario: string): Promise<TJourneyMap> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Customer Journey Map. Persona: ${persona}. Scenario: ${scenario}.`,
        title,
        sector as Sector
    );
    return generateJson<TJourneyMap>(prompt, generatedSchemas['TJourneyMap'], generatedSchemas['TJourneyMap']?.required || []);
};

export const generateVendorAnalysis = async (title: string, desc: string, sector: string, need: string): Promise<TVendorAssessment> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Vendor Assessment/Comparison for need: "${need}".`,
        title,
        sector as Sector
    );
    return generateJson<TVendorAssessment>(prompt, generatedSchemas['TVendorAssessment'], generatedSchemas['TVendorAssessment']?.required || []);
};

export const generateOCMPlan = async (title: string, sector: Sector = Sector.GENERAL, context: string, language?: string): Promise<TOCMPlan> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate an OCM (Organizational Change Management) Plan.`,
        `${title}\n${context}`,
        sector,
        "JSON",
        language
    );
    return generateJson<TOCMPlan>(prompt, generatedSchemas['TOCMPlan'], generatedSchemas['TOCMPlan']?.required || []);
};

export const generateGapAnalysis = async (current: string, future: string, sector: Sector = Sector.GENERAL, description: string, language?: string): Promise<TGapReport> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform a Gap Analysis. Current State: ${current}. Future State: ${future}.`,
        description,
        sector,
        "JSON",
        language
    );
    return generateJson<TGapReport>(prompt, generatedSchemas['TGapReport'], generatedSchemas['TGapReport']?.required || []);
};

export const generateExportSummary = async (title: string, sector: string, contextData: string[]): Promise<string> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a comprehensive project report/executive summary based on these artifacts.`,
        contextData.join('\n'),
        sector as Sector,
        "Markdown"
    );
    return generateText(prompt);
};

export const generateBrainstormingIdeas = async (problem: string, technique: string, sector: string): Promise<TIdea[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate brainstorming ideas using ${technique} technique for problem: "${problem}".
        Return a JSON array of objects. Each object must have the following keys: "id" (string), "text" (string), "type" (string, e.g. 'Substitute', 'Combine', 'General'), "votes" (number, default 0), and "isPromoted" (boolean, default false).`,
        "Ideation",
        sector as Sector
    );
    return generateJson<TIdea[]>(prompt, { type: 'array', items: generatedSchemas['TIdea'] }, []);
};

export const generateValueStream = async (processDesc: string, sector: string): Promise<TVSMAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Create a Value Stream Map analysis for: "${processDesc}".`,
        "Process Improvement",
        sector as Sector
    );
    return generateJson<TVSMAnalysis>(prompt, generatedSchemas['TVSMAnalysis'], generatedSchemas['TVSMAnalysis']?.required || []);
};

export const generateGlossary = async (title: string, desc: string, sector: string): Promise<TGlossaryTerm[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Extract a glossary of business terms.`,
        `${title}\n${desc}`,
        sector as Sector
    );
    return generateJson<TGlossaryTerm[]>(prompt, { type: 'array', items: generatedSchemas['TGlossaryTerm'] }, []);
};

export const generateCompetitorAnalysis = async (competitor: string, title: string, desc: string, sector: string): Promise<TCompetitorAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform a competitive analysis against "${competitor}".`,
        `${title}\n${desc}`,
        sector as Sector
    );
    return generateGroundedJson<TCompetitorAnalysis>(prompt);
};

export const generateServiceBlueprint = async (scenario: string, sector: string): Promise<TServiceBlueprint> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Service Blueprint for scenario: "${scenario}".`,
        "Service Design",
        sector as Sector
    );
    return generateJson<TServiceBlueprint>(prompt, generatedSchemas['TServiceBlueprint'], generatedSchemas['TServiceBlueprint']?.required || []);
};

export const generatePhaseAdvice = async (initiative: TInitiative, phase: string, language?: string): Promise<string> => {
    const artifacts = Object.keys(initiative.artifacts || {}).join(', ');
    const prompt = PromptFactory.createContextAwarePrompt(
        `As a BABOK-certified Business Analyst, provide 3 actionable pieces of advice for the ${phase} phase of this initiative. 
        Focus on what's missing or what should be the next priority based on the current artifacts: ${artifacts}. 
        Return Markdown.`,
        initiative.title,
        initiative.sector,
        "Markdown",
        language
    );
    return generateText(prompt);
};

export const generateOptimizationAdvice = async (context: string, sector: Sector): Promise<string> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `As a Strategic Business Analyst, provide 3 actionable optimizations based on this analysis: ${context}. 
        Focus on shifting the project outcome towards the optimistic side or stabilizing uncertainty. 
        Return Markdown.`,
        "Strategic Optimization",
        sector,
        "Markdown"
    );
    return generateText(prompt);
};

export const suggestFeatures = async (initiative: TInitiative): Promise<string[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Suggest 10 high-impact features or requirements for this initiative based on its title, sector, and description. Focus on unique value propositions and BABOK-aligned capabilities.`,
        initiative.title,
        initiative.sector,
        "JSON"
    );
    return generateJson<string[]>(prompt, { type: 'array', items: { type: 'string' } }, []);
};

export const prioritizeBacklog = async (features: string[], sector: string): Promise<TPrioritizationAnalysis[]> => {
    const prompt = `
    You are a Strategic Product Manager and Business Analyst.
    
    TASK:
    Prioritize the following list of features for an initiative in the ${sector} sector.
    
    FEATURES:
    ${features.join(', ')}
    
    FRAMEWORKS TO APPLY:
    1. **MoSCoW**: Must Have, Should Have, Could Have, Won't Have.
    2. **RICE**: 
       - Reach (Estimated number of users impacted per month)
       - Impact (1=Minimal, 2=Low, 3=Medium, 4=High, 5=Massive)
       - Confidence (Percentage: 50%, 80%, 100%)
       - Effort (Person-months or relative score 1-10)
       - Score = (Reach * Impact * Confidence) / Effort
    3. **Kano Model**: Basic (Must-be), Performance (One-dimensional), Delighter (Attractive).
    4. **Value vs. Effort**: Score both Value and Effort from 1 to 10 for a 2x2 matrix.
    
    OUTPUT FORMAT:
    Return a JSON array of TPrioritizationAnalysis objects.
    
    TPrioritizationAnalysis Schema:
    {
        "featureId": "string",
        "featureTitle": "string",
        "moscow": "Must Have" | "Should Have" | "Could Have" | "Won't Have",
        "rice": {
            "reach": number,
            "impact": number,
            "confidence": number,
            "effort": number,
            "score": number
        },
        "kano": "Basic" | "Performance" | "Delighter",
        "value": number (1-10),
        "effort": number (1-10),
        "reasoning": "string (brief justification)"
    }
    `;
    return generateJson<TPrioritizationAnalysis[]>(prompt, { type: 'array', items: generatedSchemas['TPrioritizationAnalysis'] }, []);
};

export const generateCapabilityMap = async (sector: string): Promise<TCapability> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Business Capability Map for a typical ${sector} enterprise.`,
        "Enterprise Architecture",
        sector as Sector
    );
    return generateJson<TCapability>(prompt, generatedSchemas['TCapability'], generatedSchemas['TCapability']?.required || []);
};

export const generateBalancedScorecard = async (title: string, sector: string): Promise<TBalancedScorecard> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Balanced Scorecard.`,
        title,
        sector as Sector
    );
    return generateJson<TBalancedScorecard>(prompt, generatedSchemas['TBalancedScorecard'], generatedSchemas['TBalancedScorecard']?.required || []);
};

export const generateDFD = async (title: string, sector: string): Promise<TDFDModel> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Level 1 Data Flow Diagram (DFD).`,
        title,
        sector as Sector
    );
    return generateJson<TDFDModel>(prompt, generatedSchemas['TDFDModel'], generatedSchemas['TDFDModel']?.required || []);
};

export const generateSequenceDiagram = async (title: string, sector: string, scenario: string): Promise<TSequenceDiagram> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a UML Sequence Diagram for scenario: "${scenario}".`,
        title,
        sector as Sector
    );
    return generateJson<TSequenceDiagram>(prompt, generatedSchemas['TSequenceDiagram'], generatedSchemas['TSequenceDiagram']?.required || []);
};

export const chatWithCatalyst = async (history: { sender: string; text: string }[], newMessage: string, context: string, sector: string): Promise<string> => {
    const conversation = history.map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = PromptFactory.createContextAwarePrompt(
        `Continue the conversation. User says: "${newMessage}"`,
        `History:\n${conversation}\n\nProject Context: ${context}`,
        sector as Sector,
        "Text"
    );
    return generateText(prompt);
};

export const generateComplianceMatrix = async (title: string, sector: string): Promise<TComplianceMatrix> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Regulatory Compliance Matrix.`,
        title,
        sector as Sector
    );
    return generateJson<TComplianceMatrix>(prompt, generatedSchemas['TComplianceMatrix'], generatedSchemas['TComplianceMatrix']?.required || []);
};

const ComplianceReportSchema = {
    type: Type.OBJECT,
    properties: {
        initiativeId: { type: Type.STRING },
        initiativeTitle: { type: Type.STRING },
        generatedAt: { type: Type.STRING },
        overallScore: { type: Type.NUMBER },
        matrices: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    standard: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                clause: { type: Type.STRING },
                                status: { type: Type.STRING },
                                remediation: { type: Type.STRING }
                            },
                            required: ["clause", "status", "remediation"]
                        }
                    }
                },
                required: ["standard", "score", "items"]
            }
        },
        executiveSummary: { type: Type.STRING },
        actionItems: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    task: { type: Type.STRING },
                    assignee: { type: Type.STRING },
                    dueDate: { type: Type.STRING }
                },
                required: ["task", "assignee", "dueDate"]
            }
        }
    },
    required: ["initiativeId", "initiativeTitle", "generatedAt", "overallScore", "matrices", "executiveSummary", "actionItems"]
};

export const generateComplianceReport = async (initiative: TInitiative): Promise<TComplianceReport> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a comprehensive Compliance Report.`,
        initiative.title,
        initiative.sector as Sector
    );
    return generateJson<TComplianceReport>(prompt, ComplianceReportSchema, ['initiativeId', 'initiativeTitle', 'generatedAt', 'overallScore', 'matrices', 'executiveSummary', 'actionItems']);
};

export const generateADR = async (title: string, problem: string, sector: string): Promise<TADR> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Draft an Architecture Decision Record (ADR). Decision: ${title}. Problem: ${problem}.`,
        "Architecture",
        sector as Sector
    );
    return generateJson<TADR>(prompt, generatedSchemas['TADR'], generatedSchemas['TADR']?.required || []);
};

export const generateEstimates = async (stories: string[], sector: string): Promise<TEstimationReport> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate PERT Estimates (Optimistic, Likely, Pessimistic) for these stories: ${stories.join(', ')}.`,
        "Project Management",
        sector as Sector
    );
    return generateJson<TEstimationReport>(prompt, generatedSchemas['TEstimationReport'], generatedSchemas['TEstimationReport']?.required || []);
};

export const generateReleaseNotes = async (items: string[], sector: string, version: string): Promise<TReleaseNote> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Draft Release Notes for version ${version}. Items: ${items.join(', ')}.`,
        "Release Management",
        sector as Sector
    );
    return generateJson<TReleaseNote>(prompt, generatedSchemas['TReleaseNote'], generatedSchemas['TReleaseNote']?.required || []);
};

const BenefitsAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        currency: { type: Type.STRING },
        roi: { type: Type.NUMBER },
        npv: { type: Type.NUMBER },
        realizationScore: { type: Type.NUMBER },
        analysis: { type: Type.STRING },
        chartData: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    period: { type: Type.STRING },
                    planned: { type: Type.NUMBER },
                    actual: { type: Type.NUMBER }
                },
                required: ["period", "planned", "actual"]
            }
        }
    },
    required: ["currency", "roi", "npv", "realizationScore", "analysis", "chartData"]
};

export const analyzeBenefitsRealization = async (planned: number, actual: number, sector: string): Promise<TBenefitsAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Analyze Benefits Realization. Planned: ${planned}. Actual: ${actual}.`,
        "Value Analysis",
        sector as Sector
    );
    return generateJson<TBenefitsAnalysis>(prompt, BenefitsAnalysisSchema, ['currency', 'roi', 'npv', 'realizationScore', 'analysis', 'chartData']);
};

export const auditReviewPackage = async (title: string, desc: string, sector: string): Promise<{score: number, summary: string, flags: string[]}> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Audit this review package for completeness and risk. Title: ${title}. Desc: ${desc}.`,
        "Governance",
        sector as Sector
    );
    return generateJson<{score: number, summary: string, flags: string[]}>(prompt);
};

const briefingCache = new Map<string, TDailyBriefing>();

export const generateDailyBriefing = async (title: string, sector: string, language?: string): Promise<TDailyBriefing> => {
    const cacheKey = `${title}-${sector}-${language || 'en'}`;
    if (briefingCache.has(cacheKey)) {
        return briefingCache.get(cacheKey)!;
    }
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a daily executive briefing.`,
        title,
        sector as Sector,
        "JSON",
        language
    );
    try {
        const result = await generateJson<TDailyBriefing>(prompt, generatedSchemas['TDailyBriefing'], generatedSchemas['TDailyBriefing']?.required || []);
        briefingCache.set(cacheKey, result);
        return result;
    } catch (error: any) {
        if (error.message?.includes('Quota') || error.message?.includes('PERMISSION')) {
            console.warn("Using fallback briefing due to API limits.");
            return {
                summary: "AI Service is currently experiencing high demand. Showing cached/fallback data.",
                sentiment: "Neutral",
                risks: ["Wait for API quota to reset."],
                opportunities: ["Review existing project data."],
                priorities: ["Maintain current roadmap."]
            };
        }
        throw error;
    }
};

export const generateRoadmap = async (title: string, sector: string): Promise<TRoadmap> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a 12-month strategic roadmap with phases and milestones.`,
        title,
        sector as Sector
    );
    return generateJson<TRoadmap>(prompt, generatedSchemas['TRoadmap'], generatedSchemas['TRoadmap']?.required || []);
};

export const generateMigrationPlan = async (source: string, target: string, sector: string): Promise<TMigrationPlan> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Create a Data Migration Plan from "${source}" to "${target}".`,
        "Data Engineering",
        sector as Sector
    );
    return generateJson<TMigrationPlan>(prompt, generatedSchemas['TMigrationPlan'], generatedSchemas['TMigrationPlan']?.required || []);
};

export const generateScenarios = async (sector: string): Promise<TScenarioEvent[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate 3 future scenarios (wargaming events) to test strategy.`,
        "Strategic Planning",
        sector as Sector
    );
    return generateJson<TScenarioEvent[]>(prompt, { type: 'array', items: generatedSchemas['TScenarioEvent'] }, []);
};

const SimulationResultSchema = {
    type: Type.OBJECT,
    properties: {
        originalMetrics: {
            type: Type.OBJECT,
            properties: {
                cost: { type: Type.STRING },
                time: { type: Type.STRING },
                risk: { type: Type.STRING }
            },
            required: ["cost", "time", "risk"]
        },
        simulatedMetrics: {
            type: Type.OBJECT,
            properties: {
                cost: { type: Type.STRING },
                time: { type: Type.STRING },
                risk: { type: Type.STRING }
            },
            required: ["cost", "time", "risk"]
        },
        impactSummary: { type: Type.STRING },
        contingencyPlan: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    },
    required: ["originalMetrics", "simulatedMetrics", "impactSummary", "contingencyPlan"]
};

export const runSimulation = async (scenarioTitle: string, sector: string): Promise<TSimulationResult> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Simulate impact of scenario: "${scenarioTitle}" on project metrics.
        Return a JSON object with the following keys: "originalMetrics" (object with "cost", "time", "risk" strings), "simulatedMetrics" (object with "cost", "time", "risk" strings), "impactSummary" (string), and "contingencyPlan" (array of strings).`,
        "Wargaming",
        sector as Sector
    );
    return generateJson<TSimulationResult>(prompt, SimulationResultSchema, ['originalMetrics', 'simulatedMetrics', 'impactSummary', 'contingencyPlan']);
};

export const generateThreatModel = async (context: string, sector: string): Promise<TThreat[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform STRIDE threat modeling on this system: "${context}".`,
        "Security Architecture",
        sector as Sector
    );
    return generateJson<TThreat[]>(prompt, { type: 'array', items: generatedSchemas['TThreat'] }, []);
};

export const generateTechniqueGuide = async (technique: string, desc: string, sector: string): Promise<TTechniqueGuide> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Create a comprehensive guide for applying the BABOK technique: "${technique}".
        
        Your response MUST include:
        1. "definition": A clear definition of the technique in the context of ${sector}.
        2. "draftContent": A draft content/template that the user can use as a starting point for their analysis.
        3. "steps": A list of step-by-step execution instructions.
        4. "technique": The name of the technique itself.`,
        desc,
        sector as Sector
    );
    const schema = generatedSchemas['TTechniqueGuide'];
    const required = schema?.required || ['definition', 'draftContent', 'steps', 'technique'];
    return generateJson<TTechniqueGuide>(prompt, schema, required);
};

export const suggestReusablePackages = async (sector: string): Promise<TRequirementPackage[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Suggest 3 reusable requirement packages/libraries relevant to this domain.`,
        "Requirements Reuse",
        sector as Sector
    );
    return generateJson<TRequirementPackage[]>(prompt, { type: 'array', items: generatedSchemas['TRequirementPackage'] }, []);
};

export const generateUserStoryMap = async (title: string, sector: string): Promise<TStoryMap> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a User Story Map (Backbone, Releases, Stories). Also provide a brief AI analysis of the story map strategy.`,
        title,
        sector as Sector
    );
    return generateJson<TStoryMap>(prompt, generatedSchemas['TStoryMap'], generatedSchemas['TStoryMap']?.required || []);
};

export const generateC4Model = async (desc: string, level: string, sector: string): Promise<TC4Model> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a C4 Architecture Model (Level: ${level}). System: "${desc}".`,
        "Software Architecture",
        sector as Sector
    );
    return generateJson<TC4Model>(prompt, generatedSchemas['TC4Model'], generatedSchemas['TC4Model']?.required || []);
};

export const generateAPMAnalysis = async (apps: string[], sector: string): Promise<TAPMAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform Application Portfolio Management (TIME analysis) on: ${apps.join(', ')}.`,
        "IT Strategy",
        sector as Sector
    );
    return generateJson<TAPMAnalysis>(prompt, generatedSchemas['TAPMAnalysis'], generatedSchemas['TAPMAnalysis']?.required || []);
};

export const ingestRawIntelligence = async (rawText: string): Promise<{title: string, description: string, sector: Sector}> => {
    const prompt = `
    You are an expert Business Analyst. A stakeholder has provided the following raw intelligence, ideas, or meeting notes:
    
    "${rawText}"
    
    Analyze this text and synthesize it into a structured strategic initiative.
    
    OUTPUT JSON FORMAT:
    {
        "title": "A concise, professional title for the initiative (max 6 words)",
        "description": "A clear, professional description summarizing the core goal and value proposition (2-3 sentences)",
        "sector": "One of the following exact strings: 'Cloud & SaaS', 'Fintech', 'Renewable Energy', 'Circular Economy', 'Agritech & Foodtech', 'Industry 4.0 & IoT', 'Biotech & Pharma', 'General Business'"
    }
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            sector: { 
                type: Type.STRING,
                enum: ['Cloud & SaaS', 'Fintech', 'Renewable Energy', 'Circular Economy', 'Agritech & Foodtech', 'Industry 4.0 & IoT', 'Biotech & Pharma', 'General Business']
            }
        },
        required: ["title", "description", "sector"]
    };

    return generateJson<{title: string, description: string, sector: Sector}>(prompt, schema, ['title', 'description', 'sector']);
};

export const generatePersonalBriefing = async (user: string, initiatives: TInitiative[]): Promise<TPersonalBriefing> => {
    const context = `User: ${user}. Initiatives: ${initiatives.map(i => i.title).join(', ')}.`;
    const prompt = `Generate a personal daily briefing and prioritized task list. Context: ${context}. Return JSON.`;
    return generateJson<TPersonalBriefing>(prompt, generatedSchemas['TPersonalBriefing'], generatedSchemas['TPersonalBriefing']?.required || []);
};

export const generateScopeStatement = async (title: string, sector: string): Promise<TScopeStatement> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Project Scope Statement (In-Scope, Out-of-Scope).`,
        title,
        sector as Sector
    );
    return generateJson<TScopeStatement>(prompt, generatedSchemas['TScopeStatement'], generatedSchemas['TScopeStatement']?.required || []);
};

export const generateDPIA = async (title: string, sector: string): Promise<TDPIA> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform a Data Protection Impact Assessment (DPIA).`,
        title,
        sector as Sector
    );
    return generateJson<TDPIA>(prompt, generatedSchemas['TDPIA'], generatedSchemas['TDPIA']?.required || []);
};

export const generatePestleAnalysis = async (sector: string, location: string): Promise<TPestleAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform a PESTLE analysis for region: "${location}".
        Return ONLY a JSON object with the following exact structure:
        {
            "summary": "Executive summary of the analysis",
            "factors": [
                {
                    "category": "Political" | "Economic" | "Social" | "Technological" | "Legal" | "Environmental",
                    "factors": ["factor 1", "factor 2"],
                    "impact": "High" | "Medium" | "Low",
                    "implication": "Strategic implication"
                }
            ]
        }`,
        "Strategic Analysis",
        sector as Sector
    );
    // Use Grounded generation for real-world PESTLE data
    return generateGroundedJson<TPestleAnalysis>(prompt, ['summary', 'factors']);
};

export const generateStorySplits = async (epic: string, sector: string): Promise<TSplitSuggestion[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Split this Epic into user stories using SPIDR patterns: "${epic}".`,
        "Agile Analysis",
        sector as Sector
    );
    return generateJson<TSplitSuggestion[]>(prompt, { type: 'array', items: generatedSchemas['TSplitSuggestion'] }, []);
};

const UseCaseDiagramSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        actors: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Primary', 'Secondary'] }
                },
                required: ["id", "name", "type"]
            }
        },
        useCases: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING }
                },
                required: ["id", "name"]
            }
        },
        links: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    from: { type: Type.STRING },
                    to: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Association', 'Include', 'Extend'] }
                },
                required: ["from", "to", "type"]
            }
        }
    },
    required: ["title", "actors", "useCases", "links"]
};

export const generateUseCaseDiagram = async (context: string, sector: string): Promise<TUseCaseDiagram> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a UML Use Case Diagram structure. Context: "${context}". Return a JSON object with "title", "actors" (id, name, type: Primary|Secondary), "useCases" (id, name), and "links" (from, to, type: Association|Include|Extend). Ensure "from" and "to" in links exactly match the "id" of actors or useCases.`,
        "Requirements Modeling",
        sector as Sector
    );
    return generateJson<TUseCaseDiagram>(prompt, UseCaseDiagramSchema, ['title', 'actors', 'useCases', 'links']);
};

export const generateRootCauseAnalysis = async (problem: string, sector: string): Promise<TRootCauseAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform Root Cause Analysis (5 Whys & Fishbone) for: "${problem}".`,
        "Problem Solving",
        sector as Sector
    );
    return generateJson<TRootCauseAnalysis>(prompt, generatedSchemas['TRootCauseAnalysis'], generatedSchemas['TRootCauseAnalysis']?.required || []);
};

export const generateSurvey = async (goal: string, audience: string, sector: string): Promise<TSurvey> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Design a survey/questionnaire. Goal: "${goal}". Audience: "${audience}".`,
        "Elicitation",
        sector as Sector
    );
    return generateJson<TSurvey>(prompt, generatedSchemas['TSurvey'], generatedSchemas['TSurvey']?.required || []);
};

export const generateWorkshopAgenda = async (goal: string, duration: string, audience: string, sector: string): Promise<TWorkshopPlan> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Plan a workshop agenda. Goal: "${goal}". Duration: ${duration}. Audience: ${audience}.`,
        "Facilitation",
        sector as Sector
    );
    return generateJson<TWorkshopPlan>(prompt, generatedSchemas['TWorkshopPlan'], generatedSchemas['TWorkshopPlan']?.required || []);
};

export const generateDMNModel = async (context: string, sector: string): Promise<TDMNModel> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a DMN (Decision Model and Notation) graph for: "${context}".`,
        "Decision Modeling",
        sector as Sector
    );
    return generateJson<TDMNModel>(prompt, generatedSchemas['TDMNModel'], generatedSchemas['TDMNModel']?.required || []);
};

export const generateForceFieldAnalysis = async (change: string, sector: string): Promise<TForceFieldAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform Force Field Analysis for change: "${change}".`,
        "Change Management",
        sector as Sector
    );
    return generateJson<TForceFieldAnalysis>(prompt, generatedSchemas['TForceFieldAnalysis'], generatedSchemas['TForceFieldAnalysis']?.required || []);
};

export const generateMindMap = async (topic: string, sector: string): Promise<TMindMapNode> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Mind Map structure for topic: "${topic}".`,
        "Brainstorming",
        sector as Sector
    );
    return generateJson<TMindMapNode>(prompt, generatedSchemas['TMindMapNode'], generatedSchemas['TMindMapNode']?.required || []);
};

export const generateUserPersonas = async (audience: string, sector: string): Promise<TUserPersona[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate 3 detailed User Personas for audience: "${audience}".`,
        "UX Design",
        sector as Sector
    );
    return generateJson<TUserPersona[]>(prompt, { type: 'array', items: generatedSchemas['TUserPersona'] }, []);
};

export const generateFunctionalDecomposition = async (context: string, sector: string): Promise<TDecompositionNode> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Functional Decomposition Tree for: "${context}".`,
        "System Analysis",
        sector as Sector
    );
    return generateJson<TDecompositionNode>(prompt, generatedSchemas['TDecompositionNode'], generatedSchemas['TDecompositionNode']?.required || []);
};

export const generateOrgChart = async (context: string, sector: string): Promise<TOrgNode> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate an Organizational Chart structure for context: "${context}".`,
        "Organizational Analysis",
        sector as Sector
    );
    return generateJson<TOrgNode>(prompt, generatedSchemas['TOrgNode'], generatedSchemas['TOrgNode']?.required || []);
};

export const generateCBA = async (title: string, sector: string): Promise<TCBA> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Cost-Benefit Analysis (CBA).`,
        title,
        sector as Sector
    );
    return generateJson<TCBA>(prompt, generatedSchemas['TCBA'], generatedSchemas['TCBA']?.required || []);
};

export const runProcessSimulation = async (context: string, sector: string): Promise<TSimulationRun> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Simulate process performance (Monte Carlo). Parameters: ${context}.`,
        "Process Optimization",
        sector as Sector
    );
    return generateJson<TSimulationRun>(prompt, generatedSchemas['TSimulationRun'], generatedSchemas['TSimulationRun']?.required || []);
};

export const runFocusGroup = async (topic: string, sector: string): Promise<TFocusGroupResult> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Simulate a Focus Group discussion on topic: "${topic}".`,
        "Elicitation",
        sector as Sector
    );
    return generateJson<TFocusGroupResult>(prompt, generatedSchemas['TFocusGroupResult'], generatedSchemas['TFocusGroupResult']?.required || []);
};

export const analyzeDocument = async (text: string, sector: string): Promise<TDocumentAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Analyze document text and extract rules, requirements, terms, and data. Text: "${text.substring(0, 5000)}..."`,
        "Document Analysis",
        sector as Sector
    );
    return generateJson<TDocumentAnalysis>(prompt, generatedSchemas['TDocumentAnalysis'], generatedSchemas['TDocumentAnalysis']?.required || []);
};

export const generateObservationPlan = async (role: string, activity: string, sector: string): Promise<TObservationPlan> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Create an Observation Plan for Role: ${role}, Activity: ${activity}.`,
        "Elicitation",
        sector as Sector
    );
    return generateJson<TObservationPlan>(prompt, generatedSchemas['TObservationPlan'], generatedSchemas['TObservationPlan']?.required || []);
};

export const analyzeIssue = async (desc: string, sector: string): Promise<TIssue> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Analyze project issue/risk: "${desc}". Return structured data (excluding ID/Status).`,
        "Risk Management",
        sector as Sector
    );
    return generateJson<TIssue>(prompt, generatedSchemas['TIssue'], generatedSchemas['TIssue']?.required || []);
};

export const generateSixHatsAnalysis = async (topic: string, sector: string): Promise<THatAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform Six Thinking Hats analysis on: "${topic}".`,
        "Decision Making",
        sector as Sector
    );
    return generateJson<THatAnalysis>(prompt, generatedSchemas['THatAnalysis'], generatedSchemas['THatAnalysis']?.required || []);
};

export const generateSIPOC = async (processName: string, sector: string): Promise<TSIPOC> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a SIPOC diagram for process: "${processName}".`,
        "Process Analysis",
        sector as Sector
    );
    return generateJson<TSIPOC>(prompt, generatedSchemas['TSIPOC'], generatedSchemas['TSIPOC']?.required || []);
};

export const generateConceptModel = async (domain: string, sector: string): Promise<TConceptModel> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Business Concept Model (Ontology) for domain: "${domain}".`,
        "Information Management",
        sector as Sector
    );
    return generateJson<TConceptModel>(prompt, generatedSchemas['TConceptModel'], generatedSchemas['TConceptModel']?.required || []);
};

export const analyzeConflict = async (scenario: string, sector: string): Promise<TConflictAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Analyze stakeholder conflict and propose resolution. Scenario: "${scenario}".`,
        "Stakeholder Management",
        sector as Sector
    );
    return generateJson<TConflictAnalysis>(prompt, generatedSchemas['TConflictAnalysis'], generatedSchemas['TConflictAnalysis']?.required || []);
};

export const generateValuePropCanvas = async (product: string, segment: string, sector: string): Promise<TValuePropCanvas> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Value Proposition Canvas. Product: ${product}. Customer: ${segment}.`,
        "Strategy Analysis",
        sector as Sector
    );
    const schema = {
        type: Type.OBJECT,
        properties: {
            customerProfile: {
                type: Type.OBJECT,
                properties: {
                    jobs: { type: Type.ARRAY, items: { type: Type.STRING } },
                    pains: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gains: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["jobs", "pains", "gains"]
            },
            valueMap: {
                type: Type.OBJECT,
                properties: {
                    products: { type: Type.ARRAY, items: { type: Type.STRING } },
                    painRelievers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gainCreators: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["products", "painRelievers", "gainCreators"]
            },
            analysis: { type: Type.STRING },
            fitScore: { type: Type.NUMBER }
        },
        required: ["customerProfile", "valueMap", "analysis", "fitScore"]
    };
    return generateJson<TValuePropCanvas>(prompt, schema, ["customerProfile", "valueMap", "analysis", "fitScore"]);
};

export const summarizeConversation = async (messages: THiveMessage[]): Promise<string> => {
    const text = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `Summarize this conversation context to retain key facts and decisions:\n${text}`;
    return generateText(prompt);
};

export const generateMonteCarloSimulation = async (variables: string, iterations: number, sector: string): Promise<TMonteCarloResult> => {
    // Step 1: Use LLM to extract numerical parameters from the qualitative string
    const extractionPrompt = PromptFactory.createContextAwarePrompt(
        `Extract numerical simulation parameters from this input: "${variables}". 
         For each variable mentioned (e.g. "Dev Time", "Cost", "Risk"), estimate a realistic Minimum and Maximum integer value relevant to the ${sector} sector.
         Also assign a distribution type: 'Normal', 'Uniform', or 'Triangular'.
         Return JSON array: [{ name: "...", min: 10, max: 20, distributionType: "Normal" }, ...]`,
        "Parameter Extraction",
        sector as Sector
    );
    
    let parameters: TSimulationParameter[] = [];
    try {
        parameters = await generateJson<TSimulationParameter[]>(extractionPrompt, ParameterExtractionSchema);
    } catch (e) {
        console.warn("Failed to extract parameters via LLM, using fallback defaults.", e);
        // Fallback
        parameters = [{ name: "Estimated Impact", min: 50, max: 150 }];
    }

    // Step 2: Perform deterministic mathematical simulation (No LLM Hallucination for math)
    const result = MathService.runMonteCarlo(parameters, iterations);

    // Step 3: Ask LLM to interpret the *result*
    const interpretationPrompt = `
    Analyze these Monte Carlo simulation results for ${sector}:
    Mean: ${result.mean}
    P10 (Best Case): ${result.p10}
    P90 (Worst Case): ${result.p90}
    
    Provide a 1-sentence executive recommendation.
    `;
    
    const recommendation = await generateText(interpretationPrompt);
    result.recommendation = recommendation;

    return result;
};

export const generateTornadoAnalysis = async (goal: string, variables: string[], sector: string): Promise<TTornadoItem[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate Tornado Diagram data (Sensitivity Analysis) for Goal: ${goal}. Variables: ${variables.join(', ')}.`,
        "Risk Analysis",
        sector as Sector
    );
    return generateJson<TTornadoItem[]>(prompt, TornadoSchema);
};

export const runEthicalCheck = async (context: string, sector: string): Promise<TEthicalCheck> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform an Ethical AI & Bias Audit on this project context: "${context}".`,
        "Ethics",
        sector as Sector
    );
    return generateJson<TEthicalCheck>(prompt, EthicalCheckSchema);
};

export const mitigateEthicalRisk = async (context: string, risks: any[], sector: string): Promise<string> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Given the project context: "${context}" and the identified risks: ${JSON.stringify(risks)}, provide a rewritten version of the project description and features that mitigates these risks.`,
        "Ethics Mitigation",
        sector as Sector
    );
    return generateText(prompt);
};

// --- New Pulse Feature: Agent Comment ---

export const generateAgentComment = async (agent: TTeamMember, artifactType: string, content: any): Promise<string> => {
    const context = typeof content === 'string' ? content : (content ? JSON.stringify(content) : "");
    
    // We only send a snippet to save tokens
    const snippet = context.length > 500 ? context.substring(0, 500) + "..." : context;

    const prompt = `
    You are ${agent.name}, the ${agent.role}.
    Your Personality: ${agent.personality}.
    
    The user just updated a ${artifactType}.
    Artifact Snippet: "${snippet}"
    
    Write a short (1 sentence), professional but character-driven reaction or constructive comment.
    Do not use hashtags.
    `;
    
    return generateText(prompt);
};

// --- War Room Feature: Debate ---

export const generateDebateTurn = async (agent: TTeamMember, topic: string, history: TDebateTurn[]): Promise<TDebateTurn> => {
    const transcript = history.map(t => `${t.agentId}: ${t.text}`).join('\n');
    
    const prompt = `
    You are ${agent.name}, the ${agent.role}.
    Personality: ${agent.personality}.
    
    Current Debate Topic: "${topic}".
    
    TRANSCRIPT SO FAR:
    ${transcript}
    
    You are speaking next.
    1. Keep it short (2-3 sentences max).
    2. React to the previous speaker if applicable.
    3. Stay in character (e.g. Sentry is paranoid, Ledger is cheap).
    4. Provide a sentiment label (Agrees, Disagrees, Neutral, Constructive).
    
    Return JSON: { "text": "...", "sentiment": "..." }
    `;
    
    const response = await generateJson<{text: string, sentiment: any}>(prompt);
    
    return {
        id: `turn-${Date.now()}`,
        agentId: agent.id,
        text: response.text,
        sentiment: response.sentiment,
        timestamp: Date.now()
    };
};

export const generateConsensus = async (topic: string, history: TDebateTurn[]): Promise<string> => {
    const transcript = history.map(t => `${t.agentId}: ${t.text}`).join('\n');
    const prompt = `Summarize the debate on "${topic}" into a final consensus statement or board resolution. Transcript:\n${transcript}`;
    return generateText(prompt);
};

// --- Construct Feature: Code Generation ---

export const generateCodeArtifact = async (context: string, sourceType: string, targetLanguage: string, sector: string): Promise<TCodeArtifact> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate production-quality ${targetLanguage} code based on this artifact.
         Source Type: ${sourceType}
         
         Source Data:
         ${context.substring(0, 8000)}
        `,
        "The Construct (Code Generator)",
        sector as Sector,
        "Text"
    );

    // Using generateText because we want raw code blocks, not necessarily JSON wrapped
    const code = await generateText(prompt);
    
    // Clean up markdown blocks if present
    const cleanedCode = code.replace(/```[a-z]*\n?|```/g, '').trim();

    return {
        id: `code-${Date.now()}`,
        title: `${sourceType} -> ${targetLanguage}`,
        language: targetLanguage,
        code: cleanedCode,
        sourceArtifactType: sourceType,
        createdAt: new Date().toISOString()
    };
};

// --- Vision Board Feature: Multimodal Analysis ---

export const analyzeImageArtifact = async (
    imageBase64: string, 
    analysisType: TVisionAnalysisType, 
    sector: string
): Promise<TVisionResult> => {
    
    // Construct prompt based on type
    let userInstruction = "";
    switch(analysisType) {
        case 'Whiteboard to Backlog':
            userInstruction = "Analyze this whiteboard photo. Extract all sticky notes or text as 'User Stories' and 'Action Items'.";
            break;
        case 'Sketch to Wireframe':
            userInstruction = "Analyze this UI sketch. Describe the layout, components (buttons, inputs), and structure in a way that can be converted to code.";
            break;
        case 'Legacy to Spec':
            userInstruction = "Analyze this screenshot of a software application. Reverse engineer the functional requirements and data fields.";
            break;
        case 'Diagram to Process':
            userInstruction = "Analyze this flowchart or diagram. Describe the process steps, decisions, and flow logic.";
            break;
    }

    const prompt = PromptFactory.createContextAwarePrompt(
        userInstruction,
        "Visual Analysis Task",
        sector as Sector
    );

    // Call Gemini with Image
    // Using gemini-3-flash-preview which supports vision
    const imagePart = {
        inlineData: {
            mimeType: 'image/png', // Assuming PNG or standard image type compatible
            data: imageBase64
        }
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            role: 'user',
            parts: [
                { text: prompt },
                imagePart
            ]
        },
        config: {
            responseMimeType: "application/json"
        }
    });

    const text = response.text || "{}";
    const json = safeParseJSON<any>(text);
    
    return {
        id: `vision-${Date.now()}`,
        type: analysisType,
        summary: json.summary || "Analysis Complete",
        extractedText: json.extractedText || [],
        structuredData: json,
        timestamp: new Date().toISOString()
    };
};
