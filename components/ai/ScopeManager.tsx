
import React, { useState, useEffect } from 'react';
import { TInitiative, TScopeStatement } from '../../types';
import { generateScopeStatement } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface ScopeManagerProps {
    initiative: TInitiative;
}

const StopIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const GlobeAltIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;

const ContextDiagram: React.FC<{ data: TScopeStatement['contextDiagram'] }> = ({ data }) => {
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerRadius = 60;
    const orbitRadius = 180;

    const entities = data?.externalEntities || [];
    const angleStep = (2 * Math.PI) / (entities.length || 1);

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <defs>
                <marker id="scope-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" className="fill-gray-400 dark:fill-gray-500" />
                </marker>
            </defs>

            {/* Central System */}
            <circle cx={centerX} cy={centerY} r={centerRadius} className="fill-accent-purple/10 stroke-accent-purple dark:fill-accent-purple/20 dark:stroke-accent-purple/80 stroke-2" />
            <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-accent-purple dark:fill-accent-purple/90 text-[10px] max-w-[80px]">
                {data?.systemName || 'System'}
            </text>

            {/* External Entities */}
            {entities.map((entity, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = centerX + orbitRadius * Math.cos(angle);
                const y = centerY + orbitRadius * Math.sin(angle);

                return (
                    <g key={i}>
                        {/* Connection Line */}
                        <line 
                            x1={centerX + centerRadius * Math.cos(angle)} 
                            y1={centerY + centerRadius * Math.sin(angle)} 
                            x2={x - 40 * Math.cos(angle)} // Stop before rect
                            y2={y - 25 * Math.sin(angle)} 
                            className="stroke-gray-400 stroke-1" 
                            markerEnd="url(#scope-arrow)"
                        />
                        
                        {/* Entity Box */}
                        <rect x={x - 40} y={y - 20} width={80} height={40} rx="4" className="fill-gray-100 stroke-gray-600 dark:fill-gray-800 dark:stroke-gray-400 stroke-1" />
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-medium fill-gray-800 dark:fill-gray-200">
                            {entity}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

export const ScopeManager: React.FC<ScopeManagerProps> = ({ initiative }) => {
    console.log("ScopeManager rendered");
    const { saveArtifact } = useCatalyst();
    const [scope, setScope] = useState<TScopeStatement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.scopeStatement) {
            setScope(initiative.artifacts.scopeStatement);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateScopeStatement(initiative.title, initiative.sector);
            setScope(result);
            saveArtifact(initiative.id, 'scopeStatement', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate scope statement.");
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
                        <StopIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Scope Manager
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Define project boundaries and context (BABOK 10.41).
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Define Scope'}
                </Button>
            </div>

            {!scope && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <GlobeAltIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Prevent scope creep. Click "Define Scope" to generate In/Out lists and a Context Diagram.
                    </p>
                </div>
            )}

            {scope && (
                <div className="flex-grow animate-fade-in-down overflow-y-auto custom-scrollbar pr-2 space-y-8">
                    
                    {/* Context Diagram */}
                    <div className="flex flex-col">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 text-sm uppercase">Context Diagram (Level 0)</h3>
                        <ContextDiagram data={scope.contextDiagram} />
                    </div>

                    {/* Scope Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* In Scope */}
                        <div className="bg-accent-emerald/10 dark:bg-accent-emerald/20 p-4 rounded-lg border border-accent-emerald/20 dark:border-accent-emerald/80">
                            <h3 className="font-bold text-accent-emerald dark:text-accent-emerald/90 mb-3 flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5"/> In-Scope
                            </h3>
                            <ul className="space-y-2">
                                {(scope.inScope || []).map((item, i) => (
                                    <li key={i} className="text-sm text-accent-emerald dark:text-accent-emerald/80 flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 bg-accent-emerald rounded-full"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Out Scope */}
                        <div className="bg-accent-red/10 dark:bg-accent-red/20 p-4 rounded-lg border border-accent-red/20 dark:border-accent-red/80">
                            <h3 className="font-bold text-accent-red dark:text-accent-red/90 mb-3 flex items-center gap-2">
                                <XCircleIcon className="h-5 w-5"/> Out-of-Scope
                            </h3>
                            <ul className="space-y-2">
                                {(scope.outScope || []).map((item, i) => (
                                    <li key={i} className="text-sm text-accent-red dark:text-accent-red/80 flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 bg-accent-red rounded-full"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Assumptions */}
                        <div className="bg-accent-amber/10 dark:bg-accent-amber/20 p-4 rounded-lg border border-accent-amber/20 dark:border-accent-amber/80">
                            <h3 className="font-bold text-accent-amber dark:text-accent-amber/90 mb-3 text-sm uppercase">Assumptions</h3>
                            <ul className="list-disc list-inside text-sm text-accent-amber dark:text-accent-amber/80 space-y-1">
                                {(scope.assumptions || []).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>

                        {/* Constraints */}
                        <div className="bg-gray-100 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase">Constraints</h3>
                            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                {(scope.constraints || []).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
