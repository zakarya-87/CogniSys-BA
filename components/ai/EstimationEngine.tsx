
import React, { useState, useEffect } from 'react';
import { TInitiative, TEstimationReport } from '../../types';
import { generateEstimates } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface EstimationEngineProps {
    initiative: TInitiative;
}

const CalculatorIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18m2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25H8.25a2.25 2.25 0 01-2.25-2.25V8.25A2.25 2.25 0 018.25 6z" /></svg>;

export const EstimationEngine: React.FC<EstimationEngineProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [storiesInput, setStoriesInput] = useState('Login, Dashboard, Reports, User Profile, Payment Gateway');
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<TEstimationReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Sync with persistence on mount or initiative change
    useEffect(() => {
        if (initiative.artifacts?.estimation) {
            setReport(initiative.artifacts.estimation);
        }
    }, [initiative.id, initiative.artifacts?.estimation]);

    const handleGenerate = async () => {
        if (!storiesInput.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const storyList = storiesInput.split(',').map(s => s.trim()).filter(Boolean);
            const result = await generateEstimates(storyList, initiative.sector);
            setReport(result);
            saveArtifact(initiative.id, 'estimation', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate estimates.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleValueChange = (index: number, field: 'optimistic' | 'mostLikely' | 'pessimistic', value: number) => {
        if (!report) return;
        
        const newItems = [...(report.items || [])];
        const item = { ...newItems[index], [field]: value };
        
        // Recalculate PERT: (O + 4M + P) / 6
        item.weightedAvg = parseFloat(((item.optimistic + 4 * item.mostLikely + item.pessimistic) / 6).toFixed(1));
        // Recalculate SD: (P - O) / 6
        item.stdDev = parseFloat(((item.pessimistic - item.optimistic) / 6).toFixed(2));
        
        newItems[index] = item;
        
        // Recalculate totals
        const totalEffort = newItems.reduce((acc, curr) => acc + curr.weightedAvg, 0);
        const varianceSum = newItems.reduce((acc, curr) => acc + Math.pow(curr.stdDev, 2), 0);
        const confidenceInterval = parseFloat((Math.sqrt(varianceSum) * 2).toFixed(1)); 

        const updatedReport = { ...report, items: newItems, totalEffort, confidenceInterval };
        setReport(updatedReport);
        saveArtifact(initiative.id, 'estimation', updatedReport);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col border border-border-light dark:border-border-dark">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 mb-4 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold mb-1">Error</h3>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <div className="p-2 bg-accent-teal/10 rounded-lg">
                            <CalculatorIcon className="h-6 w-6 text-accent-teal" />
                        </div>
                        Intelligent Estimation Engine
                    </h2>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1 max-w-xl">
                        Apply PERT (Program Evaluation and Review Technique) based on <strong>BABOK 10.19</strong> to generate three-point estimates and calculate weighted averages with 95% confidence intervals.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-border-light dark:border-border-dark mb-6 group transition-all hover:bg-white dark:hover:bg-gray-900 shadow-sm hover:shadow-md">
                <label className="block text-[10px] font-black text-text-muted-light dark:text-text-muted-dark mb-2.5 uppercase tracking-[0.2em]">
                    Backlog Items to Estimate
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                    <textarea 
                        className="flex-grow p-4 border border-border-light dark:border-border-dark rounded-xl bg-white dark:bg-surface-dark focus:ring-2 focus:ring-accent-teal/50 outline-none transition-all placeholder:text-gray-400 text-sm leading-relaxed"
                        rows={2}
                        value={storiesInput}
                        onChange={(e) => setStoriesInput(e.target.value)}
                        placeholder="e.g. Authentication Flow, Data Pipeline, Analytics Dashboard..."
                    />
                    <div className="flex-shrink-0">
                        <Button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !storiesInput}
                            className="w-full md:w-auto h-full px-8 bg-accent-teal hover:bg-accent-teal/90 text-white rounded-xl shadow-lg shadow-accent-teal/20 transition-all active:scale-95"
                        >
                            {isLoading ? <Spinner /> : 'Analyze & Calculate'}
                        </Button>
                    </div>
                </div>
            </div>

            {report && (
                <div className="flex-grow animate-in fade-in slide-in-from-bottom-4 flex flex-col">
                    {/* Summary Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800/50 p-5 rounded-2xl text-center border border-border-light dark:border-border-dark shadow-sm group hover:border-accent-teal transition-colors">
                            <p className="text-[10px] uppercase font-black text-text-muted-light dark:text-text-muted-dark tracking-[0.2em] mb-3">Expected Total Effort</p>
                            <p className="text-4xl font-black text-accent-teal tabular-nums">
                                {(report.totalEffort || 0).toFixed(1)} <span className="text-sm font-medium text-gray-400">hrs</span>
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800/50 p-5 rounded-2xl text-center border border-border-light dark:border-border-dark shadow-sm group hover:border-accent-emerald transition-colors">
                            <p className="text-[10px] uppercase font-black text-text-muted-light dark:text-text-muted-dark tracking-[0.2em] mb-3">Confidence Range (95%)</p>
                            <p className="text-4xl font-black text-accent-emerald tabular-nums">
                                ± {(report.confidenceInterval || 0).toFixed(1)} <span className="text-sm font-medium text-gray-400">hrs</span>
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800/50 p-5 rounded-2xl text-center border border-border-light dark:border-border-dark shadow-sm group hover:border-accent-teal transition-colors">
                            <p className="text-[10px] uppercase font-black text-text-muted-light dark:text-text-muted-dark tracking-[0.2em] mb-3">Items Estimated</p>
                            <p className="text-4xl font-black text-accent-teal tabular-nums">{(report.items || []).length}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-grow overflow-hidden flex flex-col border border-border-light dark:border-border-dark rounded-2xl shadow-sm bg-white dark:bg-gray-900/40">
                        <div className="overflow-auto custom-scrollbar flex-grow">
                            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                                <thead className="bg-gray-50/50 dark:bg-surface-darker/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">Requirement / Step</th>
                                        <th className="px-4 py-4 text-center text-[10px] font-black text-accent-emerald uppercase tracking-widest" title="Optimistic">O (Best)</th>
                                        <th className="px-4 py-4 text-center text-[10px] font-black text-accent-teal uppercase tracking-widest" title="Most Likely">M (Likely)</th>
                                        <th className="px-4 py-4 text-center text-[10px] font-black text-accent-red uppercase tracking-widest" title="Pessimistic">P (Worst)</th>
                                        <th className="px-4 py-4 text-center text-[10px] font-black text-accent-teal uppercase tracking-widest bg-accent-teal/5">Expected</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">S.D.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {(report.items || []).map((item, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-accent-teal transition-colors">{item.title}</p>
                                                <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark italic leading-relaxed line-clamp-2">{item.rationale}</p>
                                            </td>
                                            <td className="px-2 py-5 text-center">
                                                <input 
                                                    type="number" 
                                                    value={item.optimistic}
                                                    onChange={(e) => handleValueChange(i, 'optimistic', parseFloat(e.target.value))}
                                                    className="w-16 p-1.5 text-center border-b border-transparent focus:border-accent-emerald rounded bg-transparent focus:bg-accent-emerald/5 transition-all outline-none text-sm font-medium tabular-nums"
                                                />
                                            </td>
                                            <td className="px-2 py-5 text-center">
                                                <input 
                                                    type="number" 
                                                    value={item.mostLikely}
                                                    onChange={(e) => handleValueChange(i, 'mostLikely', parseFloat(e.target.value))}
                                                    className="w-16 p-1.5 text-center border-b border-transparent focus:border-accent-teal rounded bg-transparent focus:bg-accent-teal/5 transition-all outline-none text-sm font-black tabular-nums text-accent-teal"
                                                />
                                            </td>
                                            <td className="px-2 py-5 text-center">
                                                <input 
                                                    type="number" 
                                                    value={item.pessimistic}
                                                    onChange={(e) => handleValueChange(i, 'pessimistic', parseFloat(e.target.value))}
                                                    className="w-16 p-1.5 text-center border-b border-transparent focus:border-accent-red rounded bg-transparent focus:bg-accent-red/5 transition-all outline-none text-sm font-medium tabular-nums"
                                                />
                                            </td>
                                            <td className="px-4 py-5 text-center font-black text-accent-teal bg-accent-teal/5 tabular-nums text-sm">
                                                {item.weightedAvg}
                                            </td>
                                            <td className="px-6 py-5 text-center text-text-muted-light dark:text-text-muted-dark text-[10px] font-mono font-bold tracking-tighter tabular-nums">
                                                ± {item.stdDev}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
