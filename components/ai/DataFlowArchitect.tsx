
import React, { useState, useEffect } from 'react';
import { TInitiative, TDFDModel, TDFDNode } from '../../types';
import { generateDFD } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface DataFlowArchitectProps {
    initiative: TInitiative;
}

const CircleStackIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>;

// Simple force-directed layout simulation or static layering for DFD
const renderDFD = (model: TDFDModel) => {
    // Defensive checks
    const nodes = Array.isArray(model?.nodes) ? model.nodes : [];
    const flows = Array.isArray(model?.flows) ? model.flows : [];

    // Stratify nodes: Entities (Top/Bottom), Processes (Center), Stores (Sides)
    const entities = nodes.filter(n => n.type === 'Entity');
    const processes = nodes.filter(n => n.type === 'Process');
    const stores = nodes.filter(n => n.type === 'Store');

    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodePos: Record<string, {x: number, y: number}> = {};

    // Place Entities in a circle outer rim
    entities.forEach((n, i) => {
        const angle = (i / entities.length) * 2 * Math.PI - Math.PI/2;
        nodePos[n.id] = {
            x: centerX + 300 * Math.cos(angle),
            y: centerY + 250 * Math.sin(angle)
        };
    });

    // Place Processes in middle
    processes.forEach((n, i) => {
        // Spiral or grid
        const angle = (i / processes.length) * 2 * Math.PI;
        nodePos[n.id] = {
            x: centerX + 100 * Math.cos(angle),
            y: centerY + 100 * Math.sin(angle)
        };
    });

    // Place Stores
    stores.forEach((n, i) => {
        const angle = (i / stores.length) * 2 * Math.PI + Math.PI/4;
        nodePos[n.id] = {
            x: centerX + 200 * Math.cos(angle),
            y: centerY + 200 * Math.sin(angle)
        };
    });

    const getNodeShape = (node: TDFDNode, x: number, y: number) => {
        switch (node.type) {
            case 'Entity':
                return (
                    <g transform={`translate(${x-40}, ${y-25})`}>
                        <rect width="80" height="50" className="fill-surface-dark stroke-accent-purple dark:fill-gray-700 dark:stroke-gray-300 stroke-2" />
                        <text x="40" y="30" textAnchor="middle" className="text-xs font-bold fill-text-main-dark dark:fill-white text-[10px]">{node.label}</text>
                    </g>
                );
            case 'Process':
                return (
                    <g transform={`translate(${x-40}, ${y-30})`}>
                        <rect width="80" height="60" rx="10" className="fill-accent-purple/10 stroke-accent-purple dark:fill-indigo-900/50 dark:stroke-indigo-400 stroke-2" />
                        <line x1="0" y1="15" x2="80" y2="15" className="stroke-accent-purple dark:stroke-indigo-400" />
                        <text x="40" y="10" textAnchor="middle" className="text-[8px] fill-accent-purple dark:fill-indigo-200">P{node.id.slice(-2)}</text>
                        <text x="40" y="35" textAnchor="middle" className="text-xs font-bold fill-accent-purple dark:fill-white text-[10px]">{node.label}</text>
                    </g>
                );
            case 'Store':
                return (
                    <g transform={`translate(${x-50}, ${y-20})`}>
                        <path d="M0,0 L100,0 M0,40 L100,40 M10,0 L10,40" className="stroke-accent-emerald dark:stroke-green-400 stroke-2 fill-none" />
                        <text x="55" y="25" textAnchor="middle" className="text-xs font-bold fill-accent-emerald dark:fill-green-100 text-[10px]">{node.label}</text>
                    </g>
                );
        }
    };

    return (
        <svg width={width} height={height} className="w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <defs>
                <marker id="dfd-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" className="fill-text-muted-dark" />
                </marker>
            </defs>

            {/* Flows */}
            {flows.map((flow, i) => {
                const start = nodePos[flow.from];
                const end = nodePos[flow.to];
                if (!start || !end) return null;

                // Bezier curve
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const controlX = start.x + dx * 0.2 - dy * 0.2; // Curve slightly
                const controlY = start.y + dy * 0.2 + dx * 0.2;

                return (
                    <g key={i}>
                        <path 
                            d={`M${start.x},${start.y} Q${controlX},${controlY} ${end.x},${end.y}`} 
                            fill="none" 
                            stroke="var(--color-text-muted-dark)" 
                            strokeWidth="1.5" 
                            markerEnd="url(#dfd-arrow)" 
                        />
                        <text 
                            x={(start.x + end.x + controlX)/3} 
                            y={(start.y + end.y + controlY)/3} 
                            textAnchor="middle" 
                            className="text-[10px] stroke-surface-dark"
                            strokeWidth="4"
                            strokeLinejoin="round"
                            fill="none"
                        >
                            {flow.label}
                        </text>
                        <text 
                            x={(start.x + end.x + controlX)/3} 
                            y={(start.y + end.y + controlY)/3} 
                            textAnchor="middle" 
                            className="text-[10px] fill-text-muted-dark"
                        >
                            {flow.label}
                        </text>
                    </g>
                );
            })}

            {/* Nodes */}
            {nodes.map(node => (
                <g key={node.id} onClick={() => alert(`${node.label}: ${node.description}`)} className="cursor-pointer">
                    {nodePos[node.id] && getNodeShape(node, nodePos[node.id].x, nodePos[node.id].y)}
                </g>
            ))}
        </svg>
    );
};

export const DataFlowArchitect: React.FC<DataFlowArchitectProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [model, setModel] = useState<TDFDModel | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.dfdModel) {
            setModel(initiative.artifacts.dfdModel);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateDFD(initiative.title, initiative.sector);
            setModel(result);
            saveArtifact(initiative.id, 'dfdModel', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate DFD.");
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
                        <CircleStackIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent DFD Architect
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Map data lineage and information flow (BABOK 10.13). Essential for Privacy & Integration.
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Map Data Flows'}
                </Button>
            </div>

            {!model && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <CircleStackIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Visualize how data moves from External Entities through Processes to Data Stores.
                    </p>
                </div>
            )}

            {model && (
                <div className="flex-grow animate-fade-in-down flex flex-col">
                    <div className="mb-4 bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm text-gray-700 dark:text-gray-300">
                        <strong>Context:</strong> {model.context}
                    </div>
                    <div className="flex-grow overflow-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg">
                        {renderDFD(model)}
                    </div>
                    <div className="mt-4 flex gap-4 justify-center text-xs text-gray-500">
                        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-surface-dark border border-accent-purple/40"></span> Entity</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-purple/10 border border-accent-purple rounded"></span> Process</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 border-x border-accent-emerald"></span> Data Store</div>
                    </div>
                </div>
            )}
        </div>
    );
};
