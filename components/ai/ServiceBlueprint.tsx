
import React, { useState } from 'react';
import { TInitiative, TServiceBlueprint, TBlueprintLayer } from '../../types';
import { generateServiceBlueprint } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Mermaid } from '../Mermaid';
import { escapeMermaidLabel } from '../../utils/aiUtils';

interface ServiceBlueprintProps {
    initiative: TInitiative;
}

const LayersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;

const generateMermaidServiceBlueprint = (blueprint: TServiceBlueprint) => {
    let mermaid = 'graph TD\n';
    mermaid += `    %% Service Blueprint: ${blueprint.scenario}\n`;
    
    const layers: TBlueprintLayer[] = ['Physical Evidence', 'Customer Action', 'Frontstage', 'Backstage', 'Support'];
    
    layers.forEach((layer) => {
        mermaid += `    subgraph ${layer.replace(' ', '_')}[${layer}]\n`;
        const layerSteps = blueprint.steps.filter(s => s.layer === layer);
        layerSteps.forEach(step => {
            mermaid += `        step_${step.id}["${escapeMermaidLabel(step.text)}"]\n`;
        });
        mermaid += `    end\n`;
    });
    
    return mermaid;
};

export const ServiceBlueprint: React.FC<ServiceBlueprintProps> = ({ initiative }) => {
    const [scenario, setScenario] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [blueprint, setBlueprint] = useState<TServiceBlueprint | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mermaidChart, setMermaidChart] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!scenario.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateServiceBlueprint(scenario, initiative.sector);
            setBlueprint(result);
            setMermaidChart(generateMermaidServiceBlueprint(result));
        } catch (error) {
            console.error(error);
            setError("Failed to generate service blueprint.");
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
                        <LayersIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Service Blueprint
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Map the full ecosystem of a service interaction (BABOK 10.42).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Scenario</label>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        placeholder="e.g. Customer returns a defective product via app"
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !scenario}>
                        {isLoading ? <Spinner /> : 'Blueprint Service'}
                    </Button>
                </div>
            </div>

            {blueprint && mermaidChart && (
                <div className="flex-grow animate-fade-in-down border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 text-center border-b pb-4 dark:border-gray-700">
                        Scenario: {blueprint.scenario}
                    </h3>
                    <div className="flex-grow flex justify-center items-center p-4">
                        <Mermaid chart={mermaidChart} />
                    </div>
                </div>
            )}
        </div>
    );
};
