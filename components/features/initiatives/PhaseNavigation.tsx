
import React from 'react';
import { Brain, ClipboardList, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { THINK_PLAN_ACT_MAPPING, MODULE_GROUPS } from '../../../constants';

interface PhaseNavigationProps {
  activePhase: string;
  setActivePhase: (phase: string) => void;
  setActiveCategory: (category: string) => void;
  setActiveTab: (tab: string) => void;
}

export const PhaseNavigation: React.FC<PhaseNavigationProps> = ({ 
  activePhase, 
  setActivePhase, 
  setActiveCategory, 
  setActiveTab 
}) => {
  const { t } = useTranslation(['common']);

  const phaseIcons: { [key: string]: any } = {
    'THINK': <Brain className="w-4 h-4" />,
    'PLAN': <ClipboardList className="w-4 h-4" />,
    'ACT': <Rocket className="w-4 h-4" />
  };

  return (
    <div className="flex bg-surface-darker/5 dark:bg-surface-darker/30 p-1.5 rounded-2xl mb-8 w-fit border border-border-light dark:border-border-dark">
      {Object.keys(THINK_PLAN_ACT_MAPPING).map(phase => {
        const isActive = activePhase === phase;

        return (
          <button
            key={phase}
            onClick={() => {
              setActivePhase(phase);
              const firstCategory = THINK_PLAN_ACT_MAPPING[phase][0];
              setActiveCategory(firstCategory);
              setActiveTab(MODULE_GROUPS[firstCategory][0]);
            }}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              isActive
                ? 'bg-surface-light dark:bg-surface-dark text-accent-purple shadow-sm ring-1 ring-border-light dark:ring-border-dark'
                : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
            }`}
          >
            {phaseIcons[phase]}
            <span>{t(`common:phases.${phase.toLowerCase()}`)}</span>
          </button>
        );
      })}
    </div>
  );
};
