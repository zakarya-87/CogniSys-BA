
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Database, Brain } from 'lucide-react';
import { TVectorMemory } from '../../../types';

interface MemoryPanelProps {
  memories: TVectorMemory[];
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ memories }) => {
    const { t } = useTranslation('dashboard');
    return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl h-full overflow-y-auto border border-border-light dark:border-border-dark custom-scrollbar space-y-6">
        <div className="flex items-center justify-between sticky top-0 bg-surface-light dark:bg-surface-dark pb-4 z-10 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-blue/10 rounded-xl">
                    <Database className="h-5 w-5 text-accent-blue" />
                </div>
                <h3 className="text-sm font-bold text-text-main-light dark:text-text-main-dark uppercase tracking-widest">
                    {t('hive.semanticMemory')}
                </h3>
            </div>
            <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark bg-surface-darker/10 px-2 py-1 rounded-full">
                {t('hive.nodes', { count: memories.length })}
            </span>
        </div>
        {memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                <Brain className="h-12 w-12 text-text-muted-light dark:text-text-muted-dark" />
                <p className="text-xs font-medium italic">{t('hive.noSemanticMemories')}</p>
            </div>
        ) : (
            <div className="space-y-4">
                {memories.map(mem => (
                    <motion.div 
                        key={mem.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface-darker/5 dark:bg-surface-darker/20 p-4 rounded-2xl border border-border-light dark:border-border-dark hover:border-accent-blue/30 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                                mem.type === 'decision' 
                                    ? 'bg-accent-red/10 text-accent-red' 
                                    : 'bg-accent-blue/10 text-accent-blue'
                            }`}>
                                {t(`hive.memoryType${mem.type}`, { defaultValue: mem.type })}
                            </span>
                            <span className="text-[10px] font-medium text-text-muted-light dark:text-text-muted-dark">
                                {new Date(mem.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-xs text-text-main-light dark:text-text-main-dark leading-relaxed font-light group-hover:text-accent-blue transition-colors">
                            {mem.content}
                        </p>
                    </motion.div>
                ))}
            </div>
        )}
    </div>
    );
};
