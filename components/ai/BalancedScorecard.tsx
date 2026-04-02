
import React, { useState } from 'react';
import { TInitiative, TBalancedScorecard, TScorecardItem } from '../../types';
import { generateBalancedScorecard } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface BalancedScorecardProps {
    initiative: TInitiative;
}

const ChartPieIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>;
const CurrencyDollarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const CogIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const AcademicCapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.216 50.552 50.552 0 00-2.658.813m-15.482 0A50.553 50.553 0 0112 13.489a50.551 50.551 0 016.482-1.206 48.663 48.663 0 00-.966 2.747c-.001.033-.004.067-.01.1a.233.233 0 01-.01.052v.002a.076.076 0 01-.003.007 6.14 6.14 0 00-4.518 4.198.75.75 0 001.452.386 4.632 4.632 0 013.42-3.168c.693-.157 1.415-.058 2.056.237.67.308 1.156 1.001 1.156 1.78V21a.75.75 0 001.5 0v-3.21a2.25 2.25 0 00-1.156-1.988 2.267 2.267 0 00-2.056-.264 4.65 4.65 0 01-.57.192 48.57 48.57 0 00-.936-2.722" /></svg>;

const PerspectiveCard: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    items: TScorecardItem[]; 
    color: string 
}> = ({ title, icon, items, color }) => (
    <div className={`p-4 rounded-lg border ${color} shadow-sm h-full flex flex-col`}>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-black/10 dark:border-white/10">
            <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">{icon}</div>
            <h3 className="font-bold text-lg">{title}</h3>
        </div>
        <div className="flex-grow space-y-3">
            {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-black/5 dark:border-white/5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{item.objective}</p>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Measure: {item.measure}</span>
                        <span className="font-mono font-bold text-gray-700 dark:text-gray-300">Target: {item.target}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const BalancedScorecard: React.FC<BalancedScorecardProps> = ({ initiative }) => {
    const [scorecard, setScorecard] = useState<TBalancedScorecard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateBalancedScorecard(initiative.title, initiative.sector);
            setScorecard(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate Balanced Scorecard.");
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
                        <ChartPieIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Balanced Scorecard
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Translate strategy into action across 4 perspectives (BABOK 10.3).
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Map Strategy'}
                </Button>
            </div>

            {!scorecard && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <ChartPieIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Generate a strategic map linking Learning, Process, Customer, and Financial objectives.
                    </p>
                </div>
            )}

            {scorecard && (
                <div className="flex-grow animate-fade-in-down relative">
                    {/* Central Connectors (Visual Flourish) */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-0 opacity-10">
                        <div className="w-1 h-full bg-accent-purple"></div>
                        <div className="h-1 w-full bg-accent-purple absolute"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full relative z-10">
                        {/* Top Left: Financial */}
                        <PerspectiveCard 
                            title="Financial" 
                            icon={<CurrencyDollarIcon className="h-6 w-6 text-accent-emerald" />} 
                            items={scorecard.financial || []}
                            color="bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20"
                        />

                        {/* Top Right: Customer */}
                        <PerspectiveCard 
                            title="Customer" 
                            icon={<UserGroupIcon className="h-6 w-6 text-accent-purple" />} 
                            items={scorecard.customer || []}
                            color="bg-accent-purple/10 text-accent-purple border-accent-purple/20"
                        />

                        {/* Bottom Left: Learning & Growth */}
                        <PerspectiveCard 
                            title="Learning & Growth" 
                            icon={<AcademicCapIcon className="h-6 w-6 text-accent-amber" />} 
                            items={scorecard.learning || []}
                            color="bg-accent-amber/10 text-accent-amber border-accent-amber/20"
                        />

                        {/* Bottom Right: Internal Process */}
                        <PerspectiveCard 
                            title="Internal Process" 
                            icon={<CogIcon className="h-6 w-6 text-accent-purple" />} 
                            items={scorecard.internal || []}
                            color="bg-accent-purple/10 text-accent-purple border-accent-purple/20"
                        />
                    </div>
                    
                    {/* Flow indication labels */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 z-20">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Strategy</span>
                    </div>
                </div>
            )}
        </div>
    );
};
