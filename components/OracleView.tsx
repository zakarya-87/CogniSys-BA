
import React, { useState, useRef, useEffect } from 'react';
import { TInitiative, TOracleResponse } from '../types';
import { OracleService } from '../services/oracleService';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { 
    Sparkles, 
    Search, 
    FileText, 
    Send, 
    ArrowRight,
    MessageSquare,
    Cpu,
    BookOpen,
    Quote,
    AlertCircle
} from 'lucide-react';

interface OracleViewProps {
    initiatives: TInitiative[];
    onSelectInitiative: (id: string) => void;
}

export const OracleView: React.FC<OracleViewProps> = ({ initiatives, onSelectInitiative }) => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<{ query: string; response: TOracleResponse }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSearch = async (q: string) => {
        if (!q.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await OracleService.ask(q, initiatives);
            setHistory(prev => [...prev, { query: q, response: result }]);
            setQuery(''); // Clear input
        } catch (error) {
            console.error(error);
            setError("The Oracle is temporarily unavailable.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    return (
        <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark text-text-main-light dark:text-text-main-dark rounded-2xl overflow-hidden relative font-sans animate-in fade-in duration-700">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-purple/10 via-transparent to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="p-8 border-b border-border-light dark:border-border-dark z-10 flex items-center justify-between bg-surface-light/50 dark:bg-surface-dark/50 backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-4 tracking-tight">
                        <div className="p-2 bg-accent-purple/10 rounded-2xl">
                            <Sparkles className="h-8 w-8 text-accent-purple" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-purple to-accent-purple/60">The Oracle</span>
                    </h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-2 text-sm font-medium">Semantic Knowledge Retrieval Engine</p>
                </div>
                <div className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] border border-border-light dark:border-border-dark px-4 py-2 rounded-full bg-surface-light dark:bg-surface-darker shadow-sm">
                    {initiatives.length} Projects Indexed
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12 z-10 custom-scrollbar" ref={scrollRef}>
                {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-in zoom-in-95 duration-700">
                        <div className="p-10 bg-accent-purple/5 rounded-full mb-8">
                            <Search className="h-24 w-24 text-accent-purple/30" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-wider text-text-main-light dark:text-text-main-dark opacity-80">Ask me anything about your portfolio.</h3>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark max-w-md mt-4 leading-relaxed font-medium">I have read every requirement, risk, and decision. Try asking about <span className="text-accent-purple">"Security Risks in Fintech"</span> or <span className="text-accent-purple">"Shared Tech Stack"</span>.</p>
                    </div>
                )}

                {history.map((entry, i) => (
                    <div key={i} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* User Query */}
                        <div className="flex justify-end">
                            <div className="bg-accent-purple text-white rounded-3xl rounded-tr-none px-8 py-4 max-w-2xl text-lg font-medium shadow-xl shadow-accent-purple/20">
                                {entry.query}
                            </div>
                        </div>

                        {/* Oracle Response */}
                        <div className="flex gap-6">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-purple/80 flex items-center justify-center shadow-xl shadow-accent-purple/30 transform rotate-3">
                                    <Cpu className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="flex-grow space-y-6">
                                <div className="prose prose-invert max-w-none text-text-main-light dark:text-text-main-dark leading-relaxed text-lg font-medium bg-surface-darker/5 dark:bg-surface-darker/20 p-8 rounded-3xl border border-border-light dark:border-border-dark shadow-sm">
                                    {entry.response.answer}
                                </div>

                                {/* Citations */}
                                {(entry.response.citations || []).length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        {entry.response.citations.map((cit, j) => (
                                            <div 
                                                key={j} 
                                                onClick={() => onSelectInitiative(cit.initiativeId)}
                                                className="bg-surface-light dark:bg-surface-darker/50 border border-border-light dark:border-border-dark hover:border-accent-purple/50 p-5 rounded-2xl cursor-pointer transition-all group hover:shadow-xl hover:-translate-y-1"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-accent-purple/10 rounded-lg group-hover:bg-accent-purple group-hover:text-white transition-colors">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark group-hover:text-text-main-light dark:group-hover:text-text-main-dark uppercase tracking-[0.2em]">{cit.initiativeTitle}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <BookOpen className="h-3 w-3 text-accent-purple" />
                                                    <p className="text-[10px] font-bold text-accent-purple uppercase tracking-wider">{cit.artifactType}</p>
                                                </div>
                                                <div className="relative">
                                                    <Quote className="h-4 w-4 text-accent-purple/20 absolute -top-2 -left-2" />
                                                    <p className="text-sm text-text-main-light dark:text-text-main-dark italic leading-relaxed pl-4">"{cit.snippet}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Follow Ups */}
                                {(entry.response.suggestedFollowUps || []).length > 0 && (
                                    <div className="flex flex-wrap gap-3 mt-6">
                                        {entry.response.suggestedFollowUps.map((suggestion, k) => (
                                            <button 
                                                key={k}
                                                onClick={() => handleSearch(suggestion)}
                                                className="px-5 py-2.5 rounded-full border border-border-light dark:border-border-dark hover:border-accent-purple hover:bg-accent-purple/5 bg-surface-light dark:bg-surface-darker/50 text-xs font-bold text-text-main-light dark:text-text-main-dark transition-all flex items-center gap-2 group"
                                            >
                                                {suggestion}
                                                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-6 animate-in fade-in duration-500">
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-purple/80 flex items-center justify-center animate-pulse shadow-xl shadow-accent-purple/30">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="flex items-center bg-surface-darker/5 dark:bg-surface-darker/20 px-8 py-4 rounded-3xl border border-border-light dark:border-border-dark">
                            <span className="text-text-muted-light dark:text-text-muted-dark text-sm font-black uppercase tracking-widest animate-pulse">Consulting the archives...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-8 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark z-20 shadow-2xl">
                <div className="relative max-w-4xl mx-auto group">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-3 animate-in shake duration-300">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <MessageSquare className="h-5 w-5 text-accent-purple opacity-50 group-focus-within:opacity-100 transition-opacity" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="Search across all initiatives..."
                            className="w-full bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark rounded-3xl py-5 pl-16 pr-20 focus:outline-none focus:ring-4 focus:ring-accent-purple/10 focus:border-accent-purple transition-all shadow-xl text-lg font-medium placeholder:text-text-muted-light/30 dark:placeholder:text-text-muted-dark/30"
                            autoFocus
                        />
                        <button 
                            onClick={() => handleSearch(query)}
                            disabled={!query.trim() || isLoading}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-accent-purple text-white rounded-2xl hover:bg-accent-purple/90 disabled:opacity-50 disabled:hover:bg-accent-purple transition-all shadow-lg shadow-accent-purple/20 group/btn active:scale-95"
                        >
                            {isLoading ? <Spinner /> : <Send className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
