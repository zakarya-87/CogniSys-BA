
import React, { useState, useEffect } from 'react';
import { TInitiative, TCBA } from '../../types';
import { generateCBA } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface CostBenefitAnalysisProps {
    initiative: TInitiative;
}

const BanknotesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PresentationChartLineIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>;

const CashFlowChart: React.FC<{ cba: TCBA }> = ({ cba }) => {
    // Calculate cumulative cash flow
    const years = [0, 1, 2, 3];
    let cumulative = 0;
    const items = Array.isArray(cba?.items) ? cba.items : []; // Defensive check

    const points = years.map(y => {
        const yearNet = items.reduce((acc, item) => {
            const val = Number(item[`year${y}` as keyof typeof item]) || 0;
            return acc + (item.type === 'Benefit' ? val : -val);
        }, 0);
        cumulative += yearNet;
        return cumulative;
    });

    const width = 600;
    const height = 300;
    const padding = 40;
    
    const maxVal = Math.max(...points.map(Math.abs)) * 1.2;
    
    // Scale Y to fit min/max
    const minY = Math.min(...points, 0);
    const maxY = Math.max(...points, 0);
    const range = maxY - minY || 100;
    
    const getX = (i: number) => padding + (i / 3) * (width - 2 * padding);
    const getY = (val: number) => height - padding - ((val - minY) / range) * (height - 2 * padding);

    const pathD = points.map((val, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(val)}`).join(' ');

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            {/* Zero Line */}
            <line x1={padding} y1={getY(0)} x2={width-padding} y2={getY(0)} stroke="var(--color-text-muted-dark)" strokeWidth="1" strokeDasharray="4" />
            
            <text x={10} y={getY(0)} fontSize="10" className="fill-text-muted-dark">0</text>

            {/* Path */}
            <path d={pathD} fill="none" stroke={points[3] > 0 ? 'var(--color-accent-emerald)' : 'var(--color-accent-red)'} strokeWidth="3" />

            {/* Points */}
            {points.map((val, i) => (
                <g key={i}>
                    <circle cx={getX(i)} cy={getY(val)} r="5" className="fill-surface-dark stroke-text-muted-dark stroke-2" />
                    <text x={getX(i)} y={getY(val) - 10} textAnchor="middle" fontSize="10" className="fill-text-main-dark font-bold">
                        {(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </text>
                    <text x={getX(i)} y={height - 10} textAnchor="middle" fontSize="10" className="fill-text-muted-dark">Year {i}</text>
                </g>
            ))}
        </svg>
    );
};

export const CostBenefitAnalysis: React.FC<CostBenefitAnalysisProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [cba, setCba] = useState<TCBA | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.cba) {
            setCba(initiative.artifacts.cba);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateCBA(initiative.title, initiative.sector);
            setCba(result);
            saveArtifact(initiative.id, 'cba', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate CBA.");
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
                        <BanknotesIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Financial Analyst (CBA)
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Quantify value, costs, and ROI over a 3-year horizon (BABOK 10.20).
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Model Financials'}
                </Button>
            </div>

            {!cba && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <PresentationChartLineIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Generate a detailed financial model including NPV, IRR, and Breakeven analysis.
                    </p>
                </div>
            )}

            {cba && (
                <div className="flex-grow animate-fade-in-down flex flex-col gap-6">
                    {/* Metrics Header */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-accent-purple/10 p-4 rounded-lg text-center border border-accent-purple/20">
                            <p className="text-xs uppercase font-bold text-accent-purple">ROI</p>
                            <p className="text-3xl font-black text-accent-purple">{cba.roi}%</p>
                        </div>
                        <div className="bg-accent-emerald/10 p-4 rounded-lg text-center border border-accent-emerald/20">
                            <p className="text-xs uppercase font-bold text-accent-emerald">NPV</p>
                            <p className="text-3xl font-black text-accent-emerald">${(cba.npv || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-accent-purple/10 p-4 rounded-lg text-center border border-accent-purple/20">
                            <p className="text-xs uppercase font-bold text-accent-purple">Payback</p>
                            <p className="text-3xl font-black text-accent-purple">{cba.paybackPeriod}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-600">
                            <p className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400">Discount Rate</p>
                            <p className="text-3xl font-black text-gray-800 dark:text-gray-200">{cba.discountRate}%</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Table */}
                        <div className="overflow-x-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Item</th>
                                        <th className="px-4 py-2 text-right">Y0</th>
                                        <th className="px-4 py-2 text-right">Y1</th>
                                        <th className="px-4 py-2 text-right">Y2</th>
                                        <th className="px-4 py-2 text-right">Y3</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {/* Costs */}
                                    <tr className="bg-accent-red/5 font-bold"><td colSpan={5} className="px-4 py-1 text-accent-red text-xs uppercase tracking-wider">Costs</td></tr>
                                    {(Array.isArray(cba?.items) ? cba.items : []).filter(i => i.type === 'Cost').map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{item.name} <span className="text-xs text-gray-400 font-normal">({item.category})</span></td>
                                            <td className="px-4 py-2 text-right text-accent-red">({(item.year0 || 0).toLocaleString()})</td>
                                            <td className="px-4 py-2 text-right text-accent-red">({(item.year1 || 0).toLocaleString()})</td>
                                            <td className="px-4 py-2 text-right text-accent-red">({(item.year2 || 0).toLocaleString()})</td>
                                            <td className="px-4 py-2 text-right text-accent-red">({(item.year3 || 0).toLocaleString()})</td>
                                        </tr>
                                    ))}
                                    
                                    {/* Benefits */}
                                    <tr className="bg-accent-emerald/5 font-bold"><td colSpan={5} className="px-4 py-1 text-accent-emerald text-xs uppercase tracking-wider">Benefits</td></tr>
                                    {(Array.isArray(cba?.items) ? cba.items : []).filter(i => i.type === 'Benefit').map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{item.name} <span className="text-xs text-gray-400 font-normal">({item.category})</span></td>
                                            <td className="px-4 py-2 text-right text-accent-emerald">{(item.year0 || 0).toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right text-accent-emerald">{(item.year1 || 0).toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right text-accent-emerald">{(item.year2 || 0).toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right text-accent-emerald">{(item.year3 || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Chart */}
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Cumulative Net Cash Flow</h3>
                            <CashFlowChart cba={cba} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
