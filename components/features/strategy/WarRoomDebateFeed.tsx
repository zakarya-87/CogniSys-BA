import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Send, Pause, Play, RotateCcw } from 'lucide-react';

export type AgentRole = 'orchestrator' | 'scout' | 'guardian';
export type Sentiment = 'agree' | 'challenge' | 'neutral';
export type DebatePhase = 'opening' | 'rebuttal' | 'consensus';

export interface DebateMessage {
  id: string;
  agent: AgentRole;
  text: string;
  sentiment: Sentiment;
  timestamp: string;
  evidence?: string[];
}

export interface DebateState {
  topic: string;
  phase: DebatePhase;
  round: number;
  messages: DebateMessage[];
  consensusPercent: number;
  isGenerating: boolean;
}

const AGENT_CONFIG: Record<AgentRole, { name: string; color: string; bgColor: string; avatar: string }> = {
  orchestrator: { name: 'Orchestrator', color: 'text-accent-teal', bgColor: 'bg-accent-teal/10', avatar: '🎯' },
  scout: { name: 'Scout', color: 'text-blue-400', bgColor: 'bg-blue-400/10', avatar: '🔍' },
  guardian: { name: 'Guardian', color: 'text-amber-400', bgColor: 'bg-amber-400/10', avatar: '🛡️' },
};

const SENTIMENT_INDICATOR: Record<Sentiment, { label: string; color: string }> = {
  agree: { label: '✓ Agrees', color: 'text-green-400' },
  challenge: { label: '⚡ Challenges', color: 'text-rose-400' },
  neutral: { label: '○ Neutral', color: 'text-slate-400' },
};

const PHASE_LABEL: Record<DebatePhase, string> = {
  opening: 'Opening Statements',
  rebuttal: 'Rebuttal & Analysis',
  consensus: 'Building Consensus',
};

interface WarRoomDebateFeedProps {
  debate: DebateState;
  onSendMessage?: (text: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
}

export const WarRoomDebateFeed: React.FC<WarRoomDebateFeedProps> = ({
  debate,
  onSendMessage,
  onPause,
  onResume,
  onReset,
}) => {
  const feedRef = useRef<HTMLDivElement>(null);
  const [userInput, setUserInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [debate.messages.length, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  const handleSend = useCallback(() => {
    if (!userInput.trim()) return;
    onSendMessage?.(userInput.trim());
    setUserInput('');
  }, [userInput, onSendMessage]);

  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      onResume?.();
    } else {
      onPause?.();
    }
    setIsPaused(!isPaused);
  }, [isPaused, onPause, onResume]);

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-darker/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${debate.isGenerating ? 'bg-accent-teal animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
              War Room
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal font-semibold">
            {PHASE_LABEL[debate.phase]}
          </span>
          <span className="text-[10px] tabular-nums text-text-muted-light dark:text-text-muted-dark">
            Round {debate.round}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTogglePause} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title={isPaused ? 'Resume' : 'Pause'}>
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onReset} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Reset debate">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Consensus bar */}
      <div className="px-5 py-2 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-text-muted-light dark:text-text-muted-dark font-medium">Consensus</span>
          <span className="font-bold tabular-nums text-accent-teal">{debate.consensusPercent}%</span>
        </div>
        <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-teal to-accent-teal-light transition-all duration-700"
            style={{ width: `${debate.consensusPercent}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div ref={feedRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <AnimatePresence initial={false}>
          {debate.messages.map((msg) => {
            const agent = AGENT_CONFIG[msg.agent];
            const sentiment = SENTIMENT_INDICATOR[msg.sentiment];
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex gap-3 group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${agent.bgColor}`}>
                  {agent.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold ${agent.color}`}>{agent.name}</span>
                    <span className={`text-[10px] ${sentiment.color}`}>{sentiment.label}</span>
                    <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark tabular-nums ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-text-light dark:text-text-dark leading-relaxed">{msg.text}</p>
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="mt-1.5 flex gap-1.5 flex-wrap">
                      {msg.evidence.map((ev, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-text-muted-light dark:text-text-muted-dark">
                          📎 {ev}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {debate.isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pl-11 pt-1">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark">Agents deliberating...</span>
          </motion.div>
        )}
      </div>

      {!autoScroll && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; setAutoScroll(true); }}
          className="absolute bottom-20 right-6 w-8 h-8 rounded-full bg-accent-teal text-white shadow-lg flex items-center justify-center"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.button>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border-light dark:border-border-dark flex items-center gap-2">
        <input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Inject your argument into the debate..."
          className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-accent-teal/20 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!userInput.trim()}
          className="p-2.5 rounded-xl bg-accent-teal text-white hover:bg-accent-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
