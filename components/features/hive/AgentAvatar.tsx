
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { THiveAgent } from '../../../types';

interface AgentAvatarProps {
  agent: THiveAgent;
  active: boolean;
  size?: 'sm' | 'lg';
}

export const AgentAvatar: React.FC<AgentAvatarProps> = React.memo(({ agent, active, size = 'lg' }) => {
    const { t } = useTranslation('dashboard');
    const colors: Record<THiveAgent, string> = {
        Orchestrator: 'bg-accent-purple',
        Scout: 'bg-accent-blue',
        Guardian: 'bg-accent-red',
        Integromat: 'bg-accent-green',
        Simulation: 'bg-accent-amber',
        Archimedes: 'bg-indigo-600',
        Alethea: 'bg-teal-600',
        Chronos: 'bg-rose-600'
    };

    const sizeClasses = size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-10 h-10 text-xs';

    return (
        <div className={`flex flex-col items-center transition-all duration-500 ${active ? 'scale-110 opacity-100' : size === 'lg' ? 'scale-90 opacity-40 grayscale' : 'opacity-100'}`}>
            <div className={`${sizeClasses} rounded-[2rem] flex items-center justify-center text-white font-bold shadow-xl ${colors[agent]} relative overflow-hidden group`}>
                {active && (
                    <motion.div 
                        layoutId="active-glow"
                        className="absolute inset-0 bg-white/20 animate-pulse"
                    />
                )}
                <span className="relative z-10">{agent.charAt(0)}</span>
                {active && size === 'lg' && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent-green border-4 border-surface-light dark:border-surface-dark rounded-full" />
                )}
            </div>
            {size === 'lg' && (
                <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${active ? 'text-accent-purple' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                    {t(`hive.agent${agent}`)}
                </span>
            )}
        </div>
    );
});
