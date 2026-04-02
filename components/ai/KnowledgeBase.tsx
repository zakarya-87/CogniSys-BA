
import React, { useState, useEffect } from 'react';
import { TInitiative, TKnowledgeArticle } from '../../types';
import { generateKnowledgeArticles } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface KnowledgeBaseProps {
    initiative: TInitiative;
}

const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const CommandLineIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18.75V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21z" /></svg>;

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [articles, setArticles] = useState<TKnowledgeArticle[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<TKnowledgeArticle | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.knowledgeBase) {
            const safeArticles = Array.isArray(initiative.artifacts.knowledgeBase) ? initiative.artifacts.knowledgeBase : [];
            setArticles(safeArticles);
            if (safeArticles.length > 0) {
                setSelectedArticle(safeArticles[0]);
            }
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateKnowledgeArticles(initiative.title, initiative.description, initiative.sector);
            setArticles(result);
            if (result.length > 0) setSelectedArticle(result[0]);
            saveArtifact(initiative.id, 'knowledgeBase', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate knowledge base articles.");
        } finally {
            setIsLoading(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'SOP': return 'bg-accent-purple/10 text-accent-purple dark:bg-accent-purple/20';
            case 'FAQ': return 'bg-accent-cyan/10 text-accent-cyan dark:bg-accent-cyan/20';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
                        <BookOpenIcon className="h-7 w-7 text-accent-purple" />
                        Knowledge Base & Operations Hub
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Operational readiness documents: SOPs for internal teams and FAQs for end-users.
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Generate Ops Assets'}
                </Button>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
                {/* Sidebar List */}
                <div className="lg:col-span-1 border-r border-gray-200 dark:border-gray-700 pr-4 overflow-y-auto custom-scrollbar">
                    {articles.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">
                            <CommandLineIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">No articles yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {articles.map(article => (
                                <div 
                                    key={article.id}
                                    onClick={() => setSelectedArticle(article)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                        selectedArticle?.id === article.id 
                                            ? 'bg-accent-purple/5 border-accent-purple/20 dark:bg-accent-purple/10 dark:border-accent-purple/30' 
                                            : 'bg-white border-transparent hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${getTypeColor(article.type)}`}>
                                            {article.type}
                                        </span>
                                        {article.audience === 'End User' ? (
                                            <span title="End User"><UserGroupIcon className="h-4 w-4 text-gray-400" /></span>
                                        ) : (
                                            <span title="Internal Ops"><CommandLineIcon className="h-4 w-4 text-gray-400" /></span>
                                        )}
                                    </div>
                                    <h4 className={`text-sm font-medium ${selectedArticle?.id === article.id ? 'text-accent-purple dark:text-accent-purple/90' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {article.title}
                                    </h4>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8 overflow-y-auto custom-scrollbar">
                    {selectedArticle ? (
                        <article className="prose dark:prose-invert max-w-none">
                            <div className="flex items-center gap-3 mb-6 not-prose">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white m-0">{selectedArticle.title}</h1>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-mono">
                                    Target: {selectedArticle.audience}
                                </span>
                            </div>
                            <div className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-300">
                                {selectedArticle.content}
                            </div>
                        </article>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
                            <BookOpenIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p>Select an article to view details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
