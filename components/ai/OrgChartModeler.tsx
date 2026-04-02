
import React, { useState, useEffect } from 'react';
import { TInitiative, TOrgNode } from '../../types';
import { generateOrgChart } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface OrgChartModelerProps {
    initiative: TInitiative;
}

const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;

const TreeNode: React.FC<{ node: TOrgNode }> = ({ node }) => {
    const hasChildren = node.children && node.children.length > 0;

    const impactColor = {
        'High': 'border-accent-red bg-accent-red/5 dark:bg-accent-red/10 text-accent-red',
        'Medium': 'border-accent-amber bg-accent-amber/5 dark:bg-accent-amber/10 text-accent-amber',
        'Low': 'border-accent-emerald bg-accent-emerald/5 dark:bg-accent-emerald/10 text-accent-emerald'
    }[node.impact] || 'border-gray-300';

    return (
        <div className="flex flex-col items-center">
            <div className={`p-3 rounded-lg border-l-4 shadow-sm mb-6 min-w-[140px] text-center bg-white dark:bg-gray-800 ${impactColor}`}>
                <div className="font-bold text-sm">{node.title}</div>
                <div className="text-xs opacity-80 mt-1">{node.role}</div>
                <span className="text-[10px] uppercase font-bold tracking-wider mt-2 block opacity-60">Impact: {node.impact}</span>
            </div>
            
            {hasChildren && (
                <div className="flex flex-col items-center relative">
                    {/* Vertical connector from parent */}
                    <div className="w-px h-6 bg-gray-400 dark:bg-gray-500 absolute -top-6"></div>
                    
                    <div className="flex gap-8 items-start pt-2 relative">
                        {/* Horizontal connector bar */}
                        {node.children!.length > 1 && (
                            <div className="absolute top-0 left-0 right-0 h-px bg-gray-400 dark:bg-gray-500 mx-[calc(50%/node.children!.length)]"></div>
                        )}
                        
                        {node.children!.map((child, i) => (
                            <div key={child.id} className="flex flex-col items-center relative">
                                {/* Vertical connector to child */}
                                <div className="absolute -top-2 w-px h-2 bg-gray-400 dark:bg-gray-500"></div>
                                <TreeNode node={child} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const OrgChartModeler: React.FC<OrgChartModelerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [context, setContext] = useState(initiative.title);
    const [error, setError] = useState<string | null>(null);
    const [rootNode, setRootNode] = useState<TOrgNode | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.orgChart) {
            setRootNode(initiative.artifacts.orgChart);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!context.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateOrgChart(context, initiative.sector);
            setRootNode(result);
            saveArtifact(initiative.id, 'orgChart', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate Org Chart.");
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
                        <UserGroupIcon className="h-7 w-7 text-accent-purple" />
                        Organizational Modeler
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize roles, reporting structures, and change impact (BABOK 10.32).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Organizational Context</label>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        placeholder="e.g. Finance Department Restructuring"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !context}>
                        {isLoading ? <Spinner /> : 'Model Org Structure'}
                    </Button>
                </div>
            </div>

            {rootNode ? (
                <div className="flex-grow overflow-auto custom-scrollbar p-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-center">
                    <div className="min-w-max">
                        <TreeNode node={rootNode} />
                    </div>
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <UserGroupIcon className="h-16 w-16 mb-4" />
                        <p>Describe the context to model the organization.</p>
                    </div>
                )
            )}
        </div>
    );
};
