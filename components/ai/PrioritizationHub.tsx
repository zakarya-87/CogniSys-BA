import React, { useState, useEffect } from 'react';
import { TInitiative, TPrioritizationAnalysis } from '../../types';
import { prioritizeBacklog, suggestFeatures } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';
import { 
    ScatterChart, 
    Scatter, 
    XAxis, 
    YAxis, 
    ZAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Label, 
    ReferenceLine,
    Cell
} from 'recharts';
import { 
    Zap, 
    BarChart3, 
    Sparkles, 
    ChevronRight, 
    Target, 
    Flame, 
    ShieldCheck, 
    Trophy,
    Dices,
    Activity,
    BrainCircuit
} from 'lucide-react';

interface PrioritizationHubProps {
    initiative: TInitiative;
}

const moscowStyles: Record<string, string> = {
    'Must Have': 'bg-accent-red/10 border-accent-red/30 text-accent-red shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    'Should Have': 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    'Could Have': 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    'Won\'t Have': 'bg-white/5 border-white/10 text-gray-500',
};

const kanoStyles: Record<string, string> = {
    'Basic': 'from-accent-purple/20 to-accent-purple/5 border-accent-purple/30 text-accent-purple',
    'Performance': 'from-accent-teal/20 to-accent-teal/5 border-accent-teal/30 text-accent-teal',
    'Delighter': 'from-accent-pink/20 to-accent-pink/5 border-accent-pink/30 text-accent-pink',
};

export const PrioritizationHub: React.FC<PrioritizationHubProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [features, setFeatures] = useState('Centralized Risk Registry, Predictive Impact Analysis, Automated Compliance Drift, Multi-dimensional Stakeholder Maps, NLP Document Extraction');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TPrioritizationAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [activeTab, setActiveTab] = useState<'MoSCoW' | 'RICE' | 'Kano' | 'Matrix'>('MoSCoW');

    useEffect(() => {
        if (initiative.artifacts?.prioritization) {
            setAnalysis(initiative.artifacts.prioritization);
        }
    }, [initiative.id, initiative.artifacts]);

    const handlePrioritize = async () => {
        if (!features.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const featureList = features.split(',').map(f => f.trim()).filter(f => f);
            const result = await prioritizeBacklog(featureList, initiative.sector);
            setAnalysis(result);
            saveArtifact(initiative.id, 'prioritization', result);
        } catch (error) {
            console.error(error);
            setError("Analysis link offline. Verification required.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestFeatures = async () => {
        setIsSuggesting(true);
        setError(null);
        try {
            const suggested = await suggestFeatures(initiative);
            setFeatures(suggested.join(', '));
        } catch (error) {
            console.error(error);
            setError("Discovery engine failed.");
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-8 animate-fade-in p-2">
            <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 pb-6 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-accent-purple/20 rounded-xl">
                            <BrainCircuit className="h-6 w-6 text-accent-purple" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Decision Matrix</h2>
                    </div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-[0.2em]">Scientific Prioritization & Value Orchestration</p>
                </div>
                
                <button 
                    onClick={handleSuggestFeatures} 
                    disabled={isSuggesting}
                    className="px-6 py-2.5 bg-accent-purple/10 border border-accent-purple/20 rounded-xl text-[10px] font-black text-accent-purple uppercase tracking-widest hover:bg-accent-purple/20 transition-all flex items-center gap-2 group"
                >
                    {isSuggesting ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />}
                    AI Opportunity Scan
                </button>
            </div>

            <div className="relative group p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] transition-all duration-500">
                <div className="absolute top-0 right-10 transform -translate-y-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-60 hover:opacity-100 transition-opacity flex items-center gap-2">
                    <Activity className="h-3 w-3 text-accent-teal" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Input Stream</span>
                </div>
                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Features for Analysis</label>
                    <div className="flex flex-col lg:flex-row gap-4">
                        <textarea 
                            className="flex-grow bg-black/20 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-accent-purple/50 transition-colors resize-none font-medium custom-scrollbar"
                            rows={3}
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            placeholder="Enrich the list with commas..."
                        />
                        <button 
                            onClick={handlePrioritize} 
                            disabled={isLoading || !features}
                            className="lg:w-40 flex items-center justify-center gap-2 bg-accent-teal text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#34e2cf] hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all disabled:opacity-20"
                        >
                            {isLoading ? <Spinner className="h-5 w-5" /> : <><Target className="h-4 w-4" /> Run Sync</>}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-2xl border border-accent-red/20 animate-shake text-[10px] font-black uppercase tracking-widest">
                    {error}
                </div>
            )}

            {(analysis || []).length > 0 && (
                <div className="flex-1 flex flex-col pt-4">
                    <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                        {(['MoSCoW', 'RICE', 'Kano', 'Matrix'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab 
                                        ? 'bg-accent-purple text-white shadow-lg' 
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab === 'Matrix' ? 'Value vs Effort' : tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar slide-up">
                        {activeTab === 'Matrix' && (
                            <div className="h-[500px] w-full bg-white/[0.02] rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis 
                                            type="number" 
                                            dataKey="effort" 
                                            name="Effort" 
                                            domain={[0, 10]} 
                                            stroke="rgba(255,255,255,0.1)"
                                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 'black' }}
                                        />
                                        <YAxis 
                                            type="number" 
                                            dataKey="value" 
                                            name="Value" 
                                            domain={[0, 10]} 
                                            stroke="rgba(255,255,255,0.1)"
                                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 'black' }}
                                        />
                                        <ZAxis type="number" dataKey="z" range={[100, 100]} />
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-black/80 backdrop-blur-xl p-4 border border-white/10 rounded-2xl shadow-2xl max-w-[280px]">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="p-1.5 bg-accent-purple/20 rounded-lg">
                                                                    <Zap className="h-3 w-3 text-accent-purple" />
                                                                </div>
                                                                <p className="text-[11px] font-black text-white uppercase tracking-tighter leading-none">{data.featureTitle}</p>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                                                    <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5">Value</p>
                                                                    <p className="text-sm font-black text-accent-emerald">{data.value}</p>
                                                                </div>
                                                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                                                    <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5">Effort</p>
                                                                    <p className="text-sm font-black text-accent-amber">{data.effort}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] font-medium text-gray-400 leading-relaxed uppercase tracking-wide">{data.reasoning}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        
                                        <ReferenceLine x={5} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                                        <ReferenceLine y={5} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />

                                        <text x="80%" y="20%" textAnchor="middle" className="fill-accent-emerald/20 text-[10px] font-black uppercase tracking-[0.4em]">Quick Wins</text>
                                        <text x="20%" y="20%" textAnchor="middle" className="fill-accent-purple/20 text-[10px] font-black uppercase tracking-[0.4em]">Stakes</text>
                                        <text x="20%" y="80%" textAnchor="middle" className="fill-gray-500/20 text-[10px] font-black uppercase tracking-[0.4em]">Fill-ins</text>
                                        <text x="80%" y="80%" textAnchor="middle" className="fill-accent-red/20 text-[10px] font-black uppercase tracking-[0.4em]">Risks</text>

                                        <Scatter data={analysis}>
                                            {analysis.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.value > 5 ? '#2DD4BF' : '#A855F7'} 
                                                    stroke={entry.value > 5 ? 'rgba(45,212,191,0.5)' : 'rgba(168,85,247,0.5)'}
                                                    strokeWidth={10}
                                                    style={{ filter: 'drop-shadow(0 0 8px rgba(45,212,191,0.2))' }}
                                                />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {activeTab === 'MoSCoW' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Must Have', icon: Flame },
                                    { label: 'Should Have', icon: Trophy },
                                    { label: 'Could Have', icon: ShieldCheck },
                                    { label: 'Won\'t Have', icon: Dices }
                                ].map((cat) => (
                                    <div key={cat.label} className="flex flex-col h-full space-y-4">
                                        <div className="flex items-center gap-3 px-4">
                                            <div className={`p-1.5 rounded-lg ${moscowStyles[cat.label].split(' ')[0]}`}>
                                                <cat.icon className="h-3 w-3" />
                                            </div>
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{cat.label}</h3>
                                        </div>
                                        <div className="space-y-3 flex-1">
                                            {analysis.filter(item => item.moscow === cat.label).map(item => (
                                                <div key={item.featureId} className={`p-4 border rounded-2xl group transition-all duration-300 ${moscowStyles[cat.label]}`}>
                                                    <p className="text-xs font-black tracking-tight mb-2 uppercase italic">{item.featureTitle}</p>
                                                    <p className="text-[10px] font-medium leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity uppercase tracking-wider">{item.reasoning}</p>
                                                </div>
                                            ))}
                                            {analysis.filter(item => item.moscow === cat.label).length === 0 && (
                                                <div className="h-32 border border-dashed border-white/5 rounded-2xl flex items-center justify-center opacity-20">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.5em]">Empty Slot</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'RICE' && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-white/5">
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Core Feature</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest bg-black/20">R</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">I</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest bg-black/20">C</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">E</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-accent-purple uppercase tracking-[0.3em] bg-accent-purple/5">RICE Index</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {[...analysis].sort((a,b) => (b.rice?.score || 0) - (a.rice?.score || 0)).map(item => (
                                            <tr key={item.featureId} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-black text-white uppercase tracking-tighter italic">{item.featureTitle}</p>
                                                    <p className="text-[9px] font-medium text-gray-500 uppercase tracking-widest mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">{item.reasoning}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center text-[10px] font-black text-gray-400 bg-black/20">{item.rice?.reach || 0}</td>
                                                <td className="px-6 py-4 text-center text-[10px] font-black text-gray-400">{item.rice?.impact || 0}</td>
                                                <td className="px-6 py-4 text-center text-[10px] font-black text-gray-400 bg-black/20">{item.rice?.confidence || 0}%</td>
                                                <td className="px-6 py-4 text-center text-[10px] font-black text-gray-400">{item.rice?.effort || 0}</td>
                                                <td className="px-6 py-4 text-center bg-accent-purple/5">
                                                    <span className="text-sm font-black text-accent-purple">{(item.rice?.score || 0).toFixed(0)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'Kano' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {['Basic', 'Performance', 'Delighter'].map(type => (
                                    <div key={type} className={`relative p-8 rounded-[2.5rem] border bg-gradient-to-br ${kanoStyles[type]} group overflow-hidden`}>
                                        <div className="absolute -top-10 -right-10 transform rotate-12 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                                            {type === 'Basic' ? <ShieldCheck className="w-40 h-40" /> : type === 'Performance' ? <BarChart3 className="w-40 h-40" /> : <Sparkles className="w-40 h-40" />}
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-2 w-10 bg-current rounded-full" />
                                                <h3 className="text-sm font-black uppercase tracking-widest italic">{type} Needs</h3>
                                            </div>
                                            <ul className="space-y-4">
                                                {analysis.filter(item => item.kano === type).map(item => (
                                                    <li key={item.featureId} className="flex items-start gap-3 group/item">
                                                        <ChevronRight className="h-3 w-3 mt-1 text-current opacity-40 group-hover/item:translate-x-1 transition-transform" />
                                                        <span className="text-xs font-black text-white uppercase tracking-tight">{item.featureTitle}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] opacity-40 leading-relaxed border-t border-white/10 pt-4">
                                                {type === 'Basic' ? 'Baseline expectations. Null delinquency risk.' :
                                                 type === 'Performance' ? 'Linear satisfaction growth mapping.' :
                                                 'Competitive differentiators. High-alpha delight.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
