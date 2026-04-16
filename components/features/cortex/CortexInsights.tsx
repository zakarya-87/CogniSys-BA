
import React from 'react';
import { Brain, Zap, AlertTriangle, Lightbulb, ChevronRight, Send } from 'lucide-react';
import { TCortexInsight } from '../../../../types';

interface CortexInsightsProps {
    insights: TCortexInsight[];
    t: (key: string) => string;
}

export const CortexInsights: React.FC<CortexInsightsProps> = ({ insights, t }) => {
    return (
        <aside className="w-96 bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark flex flex-col z-30 shadow-2xl">
            <div className="p-8 border-b border-border-light dark:border-border-dark bg-surface-darker/5 dark:bg-surface-darker/20">
                <div className="flex items-center gap-3 mb-2">
                    <Brain className="text-accent-purple w-7 h-7" />
                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark tracking-tight">{t('cortex.insights')}</h2>
                </div>
                <p className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">{t('cortex.stream')}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-surface-darker/5 dark:bg-surface-darker/10">
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-accent-purple" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">{t('cortex.pattern')}</span>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">2m ago</span>
                    </div>
                    <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-2 tracking-tight">{t('cortex.bottleneck')}</h3>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-6">
                        Initiatives <span className="text-accent-purple font-bold">Agritech</span> and <span className="text-accent-purple font-bold">Logistics</span> both rely on 'Cloud Infra' in Q3, exceeding available capacity by 15%.
                    </p>
                    <button className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-surface-darker/5 dark:bg-surface-darker/20 hover:bg-accent-purple hover:text-white text-text-main-light dark:text-text-main-dark py-3 rounded-xl border border-border-light dark:border-border-dark transition-all group-hover:border-accent-purple/50">
                        Run Simulation
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
                
                <div className="bg-accent-red/5 dark:bg-accent-red/10 border border-accent-red/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-accent-red" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-red">{t('cortex.risk')}</span>
                        </div>
                    </div>
                    <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-2 tracking-tight">{t('cortex.compliance')}</h3>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                        New GDPR regulations updated 4h ago conflict with the 'Data Vault' architecture in the Pharma project.
                    </p>
                </div>
                
                <div className="bg-accent-purple/5 dark:bg-accent-purple/10 border border-accent-purple/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-3 h-3 text-accent-purple" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">{t('cortex.opportunity')}</span>
                        </div>
                    </div>
                    <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-2 tracking-tight">{t('cortex.reusable')}</h3>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                        Codebase analysis suggests 85% overlap between 'Crop Yield Optimizer' and 'Market Predictor' algorithms. Suggest merging.
                    </p>
                </div>
            </div>
            
            <div className="p-6 border-t border-border-light dark:border-border-dark bg-surface-darker/5 dark:bg-surface-darker/30">
                <div className="relative group">
                    <textarea className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl pl-5 pr-14 py-4 text-sm focus:ring-2 focus:ring-accent-purple focus:border-transparent resize-none h-24 text-text-main-light dark:text-text-main-dark transition-all shadow-inner placeholder:text-text-muted-light/50 dark:placeholder:text-text-muted-dark/50" placeholder={t('cortex.ask')}></textarea>
                    <button className="absolute bottom-4 right-4 p-2.5 bg-accent-purple text-white rounded-xl hover:bg-accent-purple/90 transition-all shadow-lg shadow-accent-purple/20 active:scale-90">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};
