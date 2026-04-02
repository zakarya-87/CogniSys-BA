
import React, { useState } from 'react';
import { TInitiative, TScenarioEvent, TSimulationResult } from '../../types';
import { generateScenarios, runSimulation } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ScenarioWargamingProps {
    initiative: TInitiative;
}

const GlobeAmericasIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
const LightningBoltIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;

export const ScenarioWargaming: React.FC<ScenarioWargamingProps> = ({ initiative }) => {
    const [scenarios, setScenarios] = useState<TScenarioEvent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedScenario, setSelectedScenario] = useState<TScenarioEvent | null>(null);
    const [simulation, setSimulation] = useState<TSimulationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    const handleGenerateScenarios = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateScenarios(initiative.sector);
            setScenarios(result || []);
        } catch (error) {
            console.error(error);
            setError("Failed to generate scenarios.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunSimulation = async (scenario: TScenarioEvent) => {
        setSelectedScenario(scenario);
        setIsSimulating(true);
        setSimulation(null);
        try {
            const result = await runSimulation(scenario.title, initiative.sector);
            setSimulation(result);
        } catch (error) {
            console.error(error);
            setError("Failed to run simulation.");
        } finally {
            setIsSimulating(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch(severity) {
            case 'High': return 'text-accent-red bg-accent-red/10 dark:bg-accent-red/20';
            case 'Medium': return 'text-accent-amber bg-accent-amber/10 dark:bg-accent-amber/20';
            case 'Low': return 'text-accent-emerald bg-accent-emerald/10 dark:bg-accent-emerald/20';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 mb-4">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <GlobeAmericasIcon className="h-7 w-7 text-accent-purple" />
                        Scenario Wargaming
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Stress-test your initiative against future events and market shocks (BABOK 10.16).
                    </p>
                </div>
                <Button onClick={handleGenerateScenarios} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Scan Horizon'}
                </Button>
            </div>

            {(scenarios || []).length === 0 && !isLoading ? (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <GlobeAmericasIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Click "Scan Horizon" to identify potential threats and opportunities in the {initiative.sector} sector.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-8 animate-fade-in-down">
                    {/* Scenario Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(scenarios || []).map((sc, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleRunSimulation(sc)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                    selectedScenario?.id === sc.id 
                                        ? 'bg-accent-purple/5 border-accent-purple dark:bg-accent-purple/10 dark:border-accent-purple ring-2 ring-accent-purple/20 dark:ring-accent-purple/30' 
                                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getSeverityColor(sc.severity)}`}>
                                        {sc.severity} Impact
                                    </span>
                                    <span className="text-xs text-gray-500">Prob: {sc.probability}</span>
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{sc.title}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{sc.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Simulation Results */}
                    <div className="flex-grow bg-gray-900 text-white rounded-xl p-6 relative overflow-hidden min-h-[300px]">
                        {!simulation && !isSimulating && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                <LightningBoltIcon className="h-32 w-32 text-yellow-500" />
                            </div>
                        )}

                        {isSimulating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                                <Spinner />
                                <p className="mt-4 text-accent-purple animate-pulse">Simulating Event Impact...</p>
                            </div>
                        )}

                        {simulation && (
                            <div className="relative z-10 animate-fade-in-down">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <LightningBoltIcon className="h-6 w-6 text-accent-amber" />
                                    Simulation Result: {selectedScenario?.title}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                        <h4 className="text-sm font-bold uppercase text-gray-400 mb-3">Impact Analysis</h4>
                                        <p className="text-sm leading-relaxed text-gray-200">
                                            {typeof simulation.impactSummary === 'string' 
                                                ? simulation.impactSummary 
                                                : JSON.stringify(simulation.impactSummary)}
                                        </p>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                        <h4 className="text-sm font-bold uppercase text-gray-400 mb-3">Metrics Delta</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Cost Impact:</span>
                                                <span className="font-mono text-accent-red">{simulation.simulatedMetrics?.cost || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Time Impact:</span>
                                                <span className="font-mono text-accent-amber">{simulation.simulatedMetrics?.time || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Risk Exposure:</span>
                                                <span className="font-mono text-accent-amber">{simulation.simulatedMetrics?.risk || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold uppercase text-accent-emerald mb-3">Recommended Contingency Plan</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                                        {(simulation.contingencyPlan || []).map((step, i) => (
                                            <li key={i}>{step}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
