
import React, { useState } from 'react';
import { TInitiative, TMigrationPlan } from '../../types';
import { generateMigrationPlan } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface DataMigrationProps {
    initiative: TInitiative;
}

const CircleStackIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>;
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>;
const TableCellsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25v1.5c0 .621.504 1.125 1.125 1.125m17.25-2.625h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125v1.5c0 .621-.504 1.125-1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 1.5c0 .621.504-1.125 1.125-1.125M3.375 18.375h7.5" /></svg>;

export const DataMigration: React.FC<DataMigrationProps> = ({ initiative }) => {
    const [source, setSource] = useState('Legacy Mainframe CSV Exports (Customer, Transaction)');
    const [error, setError] = useState<string | null>(null);
    const [target, setTarget] = useState('New Cloud SQL Database');
    const [plan, setPlan] = useState<TMigrationPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!source || !target) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateMigrationPlan(source, target, initiative.sector);
            setPlan(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate migration plan.");
        } finally {
            setIsLoading(false);
        }
    };

    const strategyColors = {
        'Big Bang': 'bg-accent-red/10 text-accent-red border-accent-red/20',
        'Phased': 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
        'Parallel Run': 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'
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
                        <CircleStackIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Data Migration Assistant
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Plan the transition from Legacy to Future state with field-level mapping (BABOK 10.14).
                    </p>
                </div>
            </div>

            {!plan && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source System (Legacy)</label>
                            <textarea 
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                                rows={4}
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                placeholder="Describe the source data structure..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target System (New)</label>
                            <textarea 
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                                rows={4}
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                placeholder="Describe the target schema or goals..."
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={handleGenerate} disabled={isLoading || !source || !target}>
                            {isLoading ? <Spinner /> : 'Architect Migration'}
                        </Button>
                    </div>
                </div>
            )}

            {plan && (
                <div className="flex-grow animate-fade-in-down space-y-6">
                    {/* Strategy Header */}
                    <div className={`p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-center gap-4 ${strategyColors[plan.strategy] || 'bg-gray-100 text-gray-800'}`}>
                        <div>
                            <span className="text-xs uppercase font-bold opacity-70">Recommended Strategy</span>
                            <h3 className="text-2xl font-bold">{plan.strategy}</h3>
                        </div>
                        <div className="text-sm opacity-90 max-w-xl text-center sm:text-right">
                            {plan.summary}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Mapping Table */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                <TableCellsIcon className="h-5 w-5 text-gray-500" />
                                <h4 className="font-bold text-gray-800 dark:text-white">Field Mapping</h4>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Source Field</th>
                                            <th className="px-4 py-2 text-center">Transform</th>
                                            <th className="px-4 py-2 text-left">Target Field</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {(plan.mappings || []).map((map, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-2 font-mono text-gray-700 dark:text-gray-300">{map.sourceField}</td>
                                                <td className="px-4 py-2 text-center text-indigo-600 dark:text-indigo-400 text-xs">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">{map.transformation}</span>
                                                        <ArrowRightIcon className="h-3 w-3" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 font-mono font-bold text-gray-900 dark:text-white">{map.targetField}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Rules & Steps */}
                        <div className="space-y-6">
                            <div className="bg-accent-amber/10 border border-accent-amber/20 rounded-lg p-4">
                                <h4 className="font-bold text-accent-amber mb-2 text-sm uppercase">Data Quality Rules</h4>
                                <ul className="list-disc list-inside text-sm text-accent-amber/90 space-y-1">
                                    {(plan.qualityRules || []).map((rule, i) => (
                                        <li key={i}>{rule}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase">Migration Steps</h4>
                                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                    {(plan.steps || []).map((step, i) => (
                                        <li key={i} className="pl-1">{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-center">
                        <button onClick={() => setPlan(null)} className="text-sm text-gray-500 hover:underline">
                            Start New Plan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
