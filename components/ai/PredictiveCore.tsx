
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { TInitiative, TMonteCarloResult, TTornadoItem, TEthicalCheck } from '../../types';
import { 
    generateMonteCarloSimulation, 
    generateTornadoAnalysis, 
    runEthicalCheck, 
    mitigateEthicalRisk,
    generatePhaseAdvice,
    generateOptimizationAdvice
} from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { MonteCarloVisualizer, TornadoVisualizer } from '../ui/Charts';
import { ShieldCheckIcon, LightBulbIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Brain, ClipboardList, Rocket } from 'lucide-react';

interface PredictiveCoreProps {
    initiative: TInitiative;
}

const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>;
const AdjustmentsHorizontalIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>;

export const PredictiveCore: React.FC<PredictiveCoreProps> = ({ initiative }) => {
    const [activeTab, setActiveTab] = useState<'Simulation' | 'Sensitivity' | 'Ethics' | 'Advisor'>('Simulation');
    const [scenario, setScenario] = useState<'Optimistic' | 'Neutral' | 'Pessimistic'>('Neutral');
    const [isLoading, setIsLoading] = useState(false);
    
    // Advisor State
    const [phaseAdvice, setPhaseAdvice] = useState<string | null>(null);
    const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState('THINK');
    
    // Results
    const [optimization, setOptimization] = useState<string | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [ethicalResult, setEthicalResult] = useState<TEthicalCheck | null>(null);
    const [mitigationStrategy, setMitigationStrategy] = useState<string | null>(null);

    // --- Stochastic Math Utils ---
    const sampleTriangular = (min: number, likely: number, max: number): number => {
        const u = Math.random();
        const fc = (likely - min) / (max - min);
        if (u < fc) return min + Math.sqrt(u * (max - min) * (likely - min));
        return max - Math.sqrt((1 - u) * (max - min) * (max - likely));
    };

    // --- Simulation Logic (Monte Carlo) ---
    const mcResult = useMemo((): TMonteCarloResult | null => {
        const estimates = (initiative.artifacts?.estimation?.items || []) as TEstimationItem[];
        if (!estimates || estimates.length === 0) return null;

        const iterations = 10000;
        const results: number[] = [];

        const getScenariodLikely = (min: number, likely: number, max: number) => {
            if (scenario === 'Optimistic') return Math.max(min, likely - (likely - min) * 0.2);
            if (scenario === 'Pessimistic') return Math.min(max, likely + (max - likely) * 0.3);
            return likely;
        };

        for (let i = 0; i < iterations; i++) {
            let total = 0;
            for (const item of estimates) {
                const sLikely = getScenariodLikely(item.optimistic, item.mostLikely, item.pessimistic);
                total += sampleTriangular(item.optimistic, sLikely, item.pessimistic);
            }
            results.push(total);
        }

        results.sort((a, b) => a - b);
        
        const mean = results.reduce((a, b) => a + b, 0) / iterations;
        const p10 = results[Math.floor(iterations * 0.1)];
        const p50 = results[Math.floor(iterations * 0.5)];
        const p90 = results[Math.floor(iterations * 0.9)];

        const minVal = results[0];
        const maxVal = results[results.length - 1];
        const range = maxVal - minVal;
        const bucketCount = 20;
        const bucketSize = range / bucketCount;
        const buckets = Array.from({ length: bucketCount }).map((_, i) => {
            const low = minVal + i * bucketSize;
            const high = low + bucketSize;
            const count = results.filter(r => r >= low && r < high).length;
            return {
                range: `${Math.round(low)}-${Math.round(high)}`,
                heightPercent: (count / iterations) * 100
            };
        });

        return {
            iterations,
            mean: parseFloat(mean.toFixed(1)),
            p10: parseFloat(p10.toFixed(1)),
            p50: parseFloat(p50.toFixed(1)),
            p90: parseFloat(p90.toFixed(1)),
            buckets,
            recommendation: scenario === 'Pessimistic' ? "High Risk Buffer Recommended" : 
                           scenario === 'Optimistic' ? "Aggressive Timeline Possible" : 
                           "Standard Delivery Confidence"
        };
    }, [initiative.artifacts?.estimation, scenario, initiative.id]);

    // --- Sensitivity Logic (Tornado) ---
    const tornadoResult = useMemo((): TTornadoItem[] => {
        const risks = (initiative.artifacts?.risks || []) as TRisk[];
        const baseEstimate = mcResult?.mean || 0;

        if (!risks || risks.length === 0 || baseEstimate === 0) return [];

        const projectComplexityMultiplier = (baseEstimate * 0.05);

        return risks.map(risk => {
            const prob = risk.probability || 3;
            const impact = risk.impact || 3;
            const variance = (prob / 5) * Math.pow(impact, 1.5) * projectComplexityMultiplier;
            
            return {
                variable: risk.description.length > 30 ? risk.description.substring(0, 30) + '...' : risk.description,
                base: baseEstimate,
                impactLow: parseFloat((baseEstimate - variance * 0.2).toFixed(1)),
                impactHigh: parseFloat((baseEstimate + variance).toFixed(1))
            };
        }).sort((a,b) => (b.impactHigh - b.base) - (a.impactHigh - a.base)).slice(0, 6);
    }, [initiative.artifacts?.risks, mcResult?.mean]);

    const handleGenerateAdvice = async (phase: string) => {
        setIsGeneratingAdvice(true);
        setSelectedPhase(phase);
        try {
            const advice = await generatePhaseAdvice(initiative, phase);
            setPhaseAdvice(advice);
        } catch (e) { console.error(e); } finally { setIsGeneratingAdvice(false); }
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        try {
            const context = activeTab === 'Simulation' 
                ? `Monte Carlo results (P10: ${mcResult?.p10}, P90: ${mcResult?.p90}). Scenario: ${scenario}`
                : `Top Sensitivity Driver: ${tornadoResult[0]?.variable}`;
            const advice = await generateOptimizationAdvice(context, initiative.sector);
            setOptimization(advice);
        } catch (e) { console.error(e); } finally { setIsOptimizing(false); }
    };

    const runEthics = async () => {
        setIsLoading(true);
        setMitigationStrategy(null);
        try {
            const context = `Title: ${initiative.title}. Desc: ${initiative.description}. Estimates: ${JSON.stringify(initiative.artifacts?.estimation || {})}`;
            const res = await runEthicalCheck(context, initiative.sector);
            setEthicalResult(res);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl h-full flex flex-col border border-border-light dark:border-border-dark overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Activity className="h-7 w-7 text-accent-cyan animate-pulse" />
                        Predictive Core <span className="text-accent-cyan/50 font-light">v2.5</span>
                    </h2>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
                        High-fidelity stochastic simulation and risk exposure engine.
                    </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-xl flex space-x-1 border border-border-light dark:border-border-dark font-sans">
                    {[
                        { id: 'Simulation', icon: <BarChart3 className="w-4 h-4" />, label: 'Monte Carlo' },
                        { id: 'Sensitivity', icon: <Target className="w-4 h-4" />, label: 'Sensitivity' },
                        { id: 'Ethics', icon: <ShieldAlert className="w-4 h-4" />, label: 'Guardian' },
                        { id: 'Advisor', icon: <LightBulbIcon className="w-4 h-4" />, label: 'AI Advisor' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 shadow-md text-accent-cyan scale-105' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800'}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'Simulation' && (
                <div className="flex-grow flex flex-col gap-8 fade-in slide-up">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-accent-cyan/5 dark:bg-accent-cyan/10 border border-accent-cyan/20 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <BarChart3 className="h-24 w-24 text-accent-cyan" />
                        </div>
                        <div className="relative z-10 w-full md:w-auto">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-cyan mb-3">Target Simulation Scenario</p>
                            <div className="flex gap-2">
                                {['Optimistic', 'Neutral', 'Pessimistic'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setScenario(s as any)}
                                        className={`px-5 py-2 rounded-xl text-[11px] font-black transition-all border-2 ${
                                            scenario === s 
                                            ? 'bg-accent-cyan text-white border-accent-cyan shadow-lg shadow-accent-cyan/30' 
                                            : 'bg-white/50 dark:bg-gray-900/30 border-transparent hover:border-accent-cyan/20'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-8 items-center bg-white/40 dark:bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">P10 Confidence</p>
                                <p className="text-lg font-black text-emerald-500 tabular-nums">{mcResult?.p10}h</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 opacity-50" />
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Expected P50</p>
                                <p className="text-xl font-black text-accent-cyan tabular-nums">{mcResult?.p50}h</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 opacity-50" />
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">P90 Exposure</p>
                                <p className="text-lg font-black text-accent-red tabular-nums">{mcResult?.p90}h</p>
                            </div>
                        </div>
                    </div>

                    {mcResult ? (
                        <div className="flex-grow flex flex-col gap-6">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Probability Distribution (10k Iterations)</h3>
                                <Button 
                                    onClick={handleOptimize} 
                                    className="bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/20 px-3 py-1.5 h-auto rounded-lg text-[9px] font-black uppercase tracking-widest"
                                >
                                    {isOptimizing ? <Spinner className="h-3 w-3" /> : <SparklesIcon className="h-3 w-3 mr-1.5" />}
                                    Optimize Outcome
                                </Button>
                            </div>
                            
                            <div className="flex-grow min-h-[320px]">
                                <MonteCarloVisualizer data={mcResult} />
                            </div>

                            {optimization && (
                                <div className="p-5 bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl relative animate-in zoom-in-95 shadow-sm">
                                    <button onClick={() => setOptimization(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><XMarkIcon className="h-5 w-5"/></button>
                                    <div className="flex items-center gap-2 text-accent-cyan font-black mb-3 uppercase tracking-widest text-[10px]">
                                        <SparklesIcon className="h-4 w-4" /> AI Strategic Guidance
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                                        <ReactMarkdown>{optimization}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-border-light dark:border-border-dark rounded-3xl p-12">
                             <Activity className="h-16 w-16 mb-4 opacity-10" />
                             <p className="text-sm font-bold text-gray-500">Awaiting Estimation Data</p>
                             <p className="text-xs text-gray-400 mt-2 text-center max-w-xs leading-relaxed">Please generate an estimation report in the Estimation Engine to run the predictive simulation.</p>
                        </div>
                    )}
                </div>
            )}

            {/* SENSITIVITY TAB */}
            {activeTab === 'Sensitivity' && (
                <div className="flex-grow flex flex-col gap-8 fade-in slide-up">
                    <div className="p-6 bg-accent-purple/5 dark:bg-accent-purple/10 border border-accent-purple/20 rounded-2xl relative overflow-hidden group">
                         <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                             <Target className="h-20 w-20 text-accent-purple" />
                         </div>
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-purple mb-2">Sensitivity Analysis (Tornado)</h3>
                         <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed max-w-lg">
                             Isolating the critical path drivers through non-linear risk mapping. This model emphasizes high-impact outliers to prevent "black swan" project failure.
                         </p>
                    </div>

                    {tornadoResult.length > 0 ? (
                        <div className="flex-grow flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variable Impact vs Base Projection</span>
                                <Button 
                                    onClick={handleOptimize} 
                                    className="bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple border border-accent-purple/20 px-3 py-1.5 h-auto rounded-lg text-[9px] font-black uppercase tracking-widest"
                                >
                                    {isOptimizing ? <Spinner className="h-3 w-3" /> : <SparklesIcon className="h-3 w-3 mr-1.5" />}
                                    Identify Mitigation
                                </Button>
                            </div>
                            
                            <div className="flex-grow">
                                <TornadoVisualizer items={tornadoResult} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-2xl shadow-sm border-l-4 border-l-accent-red fade-in">
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Critical Driver</div>
                                    <div className="text-xl font-black text-accent-red tabular-nums">+{Math.round(tornadoResult[0].impactHigh - tornadoResult[0].base)}h</div>
                                    <div className="text-[10px] text-gray-400 truncate mt-1">{tornadoResult[0].variable}</div>
                                </div>
                                <div className="p-5 bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-2xl shadow-sm border-l-4 border-l-accent-cyan">
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Expected Buffer</div>
                                    <div className="text-xl font-black text-accent-cyan tabular-nums">+{Math.round((mcResult?.p90 || 0) - (mcResult?.p50 || 0))}h</div>
                                    <div className="text-[10px] text-gray-400 mt-1">90% Confidence Interval</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-border-light dark:border-border-dark rounded-3xl p-12">
                             <Target className="h-16 w-16 mb-4 opacity-10" />
                             <p className="text-sm font-bold text-gray-500">Risk Exposure Undefined</p>
                             <p className="text-xs text-gray-400 mt-2 text-center max-w-xs leading-relaxed">No project risks detected. Log risks in the Risk Ledger to analyze timeline sensitivity drivers.</p>
                        </div>
                    )}
                </div>
            )}

            {/* GUARDIAN & ADVISOR (Placeholders) */}
            {(activeTab === 'Ethics' || activeTab === 'Advisor') && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-12 text-center border-2 border-dashed border-border-light dark:border-border-dark rounded-3xl">
                    <ShieldCheckIcon className="h-16 w-16 mb-6 opacity-10 text-accent-emerald" />
                    <h4 className="font-black text-gray-500 dark:text-gray-300 mb-3 uppercase tracking-widest text-sm">Contextual Lock Active</h4>
                    <p className="text-xs max-w-xs leading-relaxed text-gray-400">This module requires deep requirements context. Complete the Elicitation and SWOT phases to unlock automated oversight.</p>
                    <button 
                        onClick={() => setActiveTab('Simulation')} 
                        className="mt-8 px-6 py-2 bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                        Back to Statistics
                    </button>
                </div>
            )}
        </div>
    );
};
