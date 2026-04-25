
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    PlusCircle, 
    MinusCircle, 
    ArrowUpCircle, 
    AlertTriangle, 
    Save, 
    Sparkles, 
    Target, 
    ChevronRight,
    Search
} from 'lucide-react';
import { TInitiative, TSwotAnalysis, TArtifact } from '../../types';
import { generateSwotAnalysis } from '../../services/geminiService';
import { useCatalyst } from '../../context/CatalystContext';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface SwotAnalysisToolProps {
    initiative?: TInitiative;
    onSaveArtifact?: (artifact: TArtifact) => void;
}

export const SwotAnalysisTool: React.FC<SwotAnalysisToolProps> = ({ initiative, onSaveArtifact }) => {
    const { t, i18n } = useTranslation(['dashboard']);
    const currentLanguage = i18n.language;
    const { saveArtifact, setToastMessage } = useCatalyst();

    const [context, setContext] = useState('');
    const [swot, setSwot] = useState<TSwotAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Automation: Synthesize context from initiative briefing
    useEffect(() => {
        if (!context && initiative) {
            const briefing = initiative.description || "";
            const autoContext = `Strategic Objective: ${initiative.title}. Sector: ${initiative.sector || 'General'}. Briefing: ${briefing}`;
            setContext(autoContext);
        }
    }, [initiative, context]);

    const handleGenerate = useCallback(async () => {
        if (!context) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateSwotAnalysis(context, initiative?.sector, currentLanguage);
            setSwot(result);
        } catch (err) {
            setError(t('common:errors.failedToGenerate', 'Strategic synthesis failed. Please try again.'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [context, initiative?.sector, currentLanguage, t]);
    
    const handleSave = async () => {
        if (!swot) return;
        setIsSaving(true);
        try {
            if (onSaveArtifact) {
                onSaveArtifact(swot);
            } else {
                await saveArtifact('strategy_swot', swot);
            }
            setToastMessage?.({ title: "SWOT Saved", description: "Strategic artifact persisted to cloud.", type: 'success' });
        } catch (err) {
            setToastMessage?.({ title: "Save Failed", description: "Database rejected the artifact.", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const renderItem = (item: string) => {
        const alignmentMatch = item.match(/\(Aligns with: (.*?)\)/);
        if (alignmentMatch) {
            const cleanText = item.replace(alignmentMatch[0], '').trim();
            const goal = alignmentMatch[1];
            return (
                <div className="flex flex-col gap-1.5 group/item">
                    <span className="text-[13px] font-medium leading-relaxed group-hover/item:text-white transition-colors">{cleanText}</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 dark:bg-black/20 border border-white/10 w-fit drop-shadow-sm">
                        <Target className="h-2 w-2 text-white/70" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
                            {goal}
                        </span>
                    </div>
                </div>
            );
        }
        return <span className="text-[13px] group-hover/item:text-white transition-colors leading-relaxed">{item}</span>;
    };

    const SwotQuadrant: React.FC<{ 
        title: string; 
        items: string[]; 
        accentColor: string; 
        icon: React.ReactNode;
        label: string;
    }> = ({ title, items, accentColor, icon, label }) => (
        <div className={`glass-card p-6 border-l-4 ${accentColor} transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl relative overflow-hidden group/quadrant slide-up`}>
            {/* Background Icon Watermark */}
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover/quadrant:opacity-[0.07] transition-opacity`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'h-32 w-32' })}
            </div>

            <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-white/10 shadow-inner`}>
                        {React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tight uppercase">{title}</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">{label}</p>
                    </div>
                </div>
            </div>

            <ul className="space-y-4 relative z-10">
                {(items || []).map((item, index) => (
                    <li key={index} className="flex gap-3 text-gray-300 group/list">
                        <ChevronRight className="h-3 w-3 mt-1.5 text-gray-500 group-hover/list:text-white transition-colors shrink-0" />
                        {renderItem(item)}
                    </li>
                ))}
            </ul>
        </div>
    );
    
    return (
        <div className="space-y-8 fade-in">
            {/* INGESTION PANEL */}
            <div className="glass-card p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Search className="h-24 w-24" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                             <Sparkles className="h-6 w-6 text-accent-cyan" />
                             SWOT INTELLIGENCE
                        </h2>
                        <p className="text-sm text-gray-400 font-medium">Synthesizing internal capabilities vs market dynamics</p>
                    </div>

                    <div className="flex gap-3">
                        <Button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !context}
                            className="bg-accent-cyan/10 hover:bg-accent-cyan text-accent-cyan hover:text-white border border-accent-cyan/20 px-6 py-2.5 h-auto rounded-xl font-bold transition-all duration-500"
                        >
                            {isLoading ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            {t('dashboard:tools.swot.generate')}
                        </Button>
                        
                        {swot && (
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 h-auto rounded-xl font-bold transition-all"
                            >
                                {isSaving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />}
                                {t('dashboard:tools.swot.save')}
                            </Button>
                        )}
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label htmlFor="swot-context" className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                            Strategic Context
                        </label>
                        <span className="text-[10px] text-accent-cyan/60 font-mono">ENHANCED GPT-4o ENGINE</span>
                    </div>
                    <textarea
                        id="swot-context"
                        rows={3}
                        className="w-full p-5 border-none rounded-2xl bg-black/20 text-sm font-medium focus:ring-2 focus:ring-accent-cyan/50 focus:bg-black/30 transition-all placeholder:text-gray-600 outline-none"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Describe the initiative, market position, and core objectives..."
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl flex items-center gap-3 text-accent-red text-sm font-bold slide-up">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                </div>
            )}
            
            {/* BENTO GRID */}
            {swot && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SwotQuadrant 
                        title="Strengths"
                        label="Internal Capabilities"
                        items={swot.strengths} 
                        accentColor="border-l-emerald-500" 
                        icon={<PlusCircle className="text-emerald-500" />} 
                    />
                    <SwotQuadrant 
                        title="Weaknesses"
                        label="Internal Gaps"
                        items={swot.weaknesses} 
                        accentColor="border-l-rose-500" 
                        icon={<MinusCircle className="text-rose-500" />} 
                    />
                    <SwotQuadrant 
                        title="Opportunities"
                        label="Environmental Gains"
                        items={swot.opportunities} 
                        accentColor="border-l-cyan-500" 
                        icon={<ArrowUpCircle className="text-cyan-500" />} 
                    />
                    <SwotQuadrant 
                        title="Threats"
                        label="Environmental Risks"
                        items={swot.threats} 
                        accentColor="border-l-amber-500" 
                        icon={<AlertTriangle className="text-amber-500" />} 
                    />
                </div>
            )}
        </div>
    );
};
