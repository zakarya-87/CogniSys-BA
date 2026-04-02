
import React, { useState } from 'react';
import { TInitiative, TADR } from '../../types';
import { generateADR } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ADRManagerProps {
    initiative: TInitiative;
}

const DocumentDuplicateIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>;
const CheckBadgeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;

export const ADRManager: React.FC<ADRManagerProps> = ({ initiative }) => {
    const [adrs, setAdrs] = useState<TADR[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [problem, setProblem] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAdrId, setSelectedAdrId] = useState<string | null>(null);

    React.useEffect(() => {
        if (initiative.artifacts?.adrs) {
            setAdrs(Array.isArray(initiative.artifacts.adrs) ? initiative.artifacts.adrs : []);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!title || !problem) return;
        setError(null);
        setIsLoading(true);
        try {
            const newAdr = await generateADR(title, problem, initiative.sector);
            setAdrs(prev => [newAdr, ...prev]);
            setTitle('');
            setProblem('');
            setSelectedAdrId(newAdr.id);
        } catch (error) {
            console.error(error);
            setError("Failed to generate ADR.");
        } finally {
            setIsLoading(false);
        }
    };

    const statusColors = {
        'Proposed': 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
        'Accepted': 'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/30',
        'Rejected': 'bg-accent-red/20 text-accent-red border-accent-red/30',
        'Deprecated': 'bg-surface-dark text-text-muted-dark border-border-dark'
    };

    const selectedAdr = (adrs || []).find(a => a.id === selectedAdrId);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <DocumentDuplicateIcon className="h-7 w-7 text-accent-purple" />
                        Architecture Decision Records
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Document significant architectural decisions, context, and consequences.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                {/* Left: Creation & List */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">New Decision Record</h3>
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Decision Title (e.g. Use Kafka)"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                            />
                            <textarea 
                                value={problem}
                                onChange={(e) => setProblem(e.target.value)}
                                placeholder="Context: What is the dilemma? Options?"
                                rows={3}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                            />
                            <Button onClick={handleGenerate} disabled={isLoading || !title || !problem} className="w-full">
                                {isLoading ? <Spinner /> : 'Draft ADR'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2">
                        {(adrs || []).length === 0 && <p className="text-center text-gray-400 text-sm mt-4">No records yet.</p>}
                        {(adrs || []).map(adr => (
                            <div 
                                key={adr.id}
                                onClick={() => setSelectedAdrId(adr.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                    selectedAdrId === adr.id 
                                        ? 'bg-accent-purple/10 border-accent-purple/30 dark:bg-indigo-900/30 dark:border-indigo-700' 
                                        : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColors[adr.status]}`}>
                                        {adr.status}
                                    </span>
                                    <span className="text-xs text-gray-400">{adr.date}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{adr.title}</h4>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Detail View */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-inner overflow-y-auto custom-scrollbar">
                    {selectedAdr ? (
                        <div className="prose dark:prose-invert max-w-none animate-fade-in-down">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white m-0">{selectedAdr.title}</h1>
                                <div className="flex flex-col items-end">
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase border ${statusColors[selectedAdr.status]}`}>
                                        {selectedAdr.status}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">ID: {selectedAdr.id}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide mb-2">Context</h3>
                                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                        {selectedAdr.context}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide mb-2">Decision</h3>
                                    <div className="bg-accent-emerald/10 p-4 rounded-lg border border-accent-emerald/30 dark:border-green-800">
                                        <p className="text-accent-emerald dark:text-green-100 font-medium">
                                            {selectedAdr.decision}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide mb-2">Consequences</h3>
                                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                        {selectedAdr.consequences}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
                            <DocumentDuplicateIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p>Select a record to view details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
