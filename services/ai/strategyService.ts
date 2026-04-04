import { generateJson, generateGroundedJson, generateText, generatedSchemas, Type } from './aiCore';
import { PromptFactory } from '../promptFactory';
import { MathService } from '../mathService';
import {
  TSwotAnalysis,
  TBusinessModelCanvas,
  TReportDetailLevel,
  TSuggestedKpi,
  TRecommendedTechnique,
  Sector,
  TStrategicRecommendation,
  TKpiForecast,
  TDecisionMatrix,
  TGapReport,
  TInitiative,
  TKpi,
  TIdea,
  TVSMAnalysis,
  TGlossaryTerm,
  TCompetitorAnalysis,
  TCapability,
  TBalancedScorecard,
  TScenarioEvent,
  TSimulationResult,
  TTornadoItem,
  TEthicalCheck,
  TPrioritizationAnalysis,
  TValuePropCanvas,
  TCBA,
  TMonteCarloResult,
  TDailyBriefing,
  TForceFieldAnalysis,
  THatAnalysis,
  TVendorAssessment,
  TSimulationParameter,
} from '../../types';

const logger = {
  log: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

// --- Inline Schemas ---

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

const briefingCache = new Map<string, TDailyBriefing>();

// --- Exports ---

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
          logger.warn("Using fallback techniques due to API limits.");
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

export const generatePestleAnalysis = async (sector: string, location: string): Promise<any> => {
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
    return generateGroundedJson<any>(prompt, ['summary', 'factors']);
};

export const generateCompetitorAnalysis = async (competitor: string, title: string, desc: string, sector: string): Promise<TCompetitorAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform a competitive analysis against "${competitor}".`,
        `${title}\n${desc}`,
        sector as Sector
    );
    return generateGroundedJson<TCompetitorAnalysis>(prompt);
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

export const generateForceFieldAnalysis = async (change: string, sector: string): Promise<TForceFieldAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform Force Field Analysis for change: "${change}".`,
        "Change Management",
        sector as Sector
    );
    return generateJson<TForceFieldAnalysis>(prompt, generatedSchemas['TForceFieldAnalysis'], generatedSchemas['TForceFieldAnalysis']?.required || []);
};

export const generateScenarios = async (sector: string): Promise<TScenarioEvent[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate 3 future scenarios (wargaming events) to test strategy.`,
        "Strategic Planning",
        sector as Sector
    );
    return generateJson<TScenarioEvent[]>(prompt, { type: 'array', items: generatedSchemas['TScenarioEvent'] }, []);
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

export const generateBrainstormingIdeas = async (problem: string, technique: string, sector: string): Promise<TIdea[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate brainstorming ideas using ${technique} technique for problem: "${problem}".
        Return a JSON array of objects. Each object must have the following keys: "id" (string), "text" (string), "type" (string, e.g. 'Substitute', 'Combine', 'General'), "votes" (number, default 0), and "isPromoted" (boolean, default false).`,
        "Ideation",
        sector as Sector
    );
    return generateJson<TIdea[]>(prompt, { type: 'array', items: generatedSchemas['TIdea'] }, []);
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

export const generateCBA = async (title: string, sector: string): Promise<TCBA> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Cost-Benefit Analysis (CBA).`,
        title,
        sector as Sector
    );
    return generateJson<TCBA>(prompt, generatedSchemas['TCBA'], generatedSchemas['TCBA']?.required || []);
};

export const generateMonteCarloSimulation = async (variables: string, iterations: number, sector: string): Promise<TMonteCarloResult> => {
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
        logger.warn("Failed to extract parameters via LLM, using fallback defaults.", e);
        parameters = [{ name: "Estimated Impact", min: 50, max: 150 }];
    }

    const result = MathService.runMonteCarlo(parameters, iterations);

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

export const suggestFeatures = async (initiative: TInitiative): Promise<string[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Suggest 10 high-impact features or requirements for this initiative based on its title, sector, and description. Focus on unique value propositions and BABOK-aligned capabilities.`,
        initiative.title,
        initiative.sector,
        "JSON"
    );
    return generateJson<string[]>(prompt, { type: 'array', items: { type: 'string' } }, []);
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

export const generateVendorAnalysis = async (title: string, desc: string, sector: string, need: string): Promise<TVendorAssessment> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Vendor Assessment/Comparison for need: "${need}".`,
        title,
        sector as Sector
    );
    return generateJson<TVendorAssessment>(prompt, generatedSchemas['TVendorAssessment'], generatedSchemas['TVendorAssessment']?.required || []);
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

export const generateSixHatsAnalysis = async (topic: string, sector: string): Promise<THatAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform Six Thinking Hats analysis on: "${topic}".`,
        "Decision Making",
        sector as Sector
    );
    return generateJson<THatAnalysis>(prompt, generatedSchemas['THatAnalysis'], generatedSchemas['THatAnalysis']?.required || []);
};

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
            logger.warn("Using fallback briefing due to API limits.");
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
