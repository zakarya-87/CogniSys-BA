import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileJson, LayoutGrid, GitBranch, Activity, Table2, Search, Filter, X } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';

export interface Artifact {
  id: string;
  title: string;
  type: 'swot' | 'bmc' | 'c4' | 'bpmn' | 'table' | 'generic';
  generatedAt: string;
  initiativeId?: string;
  data?: any;
}

const TYPE_CONFIG: Record<Artifact['type'], { label: string; icon: React.ElementType; color: string }> = {
  swot: { label: 'SWOT', icon: LayoutGrid, color: 'text-amber-500 bg-amber-500/10' },
  bmc: { label: 'BMC', icon: Table2, color: 'text-blue-500 bg-blue-500/10' },
  c4: { label: 'C4 Model', icon: GitBranch, color: 'text-accent-teal bg-accent-teal/10' },
  bpmn: { label: 'BPMN', icon: Activity, color: 'text-rose-500 bg-rose-500/10' },
  table: { label: 'Table', icon: Table2, color: 'text-violet-500 bg-violet-500/10' },
  generic: { label: 'Document', icon: FileJson, color: 'text-silver bg-silver/10' },
};

interface ArtifactGridProps {
  artifacts: Artifact[];
  loading?: boolean;
  onSelect?: (artifact: Artifact) => void;
}

const SwotPreview: React.FC = () => (
  <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-16 rounded-lg overflow-hidden opacity-60">
    <div className="bg-green-500/20" />
    <div className="bg-amber-500/20" />
    <div className="bg-blue-500/20" />
    <div className="bg-red-500/20" />
  </div>
);

const BmcPreview: React.FC = () => (
  <div className="grid grid-cols-5 grid-rows-2 gap-0.5 w-full h-16 rounded-lg overflow-hidden opacity-60">
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className={`bg-blue-500/15 ${i === 4 ? 'col-span-1 row-span-2' : ''}`} />
    ))}
  </div>
);

const C4Preview: React.FC = () => (
  <div className="flex items-center justify-center h-16 opacity-60">
    <div className="flex items-center gap-1">
      <div className="w-8 h-6 rounded border border-accent-teal/40 bg-accent-teal/10" />
      <div className="w-4 h-px bg-accent-teal/40" />
      <div className="w-8 h-6 rounded border border-accent-teal/40 bg-accent-teal/10" />
      <div className="w-4 h-px bg-accent-teal/40" />
      <div className="w-8 h-6 rounded border border-accent-teal/40 bg-accent-teal/10" />
    </div>
  </div>
);

const PREVIEWS: Partial<Record<Artifact['type'], React.FC>> = {
  swot: SwotPreview,
  bmc: BmcPreview,
  c4: C4Preview,
};

const FilterPill: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      active
        ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/30'
        : 'text-text-muted-light dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
    }`}
  >
    {label}
  </button>
);

export const ArtifactGrid: React.FC<ArtifactGridProps> = ({ artifacts, loading, onSelect }) => {
  const [filterType, setFilterType] = useState<Artifact['type'] | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = artifacts;
    if (filterType !== 'all') result = result.filter(a => a.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q));
    }
    return result;
  }, [artifacts, filterType, search]);

  const handleSelect = useCallback((artifact: Artifact) => {
    onSelect?.(artifact);
  }, [onSelect]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" width={80} height={32} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" height={180} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-accent-teal/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-text-muted-light" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <FilterPill active={filterType === 'all'} onClick={() => setFilterType('all')} label="All" />
          {Object.entries(TYPE_CONFIG).map(([key, conf]) => (
            <FilterPill
              key={key}
              active={filterType === key}
              onClick={() => setFilterType(key as Artifact['type'])}
              label={conf.label}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted-light dark:text-text-muted-dark">
          <Filter className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No artifacts match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((artifact, idx) => {
              const config = TYPE_CONFIG[artifact.type];
              const Preview = PREVIEWS[artifact.type];
              return (
                <motion.div
                  key={artifact.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  onClick={() => handleSelect(artifact)}
                  className="glass-card-light dark:glass-card p-5 cursor-pointer hover:shadow-lg hover:border-accent-teal/30 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${config.color}`}>
                      <config.icon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark tabular-nums">
                      {new Date(artifact.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {Preview && <Preview />}
                  <h4 className="mt-3 text-sm font-semibold text-text-main-light dark:text-text-main-dark group-hover:text-accent-teal transition-colors line-clamp-2">
                    {artifact.title}
                  </h4>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
