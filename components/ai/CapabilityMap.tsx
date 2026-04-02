
import React, { useState } from 'react';
import { TInitiative, TCapability } from '../../types';
import { generateCapabilityMap } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface CapabilityMapProps {
    initiative: TInitiative;
}

const Squares2X2Icon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;

const CapabilityBox: React.FC<{ cap: TCapability; level: number }> = ({ cap, level }) => {
    const getMaturityColor = (score: number) => {
        if (score >= 4) return 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald dark:text-accent-emerald';
        if (score === 3) return 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber dark:text-accent-amber';
        return 'bg-accent-red/10 border-accent-red/30 text-accent-red dark:text-accent-red';
    };

    if (level === 0) {
        // Root container
        return (
            <div className="space-y-4">
                {cap.subCapabilities?.map((child, i) => (
                    <CapabilityBox key={i} cap={child} level={level + 1} />
                ))}
            </div>
        );
    }

    if (level === 1) {
        // Level 1: Major Functional Area (Container)
        return (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {cap.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cap.subCapabilities?.map((child, i) => (
                        <CapabilityBox key={i} cap={child} level={level + 1} />
                    ))}
                </div>
            </div>
        );
    }

    // Level 2: Specific Capability (Leaf)
    return (
        <div className={`p-3 rounded border-l-4 shadow-sm ${getMaturityColor(cap.maturity)} hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm">{cap.name}</h4>
                <span className="text-[10px] font-bold bg-white/50 px-1.5 py-0.5 rounded">
                    L{cap.maturity}
                </span>
            </div>
            <p className="text-xs opacity-90 line-clamp-2" title={cap.description}>
                {cap.description}
            </p>
            <div className="mt-2 flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                    Imp: {cap.importance}
                </span>
            </div>
        </div>
    );
};

export const CapabilityMap: React.FC<CapabilityMapProps> = ({ initiative }) => {
    const [map, setMap] = useState<TCapability | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateCapabilityMap(initiative.sector);
            setMap(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate capability map.");
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
                        <Squares2X2Icon className="h-7 w-7 text-accent-purple" />
                        Business Capability Map
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualize "What the business does" and assess maturity (BABOK 10.6).
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : `Map ${initiative.sector} Landscape`}
                </Button>
            </div>

            {!map && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <Squares2X2Icon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Generate a hierarchical view of business functions to identify strategic investment gaps.
                    </p>
                </div>
            )}

            {map && (
                <div className="flex-grow animate-fade-in-down overflow-y-auto custom-scrollbar pr-2">
                    <div className="mb-4 flex gap-4 text-xs justify-end text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-red rounded-sm opacity-50"></span> Low Maturity (1-2)</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-amber rounded-sm opacity-50"></span> Medium Maturity (3)</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-emerald rounded-sm opacity-50"></span> High Maturity (4-5)</div>
                    </div>
                    <CapabilityBox cap={map} level={0} />
                </div>
            )}
        </div>
    );
};
