
import React, { useState } from 'react';
import { TInitiative, TMindMapNode } from '../../types';
import { generateMindMap } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Mermaid } from '../Mermaid';
import { escapeMermaidLabel } from '../../utils/aiUtils';
import { SafeRenderer } from '../ui/SafeRenderer';

interface MindMapperProps {
    initiative: TInitiative;
}

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>;

const generateMermaidMindMap = (node: TMindMapNode) => {
    let mermaid = 'mindmap\n';
    
    const traverse = (n: TMindMapNode, depth: number) => {
        const indent = '    '.repeat(depth);
        mermaid += `${indent}${escapeMermaidLabel(n.label)}\n`;
        if (n.children) {
            n.children.forEach(child => traverse(child, depth + 1));
        }
    };
    
    traverse(node, 1);
    return mermaid;
};

export const MindMapper: React.FC<MindMapperProps> = ({ initiative }) => {
    const [topic, setTopic] = useState('Sustainable Supply Chain');
    const [error, setError] = useState<string | null>(null);
    const [map, setMap] = useState<TMindMapNode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mermaidChart, setMermaidChart] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateMindMap(topic, initiative.sector);
            setMap(result);
            setMermaidChart(generateMermaidMindMap(result));
        } catch (error) {
            console.error(error);
            setError("Failed to generate Mind Map.");
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
                        <SparklesIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Mind Mapper
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visual brainstorming and concept decomposition (BABOK 10.29).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Central Topic</label>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        placeholder="e.g. Mobile App Features"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !topic}>
                        {isLoading ? <Spinner /> : 'Generate Map'}
                    </Button>
                </div>
            </div>

            {map && mermaidChart ? (
                <div className="flex-grow animate-fade-in-down overflow-auto custom-scrollbar bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 relative">
                    <SafeRenderer componentName="MermaidChart">
                        <Mermaid chart={mermaidChart} />
                    </SafeRenderer>
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <SparklesIcon className="h-16 w-16 mb-4" />
                        <p>Enter a topic to start brainstorming.</p>
                    </div>
                )
            )}
        </div>
    );
};
