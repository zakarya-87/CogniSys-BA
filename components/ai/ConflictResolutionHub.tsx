
import React, { useState, useEffect } from 'react';
import { TInitiative, TConflictAnalysis } from '../../types';
import { analyzeConflict } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface ConflictResolutionHubProps {
    initiative: TInitiative;
}

const ChatBubbleLeftRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>;
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>;

export const ConflictResolutionHub: React.FC<ConflictResolutionHubProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [scenario, setScenario] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TConflictAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.conflictAnalysis) {
            setAnalysis(initiative.artifacts.conflictAnalysis);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleAnalyze = async () => {
        if (!scenario.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await analyzeConflict(scenario, initiative.sector);
            setAnalysis(result);
            saveArtifact(initiative.id, 'conflictAnalysis', result);
        } catch (error) {
            console.error(error);
            setError("Failed to analyze conflict.");
        } finally {
            setIsLoading(false);
        }
    };

    const strategyColors = {
        'Collaborating': 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
        'Compromising': 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
        'Competing': 'bg-accent-red/10 text-accent-red border-accent-red/20',
        'Accommodating': 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
        'Avoiding': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ScaleIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Conflict Resolution Hub
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Apply Interest-Based Negotiation to resolve stakeholder disagreements (BABOK 10.43).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conflict Scenario</label>
                <div className="flex gap-4 items-end">
                    <textarea 
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple outline-none"
                        rows={3}
                        placeholder="Describe the disagreement, the parties involved, and their demands..."
                    />
                    <Button onClick={handleAnalyze} disabled={isLoading || !scenario} className="flex-shrink-0 mb-1">
                        {isLoading ? <Spinner /> : 'Analyze & Mediate'}
                    </Button>
                </div>
            </div>

            {analysis && (
                <div className="flex-grow animate-fade-in-down space-y-6">
                    {/* Header Strategy */}
                    <div className={`p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-center gap-4 ${strategyColors[analysis.strategy]}`}>
                        <div>
                            <span className="text-xs uppercase font-bold opacity-70">Recommended Strategy</span>
                            <h3 className="text-2xl font-bold">{analysis.strategy}</h3>
                        </div>
                        <div className="text-sm opacity-90 max-w-xl text-center sm:text-right">
                            <span className="font-bold block mb-1">Rationale:</span>
                            {analysis.rationale}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Interest Map */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" /> Interest Map
                            </h4>
                            <div className="space-y-4">
                                {(analysis.parties || []).map((party, i) => (
                                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded border-l-4 border-indigo-400">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-gray-900 dark:text-white">{party.name}</span>
                                            <span className="text-xs text-gray-500">{party.role}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                                <span className="font-bold block text-xs uppercase mb-1">Position (Demand)</span>
                                                {party.position}
                                            </div>
                                            <div className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                                <span className="font-bold block text-xs uppercase mb-1">Interest (Why)</span>
                                                {party.interest}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Solution & Script */}
                        <div className="space-y-6">
                            <div className="bg-accent-emerald/10 p-4 rounded-lg border border-accent-emerald/20">
                                <h4 className="font-bold text-accent-emerald mb-2">Win-Win Proposal</h4>
                                <p className="text-accent-emerald/80 text-sm leading-relaxed">{analysis.winWinSolution}</p>
                            </div>

                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-sm uppercase">Mediation Script</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2 italic">
                                    {(analysis.mediationScript || []).map((line, i) => (
                                        <li key={i}>{line}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
