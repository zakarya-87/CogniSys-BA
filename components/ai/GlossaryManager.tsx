
import React, { useState, useEffect } from 'react';
import { TInitiative, TGlossaryTerm } from '../../types';
import { generateGlossary } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface GlossaryManagerProps {
    initiative: TInitiative;
}

const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const MagnifyingGlassIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;

const typeColors = {
    'Business': 'bg-accent-purple/10 text-accent-purple',
    'Technical': 'bg-accent-purple/20 text-accent-purple',
    'Data': 'bg-accent-emerald/10 text-accent-emerald',
};

export const GlossaryManager: React.FC<GlossaryManagerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [terms, setTerms] = useState<TGlossaryTerm[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('');

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.glossary) {
            setTerms(initiative.artifacts.glossary);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateGlossary(initiative.title, initiative.description, initiative.sector);
            const safeResults = Array.isArray(result) ? result : [];
            setTerms(safeResults);
            saveArtifact(initiative.id, 'glossary', safeResults);
        } catch (error) {
            console.error(error);
            setError("Failed to generate glossary.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusToggle = (id: string) => {
        const updatedTerms = (terms || []).map(t => 
            t.id === id ? { ...t, status: t.status === 'Approved' ? ('Draft' as const) : ('Approved' as const) } : t
        );
        setTerms(updatedTerms);
        saveArtifact(initiative.id, 'glossary', updatedTerms);
    };

    const filteredTerms = (terms || []).filter(t => 
        t.term.toLowerCase().includes(filter.toLowerCase()) || 
        t.definition.toLowerCase().includes(filter.toLowerCase())
    );

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
                        <BookOpenIcon className="h-7 w-7 text-accent-purple" />
                        Glossary & Data Dictionary
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Standardize domain vocabulary and data definitions (BABOK 10.12).
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Scan & Define Terms'}
                </Button>
            </div>

            <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search terms..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                />
            </div>

            {(!terms || terms.length === 0) && !isLoading ? (
                <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12">
                    <BookOpenIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Click "Scan & Define Terms" to extract key vocabulary from your initiative context.
                    </p>
                </div>
            ) : (
                <div className="flex-grow overflow-auto custom-scrollbar rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Term / Acronym</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Definition</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTerms.map((term) => (
                                <tr key={term.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-gray-900 dark:text-white">{term.term}</div>
                                        {term.acronym && <div className="text-xs text-gray-500 font-mono">({term.acronym})</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColors[term.type]}`}>
                                            {term.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">{term.definition}</div>
                                        {term.synonyms && term.synonyms.length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                <span className="font-semibold">Synonyms:</span> {term.synonyms.join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button 
                                            onClick={() => handleStatusToggle(term.id)}
                                            className={`text-xs font-bold px-2 py-1 rounded cursor-pointer border ${
                                                term.status === 'Approved' 
                                                    ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20' 
                                                    : 'bg-accent-amber/10 text-accent-amber border-accent-amber/20'
                                            }`}
                                        >
                                            {term.status}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
