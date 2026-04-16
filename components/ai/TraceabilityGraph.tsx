
import React, { useState, useEffect, useMemo } from 'react';
import { TInitiative, TTraceabilityNode, TTraceabilityLink, TGapAnalysisResult } from '../../types';
import { generateTraceabilityData, analyzeTraceabilityGaps } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface TraceabilityGraphProps {
    initiative?: TInitiative;
}

interface Tooltip {
    visible: boolean;
    content: string;
    x: number;
    y: number;
}

const INITIAL_NODES: TTraceabilityNode[] = [
    { id: 'n1', label: 'Increase Revenue', description: 'Strategic Goal', layer: 'Goal' },
    { id: 'n2', label: 'Checkout Flow', description: 'Requirement', layer: 'Requirement' },
    { id: 'n3', label: 'Stripe Integration', description: 'Feature', layer: 'Feature' },
];

const INITIAL_LINKS: TTraceabilityLink[] = [
    { source: 'n1', target: 'n2', relationship: 'Drivers' },
    { source: 'n2', target: 'n3', relationship: 'Implemented By' },
];

const LAYER_COLORS: { [key: string]: string } = {
    'Goal': 'fill-accent-teal stroke-accent-teal',
    'Regulation': 'fill-accent-red stroke-accent-red',
    'Requirement': 'fill-accent-teal stroke-accent-teal',
    'Feature': 'fill-accent-teal stroke-accent-teal',
    'Test': 'fill-accent-emerald stroke-accent-emerald',
    'Risk': 'fill-accent-amber stroke-accent-amber',
};

const LAYER_X_POS: { [key: string]: number } = {
    'Goal': 50,
    'Regulation': 50, // Regs sit alongside Goals
    'Requirement': 250,
    'Feature': 450,
    'Test': 650,
    'Risk': 250 // Risks sit alongside Reqs
};

const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
const ExclamationCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;

export const TraceabilityGraph: React.FC<TraceabilityGraphProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [nodes, setNodes] = useState<TTraceabilityNode[]>(INITIAL_NODES);
    const [error, setError] = useState<string | null>(null);
    const [links, setLinks] = useState<TTraceabilityLink[]>(INITIAL_LINKS);
    const [analysis, setAnalysis] = useState<TGapAnalysisResult | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<Tooltip | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative?.artifacts?.traceabilityGraph) {
            const graph = initiative.artifacts.traceabilityGraph;
            setNodes(graph.nodes || INITIAL_NODES);
            setLinks(graph.links || INITIAL_LINKS);
            setAnalysis(graph.analysis || null);
        }
    }, [initiative?.id, initiative?.artifacts]);

    // Process nodes to assign X/Y coordinates if missing
    const processedNodes = useMemo(() => {
        const layerCounts: { [key: string]: number } = {};
        return nodes.map(node => {
            const count = layerCounts[node.layer] || 0;
            layerCounts[node.layer] = count + 1;
            
            // If node doesn't have coordinates (from AI or initial), calculate them
            // Just stacking them vertically with some spacing
            const x = LAYER_X_POS[node.layer] || 50;
            const y = 50 + (count * 80); 
            
            return { ...node, x, y };
        });
    }, [nodes]);

    const handleGenerateGraph = async () => {
        if (!initiative) return;
        setIsGenerating(true);
        setAnalysis(null); // Reset analysis on new graph
        try {
            const data = await generateTraceabilityData(initiative.title, initiative.sector);
            const safeNodes = data?.nodes || [];
            const safeLinks = data?.links || [];
            setNodes(safeNodes);
            setLinks(safeLinks);
            saveArtifact(initiative.id, 'traceabilityGraph', { nodes: safeNodes, links: safeLinks, analysis: null });
        } catch (e) {
            console.error(e);
            setError("Failed to generate graph.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnalyze = async () => {
        if (!initiative) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeTraceabilityGaps({ nodes, links }, initiative.sector);
            setAnalysis(result);
            saveArtifact(initiative.id, 'traceabilityGraph', { nodes, links, analysis: result });
        } catch (e) {
            console.error(e);
            setError("Failed to run gap analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setNodes(INITIAL_NODES);
        setLinks(INITIAL_LINKS);
        setAnalysis(null);
        setSelectedNodeId(null);
        if (initiative) {
            saveArtifact(initiative.id, 'traceabilityGraph', { nodes: INITIAL_NODES, links: INITIAL_LINKS, analysis: null });
        }
    };

    const handleNodeClick = (nodeId: string) => {
        setSelectedNodeId(prevId => prevId === nodeId ? null : nodeId);
        setTooltip(null);
    };

    const connectedNodeIds = useMemo(() => {
        if (!selectedNodeId) return new Set<string>();
        
        const connected = new Set<string>([selectedNodeId]);
        let changed = true;
        
        while (changed) {
            changed = false;
            links.forEach(link => {
                if (connected.has(link.source) && !connected.has(link.target)) {
                    connected.add(link.target);
                    changed = true;
                }
                if (connected.has(link.target) && !connected.has(link.source)) {
                    connected.add(link.source);
                    changed = true;
                }
            });
        }
        
        return connected;
    }, [selectedNodeId, links]);

    // Helper to find node coords
    const getNodePos = (id: string) => {
        const n = processedNodes.find(node => node.id === id);
        return n ? { x: n.x!, y: n.y! } : { x: 0, y: 0 };
    };

    const isLinkConnectedToSelected = (link: TTraceabilityLink) => {
        if (!selectedNodeId) return false;
        return link.source === selectedNodeId || link.target === selectedNodeId;
    };

    const selectedNode = processedNodes.find(n => n.id === selectedNodeId);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Main Graph Area */}
            <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Intelligent Traceability Map</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Visualizing dependencies from Goals to Tests.</p>
                    </div>
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
                    <div className="flex gap-2">
                        <Button onClick={handleGenerateGraph} disabled={isGenerating || !initiative}>
                            {isGenerating ? <Spinner /> : (initiative ? `Auto-Map for ${initiative.sector}` : 'Auto-Map')}
                        </Button>
                        <button onClick={handleReset} className="text-gray-500 hover:text-gray-700 px-3">Reset</button>
                    </div>
                </div>

                {selectedNode && (
                    <div className="mb-4 bg-accent-teal/10 dark:bg-accent-teal/20 border-l-4 border-accent-teal p-3 rounded-r text-sm">
                        <span className="font-bold text-accent-teal">{selectedNode.label}</span>
                        <span className="mx-2 text-accent-teal/50">|</span>
                        <span className="text-accent-teal/80">{selectedNode.description}</span>
                        <span className="float-right text-xs uppercase font-semibold tracking-wider text-accent-teal">{selectedNode.layer}</span>
                    </div>
                )}

                <div className="flex-grow relative border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 overflow-auto custom-scrollbar min-h-[400px]">
                    <svg width="800" height="600" className="min-w-full min-h-full">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" className="fill-gray-400 dark:fill-gray-500" />
                            </marker>
                             <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" className="fill-accent-teal" />
                            </marker>
                        </defs>

                        {/* Links */}
                        {links.map((link, i) => {
                            const start = getNodePos(link.source);
                            const end = getNodePos(link.target);
                            const isHighlighted = isLinkConnectedToSelected(link);
                            const isDimmed = selectedNodeId && !isHighlighted;
                            
                            // Simple bezier curve
                            const controlX = (start.x + 120 + end.x) / 2;
                            const path = `M${start.x + 120},${start.y + 25} C${controlX},${start.y + 25} ${controlX},${end.y + 25} ${end.x},${end.y + 25}`;

                            return (
                                <path 
                                    key={i} 
                                    d={path} 
                                    fill="none" 
                                    strokeWidth={isHighlighted ? "3" : "1.5"}
                                    className={`${isHighlighted ? "stroke-accent-teal" : "stroke-gray-400 dark:stroke-gray-600"} ${isDimmed ? 'opacity-20' : 'opacity-100'} transition-opacity duration-300`}
                                    markerEnd={isHighlighted ? "url(#arrowhead-highlight)" : "url(#arrowhead)"}
                                />
                            );
                        })}

                        {/* Nodes */}
                        {processedNodes.map(node => {
                            const isSelected = selectedNodeId === node.id;
                            const isConnected = connectedNodeIds.has(node.id);
                            const isDimmed = selectedNodeId && !isConnected;

                            return (
                                <g 
                                    key={node.id} 
                                    transform={`translate(${node.x}, ${node.y})`} 
                                    onClick={() => handleNodeClick(node.id)}
                                    className={`cursor-pointer hover:opacity-90 transition-all duration-300 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                                >
                                    <rect 
                                        width="120" 
                                        height="50" 
                                        rx="8" 
                                        className={`${LAYER_COLORS[node.layer] || 'fill-gray-500 stroke-gray-700'} ${isSelected ? 'stroke-[3px] stroke-accent-teal' : isConnected ? 'stroke-[2px] stroke-accent-teal/80' : 'stroke-1'} fill-opacity-20`}
                                    />
                                    {/* Layer Badge */}
                                    <text x="115" y="12" textAnchor="end" fontSize="8" className="fill-gray-500 dark:fill-gray-400 uppercase font-bold tracking-wider">{node.layer.substring(0, 4)}</text>
                                    
                                    {/* Label */}
                                    <text x="60" y="30" textAnchor="middle" fontSize="11" fontWeight="bold" className="fill-gray-800 dark:fill-gray-200 pointer-events-none">
                                        {node.label.length > 15 ? node.label.substring(0, 14) + '...' : node.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
                <div className="mt-4 flex gap-4 text-xs text-gray-500 dark:text-gray-400 justify-center">
                    {Object.keys(LAYER_COLORS).map(layer => (
                        <div key={layer} className="flex items-center gap-1">
                            <div className={`w-3 h-3 rounded-full ${LAYER_COLORS[layer].split(' ')[0].replace('fill-', 'bg-')}`}></div>
                            <span>{layer}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar: Audit & Gaps */}
            <div className="w-full lg:w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheckIcon className="h-5 w-5 text-accent-emerald" />
                        Traceability Audit
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Detect gaps, orphans, and risks.</p>
                </div>

                {!analysis ? (
                    <div className="text-center py-8 flex-grow flex flex-col items-center justify-center">
                        <LinkIcon className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500 mb-4">Graph not analyzed yet.</p>
                        <Button onClick={handleAnalyze} disabled={isAnalyzing || nodes.length === 0}>
                            {isAnalyzing ? <Spinner /> : 'Run Gap Analysis'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in-down">
                        {/* Score Card */}
                        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <div className="text-sm text-gray-500 uppercase font-bold">Coverage Score</div>
                            <div className={`text-4xl font-black mt-2 ${analysis.score >= 80 ? 'text-accent-emerald' : analysis.score >= 50 ? 'text-accent-amber' : 'text-accent-red'}`}>
                                {analysis.score}%
                            </div>
                        </div>

                        {/* Issues List */}
                        <div className="space-y-3 overflow-y-auto custom-scrollbar max-h-[400px]">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b pb-1">Detected Issues ({(analysis.gaps || []).length})</h4>
                            {(analysis.gaps || []).length === 0 && (
                                <p className="text-sm text-accent-emerald italic">No gaps detected. Good job!</p>
                            )}
                            {(analysis.gaps || []).map((gap, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded border-l-4 border-accent-red shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{gap.title}</span>
                                        {gap.severity === 'Critical' && <ExclamationCircleIcon className="h-4 w-4 text-accent-red" />}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{gap.description}</p>
                                </div>
                            ))}
                        </div>
                        
                        <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
                            Re-Run Analysis
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
