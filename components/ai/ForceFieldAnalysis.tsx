
import React, { useState } from 'react';
import { TInitiative, TForceFieldAnalysis } from '../../types';
import { generateForceFieldAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ForceFieldAnalysisProps {
    initiative: TInitiative;
}

const ArrowsRightLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>;

export const ForceFieldAnalysis: React.FC<ForceFieldAnalysisProps> = ({ initiative }) => {
    const [change, setChange] = useState('Migrate Legacy Monolith to Microservices');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TForceFieldAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!change.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateForceFieldAnalysis(change, initiative.sector);
            setAnalysis(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate Force Field Analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderForce = (force: { label: string; strength: number; description?: string }, type: 'driving' | 'restraining') => {
        const widthPercent = (force.strength / 5) * 100;
        const colorClass = type === 'driving' ? 'bg-accent-emerald' : 'bg-accent-red';
        const arrowClass = type === 'driving' 
            ? 'rounded-l-md rounded-r-none' 
            : 'rounded-r-md rounded-l-none';

        return (
            <div className="flex flex-col mb-4 group relative">
                <div className={`flex items-center ${type === 'driving' ? 'justify-end' : 'justify-start'} w-full`}>
                    {type === 'driving' && <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">{force.label} ({force.strength})</span>}
                    
                    <div className={`h-8 ${colorClass} ${arrowClass} relative flex items-center justify-center text-white font-bold text-xs transition-all duration-500`} style={{ width: `${widthPercent}%` }}>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 text-white p-2 rounded text-xs z-10">
                            {force.description}
                        </div>
                    </div>

                    {type === 'restraining' && <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{force.label} ({force.strength})</span>}
                </div>
            </div>
        );
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
                        <ArrowsRightLeftIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Force Field Analysis
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Evaluate the pressures for and against a proposed change (BABOK 10.43).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proposed Change / Goal</label>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={change}
                        onChange={(e) => setChange(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        placeholder="e.g. Implement automated AI chat support"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !change}>
                        {isLoading ? <Spinner /> : 'Analyze Forces'}
                    </Button>
                </div>
            </div>

            {analysis && (
                <div className="flex-grow animate-fade-in-down flex flex-col">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{analysis.changeStatement}</h3>
                        <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${analysis.decisionScore > 0 ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-red/10 text-accent-red'}`}>
                            Net Score: {analysis.decisionScore > 0 ? '+' : ''}{analysis.decisionScore}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto italic">"{analysis.recommendation}"</p>
                    </div>

                    <div className="flex-grow grid grid-cols-2 gap-8 relative">
                        {/* Center Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-800 dark:bg-gray-200 -ml-0.5 z-0"></div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-gray-200 px-2 py-1 rounded text-xs font-bold z-10">
                            Equilibrium
                        </div>

                        {/* Left: Driving Forces */}
                        <div className="pr-4 border-r border-transparent">
                            <h4 className="text-accent-emerald font-bold uppercase text-right mb-4 text-sm">Driving Forces (Pros)</h4>
                            {(analysis.drivingForces || []).map((f, i) => (
                                <div key={i}>{renderForce(f, 'driving')}</div>
                            ))}
                        </div>

                        {/* Right: Restraining Forces */}
                        <div className="pl-4 border-l border-transparent">
                            <h4 className="text-accent-red font-bold uppercase text-left mb-4 text-sm">Restraining Forces (Cons)</h4>
                            {(analysis.restrainingForces || []).map((f, i) => (
                                <div key={i}>{renderForce(f, 'restraining')}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
