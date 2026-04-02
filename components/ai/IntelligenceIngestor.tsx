import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { ingestRawIntelligence } from '../../services/geminiService';
import { Sector } from '../../types';

interface IntelligenceIngestorProps {
    onClose: () => void;
    onIngested: (title: string, description: string, sector: Sector) => void;
}

import { Sparkles, X, BrainCircuit, Wand2 } from 'lucide-react';

export const IntelligenceIngestor: React.FC<IntelligenceIngestorProps> = ({ onClose, onIngested }) => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleProcess = async () => {
        if (!input.trim()) return;
        setIsProcessing(true);
        setError(null);
        try {
            const result = await ingestRawIntelligence(input);
            onIngested(result.title, result.description, result.sector);
        } catch (err: any) {
            setError(err.message || "Failed to process intelligence.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-surface-darker/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] border border-border-light dark:border-border-dark overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-surface-darker/5 dark:bg-surface-darker/20">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-3 tracking-tight">
                          <BrainCircuit className="w-8 h-8 text-accent-purple" />
                          Strategic Ingestion
                      </h2>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium uppercase tracking-widest">AI-Powered Initiative Synthesis</p>
                    </div>
                    <button 
                      onClick={onClose} 
                      className="p-2 rounded-full hover:bg-surface-darker/10 dark:hover:bg-surface-darker/30 text-text-muted-light dark:text-text-muted-dark transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-6">
                    <div className="bg-accent-purple/5 dark:bg-accent-purple/10 p-4 rounded-2xl border border-accent-purple/10 flex gap-4 items-start">
                      <Sparkles className="w-5 h-5 text-accent-purple shrink-0 mt-0.5" />
                      <p className="text-sm text-text-main-light dark:text-text-main-dark leading-relaxed">
                          Paste raw meeting notes, strategic goals, market research, or random ideas. The AI will analyze the text, extract the core intent, and automatically structure it into a new Initiative.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] ml-1">Raw Intelligence Input</label>
                      <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="e.g., We need to build a new mobile app for our retail customers to track their loyalty points. It should integrate with our existing POS system and offer personalized discounts..."
                          className="w-full h-64 p-6 bg-surface-darker/5 dark:bg-surface-darker/20 border border-border-light dark:border-border-dark rounded-2xl text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-accent-purple focus:border-transparent resize-none transition-all placeholder:text-text-muted-light/50 dark:placeholder:text-text-muted-dark/50"
                      />
                    </div>

                    {error && (
                        <div className="p-4 bg-accent-red/10 dark:bg-accent-red/20 text-accent-red rounded-2xl text-sm border border-accent-red/20 flex items-center gap-3 animate-in shake-1 duration-300">
                            <div className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-border-light dark:border-border-dark flex justify-end gap-4 bg-surface-darker/5 dark:bg-surface-darker/30">
                    <button 
                        className="px-6 py-3 text-sm font-bold rounded-xl text-text-main-light dark:text-text-main-dark hover:bg-surface-darker/10 dark:hover:bg-surface-darker/20 transition-all uppercase tracking-widest"
                        onClick={onClose} 
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <Button 
                      onClick={handleProcess} 
                      disabled={!input.trim() || isProcessing}
                      className="shadow-xl shadow-accent-purple/20 px-8 py-3 rounded-xl flex items-center gap-3"
                    >
                        {isProcessing ? (
                            <>
                                <Spinner />
                                <span className="uppercase tracking-widest text-xs">Synthesizing...</span>
                            </>
                        ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              <span className="uppercase tracking-widest text-xs">Synthesize Initiative</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
