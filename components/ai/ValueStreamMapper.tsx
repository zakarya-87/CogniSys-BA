
import React, { useState } from 'react';
import { TInitiative, TVSMAnalysis } from '../../types';
import { generateValueStream } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Mermaid } from '../Mermaid';
import { escapeMermaidLabel } from '../../utils/aiUtils';

interface ValueStreamMapperProps {
    initiative: TInitiative;
}

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;

const generateMermaidVSM = (analysis: TVSMAnalysis) => {
    let mermaid = 'graph LR\n';
    mermaid += `    %% Value Stream Map\n`;
    
    analysis.steps.forEach((step, i) => {
        mermaid += `    step_${step.id}["${escapeMermaidLabel(step.name)}<br/>Process: ${step.processTime}m<br/>Wait: ${step.waitTime}m"]\n`;
        if (i < analysis.steps.length - 1) {
            mermaid += `    step_${step.id} --> step_${analysis.steps[i+1].id}\n`;
        }
    });
    
    return mermaid;
};

export const ValueStreamMapper: React.FC<ValueStreamMapperProps> = ({ initiative }) => {
    const [processDesc, setProcessDesc] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TVSMAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mermaidChart, setMermaidChart] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!processDesc.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateValueStream(processDesc, initiative.sector);
            setAnalysis(result);
            setMermaidChart(generateMermaidVSM(result));
        } catch (error) {
            console.error(error);
            setError("Failed to generate VSM.");
        } finally {
            setIsLoading(false);
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
                        <ChartBarIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Value Stream Mapper
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize flow, identify waste, and calculate efficiency (Lean/Six Sigma).
                    </p>
                </div>
            </div>

            <div className="space-y-4 max-w-4xl mx-auto w-full mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Process to Analyze
                </label>
                <div className="flex gap-4">
                    <textarea 
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                        rows={2}
                        value={processDesc}
                        onChange={(e) => setProcessDesc(e.target.value)}
                        placeholder="e.g. Order received -> Validated -> Manufacturing -> Quality Check -> Shipping"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !processDesc} className="flex-shrink-0 self-start mt-1">
                        {isLoading ? <Spinner /> : 'Analyze Flow'}
                    </Button>
                </div>
            </div>

            {analysis && mermaidChart && (
                <div className="flex-grow flex flex-col animate-fade-in-down">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 overflow-x-auto custom-scrollbar">
                        <Mermaid chart={mermaidChart} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Efficiency Card */}
                        <div className="bg-accent-purple/10 dark:bg-accent-purple/20 p-4 rounded-lg border border-accent-purple/20 text-center">
                            <h3 className="text-sm font-bold text-accent-purple uppercase tracking-wide">Flow Efficiency</h3>
                            <div className="text-4xl font-black text-accent-purple mt-2">
                                {analysis.flowEfficiency.toFixed(1)}%
                            </div>
                            <p className="text-xs text-accent-purple/80 mt-1">
                                {analysis.flowEfficiency < 15 ? 'Low - High Waste' : analysis.flowEfficiency > 40 ? 'Excellent' : 'Average'}
                            </p>
                        </div>

                        {/* Lead Time Card */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Total Lead Time</h3>
                            <div className="text-4xl font-black text-gray-800 dark:text-gray-200 mt-2 flex items-center justify-center gap-2">
                                <ClockIcon className="h-8 w-8 text-gray-400" />
                                {analysis.totalLeadTime}m
                            </div>
                        </div>

                        {/* Waste Card */}
                        <div className="bg-accent-red/10 dark:bg-accent-red/20 p-4 rounded-lg border border-accent-red/20">
                            <h3 className="text-sm font-bold text-accent-red uppercase tracking-wide mb-2">Identified Waste</h3>
                            <ul className="list-disc list-inside text-sm text-accent-red/80 space-y-1">
                                {(analysis.wasteHighlights || []).map((waste, i) => (
                                    <li key={i}>{waste}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
