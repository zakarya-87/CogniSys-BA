
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative } from '../../../types';
import { Hammer, Puzzle, Layers, Sparkles, Plus, Share2, Save, Play, ChevronRight, Brain } from 'lucide-react';
import { Button } from '../../ui/Button';

interface ConstructViewProps {
    initiatives: TInitiative[];
}

export const ConstructView: React.FC<ConstructViewProps> = ({ initiatives }) => {
    const { t } = useTranslation(['dashboard']);
    const [selectedInitiative, setSelectedInitiative] = useState<TInitiative | null>(initiatives[0] || null);
    const [activeLayer, setActiveLayer] = useState<'Logical' | 'Data' | 'Strategic'>('Logical');

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-700">
            {/* Context Header */}
            <div className="p-8 border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-accent-purple/10 rounded-2xl">
                                <Hammer className="h-6 w-6 text-accent-purple" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">The Construct</h1>
                        </div>
                        <p className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">AI-assisted structural engineering for strategic architectures.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="border-border-light dark:border-border-dark hover:bg-surface-darker/5">
                            <Save className="h-4 w-4 mr-2" />
                            SAVE ARCHITECT
                        </Button>
                        <Button className="bg-accent-purple shadow-lg shadow-accent-purple/20">
                            <Play className="h-4 w-4 mr-2" />
                            RUN SIMULATION
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Workbench Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Components Drawer */}
                <aside className="w-80 border-r border-border-light dark:border-border-dark bg-surface-darker/5 dark:bg-surface-darker/10 overflow-y-auto custom-scrollbar shrink-0">
                    <div className="p-6">
                        <h4 className="text-[10px] font-bold uppercase text-text-muted-light dark:text-text-muted-dark tracking-[0.2em] mb-6">Structural Blocks</h4>
                        <div className="space-y-4">
                            {[
                                { name: 'Data Pipeline', icon: Layers, color: 'text-accent-blue' },
                                { name: 'Logic Controller', icon: Puzzle, color: 'text-accent-emerald' },
                                { name: 'Bias Filter', icon: ShieldCheck, color: 'text-accent-red' },
                                { name: 'RAG Injector', icon: Brain, color: 'text-accent-purple' },
                            ].map(block => (
                                <div key={block.name} className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm hover:shadow-md hover:border-accent-purple/50 transition-all cursor-grab active:cursor-grabbing group">
                                    <div className="flex items-center gap-3">
                                        <block.icon className={`h-5 w-5 ${block.color}`} />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{block.name}</span>
                                    </div>
                                    <Plus className="h-4 w-4 text-text-muted-light/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Center: Canvas Workbench */}
                <main className="flex-1 relative bg-surface-light dark:bg-surface-dark bg-dot-pattern flex items-center justify-center p-12 overflow-hidden">
                    {/* Layer Switcher */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 toggle-bar-container z-20">
                        {(['Logical', 'Data', 'Strategic'] as const).map(layer => (
                            <button
                                key={layer}
                                onClick={() => setActiveLayer(layer)}
                                className={`toggle-item ${activeLayer === layer ? 'toggle-item-active' : 'toggle-item-inactive'}`}
                            >
                                {layer} Layer
                            </button>
                        ))}
                    </div>

                    {/* Infinite Canvas Mock */}
                    <div className="w-full h-full relative border-2 border-dashed border-border-light dark:border-border-dark rounded-[40px] flex items-center justify-center">
                         <div className="absolute inset-0 flex items-center justify-center opacity-5">
                            <Hammer className="h-64 w-64" />
                         </div>
                         
                         {/* Mock Architecture Node */}
                         <div className="bg-white dark:bg-surface-dark border-2 border-accent-purple p-8 rounded-[32px] shadow-2xl relative z-10 max-w-sm w-full animate-in zoom-in-95 duration-500">
                             <div className="absolute -top-6 -right-6 h-12 w-12 bg-accent-purple rounded-2xl flex items-center justify-center shadow-lg shadow-accent-purple/30">
                                <Sparkles className="h-6 w-6 text-white" />
                             </div>
                             <span className="text-[10px] font-bold text-accent-purple uppercase tracking-[0.2em] mb-2 block">Primary Core</span>
                             <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Strategy Engine v3</h3>
                             <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-6 font-medium">
                                Autonomous decision-making system with integrated risk-aware Monte Carlo simulation protocols.
                             </p>
                             <div className="space-y-2">
                                <div className="h-1 w-full bg-surface-darker/10 dark:bg-surface-darker/20 rounded-full overflow-hidden">
                                     <div className="h-full bg-accent-purple w-2/3"></div>
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase text-text-muted-light/60 dark:text-text-muted-dark/60 tracking-widest">
                                    <span>Logic Load</span>
                                    <span>67% Active</span>
                                </div>
                             </div>
                         </div>
                    </div>

                    {/* Canvas Controls */}
                    <div className="absolute bottom-10 right-10 flex gap-4">
                        <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border border-border-light dark:border-border-dark rounded-2xl p-2 flex items-center gap-2 shadow-xl">
                            <button className="p-2 hover:bg-accent-purple/10 rounded-xl transition-all">
                                <Share2 className="h-4 w-4 text-text-muted-light dark:text-text-muted-dark" />
                            </button>
                            <div className="h-4 w-px bg-border-light dark:bg-border-dark" />
                            <span className="text-[10px] px-3 font-bold text-text-muted-light dark:text-text-muted-dark">ZOOM: 120%</span>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar: Properties/AI Suggestion */}
                <aside className="w-96 border-l border-border-light dark:border-border-dark bg-white dark:bg-surface-dark flex flex-col shrink-0">
                    <div className="p-8 border-b border-border-light dark:border-border-dark bg-accent-purple/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent-purple" />
                            <h4 className="text-[10px] font-bold uppercase text-accent-purple tracking-[0.2em]">AI Architect Suggestion</h4>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Optimise Logic Flow</h3>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-6">
                            Integrating a <span className="text-accent-purple font-bold">Feedback Loop</span> component between the Logic Controller and Data Pipeline could improve accuracy by <span className="text-accent-emerald font-bold">+12%</span>.
                        </p>
                        <Button size="sm" className="w-full bg-accent-purple text-[10px] font-black tracking-widest uppercase">APPLY OPTIMISATION</Button>
                    </div>
                    
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        <h4 className="text-[10px] font-bold uppercase text-text-muted-light dark:text-text-muted-dark tracking-[0.2em] mb-6">Architecture Tree</h4>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`p-4 rounded-2xl border transition-all ${i === 1 ? 'border-accent-purple bg-accent-purple/5' : 'border-border-light dark:border-border-dark'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${i === 1 ? 'bg-accent-purple' : 'bg-gray-400'}`}></div>
                                            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">Node_Cluster_0{i}</span>
                                        </div>
                                        <ChevronRight className="h-3 w-3 text-text-muted-light" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

const ShieldCheck = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
);
