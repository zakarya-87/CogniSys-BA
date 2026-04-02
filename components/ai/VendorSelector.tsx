
import React, { useState, useEffect } from 'react';
import { TInitiative, TVendorAssessment } from '../../types';
import { generateVendorAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface VendorSelectorProps {
    initiative: TInitiative;
}

const ShoppingBagIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>;

const RadarChart: React.FC<{ assessment: TVendorAssessment }> = ({ assessment }) => {
    const size = 300;
    const center = size / 2;
    const radius = size / 2 - 40;
    const criteria = assessment.criteria || [];
    const options = assessment.options || [];
    const numAxes = criteria.length;
    const angleStep = (Math.PI * 2) / (numAxes || 1);

    if (numAxes === 0) return null;

    // Helper to get coordinates
    const getCoords = (value: number, index: number) => {
        const angle = index * angleStep - Math.PI / 2; // Start top
        const r = (value / 10) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    const colors = ['rgba(79, 70, 229, 0.5)', 'rgba(16, 185, 129, 0.5)', 'rgba(245, 158, 11, 0.5)'];
    const strokeColors = ['#4f46e5', '#10b981', '#f59e0b'];

    return (
        <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-md mx-auto">
            {/* Grid Levels (2, 4, 6, 8, 10) */}
            {[2, 4, 6, 8, 10].map(level => (
                <polygon 
                    key={level}
                    points={Array.from({ length: numAxes }).map((_, i) => {
                        const { x, y } = getCoords(level, i);
                        return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                />
            ))}

            {/* Axes Lines & Labels */}
            {criteria.map((crit, i) => {
                const end = getCoords(10, i);
                const labelPos = getCoords(12, i);
                return (
                    <g key={i}>
                        <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="#e5e7eb" />
                        <text 
                            x={labelPos.x} 
                            y={labelPos.y} 
                            textAnchor="middle" 
                            dominantBaseline="middle" 
                            className="text-[10px] fill-gray-500 dark:fill-gray-400 font-bold"
                        >
                            {crit.name}
                        </text>
                    </g>
                );
            })}

            {/* Data Polygons */}
            {options.map((opt, optIndex) => {
                const points = (opt.scores || []).map((score, i) => {
                    const { x, y } = getCoords(score, i);
                    return `${x},${y}`;
                }).join(' ');

                return (
                    <polygon 
                        key={opt.id}
                        points={points}
                        fill={colors[optIndex % colors.length]}
                        stroke={strokeColors[optIndex % strokeColors.length]}
                        strokeWidth="2"
                        fillOpacity="0.3"
                    />
                );
            })}
        </svg>
    );
};

export const VendorSelector: React.FC<VendorSelectorProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [need, setNeed] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [assessment, setAssessment] = useState<TVendorAssessment | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.vendorAssessment) {
            setAssessment(initiative.artifacts.vendorAssessment);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!need.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateVendorAnalysis(initiative.title, initiative.description, initiative.sector, need);
            setAssessment(result);
            saveArtifact(initiative.id, 'vendorAssessment', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate vendor assessment.");
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
                        <ShoppingBagIcon className="h-7 w-7 text-accent-purple" />
                        Smart Vendor Selection
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Evaluate "Build vs. Buy" decisions with AI-driven scoring and market intelligence.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    What solution do you need?
                </label>
                <div className="flex gap-3">
                    <input 
                        type="text"
                        value={need}
                        onChange={(e) => setNeed(e.target.value)}
                        placeholder="e.g. KYC Provider, Cloud Hosting, CRM"
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !need}>
                        {isLoading ? <Spinner /> : 'Run Comparison'}
                    </Button>
                </div>
            </div>

            {assessment && (
                <div className="mt-8 flex flex-col lg:flex-row gap-8 animate-fade-in-down">
                    {/* Left: Analysis Table */}
                    <div className="flex-grow">
                        <div className="bg-accent-purple/10 dark:bg-accent-purple/20 p-4 rounded-lg border border-accent-purple/20 mb-6">
                            <h3 className="font-bold text-accent-purple flex items-center gap-2 mb-2">
                                <ScaleIcon className="h-5 w-5"/> Recommendation: {assessment.recommendation}
                            </h3>
                            <p className="text-sm text-accent-purple/80">{assessment.reasoning}</p>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                        <th className="p-3 text-left border dark:border-gray-600">Criteria (Weight)</th>
                                        {(assessment.options || []).map(opt => (
                                            <th key={opt.id} className="p-3 text-center border dark:border-gray-600">
                                                <div>{opt.name}</div>
                                                <div className="text-[10px] font-normal opacity-70">{opt.type}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(assessment.criteria || []).map((crit, idx) => (
                                        <tr key={crit.id} className="border-b dark:border-gray-700">
                                            <td className="p-3 font-medium bg-gray-50 dark:bg-gray-800">
                                                {crit.name} <span className="text-xs text-gray-500">({crit.weight}x)</span>
                                            </td>
                                            {(assessment.options || []).map(opt => (
                                                <td key={opt.id} className="p-3 text-center bg-white dark:bg-gray-900">
                                                    {opt.scores?.[idx]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-200 dark:bg-gray-700 font-bold">
                                        <td className="p-3">Weighted Score</td>
                                        {(assessment.options || []).map(opt => (
                                            <td key={opt.id} className="p-3 text-center text-lg">
                                                {opt.totalScore}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Radar Chart */}
                    <div className="w-full lg:w-1/3 flex-shrink-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                        <h4 className="font-bold mb-4 text-gray-700 dark:text-gray-300">Visual Comparison</h4>
                        <RadarChart assessment={assessment} />
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                            {(assessment.options || []).map((opt, i) => (
                                <div key={opt.id} className="flex items-center gap-1 text-xs">
                                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: ['#4f46e5', '#10b981', '#f59e0b'][i % 3] }}></div>
                                    <span className="dark:text-gray-300">{opt.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
