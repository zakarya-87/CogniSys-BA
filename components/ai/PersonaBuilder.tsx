
import React, { useState, useEffect } from 'react';
import { TInitiative, TUserPersona } from '../../types';
import { generateUserPersonas } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface PersonaBuilderProps {
    initiative: TInitiative;
}

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;

export const PersonaBuilder: React.FC<PersonaBuilderProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [targetAudience, setTargetAudience] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [personas, setPersonas] = useState<TUserPersona[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.personas) {
            setPersonas(initiative.artifacts.personas);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!targetAudience.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateUserPersonas(targetAudience, initiative.sector);
            const safePersonas = Array.isArray(result) ? result : [];
            setPersonas(safePersonas);
            saveArtifact(initiative.id, 'personas', safePersonas);
        } catch (error) {
            console.error(error);
            setError("Failed to generate personas.");
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
                        <UserIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Persona Builder
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Define user archetypes to guide UX and requirements (BABOK 10.43).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience Segment</label>
                        <input 
                            type="text" 
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                            placeholder="e.g. Gen Z Gamers, Corporate Compliance Officers, Freelance Designers"
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading || !targetAudience}>
                        {isLoading ? <Spinner /> : 'Generate Personas'}
                    </Button>
                </div>
            </div>

            {(personas || []).length === 0 && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <UserIcon className="h-16 w-16 mb-4" />
                    <p>Describe your audience to meet your users.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-down overflow-y-auto custom-scrollbar pr-2 pb-4">
                {(personas || []).map((persona, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow">
                        {/* Header with Avatar Placeholder */}
                        <div className={`h-24 bg-gradient-to-r ${i === 0 ? 'from-accent-purple to-accent-emerald' : i === 1 ? 'from-accent-purple to-accent-red' : 'from-accent-amber to-accent-yellow'} p-4 relative`}>
                            <div className="absolute -bottom-8 left-4 w-16 h-16 bg-white dark:bg-gray-900 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center text-2xl font-bold shadow-md">
                                {persona.name.charAt(0)}
                            </div>
                        </div>
                        
                        <div className="pt-10 px-4 pb-4 flex-grow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{persona.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{persona.role}, {persona.age}</p>
                                </div>
                                <div className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                    Tech: {persona.techSavviness}/10
                                </div>
                            </div>

                            <p className="italic text-gray-600 dark:text-gray-300 text-sm mb-4 border-l-4 border-accent-purple/30 dark:border-accent-purple/50 pl-3">
                                "{persona.quote}"
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-3">
                                {persona.bio}
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold text-accent-emerald dark:text-accent-emerald/80 uppercase mb-1">Goals</h4>
                                    <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300">
                                        {(persona.goals || []).slice(0, 3).map((g, j) => <li key={j}>{g}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-accent-red dark:text-accent-red/80 uppercase mb-1">Frustrations</h4>
                                    <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300">
                                        {(persona.frustrations || []).slice(0, 3).map((f, j) => <li key={j}>{f}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-accent-purple dark:text-accent-purple/80 uppercase mb-1">Motivations</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {(persona.motivations || []).slice(0, 3).map((m, j) => (
                                            <span key={j} className="text-[10px] bg-accent-purple/5 dark:bg-accent-purple/10 text-accent-purple dark:text-accent-purple/90 px-2 py-0.5 rounded-full border border-accent-purple/10">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
