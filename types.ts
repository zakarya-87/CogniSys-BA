

export enum InitiativeStatus {
  PLANNING = 'Planning',
  AWAITING_APPROVAL = 'Awaiting Approval',
  IN_DEVELOPMENT = 'In Development',
  LIVE = 'Live',
  ON_HOLD = 'On Hold',
}

export enum Sector {
  SAAS_CLOUD = 'Cloud & SaaS',
  FINTECH = 'Fintech',
  GREEN_ENERGY = 'Renewable Energy',
  CIRCULAR_ECONOMY = 'Circular Economy',
  AGRITECH_FOODTECH = 'Agritech & Foodtech',
  INDUSTRY_4_0 = 'Industry 4.0 & IoT',
  BIOTECH_PHARMA = 'Biotech & Pharma',
  GENERAL = 'General Business'
}

// --- Pulse / Collaboration Types ---

export interface TTeamMember {
    id: string;
    name: string;
    role: string;
    avatar: string; // Emoji or initials
    personality: string;
    focusAreas: string[]; // Artifact keys they watch
    color: string;
}

export interface TComment {
    id: string;
    authorId: string; // ID of TTeamMember or 'user'
    text: string;
    timestamp: string;
}

export interface TActivity {
    id: string;
    initiativeId: string;
    initiativeTitle: string;
    type: 'Artifact Created' | 'Status Change' | 'Comment' | 'Alert';
    description: string;
    timestamp: string;
    authorId: string; // 'user' or AI Agent ID
    metadata?: any; // e.g., artifact key, or specific data
    comments: TComment[];
    read: boolean;
}

// --- War Room Types ---
export interface TDebateTurn {
    id: string;
    agentId: string;
    text: string;
    sentiment: 'Agrees' | 'Disagrees' | 'Neutral' | 'Constructive';
    timestamp: number;
}

export interface TWarRoomState {
    topic: string;
    status: 'Idle' | 'Debating' | 'Consensus' | 'Paused';
    turns: TDebateTurn[];
    activeAgentId: string | null;
    consensus?: string;
    round: number;
}

// --- The Construct Types ---
export interface TCodeArtifact {
    id: string;
    title: string;
    language: string;
    code: string;
    sourceArtifactType: string;
    createdAt: string;
    refinementRequest?: string;
}

// --- Vision Board Types ---
export type TVisionAnalysisType = 'Whiteboard to Backlog' | 'Sketch to Wireframe' | 'Legacy to Spec' | 'Diagram to Process';

export interface TVisionResult {
    id: string;
    type: TVisionAnalysisType;
    summary: string;
    extractedText?: string[];
    structuredData?: any; // JSON representation (e.g. Wireframe JSON, or Array of Stories)
    timestamp: string;
}

// ... [Existing TInitiative and other types remain unchanged] ...

export type UserRole = 'admin' | 'member' | 'viewer';

export interface TOrganization {
  id: string;
  name: string;
  ownerId: string;
  members: { userId: string; role: UserRole }[];
}

export interface TProject {
  id: string;
  orgId: string;
  name: string;
  description: string;
  lastUpdated?: string;
}

export interface TInitiative {
  id: string;
  orgId: string;
  projectId: string; // Added projectId
  title: string;
  description: string;
  status: InitiativeStatus;
  sector: Sector;
  owner: {
    name: string;
    avatarUrl: string;
  };
  wbs?: TWorkBreakdown;
  artifacts?: Record<string, any>;
  readinessScore?: number;
  lastUpdated?: string;
}

// ... [Rest of the existing types] ...

export type TCortexNodeType = 'Initiative' | 'Person' | 'Sector' | 'Risk' | 'Tech';

export interface TCortexNode {
    id: string;
    label: string;
    type: TCortexNodeType;
    val: number; // Size/Importance
    group?: string; // For coloring
    metadata?: any;
}

export interface TCortexLink {
    source: string;
    target: string;
    label?: string;
}

export interface TCortexGraph {
    nodes: TCortexNode[];
    links: TCortexLink[];
}

export interface TPredictiveInsight {
    initiativeId: string;
    initiativeTitle: string;
    predictionType: 'Risk' | 'Opportunity' | 'Trend';
    probability: number; // 0-1
    description: string;
    mitigationOrAction: string;
}

export interface TCortexInsight {
    id: string;
    title: string;
    description: string;
    type: 'Risk' | 'Opportunity' | 'Trend';
    impact: 'High' | 'Medium' | 'Low';
}

export interface TOracleResponse {
    answer: string;
    citations: {
        initiativeId: string;
        initiativeTitle: string;
        artifactType: string;
        snippet: string;
    }[];
    suggestedFollowUps: string[];
}

export interface TAnalysisPlan {
  approach: string;
  stakeholders: { role: string; name: string }[];
  techniques: string[];
  deliverables: string[];
}

export interface TSwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface TBusinessModelCanvas {
  customerSegments: string[];
  valuePropositions: string[];
  channels: string[];
  customerRelationships: string[];
  revenueStreams: string[];
  keyActivities: string[];
  keyResources: string[];
  keyPartnerships: string[];
  costStructure: string[];
}

export interface TActionItem {
  task: string;
  assignee: string;
  dueDate: string;
}

export interface TElicitationAnalysis {
    requirements: string[];
    decisions: string[];
    actionItems: TActionItem[];
    keyTerms: string[];
}

export interface TKpi {
  name: string;
  value: number;
  target: number;
  unit: '%' | 'ms' | '$/user' | '/10' | 'users' | 'reports';
  higherIsBetter?: boolean;
  trend: 'improving' | 'declining' | 'stable';
}

export interface TPerformanceAnalysis {
  anomalies: {
    kpi: string;
    summary: string;
    severity: 'High' | 'Medium' | 'Low';
  }[];
  rootCauseSummary: string;
}

export interface TWireframeElement {
  type: 'div' | 'h1' | 'p' | 'button' | 'input' | 'img';
  props?: {
    text?: string;
    placeholder?: string;
  };
  children?: TWireframeElement[];
}

export interface TBpmnNode {
  id: string;
  label: string;
  type: 'start' | 'task' | 'gateway' | 'end';
}

export interface TBpmnEdge {
  source: string;
  target: string;
}

export interface TBpmnFlow {
  nodes: TBpmnNode[];
  edges: TBpmnEdge[];
}

export enum BacklogItemStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export enum BacklogItemPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export type BacklogItemType = 'Requirement' | 'Task' | 'User Story' | 'NFR';

export interface TSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TBacklogItem {
  id: string;
  title: string;
  status: BacklogItemStatus;
  priority: BacklogItemPriority;
  type: BacklogItemType;
  subtasks?: TSubtask[];
  dependencies?: string[]; // Array of TBacklogItem ids that this item depends on
}

export interface TShowcaseItem {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    completedItems: string[]; // array of TBacklogItem ids
}

export interface TProjectTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
}

export interface TProjectDependency {
  from: string;
  to: string;
  description: string;
}

export interface TWorkBreakdown {
  sprints: {
    sprint: number;
    goal: string;
    stories: {
      storyId: string;
      storyTitle: string;
      tasks: TProjectTask[];
    }[];
  }[];
  dependencies: TProjectDependency[];
}

export interface TStrategicRecommendation {
    id: string;
    title: string;
    justification: string;
    source: 'Underperforming Feature' | 'High-Engagement Segment' | 'Market Threat';
}

export type TReportDetailLevel = 'basic' | 'detailed' | 'executive';

export interface TSuggestedKpi {
    kpi: string;
    goal: string;
}

export type TTechniqueCategory = 'Strategy Analysis' | 'Elicitation & Collaboration' | 'Requirements Analysis' | 'Solution Evaluation';

export enum BABOKKnowledgeArea {
    PLANNING_MONITORING = 'Business Analysis Planning and Monitoring',
    ELICITATION_COLLABORATION = 'Elicitation and Collaboration',
    REQUIREMENTS_LIFE_CYCLE = 'Requirements Life Cycle Management',
    STRATEGY_ANALYSIS = 'Strategy Analysis',
    REQUIREMENTS_ANALYSIS_DESIGN = 'Requirements Analysis and Design Definition',
    SOLUTION_EVALUATION = 'Solution Evaluation'
}

export interface TTechnique {
    id: string;
    name: string;
    description: string;
    category: TTechniqueCategory;
}

export interface TRecommendedTechnique {
    name: string;
    justification: string;
}

export interface TDecisionMatrix {
    criteria: { name: string; weight: number }[];
    alternatives: { name: string; scores: number[]; total?: number }[];
    recommendation: string;
}

export interface TDomainSpecificArtifact {
  title: string;
  type: 'Architecture' | 'Compliance' | 'Impact Assessment' | 'Protocol' | 'Strategy';
  sections: {
    heading: string;
    content: string[];
  }[];
  criticalRisks: string[];
}

export interface TImpactAnalysis {
    impactedAreas: string[];
    riskScore: 'Low' | 'Medium' | 'High';
    effortEstimation: string;
    complianceCheck: string;
    recommendation: 'Approve' | 'Reject' | 'Defer';
    justification: string;
}

export interface TChangeRequest {
    id: string;
    title: string;
    description: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Deferred';
    date: string;
    requester: string;
    analysis?: TImpactAnalysis;
    dateLogged: string;
}

export interface TRisk {
    id: string;
    description: string;
    category: 'Compliance' | 'Security' | 'Market' | 'Operational' | 'Technical';
    probability: number; // 1-5
    impact: number; // 1-5
    mitigationStrategy: string;
}

export interface TPersona {
    id: string;
    name: string;
    role: string;
    personality: string;
    keyConcern: string;
    avatarColor: string;
}

export interface TChatMessage {
    id: string;
    sender: 'user' | 'stakeholder';
    text: string;
    timestamp: number;
}

export interface TValidationResult {
    score: number;
    critique: string[];
    improvedVersion: string;
    reasoning: string;
}

export interface TSlide {
    title: string;
    bullets: string[];
    footer: string;
    type: string;
}

export type TraceNodeLayer = 'Goal' | 'Regulation' | 'Requirement' | 'Feature' | 'Test' | 'Risk';

export interface TTraceabilityNode {
    id: string;
    label: string;
    layer: TraceNodeLayer;
    description?: string;
    x?: number;
    y?: number;
}

export interface TTraceabilityLink {
    source: string;
    target: string;
    relationship: string;
}

export interface TGapAnalysisResult {
    score: number;
    gaps: {
        id: string;
        title: string;
        description: string;
        severity: 'Critical' | 'Warning';
    }[];
}

export interface TTraceabilityGraphData {
    nodes: TTraceabilityNode[];
    links: TTraceabilityLink[];
    analysis?: TGapAnalysisResult;
}

export interface TAttribute {
    name: string;
    type: string;
    description?: string;
    isKey?: boolean;
}

export interface TEntity {
    id: string;
    name: string;
    attributes: TAttribute[];
}

export interface TRelationship {
    source: string;
    target: string;
    type: 'One-to-One' | 'One-to-Many' | 'Many-to-Many';
}

export interface TDataModel {
    entities: TEntity[];
    relationships: TRelationship[];
    sqlPreview: string;
}

export interface TFeedbackInsight {
    theme: string;
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    count: number;
    recommendation: string;
}

export interface TFeedbackAnalysis {
    overallSentiment: number; // -100 to 100
    summary: string;
    insights: TFeedbackInsight[];
}

export interface TUatTestCase {
    id: string;
    relatedStoryId: string;
    title: string;
    preConditions: string;
    steps: string[];
    expectedResult: string;
    status: 'Pending' | 'Pass' | 'Fail';
}

export interface TReleaseChecklistItem {
    id: string;
    item: string;
    category: string;
    isChecked: boolean;
}

export interface TReadinessAssessment {
    score: number;
    verdict: 'GO' | 'NO-GO' | 'CAUTION';
    blockers: string[];
    summary: string;
}

export interface TRetroItem {
    id: string;
    category: 'Went Well' | 'Needs Improvement' | 'Action Items';
    text: string;
    votes: number;
}

export interface TStakeholderProfile {
    id: string;
    name: string;
    role: string;
    power: 'High' | 'Low';
    interest: 'High' | 'Low';
    attitude: 'Supporter' | 'Neutral' | 'Opponent';
    strategy: string;
}

export interface TDecisionTable {
    name: string;
    inputs: string[];
    outputs: string[];
    rules: string[][]; // Each inner array is a row of values matching inputs + outputs length
}

export interface TRuleAudit {
    isSound: boolean;
    gaps: string[];
    overlaps: string[];
    suggestions: string[];
}

export interface TKnowledgeArticle {
    id: string;
    title: string;
    type: 'SOP' | 'FAQ' | 'Manual';
    audience: 'Internal Ops' | 'End User';
    content: string;
}

export type TNfrCategory = 'Security' | 'Performance' | 'Reliability' | 'Scalability' | 'Usability' | 'Compliance' | 'Maintainability';

export interface TNfr {
    id: string;
    category: TNfrCategory;
    requirement: string;
    metric: string;
    priority: 'Critical' | 'High' | 'Medium';
}

export interface TRbacResource {
    id: string;
    name: string;
    description?: string;
}

export interface TRbacRole {
    id: string;
    name: string;
    description?: string;
}

export type TCrudAction = 'C' | 'R' | 'U' | 'D';

export interface TRbacMatrix {
    roles: TRbacRole[];
    resources: TRbacResource[];
    permissions: { [roleId: string]: { [resourceId: string]: TCrudAction[] } };
    sodRisks: string[];
}

export type TApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface TApiEndpoint {
    id: string;
    method: TApiMethod;
    path: string;
    summary: string;
    requestBody?: string; // JSON string representation
    responseBody: string; // JSON string representation
}

export type TStateType = 'Initial' | 'Intermediate' | 'Final';

export interface TStateNode {
    id: string;
    label: string;
    type: TStateType;
}

export interface TStateTransition {
    from: string;
    to: string;
    label: string;
    condition: string;
}

export interface TStateModel {
    entityName: string;
    states: TStateNode[];
    transitions: TStateTransition[];
}

export interface TJourneyStage {
    name: string;
    actions: string[];
    touchpoints: string[];
    painPoints: string[];
    sentiment: number; // 1-10
}

export interface TJourneyMap {
    persona: string;
    scenario: string;
    stages: TJourneyStage[];
}

export interface TVendorCriterion {
    id: string;
    name: string;
    weight: number; // 1-5
}

export interface TVendorOption {
    id: string;
    name: string;
    type: 'Build' | 'Buy' | 'Partner';
    scores: number[]; // Indices match criteria
    totalScore?: number;
}

export interface TVendorAssessment {
    criteria: TVendorCriterion[];
    options: TVendorOption[];
    recommendation: string;
    reasoning: string;
}

export interface TCommItem {
    id: string;
    phase: 'Pre-Launch' | 'Launch' | 'Post-Launch';
    audience: string;
    channel: 'Email' | 'Meeting' | 'Slack/Teams' | 'Workshop';
    message: string;
    date: string;
}

export interface TTrainingModule {
    id: string;
    title: string;
    format: 'Live Session' | 'Video' | 'Guide' | 'Quiz';
    targetAudience: string;
    duration: string;
}

export interface TOCMPlan {
    communications: TCommItem[];
    training: TTrainingModule[];
    resistanceStrategy: string;
}

export interface TGapItem {
    id: string;
    category: 'Process' | 'Technology' | 'People' | 'Policy';
    current: string;
    future: string;
    gap: string;
    strategy: string;
}

export interface TGapReport {
    currentStateDesc: string;
    futureStateDesc: string;
    gaps: TGapItem[];
}

export interface TExportConfig {
    selectedModules: string[];
    target: 'PDF' | 'JIRA' | 'CONFLUENCE';
    executiveSummary?: string;
}

export interface TIdea {
    id: string;
    text: string;
    type: string; // e.g. 'Substitute', 'Combine', 'General'
    votes: number;
    isPromoted: boolean;
}

export interface TVSMStep {
    id: string;
    name: string;
    processTime: number; // Minutes (Value Added)
    waitTime: number; // Minutes (Non-Value Added)
    type: 'Value' | 'Non-Value';
}

export interface TVSMAnalysis {
    steps: TVSMStep[];
    totalLeadTime: number;
    flowEfficiency: number; // percentage
    wasteHighlights: string[];
}

export interface TGlossaryTerm {
    id: string;
    term: string;
    definition: string;
    acronym?: string;
    synonyms?: string[];
    type: 'Business' | 'Technical' | 'Data';
    status: 'Draft' | 'Approved' | 'Review';
}

export interface TCompetitorFeature {
    name: string;
    us: boolean;
    them: boolean;
    note?: string;
}

export interface TCompetitorAnalysis {
    competitorName: string;
    features: TCompetitorFeature[];
    ourAdvantage: string[];
    theirAdvantage: string[];
    strategy: string;
    sources?: { title: string; uri: string }[];
}

export type TBlueprintLayer = 'Physical Evidence' | 'Customer Action' | 'Frontstage' | 'Backstage' | 'Support';

export interface TBlueprintStep {
    id: string;
    layer: TBlueprintLayer;
    text: string;
    stepIndex: number; // Column index
}

export interface TServiceBlueprint {
    scenario: string;
    steps: TBlueprintStep[];
}

export interface TRiceScore {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
    score: number;
}

export interface TPrioritizationAnalysis {
    featureId: string;
    featureTitle: string;
    moscow: 'Must Have' | 'Should Have' | 'Could Have' | 'Won\'t Have';
    rice: TRiceScore;
    kano: 'Basic' | 'Performance' | 'Delighter';
    value: number; // 1-10
    effort: number; // 1-10
    reasoning: string;
}

export interface TCapability {
    id: string;
    name: string;
    description: string;
    importance: 'High' | 'Medium' | 'Low';
    maturity: number; // 1-5
    subCapabilities: TCapability[];
}

export interface TScorecardItem {
    id: string;
    objective: string;
    measure: string;
    target: string;
}

export interface TBalancedScorecard {
    financial: TScorecardItem[];
    customer: TScorecardItem[];
    internal: TScorecardItem[];
    learning: TScorecardItem[];
}

export type TDFDNodeType = 'Entity' | 'Process' | 'Store';

export interface TDFDNode {
    id: string;
    label: string;
    type: TDFDNodeType;
    description?: string;
    x?: number;
    y?: number;
}

export interface TDFDFlow {
    from: string;
    to: string;
    label: string;
    visible?: boolean; // For animation
}

export interface TDFDModel {
    context: string;
    nodes: TDFDNode[];
    flows: TDFDFlow[];
}

export interface TSequenceParticipant {
    id: string;
    name: string;
    type: 'Actor' | 'System' | 'Database';
}

export interface TSequenceMessage {
    id: string;
    from: string;
    to: string;
    label: string;
    type: 'Request' | 'Response';
}

export interface TSequenceDiagram {
    title: string;
    participants: TSequenceParticipant[];
    messages: TSequenceMessage[];
}

export interface TComplianceItem {
    id: string;
    clause: string;
    description: string;
    status: 'Compliant' | 'Partial' | 'Gap';
    evidence: string; // Linked User Story or Requirement
    remediation: string;
}

export interface TComplianceMatrix {
    standard: string;
    score: number; // 0-100
    items: TComplianceItem[];
}

export interface TComplianceReport {
    initiativeId: string;
    initiativeTitle: string;
    generatedAt: string;
    overallScore: number;
    matrices: TComplianceMatrix[];
    executiveSummary: string;
    actionItems: TActionItem[];
}

export interface TADR {
    id: string;
    title: string;
    status: 'Proposed' | 'Accepted' | 'Rejected' | 'Deprecated';
    date: string;
    context: string;
    decision: string;
    consequences: string;
}

export interface TEstimationItem {
    storyId: string;
    title: string;
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
    weightedAvg: number;
    stdDev: number;
    rationale: string;
}

export interface TEstimationReport {
    items: TEstimationItem[];
    totalEffort: number;
    confidenceInterval: number; // +/- range
}

export interface TReleaseNote {
    version: string;
    title: string;
    intro: string;
    sections: {
        type: string; // New, Fixed, Improved
        items: string[];
    }[];
    closing: string;
}

export interface TBenefitPoint {
    period: string;
    planned: number;
    actual: number;
}

export interface TBenefitsAnalysis {
    currency: string;
    roi: number;
    npv: number;
    realizationScore: number;
    analysis: string;
    chartData: TBenefitPoint[];
}

export interface TApprover {
    id: string;
    name: string;
    role: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    comments?: string;
}

export interface TReviewPackage {
    id: string;
    title: string;
    description: string;
    status: 'Draft' | 'In Review' | 'Baselined' | 'Rejected';
    createdDate: string;
    approvers: TApprover[];
    aiAudit: {
        score: number;
        summary: string;
        flags: string[];
    };
}

export interface TDailyBriefing {
    summary: string;
    risks: string[];
    opportunities: string[];
    priorities: string[];
    sentiment: 'Positive' | 'Neutral' | 'Cautionary';
}

export interface TRoadmapPhase {
    id: string;
    name: string;
    startMonth: number; // 0-11
    durationMonths: number;
    color: string;
}

export interface TRoadmapMilestone {
    id: string;
    name: string;
    month: number;
    type: string;
}

export interface TRoadmap {
    phases: TRoadmapPhase[];
    milestones: TRoadmapMilestone[];
}

export interface TDataMapping {
    sourceField: string;
    targetField: string;
    transformation: string;
    notes: string;
}

export interface TMigrationPlan {
    strategy: 'Big Bang' | 'Phased' | 'Parallel Run';
    summary: string;
    steps: string[];
    mappings: TDataMapping[];
    qualityRules: string[];
}

export interface TScenarioEvent {
    id: string;
    title: string;
    description: string;
    probability: 'High' | 'Medium' | 'Low';
    severity: 'High' | 'Medium' | 'Low';
}

export interface TSimulationResult {
    originalMetrics: { cost: string; time: string; risk: string };
    simulatedMetrics: { cost: string; time: string; risk: string };
    impactSummary: string;
    contingencyPlan: string[];
}

export type TStrideCategory = 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege';

export interface TThreat {
    id: string;
    category: TStrideCategory;
    title: string;
    description: string;
    mitigation: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface TKpiForecastDataPoint {
    date: string;
    value: number;
    confidenceLow: number;
    confidenceHigh: number;
}

export interface TKpiForecast {
    kpiName: string;
    currentValue: number;
    forecast: TKpiForecastDataPoint[];
    insight: string;
}

export interface TProjectVitalsAdvanced {
    tasks: {
        id: string;
        name: string;
        start: number;
        duration: number;
        dependencies: string[];
        isCritical: boolean;
        assignee: string;
        progress?: number;
        status?: 'todo' | 'in-progress' | 'done';
    }[];
    resources: {
        assignee: string;
        tasks: number;
        utilization: number;
    }[];
    criticalPathDuration: number;
    riskAnalysis: string;
}

export interface TTechniqueGuide {
    technique: string;
    definition: string;
    steps: string[];
    draftContent: string;
}

export interface TRequirementPackage {
    id: string;
    title: string;
    description: string;
    sector: string;
    tags: string[];
    items: {
        title: string;
        type: 'Requirement' | 'User Story' | 'NFR';
        priority: 'High' | 'Medium' | 'Low';
    }[];
}

export interface TStoryMapNode {
    id: string;
    title: string;
    type: 'Activity' | 'Task' | 'Story';
}

export interface TStoryMapRelease {
    id: string;
    name: string;
    stories: { [activityId: string]: TStoryMapNode[] };
}

export interface TStoryMap {
    activities: TStoryMapNode[];
    releases: TStoryMapRelease[];
    tasks: Record<string, TStoryMapNode[]>;
    aiAnalysis?: string;
}

export type TC4Level = 'Context' | 'Container';

export interface TC4Node {
    id: string;
    label: string;
    type: 'Person' | 'System' | 'Container' | 'Component' | 'Database';
    description: string;
    technology?: string;
}

export interface TC4Relationship {
    source: string;
    target: string;
    label: string;
    technology?: string;
}

export interface TC4Model {
    level: TC4Level;
    nodes: TC4Node[];
    relationships: TC4Relationship[];
}

export interface TPortfolioFinancials {
    totalBudget: number;
    totalSpend: number;
    projectedROI: number;
    breakdown: {
        id: string;
        title: string;
        budget: number;
        spend: number;
        roi: number;
    }[];
    aiAnalysis: string;
}

export interface TPortfolioRisks {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    avgComplianceScore: number;
    topRisks: {
        initiative: string;
        risk: string;
        severity: string;
    }[];
    aiAnalysis: string;
}

export interface TApplication {
    id: string;
    name: string;
    description: string;
    businessValue: number; // 1-10
    technicalHealth: number; // 1-10
    age: string;
    strategy: 'Tolerate' | 'Invest' | 'Migrate' | 'Eliminate';
    recommendation: string;
}

export interface TAPMAnalysis {
    apps: TApplication[];
    summary: string;
}

export interface TUnifiedTask {
    id: string;
    title: string;
    type: 'Task' | 'Approval' | 'Action Item';
    project: string;
    status: string;
    priority: 'High' | 'Medium' | 'Low';
}

export interface TPersonalBriefing {
    greeting: string;
    summary: string;
    focusItem: string;
    tasks: TUnifiedTask[];
}

export interface TScopeStatement {
    inScope: string[];
    outScope: string[];
    assumptions: string[];
    constraints: string[];
    contextDiagram: {
        systemName: string;
        externalEntities: string[];
    };
}

export interface TPIIField {
    field: string;
    sensitivity: 'High' | 'Medium' | 'Low';
    category: 'Financial' | 'Health' | 'Identity' | 'Contact';
}

export interface TDPIA {
    piiInventory: TPIIField[];
    risks: {
        risk: string;
        impact: string;
        mitigation: string;
        regulation: string;
    }[];
    ethicsReview: string;
    privacyScore: number;
}

export type TPestleCategory = 'Political' | 'Economic' | 'Social' | 'Technological' | 'Legal' | 'Environmental';

export interface TPestleFactor {
    category: TPestleCategory;
    factors: string[];
    implication: string;
    impact: 'High' | 'Medium' | 'Low';
}

export interface TPestleAnalysis {
    factors: TPestleFactor[];
    summary: string;
    sources?: { title: string; uri: string }[];
}

export interface TSplitSuggestion {
    strategy: string;
    description: string;
    stories: {
        title: string;
        acceptanceCriteria: string;
    }[];
}

export interface TUseCaseActor {
    id: string;
    name: string;
    type: 'Primary' | 'Secondary';
}

export interface TUseCaseNode {
    id: string;
    name: string;
}

export interface TUseCaseLink {
    from: string;
    to: string;
    type: 'Association' | 'Include' | 'Extend';
}

export interface TUseCaseDiagram {
    title: string;
    actors: TUseCaseActor[];
    useCases: TUseCaseNode[];
    links: TUseCaseLink[];
}

export interface TFiveWhys {
    problem: string;
    steps: string[]; // The 5 why answers
    rootCause: string;
}

export interface TFishboneCategory {
    name: string;
    causes: string[];
}

export interface TRootCauseAnalysis {
    fiveWhys: TFiveWhys;
    fishbone: TFishboneCategory[];
    correctiveAction: string;
}

export interface TSurveyQuestion {
    id: string;
    text: string;
    type: 'MultipleChoice' | 'Likert' | 'Open';
    options?: string[];
}

export interface TSurvey {
    title: string;
    targetAudience: string;
    goal: string;
    intro: string;
    questions: TSurveyQuestion[];
    closing: string;
}

export interface TWorkshopItem {
    id: string;
    timeSlot: string;
    activity: string;
    description: string;
    durationMinutes: number;
    relatedModule?: string;
}

export interface TWorkshopPlan {
    title: string;
    totalDuration: string;
    items: TWorkshopItem[];
    icebreaker: string;
    facilitatorTips: string[];
}

export interface TDMNNode {
    id: string;
    label: string;
    type: 'Decision' | 'InputData' | 'KnowledgeSource';
}

export interface TDMNEdge {
    from: string;
    to: string;
    type: 'InformationRequirement' | 'KnowledgeRequirement';
}

export interface TDMNModel {
    title: string;
    nodes: TDMNNode[];
    edges: TDMNEdge[];
}

export interface TForceFieldFactor {
    id: string;
    label: string;
    strength: number; // 1-5
    description?: string;
}

export interface TForceFieldAnalysis {
    changeStatement: string;
    drivingForces: TForceFieldFactor[];
    restrainingForces: TForceFieldFactor[];
    recommendation: string;
    decisionScore: number;
}

export interface TMindMapNode {
    id: string;
    label: string;
    color?: string;
    children?: TMindMapNode[];
}

export interface TUserPersona {
    id: string;
    name: string;
    role: string;
    age: number;
    quote: string;
    bio: string;
    goals: string[];
    frustrations: string[];
    techSavviness: number; // 1-10
    motivations: string[];
}

export interface TDecompositionNode {
    id: string;
    label: string;
    type: 'System' | 'Module' | 'Function' | 'Feature';
    children?: TDecompositionNode[];
}

export interface TOrgNode {
    id: string;
    title: string;
    role: string;
    impact: 'High' | 'Medium' | 'Low';
    children?: TOrgNode[];
}

export interface TCBA {
    currency: string;
    discountRate: number;
    items: TCashFlowItem[];
    npv: number;
    roi: number;
    paybackPeriod: string;
}

export interface TCashFlowItem {
    id: string;
    category: string;
    name: string;
    year0: number;
    year1: number;
    year2: number;
    year3: number;
    type: 'Cost' | 'Benefit';
}

export interface TSimulationStep {
    id: string;
    name: string;
    duration: string; // "5m", "30s"
    resource: string;
    utilization: number; // 0-100
    queueLength: number;
}

export interface TSimulationRun {
    throughput: string;
    bottleneck: string;
    steps: TSimulationStep[];
    recommendations: string[];
}

export interface TFocusGroupParticipant {
    id: string;
    name: string;
    role: string;
    archetype: string;
    avatarColor: string;
}

export interface TFocusGroupScriptLine {
    speakerName: string;
    text: string;
    sentiment: 'Positive' | 'Negative' | 'Neutral';
}

export interface TFocusGroupResult {
    participants: TFocusGroupParticipant[];
    script: TFocusGroupScriptLine[];
    summary: string;
    consensusLevel: number; // 0-100
}

export interface TExtractedItem {
    id: string;
    text: string;
    category: 'Rule' | 'Requirement' | 'Term' | 'Data';
    confidence: string; // High/Medium/Low
}

export interface TDocumentAnalysis {
    summary: string;
    items: TExtractedItem[];
}

export interface TObservationPoint {
    id: string;
    category: string;
    whatToWatch: string;
    indicators: string;
}

export interface TObservationPlan {
    role: string;
    activity: string;
    mode: 'Active' | 'Passive';
    items: TObservationPoint[];
    interviewPrompts: string[];
}

export interface TIssue {
    id: string;
    title: string;
    description: string;
    type: 'Blocker' | 'Concern' | 'Defect' | 'General';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    status: 'Open' | 'In Progress' | 'Resolved';
    owner: string;
    resolution?: string;
}

export interface THatAnalysis {
    topic: string;
    white: string[];
    red: string[];
    black: string[];
    yellow: string[];
    green: string[];
    blue: string[];
    summary: string;
}

export interface TSIPOC {
    processName: string;
    suppliers: string[];
    inputs: string[];
    processSteps: string[];
    outputs: string[];
    customers: string[];
}

export interface TConceptNode {
    id: string;
    name: string;
    definition: string;
    acronym?: string;
    synonyms?: string[];
}

export interface TConceptRelationship {
    source: string;
    target: string;
    verb: string;
    cardinality?: string;
}

export interface TConceptModel {
    domain: string;
    nodes: TConceptNode[];
    relationships: TConceptRelationship[];
}

export interface TConflictParty {
    name: string;
    role: string;
    position: string;
    interest: string;
}

export interface TConflictAnalysis {
    conflictType: string;
    strategy: 'Collaborating' | 'Compromising' | 'Competing' | 'Accommodating' | 'Avoiding';
    rationale: string;
    parties: TConflictParty[];
    winWinSolution: string;
    mediationScript: string[];
}

export interface TValuePropCanvas {
    customerProfile: {
        jobs: string[];
        pains: string[];
        gains: string[];
    };
    valueMap: {
        products: string[];
        painRelievers: string[];
        gainCreators: string[];
    };
    fitScore: number;
    analysis: string;
}

export interface TVisionVideo {
    prompt: string;
    style: string;
    videoUri?: string;
    createdAt: string;
}

export interface TMonteCarloResult {
    mean: number;
    median: number;
    p90: number; // 90th percentile (Pessimistic)
    p10: number; // 10th percentile (Optimistic)
    iterations: number;
    buckets: { range: string; count: number; heightPercent: number }[];
    recommendation: string;
}

export interface TTornadoItem {
    variable: string;
    impactLow: number;
    impactHigh: number;
    base: number;
}

export interface TEthicalCheck {
    score: number;
    verdict: 'Pass' | 'Conditional' | 'Fail';
    biasRisks: { area: string; risk: string; mitigation: string }[];
    privacyConcerns: string[];
    summary: string;
}

export interface TUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export type THiveAgent = 'Orchestrator' | 'Scout' | 'Guardian' | 'Integromat' | 'Simulation';

export interface THiveMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    agent: THiveAgent; // Who sent this?
    content: string;
    thought?: string; // Chain of Thought internal monologue
    timestamp: number;
    status?: 'thinking' | 'done' | 'waiting_approval';
    metadata?: any; // For structured data like search results or risk flags
    usage?: TUsage;
    cost?: number;
}

// Graph Logic Types
export interface THiveStep {
    id: string;
    agent: THiveAgent;
    action: string;
    data?: any;
    nextAgent?: THiveAgent;
    status: 'pending' | 'active' | 'completed' | 'failed' | 'timed_out';
}

export interface THiveState {
    goal: string;
    status: 'idle' | 'running' | 'paused' | 'waiting_approval' | 'completed';
    activeAgent: THiveAgent;
    messages: THiveMessage[];
    artifacts: Record<string, any>; // Shared memory
    
    // Graph specific
    stepQueue: THiveStep[];
    history: THiveStep[];

    // Telemetry
    totalTokens?: TUsage;
    totalCost?: number;
    
    // HITL (Human-in-the-Loop)
    approvalRequest?: {
        id: string;
        agent: THiveAgent;
        actionType: 'Create' | 'Update' | 'Delete' | 'Execute';
        summary: string;
        data: any; // The payload to be executed
        toolName: string;
    };
}

// Integromat / Mock Services
export interface TJiraTicket {
    id: string;
    title: string;
    status: string;
    assignee: string;
    priority: string;
}

export interface TGitCommit {
    id: string;
    message: string;
    author: string;
    date: string;
}

// Microservice / Agent Contracts
export interface IAgentResponse {
    content: string;
    thought?: string;
    metadata?: Record<string, any>;
    nextAction?: 'reply' | 'delegate' | 'wait' | 'approval_required';
    targetAgent?: THiveAgent;
    instructions?: string;
    toolCall?: { name: string; args: any };
    usage?: TUsage;
}

export interface IAgent {
    name: THiveAgent;
    execute(context: THiveMessage[], instructions: string, initiative?: TInitiative): Promise<IAgentResponse>;
}

export type TArtifact = any;

export type Theme = 'light' | 'dark' | 'system';

// --- NEW TYPES FOR HYBRID MATH SERVICE ---
export interface TSimulationParameter {
    name: string;
    min: number;
    max: number;
    distributionType?: 'Normal' | 'Uniform' | 'Triangular';
}

// --- NEW TYPES FOR VECTOR MEMORY SERVICE (Phase 2) ---
export interface TVectorMemory {
    id: string;
    content: string;
    vector: number[];
    type: 'fact' | 'decision' | 'insight';
    timestamp: number;
    metadata?: Record<string, any>;
    // Fixed: Added score property for search results
    score?: number;
}