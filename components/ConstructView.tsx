
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCatalyst } from '../context/CatalystContext';
import { TInitiative, TCodeArtifact } from '../types';
import { generateCodeArtifact } from '../services/geminiService';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { 
    Wrench, 
    Code2, 
    Download, 
    Play, 
    History, 
    Sparkles, 
    Terminal, 
    Copy,
    ChevronRight,
    AlertCircle,
    Cpu
} from 'lucide-react';

export const ConstructView: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const { initiatives, saveArtifact } = useCatalyst();
    const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>('');
    const [selectedSourceKey, setSelectedSourceKey] = useState<string>('');
    const [targetLang, setTargetLang] = useState('TypeScript');
    const [generatedCode, setGeneratedCode] = useState<TCodeArtifact | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refinement, setRefinement] = useState('');

    const activeInitiative = initiatives.find(i => i.id === selectedInitiativeId);
    const codeGenerations: TCodeArtifact[] = activeInitiative?.artifacts?.codeGenerations || [];

    // Filter initiatives to only those with artifacts
    const availableSources = activeInitiative?.artifacts 
        ? Object.keys(activeInitiative.artifacts).filter(k => 
            ['dataModel', 'apiSpec', 'wireframe', 'businessRules'].includes(k) && activeInitiative.artifacts![k]
          )
        : [];

    const handleGenerate = async () => {
        if (!activeInitiative || !selectedSourceKey) return;
        
        setIsLoading(true);
        setError(null);
        try {
            const sourceData = activeInitiative.artifacts![selectedSourceKey];
            const context = JSON.stringify(sourceData);
            
            // If refining, prepend current code
            let finalContext = context;
            const currentRefinement = refinement;
            if (currentRefinement && generatedCode) {
                 finalContext += `\n\nEXISTING CODE:\n${generatedCode.code}\n\nREFINEMENT REQUEST: ${currentRefinement}`;
            }

            const result = await generateCodeArtifact(finalContext, selectedSourceKey, targetLang, activeInitiative.sector);
            
            if (currentRefinement) {
                result.refinementRequest = currentRefinement;
            }

            setGeneratedCode(result);
            setRefinement('');

            // Save to history
            const newHistory = [result, ...codeGenerations];
            saveArtifact(activeInitiative.id, 'codeGenerations', newHistory);

        } catch (e) {
            console.error(e);
            setError("Generation failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode.code);
            alert("Code copied to clipboard.");
        }
    };

    return (
        <div className="h-full flex flex-col bg-surface-light dark:bg-surface-dark overflow-hidden relative animate-in fade-in duration-700">
            
            {/* Header */}
            <div className="bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark p-6 flex justify-between items-center z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-text-main-light dark:text-text-main-dark flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-accent-purple/10 rounded-xl">
                            <Code2 className="h-7 w-7 text-accent-purple" />
                        </div>
                        {t('construct.title')}
                    </h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark text-sm mt-1 font-medium">{t('construct.subtitle')}</p>
                </div>
                
                <div className="flex gap-4">
                    <select 
                        value={selectedInitiativeId}
                        onChange={(e) => { setSelectedInitiativeId(e.target.value); setSelectedSourceKey(''); setGeneratedCode(null); }}
                        className="px-4 py-2 bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark rounded-xl text-text-main-light dark:text-text-main-dark text-sm font-bold focus:ring-2 focus:ring-accent-purple outline-none transition-all cursor-pointer shadow-sm"
                    >
                        <option value="">{t('construct.selectProject')}</option>
                        {initiatives.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Configuration */}
                <div className="w-85 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                    
                    <div>
                        <h3 className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Cpu className="h-3 w-3" />
                            {t('construct.sourceArtifact')}
                        </h3>
                        {!selectedInitiativeId ? (
                             <div className="p-4 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl border border-dashed border-border-light dark:border-border-dark text-center">
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark italic font-medium">{t('construct.selectProjectFirst')}</p>
                             </div>
                        ) : availableSources.length === 0 ? (
                            <div className="p-4 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl border border-dashed border-border-light dark:border-border-dark text-center">
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark italic font-medium">{t('construct.noConvertibleArtifacts')}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availableSources.map(key => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedSourceKey(key)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                                            selectedSourceKey === key 
                                                ? 'bg-accent-purple/10 border-accent-purple text-accent-purple shadow-sm shadow-accent-purple/20' 
                                                : 'bg-surface-light dark:bg-surface-darker border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:border-accent-purple/50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="font-bold text-sm capitalize tracking-tight">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                            {selectedSourceKey === key && <ChevronRight className="h-4 w-4" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Terminal className="h-3 w-3" />
                            {t('construct.targetLanguage')}
                        </h3>
                        <select 
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="w-full px-4 py-3 bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark rounded-2xl text-text-main-light dark:text-text-main-dark text-sm font-bold focus:ring-2 focus:ring-accent-purple outline-none transition-all cursor-pointer"
                        >
                            <option value="TypeScript">TypeScript (React/Node)</option>
                            <option value="Python">Python</option>
                            <option value="SQL (PostgreSQL)">SQL (PostgreSQL)</option>
                            <option value="OpenAPI (YAML)">OpenAPI (YAML)</option>
                            <option value="Prisma Schema">Prisma Schema</option>
                            <option value="Java">Java</option>
                        </select>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-500/20 text-xs font-bold flex items-center gap-2 animate-in shake duration-300">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <Button 
                        onClick={handleGenerate} 
                        disabled={!selectedSourceKey || isLoading} 
                        className="w-full py-6 rounded-2xl shadow-lg shadow-accent-purple/20 group overflow-hidden relative"
                    >
                        {isLoading ? <Spinner /> : (
                            <span className="flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs">
                                <Play className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" /> 
                                {t('construct.materializeCode')}
                            </span>
                        )}
                    </Button>

                    <div className="flex-1 flex flex-col min-h-0">
                        <h3 className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <History className="h-3 w-3" />
                            {t('construct.history')}
                        </h3>
                        {!selectedInitiativeId ? (
                             <div className="p-4 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl border border-dashed border-border-light dark:border-border-dark text-center">
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark italic font-medium">{t('construct.selectProjectFirst')}</p>
                             </div>
                        ) : codeGenerations.length === 0 ? (
                            <div className="p-4 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl border border-dashed border-border-light dark:border-border-dark text-center">
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark italic font-medium">{t('construct.noPreviousGenerations')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {codeGenerations.map(gen => (
                                    <button
                                        key={gen.id}
                                        onClick={() => {
                                            setGeneratedCode(gen);
                                            setSelectedSourceKey(gen.sourceArtifactType);
                                            setTargetLang(gen.language);
                                        }}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all group animate-in slide-in-from-left-4 duration-300 ${
                                            generatedCode?.id === gen.id 
                                                ? 'bg-accent-purple/10 border-accent-purple text-accent-purple shadow-sm' 
                                                : 'bg-surface-light dark:bg-surface-darker border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:border-accent-purple/30'
                                        }`}
                                    >
                                        <div className="font-black truncate text-sm tracking-tight mb-1">{gen.title}</div>
                                        <div className="flex justify-between text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                                            <span>{gen.language}</span>
                                            <span>{new Date(gen.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        {gen.refinementRequest && (
                                            <div className="mt-2 text-[10px] text-accent-purple dark:text-accent-purple/80 italic truncate font-medium flex items-center gap-1" title={gen.refinementRequest}>
                                                <Sparkles className="h-2 w-2" />
                                                "{gen.refinementRequest}"
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main: Editor */}
                <div className="flex-1 flex flex-col bg-surface-darker text-gray-300 overflow-hidden relative">
                    {!generatedCode ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted-dark/20 animate-in zoom-in-95 duration-700">
                            <div className="p-8 bg-surface-dark rounded-full mb-6 shadow-2xl">
                                <Code2 className="h-24 w-24 opacity-20" />
                            </div>
                            <p className="text-lg font-black uppercase tracking-[0.2em] opacity-40">{t('construct.awaitingMaterialization')}</p>
                            <p className="text-sm font-medium mt-2 opacity-30">{t('construct.awaitingMaterializationDesc')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-black/40 backdrop-blur-md px-6 py-3 flex justify-between items-center text-xs border-b border-border-dark sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                    <span className="font-mono text-accent-purple font-bold ml-2 tracking-wider">{generatedCode.title}</span>
                                </div>
                                <button 
                                    onClick={handleCopy} 
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] border border-white/10"
                                >
                                    <Copy className="h-3 w-3" /> {t('construct.copyCode')}
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-8 font-mono text-sm custom-scrollbar bg-[#0d0d0d] selection:bg-accent-purple/30">
                                <pre className="leading-relaxed"><code className="block">{generatedCode.code}</code></pre>
                            </div>
                            
                            {/* Refinement Bar */}
                            <div className="p-6 bg-surface-dark border-t border-border-dark shadow-2xl">
                                <div className="flex gap-4 max-w-4xl mx-auto w-full">
                                    <div className="relative flex-grow group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Sparkles className="h-4 w-4 text-accent-purple opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={refinement}
                                            onChange={(e) => setRefinement(e.target.value)}
                                            placeholder={t('construct.refinementPlaceholder')}
                                            className="w-full pl-11 pr-4 py-3 bg-surface-darker border border-border-dark rounded-2xl text-white text-sm font-medium focus:ring-2 focus:ring-accent-purple outline-none transition-all placeholder:text-text-muted-dark/30 shadow-inner"
                                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isLoading || !refinement}
                                        className="bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-accent-purple/20 flex items-center gap-2"
                                    >
                                        {isLoading ? <Spinner /> : t('construct.refine')}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
