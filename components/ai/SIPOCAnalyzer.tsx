
import React, { useState } from 'react';
import { TInitiative, TSIPOC } from '../../types';
import { generateSIPOC } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface SIPOCAnalyzerProps {
    initiative: TInitiative;
}

const RectangleStackIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;
const ArrowLongRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>;

export const SIPOCAnalyzer: React.FC<SIPOCAnalyzerProps> = ({ initiative }) => {
    const [processName, setProcessName] = useState('Order Fulfillment');
    const [error, setError] = useState<string | null>(null);
    const [sipoc, setSipoc] = useState<TSIPOC | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!processName.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateSIPOC(processName, initiative.sector);
            setSipoc(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate SIPOC.");
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
                        <RectangleStackIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent SIPOC Analyzer
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        High-level process scoping: Suppliers, Inputs, Process, Outputs, Customers (Six Sigma).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Process Name</label>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={processName}
                        onChange={(e) => setProcessName(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        placeholder="e.g. New User Onboarding, Expense Claim"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !processName}>
                        {isLoading ? <Spinner /> : 'Map Process Scope'}
                    </Button>
                </div>
            </div>

            {sipoc && (
                <div className="flex-grow animate-fade-in-down overflow-auto custom-scrollbar">
                    <div className="min-w-[800px] grid grid-cols-5 gap-4">
                        {/* Headers */}
                        <div className="bg-accent-red/10 dark:bg-accent-red/20 p-3 rounded-t-lg text-center font-bold text-accent-red dark:text-accent-red/90 border-b-4 border-accent-red">SUPPLIERS</div>
                        <div className="bg-accent-amber/10 dark:bg-accent-amber/20 p-3 rounded-t-lg text-center font-bold text-accent-amber dark:text-accent-amber/90 border-b-4 border-accent-amber">INPUTS</div>
                        <div className="bg-accent-purple/10 dark:bg-accent-purple/20 p-3 rounded-t-lg text-center font-bold text-accent-purple dark:text-accent-purple/90 border-b-4 border-accent-purple">PROCESS</div>
                        <div className="bg-accent-emerald/10 dark:bg-accent-emerald/20 p-3 rounded-t-lg text-center font-bold text-accent-emerald dark:text-accent-emerald/90 border-b-4 border-accent-emerald">OUTPUTS</div>
                        <div className="bg-accent-purple/10 dark:bg-accent-purple/20 p-3 rounded-t-lg text-center font-bold text-accent-purple dark:text-accent-purple/90 border-b-4 border-accent-purple">CUSTOMERS</div>

                        {/* Content Columns */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-b-lg min-h-[300px] space-y-2">
                            {(sipoc.suppliers || []).map((s, i) => (
                                <div key={i} className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm text-sm text-center">{s}</div>
                            ))}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-b-lg min-h-[300px] space-y-2 relative">
                             <div className="absolute top-1/2 -right-5 transform -translate-y-1/2 z-10 text-gray-400"><ArrowLongRightIcon className="h-6 w-6"/></div>
                            {(sipoc.inputs || []).map((s, i) => (
                                <div key={i} className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm text-sm text-center">{s}</div>
                            ))}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-b-lg min-h-[300px] space-y-4 relative">
                             <div className="absolute top-1/2 -right-5 transform -translate-y-1/2 z-10 text-gray-400"><ArrowLongRightIcon className="h-6 w-6"/></div>
                            {(sipoc.processSteps || []).map((s, i) => (
                                <div key={i} className="bg-accent-purple/5 dark:bg-accent-purple/10 p-2 rounded shadow-sm text-sm text-center border border-accent-purple/20 dark:border-accent-purple/30">
                                    <span className="text-xs font-bold text-accent-purple dark:text-accent-purple/90 block mb-1">Step {i+1}</span>
                                    {s}
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-b-lg min-h-[300px] space-y-2 relative">
                             <div className="absolute top-1/2 -right-5 transform -translate-y-1/2 z-10 text-gray-400"><ArrowLongRightIcon className="h-6 w-6"/></div>
                            {(sipoc.outputs || []).map((s, i) => (
                                <div key={i} className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm text-sm text-center">{s}</div>
                            ))}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-b-lg min-h-[300px] space-y-2">
                            {(sipoc.customers || []).map((s, i) => (
                                <div key={i} className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm text-sm text-center">{s}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
