
import React, { useState, useEffect } from 'react';
import { TInitiative, Sector, TDomainSpecificArtifact } from '../../types';
import { generateDomainSpecificAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface DomainSpecialistProps {
    initiative: TInitiative;
}

const SECTOR_ICONS: { [key in Sector]: React.ReactNode } = {
    [Sector.SAAS_CLOUD]: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
    [Sector.FINTECH]: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    [Sector.GREEN_ENERGY]: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    [Sector.CIRCULAR_ECONOMY]: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    [Sector.AGRITECH_FOODTECH]: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
    [Sector.INDUSTRY_4_0]: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    [Sector.BIOTECH_PHARMA]: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    [Sector.GENERAL]: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
};

const SECTOR_CONFIG: { [key in Sector]: { title: string; description: string; placeholder: string } } = {
    [Sector.SAAS_CLOUD]: { title: 'Cloud & SaaS Architect', description: 'Generates C4 Models and API Strategies.', placeholder: 'Describe the technical scope (e.g., Microservices, Multi-tenancy)...' },
    [Sector.FINTECH]: { title: 'Compliance & Risk Officer', description: 'Checks against KYC, AML, SOC2, and financial regulations.', placeholder: 'Describe the financial flows and user types...' },
    [Sector.GREEN_ENERGY]: { title: 'Sustainability Analyst', description: 'Evaluates Environmental Impact (EIA) and Energy Efficiency.', placeholder: 'Describe the energy source and location...' },
    [Sector.CIRCULAR_ECONOMY]: { title: 'Circular Economy Specialist', description: 'Lifecycle Assessment (LCA) and waste-to-value analysis.', placeholder: 'Describe the materials and product lifecycle...' },
    [Sector.AGRITECH_FOODTECH]: { title: 'Agritech Systems Engineer', description: 'Yield optimization and supply chain traceability.', placeholder: 'Describe the crop/product and IoT sensor array...' },
    [Sector.INDUSTRY_4_0]: { title: 'Industrial IoT Architect', description: 'Digital Twin schema and predictive maintenance modeling.', placeholder: 'Describe the machinery and telemetry data points...' },
    [Sector.BIOTECH_PHARMA]: { title: 'Clinical Trial Coordinator', description: 'Drafts Clinical Protocols and HIPAA compliance strategies.', placeholder: 'Describe the trial phase and patient cohort...' },
    [Sector.GENERAL]: { title: 'Senior Business Analyst', description: 'General strategic impact assessment.', placeholder: 'Describe the business initiative...' },
};

export const DomainSpecialist: React.FC<DomainSpecialistProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [context, setContext] = useState('');
    const [artifact, setArtifact] = useState<TDomainSpecificArtifact | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const config = SECTOR_CONFIG[initiative.sector];

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.domainArtifact) {
            setArtifact(initiative.artifacts.domainArtifact);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateDomainSpecificAnalysis(initiative, context);
            setArtifact(result);
            saveArtifact(initiative.id, 'domainArtifact', result);
        } catch (err) {
            setError("Failed to generate domain analysis. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-accent-purple to-accent-purple/80 rounded-lg p-6 text-white shadow-lg flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        {SECTOR_ICONS[initiative.sector]}
                        {config.title}
                    </h2>
                    <p className="opacity-90 mt-1">{config.description}</p>
                </div>
                <div className="hidden sm:block bg-white/20 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
                    {initiative.sector} Sector
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Domain Context
                </label>
                <textarea
                    rows={4}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                    placeholder={config.placeholder}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                />
                <Button onClick={handleGenerate} disabled={isLoading || !context.trim()}>
                    {isLoading ? <Spinner /> : `Generate ${initiative.sector} Artifact`}
                </Button>
                {error && <p className="text-accent-red">{error}</p>}
            </div>

            {artifact && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-t-4 border-accent-purple animate-fade-in-down">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{artifact.title}</h3>
                            <span className="inline-block mt-2 px-3 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-sm font-semibold">
                                {artifact.type}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {(artifact.sections || []).map((section, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-200 dark:border-gray-600 pb-1">
                                    {section.heading}
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                                    {(section.content || []).map((point, i) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {(artifact.criticalRisks || []).length > 0 && (
                            <div className="bg-accent-red/10 p-4 rounded-lg border border-accent-red/20">
                                <h4 className="text-lg font-semibold text-accent-red mb-2 flex items-center">
                                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Critical Domain Risks
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-accent-red/90">
                                    {(artifact.criticalRisks || []).map((risk, i) => (
                                        <li key={i}>{risk}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
