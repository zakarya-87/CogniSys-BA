
import React, { useState, useEffect } from 'react';
import { TInitiative, TStoryMap, TStoryMapNode } from '../../types';
import { generateUserStoryMap } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface UserStoryMapperProps {
    initiative: TInitiative;
}

const Square3Stack3DIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>;

export const UserStoryMapper: React.FC<UserStoryMapperProps> = ({ initiative }) => {
    const { saveArtifact, setToastMessage } = useCatalyst();
    const [map, setMap] = useState<TStoryMap | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.storyMap) {
            setMap(initiative.artifacts.storyMap);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateUserStoryMap(initiative.title, initiative.sector);
            setMap(result);
            saveArtifact(initiative.id, 'storyMap', result);
            setToastMessage("Story Map generated successfully.");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate story map.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Square3Stack3DIcon className="h-7 w-7 text-accent-teal" />
                        Intelligent Story Mapper
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize user activities and plan releases with a 2D backlog (Jeff Patton style).
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : `Map Stories for ${initiative.sector}`}
                </Button>
            </div>

            {error && <p className="text-accent-red mb-4">{error}</p>}

            {!map && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <Square3Stack3DIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Transform your flat backlog into a user-centric narrative. Click to generate the map.
                    </p>
                </div>
            )}

            {map && (
                <div className="flex flex-col gap-4 flex-grow overflow-auto custom-scrollbar">
                    {map.aiAnalysis && (
                        <div className="bg-accent-teal/10 dark:bg-accent-teal/20 p-4 rounded-lg border border-accent-teal/20">
                            <h3 className="text-sm font-semibold text-accent-teal mb-2">AI Analysis</h3>
                            <p className="text-sm text-accent-teal/80">{map.aiAnalysis}</p>
                        </div>
                    )}
                    <div className="flex-grow overflow-x-auto overflow-y-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4">
                        <div className="min-w-max flex flex-col gap-6">
                            
                            {/* Backbone: Activities */}
                        <div className="flex gap-4 border-b-4 border-accent-teal/20 dark:border-accent-teal/30 pb-4 sticky top-0 z-10">
                            {(map.activities || []).map(act => (
                                <div key={act.id} className="w-48 flex-shrink-0">
                                    <div className="bg-accent-teal text-white p-3 rounded-md shadow-sm text-center font-bold text-sm">
                                        {act.title}
                                    </div>
                                    <div className="h-6 w-0.5 bg-accent-teal/20 dark:bg-accent-teal/30 mx-auto"></div>
                                </div>
                            ))}
                        </div>

                        {/* Releases */}
                        <div className="space-y-6">
                            {(map.releases || []).map((release, i) => (
                                <div key={release.id} className="relative">
                                    {/* Release Line */}
                                    <div className="absolute -top-3 left-0 right-0 border-t-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center">
                                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded-r-md">
                                            {release.name}
                                        </span>
                                    </div>

                                    {/* Stories Grid */}
                                    <div className="flex gap-4 pt-4">
                                        {(map.activities || []).map(act => {
                                            const stories = release.stories?.[act.id] || [];
                                            return (
                                                <div key={act.id} className="w-48 flex-shrink-0 flex flex-col gap-2 min-h-[100px] bg-gray-100/50 dark:bg-gray-800/50 rounded p-2">
                                                    {stories.length === 0 && <div className="text-center text-xs text-gray-400 italic py-4">-</div>}
                                                    {stories.map(story => (
                                                        <div key={story.id} className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm border border-gray-200 dark:border-gray-600 text-sm hover:shadow-md transition-shadow cursor-pointer">
                                                            {story.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
};
