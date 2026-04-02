
import React, { useState } from 'react';
import { TInitiative, THatAnalysis } from '../../types';
import { generateSixHatsAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface SixThinkingHatsProps {
    initiative: TInitiative;
}

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>;

export const SixThinkingHats: React.FC<SixThinkingHatsProps> = ({ initiative }) => {
    const [topic, setTopic] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<THatAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateSixHatsAnalysis(topic, initiative.sector);
            setAnalysis(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    const HatCard: React.FC<{ title: string; color: string; items: string[]; icon?: string }> = ({ title, color, items, icon }) => (
        <div className={`p-4 rounded-lg border-l-4 shadow-sm ${color} h-full`}>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                {icon && <span className="text-xl">{icon}</span>} {title}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
                {(items || []).map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
    );

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
                        <SparklesIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Six Thinking Hats
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Holistic decision analysis using lateral thinking perspectives.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Decision or Topic to Analyze</label>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        placeholder="e.g. Launching a Freemium Tier"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !topic}>
                        {isLoading ? <Spinner /> : 'Analyze with 6 Hats'}
                    </Button>
                </div>
            </div>

            {analysis && (
                <div className="flex-grow animate-fade-in-down space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <HatCard 
                            title="White Hat (Facts)" 
                            color="bg-gray-50 border-gray-400 text-gray-800 dark:bg-gray-700 dark:text-gray-200" 
                            items={analysis.white} 
                            icon="⬜"
                        />
                        <HatCard 
                            title="Red Hat (Emotions)" 
                            color="bg-accent-red/10 border-accent-red text-accent-red dark:bg-accent-red/20 dark:text-accent-red/90" 
                            items={analysis.red} 
                            icon="🟥"
                        />
                        <HatCard 
                            title="Black Hat (Caution)" 
                            color="bg-gray-900 border-black text-gray-200 dark:bg-black dark:border-gray-600" 
                            items={analysis.black} 
                            icon="⬛"
                        />
                        <HatCard 
                            title="Yellow Hat (Optimism)" 
                            color="bg-accent-amber/10 border-accent-amber text-accent-amber dark:bg-accent-amber/20 dark:text-accent-amber/90" 
                            items={analysis.yellow} 
                            icon="🟨"
                        />
                        <HatCard 
                            title="Green Hat (Creativity)" 
                            color="bg-accent-emerald/10 border-accent-emerald text-accent-emerald dark:bg-accent-emerald/20 dark:text-accent-emerald/90" 
                            items={analysis.green} 
                            icon="🟩"
                        />
                        <HatCard 
                            title="Blue Hat (Process)" 
                            color="bg-accent-purple/10 border-accent-purple text-accent-purple dark:bg-accent-purple/20 dark:text-accent-purple/90" 
                            items={analysis.blue} 
                            icon="🟦"
                        />
                    </div>

                    <div className="bg-accent-purple/10 dark:bg-accent-purple/20 p-4 rounded-lg border border-accent-purple/20 dark:border-accent-purple/30">
                        <h3 className="font-bold text-accent-purple dark:text-accent-purple/90 mb-2">Synthesis</h3>
                        <p className="text-accent-purple/80 dark:text-accent-purple/70 text-sm leading-relaxed">
                            {analysis.summary}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
