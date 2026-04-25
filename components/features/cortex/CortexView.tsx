
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, TCortexGraph, TCortexNode, TCortexLink, TCortexInsight } from '../../../types';
import { CortexService } from '../../../services/cortexService';
import { MousePointer2, Hand, Filter, Maximize2, Minus, Plus } from 'lucide-react';
import { CortexGraph } from './CortexGraph';
import { CortexInsights } from './CortexInsights';

interface CortexViewProps {
    initiatives: TInitiative[];
    onSelectInitiative: (id: string) => void;
}

export const CortexView: React.FC<CortexViewProps> = ({ initiatives, onSelectInitiative }) => {
    const { t } = useTranslation('dashboard');
    const [graphData, setGraphData] = useState<TCortexGraph | null>(null);
    const [insights, setInsights] = useState<TCortexInsight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
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

    const renderedNodes = useMemo(() => {
        if (!graphData || !graphData.nodes) return [];
        const width = 800;
        const height = 600;
        const center = { x: width / 2, y: height / 2 };
        
        const initiativeNodes = graphData.nodes.filter(n => n.type === 'Initiative');
        const others = graphData.nodes.filter(n => n.type !== 'Initiative');

        const nodesWithPos = graphData.nodes.map(n => ({...n, x: center.x, y: center.y}));
        const nodeMap = new Map<string, typeof nodesWithPos[0]>(nodesWithPos.map(n => [n.id, n]));

        initiativeNodes.forEach((n, i) => {
            const angle = (i / initiativeNodes.length) * 2 * Math.PI;
            const radius = 150;
            const targetNode = nodeMap.get(n.id);
            if (targetNode) {
                targetNode.x = center.x + radius * Math.cos(angle);
                targetNode.y = center.y + radius * Math.sin(angle);
            }
        });

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

    return (
        <div className="flex-1 flex h-full overflow-hidden relative animate-in fade-in duration-700">
            <div className="flex-1 relative bg-surface-light dark:bg-surface-dark bg-grid-pattern overflow-hidden">
                {/* Top Left Toolbar */}
                <div className="absolute top-6 left-6 flex gap-3 z-20">
                    <div className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border border-border-light dark:border-border-dark rounded-2xl p-1.5 shadow-xl flex flex-col gap-1.5">
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
                    <div className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border border-border-light dark:border-border-dark rounded-2xl p-1.5 shadow-xl flex items-center gap-2">
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
                    <div className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-xl">
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
                <CortexGraph 
                    renderedNodes={renderedNodes} 
                    renderedLinks={renderedLinks} 
                    loading={loading} 
                    error={error} 
                    t={t} 
                />
            </div>

            {/* Right Sidebar - Insights */}
            <CortexInsights insights={insights} t={t} />
        </div>
    );
};
