
import React, { useState } from 'react';
import { TInitiative, TEstimationReport, TEstimationItem } from '../../types';
import { generateEstimates } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface EstimationEngineProps {
    initiative: TInitiative;
}

const CalculatorIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18m2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25H8.25a2.25 2.25 0 01-2.25-2.25V8.25A2.25 2.25 0 018.25 6z" /></svg>;
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;

export const EstimationEngine: React.FC<EstimationEngineProps> = ({ initiative }) => {
    const [storiesInput, setStoriesInput] = useState('Login, Dashboard, Reports, User Profile, Payment Gateway');
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<TEstimationReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!storiesInput.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const storyList = storiesInput.split(',').map(s => s.trim()).filter(Boolean);
            const result = await generateEstimates(storyList, initiative.sector);
            setReport(result);
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
        // 2-Sigma Confidence Interval (Approx sum of variances square root)
        const varianceSum = newItems.reduce((acc, curr) => acc + Math.pow(curr.stdDev, 2), 0);
        const confidenceInterval = parseFloat((Math.sqrt(varianceSum) * 2).toFixed(1)); // 95% confidence roughly 2 SD

        setReport({ ...report, items: newItems, totalEffort, confidenceInterval });
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
                        <CalculatorIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Estimation Engine
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        PERT (Three-Point) Estimation for accurate project forecasting (BABOK 10.19).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Backlog Items to Estimate (Comma Separated)
                </label>
                <div className="flex gap-3">
                    <textarea 
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        rows={2}
                        value={storiesInput}
                        onChange={(e) => setStoriesInput(e.target.value)}
                        placeholder="e.g. Create User API, Design Home Screen, Implement OAuth"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !storiesInput}>
                        {isLoading ? <Spinner /> : 'Calculate Estimates'}
                    </Button>
                </div>
            </div>

            {report && (
                <div className="flex-grow animate-fade-in-down flex flex-col">
                    {/* Summary Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-accent-purple/10 p-4 rounded-lg text-center border border-accent-purple/20">
                            <p className="text-xs uppercase font-bold text-accent-purple/80">Expected Total Effort</p>
                            <p className="text-3xl font-black text-accent-purple">{(report.totalEffort || 0).toFixed(1)} <span className="text-sm font-normal">hrs</span></p>
                        </div>
                        <div className="bg-accent-emerald/10 p-4 rounded-lg text-center border border-accent-emerald/20">
                            <p className="text-xs uppercase font-bold text-accent-emerald/80">Confidence Range (95%)</p>
                            <p className="text-3xl font-black text-accent-emerald">+/- {(report.confidenceInterval || 0).toFixed(1)} <span className="text-sm font-normal">hrs</span></p>
                        </div>
                        <div className="bg-accent-purple/10 p-4 rounded-lg text-center border border-accent-purple/20">
                            <p className="text-xs uppercase font-bold text-accent-purple/80">Items Estimated</p>
                            <p className="text-3xl font-black text-accent-purple">{(report.items || []).length}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-grow overflow-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase w-1/3">Story</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-accent-emerald uppercase" title="Optimistic">O (Best)</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-accent-purple uppercase" title="Most Likely">M (Likely)</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-accent-red uppercase" title="Pessimistic">P (Worst)</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-accent-purple uppercase bg-accent-purple/5">Expected</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase" title="Standard Deviation">SD</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {(report.items || []).map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">{item.rationale}</p>
                                        </td>
                                        <td className="px-2 py-3 text-center">
                                            <input 
                                                type="number" 
                                                value={item.optimistic}
                                                onChange={(e) => handleValueChange(i, 'optimistic', parseFloat(e.target.value))}
                                                className="w-16 p-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                                            />
                                        </td>
                                        <td className="px-2 py-3 text-center">
                                            <input 
                                                type="number" 
                                                value={item.mostLikely}
                                                onChange={(e) => handleValueChange(i, 'mostLikely', parseFloat(e.target.value))}
                                                className="w-16 p-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm font-bold"
                                            />
                                        </td>
                                        <td className="px-2 py-3 text-center">
                                            <input 
                                                type="number" 
                                                value={item.pessimistic}
                                                onChange={(e) => handleValueChange(i, 'pessimistic', parseFloat(e.target.value))}
                                                className="w-16 p-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-accent-purple bg-accent-purple/5">
                                            {item.weightedAvg}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-500 text-xs">
                                            ±{item.stdDev}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
