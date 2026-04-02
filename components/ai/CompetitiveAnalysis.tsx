
import React, { useState, useEffect } from 'react';
import { TInitiative, TCompetitorAnalysis } from '../../types';
import { generateCompetitorAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface CompetitiveAnalysisProps {
    initiative: TInitiative;
}

const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.5-3.419c.636-.88 1.57-1.545 2.581-2.055a4.5 4.5 0 014.638 0c1.01.51 1.945 1.175 2.581 2.055a9.75 9.75 0 011.5 3.419zM12 2.25c-2.485 0-4.5 2.015-4.5 4.5s2.015 4.5 4.5 4.5 4.5-2.015 4.5-4.5-2.015-4.5-4.5-4.5zm0 0v-1.5" /></svg>;
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const GlobeAltIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;

export const CompetitiveAnalysis: React.FC<CompetitiveAnalysisProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [competitor, setCompetitor] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TCompetitorAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.competitorAnalysis) {
            setAnalysis(initiative.artifacts.competitorAnalysis);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleAnalyze = async () => {
        if (!competitor.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateCompetitorAnalysis(competitor, initiative.title, initiative.description, initiative.sector);
            setAnalysis(result);
            saveArtifact(initiative.id, 'competitorAnalysis', result);
        } catch (error) {
            console.error(error);
            setError("Failed to analyze competitor.");
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
                        <TrophyIcon className="h-7 w-7 text-accent-purple" />
                        Smart Competitive Analysis
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Benchmark against market rivals with real-time data integration (BABOK 10.4).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Competitor</label>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        value={competitor}
                        onChange={(e) => setCompetitor(e.target.value)}
                        placeholder="e.g., Stripe, Salesforce, Tesla"
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                    />
                    <Button onClick={handleAnalyze} disabled={isLoading || !competitor}>
                        {isLoading ? <Spinner /> : 'Scout Market'}
                    </Button>
                </div>
            </div>

            {analysis ? (
                <div className="flex-grow animate-fade-in-down space-y-6">
                    {/* Header Strategy */}
                    <div className="bg-accent-purple/10 p-4 rounded-lg border-l-4 border-accent-purple">
                        <h3 className="text-lg font-bold text-accent-purple mb-1">Strategy: {analysis.strategy}</h3>
                        <p className="text-sm text-accent-purple/80">Recommended positioning against {analysis.competitorName}.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Comparison Matrix */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="bg-gray-100 dark:bg-gray-700 p-3 font-bold text-center border-b border-gray-200 dark:border-gray-600 flex justify-between px-10">
                                <span>Us ({initiative.title.split(' ')[0]})</span>
                                <span>Feature Battle</span>
                                <span>Them ({analysis.competitorName})</span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {(analysis.features || []).map((feat, i) => (
                                    <div key={i} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div className="w-12 flex justify-center">
                                            {feat.us ? <CheckCircleIcon className="h-6 w-6 text-accent-emerald"/> : <XCircleIcon className="h-6 w-6 text-text-muted-dark"/>}
                                        </div>
                                        <div className="flex-grow text-center">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{feat.name}</p>
                                            {feat.note && <p className="text-[10px] text-gray-500">{feat.note}</p>}
                                        </div>
                                        <div className="w-12 flex justify-center">
                                            {feat.them ? <CheckCircleIcon className="h-6 w-6 text-accent-red"/> : <XCircleIcon className="h-6 w-6 text-text-muted-dark"/>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Advantages */}
                        <div className="space-y-4">
                            <div className="bg-accent-emerald/10 p-4 rounded-lg border border-accent-emerald/20">
                                <h4 className="font-bold text-accent-emerald mb-2 flex items-center gap-2">
                                    <ChartBarIcon className="h-5 w-5"/> Our Advantage
                                </h4>
                                <ul className="list-disc list-inside text-sm text-accent-emerald/90 space-y-1">
                                    {(analysis.ourAdvantage || []).map((adv, i) => <li key={i}>{adv}</li>)}
                                </ul>
                            </div>
                            <div className="bg-accent-red/10 p-4 rounded-lg border border-accent-red/20">
                                <h4 className="font-bold text-accent-red mb-2 flex items-center gap-2">
                                    <ChartBarIcon className="h-5 w-5"/> Their Edge
                                </h4>
                                <ul className="list-disc list-inside text-sm text-accent-red/90 space-y-1">
                                    {(analysis.theirAdvantage || []).map((adv, i) => <li key={i}>{adv}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Grounding Sources */}
                    {(analysis.sources || []).length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <GlobeAltIcon className="h-4 w-4 text-accent-purple" />
                                Verified Market Signals
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.sources?.map((source, i) => (
                                    <a 
                                        key={i} 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-xs text-accent-purple hover:bg-accent-purple/10 transition-colors"
                                    >
                                        {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <ChartBarIcon className="h-16 w-16 mb-4" />
                        <p>Enter a competitor to start scouting.</p>
                    </div>
                )
            )}
        </div>
    );
};
