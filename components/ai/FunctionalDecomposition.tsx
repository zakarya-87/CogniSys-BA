
import React, { useState } from 'react';
import { TInitiative, TDecompositionNode } from '../../types';
import { generateFunctionalDecomposition } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface FunctionalDecompositionProps {
    initiative: TInitiative;
}

const RectangleGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125A2.25 2.25 0 014.5 4.875h15A2.25 2.25 0 0121.75 7.125v1.547a2.25 2.25 0 01-1.223 2.033l-8.25 4.125a2.25 2.25 0 01-2.054 0l-8.25-4.125A2.25 2.25 0 012.25 8.672V7.125z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.625a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0119.5 21h-15a2.25 2.25 0 01-2.25-2.25v-4.5z" /></svg>;

const TreeNode: React.FC<{ node: TDecompositionNode, level: number }> = ({ node, level }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    if (!node) return null;

    const hasChildren = node.children && node.children.length > 0;

    const typeColors = {
        'System': 'bg-accent-purple text-white',
        'Module': 'bg-accent-purple/80 text-white',
        'Function': 'bg-accent-emerald text-white',
        'Feature': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
    };

    return (
        <div className="flex flex-col items-center">
            <div 
                className={`p-3 rounded-lg shadow-md mb-4 text-sm font-bold min-w-[120px] text-center cursor-pointer transition-transform hover:scale-105 ${typeColors[node.type] || 'bg-gray-500'}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {node.label}
                <div className="text-[10px] font-normal opacity-80 uppercase mt-1">{node.type}</div>
            </div>
            
            {hasChildren && isExpanded && (
                <div className="flex flex-col items-center relative">
                    {/* Vertical connector from parent */}
                    <div className="w-px h-6 bg-gray-400 dark:bg-gray-500 absolute -top-4"></div>
                    
                    <div className="flex gap-6 items-start pt-2 relative">
                        {/* Horizontal connector bar */}
                        {node.children!.length > 1 && (
                            <div className="absolute top-2 left-0 right-0 h-px bg-gray-400 dark:bg-gray-500 mx-[calc(50%/node.children!.length)]"></div>
                        )}
                        
                        {node.children!.map((child, i) => (
                            <div key={child.id} className="flex flex-col items-center relative">
                                {/* Vertical connector to child */}
                                {node.children!.length > 1 && (
                                    <div className={`absolute -top-2 w-px h-2 bg-gray-400 dark:bg-gray-500`}></div>
                                )}
                                <TreeNode node={child} level={level + 1} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const FunctionalDecomposition: React.FC<FunctionalDecompositionProps> = ({ initiative }) => {
    const [context, setContext] = useState(initiative.title);
    const [tree, setTree] = useState<TDecompositionNode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!context.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateFunctionalDecomposition(context, initiative.sector);
            setTree(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate decomposition.");
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
                        <RectangleGroupIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Functional Decomposition
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Break down complex systems into manageable components (BABOK 10.22).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System / Process Name</label>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        placeholder="e.g. Warehouse Management System"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !context}>
                        {isLoading ? <Spinner /> : 'Decompose System'}
                    </Button>
                </div>
            </div>

            {tree ? (
                <div className="flex-grow overflow-auto custom-scrollbar p-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-center">
                    <div className="min-w-max">
                        <TreeNode node={tree} level={0} />
                    </div>
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <RectangleGroupIcon className="h-16 w-16 mb-4" />
                        <p>Enter a system name to visualize its hierarchy.</p>
                    </div>
                )
            )}
        </div>
    );
};
