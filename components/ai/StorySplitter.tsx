
import React, { useState } from 'react';
import { TInitiative, TSplitSuggestion, BacklogItemType, BacklogItemPriority } from '../../types';
import { generateStorySplits } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface StorySplitterProps {
    initiative: TInitiative;
    onAddToBacklog: (items: any[]) => void;
}

const ScissorsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" /></svg>;
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;

export const StorySplitter: React.FC<StorySplitterProps> = ({ initiative, onAddToBacklog }) => {
    const [epic, setEpic] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<TSplitSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStrategyIndex, setSelectedStrategyIndex] = useState<number | null>(null);

    const handleSplit = async () => {
        if (!epic.trim()) return;
        setError(null);
        setIsLoading(true);
        setSelectedStrategyIndex(null);
        try {
            const result = await generateStorySplits(epic, initiative.sector);
            setSuggestions(result);
            if (result.length > 0) setSelectedStrategyIndex(0);
        } catch (error) {
            console.error(error);
            setError("Failed to split story.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdopt = () => {
        if (selectedStrategyIndex === null) return;
        const strategy = suggestions[selectedStrategyIndex];
        
        const newItems = (strategy.stories || []).map(story => ({
            id: `split-${Date.now()}-${Math.random()}`,
            title: story.title,
            type: 'User Story',
            priority: 'Medium',
            status: 'To Do'
        }));
        
        onAddToBacklog(newItems);
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
                        <ScissorsIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Story Splitter
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Break down complex Epics into manageable slices using SPIDR patterns.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Large Story / Epic</label>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <textarea 
                        className="flex-grow w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        rows={3}
                        value={epic}
                        onChange={(e) => setEpic(e.target.value)}
                        placeholder="e.g. As a portfolio manager, I want to rebalance all client accounts based on new model weights so that risk is minimized."
                    />
                    <Button onClick={handleSplit} disabled={isLoading || !epic} className="flex-shrink-0 mb-1">
                        {isLoading ? <Spinner /> : 'Decompose'}
                    </Button>
                </div>
            </div>

            {suggestions.length > 0 && (
                <div className="flex-grow animate-fade-in-down flex flex-col lg:flex-row gap-6">
                    {/* Sidebar: Strategies */}
                    <div className="w-full lg:w-1/4 space-y-2">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Splitting Strategies</h3>
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedStrategyIndex(index)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    selectedStrategyIndex === index
                                        ? 'bg-accent-purple/10 border-accent-purple text-accent-purple dark:bg-accent-purple/20'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <div className="font-bold text-sm">{suggestion.strategy}</div>
                                <div className="text-xs opacity-70 mt-1 line-clamp-2">{suggestion.description}</div>
                            </button>
                        ))}
                    </div>

                    {/* Main: Stories Preview */}
                    <div className="flex-grow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col">
                        {selectedStrategyIndex !== null && (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                                            {suggestions[selectedStrategyIndex].strategy}
                                        </h3>
                                        <p className="text-sm text-gray-500">{suggestions[selectedStrategyIndex].description}</p>
                                    </div>
                                    <Button onClick={handleAdopt} className="bg-accent-emerald hover:bg-accent-emerald/90">
                                        <CheckIcon className="h-5 w-5 mr-2" /> Adopt This Split
                                    </Button>
                                </div>

                                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-grow pr-2">
                                    {(suggestions[selectedStrategyIndex].stories || []).map((story, i) => (
                                        <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-accent-purple/10 text-accent-purple font-bold rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{story.title}</h4>
                                                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-700">
                                                        <strong>AC:</strong> {story.acceptanceCriteria}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
