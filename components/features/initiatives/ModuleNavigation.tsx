
import React from 'react';
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MODULE_GROUPS, THINK_PLAN_ACT_MAPPING } from '../../../constants';

interface ModuleNavigationProps {
  activePhase: string;
  activeTab: string;
  isNavCollapsed: boolean;
  setIsNavCollapsed: (collapsed: boolean | ((v: boolean) => boolean)) => void;
  setActiveCategory: (category: string) => void;
  setActiveTab: (tab: string) => void;
}

export const ModuleNavigation: React.FC<ModuleNavigationProps> = ({
  activePhase,
  activeTab,
  isNavCollapsed,
  setIsNavCollapsed,
  setActiveCategory,
  setActiveTab
}) => {
  const { t } = useTranslation(['common']);

  return (
    <div className={`flex-shrink-0 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-border-light dark:border-border-dark overflow-y-auto custom-scrollbar h-full transition-all duration-300 ease-in-out relative ${isNavCollapsed ? 'w-14 p-2' : 'w-72 p-6'}`}>
      <button
        onClick={() => setIsNavCollapsed(v => !v)}
        title={isNavCollapsed ? 'Expand menu' : 'Collapse menu'}
        className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-darker hover:text-accent-purple transition-all ${isNavCollapsed ? 'static w-full flex justify-center mb-2' : ''}`}
      >
        {isNavCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </button>

      {isNavCollapsed ? (
        <div className="mt-2 flex flex-col items-center gap-1">
          {THINK_PLAN_ACT_MAPPING[activePhase].flatMap(category =>
            MODULE_GROUPS[category].map(module => (
              <button
                key={module}
                title={module}
                onClick={() => { setActiveCategory(category); setActiveTab(module); }}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-[10px] font-bold group relative ${
                  activeTab === module
                    ? 'bg-accent-purple/10 text-accent-purple ring-1 ring-accent-purple/30'
                    : 'text-text-muted-light dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-darker'
                }`}
              >
                {module.charAt(0)}
                <span className="absolute left-full ms-2 px-2 py-1 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
                  {module}
                </span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {THINK_PLAN_ACT_MAPPING[activePhase].map(category => (
            <div key={category} className="space-y-3">
              <h4 className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-accent-purple" />
                {t(`common:categories.${category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`)}
              </h4>
              <nav className="space-y-1">
                {MODULE_GROUPS[category].map(module => (
                  <button
                    key={module}
                    onClick={() => {
                      setActiveCategory(category);
                      setActiveTab(module);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 group ${
                      activeTab === module
                        ? 'bg-accent-purple/5 text-accent-purple dark:bg-accent-purple/10'
                        : 'text-text-muted-light dark:text-text-muted-dark hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20 hover:text-text-light dark:hover:text-text-dark'
                    }`}
                  >
                    <span>{t(`common:modules.${module.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`)}</span>
                    {activeTab === module && (
                      <ChevronRight className="w-3 h-3 animate-in slide-in-from-start-1 rtl:rotate-180" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
