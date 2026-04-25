
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, TCortexGraph, TCortexNode, TCortexInsight, TCortexLink } from '../types';
import { CortexService } from '../services/cortexService';
import { Spinner } from './ui/Spinner';
import { Button } from './ui/Button';

interface CortexViewProps {
    initiatives: TInitiative[];
    onSelectInitiative: (id: string) => void;
}

import { Cpu, Lightbulb, Share2, MousePointer2, Hand, Filter, Maximize2, Minus, Plus, Brain, AlertTriangle, Zap, Send, Info, ChevronRight } from 'lucide-react';

export const CortexView: React.FC<CortexViewProps> = ({ initiatives, onSelectInitiative }) => {
    const { t } = useTranslation('dashboard');
    const [graphData, setGraphData] = useState<TCortexGraph | null>(null);
    const [insights, setInsights] = useState<TCortexInsight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<TCortexNode | null>(null);
    
    // Canvas ref for D3 or pure SVG rendering
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const build = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Build Graph Structure locally
                const graph = CortexService.buildGraph(initiatives);
                setGraphData(graph);

                // 2. Ask AI for Insights
                const aiInsights = await CortexService.generateInsights(initiatives, graph);
                setInsights(aiInsights);
            } catch (e: any) {
                console.error("Cortex Error:", e);
                setError(e.message || "An error occurred while analyzing the cortex.");
            } finally {
                setLoading(false);
            }
        };
        build();
    }, [initiatives]);

    // Force-directed layout simulation (simplified for React/SVG without heavy D3 dep if possible,
    // but for quality we simulate positions or use a pre-calc layout. 
    // Here we use a deterministic radial layout for simplicity and stability.)
    
    const renderedNodes = useMemo(() => {
        if (!graphData || !graphData.nodes) return [];
        const width = 800;
        const height = 600;
        const center = { x: width / 2, y: height / 2 };
        
        // Group nodes
        const initiatives = graphData.nodes.filter(n => n.type === 'Initiative');
        const others = graphData.nodes.filter(n => n.type !== 'Initiative');

        const nodesWithPos = graphData.nodes.map(n => ({...n, x: center.x, y: center.y}));
        const nodeMap = new Map<string, typeof nodesWithPos[0]>(nodesWithPos.map(n => [n.id, n]));

        // Place Initiatives in inner circle
        initiatives.forEach((n, i) => {
            const angle = (i / initiatives.length) * 2 * Math.PI;
            const radius = 150;
            const targetNode = nodeMap.get(n.id);
            if (targetNode) {
                targetNode.x = center.x + radius * Math.cos(angle);
                targetNode.y = center.y + radius * Math.sin(angle);
            }
        });

        // Place others in outer circle
        others.forEach((n, i) => {
            const angle = (i / others.length) * 2 * Math.PI;
            const radius = 280;
            const targetNode = nodeMap.get(n.id);
            if (targetNode) {
                targetNode.x = center.x + radius * Math.cos(angle);
                targetNode.y = center.y + radius * Math.sin(angle);
            }
        });

        return nodesWithPos;
    }, [graphData]);

    const renderedLinks = useMemo(() => {
        if (!graphData || !graphData.links || !renderedNodes) return [];
        return graphData.links.map(link => {
            const source = renderedNodes.find(n => n.id === link.source);
            const target = renderedNodes.find(n => n.id === link.target);
            if (!source || !target) return null;
            return { ...link, sourceNode: source, targetNode: target };
        }).filter(Boolean) as (TCortexLink & { sourceNode: TCortexNode & {x: number, y: number}, targetNode: TCortexNode & {x: number, y: number} })[];
    }, [graphData, renderedNodes]);

    const getNodeColor = (type: string) => {
        switch(type) {
            case 'Initiative': return '#00d4ff'; // accent-cyan
            case 'Person': return '#10B981'; // accent-emerald
            case 'Risk': return '#EF4444'; // accent-red
            case 'Tech': return '#00D4AA'; // accent-teal
            case 'Sector': return '#F59E0B'; // accent-amber
            default: return '#94A3B8'; // text-muted-dark
        }
    };

    return (
        <div className="flex-1 flex h-full overflow-hidden relative animate-in fade-in duration-700">
            <div className="flex-1 relative bg-surface-light dark:bg-surface-dark bg-grid-pattern overflow-hidden">
                {/* Top Left Toolbar */}
                <div className="absolute top-6 left-6 flex gap-3 z-20">
                    <div className="glass-card p-1.5 shadow-xl flex flex-col gap-1.5">
                        <button className="p-3 hover:bg-accent-teal/10 dark:hover:bg-accent-teal/20 rounded-xl transition-all text-text-muted-light dark:text-text-muted-dark hover:text-accent-teal" title="Select">
                            <MousePointer2 className="w-5 h-5" />
                        </button>
                        <button className="p-3 hover:bg-accent-teal/10 dark:hover:bg-accent-teal/20 rounded-xl transition-all text-text-muted-light dark:text-text-muted-dark hover:text-accent-teal" title="Pan">
                            <Hand className="w-5 h-5" />
                        </button>
                        <div className="h-px bg-border-light dark:bg-border-dark mx-2" />
                        <button className="p-3 bg-accent-teal/10 text-accent-teal rounded-xl transition-all shadow-inner" title="Filter Nodes">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Bottom Right Controls */}
                <div className="absolute bottom-8 right-8 flex gap-4 z-20">
                    <div className="glass-card p-1.5 shadow-xl flex items-center gap-2">
                        <button className="p-2.5 hover:bg-accent-teal/10 dark:hover:bg-accent-teal/20 rounded-xl transition-all text-text-muted-light dark:text-text-muted-dark hover:text-accent-teal">
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] px-3 font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">100%</span>
                        <button className="p-2.5 hover:bg-accent-teal/10 dark:hover:bg-accent-teal/20 rounded-xl transition-all text-text-muted-light dark:text-text-muted-dark hover:text-accent-teal">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <button className="bg-accent-teal hover:bg-accent-teal/90 text-primary p-3.5 rounded-2xl shadow-xl shadow-accent-teal/20 transition-all hover:scale-105 active:scale-95">
                        <Maximize2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Bottom Left Legend */}
                <div className="absolute bottom-8 left-8 z-20">
                    <div className="glass-card p-5 shadow-xl">
                        <h4 className="text-[10px] font-bold uppercase text-text-muted-light dark:text-text-muted-dark tracking-[0.2em] mb-4">Entity Taxonomy</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 group cursor-help">
                                <span className="w-3 h-3 rounded-full bg-accent-blue shadow-[0_0_12px_rgba(0,212,255,0.4)] group-hover:scale-125 transition-transform"></span>
                                <span className="text-[11px] font-bold text-text-main-light dark:text-text-main-dark uppercase tracking-widest">Strategic Initiative</span>
                            </div>
                            <div className="flex items-center gap-3 group cursor-help">
                                <span className="w-3 h-3 rounded-full bg-accent-green shadow-[0_0_12px_rgba(16,185,129,0.4)] group-hover:scale-125 transition-transform"></span>
                                <span className="text-[11px] font-bold text-text-main-light dark:text-text-main-dark uppercase tracking-widest">Stakeholder</span>
                            </div>
                            <div className="flex items-center gap-3 group cursor-help">
                                <span className="w-3 h-3 rounded-full bg-accent-red shadow-[0_0_12px_rgba(239,68,68,0.4)] group-hover:scale-125 transition-transform"></span>
                                <span className="text-[11px] font-bold text-text-main-light dark:text-text-main-dark uppercase tracking-widest">Risk Factor</span>
                            </div>
                            <div className="flex items-center gap-3 group cursor-help">
                                <span className="w-3 h-3 rounded-full bg-accent-amber shadow-[0_0_12px_rgba(245,158,11,0.4)] group-hover:scale-125 transition-transform"></span>
                                <span className="text-[11px] font-bold text-text-main-light dark:text-text-main-dark uppercase tracking-widest">Resource</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SVG Graph Area */}
                <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-6">
                            <div className="relative">
                              <div className="absolute inset-0 bg-accent-teal/20 blur-2xl rounded-full animate-pulse" />
                              <Spinner />
                            </div>
                            <p className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest animate-pulse">{t('cortex.analyzing')}</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full p-12 text-center max-w-md">
                            <div className="bg-accent-red/10 p-6 rounded-3xl mb-6">
                              <AlertTriangle className="text-accent-red w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-3 tracking-tight">{t('cortex.analysisFailed')}</h3>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-8 leading-relaxed">{error}</p>
                            <button 
                                onClick={() => {
                                    // Re-trigger build
                                    const build = async () => {
                                        setLoading(true);
                                        setError(null);
                                        try {
                                            const graph = CortexService.buildGraph(initiatives);
                                            setGraphData(graph);
                                            const aiInsights = await CortexService.generateInsights(initiatives, graph);
                                            setInsights(aiInsights);
                                        } catch (e: any) {
                                            console.error("Cortex Error:", e);
                                            setError(e.message || "An error occurred while analyzing the cortex.");
                                        } finally {
                                            setLoading(false);
                                        }
                                    };
                                    build();
                                }}
                                className="w-full py-4 bg-accent-teal text-primary font-bold rounded-2xl shadow-xl shadow-accent-teal/20 hover:bg-accent-teal/90 transition-all uppercase tracking-widest text-xs"
                            >
                                {t('cortex.retry')}
                            </button>
                        </div>
                    ) : (
                        <svg className="w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 600">
                            <defs>
                                <filter height="200%" id="glow-indigo" width="200%" x="-50%" y="-50%">
                                    <feGaussianBlur result="coloredBlur" stdDeviation="3"></feGaussianBlur>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"></feMergeNode>
                                        <feMergeNode in="SourceGraphic"></feMergeNode>
                                    </feMerge>
                                </filter>
                            </defs>
                            
                            {/* Static mock graph based on design */}
                            <g className="opacity-40 stroke-border-light dark:stroke-border-dark" strokeWidth="1">
                                <line strokeDasharray="4" x1="400" x2="250" y1="300" y2="150"></line>
                                <line x1="400" x2="550" y1="300" y2="150"></line>
                                <line x1="400" x2="600" y1="300" y2="350"></line>
                                <line x1="400" x2="200" y1="300" y2="400"></line>
                                <line x1="400" x2="400" y1="300" y2="500"></line>
                                <line className="stroke-accent-red" strokeDasharray="2" strokeWidth="2" x1="250" x2="200" y1="150" y2="400"></line>
                                <line x1="550" x2="600" y1="150" y2="350"></line>
                                <line x1="250" x2="150" y1="150" y2="150"></line>
                            </g>
                            <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(400, 300)">
                                <circle className="glow-node" fill="#0F172A" r="40" stroke="#00D4AA" strokeWidth="2"></circle>
                                <circle fill="#00d4ff" opacity="0.1" r="30"></circle>
                                <text fill="#E2E8F0" fontFamily="Inter" fontSize="10" fontWeight="bold" textAnchor="middle" x="0" y="5">AI Transformation</text>
                                <text fill="#94A3B8" fontFamily="Inter" fontSize="8" textAnchor="middle" x="0" y="18">Core Program</text>
                            </g>
                            <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(250, 150)">
                                <circle fill="#0F172A" r="25" stroke="#00D4AA" strokeWidth="2"></circle>
                                <text fill="#E2E8F0" fontFamily="Inter" fontSize="9" textAnchor="middle" x="0" y="4">Agritech</text>
                            </g>
                            <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(150, 150)">
                                <circle fill="#1E293B" r="15" stroke="#00D4AA" strokeWidth="2"></circle>
                                <image clipPath="circle(15px at 15px 15px)" height="30" href="https://randomuser.me/api/portraits/women/44.jpg" width="30" x="-15" y="-15"/>
                            </g>
                            <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(550, 150)">
                                <circle fill="#0F172A" r="25" stroke="#00D4AA" strokeWidth="2"></circle>
                                <text fill="#E2E8F0" fontFamily="Inter" fontSize="9" textAnchor="middle" x="0" y="4">Logistics</text>
                            </g>
                            <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(200, 400)">
                                <polygon fill="#1E293B" points="0,-25 22,12 -22,12" stroke="#EF4444" strokeWidth="2"></polygon>
                                <text fill="#EF4444" fontFamily="Inter" fontSize="8" fontWeight="bold" textAnchor="middle" x="0" y="4">Compliance</text>
                            </g>
                            <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(400, 500)">
                                <rect fill="#1E293B" height="30" rx="4" stroke="#F59E0B" strokeWidth="2" width="40" x="-20" y="-15"></rect>
                                <text fill="#E2E8F0" fontFamily="Inter" fontSize="8" textAnchor="middle" x="0" y="4">Cloud Infra</text>
                            </g>
                            <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(600, 350)">
                                <circle fill="#1E293B" r="18" stroke="#00D4AA" strokeWidth="2"></circle>
                                <image clipPath="circle(18px at 18px 18px)" height="36" href="https://randomuser.me/api/portraits/men/32.jpg" width="36" x="-18" y="-18"/>
                            </g>
                            <g transform="translate(225, 275)">
                                <rect fill="#1E293B" height="16" rx="8" stroke="#334155" width="60" x="-30" y="-8"></rect>
                                <text fill="#EF4444" fontSize="8" textAnchor="middle" x="0" y="3">High Risk</text>
                            </g>
                        </svg>
                    )}
                </div>
            </div>

            {/* Right Sidebar - Insights */}
            <aside className="w-96 bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark flex flex-col z-30 shadow-2xl">
                <div className="p-8 border-b border-border-light dark:border-border-dark bg-surface-darker/5 dark:bg-surface-darker/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Brain className="text-accent-teal w-7 h-7" />
                        <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark tracking-tight">{t('cortex.insights')}</h2>
                    </div>
                    <p className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">{t('cortex.stream')}</p>
                </div>
                
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-surface-darker/5 dark:bg-surface-darker/10">
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3 text-accent-teal" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-teal">{t('cortex.pattern')}</span>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">2m ago</span>
                        </div>
                        <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-2 tracking-tight">{t('cortex.bottleneck')}</h3>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-6">
                            Initiatives <span className="text-accent-teal font-bold">Agritech</span> and <span className="text-accent-teal font-bold">Logistics</span> both rely on 'Cloud Infra' in Q3, exceeding available capacity by 15%.
                        </p>
                        <button className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-surface-darker/5 dark:bg-surface-darker/20 hover:bg-accent-teal hover:text-primary text-text-main-light dark:text-text-main-dark py-3 rounded-xl border border-border-light dark:border-border-dark transition-all group-hover:border-accent-teal/50">
                            Run Simulation
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    
                    <div className="bg-accent-red/5 dark:bg-accent-red/10 border border-accent-red/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3 text-accent-red" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-red">{t('cortex.risk')}</span>
                            </div>
                        </div>
                        <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-2 tracking-tight">{t('cortex.compliance')}</h3>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                            New GDPR regulations updated 4h ago conflict with the 'Data Vault' architecture in the Pharma project.
                        </p>
                    </div>
                    
                    <div className="bg-accent-teal/5 dark:bg-accent-teal/10 border border-accent-teal/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="w-3 h-3 text-accent-teal" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-teal">{t('cortex.opportunity')}</span>
                            </div>
                        </div>
                        <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-2 tracking-tight">{t('cortex.reusable')}</h3>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                            Codebase analysis suggests 85% overlap between 'Crop Yield Optimizer' and 'Market Predictor' algorithms. Suggest merging.
                        </p>
                    </div>
                </div>
                
                <div className="p-6 border-t border-border-light dark:border-border-dark bg-surface-darker/5 dark:bg-surface-darker/30">
                    <div className="relative group">
                        <textarea className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl pl-5 pr-14 py-4 text-sm focus:ring-2 focus:ring-accent-teal focus:border-transparent resize-none h-24 text-text-main-light dark:text-text-main-dark transition-all shadow-inner placeholder:text-text-muted-light/50 dark:placeholder:text-text-muted-dark/50" placeholder={t('cortex.ask')}></textarea>
                        <button className="absolute bottom-4 right-4 p-2.5 bg-accent-teal text-primary rounded-xl hover:bg-accent-teal/90 transition-all shadow-lg shadow-accent-teal/20 active:scale-90">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
};
