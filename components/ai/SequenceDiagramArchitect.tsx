
import React, { useState, useEffect } from 'react';
import { TInitiative, TSequenceDiagram } from '../../types';
import { generateSequenceDiagram } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';
import { Mermaid } from '../Mermaid';
import { escapeMermaidLabel } from '../../utils/aiUtils';

interface SequenceDiagramArchitectProps {
    initiative: TInitiative;
}

const CodeBracketSquareIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 20.25H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>;

const generateMermaidSequenceDiagram = (diagram: TSequenceDiagram) => {
    let mermaid = 'sequenceDiagram\n';
    
    diagram.participants.forEach(p => {
        mermaid += `    participant ${p.id} as ${escapeMermaidLabel(p.name)}\n`;
    });
    
    diagram.messages.forEach(msg => {
        const arrow = msg.type === 'Response' ? '-->>' : '->>';
        mermaid += `    ${msg.from}${arrow}${msg.to}: ${escapeMermaidLabel(msg.label)}\n`;
    });
    
    return mermaid;
};

export const SequenceDiagramArchitect: React.FC<SequenceDiagramArchitectProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [scenario, setScenario] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [diagram, setDiagram] = useState<TSequenceDiagram | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mermaidChart, setMermaidChart] = useState<string | null>(null);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.sequenceDiagram) {
            setDiagram(initiative.artifacts.sequenceDiagram);
            setMermaidChart(generateMermaidSequenceDiagram(initiative.artifacts.sequenceDiagram));
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!scenario.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateSequenceDiagram(initiative.title, initiative.sector, scenario);
            setDiagram(result);
            setMermaidChart(generateMermaidSequenceDiagram(result));
            saveArtifact(initiative.id, 'sequenceDiagram', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate Sequence Diagram.");
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
                        <CodeBracketSquareIcon className="h-7 w-7 text-accent-purple" />
                        Sequence Diagram Architect
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize logic flow and object interactions (BABOK 10.42).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Usage Scenario</label>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        placeholder="e.g. User resets password via email link"
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !scenario}>
                        {isLoading ? <Spinner /> : 'Model Logic'}
                    </Button>
                </div>
            </div>

            {diagram && mermaidChart ? (
                <div className="flex-grow animate-fade-in-down overflow-auto custom-scrollbar">
                    <h3 className="text-center font-bold text-gray-800 dark:text-gray-200 mb-4">{diagram.title}</h3>
                    <Mermaid chart={mermaidChart} />
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <CodeBracketSquareIcon className="h-16 w-16 mb-4" />
                        <p>Define a scenario to visualize system interactions.</p>
                    </div>
                )
            )}
        </div>
    );
};
