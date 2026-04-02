
import React, { useState, useEffect } from 'react';
import { TInitiative, TTechniqueGuide } from '../../types';
import { generateTechniqueGuide } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface GenericTechniqueAssistantProps {
    techniqueName: string;
    initiative: TInitiative;
}

const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const PencilSquareIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>;

export const GenericTechniqueAssistant: React.FC<GenericTechniqueAssistantProps> = ({ techniqueName, initiative }) => {
    const [guide, setGuide] = useState<TTechniqueGuide | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'Guide' | 'Draft'>('Guide');
    const [userDraft, setUserDraft] = useState('');

    // Auto-generate when technique changes
    useEffect(() => {
        if (techniqueName) {
            handleGenerate();
        }
    }, [techniqueName]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setGuide(null);
        try {
            const result = await generateTechniqueGuide(techniqueName, initiative.description, initiative.sector);
            setGuide(result);
            setUserDraft(result.draftContent); // Pre-fill editor
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-start mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <SparklesIcon className="h-6 w-6 text-accent-purple" />
                        {techniqueName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Universal Technique Assistant
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <Spinner /> : 'Refresh AI Guide'}
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="mt-4 text-gray-500">Consulting Methodology Knowledge Base...</p>
                </div>
            )}

            {guide && !isLoading && (
                <div className="flex-grow flex flex-col">
                    <div className="flex mb-4">
                        <button
                            onClick={() => setActiveTab('Guide')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'Guide'
                                    ? 'border-accent-purple text-accent-purple'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <BookOpenIcon className="h-4 w-4 inline mr-2" />
                            Methodology Guide
                        </button>
                        <button
                            onClick={() => setActiveTab('Draft')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'Draft'
                                    ? 'border-accent-purple text-accent-purple'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <PencilSquareIcon className="h-4 w-4 inline mr-2" />
                            AI Workbench
                        </button>
                    </div>

                    {activeTab === 'Guide' ? (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto animate-fade-in-down">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Contextual Definition</h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                                {guide.definition}
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Execution Steps</h3>
                            <ol className="list-decimal list-inside space-y-2">
                                {(guide.steps || []).map((step, i) => (
                                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col animate-fade-in-down">
                            <div className="bg-accent-purple/10 p-3 rounded-t-lg border border-accent-purple/20 text-xs text-accent-purple">
                                <strong>AI Suggestion:</strong> This is a draft based on your initiative context. Edit and refine it below.
                            </div>
                            <textarea
                                value={userDraft}
                                onChange={(e) => setUserDraft(e.target.value)}
                                className="flex-grow w-full p-4 border border-gray-300 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-800 font-mono text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-accent-purple"
                            />
                            <div className="mt-4 flex justify-end">
                                <button 
                                    onClick={() => navigator.clipboard.writeText(userDraft)}
                                    className="text-sm text-accent-purple hover:underline"
                                >
                                    Copy to Clipboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
