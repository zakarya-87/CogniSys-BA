
import React, { useState, useEffect } from 'react';
import { TInitiative, TDocumentAnalysis, TExtractedItem } from '../../types';
import { analyzeDocument } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface DocumentAnalyzerProps {
    initiative: TInitiative;
}

const DocumentMagnifyingGlassIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;

export const DocumentAnalyzer: React.FC<DocumentAnalyzerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [docText, setDocText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TDocumentAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState<string>('All');

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.documentAnalysis) {
            setAnalysis(initiative.artifacts.documentAnalysis);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleAnalyze = async () => {
        if (!docText.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await analyzeDocument(docText, initiative.sector);
            setAnalysis(result);
            saveArtifact(initiative.id, 'documentAnalysis', result);
        } catch (error) {
            console.error(error);
            setError("Failed to analyze document.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromote = (item: TExtractedItem) => {
        alert(`Simulated: Added "${item.text.substring(0, 20)}..." to ${item.category === 'Requirement' ? 'Backlog' : item.category === 'Term' ? 'Glossary' : 'Business Rules'}`);
    };

    const categoryStyles = {
        'Rule': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800',
        'Requirement': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800',
        'Term': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800',
        'Data': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800',
    };

    // Defensive coding: ensure items exists before filtering
    const filteredItems = (analysis?.items || []).filter(i => filter === 'All' || i.category === filter);

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
                        <DocumentMagnifyingGlassIcon className="h-7 w-7 text-indigo-500" />
                        Intelligent Document Analyzer
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Ingest legacy documentation and extract structured artifacts (BABOK 10.18).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left: Input */}
                <div className="flex flex-col gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex-grow flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Legacy Document Text</label>
                        <textarea 
                            className="flex-grow w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple font-mono text-xs"
                            value={docText}
                            onChange={(e) => setDocText(e.target.value)}
                            placeholder="Paste text from SOPs, Policy PDFs, or Legacy Manuals here..."
                        />
                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleAnalyze} disabled={isLoading || !docText}>
                                {isLoading ? <Spinner /> : 'Analyze & Extract'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: Results */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col">
                    {!analysis ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <DocumentMagnifyingGlassIcon className="h-16 w-16 mb-4" />
                            <p>Paste text and click Analyze to extract artifacts.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-fade-in-down">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-100 dark:bg-gray-800 p-3 rounded-md italic">
                                    "{analysis.summary}"
                                </p>
                                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                    {['All', 'Rule', 'Requirement', 'Term', 'Data'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setFilter(cat)}
                                            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                                                filter === cat 
                                                    ? 'bg-accent-purple text-white' 
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {filteredItems.map((item, i) => (
                                    <div key={i} className={`p-3 rounded-lg border ${categoryStyles[item.category]} relative group`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black uppercase opacity-70 tracking-wider">{item.category}</span>
                                            <span className="text-[10px] font-bold opacity-50">{item.confidence} Conf.</span>
                                        </div>
                                        <p className="text-sm font-medium leading-snug pr-8">{item.text}</p>
                                        
                                        <button 
                                            onClick={() => handlePromote(item)}
                                            className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-900 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                            title={`Add to ${item.category}s`}
                                        >
                                            <PlusIcon className="h-4 w-4 text-accent-purple" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
