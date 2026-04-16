
import React, { useState, useEffect } from 'react';
import { TInitiative, TUseCaseDiagram, TUseCaseActor, TUseCaseNode } from '../../types';
import { generateUseCaseDiagram } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface UseCaseModelerProps {
    initiative: TInitiative;
}

const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;

const UseCaseVisualizer: React.FC<{ diagram: TUseCaseDiagram }> = ({ diagram }) => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const systemWidth = 400;
    const systemHeight = 500;

    // Defensive checks
    const actors = Array.isArray(diagram?.actors) ? diagram.actors : [];
    const useCases = Array.isArray(diagram?.useCases) ? diagram.useCases : [];
    const links = Array.isArray(diagram?.links) ? diagram.links : [];

    const nodePos: Record<string, {x: number, y: number}> = {};

    // Position Primary Actors on Left
    const primaryActors = actors.filter(a => a.type === 'Primary');
    primaryActors.forEach((a, i) => {
        const id = a.id || `actor-p-${i}`;
        nodePos[id] = { x: 50, y: 100 + i * (400 / (primaryActors.length || 1)) };
    });

    // Position Secondary Actors on Right
    const secondaryActors = actors.filter(a => a.type === 'Secondary');
    secondaryActors.forEach((a, i) => {
        const id = a.id || `actor-s-${i}`;
        nodePos[id] = { x: width - 50, y: 100 + i * (400 / (secondaryActors.length || 1)) };
    });

    // Position Use Cases in Center (Grid or Spiral)
    useCases.forEach((uc, i) => {
        const id = uc.id || `uc-${i}`;
        nodePos[id] = { 
            x: centerX, 
            y: 80 + i * (450 / (useCases.length || 1)) 
        };
    });

    const renderActor = (actor: TUseCaseActor, x: number, y: number) => (
        <g transform={`translate(${x}, ${y})`}>
            {actor.type === 'Primary' ? (
                <g stroke="var(--accent-teal)" strokeWidth="2" fill="none">
                    <circle cx="0" cy="-20" r="10" />
                    <line x1="0" y1="-10" x2="0" y2="15" />
                    <line x1="-15" y1="0" x2="15" y2="0" />
                    <line x1="0" y1="15" x2="-10" y2="30" />
                    <line x1="0" y1="15" x2="10" y2="30" />
                </g>
            ) : (
                <rect x="-15" y="-20" width="30" height="30" stroke="var(--text-muted-dark)" strokeWidth="2" fill="none" />
            )}
            <text x="0" y="45" textAnchor="middle" className="text-xs font-bold fill-gray-800 dark:fill-white text-[10px]">{actor.name}</text>
            <text x="0" y="55" textAnchor="middle" className="text-[8px] fill-gray-500 uppercase tracking-widest">{actor.type}</text>
        </g>
    );

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <defs>
                <marker id="uc-arrow" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-teal)" />
                </marker>
                <marker id="uc-arrow-dashed" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="none" stroke="var(--accent-teal)" />
                </marker>
            </defs>

            {/* System Boundary */}
            <rect 
                x={centerX - systemWidth/2} 
                y={centerY - systemHeight/2} 
                width={systemWidth} 
                height={systemHeight} 
                className="fill-gray-50 dark:fill-gray-800/50 stroke-gray-300 dark:stroke-gray-600 stroke-1" 
            />
            <text x={centerX} y={centerY - systemHeight/2 + 20} textAnchor="middle" className="text-sm font-bold fill-gray-600 dark:fill-gray-400 uppercase tracking-widest">{diagram.title}</text>

            {/* Links */}
            {links.map((link, i) => {
                const start = nodePos[link.from];
                const end = nodePos[link.to];
                if (!start || !end) return null;

                const isIncludeExtend = link.type === 'Include' || link.type === 'Extend';

                return (
                    <g key={`link-${i}`}>
                        <line 
                            x1={start.x} y1={start.y} 
                            x2={end.x} y2={end.y} 
                            stroke="var(--accent-teal)" 
                            strokeWidth="1.5" 
                            strokeDasharray={isIncludeExtend ? "5,5" : ""}
                            markerEnd={isIncludeExtend ? "url(#uc-arrow)" : ""}
                        />
                        {isIncludeExtend && (
                            <text 
                                x={(start.x + end.x)/2} 
                                y={(start.y + end.y)/2} 
                                textAnchor="middle" 
                                className="text-[10px] fill-gray-600 bg-white px-1"
                            >
                                &lt;&lt;{link.type.toLowerCase()}&gt;&gt;
                            </text>
                        )}
                    </g>
                );
            })}

            {/* Use Cases */}
            {useCases.map((uc, i) => {
                const id = uc.id || `uc-${i}`;
                const pos = nodePos[id];
                if (!pos) return null;
                return (
                    <g key={`uc-group-${id}-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                        <ellipse cx="0" cy="0" rx="70" ry="30" className="fill-white dark:fill-gray-700 stroke-accent-teal stroke-2" />
                        <text x="0" y="0" dominantBaseline="middle" textAnchor="middle" className="text-xs font-medium fill-gray-900 dark:fill-white text-[10px] pointer-events-none" style={{ maxWidth: '120px' }}>
                            {uc.name}
                        </text>
                    </g>
                );
            })}

            {/* Actors */}
            {actors.map((actor, i) => {
                const id = actor.id || `actor-${i}`;
                const pos = nodePos[id];
                if (!pos) return null;
                return (
                    <g key={`actor-group-${id}-${i}`}>
                        {renderActor(actor, pos.x, pos.y)}
                    </g>
                );
            })}
        </svg>
    );
};

export const UseCaseModeler: React.FC<UseCaseModelerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [context, setContext] = useState(initiative.description);
    const [error, setError] = useState<string | null>(null);
    const [diagram, setDiagram] = useState<TUseCaseDiagram | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.useCaseDiagram) {
            setDiagram(initiative.artifacts.useCaseDiagram);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateUseCaseDiagram(context, initiative.sector);
            setDiagram(result);
            saveArtifact(initiative.id, 'useCaseDiagram', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate Use Case Diagram.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 mb-4">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserGroupIcon className="h-7 w-7 text-accent-teal" />
                        Intelligent Use Case Modeler
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize functional requirements and actor interactions (UML).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Scope</label>
                <div className="flex gap-4">
                    <textarea 
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-teal"
                        rows={2}
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Describe the system, users, and goals..."
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !context} className="flex-shrink-0 self-start mt-1">
                        {isLoading ? <Spinner /> : 'Model Use Cases'}
                    </Button>
                </div>
            </div>

            {diagram ? (
                <div className="flex-grow animate-fade-in-down overflow-auto custom-scrollbar">
                    <UseCaseVisualizer diagram={diagram} />
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <UserGroupIcon className="h-16 w-16 mb-4" />
                        <p>Define scope to visualize actors and use cases.</p>
                    </div>
                )
            )}
        </div>
    );
};
