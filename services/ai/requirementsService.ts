import { generateJson, generateGroundedJson, generateText, generatedSchemas, Type, DoublePassResponse } from './aiCore';
import { PromptFactory } from '../promptFactory';
import {
  Sector,
  TInitiative,
  TWorkBreakdown,
  TProjectVitalsAdvanced,
  TGapAnalysisResult,
  TTraceabilityGraphData,
  TValidationResult,
  TEstimationReport,
  TComplianceMatrix,
  TComplianceReport,
  TADR,
  TNfr,
  TRbacMatrix,
  TApiEndpoint,
  TStateModel,
  TSplitSuggestion,
  TUseCaseDiagram,
  TSurvey,
  TWorkshopPlan,
  TDMNModel,
  TThreat,
  TDPIA,
  TScopeStatement,
  TUatTestCase,
  TTechniqueGuide,
  TRequirementPackage,
  TFocusGroupResult,
  TObservationPlan,
} from '../../types';

const logger = {
  log: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

// --- Inline Schemas ---

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

// --- Exports ---

export const generateUserStories = async (title: string, sector: string, additionalContext: string = ''): Promise<{title: string, priority: any}[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate 5 user stories.`,
      `${title}\n${additionalContext}`,
      sector as Sector
  );
  return generateJson<{title: string, priority: any}[]>(prompt);
};

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

export const generateEstimates = async (stories: string[], sector: string): Promise<TEstimationReport> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate PERT Estimates (Optimistic, Likely, Pessimistic) for these stories: ${stories.join(', ')}.`,
        "Project Management",
        sector as Sector
    );
    return generateJson<TEstimationReport>(prompt, generatedSchemas['TEstimationReport'], generatedSchemas['TEstimationReport']?.required || []);
};

export const generateRiskAssessment = async (title: string, desc: string, sector: string, additionalContext: string = ''): Promise<any[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Identify risks. Description: "${desc}". \n${additionalContext}`,
      title,
      sector as Sector
  );
  return generateJson<any[]>(prompt, { type: 'array', items: generatedSchemas['TRisk'] }, []);
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

export const generateComplianceMatrix = async (title: string, sector: string): Promise<TComplianceMatrix> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Regulatory Compliance Matrix.`,
        title,
        sector as Sector
    );
    return generateJson<TComplianceMatrix>(prompt, generatedSchemas['TComplianceMatrix'], generatedSchemas['TComplianceMatrix']?.required || []);
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

export const generateStorySplits = async (epic: string, sector: string): Promise<TSplitSuggestion[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Split this Epic into user stories using SPIDR patterns: "${epic}".`,
        "Agile Analysis",
        sector as Sector
    );
    return generateJson<TSplitSuggestion[]>(prompt, { type: 'array', items: generatedSchemas['TSplitSuggestion'] }, []);
};

export const generateUseCaseDiagram = async (context: string, sector: string): Promise<TUseCaseDiagram> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a UML Use Case Diagram structure. Context: "${context}". Return a JSON object with "title", "actors" (id, name, type: Primary|Secondary), "useCases" (id, name), and "links" (from, to, type: Association|Include|Extend). Ensure "from" and "to" in links exactly match the "id" of actors or useCases.`,
        "Requirements Modeling",
        sector as Sector
    );
    return generateJson<TUseCaseDiagram>(prompt, UseCaseDiagramSchema, ['title', 'actors', 'useCases', 'links']);
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

export const generateObservationPlan = async (role: string, activity: string, sector: string): Promise<TObservationPlan> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Create an Observation Plan for Role: ${role}, Activity: ${activity}.`,
        "Elicitation",
        sector as Sector
    );
    return generateJson<TObservationPlan>(prompt, generatedSchemas['TObservationPlan'], generatedSchemas['TObservationPlan']?.required || []);
};

export const runFocusGroup = async (topic: string, sector: string): Promise<TFocusGroupResult> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Simulate a Focus Group discussion on topic: "${topic}".`,
        "Elicitation",
        sector as Sector
    );
    return generateJson<TFocusGroupResult>(prompt, generatedSchemas['TFocusGroupResult'], generatedSchemas['TFocusGroupResult']?.required || []);
};

export const generateFunctionalDecomposition = async (context: string, sector: string): Promise<any> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Functional Decomposition Tree for: "${context}".`,
        "System Analysis",
        sector as Sector
    );
    return generateJson<any>(prompt, generatedSchemas['TDecompositionNode'], generatedSchemas['TDecompositionNode']?.required || []);
};

export const suggestReusablePackages = async (sector: string): Promise<TRequirementPackage[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Suggest 3 reusable requirement packages/libraries relevant to this domain.`,
        "Requirements Reuse",
        sector as Sector
    );
    return generateJson<TRequirementPackage[]>(prompt, { type: 'array', items: generatedSchemas['TRequirementPackage'] }, []);
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

export const generateDMNModel = async (context: string, sector: string): Promise<TDMNModel> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a DMN (Decision Model and Notation) graph for: "${context}".`,
        "Decision Modeling",
        sector as Sector
    );
    return generateJson<TDMNModel>(prompt, generatedSchemas['TDMNModel'], generatedSchemas['TDMNModel']?.required || []);
};

export const generateThreatModel = async (context: string, sector: string): Promise<TThreat[]> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform STRIDE threat modeling on this system: "${context}".`,
        "Security Architecture",
        sector as Sector
    );
    return generateJson<TThreat[]>(prompt, { type: 'array', items: generatedSchemas['TThreat'] }, []);
};

export const generateDPIA = async (title: string, sector: string): Promise<TDPIA> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Perform a Data Protection Impact Assessment (DPIA).`,
        title,
        sector as Sector
    );
    return generateJson<TDPIA>(prompt, generatedSchemas['TDPIA'], generatedSchemas['TDPIA']?.required || []);
};

export const generateUatScripts = async (stories: {title: string}[], sector: string): Promise<TUatTestCase[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate UAT test cases for stories: ${JSON.stringify(stories)}.`,
      "UAT Planning",
      sector as Sector
  );
  return generateJson<TUatTestCase[]>(prompt, { type: 'array', items: generatedSchemas['TUatTestCase'] }, []);
};

export const generateScopeStatement = async (title: string, sector: string): Promise<TScopeStatement> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate a Project Scope Statement (In-Scope, Out-of-Scope).`,
        title,
        sector as Sector
    );
    return generateJson<TScopeStatement>(prompt, generatedSchemas['TScopeStatement'], generatedSchemas['TScopeStatement']?.required || []);
};
