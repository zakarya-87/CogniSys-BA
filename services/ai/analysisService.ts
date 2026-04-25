import { generateJson, generateGroundedJson, generateText, generatedSchemas, Type } from './aiCore';
import { PromptFactory } from '../promptFactory';
import {
  Sector,
  TElicitationAnalysis,
  TKpi,
  TPerformanceAnalysis,
  TFeedbackAnalysis,
  TInitiative,
  TPortfolioFinancials,
  TPortfolioRisks,
  TRootCauseAnalysis,
  TRetroItem,
  TBenefitsAnalysis,
  TOCMPlan,
  TIssue,
  TKnowledgeArticle,
  TDomainSpecificArtifact,
  TStakeholderProfile,
  TDocumentAnalysis,
  TConflictAnalysis,
  TPersonalBriefing,
  TDecisionTable,
  TRuleAudit,
} from '../../types';

const logger = {
  log: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

// --- Inline Schemas ---

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

// --- Exports ---

export const analyzeTranscript = async (transcript: string, sector: Sector = Sector.GENERAL, language?: string): Promise<TElicitationAnalysis> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Analyze this transcript. Extract requirements, decisions, action items, and key terms. Return JSON.`,
    transcript,
    sector,
    "JSON",
    language
  );
  const result = await generateJson<TElicitationAnalysis>(prompt, generatedSchemas['TElicitationAnalysis'], ['requirements', 'decisions']);
  return result.data;
};

export const generatePerformanceAnalysis = async (kpis: TKpi[], sector: Sector = Sector.GENERAL, language?: string): Promise<TPerformanceAnalysis> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Analyze these KPIs. Identify anomalies and root causes. Return JSON.`,
    JSON.stringify(kpis),
    sector,
    "JSON",
    language
  );
  const result = await generateJson<TPerformanceAnalysis>(prompt, generatedSchemas['TPerformanceAnalysis'], ['anomalies', 'rootCauseSummary']);
  return result.data;
};

export const analyzeUserFeedback = async (feedback: string, sector: string): Promise<TFeedbackAnalysis> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Analyze user feedback. Extract themes and sentiment. Feedback: "${feedback}". 
      Return JSON with root keys: "overallSentiment" (number from -100 to 100), "summary" (string), and "insights" (array of objects with theme, sentiment, count, recommendation).`,
      "VoC Analysis",
      sector as Sector
  );
  const result = await generateJson<TFeedbackAnalysis>(prompt, FeedbackAnalysisSchema, ['overallSentiment', 'insights']);
  return result.data;
};

export const generatePortfolioReport = async (initiatives: TInitiative[], sector: Sector = Sector.GENERAL, language?: string): Promise<string> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Generate an executive portfolio summary for these initiatives.`,
    JSON.stringify(initiatives.map(i => ({ title: i.title, status: i.status }))),
    sector,
    "Text",
    language
  );
  const result = await generateText(prompt);
  return result.text;
};

export const generatePortfolioFinancials = async (initiatives: TInitiative[], sector: Sector = Sector.GENERAL, language?: string): Promise<TPortfolioFinancials> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Generate financial projections for this portfolio. Return JSON.`,
    JSON.stringify(initiatives.map(i => i.title)),
    sector,
    "JSON",
    language
  );
  const result = await generateJson<TPortfolioFinancials>(prompt, generatedSchemas['TPortfolioFinancials'], generatedSchemas['TPortfolioFinancials']?.required || []);
  return result.data;
};

export const generatePortfolioRisks = async (initiatives: TInitiative[], sector: Sector = Sector.GENERAL, language?: string): Promise<TPortfolioRisks> => {
  const prompt = PromptFactory.createContextAwarePrompt(
    `Generate a risk profile for this portfolio. Return JSON.`,
    JSON.stringify(initiatives.map(i => i.title)),
    sector,
    "JSON",
    language
  );
  const result = await generateJson<TPortfolioRisks>(prompt, generatedSchemas['TPortfolioRisks'], generatedSchemas['TPortfolioRisks']?.required || []);
  return result.data;
};

export const generateRootCauseAnalysis = async (problem: string, sector: string): Promise<TRootCauseAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform Root Cause Analysis (5 Whys & Fishbone) for: "${problem}".`,
        "Problem Solving",
        sector as Sector
    );
    const result = await generateJson<TRootCauseAnalysis>(prompt, generatedSchemas['TRootCauseAnalysis'], generatedSchemas['TRootCauseAnalysis']?.required || []);
    return result.data;
};

export const generateRetrospectiveAnalysis = async (context: string, summary: string): Promise<TRetroItem[]> => {
  const prompt = `Generate retrospective items. Context: "${context}". Summary: "${summary}". Return JSON.`;
  const result = await generateJson<TRetroItem[]>(prompt, { type: 'array', items: generatedSchemas['TRetroItem'] }, []);
  return result.data;
};

export const analyzeBenefitsRealization = async (planned: number, actual: number, sector: string): Promise<TBenefitsAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Analyze Benefits Realization. Planned: ${planned}. Actual: ${actual}.`,
        "Value Analysis",
        sector as Sector
    );
    const result = await generateJson<TBenefitsAnalysis>(prompt, BenefitsAnalysisSchema, ['currency', 'roi', 'npv', 'realizationScore', 'analysis', 'chartData']);
    return result.data;
};

export const generateOCMPlan = async (title: string, sector: Sector = Sector.GENERAL, context: string, language?: string): Promise<TOCMPlan> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate an OCM (Organizational Change Management) Plan.`,
        `${title}\n${context}`,
        sector,
        "JSON",
        language
    );
    const result = await generateJson<TOCMPlan>(prompt, generatedSchemas['TOCMPlan'], generatedSchemas['TOCMPlan']?.required || []);
    return result.data;
};

export const analyzeIssue = async (desc: string, sector: string): Promise<TIssue> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Analyze project issue/risk: "${desc}". Return structured data (excluding ID/Status).`,
        "Risk Management",
        sector as Sector
    );
    const result = await generateJson<TIssue>(prompt, generatedSchemas['TIssue'], generatedSchemas['TIssue']?.required || []);
    return result.data;
};

export const generateKnowledgeArticles = async (title: string, desc: string, sector: string): Promise<TKnowledgeArticle[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate 3 knowledge articles (SOPs/FAQs).`,
        title,
        sector as Sector
    );
    const result = await generateJson<TKnowledgeArticle[]>(prompt, { type: 'array', items: generatedSchemas['TKnowledgeArticle'] }, []);
    return result.data;
};

export const generateDomainSpecificAnalysis = async (initiative: TInitiative, context: string): Promise<TDomainSpecificArtifact> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate a domain-specific artifact based on: "${context}".`,
      initiative.title,
      initiative.sector
  );
  const result = await generateJson<TDomainSpecificArtifact>(prompt, generatedSchemas['TDomainSpecificArtifact'], generatedSchemas['TDomainSpecificArtifact']?.required || []);
  return result.data;
};

export const analyzeStakeholder = async (role: string, desc: string, sector: string): Promise<TStakeholderProfile> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Analyze stakeholder "${role}".`,
      desc,
      sector as Sector
  );
  const result = await generateJson<TStakeholderProfile>(prompt, generatedSchemas['TStakeholderProfile'], generatedSchemas['TStakeholderProfile']?.required || []);
  return result.data;
};

export const analyzeDocument = async (text: string, sector: string): Promise<TDocumentAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Analyze document text and extract rules, requirements, terms, and data. Text: "${text.substring(0, 5000)}..."`,
        "Document Analysis",
        sector as Sector
    );
    const result = await generateJson<TDocumentAnalysis>(prompt, generatedSchemas['TDocumentAnalysis'], generatedSchemas['TDocumentAnalysis']?.required || []);
    return result.data;
};

export const analyzeConflict = async (scenario: string, sector: string): Promise<TConflictAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Analyze stakeholder conflict and propose resolution. Scenario: "${scenario}".`,
        "Stakeholder Management",
        sector as Sector
    );
    const result = await generateJson<TConflictAnalysis>(prompt, generatedSchemas['TConflictAnalysis'], generatedSchemas['TConflictAnalysis']?.required || []);
    return result.data;
};

export const generatePersonalBriefing = async (user: string, initiatives: TInitiative[]): Promise<TPersonalBriefing> => {
    const context = `User: ${user}. Initiatives: ${initiatives.map(i => i.title).join(', ')}.`;
    const prompt = `Generate a personal daily briefing and prioritized task list. Context: ${context}. Return JSON.`;
    const result = await generateJson<TPersonalBriefing>(prompt, generatedSchemas['TPersonalBriefing'], generatedSchemas['TPersonalBriefing']?.required || []);
    return result.data;
};

export const generateExportSummary = async (title: string, sector: string, contextData: string[]): Promise<string> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a comprehensive project report/executive summary based on these artifacts.`,
        contextData.join('\n'),
        sector as Sector,
        "Markdown"
    );
    const result = await generateText(prompt);
    return result.text;
};

export const auditReviewPackage = async (title: string, desc: string, sector: string): Promise<{score: number, summary: string, flags: string[]}> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Audit this review package for completeness and risk. Title: ${title}. Desc: ${desc}.`,
        "Governance",
        sector as Sector
    );
    const result = await generateJson<{score: number, summary: string, flags: string[]}>(prompt);
    return result.data;
};

export const auditBusinessRules = async (table: TDecisionTable): Promise<TRuleAudit> => {
    const prompt = `Audit this decision table for gaps and overlaps: ${JSON.stringify(table)}. Return JSON.`;
    const result = await generateJson<TRuleAudit>(prompt, generatedSchemas['TRuleAudit'], generatedSchemas['TRuleAudit']?.required || []);
    return result.data;
};

export const generateDecisionTable = async (policy: string, sector: string): Promise<TDecisionTable> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Create a Decision Table for logic: "${policy}".`,
        "Business Rules",
        sector as Sector
    );
    const result = await generateJson<TDecisionTable>(prompt, generatedSchemas['TDecisionTable'], generatedSchemas['TDecisionTable']?.required || []);
    return result.data;
};
