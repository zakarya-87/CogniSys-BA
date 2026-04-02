
import React, { useState, useEffect } from 'react';
import { TInitiative, TC4Model, TC4Level, TC4Node } from '../../types';
import { generateC4Model } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface C4ModelerProps {
    initiative: TInitiative;
}

const ServerIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.375a3 3 0 00-3-3h-1.5a3 3 0 00-3 3v.375m9 0V19.5a3 3 0 01-3 3h-1.5a3 3 0 01-3-3v-2.25m9 0h-9m0-9.75v-.375a3 3 0 013-3h1.5a3 3 0 013 3v.375m-9 0V9.75a3 3 0 003 3h1.5a3 3 0 003-3V7.5m-9 0h9m0 0v-3a3 3 0 00-3-3h-1.5a3 3 0 00-3 3v3m-9 4.5V4.875C5.75 3.375 7.75 3 9.75 3 11.75 3 13.75 3.375 15 4.875v.375m0 9.75h-9m0 0v-3a3 3 0 013-3h1.5a3 3 0 013 3v3m-9 4.5V19.5a3 3 0 013-3h1.5a3 3 0 013 3v2.25" /></svg>;

const C4Visualizer: React.FC<{ model: TC4Model }> = ({ model }) => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Defensive checks
    const nodes = Array.isArray(model?.nodes) ? model.nodes : [];
    const relationships = Array.isArray(model?.relationships) ? model.relationships : [];

    // Determine layout based on node types
    const persons = nodes.filter(n => n.type === 'Person');
    const systems = nodes.filter(n => n.type === 'System' || n.type === 'Container');
    const external = nodes.filter(n => n.type === 'Database' || (n.type === 'System' && n.label.toLowerCase().includes('external')));

    const nodePos: Record<string, {x: number, y: number}> = {};

    // Persons at Top
    persons.forEach((n, i) => {
        nodePos[n.id] = { x: centerX + (i - (persons.length-1)/2) * 200, y: 100 };
    });

    // Systems in Center
    systems.forEach((n, i) => {
        nodePos[n.id] = { x: centerX + (i - (systems.length-1)/2) * 250, y: centerY };
    });

    // External/DB at Bottom
    external.forEach((n, i) => {
        nodePos[n.id] = { x: centerX + (i - (external.length-1)/2) * 200, y: height - 100 };
    });

    // Fallback for unclassified
    nodes.forEach((n, i) => {
        if (!nodePos[n.id]) {
            nodePos[n.id] = { x: 100, y: 100 + i * 100 };
        }
    });

    const renderNode = (node: TC4Node, x: number, y: number) => {
        const style = {
            'Person': { className: 'text-accent-purple', strokeClassName: 'text-accent-purple', shape: 'circle' },
            'System': { className: 'text-gray-500', strokeClassName: 'text-gray-600', shape: 'rect' },
            'Container': { className: 'text-accent-cyan', strokeClassName: 'text-accent-cyan', shape: 'rect' },
            'Component': { className: 'text-accent-purple/60', strokeClassName: 'text-accent-purple', shape: 'rect' },
            'Database': { className: 'text-surface-dark', strokeClassName: 'text-surface-darker', shape: 'cylinder' },
        }[node.type] || { className: 'text-gray-300', strokeClassName: 'text-gray-400', shape: 'rect' };

        return (
            <g transform={`translate(${x}, ${y})`}>
                {node.type === 'Person' && (
                    <>
                        <circle r="35" fill="currentColor" stroke="currentColor" strokeWidth="2" className={`${style.className} ${style.strokeClassName}`} />
                        <circle r="15" cy="-10" fill="#fff" opacity="0.2" />
                        <path d="M-20,20 Q0,35 20,20" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
                    </>
                )}
                {(node.type === 'System' || node.type === 'Container' || node.type === 'Component') && (
                    <rect x="-60" y="-35" width="120" height="70" rx="4" fill="currentColor" stroke="currentColor" strokeWidth="2" className={`${style.className} ${style.strokeClassName}`} />
                )}
                {node.type === 'Database' && (
                    <>
                        <path d="M-40,-30 L-40,30 A40,10 0 0,0 40,30 L40,-30 A40,10 0 0,1 -40,-30" fill="currentColor" stroke="currentColor" strokeWidth="2" className={`${style.className} ${style.strokeClassName}`} />
                        <ellipse cx="0" cy="-30" rx="40" ry="10" fill="currentColor" stroke="currentColor" strokeWidth="2" className={`${style.className} ${style.strokeClassName}`} />
                    </>
                )}
                
                <text y="5" textAnchor="middle" fill="white" className="text-xs font-bold pointer-events-none" style={{ maxWidth: '100px' }}>
                    {node.label}
                </text>
                <text y="20" textAnchor="middle" fill="white" className="text-[8px] pointer-events-none opacity-80">
                    [{node.type}]
                </text>
                {node.technology && (
                    <text y="45" textAnchor="middle" fill="#666" className="text-[9px] bg-white px-1">
                        {node.technology}
                    </text>
                )}
            </g>
        );
    };

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <defs>
                <marker id="c4-arrow" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                </marker>
            </defs>
            
            {/* Legend */}
            <g transform="translate(20, 20)">
                <rect width="120" height="80" fill="white" fillOpacity="0.8" rx="4" stroke="#ddd" />
                <text x="10" y="20" fontSize="10" fontWeight="bold">Legend</text>
                <circle cx="15" cy="35" r="5" fill="currentColor" className="text-accent-purple" /> <text x="25" y="38" fontSize="8">Person</text>
                <rect x="10" y="45" width="10" height="10" fill="currentColor" className="text-accent-cyan" /> <text x="25" y="53" fontSize="8">Container</text>
                <rect x="10" y="60" width="10" height="10" fill="currentColor" className="text-gray-400" /> <text x="25" y="68" fontSize="8">System</text>
            </g>

            {relationships.map((rel, i) => {
                const start = nodePos[rel.source];
                const end = nodePos[rel.target];
                if (!start || !end) return null;

                return (
                    <g key={i}>
                        <line 
                            x1={start.x} y1={start.y} 
                            x2={end.x} y2={end.y} 
                            stroke="#9ca3af" strokeWidth="1.5" 
                            markerEnd="url(#c4-arrow)" 
                            strokeDasharray="5,5"
                        />
                        <text 
                            x={(start.x + end.x) / 2} 
                            y={(start.y + end.y) / 2 + 3} 
                            textAnchor="middle" 
                            className="text-[10px] font-medium stroke-white dark:stroke-gray-900"
                            strokeWidth="4"
                            strokeLinejoin="round"
                            fill="none"
                        >
                            {rel.label}
                        </text>
                        <text 
                            x={(start.x + end.x) / 2} 
                            y={(start.y + end.y) / 2 + 3} 
                            textAnchor="middle" 
                            className="text-[10px] fill-gray-600 dark:fill-gray-400 font-medium"
                        >
                            {rel.label}
                        </text>
                    </g>
                );
            })}

            {nodes.map(node => (
                <g key={node.id} onClick={() => alert(`${node.label}\n\n${node.description}`)} className="cursor-pointer hover:opacity-80">
                    {renderNode(node, nodePos[node.id]?.x || 0, nodePos[node.id]?.y || 0)}
                </g>
            ))}
        </svg>
    );
};

export const C4Modeler: React.FC<C4ModelerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [level, setLevel] = useState<TC4Level>('Context');
    const [error, setError] = useState<string | null>(null);
    const [model, setModel] = useState<TC4Model | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.c4Model) {
            setModel(initiative.artifacts.c4Model);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateC4Model(initiative.description, level, initiative.sector);
            setModel(result);
            saveArtifact(initiative.id, 'c4Model', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate C4 model.");
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
                        <ServerIcon className="h-7 w-7 text-accent-purple" />
                        C4 Architecture Modeler
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize software architecture for <strong>{initiative.sector}</strong> systems.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6 flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow">
                    <p className="text-sm text-gray-500 mb-2">
                        Based on the initiative description, generating a {level} diagram.
                    </p>
                    <div className="flex bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-300 dark:border-gray-600 p-1 w-fit">
                        <button 
                            onClick={() => setLevel('Context')}
                            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${level === 'Context' ? 'bg-accent-purple/10 text-accent-purple' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            Level 1: Context
                        </button>
                        <button 
                            onClick={() => setLevel('Container')}
                            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${level === 'Container' ? 'bg-accent-purple/10 text-accent-purple' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            Level 2: Container
                        </button>
                    </div>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Architect System'}
                </Button>
            </div>

            {model ? (
                <div className="flex-grow animate-fade-in-down overflow-auto custom-scrollbar">
                    <C4Visualizer model={model} />
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <ServerIcon className="h-16 w-16 mb-4" />
                        <p>Select a level and click "Architect System" to generate diagram.</p>
                    </div>
                )
            )}
        </div>
    );
};
