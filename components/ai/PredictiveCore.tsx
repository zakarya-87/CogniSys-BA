
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
    const [activeTab, setActiveTab] = useState<'Simulation' | 'Sensitivity' | 'Ethics' | 'Advisor'>('Advisor');
    const [isLoading, setIsLoading] = useState(false);
    
    // Advisor State
    const [phaseAdvice, setPhaseAdvice] = useState<string | null>(null);
    const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState('THINK');
    
    // Sim State
    const [simVariables, setSimVariables] = useState('Development Time, QA Bugs, Vendor Delay');
    const [mcResult, setMcResult] = useState<TMonteCarloResult | null>(null);

    // Tornado State
    const [tornadoGoal, setTornadoGoal] = useState('Project Duration');
    const [tornadoResult, setTornadoResult] = useState<TTornadoItem[]>([]);
    const [optimization, setOptimization] = useState<string | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Ethics State
    const [ethicalResult, setEthicalResult] = useState<TEthicalCheck | null>(null);
    const [mitigationStrategy, setMitigationStrategy] = useState<string | null>(null);

    const runMonteCarlo = async () => {
        setIsLoading(true);
        try {
            const res = await generateMonteCarloSimulation(simVariables, 1000, initiative.sector);
            setMcResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const runTornado = async () => {
        setIsLoading(true);
        setOptimization(null);
        try {
            const vars = simVariables.split(',').map(s => s.trim());
            const res = await generateTornadoAnalysis(tornadoGoal, vars, initiative.sector);
            setTornadoResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const runEthics = async () => {
        setIsLoading(true);
        setMitigationStrategy(null);
        try {
            const context = `Title: ${initiative.title}. Desc: ${initiative.description}. Features: ${JSON.stringify(initiative.artifacts?.prioritization || [])}`;
            const res = await runEthicalCheck(context, initiative.sector);
            setEthicalResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateMitigation = async () => {
        if (!ethicalResult) return;
        setIsLoading(true);
        try {
            const context = `Title: ${initiative.title}. Desc: ${initiative.description}. Features: ${JSON.stringify(initiative.artifacts?.prioritization || [])}`;
            const mitigation = await mitigateEthicalRisk(context, ethicalResult.biasRisks, initiative.sector);
            setMitigationStrategy(mitigation);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePhaseAdvice = async (phase: string) => {
        setIsGeneratingAdvice(true);
        setSelectedPhase(phase);
        try {
            const advice = await generatePhaseAdvice(initiative, phase);
            setPhaseAdvice(advice);
        } catch (e) { console.error(e); } finally { setIsGeneratingAdvice(false); }
    };

    const handleOptimize = async () => {
        if (activeTab === 'Simulation' && mcResult) {
            setIsOptimizing(true);
            try {
                const context = `Monte Carlo results (P10: ${mcResult.p10}, Mean: ${mcResult.mean}, P90: ${mcResult.p90})`;
                const advice = await generateOptimizationAdvice(context, initiative.sector);
                setOptimization(advice);
            } catch (e) { console.error(e); } finally { setIsOptimizing(false); }
        } else if (activeTab === 'Sensitivity' && tornadoResult.length > 0) {
            setIsOptimizing(true);
            try {
                const context = `Sensitivity analysis (Top Driver: ${tornadoResult[0].variable})`;
                const advice = await generateOptimizationAdvice(context, initiative.sector);
                setOptimization(advice);
            } catch (e) { console.error(e); } finally { setIsOptimizing(false); }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="h-7 w-7 text-accent-cyan" />
                        Predictive Core v2.1
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Simulation, Optimization, and Ethical Governance Engine.
                    </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex space-x-1">
                    <button 
                        onClick={() => setActiveTab('Advisor')} 
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'Advisor' ? 'bg-white dark:bg-gray-600 shadow text-accent-purple dark:text-accent-cyan' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Strategic Advisor
                    </button>
                    <button 
                        onClick={() => setActiveTab('Simulation')} 
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'Simulation' ? 'bg-white dark:bg-gray-600 shadow text-accent-purple dark:text-accent-cyan' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Monte Carlo
                    </button>
                    <button 
                        onClick={() => setActiveTab('Sensitivity')} 
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'Sensitivity' ? 'bg-white dark:bg-gray-600 shadow text-accent-purple dark:text-accent-cyan' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Sensitivity
                    </button>
                    <button 
                        onClick={() => setActiveTab('Ethics')} 
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'Ethics' ? 'bg-white dark:bg-gray-600 shadow text-accent-purple dark:text-accent-cyan' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Ethical Guardian
                    </button>
                </div>
            </div>

            {/* ADVISOR TAB */}
            {activeTab === 'Advisor' && (
                <div className="flex-grow flex flex-col gap-6 animate-fade-in-down">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { name: 'THINK', icon: <Brain className="w-5 h-5" />, color: 'text-accent-cyan', bgColor: 'bg-accent-cyan/10' },
                            { name: 'PLAN', icon: <ClipboardList className="w-5 h-5" />, color: 'text-accent-amber', bgColor: 'bg-accent-amber/10' },
                            { name: 'ACT', icon: <Rocket className="w-5 h-5" />, color: 'text-accent-emerald', bgColor: 'bg-accent-emerald/10' }
                        ].map(phase => (
                            <button
                                key={phase.name}
                                onClick={() => handleGeneratePhaseAdvice(phase.name)}
                                disabled={isGeneratingAdvice}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                                    selectedPhase === phase.name
                                        ? 'border-accent-cyan bg-white dark:bg-gray-800 shadow-md'
                                        : 'border-transparent bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <div className={`p-3 rounded-full mb-2 ${phase.bgColor} ${phase.color}`}>
                                    {phase.icon}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest">{phase.name} Advice</span>
                            </button>
                        ))}
                    </div>

                    {isGeneratingAdvice ? (
                        <div className="flex-grow flex flex-col items-center justify-center">
                            <Spinner className="h-10 w-10 mb-4" />
                            <p className="text-sm text-gray-500 animate-pulse">Consulting BABOK v3 Knowledge Base...</p>
                        </div>
                    ) : phaseAdvice ? (
                        <div className="flex-grow bg-surface-dark dark:bg-surface-darker border border-border-dark dark:border-border-dark rounded-xl p-6 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2 mb-4 text-accent-cyan dark:text-accent-cyan font-bold uppercase tracking-widest text-xs">
                                <SparklesIcon className="h-4 w-4" />
                                {selectedPhase} Strategic Guidance
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{phaseAdvice}</ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                            <LightBulbIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-sm">Select a phase to receive AI-driven strategic advice.</p>
                        </div>
                    )}
                </div>
            )}

            {/* MONTE CARLO TAB */}
            {activeTab === 'Simulation' && (
                <div className="flex-grow flex flex-col gap-6 animate-fade-in-down">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Variables to Simulate (Comma Sep)</label>
                        <div className="flex gap-4">
                            <input 
                                type="text" 
                                value={simVariables}
                                onChange={(e) => setSimVariables(e.target.value)}
                                className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            />
                            <Button onClick={runMonteCarlo} disabled={isLoading}>
                                {isLoading ? <Spinner /> : 'Run Simulation'}
                            </Button>
                        </div>
                    </div>
                    
                    {mcResult ? (
                        <div className="flex-grow space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 dark:text-white text-center flex-grow">Probability Distribution: {mcResult.recommendation}</h3>
                                <button 
                                    onClick={handleOptimize}
                                    disabled={isOptimizing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple/5 dark:bg-accent-purple/10 text-accent-purple dark:text-accent-purple/90 rounded-lg text-xs font-bold hover:bg-accent-purple/10 dark:hover:bg-accent-purple/20 transition-colors border border-accent-purple/10 dark:border-accent-purple/20"
                                >
                                    {isOptimizing ? <Spinner className="h-3 w-3" /> : <SparklesIcon className="h-3 w-3" />}
                                    Optimize Outcome
                                </button>
                            </div>
                            <MonteCarloVisualizer data={mcResult} />
                            
                            {optimization && (
                                <div className="bg-accent-purple/5 dark:bg-accent-purple/10 border border-accent-purple/10 dark:border-accent-purple/20 rounded-xl p-6 relative animate-fade-in">
                                    <button onClick={() => setOptimization(null)} className="absolute top-4 right-4 text-accent-purple/60 hover:text-accent-purple"><XMarkIcon className="h-5 w-5" /></button>
                                    <h4 className="font-bold text-accent-purple dark:text-accent-purple/90 mb-3 flex items-center gap-2">
                                        <SparklesIcon className="h-5 w-5 text-accent-purple" />
                                        Strategic Optimization Roadmap
                                    </h4>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                                        <ReactMarkdown>{optimization}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-accent-purple/5 dark:bg-accent-purple/10 rounded text-sm text-gray-700 dark:text-gray-300 border border-accent-purple/10">
                                <strong>AI Insight:</strong> Based on {mcResult.iterations} iterations, the most likely outcome is {mcResult.mean}. There is a 10% chance it could be as low as {mcResult.p10} (Best Case) and a 10% chance it could exceed {mcResult.p90} (Worst Case).
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                            <ChartBarIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p>Configure variables to run a predictive simulation.</p>
                        </div>
                    )}
                </div>
            )}

            {/* SENSITIVITY TAB */}
            {activeTab === 'Sensitivity' && (
                <div className="flex-grow flex flex-col gap-6 animate-fade-in-down">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex gap-4 items-end">
                        <div className="flex-grow">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Metric</label>
                             <input 
                                type="text" 
                                value={tornadoGoal}
                                onChange={(e) => setTornadoGoal(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            />
                        </div>
                        <Button onClick={runTornado} disabled={isLoading}>
                            {isLoading ? <Spinner /> : 'Analyze Impact'}
                        </Button>
                    </div>

                    {tornadoResult.length > 0 ? (
                        <div className="flex-grow space-y-6">
                             <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 dark:text-white text-center flex-grow">Sensitivity Analysis (Tornado Diagram)</h3>
                                <button 
                                    onClick={handleOptimize}
                                    disabled={isOptimizing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple/5 dark:bg-accent-purple/10 text-accent-purple dark:text-accent-purple/90 rounded-lg text-xs font-bold hover:bg-accent-purple/10 dark:hover:bg-accent-purple/20 transition-colors border border-accent-purple/10 dark:border-accent-purple/20"
                                >
                                    {isOptimizing ? <Spinner className="h-3 w-3" /> : <SparklesIcon className="h-3 w-3" />}
                                    Analyze Sensitivity
                                </button>
                            </div>
                             <TornadoVisualizer items={tornadoResult} />

                             {optimization && (
                                <div className="bg-accent-purple/5 dark:bg-accent-purple/10 border border-accent-purple/10 dark:border-accent-purple/20 rounded-xl p-6 relative animate-fade-in">
                                    <button onClick={() => setOptimization(null)} className="absolute top-4 right-4 text-accent-purple/60 hover:text-accent-purple"><XMarkIcon className="h-5 w-5" /></button>
                                    <h4 className="font-bold text-accent-purple dark:text-accent-purple/90 mb-3 flex items-center gap-2">
                                        <SparklesIcon className="h-5 w-5 text-accent-purple" />
                                        Uncertainty Mitigation Strategy
                                    </h4>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                                        <ReactMarkdown>{optimization}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                         <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                            <AdjustmentsHorizontalIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p>Identify which variables drive the most uncertainty.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ETHICS TAB */}
            {activeTab === 'Ethics' && (
                <div className="flex-grow flex flex-col gap-6 animate-fade-in-down">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white">Ethical AI & Bias Guardian</h3>
                            <p className="text-sm text-gray-500">Scan project artifacts for potential bias, fairness issues, and privacy risks.</p>
                        </div>
                        <Button onClick={runEthics} disabled={isLoading} className="bg-accent-emerald hover:bg-accent-emerald/80">
                            {isLoading ? <Spinner /> : 'Run Ethics Audit'}
                        </Button>
                    </div>

                    {ethicalResult ? (
                        <div className="space-y-6">
                            <div className="flex gap-6">
                                <div className="text-center p-4 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-gray-500 uppercase font-bold">Ethics Score</div>
                                    <div className={`text-4xl font-black ${ethicalResult.score > 80 ? 'text-accent-emerald' : 'text-accent-red'}`}>{ethicalResult.score}</div>
                                </div>
                                <div className="flex-grow p-4 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">Verdict: {ethicalResult.verdict}</div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{ethicalResult.summary}</p>
                                </div>
                            </div>
                            
                            {!mitigationStrategy ? (
                                <Button onClick={handleGenerateMitigation} disabled={isLoading} className="w-full bg-accent-purple hover:bg-accent-purple/80 text-white">
                                    {isLoading ? <Spinner /> : (
                                        <span className="flex items-center justify-center gap-2">
                                            <LightBulbIcon className="h-5 w-5" />
                                            Generate AI Mitigation Strategy
                                        </span>
                                    )}
                                </Button>
                            ) : (
                                <div className="bg-accent-purple/5 dark:bg-accent-purple/10 border border-accent-purple/10 dark:border-accent-purple/20 rounded-xl p-6 relative animate-fade-in">
                                    <button 
                                        onClick={() => setMitigationStrategy(null)}
                                        className="absolute top-4 right-4 text-accent-purple/60 hover:text-accent-purple transition-colors"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-accent-purple/10 dark:bg-accent-purple/20 rounded-lg">
                                            <ShieldCheckIcon className="h-6 w-6 text-accent-purple" />
                                        </div>
                                        <h4 className="font-bold text-accent-purple dark:text-accent-purple/90">AI-Powered Mitigation Roadmap</h4>
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                                        <ReactMarkdown>{mitigationStrategy}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-accent-red/5 dark:bg-accent-red/10 p-4 rounded-lg border border-accent-red/10 dark:border-accent-red/20">
                                    <h4 className="font-bold text-accent-red dark:text-accent-red/80 mb-3 flex items-center gap-2">
                                        <ScaleIcon className="h-5 w-5"/> Bias Risks
                                    </h4>
                                    <ul className="space-y-3">
                                        {(ethicalResult.biasRisks || []).map((risk, i) => (
                                            <li key={i} className="text-sm">
                                                <span className="font-bold block text-accent-red/90 dark:text-accent-red/80">{risk.risk}</span>
                                                <span className="text-gray-600 dark:text-gray-400 text-xs">Mitigation: {risk.mitigation}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-accent-amber/5 dark:bg-accent-amber/10 p-4 rounded-lg border border-accent-amber/10 dark:border-accent-amber/20">
                                    <h4 className="font-bold text-accent-amber dark:text-accent-amber/80 mb-3">Privacy & Data Concerns</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                        {(ethicalResult.privacyConcerns || []).map((conc, i) => (
                                            <li key={i}>{conc}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                            <ScaleIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p>No audit results available.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
