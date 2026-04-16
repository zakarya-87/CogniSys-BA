import React, { useMemo } from 'react';
import { TInitiative } from '../../types';
import { STATUS_STYLES } from '../../constants';
import { ComplianceBadge } from './ComplianceBadge';
import { 
  Calendar, 
  ChevronRight, 
  Target, 
  Activity,
  UserCircle,
  Zap
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
      <svg width="52" height="52" viewBox="0 0 52 52" className="transform -rotate-90">
        <circle
          cx="26" cy="26" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-white/5"
        />
        <circle
          cx="26" cy="26" r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          stroke="url(#cardRingGradient)"
        />
        <defs>
          <linearGradient id="cardRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4AA" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-accent-teal">
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
      className="glass-card metallic-sheen hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-700 cursor-pointer flex flex-col justify-between group overflow-hidden hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8"
      style={index != null ? { animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' } : undefined}
    >
      <div className="p-8 space-y-6 relative z-10">
        <div className="flex justify-between items-start gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Target className="h-3.5 w-3.5 text-accent-teal" />
                <span className="text-[10px] font-black text-accent-teal uppercase tracking-[0.2em] opacity-80">
                    {initiative.sector}
                </span>
                <ComplianceBadge sector={initiative.sector} size="sm" />
              </div>
              <h3 className="text-2xl font-black text-white group-hover:text-accent-teal transition-all duration-500 line-clamp-2 leading-tight tracking-tighter">
                {initiative.title}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-4">
              <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap uppercase tracking-widest border border-white/5 backdrop-blur-xl shadow-lg ${STATUS_STYLES[initiative.status]}`}>
                  {initiative.status}
              </span>
              <AIConfidenceRing score={readiness} />
            </div>
        </div>

        <p className="text-sm text-white/50 line-clamp-3 leading-relaxed font-medium group-hover:text-white/80 transition-all">
          {initiative.description}
        </p>

        {/* Readiness logic */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-accent-teal" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Readiness Alignment</span>
            </div>
            <span className="text-[10px] font-black text-accent-teal">{readiness}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden ring-1 ring-white/5">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,212,170,0.2)]"
              style={{
                width: `${readiness}%`,
                background: 'linear-gradient(90deg, #00D4AA, #00d4ff)',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-accent-teal transition-all">
            <Activity className="h-3 w-3 text-accent-teal" />
            <span>High Impact</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-accent-blue transition-all">
            <Calendar className="h-3 w-3 text-accent-blue" />
            <span>Q1 2026</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 px-8 py-6 mt-auto border-t border-white/5 group-hover:bg-accent-teal/5 transition-all duration-500 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center">
          <div className="relative">
            {initiative.owner.avatarUrl ? (
              <img 
                className="w-12 h-12 rounded-2xl me-4 border-2 border-white/10 shadow-2xl object-cover transition-transform group-hover:scale-110 duration-500" 
                src={initiative.owner.avatarUrl} 
                alt={initiative.owner.name} 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl me-4 border-2 border-white/10 shadow-2xl bg-accent-teal/10 flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
                <UserCircle className="h-7 w-7 text-accent-teal" />
              </div>
            )}
            <div className="absolute -bottom-1 -end-1 w-4 h-4 bg-accent-teal border-2 border-primary rounded-full shadow-lg" />
          </div>
          <div>
            <p className="text-sm font-black text-white group-hover:text-accent-teal transition-colors tracking-tight italic">{initiative.owner.name}</p>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Project Lead Analyst</p>
          </div>
        </div>
        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 shadow-inner group-hover:bg-accent-teal group-hover:border-accent-teal/50 transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(0,212,170,0.3)]">
          <ChevronRight className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );
};
