import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { TRecommendedTechnique } from '../../types';
import { Spinner } from './Spinner';

interface RecommendedTechniquesProps {
    techniques: TRecommendedTechnique[];
    isLoading: boolean;
    onSelectTechnique: (techniqueName: string) => void;
}

export const RecommendedTechniques: React.FC<RecommendedTechniquesProps> = ({ techniques, isLoading, onSelectTechnique }) => {
    const { t } = useTranslation(['dashboard']);
    return (
        <div className="relative group overflow-hidden bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 h-full transition-all duration-500 hover:bg-white/[0.05]">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-yellow-400/20 rounded-xl border border-yellow-400/30">
                        <Lightbulb className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tighter uppercase italic text-white">AI Strategy Advisor</h3>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Recommended Frameworks</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <Spinner className="h-8 w-8 text-accent-cyan" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 animate-pulse">Scanning Initiative...</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(Array.isArray(techniques) ? techniques : []).map((tech, index) => (
                            <div key={tech.name || index} className="relative group/card p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-accent-cyan/30 hover:bg-white/[0.05] transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-wider">{tech.name}</h4>
                                    <Sparkles className="h-3 w-3 text-accent-cyan opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[11px] font-medium text-gray-500 leading-relaxed mb-4 group-hover:text-gray-300 transition-colors">{tech.justification}</p>
                                <button 
                                    onClick={() => onSelectTechnique(tech.name)}
                                    className="w-full py-2.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded-xl text-[9px] font-black text-accent-cyan uppercase tracking-widest hover:bg-accent-cyan hover:text-black transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    {t('dashboard:strategy.recs.launch', 'Launch Tactical Tool')}
                                    <ArrowRight className="h-3 w-3 transform transition-transform group-hover/btn:translate-x-1" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && (techniques || []).length === 0 && (
                    <div className="p-8 text-center border border-dashed border-white/10 rounded-[2rem] opacity-40">
                        <p className="text-[10px] font-black uppercase tracking-widest">No techniques mapped to this sector yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
