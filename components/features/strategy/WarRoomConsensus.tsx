import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DebateState, AgentRole, Sentiment, DebateMessage } from './WarRoomDebateFeed';

const AGENT_CONFIG: Record<AgentRole, { name: string; color: string; bgColor: string; avatar: string }> = {
  orchestrator: { name: 'Orchestrator', color: 'text-accent-teal', bgColor: 'bg-accent-teal/10', avatar: '🎯' },
  scout: { name: 'Scout', color: 'text-blue-400', bgColor: 'bg-blue-400/10', avatar: '🔍' },
  guardian: { name: 'Guardian', color: 'text-amber-400', bgColor: 'bg-amber-400/10', avatar: '🛡️' },
};

const SENTIMENT_BORDER: Record<Sentiment, string> = {
  agree: 'border-green-400/60',
  challenge: 'border-rose-400/60',
  neutral: 'border-slate-400/40',
};

const SENTIMENT_BADGE: Record<Sentiment, { label: string; bg: string; text: string }> = {
  agree: { label: 'Agrees', bg: 'bg-green-400/10', text: 'text-green-400' },
  challenge: { label: 'Challenges', bg: 'bg-rose-400/10', text: 'text-rose-400' },
  neutral: { label: 'Neutral', bg: 'bg-slate-400/10', text: 'text-slate-400' },
};

const AGENTS: AgentRole[] = ['orchestrator', 'scout', 'guardian'];

interface WarRoomConsensusProps {
  debate: DebateState;
  onForceConsensus?: () => void;
  onExportTranscript?: () => void;
}

function getGaugeColor(percent: number): string {
  if (percent < 40) return '#fb7185';   // rose-400
  if (percent < 70) return '#fbbf24';   // amber-400
  return '#00D4AA';                      // accent-teal
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

/* ── Agent Position Card ─────────────────────────────────────────── */

interface PositionCardProps {
  role: AgentRole;
  lastMessage: DebateMessage | undefined;
  messageCount: number;
}

const PositionCard: React.FC<PositionCardProps> = ({ role, lastMessage, messageCount }) => {
  const agent = AGENT_CONFIG[role];
  const sentiment = lastMessage?.sentiment ?? 'neutral';
  const badge = SENTIMENT_BADGE[sentiment];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-xl border-2 ${SENTIMENT_BORDER[sentiment]} bg-surface-light dark:bg-surface-dark p-4 flex flex-col gap-3`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${agent.bgColor}`}>
          {agent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${agent.color}`}>{agent.name}</p>
          <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>
        <span className="text-[10px] tabular-nums text-text-muted-light dark:text-text-muted-dark font-medium">
          {messageCount} msg{messageCount !== 1 ? 's' : ''}
        </span>
      </div>

      {lastMessage ? (
        <p className="text-xs text-text-light dark:text-text-dark leading-relaxed">
          {truncate(lastMessage.text, 120)}
        </p>
      ) : (
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark italic">No messages yet</p>
      )}
    </motion.div>
  );
};

/* ── Consensus Gauge (SVG ring) ──────────────────────────────────── */

const GAUGE_SIZE = 140;
const STROKE_WIDTH = 10;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ConsensusGauge: React.FC<{ percent: number }> = ({ percent }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const color = getGaugeColor(clamped);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-2"
    >
      <svg width={GAUGE_SIZE} height={GAUGE_SIZE} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        {/* Value arc */}
        <motion.circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute flex flex-col items-center justify-center" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
        <motion.span
          key={clamped}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black tabular-nums"
          style={{ color }}
        >
          {clamped}%
        </motion.span>
        <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-medium uppercase tracking-wider">
          Consensus
        </span>
      </div>
    </motion.div>
  );
};

/* ── Outcome Card ────────────────────────────────────────────────── */

const OutcomeCard: React.FC<{ topic: string; recommendation: string; percent: number }> = ({
  topic,
  recommendation,
  percent,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
    className="glass-card-light dark:glass-card p-5 relative overflow-hidden border-2 border-accent-teal/40"
  >
    {/* Celebratory glow */}
    <div className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none ring-2 ring-accent-teal/20" />

    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-xl bg-accent-teal/10">
        <CheckCircle2 className="w-6 h-6 text-accent-teal" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-accent-teal">Consensus Reached</h3>
        <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark tabular-nums">
          Confidence: {percent}%
        </span>
      </div>
    </div>

    <p className="text-xs font-semibold text-text-light dark:text-text-dark mb-1">{topic}</p>
    <p className="text-xs text-text-light dark:text-text-dark leading-relaxed">{recommendation}</p>
  </motion.div>
);

/* ── Main Component ──────────────────────────────────────────────── */

export const WarRoomConsensus: React.FC<WarRoomConsensusProps> = ({
  debate,
  onForceConsensus,
  onExportTranscript,
}) => {
  // Derived data per agent
  const agentData = useMemo(() => {
    const result: Record<AgentRole, { last: DebateMessage | undefined; count: number }> = {
      orchestrator: { last: undefined, count: 0 },
      scout: { last: undefined, count: 0 },
      guardian: { last: undefined, count: 0 },
    };
    for (const msg of debate.messages) {
      result[msg.agent].count += 1;
      result[msg.agent].last = msg;
    }
    return result;
  }, [debate.messages]);

  const lastOrchestratorMessage = agentData.orchestrator.last?.text ?? 'Awaiting orchestrator summary.';
  const consensusReached = debate.consensusPercent >= 90;
  const canForce = debate.phase === 'consensus' && debate.consensusPercent >= 50;

  // Build markdown transcript
  const buildTranscript = useCallback((): string => {
    const lines: string[] = [
      `# War Room Debate: ${debate.topic}`,
      `## Round ${debate.round} - ${debate.phase}`,
      '',
    ];

    for (const msg of debate.messages) {
      const agent = AGENT_CONFIG[msg.agent];
      lines.push(`### ${agent.name} ${agent.avatar}`);
      lines.push(`> ${msg.text}`);
      lines.push(`Sentiment: ${msg.sentiment} | ${msg.timestamp}`);
      if (msg.evidence?.length) {
        lines.push(`Evidence: ${msg.evidence.join(', ')}`);
      }
      lines.push('');
    }

    lines.push(`## Consensus: ${debate.consensusPercent}%`);
    return lines.join('\n');
  }, [debate]);

  const handleExport = useCallback(() => {
    const markdown = buildTranscript();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `war-room-${debate.topic.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    onExportTranscript?.();
  }, [buildTranscript, debate.topic, onExportTranscript]);

  return (
    <div className="glass-card-light dark:glass-card p-5 space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
          Consensus Analysis
        </h2>
        <div className="flex items-center gap-2">
          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Transcript
          </button>
        </div>
      </div>

      {/* Responsive grid: positions + gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1 — first agent card */}
        <div className="flex flex-col gap-4">
          <PositionCard
            role="orchestrator"
            lastMessage={agentData.orchestrator.last}
            messageCount={agentData.orchestrator.count}
          />
        </div>

        {/* Column 2 — gauge + force button */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            <ConsensusGauge percent={debate.consensusPercent} />
          </div>

          {/* Force Consensus */}
          <button
            onClick={onForceConsensus}
            disabled={!canForce}
            title={!canForce ? 'Requires consensus phase & 50%+ agreement' : undefined}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              canForce
                ? 'bg-accent-teal text-white hover:bg-accent-teal/90 shadow-lg shadow-accent-teal/20'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4" />
            Force Consensus
          </button>
        </div>

        {/* Column 3 — remaining agent cards stacked */}
        <div className="flex flex-col gap-4">
          <PositionCard
            role="scout"
            lastMessage={agentData.scout.last}
            messageCount={agentData.scout.count}
          />
          <PositionCard
            role="guardian"
            lastMessage={agentData.guardian.last}
            messageCount={agentData.guardian.count}
          />
        </div>
      </div>

      {/* Outcome card — visible only when consensus ≥ 90% */}
      <AnimatePresence>
        {consensusReached && (
          <OutcomeCard
            topic={debate.topic}
            recommendation={lastOrchestratorMessage}
            percent={debate.consensusPercent}
          />
        )}
      </AnimatePresence>

      {/* Low-consensus warning */}
      <AnimatePresence>
        {debate.phase === 'consensus' && debate.consensusPercent < 40 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs text-amber-400 px-3 py-2 rounded-lg bg-amber-400/5 border border-amber-400/20"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Consensus is below 40% — agents have significant disagreements.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
