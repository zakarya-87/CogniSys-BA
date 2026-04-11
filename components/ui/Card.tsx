
import React, { useMemo } from 'react';
import { TInitiative } from '../../types';
import { STATUS_STYLES, SECTOR_STYLES } from '../../constants';
import { ComplianceBadge } from './ComplianceBadge';
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
  index?: number;
}

const AIConfidenceRing: React.FC<{ score: number }> = React.memo(({ score }) => {
  const radius = 18;
  const stroke = 3;
  const { circumference, offset } = useMemo(() => {
    const c = 2 * Math.PI * radius;
    return { circumference: c, offset: c - (score / 100) * c };
  }, [score]);

  return (
    <div className="relative flex-shrink-0" title={`AI Confidence: ${score}%`}>
      <svg width="48" height="48" viewBox="0 0 48 48" className="transform -rotate-90">
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border-light dark:text-border-dark"
        />
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
          stroke="url(#tealGradient)"
        />
        <defs>
          <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4AA" />
            <stop offset="100%" stopColor="#7FDBDA" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-accent-teal">
        {score}%
      </span>
    </div>
  );
});

export const Card: React.FC<CardProps>= ({ initiative, onClick, index }) => {
  const readiness = initiative.readinessScore ?? 75;

  return (
    <div
      onClick={onClick}
      className="bg-surface-light dark:bg-surface-dark rounded-[2rem] shadow-sm hover:shadow-2xl border border-border-light dark:border-border-dark hover:border-accent-teal/30 hover:glass-card-light dark:hover:glass-card transition-all duration-500 cursor-pointer flex flex-col justify-between group overflow-hidden hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4"
      style={index != null ? { animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' } : undefined}
    >
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Target className="h-3 w-3 text-accent-purple" />
                <span className="text-[10px] font-bold text-accent-purple uppercase tracking-[0.2em]">
                    {initiative.sector}
                </span>
                <ComplianceBadge sector={initiative.sector} size="sm" />
              </div>
              <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark group-hover:text-accent-purple transition-colors line-clamp-2 leading-tight tracking-tight">
                {initiative.title}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className={`text-[9px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap uppercase tracking-widest border shadow-sm ${STATUS_STYLES[initiative.status]}`}>
                  {initiative.status}
              </span>
              <AIConfidenceRing score={readiness} />
            </div>
        </div>

        <p className="text-sm text-text-muted-light dark:text-text-muted-dark line-clamp-3 leading-relaxed font-light">
          {initiative.description}
        </p>

        {/* Readiness mini progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
              Readiness
            </span>
            <span className="text-[10px] font-bold text-accent-teal">{readiness}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border-light dark:bg-border-dark overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${readiness}%`,
                background: 'linear-gradient(90deg, #00D4AA, #7FDBDA)',
              }}
            />
          </div>
        </div>

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
