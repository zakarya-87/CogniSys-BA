
import React from 'react';

// Reusable component for section titles
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">{children}</h2>
);

// Reusable component for feature descriptions
const Feature: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{title}</h3>
        <p className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">{subtitle}</p>
        <div className="text-gray-600 dark:text-gray-400 space-y-2">{children}</div>
    </div>
);

const CoverageRow: React.FC<{ ka: string; desc: string; modules: string[] }> = ({ ka, desc, modules }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4 last:border-0">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="md:w-1/3">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{ka}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
            <div className="md:w-2/3 flex flex-wrap gap-2">
                {modules.map(mod => (
                    <span key={mod} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded-full border border-indigo-100 dark:border-indigo-800">
                        {mod}
                    </span>
                ))}
            </div>
        </div>
    </div>
);

export const HelpView: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto pb-12 px-4">
            <div className="text-center mb-10">
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Methodology Alignment</p>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">BABOK® v3 Coverage Map</h1>
                <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                    CogniSys BA is architected to support the complete Business Analysis Body of Knowledge.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <CoverageRow 
                    ka="KA 3: Planning & Monitoring" 
                    desc="Organize the analysis effort, stakeholders, and governance."
                    modules={['Initiative Planner', 'Stakeholder Engagement', 'Roadmap Visualizer', 'Methodology Planner']}
                />
                <CoverageRow 
                    ka="KA 4: Elicitation & Collaboration" 
                    desc="Draw out requirements and confirm results with stakeholders."
                    modules={['Elicitation Hub', 'Stakeholder Simulation', 'Ideation Lab', 'Technique Library']}
                />
                <CoverageRow 
                    ka="KA 5: Requirements Life Cycle" 
                    desc="Manage requirements from inception to retirement."
                    modules={['Traceability Graph', 'Prioritization Hub', 'Approval Center', 'Change Control', 'Requirements Reuse']}
                />
                <CoverageRow 
                    ka="KA 6: Strategy Analysis" 
                    desc="Define the future state and the change strategy."
                    modules={['Strategy Analyzer', 'Risk Ledger', 'Gap Analysis', 'Balanced Scorecard', 'Capability Map', 'Scenario Wargaming', 'APM Portfolio']}
                />
                <CoverageRow 
                    ka="KA 7: Requirements Analysis & Design" 
                    desc="Structure and model requirements and designs."
                    modules={['Requirements Modeler', 'Process (BPMN)', 'Data Flow (DFD)', 'C4 Architect', 'Sequence Diagrams', 'State Modeler', 'Service Blueprint', 'Vendor Selection', 'NFR Architect']}
                />
                <CoverageRow 
                    ka="KA 8: Solution Evaluation" 
                    desc="Assess the performance and value of the solution."
                    modules={['Solution Evaluator', 'Benefits Realization', 'Release Launchpad', 'Retrospective', 'UAT Coordinator']}
                />
            </div>

            <div className="mt-12 space-y-4">
                <SectionTitle>Platform Capabilities</SectionTitle>
                
                <Feature title="AI-Driven Execution" subtitle="Beyond static templates.">
                    <p>Unlike traditional tools that provide empty text fields, CogniSys uses Generative AI to <strong>draft</strong> the content for you based on the initiative's sector and context. It acts as a specialized agent for each BABOK task (e.g., The 'Risk Detective', the 'Process Architect').</p>
                </Feature>

                <Feature title="Sector-Specific Intelligence" subtitle="Context is king.">
                    <p>The platform adapts its behavior based on the domain. A <strong>Fintech</strong> project triggers specific compliance checks (PCI-DSS) and security modeling, while a <strong>Green Energy</strong> project focuses on environmental impact and sensor telemetry.</p>
                </Feature>

                <Feature title="Full Traceability" subtitle="Connect the dots.">
                    <p>Every artifact generated—from a Strategic Goal to a User Story to a Test Case—is node-linked. The <strong>Traceability Graph</strong> visualizes these connections to prevent scope creep and ensure value delivery.</p>
                </Feature>
            </div>
        </div>
    );
};
