
import React, { useState, useEffect } from 'react';
import { TInitiative, TBacklogItem, TRetroItem } from '../../types';
import { generateRetrospectiveAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface RetrospectiveProps {
    initiative: TInitiative;
    backlogItems: TBacklogItem[];
}

const HandThumbUpIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.033-1.084l2.2-2.826a.905.905 0 00.09-.546c-1.01-4.854-.137-9.126-.069-9.16a.75.75 0 011.476.27c.114 2.195.68 4.49 1.662 6.49.226.462.686.752 1.2.752 1.44 0 2.767.622 3.695 1.592.729.76 1.164 1.782 1.164 2.945 0 2.079-1.436 3.826-3.36 4.157C16.613 16.586 15.457 18 13.5 18H7.5c-2.079 0-3.826-1.436-4.157-3.36A4.492 4.492 0 013 13.5c0-1.728.963-3.242 2.418-4.018a.75.75 0 01.83 1.282A2.993 2.993 0 004.5 13.5c0 1.313.883 2.427 2.094 2.829C7.01 14.961 7.988 14 9 14h4.5c.653 0 1.153.75 1.153 1.5s-.5 1.5-1.153 1.5H9a.75.75 0 010 1.5h4.5c1.49 0 2.653-1.5 2.653-3s-1.163-3-2.653-3H9c-1.657 0-3 1.343-3 3v1.5" /></svg>;

export const Retrospective: React.FC<RetrospectiveProps> = ({ initiative, backlogItems }) => {
    const { saveArtifact } = useCatalyst();
    const [context, setContext] = useState('Sprint 1 completed. Login feature is live. Payment gateway delayed due to API issues.');
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<TRetroItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.retrospective) {
            setItems(initiative.artifacts.retrospective);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!context.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateRetrospectiveAnalysis(context, initiative.sector);
            const safeResult = Array.isArray(result) ? result : [];
            setItems(safeResult);
            saveArtifact(initiative.id, 'retrospective', safeResult);
        } catch (error) {
            console.error(error);
            setError("Failed to generate retrospective.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderColumn = (title: string, category: string, color: string) => {
        const categoryItems = (Array.isArray(items) ? items : []).filter(i => i.category === category);
        return (
            <div className={`flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-t-4 ${color}`}>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
                <div className="space-y-3">
                    {categoryItems.map((item, i) => (
                        <div key={i} className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm text-sm text-gray-700 dark:text-gray-200">
                            {item.text}
                        </div>
                    ))}
                    {categoryItems.length === 0 && <p className="text-xs text-gray-400 italic">No items.</p>}
                </div>
            </div>
        );
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
                        <HandThumbUpIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Retrospective
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Facilitate "Inspect & Adapt" with AI insights (BABOK 8.1).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sprint/Release Context</label>
                <div className="flex gap-4">
                    <textarea 
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        rows={2}
                        placeholder="Summary of what happened (e.g. Velocity was low, QA was bottlenecked...)"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !context} className="flex-shrink-0 self-start mt-1">
                        {isLoading ? <Spinner /> : 'Analyze & Suggest'}
                    </Button>
                </div>
            </div>

            <div className="flex-grow flex flex-col lg:flex-row gap-6 animate-fade-in-down overflow-y-auto custom-scrollbar">
                {renderColumn('Went Well', 'Went Well', 'border-accent-emerald')}
                {renderColumn('Needs Improvement', 'Needs Improvement', 'border-accent-red')}
                {renderColumn('Action Items', 'Action Items', 'border-accent-purple')}
            </div>
        </div>
    );
};
