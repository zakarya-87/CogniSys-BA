
import React, { useState, useEffect } from 'react';
import { TInitiative, TRisk } from '../../types';
import { generateRiskAssessment } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface RiskLedgerProps {
    initiative: TInitiative;
}

const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;

export const RiskLedger: React.FC<RiskLedgerProps> = ({ initiative }) => {
    const { saveArtifact, setToastMessage } = useCatalyst();
    const [risks, setRisks] = useState<TRisk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load from persistence on mount
    useEffect(() => {
        if (initiative.artifacts?.risks) {
            setRisks(Array.isArray(initiative.artifacts.risks) ? initiative.artifacts.risks : []);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerateRisks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let description = initiative.description;
            
            // Intelligent Context Chaining: Inject SWOT Threats
            if (initiative.artifacts?.swot?.threats) {
                description += `\n\nCONSIDER THESE STRATEGIC THREATS FROM SWOT: ${initiative.artifacts.swot.threats.join('; ')}`;
            }
            // Inject PESTLE Factors if available
            if (initiative.artifacts?.pestleAnalysis?.factors) {
                const pestleRisks = initiative.artifacts.pestleAnalysis.factors
                    .filter((f: any) => f.impact === 'High')
                    .map((f: any) => f.implication)
                    .join('; ');
                if (pestleRisks) {
                     description += `\n\nCONSIDER THESE MACRO FACTORS: ${pestleRisks}`;
                }
            }

            const results = await generateRiskAssessment(initiative.title, description, initiative.sector);
            const safeResults = results || [];
            setRisks(safeResults);
            // Save to Global Store
            saveArtifact(initiative.id, 'risks', safeResults);
            setToastMessage(`Generated ${safeResults.length} risks.`);
        } catch (err: any) {
            setError(err.message || 'Failed to generate risk assessment.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getRiskLevel = (prob: number, impact: number) => {
        const score = prob * impact;
        if (score >= 15) return { label: 'Critical', bg: 'bg-accent-red', text: 'text-white' };
        if (score >= 10) return { label: 'High', bg: 'bg-accent-amber', text: 'text-white' };
        if (score >= 5) return { label: 'Medium', bg: 'bg-accent-amber/50', text: 'text-gray-900' };
        return { label: 'Low', bg: 'bg-accent-emerald', text: 'text-white' };
    };

    // Render 5x5 Heatmap Grid
    const renderHeatmap = () => {
        const grid = Array(5).fill(null).map(() => Array(5).fill(0));
        (risks || []).forEach(r => {
            const row = 5 - r.probability; 
            const col = r.impact - 1;
            if(row >= 0 && row < 5 && col >= 0 && col < 5) {
                grid[row][col]++;
            }
        });

        return (
            <div className="relative w-full max-w-sm mx-auto aspect-square">
                 <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-bold text-gray-500">Probability</div>
                 <div className="absolute bottom-[-2rem] left-1/2 -translate-x-1/2 text-sm font-bold text-gray-500">Impact</div>
                
                <div className="grid grid-cols-5 grid-rows-5 gap-1 h-full w-full">
                    {grid.map((row, rIndex) => (
                        row.map((count, cIndex) => {
                            const prob = 5 - rIndex;
                            const impact = cIndex + 1;
                            const score = prob * impact;
                            let cellClass = 'bg-accent-emerald/10 dark:bg-accent-emerald/20';
                            if (score >= 15) cellClass = 'bg-accent-red/20 dark:bg-accent-red/30';
                            else if (score >= 10) cellClass = 'bg-accent-amber/20 dark:bg-accent-amber/30';
                            else if (score >= 5) cellClass = 'bg-accent-amber/10 dark:bg-accent-amber/20';

                            return (
                                <div key={`${rIndex}-${cIndex}`} className={`${cellClass} flex items-center justify-center rounded text-sm font-bold border border-white dark:border-gray-800`}>
                                    {count > 0 ? (
                                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-sm">
                                            {count}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheckIcon className="h-6 w-6 text-accent-emerald" />
                        Risk & Compliance Ledger
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Proactive risk identification for the <strong>{initiative.sector}</strong> sector.
                    </p>
                </div>
                <Button onClick={handleGenerateRisks} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Run Risk Detective'}
                </Button>
            </div>

            {error && <p className="text-accent-red text-sm">{error}</p>}

            {(risks || []).length === 0 && !isLoading && (
                 <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Risks Logged</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Run the Risk Detective to identify potential threats.</p>
                </div>
            )}

            {(risks || []).length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Register</h3>
                         {(risks || []).map(risk => {
                             const level = getRiskLevel(risk.probability, risk.impact);
                             return (
                                 <div key={risk.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-gray-300 dark:border-gray-600 hover:shadow-md transition-shadow">
                                     <div className="flex justify-between items-start mb-2">
                                         <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{risk.category}</span>
                                         <span className={`text-xs font-bold px-2 py-0.5 rounded ${level.bg} ${level.text}`}>{level.label}</span>
                                     </div>
                                     <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{risk.description}</h4>
                                     <p className="text-sm text-gray-600 dark:text-gray-400">
                                         <span className="font-semibold text-accent-purple dark:text-accent-purple/90">Mitigation: </span>
                                         {risk.mitigationStrategy}
                                     </p>
                                 </div>
                             );
                         })}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Heatmap</h3>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                            {renderHeatmap()}
                            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                                Grid shows count of risks. <br/> Top-Right is Critical (High Prob/High Impact).
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
