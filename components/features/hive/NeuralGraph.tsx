
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { THiveStep, THiveAgent } from '../../../types';
import { AgentAvatar } from './AgentAvatar';

interface NeuralGraphProps {
  history: THiveStep[];
  activeAgent: THiveAgent;
  isAutoRunning: boolean;
}

export const NeuralGraph: React.FC<NeuralGraphProps> = React.memo(({ history, activeAgent, isAutoRunning }) => {
    const { t } = useTranslation('dashboard');
    return (
        <div className="flex items-center gap-4 overflow-x-auto p-6 mask-fade-right custom-scrollbar bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-purple/10 rounded-lg">
                    <Zap className="h-4 w-4 text-accent-purple" />
                </div>
                <div className="h-px w-8 bg-border-light dark:bg-border-dark"></div>
            </div>
            {history.map((step, i) => (
                <motion.div 
                    key={step.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 flex-shrink-0"
                >
                    <div className="flex flex-col items-center group">
                        <AgentAvatar agent={step.agent} active={false} size="sm" />
                        <span className="text-[9px] font-bold text-text-muted-light dark:text-text-muted-dark mt-2 max-w-[80px] truncate text-center uppercase tracking-tighter group-hover:text-accent-purple transition-colors">{step.action}</span>
                    </div>
                    <div className="h-px w-10 bg-border-light dark:bg-border-dark relative">
                        {step.nextAgent && (
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-purple shadow-sm shadow-accent-purple/50" />
                        )}
                    </div>
                </motion.div>
            ))}
            {/* Active Node Pulse */}
            <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative">
                    {isAutoRunning && (
                        <div className="absolute inset-0 bg-accent-purple rounded-[1rem] animate-ping opacity-20"></div>
                    )}
                    <AgentAvatar agent={activeAgent} active={true} size="sm" />
                </div>
                <span className="text-[9px] font-bold text-accent-purple mt-2 uppercase tracking-widest animate-pulse">
                    {isAutoRunning ? t('hive.processing') : t('hive.thinking')}
                </span>
            </div>
        </div>
    );
});
