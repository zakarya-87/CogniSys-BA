
import React from 'react';
import { TInitiative } from '../../types';
import { STATUS_STYLES, SECTOR_STYLES } from '../../constants';
import { 
  User, 
  Calendar, 
  ChevronRight, 
  Target, 
  Activity,
  UserCircle
} from 'lucide-react';

interface CardProps {
  initiative: TInitiative;
  onClick: () => void;
}

export const Card: React.FC<CardProps> = ({ initiative, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-surface-light dark:bg-surface-dark rounded-[2rem] shadow-sm hover:shadow-2xl border border-border-light dark:border-border-dark transition-all duration-500 cursor-pointer flex flex-col justify-between group overflow-hidden hover:-translate-y-2"
    >
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-accent-purple" />
                <span className="text-[10px] font-bold text-accent-purple uppercase tracking-[0.2em]">
                    {initiative.sector}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark group-hover:text-accent-purple transition-colors line-clamp-2 leading-tight tracking-tight">
                {initiative.title}
              </h3>
            </div>
            <span className={`text-[9px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap uppercase tracking-widest border shadow-sm ${STATUS_STYLES[initiative.status]}`}>
                {initiative.status}
            </span>
        </div>

        <p className="text-sm text-text-muted-light dark:text-text-muted-dark line-clamp-3 leading-relaxed font-light">
          {initiative.description}
        </p>

        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
            <Activity className="h-3 w-3 text-accent-green" />
            <span>High Impact</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
            <Calendar className="h-3 w-3 text-accent-blue" />
            <span>Q1 2026</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-darker/5 dark:bg-surface-darker/20 px-8 py-6 mt-auto border-t border-border-light dark:border-border-dark group-hover:bg-surface-darker/10 dark:group-hover:bg-surface-darker/30 transition-colors duration-300 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative">
            {initiative.owner.avatarUrl ? (
              <img 
                className="w-11 h-11 rounded-2xl me-4 border-2 border-surface-light dark:border-surface-dark shadow-md object-cover transition-transform group-hover:scale-110 duration-500" 
                src={initiative.owner.avatarUrl} 
                alt={initiative.owner.name} 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl me-4 border-2 border-surface-light dark:border-surface-dark shadow-md bg-accent-purple/10 flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
                <UserCircle className="h-6 w-6 text-accent-purple" />
              </div>
            )}
            <div className="absolute -bottom-1 -end-1 w-4 h-4 bg-accent-green border-2 border-surface-light dark:border-surface-dark rounded-full shadow-sm" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark group-hover:text-accent-purple transition-colors">{initiative.owner.name}</p>
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-bold uppercase tracking-widest">Project Lead</p>
          </div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark p-2 rounded-xl border border-border-light dark:border-border-dark shadow-sm opacity-0 group-hover:opacity-100 translate-x-4 rtl:-translate-x-4 group-hover:translate-x-0 transition-all duration-500">
          <ChevronRight className="h-4 w-4 text-accent-purple rtl:rotate-180" />
        </div>
      </div>
    </div>
  );
};
