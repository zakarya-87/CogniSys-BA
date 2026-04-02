
import React, { useState, useEffect } from 'react';
import { TInitiative, TPestleAnalysis, TPestleCategory } from '../../types';
import { generatePestleAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface PestleAnalysisProps {
    initiative: TInitiative;
}

const GlobeAmericasIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;

export const PestleAnalysis: React.FC<PestleAnalysisProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [location, setLocation] = useState('Global');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TPestleAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.pestleAnalysis) {
            setAnalysis(initiative.artifacts.pestleAnalysis);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generatePestleAnalysis(initiative.sector, location);
            setAnalysis(result);
            saveArtifact(initiative.id, 'pestleAnalysis', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate PESTLE analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    const categoryConfig: Record<TPestleCategory, { color: string; icon: string }> = {
        'Political': { color: 'bg-accent-red/5 text-accent-red border-accent-red/20 dark:bg-accent-red/10 dark:text-accent-red dark:border-accent-red/30', icon: '🏛️' },
        'Economic': { color: 'bg-accent-purple/5 text-accent-purple border-accent-purple/20 dark:bg-accent-purple/10 dark:text-accent-purple dark:border-accent-purple/30', icon: '📈' },
        'Social': { color: 'bg-accent-amber/5 text-accent-amber border-accent-amber/20 dark:bg-accent-amber/10 dark:text-accent-amber dark:border-accent-amber/30', icon: '👥' },
        'Technological': { color: 'bg-accent-purple/5 text-accent-purple border-accent-purple/20 dark:bg-accent-purple/10 dark:text-accent-purple dark:border-accent-purple/30', icon: '🤖' },
        'Legal': { color: 'bg-gray-50 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700', icon: '⚖️' },
        'Environmental': { color: 'bg-accent-emerald/5 text-accent-emerald border-accent-emerald/20 dark:bg-accent-emerald/10 dark:text-accent-emerald dark:border-accent-emerald/30', icon: '🌱' },
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
                        <GlobeAmericasIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent PESTLE Analysis
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Scan the macro-environment for strategic threats and opportunities (BABOK 6.1.2).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Market / Region</label>
                        <input 
                            type="text" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                            placeholder="e.g. European Union, North America, Global"
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading || !location}>
                        {isLoading ? <Spinner /> : 'Scan Environment'}
                    </Button>
                </div>
            </div>

            {analysis && (
                <div className="flex-grow animate-fade-in-down overflow-y-auto custom-scrollbar pr-2">
                    {!analysis.factors || !Array.isArray(analysis.factors) ? (
                        <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20">
                            <h3 className="font-bold mb-2">Analysis Format Error</h3>
                            <p>The generated analysis data is in an unexpected format. Please click "Scan Environment" to regenerate it.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 p-4 bg-accent-purple/5 dark:bg-accent-purple/10 rounded-lg border border-accent-purple/10 dark:border-accent-purple/20">
                                <h3 className="font-bold text-accent-purple dark:text-accent-purple/90 mb-2">Executive Summary</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.summary}</p>
                                
                                {(analysis.sources || []).length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-accent-purple/10 dark:border-accent-purple/20">
                                        <p className="text-xs font-bold text-accent-purple/60 mb-1 flex items-center gap-1">
                                            <LinkIcon className="h-3 w-3"/> Verified Sources
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.sources?.map((s, i) => (
                                                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-purple hover:underline bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-accent-purple/10">
                                                    {s.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {analysis.factors.map((item, i) => (
                                    <div key={i} className={`p-4 rounded-lg border ${categoryConfig[item.category]?.color || 'bg-gray-50 text-gray-900'} shadow-sm`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-lg flex items-center gap-2">
                                                <span>{categoryConfig[item.category]?.icon || '📌'}</span>
                                                {item.category}
                                            </h4>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded bg-white/50 backdrop-blur-sm`}>
                                                {item.impact} Impact
                                            </span>
                                        </div>
                                        <ul className="list-disc list-inside space-y-1 mb-3 text-sm opacity-90">
                                            {(item.factors || []).map((factor, j) => (
                                                <li key={j}>{factor}</li>
                                            ))}
                                        </ul>
                                        <div className="text-xs bg-white/40 p-2 rounded italic opacity-80">
                                            <strong>Implication:</strong> {item.implication}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
