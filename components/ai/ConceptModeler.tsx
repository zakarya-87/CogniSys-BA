
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TInitiative, TConceptModel, TConceptNode } from '../../types';
import { generateConceptModel } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, BookOpen, Share2, Info, Search } from 'lucide-react';

interface ConceptModelerProps {
    initiative: TInitiative;
}

const OntologyVisualizer: React.FC<{ model: TConceptModel }> = ({ model }) => {
    const [viewMode, setViewMode] = useState<'graph' | 'dictionary'>('graph');
    const [selectedNode, setSelectedNode] = useState<TConceptNode | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const svgRef = useRef<SVGSVGElement>(null);

    const width = 800;
    const height = 600;

    const filteredNodes = useMemo(() => {
        if (!searchTerm) return model?.nodes || [];
        const term = searchTerm.toLowerCase();
        return (model?.nodes || []).filter(n => 
            (n.name || '').toLowerCase().includes(term) || 
            (n.definition || '').toLowerCase().includes(term) ||
            n.synonyms?.some(s => (s || '').toLowerCase().includes(term))
        );
    }, [model, searchTerm]);

    useEffect(() => {
        if (viewMode !== 'graph' || !model || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const nodes = (model.nodes || []).map(d => ({ ...d }));
        const nodeIds = new Set(nodes.map(n => n.id));
        const links = (model.relationships || [])
            .filter(d => nodeIds.has(d.source) && nodeIds.has(d.target))
            .map(d => ({ ...d }));

        const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(60));

        // Definitions for markers and shadows
        const defs = svg.append("defs");
        
        defs.append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", 32)
            .attr("refY", 0)
            .attr("orient", "auto")
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("xoverflow", "visible")
            .append("svg:path")
            .attr("d", "M 0,-5 L 10 ,0 L 0,5")
            .attr("fill", "var(--color-text-muted-dark)")
            .style("stroke", "none");

        defs.append("filter")
            .attr("id", "shadow")
            .attr("x", "-20%")
            .attr("y", "-20%")
            .attr("width", "140%")
            .attr("height", "140%")
            .append("feDropShadow")
            .attr("dx", "0")
            .attr("dy", "2")
            .attr("stdDeviation", "3")
            .attr("flood-opacity", "0.1");

        const linkGroup = svg.append("g").attr("class", "links");
        const nodeGroup = svg.append("g").attr("class", "nodes");

        const link = linkGroup.selectAll("g")
            .data(links)
            .enter().append("g");

        const path = link.append("path")
            .attr("stroke", "var(--color-accent-purple-20)")
            .attr("stroke-width", 1.5)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrowhead)");

        const linkLabelGroup = link.append("g");
        
        linkLabelGroup.append("text")
            .attr("font-size", "10px")
            .attr("text-anchor", "middle")
            .attr("dy", -5)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 4)
            .attr("stroke-linejoin", "round")
            .attr("fill", "none")
            .text(d => d.verb);

        const linkLabel = linkLabelGroup.append("text")
            .attr("font-size", "10px")
            .attr("fill", "var(--color-text-muted-dark)")
            .attr("text-anchor", "middle")
            .attr("dy", -5)
            .text(d => d.verb);

        const node = nodeGroup.selectAll("g")
            .data(nodes)
            .enter().append("g")
            .attr("cursor", "pointer")
            .on("click", (event, d: any) => {
                setSelectedNode(prev => prev?.id === d.id ? null : d);
            })
            .call(d3.drag<SVGGElement, any>()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

        node.append("rect")
            .attr("width", 120)
            .attr("height", 40)
            .attr("x", -60)
            .attr("y", -20)
            .attr("rx", 8)
            .attr("fill", "var(--color-surface-dark)")
            .attr("stroke", "var(--color-accent-purple-20)")
            .attr("stroke-width", 2)
            .attr("filter", "url(#shadow)");

        node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", 4)
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "var(--color-text-main-dark)")
            .text(d => (d.name || '').length > 16 ? (d.name || '').substring(0, 14) + '...' : (d.name || ''));

        simulation.on("tick", () => {
            path.attr("d", (d: any) => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curve radius
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            });

            linkLabelGroup.selectAll("text")
                .attr("x", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    return (d.source.x + d.target.x) / 2 + dy * 0.1;
                })
                .attr("y", (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    return (d.source.y + d.target.y) / 2 - dx * 0.1;
                });

            node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

        return () => {
            simulation.stop();
        };
    }, [model, viewMode]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 gap-4">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <button
                        onClick={() => setViewMode('graph')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'graph' ? 'bg-accent-purple/10 text-accent-purple' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <Share2 className="w-4 h-4" />
                        Visual Graph
                    </button>
                    <button
                        onClick={() => setViewMode('dictionary')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'dictionary' ? 'bg-accent-purple/10 text-accent-purple' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Data Dictionary
                    </button>
                </div>
                
                {viewMode === 'dictionary' && (
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search concepts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="relative flex-grow overflow-auto custom-scrollbar bg-gray-50/50 dark:bg-gray-900/20">
                {viewMode === 'graph' ? (
                    <div className="w-full h-[600px] overflow-auto relative">
                        <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto block" />

                        {/* Floating Detail Panel */}
                        <AnimatePresence>
                            {selectedNode && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-10"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                            <Tag className="w-5 h-5 text-accent-purple" />
                                            {selectedNode.name}
                                        </h4>
                                        <button 
                                            onClick={() => setSelectedNode(null)}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full p-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                                        {selectedNode.definition}
                                    </p>
                                    
                                    {(selectedNode.synonyms?.length || selectedNode.acronym) && (
                                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            {selectedNode.acronym && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                                                    Acronym: {selectedNode.acronym}
                                                </span>
                                            )}
                                            {selectedNode.synonyms?.map((syn, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                    {syn}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="h-[600px] overflow-y-auto custom-scrollbar p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredNodes.length > 0 ? filteredNodes.map(node => (
                                <div key={node.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{node.name}</h4>
                                        {node.acronym && (
                                            <span className="bg-accent-purple/10 text-accent-purple text-xs font-bold px-2 py-1 rounded border border-accent-purple/20">
                                                {node.acronym}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3" title={node.definition}>
                                        {node.definition}
                                    </p>
                                    
                                    {node.synonyms && node.synonyms.length > 0 && (
                                        <div className="mb-4">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Synonyms</span>
                                            <div className="flex flex-wrap gap-1">
                                                {node.synonyms.map((syn, idx) => (
                                                    <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                                        {syn}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Relationships</span>
                                        <ul className="space-y-1">
                                            {(model.relationships || [])
                                                .filter(r => r.source === node.id || r.target === node.id)
                                                .slice(0, 3)
                                                .map((rel, idx) => {
                                                    const isSource = rel.source === node.id;
                                                    const otherNodeId = isSource ? rel.target : rel.source;
                                                    const otherNode = (model.nodes || []).find(n => n.id === otherNodeId);
                                                    return (
                                                        <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple/60"></span>
                                                            {isSource ? (
                                                                <span><span className="italic text-accent-purple">{rel.verb}</span> {otherNode?.name}</span>
                                                            ) : (
                                                                <span>{otherNode?.name} <span className="italic text-accent-purple">{rel.verb}</span> this</span>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            {(model.relationships || []).filter(r => r.source === node.id || r.target === node.id).length > 3 && (
                                                <li className="text-xs text-gray-400 italic pl-2.5">
                                                    + {(model.relationships || []).filter(r => r.source === node.id || r.target === node.id).length - 3} more...
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-12 text-center">
                                    <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No concepts found matching "{searchTerm}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ConceptModeler: React.FC<ConceptModelerProps> = ({ initiative }) => {
    const [domain, setDomain] = useState('Claims Processing');
    const [model, setModel] = useState<TConceptModel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!domain.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateConceptModel(domain, initiative.sector);
            setModel(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate concept model.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
            {error && (
                <div className="p-4 mb-6 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-sm">Generation Error</h3>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-accent-purple/10 rounded-lg">
                            <Tag className="h-6 w-6 text-accent-purple" />
                        </div>
                        Intelligent Concept Modeler
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-2xl">
                        Define business vocabulary, entities, and their relationships to establish a common language (Ontology) across the initiative.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Business Domain Context
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                        <input 
                            type="text" 
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="w-full pl-4 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple outline-none transition-shadow"
                            placeholder="e.g. Digital Identity Management, Claims Processing"
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading || !domain} className="py-2.5 px-6 whitespace-nowrap">
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Spinner /> Modeling...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Share2 className="w-4 h-4" /> Generate Model
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {model ? (
                <div className="flex-grow animate-fade-in-down flex flex-col min-h-[600px]">
                    <div className="mb-4 flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">
                            Domain Ontology: <span className="text-accent-purple">{model.domain}</span>
                        </h3>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {(model.nodes || []).length} Concepts
                        </span>
                    </div>
                    <OntologyVisualizer model={model} />
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm mb-4">
                            <Share2 className="h-10 w-10 text-accent-purple/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Model Generated</h3>
                        <p className="text-center max-w-md text-sm">
                            Enter a business domain context above and click "Generate Model" to visualize the core concepts and their relationships.
                        </p>
                    </div>
                )
            )}
        </div>
    );
};
