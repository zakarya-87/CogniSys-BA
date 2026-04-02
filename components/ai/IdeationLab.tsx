
import React, { useState } from 'react';
import { TInitiative, TIdea } from '../../types';
import { generateBrainstormingIdeas } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface IdeationLabProps {
    initiative: TInitiative;
}

const LightBulbIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-11.62a6.01 6.01 0 00-3 0a6.01 6.01 0 001.5 11.62z" /></svg>;
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>;
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;

export const IdeationLab: React.FC<IdeationLabProps> = ({ initiative }) => {
    const [problem, setProblem] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [technique, setTechnique] = useState<'Brainstorming' | 'SCAMPER' | 'Reverse'>('Brainstorming');
    const [ideas, setIdeas] = useState<TIdea[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!problem.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const newIdeas = await generateBrainstormingIdeas(problem, technique, initiative.sector);
            const ideasArray = Array.isArray(newIdeas) ? newIdeas : (newIdeas as any).ideas || [];
            setIdeas(ideasArray);
        } catch (error) {
            console.error(error);
            setError("Failed to generate ideas.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVote = (id: string) => {
        setIdeas(prev => (Array.isArray(prev) ? prev : []).map(idea => 
            idea.id === id ? { ...idea, votes: idea.votes + 1 } : idea
        ));
    };

    const colors = [
        'bg-accent-amber/20 text-accent-amber rotate-1 border border-accent-amber/30',
        'bg-accent-emerald/20 text-accent-emerald -rotate-1 border border-accent-emerald/30',
        'bg-accent-red/20 text-accent-red rotate-2 border border-accent-red/30',
        'bg-accent-purple/20 text-accent-purple -rotate-2 border border-accent-purple/30',
        'bg-accent-amber/30 text-accent-amber rotate-1 border border-accent-amber/40',
        'bg-accent-purple/30 text-accent-purple -rotate-1 border border-accent-purple/40'
    ];

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
                        <LightBulbIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Ideation Lab
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Generate innovative solutions using creative frameworks (BABOK 10.5).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-grow w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Problem Statement</label>
                        <input 
                            type="text" 
                            value={problem}
                            onChange={(e) => setProblem(e.target.value)}
                            placeholder="e.g., Users find the onboarding process too long."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technique</label>
                        <select 
                            value={technique}
                            onChange={(e) => setTechnique(e.target.value as any)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        >
                            <option value="Brainstorming">Standard Brainstorming</option>
                            <option value="SCAMPER">SCAMPER (Innovation)</option>
                            <option value="Reverse">Reverse Brainstorming</option>
                        </select>
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading || !problem}>
                        {isLoading ? <Spinner /> : 'Brainstorm'}
                    </Button>
                </div>
            </div>

            {!ideas.length && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <SparklesIcon className="h-16 w-16 mb-4" />
                    <p>Enter a problem to start ideating.</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-down overflow-y-auto custom-scrollbar p-2">
                {(ideas || []).map((idea, i) => (
                    <div 
                        key={idea.id} 
                        className={`p-4 shadow-lg rounded-sm ${colors[i % colors.length]} transition-transform hover:scale-105 hover:z-10 relative min-h-[150px] flex flex-col justify-between`}
                    >
                        <div>
                            <span className="text-[10px] uppercase font-bold opacity-70 block mb-2 tracking-wider">{idea.type}</span>
                            <p className="font-handwriting text-lg leading-tight font-medium">{idea.text}</p>
                        </div>
                        <div className="flex justify-end mt-3 pt-2 border-t border-black/10">
                            <button 
                                onClick={() => handleVote(idea.id)}
                                className="flex items-center gap-1 text-xs font-bold hover:bg-black/10 px-2 py-1 rounded-full transition-colors"
                            >
                                <PlusIcon className="h-3 w-3" /> {idea.votes} Votes
                            </button>
                        </div>
                        {/* Pin Effect */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent-red shadow-sm border border-accent-red/50"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};
