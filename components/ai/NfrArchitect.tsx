
import React, { useState, useEffect } from 'react';
import { TInitiative, TNfr, TNfrCategory } from '../../types';
import { generateNfrs } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface NfrArchitectProps {
    initiative: TInitiative;
}

const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
const ServerStackIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>;

const categoryColors: { [key in TNfrCategory]: string } = {
    'Security': 'bg-accent-red/10 text-accent-red border-accent-red/20',
    'Performance': 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    'Reliability': 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
    'Scalability': 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
    'Usability': 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
    'Compliance': 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
    'Maintainability': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
};

export const NfrArchitect: React.FC<NfrArchitectProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [nfrs, setNfrs] = useState<TNfr[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.nfrs) {
            setNfrs(initiative.artifacts.nfrs);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateNfrs(initiative.title, initiative.description, initiative.sector);
            // Defensive check: ensure we save an array
            const safeResults = Array.isArray(result) ? result : [];
            setNfrs(safeResults);
            saveArtifact(initiative.id, 'nfrs', safeResults);
        } catch (error) {
            console.error(error);
            setError("Failed to generate NFRs");
            setNfrs([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Defensive check: ensure nfrs is an array before reduce
    const safeNfrs = Array.isArray(nfrs) ? nfrs : [];

    const groupedNfrs = safeNfrs.reduce((acc, nfr) => {
        if (!acc[nfr.category]) acc[nfr.category] = [];
        acc[nfr.category].push(nfr);
        return acc;
    }, {} as Record<TNfrCategory, TNfr[]>);

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
                        <ServerStackIcon className="h-7 w-7 text-accent-purple" />
                        NFR Architect
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Define Non-Functional Requirements (Quality of Service) tailored for <strong>{initiative.sector}</strong>.
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Generate QoS Specs'}
                </Button>
            </div>

            {safeNfrs.length === 0 && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <ShieldCheckIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No NFRs Defined</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Click "Generate QoS Specs" to define critical quality attributes like Security, Performance, and Compliance.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-down">
                {Object.entries(groupedNfrs).map(([category, items]) => (
                    <div key={category} className={`rounded-lg border p-4 ${categoryColors[category as TNfrCategory]} bg-opacity-20 dark:bg-opacity-10`}>
                        <h3 className="font-bold text-lg mb-3">{category}</h3>
                        <div className="space-y-3">
                            {(items as TNfr[]).map(nfr => (
                                <div key={nfr.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-inherit">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{nfr.requirement}</p>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                                            {nfr.metric}
                                        </span>
                                        <span className={`font-bold ${nfr.priority === 'Critical' ? 'text-accent-red' : nfr.priority === 'High' ? 'text-accent-amber' : 'text-accent-purple'}`}>
                                            {nfr.priority}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
