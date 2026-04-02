
import React, { useState } from 'react';
import { TInitiative, TThreat, TStrideCategory } from '../../types';
import { generateThreatModel } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ThreatModelingProps {
    initiative: TInitiative;
}

const ShieldExclamationIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg>;
const LockClosedIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;

const strideCategories: TStrideCategory[] = ['Spoofing', 'Tampering', 'Repudiation', 'Information Disclosure', 'Denial of Service', 'Elevation of Privilege'];

const severityColors = {
    'Critical': 'bg-accent-red text-white',
    'High': 'bg-accent-amber text-white',
    'Medium': 'bg-accent-amber/50 text-black dark:text-white',
    'Low': 'bg-accent-emerald text-white',
};

export const ThreatModeling: React.FC<ThreatModelingProps> = ({ initiative }) => {
    const [context, setContext] = useState(initiative.description);
    const [error, setError] = useState<string | null>(null);
    const [threats, setThreats] = useState<TThreat[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!context.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateThreatModel(context, initiative.sector);
            setThreats(result || []);
        } catch (error) {
            console.error(error);
            setError("Failed to generate threat model.");
        } finally {
            setIsLoading(false);
        }
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
                        <ShieldExclamationIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Threat Modeling (STRIDE)
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Identify security vulnerabilities early in the design phase.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Context</label>
                <div className="flex gap-4">
                    <textarea 
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        rows={2}
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Describe the architecture, data flows, and user roles..."
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !context} className="flex-shrink-0 self-start mt-1">
                        {isLoading ? <Spinner /> : 'Scan for Threats'}
                    </Button>
                </div>
            </div>

            {(!threats || threats.length === 0) && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <LockClosedIcon className="h-16 w-16 mb-4" />
                    <p>Describe your system to identify security risks.</p>
                </div>
            )}

            {threats && threats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-down overflow-y-auto custom-scrollbar pb-4">
                    {strideCategories.map(cat => {
                        const catThreats = (Array.isArray(threats) ? threats : []).filter(t => t.category === cat);
                        if (catThreats.length === 0) return null;

                        return (
                            <div key={cat} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300">
                                    {cat}
                                </div>
                                <div className="p-3 space-y-3">
                                    {catThreats.map(threat => (
                                        <div key={threat.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded border border-gray-200 dark:border-gray-700 text-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white leading-tight">{threat.title}</h4>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${severityColors[threat.severity]}`}>
                                                    {threat.severity}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">{threat.description}</p>
                                            <div className="bg-accent-emerald/10 dark:bg-accent-emerald/20 p-2 rounded border border-accent-emerald/20">
                                                <p className="text-[10px] text-accent-emerald">
                                                    <strong>Mitigation:</strong> {threat.mitigation}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
