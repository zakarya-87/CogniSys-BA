const fs = require('fs');
const path = require('path');
const TJS = require('typescript-json-schema');

const settings = {
    required: true,
    ref: true,
    topRef: false,
    noExtraProps: true,
};

const compilerOptions = {
    strictNullChecks: true,
    esModuleInterop: true,
    target: 'esnext',
    module: 'esnext',
    moduleResolution: 'node',
    skipLibCheck: true,
};

const program = TJS.getProgramFromFiles([path.resolve('types.ts')], compilerOptions);
const generator = TJS.buildGenerator(program, settings);

if (!generator) {
    console.error('Failed to build generator');
    process.exit(1);
}

// Only generate schemas for types actually used in geminiService.ts.
// Previously used startsWith('T') which swept up 400+ node_module types → 427 MB file.
const TARGET_SYMBOLS = [
    'TSuggestedKpi', 'TWireframeElement', 'TValidationResult', 'TElicitationAnalysis',
    'TGapAnalysisResult', 'TPerformanceAnalysis', 'TPortfolioFinancials', 'TPortfolioRisks',
    'TWorkBreakdown', 'TProjectVitalsAdvanced', 'TStrategicRecommendation', 'TKpiForecast',
    'TDecisionMatrix', 'TDomainSpecificArtifact', 'TImpactAnalysis', 'TRisk', 'TPersona',
    'TUatTestCase', 'TReleaseChecklistItem', 'TReadinessAssessment', 'TRetroItem',
    'TStakeholderProfile', 'TDecisionTable', 'TRuleAudit', 'TKnowledgeArticle', 'TNfr',
    'TRbacMatrix', 'TApiEndpoint', 'TStateModel', 'TJourneyMap', 'TVendorAssessment',
    'TOCMPlan', 'TGapReport', 'TIdea', 'TVSMAnalysis', 'TGlossaryTerm', 'TServiceBlueprint',
    'TPrioritizationAnalysis', 'TCapability', 'TBalancedScorecard', 'TDFDModel',
    'TSequenceDiagram', 'TComplianceMatrix', 'TADR', 'TEstimationReport', 'TReleaseNote',
    'TDailyBriefing', 'TRoadmap', 'TMigrationPlan', 'TScenarioEvent', 'TThreat',
    'TTechniqueGuide', 'TRequirementPackage', 'TStoryMap', 'TC4Model', 'TAPMAnalysis',
    'TPersonalBriefing', 'TScopeStatement', 'TDPIA', 'TSplitSuggestion', 'TRootCauseAnalysis',
    'TSurvey', 'TWorkshopPlan', 'TDMNModel', 'TForceFieldAnalysis', 'TMindMapNode',
    'TUserPersona', 'TDecompositionNode', 'TOrgNode', 'TCBA', 'TSimulationRun',
    'TFocusGroupResult', 'TDocumentAnalysis', 'TObservationPlan', 'TIssue', 'THatAnalysis',
    'TSIPOC', 'TConceptModel', 'TConflictAnalysis',
];

const allSymbols = generator.getUserSymbols();
const availableSet = new Set(allSymbols);
const targetSymbols = TARGET_SYMBOLS.filter(s => availableSet.has(s));

console.log(`Generating schemas for ${targetSymbols.length} target symbols...`);

const schemas = {};
const allDefinitions = {};

for (const symbol of targetSymbols) {
    try {
        const schema = generator.getSchemaForSymbol(symbol);
        if (schema.definitions) {
            Object.assign(allDefinitions, schema.definitions);
            delete schema.definitions; // We'll keep them in allDefinitions
        }
        schemas[symbol] = schema;
    } catch (e) {
        console.warn(`Could not generate schema for ${symbol}: ${e.message}`);
    }
}

// Add all collected definitions to each schema
for (const symbol of Object.keys(schemas)) {
    schemas[symbol].definitions = allDefinitions;
}

fs.writeFileSync('generated_schemas.json', JSON.stringify(schemas, null, 2));
console.log(`Generated ${Object.keys(schemas).length} schemas in generated_schemas.json`);
