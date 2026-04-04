import { generateJson, generateGroundedJson, generateText, generatedSchemas, Type, DoublePassResponse } from './aiCore';
import { PromptFactory } from '../promptFactory';
import {
  Sector,
  TWireframeElement,
  TDataModel,
  TBpmnFlow,
  TSequenceDiagram,
  TC4Model,
  TMindMapNode,
  TJourneyMap,
  TServiceBlueprint,
  TSIPOC,
  TSimulationRun,
  TStoryMap,
  TOrgNode,
  TDFDModel,
  TConceptModel,
  TUserPersona,
  TAPMAnalysis,
  TRoadmap,
  TMigrationPlan,
} from '../../types';

const logger = {
  log: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

// --- Exports ---

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

export const generateSequenceDiagram = async (title: string, sector: string, scenario: string): Promise<TSequenceDiagram> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a UML Sequence Diagram for scenario: "${scenario}".`,
        title,
        sector as Sector
    );
    return generateJson<TSequenceDiagram>(prompt, generatedSchemas['TSequenceDiagram'], generatedSchemas['TSequenceDiagram']?.required || []);
};

export const generateC4Model = async (desc: string, level: string, sector: string): Promise<TC4Model> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a C4 Architecture Model (Level: ${level}). System: "${desc}".`,
        "Software Architecture",
        sector as Sector
    );
    return generateJson<TC4Model>(prompt, generatedSchemas['TC4Model'], generatedSchemas['TC4Model']?.required || []);
};

export const generateMindMap = async (topic: string, sector: string): Promise<TMindMapNode> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Mind Map structure for topic: "${topic}".`,
        "Brainstorming",
        sector as Sector
    );
    return generateJson<TMindMapNode>(prompt, generatedSchemas['TMindMapNode'], generatedSchemas['TMindMapNode']?.required || []);
};

export const generateJourneyMap = async (title: string, sector: string, persona: string, scenario: string): Promise<TJourneyMap> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Customer Journey Map. Persona: ${persona}. Scenario: ${scenario}.`,
        title,
        sector as Sector
    );
    return generateJson<TJourneyMap>(prompt, generatedSchemas['TJourneyMap'], generatedSchemas['TJourneyMap']?.required || []);
};

export const generateServiceBlueprint = async (scenario: string, sector: string): Promise<TServiceBlueprint> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Service Blueprint for scenario: "${scenario}".`,
        "Service Design",
        sector as Sector
    );
    return generateJson<TServiceBlueprint>(prompt, generatedSchemas['TServiceBlueprint'], generatedSchemas['TServiceBlueprint']?.required || []);
};

export const generateSIPOC = async (processName: string, sector: string): Promise<TSIPOC> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a SIPOC diagram for process: "${processName}".`,
        "Process Analysis",
        sector as Sector
    );
    return generateJson<TSIPOC>(prompt, generatedSchemas['TSIPOC'], generatedSchemas['TSIPOC']?.required || []);
};

export const runProcessSimulation = async (context: string, sector: string): Promise<TSimulationRun> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Simulate process performance (Monte Carlo). Parameters: ${context}.`,
        "Process Optimization",
        sector as Sector
    );
    return generateJson<TSimulationRun>(prompt, generatedSchemas['TSimulationRun'], generatedSchemas['TSimulationRun']?.required || []);
};

export const generateUserStoryMap = async (title: string, sector: string): Promise<TStoryMap> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a User Story Map (Backbone, Releases, Stories). Also provide a brief AI analysis of the story map strategy.`,
        title,
        sector as Sector
    );
    return generateJson<TStoryMap>(prompt, generatedSchemas['TStoryMap'], generatedSchemas['TStoryMap']?.required || []);
};

export const generateOrgChart = async (context: string, sector: string): Promise<TOrgNode> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate an Organizational Chart structure for context: "${context}".`,
        "Organizational Analysis",
        sector as Sector
    );
    return generateJson<TOrgNode>(prompt, generatedSchemas['TOrgNode'], generatedSchemas['TOrgNode']?.required || []);
};

export const generateDFD = async (title: string, sector: string): Promise<TDFDModel> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Level 1 Data Flow Diagram (DFD).`,
        title,
        sector as Sector
    );
    return generateJson<TDFDModel>(prompt, generatedSchemas['TDFDModel'], generatedSchemas['TDFDModel']?.required || []);
};

export const generateConceptModel = async (domain: string, sector: string): Promise<TConceptModel> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Business Concept Model (Ontology) for domain: "${domain}".`,
        "Information Management",
        sector as Sector
    );
    return generateJson<TConceptModel>(prompt, generatedSchemas['TConceptModel'], generatedSchemas['TConceptModel']?.required || []);
};

export const generateUserPersonas = async (audience: string, sector: string): Promise<TUserPersona[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate 3 detailed User Personas for audience: "${audience}".`,
        "UX Design",
        sector as Sector
    );
    return generateJson<TUserPersona[]>(prompt, { type: 'array', items: generatedSchemas['TUserPersona'] }, []);
};

export const generateAPMAnalysis = async (apps: string[], sector: string): Promise<TAPMAnalysis> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform Application Portfolio Management (TIME analysis) on: ${apps.join(', ')}.`,
        "IT Strategy",
        sector as Sector
    );
    return generateJson<TAPMAnalysis>(prompt, generatedSchemas['TAPMAnalysis'], generatedSchemas['TAPMAnalysis']?.required || []);
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
