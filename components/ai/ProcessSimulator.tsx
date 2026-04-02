
import React, { useState, useEffect } from 'react';
import { TInitiative, TSimulationRun } from '../../types';
import { runProcessSimulation } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface ProcessSimulatorProps {
    initiative: TInitiative;
}

const PlayCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>;
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FireIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.835 8.835 0 003.361 6.867 8.287 8.287 0 002.639-4.388z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.917a2.75 2.75 0 01-1.5-.433 2.75 2.75 0 01-1.5.433m3 0v5.833c0 2.21-1.343 4-3 4s-3-1.79-3-4V6.917" /></svg>;

export const ProcessSimulator: React.FC<ProcessSimulatorProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [processDesc, setProcessDesc] = useState('1. Receive Request, 2. Verify Data (Automated), 3. Approval (Manual), 4. Notify User');
    const [error, setError] = useState<string | null>(null);
    const [load, setLoad] = useState('1000 requests/hour');
    const [resources, setResources] = useState('2 Servers, 5 Approvers');
    const [result, setResult] = useState<TSimulationRun | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.processSimulation) {
            setResult(initiative.artifacts.processSimulation);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleRun = async () => {
        if (!processDesc) return;
        setError(null);
        setIsLoading(true);
        try {
            const context = `Process: ${processDesc}. Load: ${load}. Resources: ${resources}.`;
            const output = await runProcessSimulation(context, initiative.sector);
            setResult(output);
            saveArtifact(initiative.id, 'processSimulation', output);
        } catch (error) {
            console.error(error);
            setError("Simulation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const getUtilColor = (util: number) => {
        if (util > 90) return 'bg-accent-red text-white animate-pulse';
        if (util > 75) return 'bg-accent-amber text-black';
        return 'bg-accent-emerald text-white';
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
                        <PlayCircleIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Process Simulator
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Predict bottlenecks and optimize throughput via Monte Carlo simulation (BABOK 10.34).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Process Definition</label>
                        <textarea 
                            value={processDesc}
                            onChange={(e) => setProcessDesc(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            placeholder="Describe the steps and estimated times..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Load (Input)</label>
                        <input 
                            type="text" 
                            value={load}
                            onChange={(e) => setLoad(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resources</label>
                        <input 
                            type="text" 
                            value={resources}
                            onChange={(e) => setResources(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button onClick={handleRun} disabled={isLoading || !processDesc} className="w-full">
                            {isLoading ? <Spinner /> : 'Run Simulation'}
                        </Button>
                    </div>
                </div>
            </div>

            {result && (
                <div className="flex-grow animate-fade-in-down space-y-6">
                    {/* Stats Header */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-accent-purple/5 dark:bg-accent-purple/10 p-4 rounded-lg border border-accent-purple/10 dark:border-accent-purple/20">
                            <h3 className="text-xs uppercase font-bold text-accent-purple dark:text-accent-purple/90 mb-1">System Throughput</h3>
                            <p className="text-2xl font-black text-accent-purple dark:text-accent-purple/90">{result.throughput}</p>
                        </div>
                        <div className="bg-accent-red/5 dark:bg-accent-red/10 p-4 rounded-lg border border-accent-red/10 dark:border-accent-red/20">
                            <h3 className="text-xs uppercase font-bold text-accent-red dark:text-accent-red/90 mb-1 flex items-center gap-1">
                                <FireIcon className="h-4 w-4"/> Bottleneck Identified
                            </h3>
                            <p className="text-xl font-bold text-accent-red dark:text-accent-red/90">{result.bottleneck}</p>
                        </div>
                    </div>

                    {/* Flow Visualization */}
                    <div className="flex gap-4 overflow-x-auto custom-scrollbar py-4">
                        {(result.steps || []).map((step, i) => (
                            <div key={i} className="flex items-center flex-shrink-0">
                                <div className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative">
                                    <div className={`absolute -top-3 right-4 px-2 py-1 rounded text-xs font-bold ${getUtilColor(step.utilization)}`}>
                                        {step.utilization}% Util
                                    </div>
                                    
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{step.name}</h4>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                        <p className="flex items-center gap-1"><ClockIcon className="h-3 w-3"/> {step.duration}</p>
                                        <p>Resource: {step.resource}</p>
                                        <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded p-1 text-center text-[10px]">
                                            Queue: {step.queueLength} items
                                        </div>
                                    </div>
                                </div>
                                {i < (result.steps || []).length - 1 && (
                                    <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Recommendations */}
                    <div className="bg-accent-emerald/5 dark:bg-accent-emerald/10 p-4 rounded-lg border border-accent-emerald/10 dark:border-accent-emerald/20">
                        <h4 className="font-bold text-accent-emerald dark:text-accent-emerald/90 mb-2 text-sm uppercase">Optimization Strategy</h4>
                        <ul className="list-disc list-inside text-sm text-accent-emerald dark:text-accent-emerald/90 space-y-1">
                            {(result.recommendations || []).map((rec, i) => (
                                <li key={i}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
