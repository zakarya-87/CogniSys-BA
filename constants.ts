

import { TInitiative, InitiativeStatus, TBacklogItem, BacklogItemStatus, BacklogItemPriority, Sector, TTechnique, TShowcaseItem, TTeamMember, BABOKKnowledgeArea } from './types';

export const MODULE_GROUPS = {
  'General': ['Overview', 'BABOK Compliance'],
  'Strategy & Planning': ['Vision Video', 'Ideation Lab', 'Six Thinking Hats', 'Value Prop Canvas', 'Planner', 'Roadmap', 'Strategy', 'Cost Benefit Analysis', 'PESTLE Analysis', 'Force Field Analysis', 'Scope Manager', 'APM Portfolio', 'Scenario Wargaming', 'Balanced Scorecard', 'Capability Map', 'Org Chart', 'Competitive Analysis', 'Gap Analysis', 'Stakeholders', 'Domain Specialist', 'Vendor Selection', 'Presentation'],
  'Analysis & Design': ['Story Map', 'Story Splitter', 'Use Case Modeler', 'Requirements', 'Requirements Library', 'Data Flow', 'C4 Modeler'],
  'Elicitation & Collaboration': ['Elicitation', 'Conflict Resolution', 'Observation', 'Document Analysis', 'Focus Group', 'Mind Map', 'Workshop Facilitator', 'Survey Builder', 'Simulation'],
  'Documentation & Governance': ['Documentation', 'Artifact Explorer', 'Predictive Core', 'DPIA & Ethics', 'Risk', 'Issue Tracker', 'Change Control', 'Compliance Mapper', 'ADR Manager', 'Approval Center'],
  'Execution & Delivery': ['Backlog', 'Estimation', 'UAT', 'Launchpad', 'Release Notes', 'OCM Hub', 'Knowledge Base', 'Data Migration', 'Achievements', 'Integration Hub'],
  'Evaluation & Improve': ['Evaluation', 'Benefits Realization', 'Root Cause Analysis', 'Retrospective']
};

export const BABOK_MODULES = Object.values(MODULE_GROUPS).flat();

export const BABOK_KA_MAPPING: { [key: string]: string[] } = {
    [BABOKKnowledgeArea.PLANNING_MONITORING]: ['Planner', 'Techniques', 'Stakeholders', 'DPIA & Ethics', 'Compliance Mapper', 'Org Chart', 'Artifact Explorer', 'Roadmap', 'Scope Manager', 'Vendor Selection', 'Estimation', 'OCM Hub'],
    [BABOKKnowledgeArea.ELICITATION_COLLABORATION]: ['Elicitation', 'Workshop Facilitator', 'Survey Builder', 'Mind Map', 'Conflict Resolution', 'Document Analysis', 'Observation', 'Focus Group', 'Presentation'],
    [BABOKKnowledgeArea.REQUIREMENTS_LIFE_CYCLE]: ['Requirements', 'Traceability', 'Prioritization', 'Change Control', 'Approval Center', 'Backlog', 'Requirements Library', 'Documentation', 'Issue Tracker', 'ADR Manager', 'Achievements'],
    [BABOKKnowledgeArea.STRATEGY_ANALYSIS]: ['Strategy', 'PESTLE Analysis', 'Gap Analysis', 'Risk', 'Cost Benefit Analysis', 'Balanced Scorecard', 'Capability Map', 'Competitive Analysis', 'Scenario Wargaming', 'Predictive Core', 'Vision Video', 'Ideation Lab', 'Six Thinking Hats', 'Value Prop Canvas', 'Force Field Analysis', 'APM Portfolio', 'Domain Specialist'],
    [BABOKKnowledgeArea.REQUIREMENTS_ANALYSIS_DESIGN]: ['Functional Decomposition', 'Concept Modeler', 'Use Case Modeler', 'Story Map', 'Data Flow', 'C4 Modeler', 'API Designer', 'NFR Architect', 'Business Rules', 'Decision Modeler', 'State Modeler', 'Journey Map', 'Service Blueprint', 'Value Stream Map', 'SIPOC Analyzer', 'Process Simulator', 'Story Splitter', 'Access Control', 'Threat Modeling', 'Data Migration', 'Integration Hub'],
    [BABOKKnowledgeArea.SOLUTION_EVALUATION]: ['Evaluation', 'Benefits Realization', 'UAT', 'Root Cause Analysis', 'Retrospective', 'Launchpad', 'Release Notes', 'Predictive Core', 'Knowledge Base']
};

export const THINK_PLAN_ACT_MAPPING: { [key: string]: string[] } = {
    'THINK': ['General', 'Elicitation & Collaboration', 'Analysis & Design'],
    'PLAN': ['Strategy & Planning', 'Documentation & Governance'],
    'ACT': ['Execution & Delivery', 'Evaluation & Improve']
};

// --- THE PULSE: AI TEAM MEMBERS ---
export const AI_TEAM_MEMBERS: TTeamMember[] = [
    { 
        id: 'atlas', 
        name: 'Atlas', 
        role: 'Chief Architect', 
        avatar: '🏗️', 
        personality: 'Rigorous, focused on scalability and patterns. Loves UML.', 
        focusAreas: ['c4Model', 'dataModel', 'sequenceDiagram', 'bpmnFlow', 'architecture'],
        color: 'bg-purple-100 text-purple-800'
    },
    { 
        id: 'pixel', 
        name: 'Pixel', 
        role: 'Product Designer', 
        avatar: '🎨', 
        personality: 'Empathetic, user-centric, focused on flow and friction.', 
        focusAreas: ['wireframe', 'personas', 'journeyMap', 'storyMap', 'survey'],
        color: 'bg-pink-100 text-pink-800'
    },
    { 
        id: 'ledger', 
        name: 'Ledger', 
        role: 'Financial Analyst', 
        avatar: '💹', 
        personality: 'Pragmatic, ROI-obsessed, skeptical of vague benefits.', 
        focusAreas: ['cba', 'portfolioFinancials', 'benefitsRealization', 'budget'],
        color: 'bg-green-100 text-green-800'
    },
    { 
        id: 'sentry', 
        name: 'Sentry', 
        role: 'Security & Compliance', 
        avatar: '🛡️', 
        personality: 'Paranoid, detail-oriented, strict about regulations.', 
        focusAreas: ['risks', 'complianceMatrix', 'threatModel', 'dpia', 'accessControlMatrix'],
        color: 'bg-red-100 text-red-800'
    },
    { 
        id: 'scout', 
        name: 'Scout', 
        role: 'Market Strategist', 
        avatar: '🔭', 
        personality: 'Forward-looking, competitive, loves data trends.', 
        focusAreas: ['swot', 'pestleAnalysis', 'competitorAnalysis', 'strategy'],
        color: 'bg-indigo-100 text-indigo-800'
    },
];

export const STATUS_STYLES: { [key in InitiativeStatus]: string } = {
  [InitiativeStatus.PLANNING]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  [InitiativeStatus.AWAITING_APPROVAL]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  [InitiativeStatus.IN_DEVELOPMENT]: 'bg-primary/20 text-primary-dark dark:bg-primary/20 dark:text-primary',
  [InitiativeStatus.LIVE]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  [InitiativeStatus.ON_HOLD]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export const SECTOR_STYLES: { [key in Sector]: string } = {
    [Sector.SAAS_CLOUD]: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    [Sector.FINTECH]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    [Sector.GREEN_ENERGY]: 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300',
    [Sector.CIRCULAR_ECONOMY]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
    [Sector.AGRITECH_FOODTECH]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    [Sector.INDUSTRY_4_0]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    [Sector.BIOTECH_PHARMA]: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    [Sector.GENERAL]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export const MOCK_INITIATIVES: TInitiative[] = [
  {
    id: '0',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'AI Agent-Driven Business Process Transformation',
    description: 'Deploying autonomous AI agents to analyze, optimize, and automate core business processes across HR, Finance, and Supply Chain. Aims to reduce manual overhead by 40% and improve decision-making speed through predictive analytics and intelligent workflow routing.',
    status: InitiativeStatus.PLANNING,
    sector: Sector.GENERAL,
    owner: {
      name: 'AI Transformation Lead',
      avatarUrl: 'https://i.pravatar.cc/150?u=ai_lead',
    },
  },
  {
    id: '1',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'DeFi Liquidity Aggregator',
    description: 'A cross-chain decentralized finance platform aggregating liquidity pools to offer the best swap rates. Needs rigorous security auditing and smart contract validation.',
    status: InitiativeStatus.IN_DEVELOPMENT,
    sector: Sector.FINTECH,
    owner: {
      name: 'Sarah Chen',
      avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
    },
  },
  {
    id: '2',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'Smart Grid Load Balancer',
    description: 'AI-driven energy distribution system for municipal grids. Optimizes renewable energy usage during peak hours to reduce carbon footprint.',
    status: InitiativeStatus.PLANNING,
    sector: Sector.GREEN_ENERGY,
    owner: {
      name: 'Marcus Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?u=marcus',
    },
  },
  {
    id: '3',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'Clinical Trial Data Vault',
    description: 'Secure, HIPAA-compliant cloud storage for Phase III clinical trial data, featuring blockchain-based audit trails for regulatory integrity.',
    status: InitiativeStatus.AWAITING_APPROVAL,
    sector: Sector.BIOTECH_PHARMA,
    owner: {
      name: 'Dr. Emily Wei',
      avatarUrl: 'https://i.pravatar.cc/150?u=emily',
    },
  },
  {
    id: '4',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'Predictive Maintenance Twin',
    description: 'Digital Twin implementation for automotive assembly lines. Uses IoT sensors to predict machinery failure before it happens.',
    status: InitiativeStatus.LIVE,
    sector: Sector.INDUSTRY_4_0,
    owner: {
      name: 'Alex Rivera',
      avatarUrl: 'https://i.pravatar.cc/150?u=alex',
    },
  },
  {
    id: '5',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'Circular Material Passport',
    description: 'Blockchain-based tracking system for construction materials to facilitate reuse and recycling at end-of-life.',
    status: InitiativeStatus.PLANNING,
    sector: Sector.CIRCULAR_ECONOMY,
    owner: {
      name: 'Priya Patel',
      avatarUrl: 'https://i.pravatar.cc/150?u=priya',
    },
  },
  {
    id: '6',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'AI Crop Yield Optimizer',
    description: 'Using drone imagery and soil sensors to provide real-time fertilizer recommendations for large-scale wheat farms.',
    status: InitiativeStatus.IN_DEVELOPMENT,
    sector: Sector.AGRITECH_FOODTECH,
    owner: {
      name: 'David Kim',
      avatarUrl: 'https://i.pravatar.cc/150?u=david',
    },
  },
  {
    id: '7',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'نظام إدارة الموارد الذكي للمدن المستدامة',
    description: 'مبادرة تهدف إلى تحسين استهلاك الطاقة والمياه في المناطق الحضرية باستخدام تقنيات إنترنت الأشياء والذكاء الاصطناعي. يتضمن النظام لوحة تحكم مركزية لمراقبة الاستهلاك في الوقت الفعلي وتوفير توصيات للحد من الهدر.',
    status: InitiativeStatus.PLANNING,
    sector: Sector.GREEN_ENERGY,
    owner: {
      name: 'أحمد المنصور',
      avatarUrl: 'https://i.pravatar.cc/150?u=ahmed',
    },
  },
  {
    id: '8',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'منصة الدفع الإلكتروني الموحدة للمؤسسات الصغيرة',
    description: 'حل متكامل للمؤسسات الصغيرة والمتوسطة لإدارة المدفوعات الرقمية، الفواتير، والتقارير المالية في منصة واحدة سهلة الاستخدام. تدعم المنصة العملات المحلية والدولية وتوفر تحليلات متقدمة للتدفقات النقدية.',
    status: InitiativeStatus.IN_DEVELOPMENT,
    sector: Sector.FINTECH,
    owner: {
      name: 'ليلى حسن',
      avatarUrl: 'https://i.pravatar.cc/150?u=layla',
    },
  },
  {
    id: '9',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'مبادرة التحول الرقمي للخدمات اللوجستية الريفية',
    description: 'مشروع يهدف إلى ربط المزارعين الصغار في المناطق الريفية بالأسواق الحضرية مباشرة من خلال منصة لوجستية ذكية تعتمد على البيانات. توفر المنصة تتبعاً للشحنات، تحسيناً للمسارات، وتنسيقاً لعمليات النقل لتقليل التكاليف وزيادة دخل المزارعين.',
    status: InitiativeStatus.PLANNING,
    sector: Sector.AGRITECH_FOODTECH,
    owner: {
      name: 'سارة خالد',
      avatarUrl: 'https://i.pravatar.cc/150?u=sara',
    },
  },
  {
    id: '10',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'مبادرة التحول الرقمي وأتمتة العمليات الإدارية (DTP-Automation)',
    description: 'مبادرة استراتيجية تهدف إلى رقمنة كافة العمليات الإدارية والورقية داخل المؤسسة، وتحويلها إلى تدفقات عمل مؤتمتة بالكامل. تشمل المبادرة تطوير منصة مركزية لإدارة المهام، التوقيع الرقمي، وأرشفة المستندات إلكترونياً لزيادة الكفاءة وتقليل الأخطاء البشرية.',
    status: InitiativeStatus.PLANNING,
    sector: Sector.GENERAL,
    owner: {
      name: 'محمد العتيبي',
      avatarUrl: 'https://i.pravatar.cc/150?u=mohammed',
    },
  }
];

export const MOCK_BACKLOG: TBacklogItem[] = [
  { id: 'b-1', title: 'Implement Biometric Authentication', status: BacklogItemStatus.DONE, priority: BacklogItemPriority.HIGH, type: 'User Story', subtasks: [{ id: 's-1', title: 'FaceID Integration', isCompleted: true }] },
  { id: 'b-2', title: 'Dashboard Analytics Widget', status: BacklogItemStatus.IN_PROGRESS, priority: BacklogItemPriority.MEDIUM, type: 'User Story', subtasks: [{ id: 's-2', title: 'Chart Library Setup', isCompleted: true }, { id: 's-3', title: 'API Connection', isCompleted: false }] },
  { id: 'b-3', title: 'Export Reports to PDF', status: BacklogItemStatus.TODO, priority: BacklogItemPriority.LOW, type: 'Requirement' },
];

export const MOCK_SHOWCASE: TShowcaseItem[] = [
    {
        id: 'sh-1',
        title: 'Secure Login Flow',
        description: 'Fully compliant biometric authentication system with fallback patterns.',
        imageUrl: 'https://images.unsplash.com/photo-1555421689-491a97ff2048?auto=format&fit=crop&q=80&w=1000',
        completedItems: ['b-1']
    }
];

export const BABOK_TECHNIQUES: TTechnique[] = [
    { id: 't1', name: 'Acceptance and Evaluation Criteria', description: 'Define requirements that must be met for a solution to be considered acceptable.', category: 'Requirements Analysis' },
    { id: 't2', name: 'Backlog Management', description: 'Plan and prioritize work to be done.', category: 'Requirements Analysis' },
    { id: 't3', name: 'Balanced Scorecard', description: 'Manage performance in any business model, organizational structure, or business process.', category: 'Strategy Analysis' },
    { id: 't4', name: 'Benchmarking and Market Analysis', description: 'Compare organizational practices against best-in-class practices.', category: 'Strategy Analysis' },
    { id: 't5', name: 'Brainstorming', description: 'Produce numerous new ideas, and to derive themes for further analysis.', category: 'Elicitation & Collaboration' },
    { id: 't6', name: 'Business Capability Analysis', description: 'Describe what an enterprise is able to do.', category: 'Strategy Analysis' },
    { id: 't7', name: 'Business Cases', description: 'Justify a course of action based on the benefits to be realized.', category: 'Strategy Analysis' },
    { id: 't8', name: 'Business Model Canvas', description: 'Describe how an enterprise creates, delivers, and captures value.', category: 'Strategy Analysis' },
    { id: 't9', name: 'Business Rules Analysis', description: 'Identify, express, validate, refine, and organize the rules that shape day-to-day business behavior.', category: 'Requirements Analysis' },
    { id: 't10', name: 'Collaborative Games', description: 'Encourage participants in an elicitation activity to collaborate in building a joint understanding.', category: 'Elicitation & Collaboration' },
    { id: 't11', name: 'Concept Modelling', description: 'Organize the business vocabulary needed to communicate business knowledge.', category: 'Requirements Analysis' },
    { id: 't12', name: 'Data Dictionary', description: 'Standardize a definition of a data element and enable a common interpretation of data elements.', category: 'Requirements Analysis' },
    { id: 't13', name: 'Data Flow Diagrams', description: 'Show where data comes from, which activities process the data, and if the output results are stored or utilized.', category: 'Requirements Analysis' },
    { id: 't14', name: 'Data Mining', description: 'Improve decision making by finding useful patterns and insights from data.', category: 'Strategy Analysis' },
    { id: 't15', name: 'Data Modelling', description: 'Describe the entities, classes or data objects relevant to a domain.', category: 'Requirements Analysis' },
    { id: 't16', name: 'Decision Analysis', description: 'Formally assess a problem and possible decisions in order to determine the value of alternate outcomes.', category: 'Strategy Analysis' },
    { id: 't17', name: 'Decision Matrix', description: 'Evaluate and select the best option from a set of alternatives.', category: 'Strategy Analysis' }, 
    { id: 't18', name: 'Document Analysis', description: 'Elicit business analysis information, including contextual understanding and requirements, by examining available materials.', category: 'Elicitation & Collaboration' },
    { id: 't19', name: 'Estimation', description: 'Forecast the cost and effort involved in pursuing a course of action.', category: 'Strategy Analysis' },
    { id: 't20', name: 'Financial Analysis', description: 'Assess the financial viability of a recommended solution.', category: 'Strategy Analysis' },
    { id: 't21', name: 'Focus Groups', description: 'Elicit ideas and opinions about a specific product, service, or opportunity in an interactive group environment.', category: 'Elicitation & Collaboration' },
    { id: 't22', name: 'Functional Decomposition', description: 'Break down processes, systems, functional areas, or deliverables into their simpler constituent parts.', category: 'Requirements Analysis' },
    { id: 't23', name: 'Glossary', description: 'Define key terms for stakeholders.', category: 'Requirements Analysis' },
    { id: 't24', name: 'Interface Analysis', description: 'Identify where, what, why, when, how, and for whom information is exchanged between solution components.', category: 'Requirements Analysis' },
    { id: 't25', name: 'Interviews', description: 'A systematic approach designed to elicit business analysis information from a person or group of people.', category: 'Elicitation & Collaboration' },
    { id: 't26', name: 'Item Tracking', description: 'Capture and assign responsibility for issues and stakeholder concerns.', category: 'Requirements Analysis' },
    { id: 't27', name: 'Lessons Learned', description: 'Compile and document successes, opportunities for improvement, failures, and recommendations for improving the performance of future projects.', category: 'Solution Evaluation' },
    { id: 't28', name: 'Metrics and Key Performance Indicators (KPIs)', description: 'Measure the performance of solutions, solution components, and other matters of interest to stakeholders.', category: 'Solution Evaluation' },
    { id: 't29', name: 'Mind Mapping', description: 'Articulate and capture thoughts, ideas, and information.', category: 'Elicitation & Collaboration' },
    { id: 't30', name: 'Non-Functional Requirements Analysis', description: 'Examine the requirements for a solution that define how well the functional requirements must perform.', category: 'Requirements Analysis' },
    { id: 't31', name: 'Observation', description: 'Elicit information by viewing and understanding activities and their context.', category: 'Elicitation & Collaboration' },
    { id: 't32', name: 'Organizational Modelling', description: 'Describe the roles, responsibilities, and reporting structures that exist within an organization.', category: 'Strategy Analysis' },
    { id: 't33', name: 'Prioritization', description: 'Determine the relative importance of business analysis information.', category: 'Requirements Analysis' },
    { id: 't34', name: 'Process Analysis', description: 'Assess a process for efficiency and effectiveness.', category: 'Strategy Analysis' },
    { id: 't35', name: 'Process Modeling', description: 'Visually represent the sequential flow and control logic of a set of activities.', category: 'Requirements Analysis' },
    { id: 't36', name: 'Prototyping', description: 'Detail user interface requirements and integrate them with other requirements such as use cases, scenarios, data, and business rules.', category: 'Requirements Analysis' },
    { id: 't37', name: 'Reviews', description: 'Evaluate the content of a work product.', category: 'Solution Evaluation' },
    { id: 't38', name: 'Risk Analysis and Management', description: 'Identify areas of uncertainty that could negatively affect value.', category: 'Strategy Analysis' },
    { id: 't39', name: 'Roles and Permissions Matrix', description: 'Ensure coverage of activities and denote responsibility.', category: 'Requirements Analysis' },
    { id: 't40', name: 'Root Cause Analysis', description: 'Identify and evaluate the underlying causes of a problem.', category: 'Strategy Analysis' },
    { id: 't41', name: 'Scope Modelling', description: 'Define the boundaries of a potential solution.', category: 'Strategy Analysis' },
    { id: 't42', name: 'Sequence Diagrams', description: 'Model the logic of usage scenarios by showing the information passed between objects in the system.', category: 'Requirements Analysis' },
    { id: 't43', name: 'Stakeholder List, Map, or Personas', description: 'Analyze stakeholders and their characteristics.', category: 'Elicitation & Collaboration' },
    { id: 't44', name: 'State Modelling', description: 'Describe and analyze the different possible states of an entity within a system.', category: 'Requirements Analysis' },
    { id: 't45', name: 'Survey or Questionnaire', description: 'Elicit business analysis information from a group of people in a structured way.', category: 'Elicitation & Collaboration' },
    { id: 't46', name: 'SWOT Analysis', description: 'Evaluate the Strengths, Weaknesses, Opportunities, and Threats involved in a project.', category: 'Strategy Analysis' },
    { id: 't47', name: 'Use Cases and Scenarios', description: 'Describe how a person or system interacts with the solution being modelled to achieve a goal.', category: 'Requirements Analysis' },
    { id: 't48', name: 'User Stories', description: 'Capture the needs of a specific stakeholder.', category: 'Requirements Analysis' },
    { id: 't49', name: 'Vendor Assessment', description: 'Assess the ability of a vendor to meet commitments regarding the delivery and the consistent provision of a product or service.', category: 'Strategy Analysis' },
    { id: 't50', name: 'Workshops', description: 'Bring key stakeholders together to define the product.', category: 'Elicitation & Collaboration' },
    { id: 't51', name: 'Fishbone Diagram', description: 'Identify potential root causes for a problem (Ishikawa).', category: 'Strategy Analysis' },
    { id: 't52', name: 'RACI Matrix', description: 'Clarify roles and responsibilities.', category: 'Elicitation & Collaboration' }
];

// ── AI Provider & Model Configuration ───────────────────────────────────────

export interface AIModelOption {
    id: string;
    name: string;
    description: string;
    contextWindow?: string;
}

export interface AIProviderConfig {
    id: string;
    name: string;
    icon: string;
    color: string;
    requiresKey: string;  // env var name that must be set
    models: AIModelOption[];
}

export const AI_PROVIDERS: AIProviderConfig[] = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        icon: '✨',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        requiresKey: 'GEMINI_API_KEY',
        models: [
            { id: 'gemini-2.5-flash',          name: 'Gemini 2.5 Flash',     description: 'Fast, stable — recommended default',       contextWindow: '1M tokens' },
            { id: 'gemini-3-flash-preview',    name: 'Gemini 3 Flash',       description: 'Latest preview (may have high demand)',    contextWindow: '1M tokens' },
            { id: 'gemini-3.1-flash-preview',  name: 'Gemini 3.1 Flash',     description: 'Latest flash model for quick tasks',       contextWindow: '1M tokens' },
            { id: 'gemini-3.1-pro-preview',    name: 'Gemini 3.1 Pro',       description: 'Advanced reasoning for complex analysis',  contextWindow: '2M tokens' },
        ],
    },
    {
        id: 'mistral',
        name: 'Mistral AI',
        icon: '🌪️',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        requiresKey: 'MISTRAL_API_KEY',
        models: [
            { id: 'mistral',                        name: 'Mistral Large',    description: 'Best reasoning, top performance',  contextWindow: '128K tokens' },
            { id: 'mistral-medium-latest',          name: 'Mistral Medium',   description: 'Balanced cost and performance',    contextWindow: '128K tokens' },
            { id: 'mistral-small-latest',           name: 'Mistral Small',    description: 'Lightweight, fast responses',      contextWindow: '128K tokens' },
            { id: 'codestral-latest',               name: 'Codestral',        description: 'Specialized for code generation',  contextWindow: '256K tokens' },
        ],
    },
    {
        id: 'azure-openai',
        name: 'Azure OpenAI',
        icon: '☁️',
        color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        requiresKey: 'AZURE_OPENAI_API_KEY',
        models: [
            { id: 'azure-openai',      name: 'GPT-4 (Configured)',     description: 'Uses your Azure deployment configuration', contextWindow: '128K tokens' },
            { id: 'azure-gpt-4o',     name: 'GPT-4o',                  description: 'Multimodal, fast and capable',            contextWindow: '128K tokens' },
            { id: 'azure-gpt-4-turbo', name: 'GPT-4 Turbo',            description: 'High-capacity reasoning model',           contextWindow: '128K tokens' },
        ],
    },
];

// Flat list of all model IDs — useful for validation
export const ALL_AI_MODEL_IDS = AI_PROVIDERS.flatMap(p => p.models.map(m => m.id));

// Default model ID
export const DEFAULT_AI_MODEL_ID = 'gemini-2.5-flash';

// Resolve provider from a model ID
export function getProviderForModel(modelId: string): AIProviderConfig | undefined {
    return AI_PROVIDERS.find(p => p.models.some(m => m.id === modelId));
}
