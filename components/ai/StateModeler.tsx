
import React, { useState, useEffect } from 'react';
import { TInitiative, TStateModel } from '../../types';
import { generateStateModel } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';
import { Mermaid } from '../Mermaid';

interface StateModelerProps {
    initiative: TInitiative;
}

const ArrowPathRoundedSquareIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /></svg>;

// Helper to convert StateModel to Mermaid string
const generateMermaidString = (model: TStateModel) => {
    let mermaid = 'stateDiagram-v2\n';
    
    // Map states
    model.states.forEach(state => {
        if (state.type === 'Initial') {
            mermaid += `    [*] --> ${state.id}\n`;
        } else if (state.type === 'Final') {
            mermaid += `    ${state.id} --> [*]\n`;
        }
    });

    // Map transitions
    model.transitions.forEach(trans => {
        mermaid += `    ${trans.from} --> ${trans.to} : ${trans.label}\n`;
    });
    
    return mermaid;
};

export const StateModeler: React.FC<StateModelerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [entityName, setEntityName] = useState('Loan Application');
    const [error, setError] = useState<string | null>(null);
    const [model, setModel] = useState<TStateModel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mermaidChart, setMermaidChart] = useState<string | null>(null);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.stateModel) {
            setModel(initiative.artifacts.stateModel);
            setMermaidChart(generateMermaidString(initiative.artifacts.stateModel));
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!entityName.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateStateModel(initiative.title, initiative.sector, entityName);
            setModel(result);
            setMermaidChart(generateMermaidString(result));
            saveArtifact(initiative.id, 'stateModel', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate state model.");
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
                        <ArrowPathRoundedSquareIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent State Modeler
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize the lifecycle (Finite State Machine) of key entities (BABOK 10.44).
                    </p>
                </div>
            </div>

            <div className="flex items-end gap-4 mb-6">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Entity</label>
                    <input 
                        type="text" 
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                        placeholder="e.g., Order, Ticket, Patient Enrollment"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                    />
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || !entityName}>
                    {isLoading ? <Spinner /> : 'Generate Lifecycle'}
                </Button>
            </div>

            <div className="flex-grow bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                {!model || !mermaidChart ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ArrowPathRoundedSquareIcon className="h-16 w-16 mb-4 opacity-20" />
                        <p>Define an entity to visualize its states and transitions.</p>
                    </div>
                ) : (
                    <div className="w-full h-full overflow-auto custom-scrollbar flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                            <h3 className="font-bold text-gray-800 dark:text-white">{model.entityName} Lifecycle</h3>
                        </div>
                        <div className="flex-grow flex justify-center items-center p-4">
                            <Mermaid chart={mermaidChart} />
                        </div>
                        
                        {/* Transition Table */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-gray-500 uppercase bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-3 py-2">From State</th>
                                        <th className="px-3 py-2">Trigger / Action</th>
                                        <th className="px-3 py-2">Condition</th>
                                        <th className="px-3 py-2">To State</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {(Array.isArray(model?.transitions) ? model.transitions : []).map((t, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-2 font-medium">{t.from}</td>
                                            <td className="px-3 py-2 text-accent-purple dark:text-accent-purple/80">{t.label}</td>
                                            <td className="px-3 py-2 italic text-gray-500">{t.condition}</td>
                                            <td className="px-3 py-2 font-medium">{t.to}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
