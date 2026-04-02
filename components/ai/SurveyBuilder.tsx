
import React, { useState, useEffect } from 'react';
import { TInitiative, TSurvey } from '../../types';
import { generateSurvey } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface SurveyBuilderProps {
    initiative: TInitiative;
}

const ClipboardDocumentCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [goal, setGoal] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [audience, setAudience] = useState('');
    const [survey, setSurvey] = useState<TSurvey | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.survey) {
            setSurvey(initiative.artifacts.survey);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!goal || !audience) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateSurvey(goal, audience, initiative.sector);
            setSurvey(result);
            saveArtifact(initiative.id, 'survey', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate survey.");
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
                        <ClipboardDocumentCheckIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Survey Builder
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Generate research questionnaires for elicitation (BABOK 10.45).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Research Goal</label>
                        <input 
                            type="text" 
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                            placeholder="e.g. Validate interest in biometric login"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                        <input 
                            type="text" 
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                            placeholder="e.g. Current mobile app users, aged 18-35"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleGenerate} disabled={isLoading || !goal || !audience}>
                        {isLoading ? <Spinner /> : 'Design Survey'}
                    </Button>
                </div>
            </div>

            {survey && (
                <div className="flex-grow animate-fade-in-down bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm max-w-3xl mx-auto w-full flex flex-col overflow-hidden">
                    <div className="bg-accent-purple p-6 text-white">
                        <h3 className="text-2xl font-bold">{survey.title}</h3>
                        <p className="text-white/80 mt-2 text-sm">{survey.intro}</p>
                    </div>
                    
                    <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-grow bg-gray-50 dark:bg-gray-800/50">
                        {(survey.questions || []).map((q, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <p className="font-semibold text-gray-900 dark:text-white mb-3">
                                    {i + 1}. {q.text} <span className="text-accent-red">*</span>
                                </p>
                                
                                {q.type === 'MultipleChoice' && (
                                    <div className="space-y-2">
                                        {(q.options || []).map((opt, j) => (
                                            <label key={j} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <input type="radio" name={`q-${i}`} className="text-accent-purple focus:ring-accent-purple" />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'Likert' && (
                                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                                        {[1, 2, 3, 4, 5].map(val => (
                                            <label key={val} className="flex flex-col items-center cursor-pointer">
                                                <input type="radio" name={`q-${i}`} className="mb-1 text-accent-purple focus:ring-accent-purple" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{val}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'Open' && (
                                    <textarea 
                                        rows={3} 
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900" 
                                        placeholder="Your answer..." 
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-sm text-gray-500 mb-4">{survey.closing}</p>
                        <Button onClick={() => alert("Simulated: Survey exported to JSON/Forms.")} className="bg-accent-emerald hover:bg-accent-emerald/90">
                            Export Survey
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
