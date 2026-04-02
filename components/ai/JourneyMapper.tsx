import React, { useState } from 'react';
import { TInitiative, TJourneyMap } from '../../types';
import { generateJourneyMap } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Mermaid } from '../Mermaid';
import { escapeMermaidLabel } from '../../utils/aiUtils';

interface JourneyMapperProps {
    initiative: TInitiative;
}

const MapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>;
const FaceSmileIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>;

// Helper to convert JourneyMap to Mermaid string
const generateMermaidJourney = (map: TJourneyMap) => {
    let mermaid = 'journey\n';
    mermaid += `    title ${escapeMermaidLabel(map.persona)}: ${escapeMermaidLabel(map.scenario)}\n`;
    
    map.stages.forEach(stage => {
        mermaid += `    section ${escapeMermaidLabel(stage.name)}\n`;
        stage.actions.forEach(action => {
            mermaid += `      ${escapeMermaidLabel(action)}: ${stage.sentiment}: User\n`;
        });
    });
    
    return mermaid;
};

export const JourneyMapper: React.FC<JourneyMapperProps> = ({ initiative }) => {
    const [persona, setPersona] = useState('First-time User');
    const [scenario, setScenario] = useState('Sign up and complete first transaction');
    const [map, setMap] = useState<TJourneyMap | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mermaidChart, setMermaidChart] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!persona || !scenario) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateJourneyMap(initiative.title, initiative.sector, persona, scenario);
            setMap(result);
            setMermaidChart(generateMermaidJourney(result));
        } catch (error) {
            console.error(error);
            setError("Failed to generate journey map.");
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
                        <MapIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent User Journey Mapper
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize user experience, emotions, and touchpoints (BABOK 10.47).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Persona</label>
                        <input 
                            type="text" 
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                            placeholder="e.g. Busy Professional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal / Scenario</label>
                        <input 
                            type="text" 
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                            placeholder="e.g. Upgrade subscription plan"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleGenerate} disabled={isLoading || !persona || !scenario}>
                        {isLoading ? <Spinner /> : <><FaceSmileIcon className="h-5 w-5 mr-2"/> Map Experience</>}
                    </Button>
                </div>
            </div>

            {map && mermaidChart ? (
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in-down flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                            <span className="text-xs font-bold text-accent-purple uppercase tracking-wider">Experience Map</span>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{map.persona}: "{map.scenario}"</h3>
                        </div>
                    </div>
                    <div className="flex-grow flex justify-center items-center p-4">
                        <Mermaid chart={mermaidChart} />
                    </div>
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                        <MapIcon className="h-16 w-16 mb-4 opacity-20" />
                        <p>Define a persona and scenario to visualize their journey.</p>
                    </div>
                )
            )}
        </div>
    );
};
