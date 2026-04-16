import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
    Activity,
    Target, 
    ShieldAlert, 
    BarChart3, 
    Brain, 
    Sparkles, 
    X,
    MousePointer2,
    Maximize2,
    RotateCcw,
    Zap,
    TrendingUp,
    ShieldCheck,
    AlertTriangle,
    Rocket,
    CheckCircle2
} from 'lucide-react';
import { TInitiative, TMonteCarloResult, TTornadoItem, TEthicalCheck, TEstimationItem, TRisk } from '../../types';
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
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface PredictiveCoreProps {
    initiative: TInitiative;
}

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

    const tabs = [
        { id: 'Simulation', icon: <BarChart3 />, label: 'Monte Carlo' },
        { id: 'Sensitivity', icon: <Target />, label: 'Sensitivity' },
        { id: 'Ethics', icon: <ShieldAlert />, label: 'Guardian' },
        { id: 'Advisor', icon: <Brain />, label: 'AI Advisor' }
    ];

    return (
        <div className="h-full flex flex-col space-y-8 animate-fade-in p-2">
            <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 pb-6 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-accent-cyan/20 rounded-xl border border-accent-cyan/30">
                            <Activity className="h-6 w-6 text-accent-cyan" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Predictive Core</h2>
                    </div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-[0.2em]">High-Fidelity Stochastic Synthesis & Risk Exposure Engine</p>
                </div>
                
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 gap-1 shadow-inner backdrop-blur-xl flex-wrap">
                    {tabs.map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-accent-cyan text-black shadow-lg' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {React.cloneElement(tab.icon as React.ReactElement, { className: 'h-3.5 w-3.5' })}
                                {tab.label}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                {activeTab === 'Simulation' && (
                    <div className="space-y-8 slide-up">
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-cyan mb-6 italic">Target Simulation Scenario</p>
                                    <div className="flex gap-3">
                                        {['Optimistic', 'Neutral', 'Pessimistic'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setScenario(s as any)}
                                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                                    scenario === s 
                                                    ? 'bg-accent-cyan text-black border-accent-cyan shadow-lg shadow-accent-cyan/20' 
                                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-accent-cyan/30 hover:text-white'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center bg-black/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                                <div className="px-6 border-r border-white/5">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">P10 Low</p>
                                    <p className="text-2xl font-black text-emerald-400 italic tabular-nums">{mcResult?.p10}h</p>
                                </div>
                                <div className="px-6 border-r border-white/5">
                                    <p className="text-[9px] font-black text-accent-cyan uppercase tracking-widest mb-1 italic">Expected P50</p>
                                    <p className="text-3xl font-black text-white italic tabular-nums">{mcResult?.p50}h</p>
                                </div>
                                <div className="px-6">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">P90 Exposure</p>
                                    <p className="text-2xl font-black text-accent-red italic tabular-nums">{mcResult?.p90}h</p>
                                </div>
                            </div>
                        </div>

                        {mcResult ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-4">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 className="h-4 w-4 text-accent-cyan" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Stochastic Variance Map <span className="text-gray-600 font-medium ml-2">10k Iterations</span></h3>
                                    </div>
                                    <button onClick={handleOptimize} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-accent-cyan uppercase tracking-widest hover:bg-accent-cyan hover:text-black transition-all flex items-center gap-2">
                                        {isOptimizing ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                        Optimize Yield
                                    </button>
                                </div>
                                
                                <div className="p-8 bg-black/40 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                                    <MonteCarloVisualizer data={mcResult} />
                                </div>

                                {optimization && (
                                    <div className="relative group p-8 bg-accent-cyan/[0.03] border border-accent-cyan/10 rounded-[2.5rem] slide-up">
                                        <div className="absolute top-4 right-6">
                                            <button onClick={() => setOptimization(null)} className="text-gray-600 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                                        </div>
                                        <div className="flex items-center gap-3 mb-4 text-accent-cyan font-black uppercase tracking-widest text-[10px]">
                                            <Sparkles className="h-4 w-4" /> Predictive Optimization Advice
                                        </div>
                                        <div className="text-sm font-medium text-gray-300 leading-relaxed max-h-[300px] overflow-auto custom-scrollbar">
                                            <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                                                {optimization}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] text-center p-20">
                                <Activity className="h-16 w-16 mb-6 text-white/5 animate-pulse" />
                                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Awaiting Estimation Stream</p>
                                <p className="text-[10px] text-gray-600 mt-2 max-w-xs leading-relaxed uppercase tracking-wider">Initialize fiscal estimations to activate stochastic modelling core.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Sensitivity' && (
                    <div className="space-y-8 slide-up">
                        <div className="p-10 bg-accent-purple/5 border border-accent-purple/10 rounded-[3rem] relative overflow-hidden group">
                             <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                                 <Target className="h-24 w-24 text-accent-purple" />
                             </div>
                             <h3 className="text-xs font-black uppercase tracking-[0.4em] text-accent-purple mb-4">Sensitivity Decomposition (Tornado)</h3>
                             <p className="text-sm text-gray-400 leading-relaxed max-w-2xl font-medium">
                                 Isolating the critical path drivers through non-linear risk mapping. This model captures high-impact outliers to neutralize structural volatility.
                             </p>
                        </div>

                        {tornadoResult.length > 0 ? (
                            <div className="space-y-8">
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Impact Variance vs Base Synthesis</span>
                                    <button onClick={handleOptimize} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-accent-purple uppercase tracking-widest hover:bg-accent-purple hover:text-white transition-all flex items-center gap-2">
                                        {isOptimizing ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                        Isolate Mitigations
                                    </button>
                                </div>
                                
                                <div className="p-8 bg-black/40 rounded-[3rem] border border-white/5 overflow-hidden">
                                    <TornadoVisualizer items={tornadoResult} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-8 bg-white/[0.03] border-l-4 border-l-accent-red border border-white/5 rounded-2xl relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-accent-red opacity-[0.02]" />
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">High-Grip Sensitivity Driver</div>
                                        <div className="text-3xl font-black text-accent-red italic tabular-nums tracking-tighter">+{Math.round(tornadoResult[0].impactHigh - tornadoResult[0].base)}h</div>
                                        <div className="text-[11px] font-bold text-white/60 truncate mt-2 uppercase">{tornadoResult[0].variable}</div>
                                    </div>
                                    <div className="p-8 bg-white/[0.03] border-l-4 border-l-accent-cyan border border-white/5 rounded-2xl relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-accent-cyan opacity-[0.02]" />
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Stochastic Variance Buffer</div>
                                        <div className="text-3xl font-black text-accent-cyan italic tabular-nums tracking-tighter">+{Math.round((mcResult?.p90 || 0) - (mcResult?.p50 || 0))}h</div>
                                        <div className="text-[11px] font-bold text-white/60 mt-2 uppercase">90% Confidence Interval Delta</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] text-center p-20">
                                 <Target className="h-16 w-16 mb-6 text-white/5" />
                                 <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Risk Signal Dormant</p>
                                 <p className="text-[10px] text-gray-600 mt-2 max-w-xs uppercase tracking-wider leading-relaxed">Populate the risk matrix to analyze path-dependency sensitivity.</p>
                            </div>
                        )}
                    </div>
                )}

                {(activeTab === 'Ethics' || activeTab === 'Advisor') && (
                    <div className="h-[500px] flex flex-col items-center justify-center text-center p-20 slide-up">
                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mb-8 rotate-12">
                            <ShieldCheck className="h-10 w-10 text-accent-emerald opacity-20" />
                        </div>
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-3">Contextual Oversight Locked</h4>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest max-w-sm leading-relaxed mb-10">This autonomous module requires depth in elicitation and synthesis artifacts. Finalize the SWOT and Stakeholder maps to activate.</p>
                        <button 
                            onClick={() => setActiveTab('Simulation')} 
                            className="px-8 py-3 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all"
                        >
                            Return to Statistical Core
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

