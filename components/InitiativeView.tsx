
import React, { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, InitiativeStatus, TBacklogItem, BacklogItemStatus, BacklogItemPriority, BacklogItemType, TShowcaseItem, TStakeholderProfile } from '../types';
import { MODULE_GROUPS, MOCK_BACKLOG, MOCK_SHOWCASE, THINK_PLAN_ACT_MAPPING } from '../constants';
import { InitiativeActions } from './InitiativeActions';
import { InitiativeForm } from './InitiativeForm';
import { useCatalyst } from '../context/CatalystContext';
import { useUI } from '../context/UIContext';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { Spinner } from './ui/Spinner';
import { Brain, ClipboardList, Rocket, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const InitiativePlanner = React.lazy(() => import('./ai/InitiativePlanner').then(m => ({ default: m.InitiativePlanner })));
const StrategyAnalyzer = React.lazy(() => import('./ai/StrategyAnalyzer').then(m => ({ default: m.StrategyAnalyzer })));
const RequirementsModeler = React.lazy(() => import('./ai/RequirementsModeler').then(m => ({ default: m.RequirementsModeler })));
const ElicitationHub = React.lazy(() => import('./ai/ElicitationHub').then(m => ({ default: m.ElicitationHub })));
const TraceabilityGraph = React.lazy(() => import('./ai/TraceabilityGraph').then(m => ({ default: m.TraceabilityGraph })));
const SolutionEvaluator = React.lazy(() => import('./ai/SolutionEvaluator').then(m => ({ default: m.SolutionEvaluator })));
const BacklogView = React.lazy(() => import('./ai/BacklogView').then(m => ({ default: m.BacklogView })));
const AchievementsView = React.lazy(() => import('./ai/AchievementsView').then(m => ({ default: m.AchievementsView })));
const TechniqueLibrary = React.lazy(() => import('./ai/TechniqueLibrary').then(m => ({ default: m.TechniqueLibrary })));
const DomainSpecialist = React.lazy(() => import('./ai/DomainSpecialist').then(m => ({ default: m.DomainSpecialist })));
const DocumentationEngine = React.lazy(() => import('./ai/DocumentationEngine').then(m => ({ default: m.DocumentationEngine })));
const ChangeControlHub = React.lazy(() => import('./ai/ChangeControlHub').then(m => ({ default: m.ChangeControlHub })));
const RiskLedger = React.lazy(() => import('./ai/RiskLedger').then(m => ({ default: m.RiskLedger })));
const StakeholderSimulation = React.lazy(() => import('./ai/StakeholderSimulation').then(m => ({ default: m.StakeholderSimulation })));
const PresentationDeck = React.lazy(() => import('./ai/PresentationDeck').then(m => ({ default: m.PresentationDeck })));
const UatCoordinator = React.lazy(() => import('./ai/UatCoordinator').then(m => ({ default: m.UatCoordinator })));
const ReleaseLaunchpad = React.lazy(() => import('./ai/ReleaseLaunchpad').then(m => ({ default: m.ReleaseLaunchpad })));
const Retrospective = React.lazy(() => import('./ai/Retrospective').then(m => ({ default: m.Retrospective })));
const StakeholderManager = React.lazy(() => import('./ai/StakeholderManager').then(m => ({ default: m.StakeholderManager })));
const BusinessRulesManager = React.lazy(() => import('./ai/BusinessRulesManager').then(m => ({ default: m.BusinessRulesManager })));
const KnowledgeBase = React.lazy(() => import('./ai/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })));
const NfrArchitect = React.lazy(() => import('./ai/NfrArchitect').then(m => ({ default: m.NfrArchitect })));
const AccessControlMatrix = React.lazy(() => import('./ai/AccessControlMatrix').then(m => ({ default: m.AccessControlMatrix })));
const InterfaceDesigner = React.lazy(() => import('./ai/InterfaceDesigner').then(m => ({ default: m.InterfaceDesigner })));
const StateModeler = React.lazy(() => import('./ai/StateModeler').then(m => ({ default: m.StateModeler })));
const JourneyMapper = React.lazy(() => import('./ai/JourneyMapper').then(m => ({ default: m.JourneyMapper })));
const VendorSelector = React.lazy(() => import('./ai/VendorSelector').then(m => ({ default: m.VendorSelector })));
const OCMHub = React.lazy(() => import('./ai/OCMHub').then(m => ({ default: m.OCMHub })));
const GapAnalysis = React.lazy(() => import('./ai/GapAnalysis').then(m => ({ default: m.GapAnalysis })));
const IntegrationHub = React.lazy(() => import('./ai/IntegrationHub').then(m => ({ default: m.IntegrationHub })));
const IdeationLab = React.lazy(() => import('./ai/IdeationLab').then(m => ({ default: m.IdeationLab })));
const ValueStreamMapper = React.lazy(() => import('./ai/ValueStreamMapper').then(m => ({ default: m.ValueStreamMapper })));
const GlossaryManager = React.lazy(() => import('./ai/GlossaryManager').then(m => ({ default: m.GlossaryManager })));
const CompetitiveAnalysis = React.lazy(() => import('./ai/CompetitiveAnalysis').then(m => ({ default: m.CompetitiveAnalysis })));
const ServiceBlueprint = React.lazy(() => import('./ai/ServiceBlueprint').then(m => ({ default: m.ServiceBlueprint })));
const PrioritizationHub = React.lazy(() => import('./ai/PrioritizationHub').then(m => ({ default: m.PrioritizationHub })));
const CapabilityMap = React.lazy(() => import('./ai/CapabilityMap').then(m => ({ default: m.CapabilityMap })));
const BalancedScorecard = React.lazy(() => import('./ai/BalancedScorecard').then(m => ({ default: m.BalancedScorecard })));
const DataFlowArchitect = React.lazy(() => import('./ai/DataFlowArchitect').then(m => ({ default: m.DataFlowArchitect })));
const SequenceDiagramArchitect = React.lazy(() => import('./ai/SequenceDiagramArchitect').then(m => ({ default: m.SequenceDiagramArchitect })));
const ComplianceMapper = React.lazy(() => import('./ai/ComplianceMapper').then(m => ({ default: m.ComplianceMapper })));
const ADRManager = React.lazy(() => import('./ai/ADRManager').then(m => ({ default: m.ADRManager })));
const EstimationEngine = React.lazy(() => import('./ai/EstimationEngine').then(m => ({ default: m.EstimationEngine })));
const ReleaseNotesWriter = React.lazy(() => import('./ai/ReleaseNotesWriter').then(m => ({ default: m.ReleaseNotesWriter })));
const BenefitsRealization = React.lazy(() => import('./ai/BenefitsRealization').then(m => ({ default: m.BenefitsRealization })));
const ApprovalCenter = React.lazy(() => import('./ai/ApprovalCenter').then(m => ({ default: m.ApprovalCenter })));
const InitiativeOverview = React.lazy(() => import('./ai/InitiativeOverview').then(m => ({ default: m.InitiativeOverview })));
const RoadmapVisualizer = React.lazy(() => import('./ai/RoadmapVisualizer').then(m => ({ default: m.RoadmapVisualizer })));
const DataMigration = React.lazy(() => import('./ai/DataMigration').then(m => ({ default: m.DataMigration })));
const ScenarioWargaming = React.lazy(() => import('./ai/ScenarioWargaming').then(m => ({ default: m.ScenarioWargaming })));
const ThreatModeling = React.lazy(() => import('./ai/ThreatModeling').then(m => ({ default: m.ThreatModeling })));
const RequirementsLibrary = React.lazy(() => import('./ai/RequirementsLibrary').then(m => ({ default: m.RequirementsLibrary })));
const UserStoryMapper = React.lazy(() => import('./ai/UserStoryMapper').then(m => ({ default: m.UserStoryMapper })));
const C4Modeler = React.lazy(() => import('./ai/C4Modeler').then(m => ({ default: m.C4Modeler })));
const ApplicationPortfolio = React.lazy(() => import('./ai/ApplicationPortfolio').then(m => ({ default: m.ApplicationPortfolio })));
const ScopeManager = React.lazy(() => import('./ai/ScopeManager').then(m => ({ default: m.ScopeManager })));
const DPIA = React.lazy(() => import('./ai/DPIA').then(m => ({ default: m.DPIA })));
const PestleAnalysis = React.lazy(() => import('./ai/PestleAnalysis').then(m => ({ default: m.PestleAnalysis })));
const StorySplitter = React.lazy(() => import('./ai/StorySplitter').then(m => ({ default: m.StorySplitter })));
const UseCaseModeler = React.lazy(() => import('./ai/UseCaseModeler').then(m => ({ default: m.UseCaseModeler })));
const RootCauseAnalysis = React.lazy(() => import('./ai/RootCauseAnalysis').then(m => ({ default: m.RootCauseAnalysis })));
const SurveyBuilder = React.lazy(() => import('./ai/SurveyBuilder').then(m => ({ default: m.SurveyBuilder })));
const WorkshopFacilitator = React.lazy(() => import('./ai/WorkshopFacilitator').then(m => ({ default: m.WorkshopFacilitator })));
const DecisionModeler = React.lazy(() => import('./ai/DecisionModeler').then(m => ({ default: m.DecisionModeler })));
const ForceFieldAnalysis = React.lazy(() => import('./ai/ForceFieldAnalysis').then(m => ({ default: m.ForceFieldAnalysis })));
const MindMapper = React.lazy(() => import('./ai/MindMapper').then(m => ({ default: m.MindMapper })));
const PersonaBuilder = React.lazy(() => import('./ai/PersonaBuilder').then(m => ({ default: m.PersonaBuilder })));
const FunctionalDecomposition = React.lazy(() => import('./ai/FunctionalDecomposition').then(m => ({ default: m.FunctionalDecomposition })));
const OrgChartModeler = React.lazy(() => import('./ai/OrgChartModeler').then(m => ({ default: m.OrgChartModeler })));
const CostBenefitAnalysis = React.lazy(() => import('./ai/CostBenefitAnalysis').then(m => ({ default: m.CostBenefitAnalysis })));
const ProcessSimulator = React.lazy(() => import('./ai/ProcessSimulator').then(m => ({ default: m.ProcessSimulator })));
const FocusGroupSimulator = React.lazy(() => import('./ai/FocusGroupSimulator').then(m => ({ default: m.FocusGroupSimulator })));
const DocumentAnalyzer = React.lazy(() => import('./ai/DocumentAnalyzer').then(m => ({ default: m.DocumentAnalyzer })));
const ObservationAssistant = React.lazy(() => import('./ai/ObservationAssistant').then(m => ({ default: m.ObservationAssistant })));
const IssueTracker = React.lazy(() => import('./ai/IssueTracker').then(m => ({ default: m.IssueTracker })));
const SixThinkingHats = React.lazy(() => import('./ai/SixThinkingHats').then(m => ({ default: m.SixThinkingHats })));
const SIPOCAnalyzer = React.lazy(() => import('./ai/SIPOCAnalyzer').then(m => ({ default: m.SIPOCAnalyzer })));
const ConceptModeler = React.lazy(() => import('./ai/ConceptModeler').then(m => ({ default: m.ConceptModeler })));
const ConflictResolutionHub = React.lazy(() => import('./ai/ConflictResolutionHub').then(m => ({ default: m.ConflictResolutionHub })));
const ValuePropCanvas = React.lazy(() => import('./ai/ValuePropCanvas').then(m => ({ default: m.ValuePropCanvas })));
const ArtifactExplorer = React.lazy(() => import('./ai/ArtifactExplorer').then(m => ({ default: m.ArtifactExplorer })));
const VisionVideoGenerator = React.lazy(() => import('./ai/VisionVideoGenerator').then(m => ({ default: m.VisionVideoGenerator })));
const PredictiveCore = React.lazy(() => import('./ai/PredictiveCore').then(m => ({ default: m.PredictiveCore })));
const BABOKComplianceHub = React.lazy(() => import('./ai/BABOKComplianceHub').then(m => ({ default: m.BABOKComplianceHub })));

interface InitiativeViewProps {
  initiative: TInitiative;
  onUpdateStatus: (id: string, status: InitiativeStatus) => void;
  onEditInitiative: (initiative: TInitiative) => void;
  setToastMessage: (message: string) => void;
  onViewProjectPlan: (initiative: TInitiative) => void;
  requestedModule?: string | null;
}

export const InitiativeView: React.FC<InitiativeViewProps> = ({ initiative, onUpdateStatus, onEditInitiative, setToastMessage, onViewProjectPlan, requestedModule }) => {
  const { saveArtifact, updateInitiative } = useCatalyst();
  const { isFocusModeActive } = useUI();
  const { t } = useTranslation(['common', 'dashboard']);
  const [activePhase, setActivePhase] = useState('THINK');
  const [activeCategory, setActiveCategory] = useState('General');
  const [activeTab, setActiveTab] = useState('Overview');
  // Initialize with mock data, but we'll sync from artifacts
  const [backlogItems, setBacklogItemsState] = useState<TBacklogItem[]>(MOCK_BACKLOG);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showcaseItems, setShowcaseItems] = useState<TShowcaseItem[]>(MOCK_SHOWCASE);
  const [activeTechnique, setActiveTechnique] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<TInitiative | null>(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  useEffect(() => {
      if (requestedModule) {
          // Find the category for the requested module
          const category = Object.keys(MODULE_GROUPS).find(cat => MODULE_GROUPS[cat].includes(requestedModule));
          if (category) {
              const phase = Object.keys(THINK_PLAN_ACT_MAPPING).find(p => THINK_PLAN_ACT_MAPPING[p].includes(category));
              if (phase) setActivePhase(phase);
              setActiveCategory(category);
              setActiveTab(requestedModule);
          }
      }
  }, [requestedModule]);

  // Load backlog from artifacts when initiative changes
  useEffect(() => {
      if (initiative.artifacts?.backlog) {
          setBacklogItemsState(initiative.artifacts.backlog);
      }
  }, [initiative.id, initiative.artifacts]);

  // Wrapper to update backlog state AND persist to global store
  const setBacklogItems = (action: React.SetStateAction<TBacklogItem[]>) => {
      setBacklogItemsState(prev => {
          const nextItems = typeof action === 'function' ? action(prev) : action;
          setTimeout(() => {
              saveArtifact(initiative.id, 'backlog', nextItems);
          }, 0);
          return nextItems;
      });
  };

  const handleAddToBacklog = (title: string, type: BacklogItemType) => {
    const newItem: TBacklogItem = {
      id: `b-${Date.now()}`,
      title,
      type,
      status: BacklogItemStatus.TODO,
      priority: BacklogItemPriority.MEDIUM,
    };
    setBacklogItems(prev => [newItem, ...prev]);
    setToastMessage(`'${title.slice(0, 20)}...' sent to backlog.`);
    setActivePhase('ACT');
    setActiveCategory('Execution & Delivery');
    setActiveTab('Backlog');
  };

  const handleBulkAddToBacklog = (items: TBacklogItem[]) => {
      setBacklogItems(prev => [...items, ...prev]);
      setToastMessage(`${items.length} items imported to backlog.`);
      setActivePhase('ACT');
      setActiveCategory('Execution & Delivery');
      setActiveTab('Backlog');
  };

  const handleNavigateToTechnique = (techniqueName: string) => {
    setActivePhase('THINK');
    setActiveCategory('Analysis & Design');
    setActiveTab('Techniques');
    setActiveTechnique(techniqueName);
    setToastMessage(`Navigated to ${techniqueName} tool.`);
  };

  const handleNavigateToModule = (moduleName: string) => {
      const category = Object.keys(MODULE_GROUPS).find(cat => MODULE_GROUPS[cat].includes(moduleName));
      if (category) {
          const phase = Object.keys(THINK_PLAN_ACT_MAPPING).find(p => THINK_PLAN_ACT_MAPPING[p].includes(category));
          if (phase) setActivePhase(phase);
          setActiveCategory(category);
          setActiveTab(moduleName);
          setToastMessage(`Navigated to ${moduleName}.`);
      }
  };

  const handleEditInitiative = (init: TInitiative) => {
      setEditingInitiative(init);
      setIsEditing(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return <InitiativeOverview initiative={initiative} onNavigate={handleNavigateToModule} />;
      case 'Vision Video': return <VisionVideoGenerator initiative={initiative} />;
      case 'Ideation Lab': return <IdeationLab initiative={initiative} />;
      case 'Six Thinking Hats': return <SixThinkingHats initiative={initiative} />;
      case 'Value Prop Canvas': return <ValuePropCanvas initiative={initiative} />;
      case 'Planner': return <InitiativePlanner initiative={initiative} />;
      case 'Roadmap': return <RoadmapVisualizer initiative={initiative} />;
      case 'Strategy': return <StrategyAnalyzer initiative={initiative} onNavigateToTechnique={handleNavigateToTechnique} />;
      case 'Cost Benefit Analysis': return <CostBenefitAnalysis initiative={initiative} />;
      case 'PESTLE Analysis': return <PestleAnalysis initiative={initiative} />;
      case 'Force Field Analysis': return <ForceFieldAnalysis initiative={initiative} />;
      case 'Scope Manager': return <ScopeManager initiative={initiative} />;
      case 'APM Portfolio': return <ApplicationPortfolio initiative={initiative} />;
      case 'Scenario Wargaming': return <ScenarioWargaming initiative={initiative} />;
      case 'Balanced Scorecard': return <BalancedScorecard initiative={initiative} />;
      case 'Capability Map': return <CapabilityMap initiative={initiative} />;
      case 'Org Chart': return <OrgChartModeler initiative={initiative} />;
      case 'Gap Analysis': return <GapAnalysis initiative={initiative} />;
      case 'Stakeholders': return <StakeholderManager initiative={initiative} />;
      case 'Domain Specialist': return <DomainSpecialist initiative={initiative} />;
      case 'Vendor Selection': return <VendorSelector initiative={initiative} />;
      case 'Presentation': return <PresentationDeck initiative={initiative} />;
      case 'Competitive Analysis': return <CompetitiveAnalysis initiative={initiative} />;
      case 'Elicitation': return <ElicitationHub initiative={initiative} setToastMessage={setToastMessage} onAddToBacklog={handleAddToBacklog} />;
      case 'Document Analysis': return <DocumentAnalyzer initiative={initiative} />;
      case 'Observation': return <ObservationAssistant initiative={initiative} />;
      case 'Focus Group': return <FocusGroupSimulator initiative={initiative} />;
      case 'Mind Map': return <MindMapper initiative={initiative} />;
      case 'Functional Decomposition': return <FunctionalDecomposition initiative={initiative} />;
      case 'Persona Builder': return <PersonaBuilder initiative={initiative} />;
      case 'Survey Builder': return <SurveyBuilder initiative={initiative} />;
      case 'Workshop Facilitator': return <WorkshopFacilitator initiative={initiative} />;
      case 'Glossary': return <GlossaryManager initiative={initiative} />;
      case 'Concept Modeler': return <ConceptModeler initiative={initiative} />;
      case 'Simulation': return <StakeholderSimulation initiative={initiative} />;
      case 'Conflict Resolution': return <ConflictResolutionHub initiative={initiative} />;
      case 'Story Map': return <UserStoryMapper initiative={initiative} />;
      case 'Requirements': return <RequirementsModeler initiative={initiative} />;
      case 'Requirements Library': return <RequirementsLibrary initiative={initiative} onAddToBacklog={handleBulkAddToBacklog} />;
      case 'Story Splitter': return <StorySplitter initiative={initiative} onAddToBacklog={handleBulkAddToBacklog} />;
      case 'Use Case Modeler': return <UseCaseModeler initiative={initiative} />;
      case 'Data Flow': return <DataFlowArchitect initiative={initiative} />;
      case 'C4 Modeler': return <C4Modeler initiative={initiative} />;
      case 'Sequence Diagram': return <SequenceDiagramArchitect initiative={initiative} />;
      case 'Journey Map': return <JourneyMapper initiative={initiative} />;
      case 'Service Blueprint': return <ServiceBlueprint initiative={initiative} />;
      case 'Value Stream Map': return <ValueStreamMapper initiative={initiative} />;
      case 'SIPOC Analyzer': return <SIPOCAnalyzer initiative={initiative} />;
      case 'Process Simulator': return <ProcessSimulator initiative={initiative} />;
      case 'NFR Architect': return <NfrArchitect initiative={initiative} />;
      case 'Business Rules': return <BusinessRulesManager initiative={initiative} />;
      case 'Decision Modeler': return <DecisionModeler initiative={initiative} />;
      case 'State Modeler': return <StateModeler initiative={initiative} />;
      case 'API Designer': return <InterfaceDesigner initiative={initiative} />;
      case 'Access Control': return <AccessControlMatrix initiative={initiative} />;
      case 'Threat Modeling': return <ThreatModeling initiative={initiative} />;
      case 'Techniques': return <TechniqueLibrary activeTechnique={activeTechnique} setActiveTechnique={setActiveTechnique} initiative={initiative} />;
      case 'Traceability': return <TraceabilityGraph initiative={initiative} />;
      case 'Prioritization': return <PrioritizationHub initiative={initiative} />;
      case 'Documentation': return <DocumentationEngine initiative={initiative} />;
      case 'DPIA & Ethics': return <DPIA initiative={initiative} orgId={initiative.orgId} />;
      case 'Risk': return <RiskLedger initiative={initiative} />;
      case 'Issue Tracker': return <IssueTracker initiative={initiative} />;
      case 'Change Control': return <ChangeControlHub initiative={initiative} />;
      case 'Compliance Mapper': return <ComplianceMapper initiative={initiative} />;
      case 'ADR Manager': return <ADRManager initiative={initiative} />;
      case 'Approval Center': return <ApprovalCenter initiative={initiative} />;
      case 'Backlog': return <BacklogView items={backlogItems} setItems={setBacklogItems} initiative={initiative} />;
      case 'Estimation': return <EstimationEngine initiative={initiative} />;
      case 'UAT': return <UatCoordinator initiative={initiative} backlogItems={backlogItems} />;
      case 'Launchpad': return <ReleaseLaunchpad initiative={initiative} backlogItems={backlogItems} onUpdateStatus={onUpdateStatus} />;
      case 'Release Notes': return <ReleaseNotesWriter initiative={initiative} backlogItems={backlogItems} />;
      case 'OCM Hub': return <OCMHub initiative={initiative} />;
      case 'Knowledge Base': return <KnowledgeBase initiative={initiative} />;
      case 'Integration Hub': return <IntegrationHub initiative={initiative} />;
      case 'Data Migration': return <DataMigration initiative={initiative} />;
      case 'Achievements': return <AchievementsView items={showcaseItems} backlogItems={backlogItems} />;
      case 'Evaluation': return <SolutionEvaluator initiative={initiative} />;
      case 'Benefits Realization': return <BenefitsRealization initiative={initiative} />;
      case 'Retrospective': return <Retrospective initiative={initiative} backlogItems={backlogItems} />;
      case 'Root Cause Analysis': return <RootCauseAnalysis initiative={initiative} />;
      case 'Artifact Explorer': return <ArtifactExplorer initiative={initiative} />;
      case 'Predictive Core': return <PredictiveCore initiative={initiative} />;
      case 'BABOK Compliance': return <BABOKComplianceHub initiative={initiative} onNavigate={handleNavigateToModule} />;
      default: return <InitiativePlanner initiative={initiative} />;
    }
  };

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ${isFocusModeActive ? 'gap-0' : 'gap-0'}`}>
        {!isFocusModeActive && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <InitiativeActions initiative={initiative} onUpdateStatus={onUpdateStatus} onViewProjectPlan={onViewProjectPlan} onEditInitiative={handleEditInitiative} />
            </div>
        )}
        
        {isEditing && editingInitiative && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <InitiativeForm 
                    initiative={editingInitiative}
                    projectId={editingInitiative.projectId}
                    onSubmit={(init) => {
                        updateInitiative(init);
                        setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        )}

        {!isFocusModeActive && (
            <div className="flex bg-surface-darker/5 dark:bg-surface-darker/30 p-1.5 rounded-2xl mb-8 w-fit border border-border-light dark:border-border-dark animate-in fade-in slide-in-from-top-2 duration-700">
                {Object.keys(THINK_PLAN_ACT_MAPPING).map(phase => {
                    const phaseIcons: { [key: string]: any } = {
                        'THINK': <Brain className="w-4 h-4" />,
                        'PLAN': <ClipboardList className="w-4 h-4" />,
                        'ACT': <Rocket className="w-4 h-4" />
                    };

                    const isActive = activePhase === phase;

                    return (
                        <button
                            key={phase}
                            onClick={() => {
                                setActivePhase(phase);
                                const firstCategory = THINK_PLAN_ACT_MAPPING[phase][0];
                                setActiveCategory(firstCategory);
                                setActiveTab(MODULE_GROUPS[firstCategory][0]);
                            }}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                                isActive
                                    ? 'bg-surface-light dark:bg-surface-dark text-accent-teal shadow-sm ring-1 ring-border-light dark:ring-border-dark'
                                    : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                            }`}
                        >
                            {phaseIcons[phase]}
                            <span>{t(`common:phases.${phase.toLowerCase()}`)}</span>
                        </button>
                    );
                })}
            </div>
        )}

        <div className={`flex flex-1 overflow-hidden transition-all duration-300 ${isFocusModeActive ? 'gap-0' : 'gap-8'}`}>
            {/* Sidebar Navigation - Grouped by Category within Phase */}
            {!isFocusModeActive && (
                <div className={`flex-shrink-0 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-border-light dark:border-border-dark overflow-y-auto custom-scrollbar h-full transition-all duration-300 ease-in-out relative ${isNavCollapsed ? 'w-14 p-2' : 'w-72 p-6'}`}>
                    {/* Toggle button */}
                    <button
                        onClick={() => setIsNavCollapsed(v => !v)}
                        title={isNavCollapsed ? 'Expand menu' : 'Collapse menu'}
                        className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-darker hover:text-accent-teal transition-all ${isNavCollapsed ? 'static w-full flex justify-center mb-2' : ''}`}
                    >
                        {isNavCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                    </button>

                    {isNavCollapsed ? (
                        /* Collapsed: icon dots per active module */
                        <div className="mt-2 flex flex-col items-center gap-1">
                            {THINK_PLAN_ACT_MAPPING[activePhase].flatMap(category =>
                                MODULE_GROUPS[category].map(module => (
                                    <button
                                        key={module}
                                        title={module}
                                        onClick={() => { setActiveCategory(category); setActiveTab(module); }}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-[10px] font-bold group relative ${
                                            activeTab === module
                                                ? 'bg-accent-teal/10 text-accent-teal ring-1 ring-accent-teal/30'
                                                : 'text-text-muted-light dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-darker'
                                        }`}
                                    >
                                        {module.charAt(0)}
                                        <span className="absolute left-full ms-2 px-2 py-1 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
                                            {module}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Expanded: full category + module list */
                        <div className="space-y-8">
                            {THINK_PLAN_ACT_MAPPING[activePhase].map(category => (
                                <div key={category} className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-accent-teal" />
                                        {category}
                                    </h4>
                                    <nav className="space-y-1">
                                        {MODULE_GROUPS[category].map(module => (
                                            <button
                                                key={module}
                                                onClick={() => {
                                                    setActiveCategory(category);
                                                    setActiveTab(module);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 group ${
                                                    activeTab === module
                                                        ? 'bg-accent-teal/5 text-accent-teal dark:bg-accent-teal/10'
                                                        : 'text-text-muted-light dark:text-text-muted-dark hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20 hover:text-text-light dark:hover:text-text-dark'
                                                }`}
                                            >
                                                <span>{module}</span>
                                                {activeTab === module && (
                                                    <ChevronRight className="w-3 h-3 animate-in slide-in-from-start-1" />
                                                )}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Area */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-500 ${isFocusModeActive ? 'rounded-none' : 'rounded-2xl'}`}>
                <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 h-full`}>
                    <ErrorBoundary componentName={`Module: ${activeTab}`}>
                        <Suspense fallback={<div className="flex justify-center items-center h-full"><Spinner /></div>}>
                            <div key={initiative.id} className={`bg-surface-light dark:bg-surface-dark min-h-full transition-all duration-500 overflow-hidden ${
                                isFocusModeActive 
                                    ? 'p-0 !border-none !shadow-none !rounded-none' 
                                    : 'p-8 rounded-2xl border border-border-light dark:border-border-dark shadow-sm'
                            }`}>
                                {renderContent()}
                            </div>
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    </div>
  );
};
