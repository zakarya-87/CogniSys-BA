import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, Copy, Trash2, Check,
  FileJson, LayoutGrid, GitBranch, Activity, Table2,
} from 'lucide-react';
import { DataTable, type Column } from '../../ui/DataTable';
import type { Artifact } from './ArtifactGrid';

/* ─── TYPE_CONFIG (mirrors ArtifactGrid) ──────────────────────────── */

const TYPE_CONFIG: Record<Artifact['type'], { label: string; icon: React.ElementType; color: string }> = {
  swot: { label: 'SWOT', icon: LayoutGrid, color: 'text-amber-500 bg-amber-500/10' },
  bmc: { label: 'BMC', icon: Table2, color: 'text-blue-500 bg-blue-500/10' },
  c4: { label: 'C4 Model', icon: GitBranch, color: 'text-accent-teal bg-accent-teal/10' },
  bpmn: { label: 'BPMN', icon: Activity, color: 'text-rose-500 bg-rose-500/10' },
  table: { label: 'Table', icon: Table2, color: 'text-violet-500 bg-violet-500/10' },
  generic: { label: 'Document', icon: FileJson, color: 'text-silver bg-silver/10' },
};

/* ─── Props ───────────────────────────────────────────────────────── */

interface ArtifactDetailModalProps {
  artifact: Artifact | null;
  onClose: () => void;
  onDelete?: (artifactId: string) => void;
}

/* ─── SWOT Renderer ───────────────────────────────────────────────── */

const SWOT_QUADRANTS = [
  { key: 'strengths', label: 'Strengths', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
  { key: 'weaknesses', label: 'Weaknesses', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
  { key: 'opportunities', label: 'Opportunities', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  { key: 'threats', label: 'Threats', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
] as const;

const SwotRenderer: React.FC<{ data: any }> = ({ data }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {SWOT_QUADRANTS.map(q => {
      const items: string[] = Array.isArray(data?.[q.key]) ? data[q.key] : [];
      return (
        <div key={q.key} className={`rounded-xl p-4 border ${q.bg} ${q.border}`}>
          <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${q.text}`}>{q.label}</h4>
          {items.length > 0 ? (
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <li key={i} className="text-sm text-text-main-light dark:text-text-main-dark flex items-start gap-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${q.text.replace('text-', 'bg-')}`} />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark italic">No items recorded</p>
          )}
        </div>
      );
    })}
  </div>
);

/* ─── BMC Renderer ────────────────────────────────────────────────── */

const BMC_BLOCKS = [
  { key: 'keyPartners', label: 'Key Partners', area: 'kp' },
  { key: 'keyActivities', label: 'Key Activities', area: 'ka' },
  { key: 'keyResources', label: 'Key Resources', area: 'kr' },
  { key: 'valuePropositions', label: 'Value Propositions', area: 'vp' },
  { key: 'customerRelationships', label: 'Customer Relationships', area: 'cr' },
  { key: 'channels', label: 'Channels', area: 'ch' },
  { key: 'customerSegments', label: 'Customer Segments', area: 'cs' },
  { key: 'costStructure', label: 'Cost Structure', area: 'cost' },
  { key: 'revenueStreams', label: 'Revenue Streams', area: 'rev' },
] as const;

const BmcRenderer: React.FC<{ data: any }> = ({ data }) => (
  <div
    className="grid gap-2 text-sm"
    style={{
      gridTemplateColumns: 'repeat(10, 1fr)',
      gridTemplateRows: 'auto auto auto',
      gridTemplateAreas: `
        "kp kp ka ka vp vp cr cr cs cs"
        "kp kp kr kr vp vp ch ch cs cs"
        "cost cost cost cost cost rev rev rev rev rev"
      `,
    }}
  >
    {BMC_BLOCKS.map(block => {
      const items: string[] = Array.isArray(data?.[block.key]) ? data[block.key] : [];
      return (
        <div
          key={block.key}
          className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 min-h-[80px]"
          style={{ gridArea: block.area }}
        >
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">{block.label}</h5>
          {items.length > 0 ? (
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-xs text-text-main-light dark:text-text-main-dark">• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark italic">—</p>
          )}
        </div>
      );
    })}
  </div>
);

/* ─── Diagram Code Renderer (C4 / BPMN) ──────────────────────────── */

const DiagramCodeRenderer: React.FC<{ data: any }> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const code = data?.mermaidCode ?? '';

  const handleCopy = useCallback(async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  if (!code) {
    return <p className="text-sm text-text-muted-light dark:text-text-muted-dark italic">No diagram code available.</p>;
  }

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy Diagram Code'}
      </button>
      <pre className="rounded-xl bg-slate-950/80 dark:bg-black/40 border border-border-light dark:border-border-dark p-5 pt-12 text-sm text-green-300 overflow-x-auto font-mono leading-relaxed">
        {code}
      </pre>
    </div>
  );
};

/* ─── Table Renderer ──────────────────────────────────────────────── */

const TableRenderer: React.FC<{ data: any }> = ({ data }) => {
  const rows: Record<string, any>[] = Array.isArray(data?.rows) ? data.rows : [];
  const headers: string[] = Array.isArray(data?.headers)
    ? data.headers
    : rows.length > 0
      ? Object.keys(rows[0])
      : [];

  const columns: Column<Record<string, any>>[] = headers.map(h => ({
    key: h,
    header: h.charAt(0).toUpperCase() + h.slice(1),
    sortable: true,
  }));

  if (columns.length === 0) {
    return <p className="text-sm text-text-muted-light dark:text-text-muted-dark italic">No table data available.</p>;
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      keyExtractor={(row) => JSON.stringify(row)}
      pageSize={15}
      emptyMessage="Table has no rows"
    />
  );
};

/* ─── Generic / JSON Renderer ─────────────────────────────────────── */

const CollapsibleSection: React.FC<{ label: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  label, children, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-text-muted-light dark:text-text-muted-dark bg-slate-50/80 dark:bg-surface-dark hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
      >
        {label}
        <span className="text-[10px]">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
};

const JsonValue: React.FC<{ value: unknown; depth?: number }> = ({ value, depth = 0 }) => {
  if (value === null) return <span className="text-rose-400">null</span>;
  if (typeof value === 'boolean') return <span className="text-amber-400">{String(value)}</span>;
  if (typeof value === 'number') return <span className="text-blue-400">{value}</span>;
  if (typeof value === 'string') return <span className="text-green-400">"{value}"</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-text-muted-light dark:text-text-muted-dark">[]</span>;
    return (
      <div className="space-y-1 pl-4">
        {value.map((item, i) => (
          <div key={i} className="flex items-start gap-1">
            <span className="text-text-muted-light dark:text-text-muted-dark select-none shrink-0">{i}:</span>
            <JsonValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-text-muted-light dark:text-text-muted-dark">{'{}'}</span>;

    if (depth > 0) {
      return (
        <CollapsibleSection label={`Object (${entries.length} keys)`} defaultOpen={depth < 2}>
          <div className="space-y-1 text-xs font-mono">
            {entries.map(([k, v]) => (
              <div key={k} className="flex items-start gap-1">
                <span className="text-violet-400 shrink-0">"{k}":</span>
                <JsonValue value={v} depth={depth + 1} />
              </div>
            ))}
          </div>
        </CollapsibleSection>
      );
    }

    return (
      <div className="space-y-2 text-xs font-mono">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start gap-1">
            <span className="text-violet-400 shrink-0">"{k}":</span>
            <JsonValue value={v} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
};

const GenericRenderer: React.FC<{ data: any }> = ({ data }) => {
  if (data == null) {
    return <p className="text-sm text-text-muted-light dark:text-text-muted-dark italic">No data available.</p>;
  }

  return (
    <div className="rounded-xl bg-slate-950/80 dark:bg-black/40 border border-border-light dark:border-border-dark p-5 overflow-x-auto">
      <JsonValue value={data} />
    </div>
  );
};

/* ─── Body (type router) ─────────────────────────────────────────── */

const ArtifactBody: React.FC<{ artifact: Artifact }> = React.memo(({ artifact }) => {
  switch (artifact.type) {
    case 'swot':
      return <SwotRenderer data={artifact.data} />;
    case 'bmc':
      return <BmcRenderer data={artifact.data} />;
    case 'c4':
    case 'bpmn':
      return <DiagramCodeRenderer data={artifact.data} />;
    case 'table':
      return <TableRenderer data={artifact.data} />;
    case 'generic':
    default:
      return <GenericRenderer data={artifact.data} />;
  }
});

/* ─── Main Modal ──────────────────────────────────────────────────── */

export const ArtifactDetailModal: React.FC<ArtifactDetailModalProps> = ({ artifact, onClose, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Reset delete confirmation when artifact changes
  useEffect(() => {
    setConfirmDelete(false);
    setCopied(false);
  }, [artifact?.id]);

  const handleDownload = useCallback(() => {
    if (!artifact?.data) return;
    const json = JSON.stringify(artifact.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [artifact]);

  const handleCopy = useCallback(async () => {
    if (!artifact?.data) return;
    await navigator.clipboard.writeText(JSON.stringify(artifact.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [artifact]);

  const handleDelete = useCallback(() => {
    if (!artifact || !onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(artifact.id);
    onClose();
  }, [artifact, onDelete, confirmDelete, onClose]);

  return (
    <AnimatePresence>
      {artifact && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            key="panel"
            className="glass-card-light dark:glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              {/* ── Header ─────────────────────────────────────── */}
              <div className="space-y-3 pr-8">
                {(() => {
                  const config = TYPE_CONFIG[artifact.type];
                  return (
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${config.color}`}>
                      <config.icon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                  );
                })()}
                <h2 className="text-xl sm:text-2xl font-bold text-text-main-light dark:text-text-main-dark">
                  {artifact.title}
                </h2>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark tabular-nums">
                  Generated {new Date(artifact.generatedAt).toLocaleString()}
                </p>
              </div>

              {/* ── Action buttons ─────────────────────────────── */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON
                </button>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>

                {onDelete && (
                  confirmDelete ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs text-red-400 font-medium">Are you sure?</span>
                      <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted-light dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )
                )}
              </div>

              {/* ── Type-specific body ─────────────────────────── */}
              <ArtifactBody artifact={artifact} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ArtifactDetailModal;
