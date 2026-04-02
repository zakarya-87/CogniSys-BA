
import React, { useState, useEffect } from 'react';
import { TInitiative, TFocusGroupResult } from '../../types';
import { runFocusGroup } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface FocusGroupSimulatorProps {
    initiative: TInitiative;
}

const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const ChatBubbleLeftRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>;

export const FocusGroupSimulator: React.FC<FocusGroupSimulatorProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [topic, setTopic] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<TFocusGroupResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.focusGroupResult) {
            setResult(initiative.artifacts.focusGroupResult);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleRun = async () => {
        if (!topic.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const data = await runFocusGroup(topic, initiative.sector);
            setResult(data);
            saveArtifact(initiative.id, 'focusGroupResult', data);
        } catch (error) {
            console.error(error);
            setError("Failed to run focus group simulation.");
        } finally {
            setIsLoading(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        if (sentiment === 'Positive') return 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20';
        if (sentiment === 'Negative') return 'bg-accent-red/10 text-accent-red border border-accent-red/20';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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
                        Intelligent Focus Group Simulator
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Simulate multi-stakeholder discussions to uncover conflicts (BABOK 10.21).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discussion Topic / Concept</label>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        placeholder="e.g. Switching to a subscription pricing model"
                    />
                    <Button onClick={handleRun} disabled={isLoading || !topic}>
                        {isLoading ? <Spinner /> : 'Convene Group'}
                    </Button>
                </div>
            </div>

            {result && (
                <div className="flex-grow animate-fade-in-down flex flex-col gap-6">
                    
                    {/* Participants */}
                    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                        {(result.participants || []).map((p, i) => (
                            <div key={i} className="min-w-[180px] bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border-t-4 border-gray-300 dark:border-gray-600" style={{ borderColor: p.avatarColor }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs" style={{ backgroundColor: p.avatarColor }}>
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.role}</p>
                                    </div>
                                </div>
                                <p className="text-xs italic text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 p-1 rounded">
                                    "{p.archetype}"
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-[400px]">
                        {/* Transcript */}
                        <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <ChatBubbleLeftRightIcon className="h-5 w-5" /> Discussion Transcript
                            </div>
                            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-grow max-h-[500px]">
                                {(result.script || []).map((line, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex-shrink-0 w-24 text-xs font-bold text-gray-500 dark:text-gray-400 text-right pt-1">
                                            {line.speakerName}
                                        </div>
                                        <div className={`flex-grow p-3 rounded-lg text-sm shadow-sm ${getSentimentColor(line.sentiment)}`}>
                                            {line.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Analysis */}
                        <div className="space-y-6">
                            <div className="bg-accent-purple/10 p-4 rounded-lg border border-accent-purple/20 text-center">
                                <h3 className="text-sm font-bold text-accent-purple uppercase">Group Consensus</h3>
                                <div className="mt-2 relative w-32 h-32 mx-auto flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-accent-purple/20" />
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={351} strokeDashoffset={351 - (351 * result.consensusLevel) / 100} className="text-accent-purple" />
                                    </svg>
                                    <span className="absolute text-2xl font-black text-accent-purple">{result.consensusLevel}%</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3 border-b pb-2 dark:border-gray-700">Key Findings</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {result.summary}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
