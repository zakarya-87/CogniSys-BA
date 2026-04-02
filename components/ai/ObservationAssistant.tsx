
import React, { useState, useEffect } from 'react';
import { TInitiative, TObservationPlan } from '../../types';
import { generateObservationPlan } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface ObservationAssistantProps {
    initiative: TInitiative;
}

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ClipboardDocumentListIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;

export const ObservationAssistant: React.FC<ObservationAssistantProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [role, setRole] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activity, setActivity] = useState('');
    const [plan, setPlan] = useState<TObservationPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.observationPlan) {
            setPlan(initiative.artifacts.observationPlan);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!role.trim() || !activity.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateObservationPlan(role, activity, initiative.sector);
            setPlan(result);
            saveArtifact(initiative.id, 'observationPlan', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate observation plan.");
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
                        <EyeIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Observation Assistant
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Plan job shadowing and field studies to uncover hidden requirements (BABOK 10.31).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role to Observe</label>
                        <input 
                            type="text" 
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                            placeholder="e.g. Warehouse Picker, Triage Nurse"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Activity / Workflow</label>
                        <input 
                            type="text" 
                            value={activity}
                            onChange={(e) => setActivity(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                            placeholder="e.g. Order fulfillment process"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleGenerate} disabled={isLoading || !role || !activity}>
                        {isLoading ? <Spinner /> : 'Generate Field Guide'}
                    </Button>
                </div>
            </div>

            {plan && (
                <div className="flex-grow animate-fade-in-down flex flex-col gap-6">
                    <div className="bg-accent-purple/5 dark:bg-accent-purple/10 p-4 rounded-lg border border-accent-purple/10 dark:border-accent-purple/20 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-accent-purple dark:text-accent-purple/90">Observation Plan: {plan.role}</h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Focus: {plan.activity}</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-bold uppercase tracking-wider border border-accent-purple/20 dark:border-accent-purple/30">
                            Mode: {plan.mode}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                        {/* Checklist */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <ClipboardDocumentListIcon className="h-5 w-5" /> Field Checklist
                            </div>
                            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-grow">
                                {(plan.items || []).map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors group">
                                        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-accent-purple focus:ring-accent-purple" />
                                        <div className="flex-grow">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.whatToWatch}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Look for: {item.indicators}</p>
                                            <textarea 
                                                className="w-full mt-2 p-2 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 hidden group-hover:block focus:block"
                                                placeholder="Add notes..."
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Prompts */}
                        <div className="bg-accent-amber/5 dark:bg-accent-amber/10 p-4 rounded-lg border border-accent-amber/10 dark:border-accent-amber/20 h-fit">
                            <h4 className="font-bold text-accent-amber dark:text-accent-amber/80 mb-3 text-sm uppercase">Interview Prompts</h4>
                            <ul className="space-y-3">
                                {(plan.interviewPrompts || []).map((prompt, i) => (
                                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-accent-amber/5 p-2 rounded border border-accent-amber/10 dark:border-accent-amber/20 italic">
                                        "{prompt}"
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
