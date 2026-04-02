
import React, { useState, useCallback, useEffect } from 'react';
import { TAnalysisPlan, TInitiative } from '../../types';
import { generateAnalysisPlan } from '../../services/geminiService';
import { Brain, Users, Wrench, FileText, Sparkles, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface InitiativePlannerProps {
  initiative: TInitiative;
}

export const InitiativePlanner: React.FC<InitiativePlannerProps> = ({ initiative }) => {
  const { saveArtifact } = useCatalyst();
  const [brief, setBrief] = useState(initiative.description);
  const [plan, setPlan] = useState<TAnalysisPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted artifact
  useEffect(() => {
      if (initiative.artifacts?.analysisPlan) {
          setPlan(initiative.artifacts.analysisPlan);
      }
  }, [initiative.id, initiative.artifacts]);

  const handleGeneratePlan = useCallback(async () => {
    if (!brief) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateAnalysisPlan(brief, initiative.sector);
      setPlan(result);
      saveArtifact(initiative.id, 'analysisPlan', result);
    } catch (err) {
      setError('Failed to generate plan. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [brief, initiative.sector, initiative.id, saveArtifact]);

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-border-light dark:border-border-dark space-y-8 overflow-y-auto custom-scrollbar h-full animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
           <h2 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark flex items-center gap-3">
             <Brain className="w-8 h-8 text-accent-purple" />
             AI-Powered Initiative Planner
           </h2>
           <p className="text-text-muted-light dark:text-text-muted-dark">
             Generate a tailored business analysis approach for the <span className="text-accent-purple font-semibold">{initiative.sector}</span> sector.
           </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
          <FileText className="w-4 h-4" />
          Project Brief
        </div>
        <textarea
          id="brief"
          rows={4}
          className="w-full px-4 py-3 bg-surface-darker/5 dark:bg-surface-darker/30 border border-border-light dark:border-border-dark rounded-xl focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple outline-none transition-all duration-200 text-sm resize-none"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Enter a brief description of the initiative..."
        />
        <Button 
          onClick={handleGeneratePlan} 
          disabled={isLoading || !brief}
          className="shadow-lg shadow-accent-purple/20 px-8"
        >
          {isLoading ? <Spinner /> : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Strategic Plan
            </span>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-xl text-accent-red text-sm flex items-center gap-2">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {plan && (
        <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="bg-accent-purple/5 dark:bg-accent-purple/10 border border-accent-purple/20 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-24 h-24 text-accent-purple" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-accent-purple">
                    <Send className="w-4 h-4" /> Suggested Business Analysis Approach
                </h3>
                <p className="text-lg leading-relaxed text-text-main-light dark:text-text-main-dark italic">
                  "{plan.approach}"
                </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-darker/5 dark:bg-surface-darker/20 p-6 rounded-2xl border border-border-light dark:border-border-dark hover:border-accent-purple/30 transition-colors duration-300">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
                  <Users className="w-4 h-4 text-accent-blue" /> Stakeholders
              </h3>
              <ul className="space-y-3">
                {(plan.stakeholders || []).map((s, i) => (
                  <li key={i} className="text-sm text-text-muted-light dark:text-text-muted-dark flex flex-col">
                    <span className="font-bold text-text-main-light dark:text-text-main-dark">{s.role}</span>
                    <span className="opacity-80">{s.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-darker/5 dark:bg-surface-darker/20 p-6 rounded-2xl border border-border-light dark:border-border-dark hover:border-accent-purple/30 transition-colors duration-300">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
                  <Wrench className="w-4 h-4 text-accent-purple" /> Techniques
              </h3>
              <ul className="space-y-2">
                {(plan.techniques || []).map((t, i) => (
                  <li key={i} className="text-sm text-text-muted-light dark:text-text-muted-dark flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-purple/40" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-darker/5 dark:bg-surface-darker/20 p-6 rounded-2xl border border-border-light dark:border-border-dark hover:border-accent-purple/30 transition-colors duration-300">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
                  <FileText className="w-4 h-4 text-accent-blue" /> Deliverables
              </h3>
              <ul className="space-y-2">
                {(plan.deliverables || []).map((d, i) => (
                  <li key={i} className="text-sm text-text-muted-light dark:text-text-muted-dark flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue/40" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

