
import React, { useState, useEffect } from 'react';
import { TInitiative, TDMNModel, TDMNNode } from '../../types';
import { generateDMNModel } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface DecisionModelerProps {
    initiative: TInitiative;
}

const TableCellsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25v1.5c0 .621.504 1.125 1.125 1.125m17.25-2.625h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125v1.5c0 .621-.504 1.125-1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 1.5c0 .621.504-1.125 1.125-1.125M3.375 18.375h7.5" /></svg>;

const DMNVisualizer: React.FC<{ model: TDMNModel }> = ({ model }) => {
    const width = 800;
    const height = 600;
    
    const nodes = Array.isArray(model?.nodes) ? model.nodes : [];
    const edges = Array.isArray(model?.edges) ? model.edges : [];

    // Stratify layout: 
    // Top: Knowledge Sources
    // Middle Top: Decisions (Main)
    // Middle Bottom: Sub-decisions
    // Bottom: Input Data

    const knowledge = nodes.filter(n => n.type === 'KnowledgeSource');
    const decisions = nodes.filter(n => n.type === 'Decision');
    const inputs = nodes.filter(n => n.type === 'InputData');

    const nodePos: Record<string, {x: number, y: number}> = {};

    // Helper to distribute nodes in a row
    const distribute = (nodeList: TDMNNode[], y: number) => {
        const totalWidth = 600;
        const spacing = totalWidth / (nodeList.length + 1);
        nodeList.forEach((n, i) => {
            nodePos[n.id] = { x: 100 + (i + 1) * spacing, y };
        });
    };

    distribute(knowledge, 50);
    // Split decisions into layers if possible, for now just 2 rows
    const mainDecisions = decisions.slice(0, Math.ceil(decisions.length/2));
    const subDecisions = decisions.slice(Math.ceil(decisions.length/2));
    
    distribute(mainDecisions, 200);
    distribute(subDecisions, 350);
    distribute(inputs, 500);

    // Fallback
    nodes.forEach((n, i) => {
        if(!nodePos[n.id]) nodePos[n.id] = { x: 100, y: 100 + i * 50};
    });

    const renderNode = (node: TDMNNode, x: number, y: number) => {
        switch(node.type) {
            case 'Decision':
                return (
                    <g transform={`translate(${x-60}, ${y-25})`}>
                        <rect width="120" height="50" className="fill-accent-purple/10 stroke-accent-purple dark:fill-indigo-900/30 dark:stroke-indigo-400 stroke-2" />
                        <text x="60" y="30" textAnchor="middle" className="text-xs font-bold fill-accent-purple dark:fill-indigo-100">{node.label}</text>
                    </g>
                );
            case 'InputData':
                return (
                    <g transform={`translate(${x-50}, ${y-20})`}>
                        <rect width="100" height="40" rx="20" className="fill-accent-emerald/10 stroke-accent-emerald dark:fill-green-900/30 dark:stroke-green-400 stroke-2" />
                        <text x="50" y="25" textAnchor="middle" className="text-xs font-bold fill-accent-emerald dark:fill-green-100">{node.label}</text>
                    </g>
                );
            case 'KnowledgeSource':
                return (
                    <g transform={`translate(${x-60}, ${y-25})`}>
                        {/* Wavy bottom rect for document look */}
                        <path d="M0,0 L120,0 L120,40 Q90,50 60,40 Q30,30 0,40 Z" className="fill-accent-amber/10 stroke-accent-amber dark:fill-yellow-900/30 dark:stroke-yellow-400 stroke-2" />
                        <text x="60" y="25" textAnchor="middle" className="text-xs font-bold fill-accent-amber dark:fill-yellow-100">{node.label}</text>
                    </g>
                );
        }
    };

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <defs>
                <marker id="dmn-arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" className="fill-text-muted-dark" />
                </marker>
                <marker id="dmn-arrow-dashed" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <path d="M0,0 L10,3.5 L0,7" className="stroke-text-muted-dark fill-none" />
                </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge, i) => {
                const start = nodePos[edge.from];
                const end = nodePos[edge.to];
                if(!start || !end) return null;

                // Adjust endpoints to border of shapes roughly
                const isKnowledge = edge.type === 'KnowledgeRequirement';
                
                return (
                    <line 
                        key={i}
                        x1={start.x} y1={start.y}
                        x2={end.x} y2={end.y}
                        className="stroke-gray-500 dark:stroke-gray-400 stroke-1.5"
                        strokeDasharray={isKnowledge ? "5,5" : ""}
                        markerEnd={isKnowledge ? "url(#dmn-arrow-dashed)" : "url(#dmn-arrow)"}
                    />
                );
            })}

            {/* Nodes */}
            {nodes.map(node => (
                <g key={node.id}>
                    {nodePos[node.id] && renderNode(node, nodePos[node.id].x, nodePos[node.id].y)}
                </g>
            ))}
        </svg>
    );
};

export const DecisionModeler: React.FC<DecisionModelerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [context, setContext] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [model, setModel] = useState<TDMNModel | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.decisionModel) {
            setModel(initiative.artifacts.decisionModel);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!context.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateDMNModel(context, initiative.sector);
            setModel(result);
            saveArtifact(initiative.id, 'decisionModel', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate DMN model.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TableCellsIcon className="h-7 w-7 text-accent-purple" />
                        Decision Modeler (DMN)
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize complex decision logic and dependencies (BABOK 10.17).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Decision Logic Context</label>
                <div className="flex gap-4">
                    <textarea 
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        rows={2}
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="e.g. Determine Loan Eligibility based on Credit Score, Income, and Loan Amount. Credit Score depends on History."
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !context} className="flex-shrink-0 self-start mt-1">
                        {isLoading ? <Spinner /> : 'Model Decision Graph'}
                    </Button>
                </div>
            </div>

            {model ? (
                <div className="flex-grow animate-fade-in-down overflow-auto custom-scrollbar">
                    <h3 className="text-center font-bold text-gray-800 dark:text-gray-200 mb-4">{model.title}</h3>
                    <DMNVisualizer model={model} />
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <TableCellsIcon className="h-16 w-16 mb-4" />
                        <p>Describe decision logic to visualize the DRG.</p>
                    </div>
                )
            )}
        </div>
    );
};
