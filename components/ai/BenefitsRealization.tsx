
import React, { useState } from 'react';
import { TInitiative, TBenefitsAnalysis } from '../../types';
import { analyzeBenefitsRealization } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface BenefitsRealizationProps {
    initiative: TInitiative;
}

const BanknotesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
const ArrowTrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;

const RealizationChart: React.FC<{ data: TBenefitsAnalysis['chartData'] }> = ({ data }) => {
    const width = 600;
    const height = 300;
    const padding = 40;
    
    const chartData = data || [];

    const maxVal = Math.max(...chartData.map(d => Math.max(d.planned, d.actual)), 100) * 1.1;
    
    const getX = (i: number) => padding + (i / (Math.max(chartData.length - 1, 1))) * (width - 2 * padding);
    const getY = (val: number) => height - padding - (val / maxVal) * (height - 2 * padding);

    const plannedPath = chartData.map((d, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(d.planned)}`).join(' ');
    const actualPath = chartData.map((d, i) => `${i===0?'M':'L'} ${getX(i)} ${getY(d.actual)}`).join(' ');

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Grid Lines */}
            <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="currentColor" className="text-gray-300" />
            <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="currentColor" className="text-gray-300" />

            {/* Planned Line (Dashed) */}
            <path d={plannedPath} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-text-muted-dark" />
            
            {/* Actual Line (Solid, Green/Red based on performance) */}
            <path d={actualPath} fill="none" stroke="currentColor" strokeWidth="3" className="text-accent-purple" />

            {/* Dots */}
            {chartData.map((d, i) => (
                <g key={i}>
                    <circle cx={getX(i)} cy={getY(d.planned)} r="4" fill="currentColor" className="text-text-muted-dark" />
                    <circle cx={getX(i)} cy={getY(d.actual)} r="4" fill="currentColor" className="text-accent-purple" />
                    <text x={getX(i)} y={height - 20} textAnchor="middle" fontSize="10" className="fill-text-muted-dark">{d.period}</text>
                </g>
            ))}
            
            {/* Legend */}
            <g transform={`translate(${width - 120}, 20)`}>
                <line x1="0" y1="0" x2="20" y2="0" stroke="currentColor" strokeDasharray="4" strokeWidth="2" className="text-text-muted-dark" />
                <text x="25" y="4" fontSize="10" className="fill-text-muted-dark">Planned</text>
                <line x1="0" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="2" className="text-accent-purple" />
                <text x="25" y="19" fontSize="10" className="fill-text-muted-dark">Actual</text>
            </g>
        </svg>
    );
};

export const BenefitsRealization: React.FC<BenefitsRealizationProps> = ({ initiative }) => {
    const [plannedValue, setPlannedValue] = useState('100000');
    const [error, setError] = useState<string | null>(null);
    const [actualValue, setActualValue] = useState('85000');
    const [analysis, setAnalysis] = useState<TBenefitsAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await analyzeBenefitsRealization(parseFloat(plannedValue), parseFloat(actualValue), initiative.sector);
            setAnalysis(result);
        } catch (error) {
            console.error(error);
            setError("Failed to analyze benefits.");
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
                        Benefits Realization Dashboard
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Compare Business Case vs. Actuals to track ROI and Value Leakage (BABOK 8.2).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Planned Benefit ($)</label>
                        <input 
                            type="number" 
                            value={plannedValue}
                            onChange={(e) => setPlannedValue(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Realized ($)</label>
                        <input 
                            type="number" 
                            value={actualValue}
                            onChange={(e) => setActualValue(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <Spinner /> : 'Audit Value'}
                    </Button>
                </div>
            </div>

            {analysis && (
                <div className="flex-grow animate-fade-in-down space-y-6">
                    {/* Scorecards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-accent-purple/10 p-4 rounded-lg border border-accent-purple/20 text-center">
                            <p className="text-xs font-bold text-accent-purple uppercase">Realization Rate</p>
                            <p className="text-3xl font-black text-accent-purple">{analysis.realizationScore}%</p>
                        </div>
                        <div className="bg-accent-emerald/10 p-4 rounded-lg border border-accent-emerald/20 text-center">
                            <p className="text-xs font-bold text-accent-emerald uppercase">Est. ROI</p>
                            <p className="text-3xl font-black text-accent-emerald">{analysis.roi}%</p>
                        </div>
                        <div className="bg-accent-purple/10 p-4 rounded-lg border border-accent-purple/20 text-center">
                            <p className="text-xs font-bold text-accent-purple uppercase">NPV</p>
                            <p className="text-3xl font-black text-accent-purple">${(analysis.npv ?? 0).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart */}
                        <div className="lg:col-span-2">
                            <RealizationChart data={analysis.chartData || []} />
                        </div>
                        
                        {/* Narrative */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <ArrowTrendingUpIcon className="h-5 w-5 text-accent-purple" /> Analysis
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                {analysis.analysis}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
