
import React, { useState, useEffect } from 'react';
import { TInitiative, TApiEndpoint, TApiMethod } from '../../types';
import { generateApiSpec } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface InterfaceDesignerProps {
    initiative: TInitiative;
}

const CommandLineIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18.75V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21z" /></svg>;
const CodeBracketIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>;

const methodColors: { [key in TApiMethod]: string } = {
    'GET': 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
    'POST': 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
    'PUT': 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
    'DELETE': 'bg-accent-red/10 text-accent-red border-accent-red/20',
    'PATCH': 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
};

export const InterfaceDesigner: React.FC<InterfaceDesignerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [endpoints, setEndpoints] = useState<TApiEndpoint[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.apiSpec && Array.isArray(initiative.artifacts.apiSpec)) {
            setEndpoints(initiative.artifacts.apiSpec);
        } else {
            setEndpoints([]);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateApiSpec(initiative.title, initiative.description, initiative.sector);
            setEndpoints(result);
            saveArtifact(initiative.id, 'apiSpec', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate API specification.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedEndpoint(prev => prev === id ? null : id);
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
                        <CodeBracketIcon className="h-7 w-7 text-accent-purple" />
                        API & Interface Designer
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Define the technical interfaces (APIs) required for <strong>{initiative.sector}</strong> integration.
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Draft API Spec'}
                </Button>
            </div>

            {(endpoints || []).length === 0 && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <CommandLineIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Interfaces Defined</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Click "Draft API Spec" to have the AI propose the REST endpoints needed for this system.
                    </p>
                </div>
            )}

            <div className="space-y-3 animate-fade-in-down">
                {(endpoints || []).map(ep => (
                    <div key={ep.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div 
                            className={`p-3 flex items-center cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${expandedEndpoint === ep.id ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                            onClick={() => toggleExpand(ep.id)}
                        >
                            <div className={`w-20 flex-shrink-0 text-center text-xs font-bold px-2 py-1 rounded border ${methodColors[ep.method]}`}>
                                {ep.method}
                            </div>
                            <div className="ml-4 flex-grow font-mono text-sm text-gray-700 dark:text-gray-300">
                                {ep.path}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mr-4 hidden sm:block">
                                {ep.summary}
                            </div>
                            <div className="text-gray-400 text-xs">{expandedEndpoint === ep.id ? '▲' : '▼'}</div>
                        </div>

                        {expandedEndpoint === ep.id && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 italic">
                                    {ep.summary}
                                </p>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {ep.requestBody && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Request Body</h4>
                                            <pre className="bg-gray-900 text-green-400 p-3 rounded-md text-xs font-mono overflow-x-auto custom-scrollbar">
                                                {ep.requestBody}
                                            </pre>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Response Example</h4>
                                        <pre className="bg-gray-900 text-accent-cyan p-3 rounded-md text-xs font-mono overflow-x-auto custom-scrollbar">
                                            {ep.responseBody}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
