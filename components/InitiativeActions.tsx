import React from 'react';
import { TInitiative, InitiativeStatus } from '../types';
import { Button } from './ui/Button';
import { Send, Clock, Code, ExternalLink, PlayCircle, LayoutGrid, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InitiativeActionsProps {
  initiative: TInitiative;
  onUpdateStatus: (id: string, status: InitiativeStatus) => void;
  onViewProjectPlan: (initiative: TInitiative) => void;
  onEditInitiative: (initiative: TInitiative) => void;
}

const statusStyles: { [key in InitiativeStatus]: { text: string, bg: string, ring: string } } = {
  [InitiativeStatus.PLANNING]: { text: 'text-accent-teal dark:text-accent-teal/90', bg: 'bg-accent-teal/10 dark:bg-accent-teal/20', ring: 'ring-accent-teal/20' },
  [InitiativeStatus.AWAITING_APPROVAL]: { text: 'text-accent-amber dark:text-accent-amber/90', bg: 'bg-accent-amber/10 dark:bg-accent-amber/20', ring: 'ring-accent-amber/20' },
  [InitiativeStatus.IN_DEVELOPMENT]: { text: 'text-accent-blue dark:text-accent-blue/90', bg: 'bg-accent-blue/10 dark:bg-accent-blue/20', ring: 'ring-accent-blue/20' },
  [InitiativeStatus.LIVE]: { text: 'text-accent-emerald dark:text-accent-emerald/90', bg: 'bg-accent-emerald/10 dark:bg-accent-emerald/20', ring: 'ring-accent-emerald/20' },
  [InitiativeStatus.ON_HOLD]: { text: 'text-text-muted-light dark:text-text-muted-dark', bg: 'bg-surface-darker/10 dark:bg-surface-darker/50', ring: 'ring-gray-500/10' },
};


export const InitiativeActions: React.FC<InitiativeActionsProps> = ({ initiative, onUpdateStatus, onViewProjectPlan, onEditInitiative }) => {
  const { t } = useTranslation('dashboard');
  
  const getActions = () => {
    switch(initiative.status) {
      case InitiativeStatus.PLANNING:
        return (
          <Button onClick={() => onUpdateStatus(initiative.id, InitiativeStatus.AWAITING_APPROVAL)} className="shadow-lg shadow-accent-teal/20">
            <Send className="h-4 w-4 me-2 rtl:rotate-180" />
            {t('actions.submit_approval')}
          </Button>
        );
      case InitiativeStatus.AWAITING_APPROVAL:
        return (
          <div className="flex items-center gap-4">
             <Button disabled variant="secondary" className="opacity-70">
                <Clock className="h-4 w-4 me-2" />
                {t('actions.pending_decision')}
             </Button>
             <div className="flex gap-2">
                <button 
                    onClick={() => onUpdateStatus(initiative.id, InitiativeStatus.IN_DEVELOPMENT)} 
                    className="text-[10px] uppercase tracking-wider font-bold text-text-muted-light hover:text-accent-teal transition-colors"
                >
                    {t('actions.force_approve')}
                </button>
                <button 
                    onClick={() => onUpdateStatus(initiative.id, InitiativeStatus.PLANNING)} 
                    className="text-[10px] uppercase tracking-wider font-bold text-text-muted-light hover:text-accent-red transition-colors"
                >
                    {t('actions.force_reject')}
                </button>
             </div>
          </div>
        );
      case InitiativeStatus.IN_DEVELOPMENT:
        return (
          <Button variant="secondary" className="border-accent-blue/30 text-accent-blue hover:bg-accent-blue/5">
            <Code className="h-4 w-4 me-2" />
            {t('actions.view_incubator')}
          </Button>
        );
      case InitiativeStatus.LIVE:
        return (
          <Button className="bg-accent-emerald hover:bg-accent-emerald/90 text-white shadow-lg shadow-accent-emerald/20">
            <ExternalLink className="h-4 w-4 me-2" />
            {t('actions.go_live')}
          </Button>
        );
      case InitiativeStatus.ON_HOLD:
        return (
          <Button onClick={() => onUpdateStatus(initiative.id, InitiativeStatus.PLANNING)} variant="outline">
             <PlayCircle className="h-4 w-4 me-2 rtl:rotate-180" />
             {t('actions.reactivate')}
          </Button>
        );
      default:
        return null;
    }
  };

  const currentStatusStyle = statusStyles[initiative.status];

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-border-light dark:border-dark flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all duration-300 hover:shadow-md">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-text-light dark:text-text-dark tracking-tight">
                {initiative.title}
            </h2>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${currentStatusStyle.bg} ${currentStatusStyle.text} ring-1 ${currentStatusStyle.ring}`}>
                {initiative.status}
            </div>
        </div>
        <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">{initiative.description}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0 w-full lg:w-auto">
        {initiative.wbs && (
            <Button onClick={() => onViewProjectPlan(initiative)} variant="outline" className="border-accent-emerald/30 text-accent-emerald hover:bg-accent-emerald/5">
                <LayoutGrid className="h-4 w-4 me-2" />
                {t('actions.project_plan')}
            </Button>
        )}
        <Button variant="secondary" onClick={() => onEditInitiative(initiative)}>
            <Edit className="h-4 w-4 me-2" />
            {t('actions.edit')}
        </Button>
        {getActions()}
      </div>
    </div>
  );
};
