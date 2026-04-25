import React, { useMemo } from 'react';
import { TInitiative } from '../types';
import { STATUS_STYLES } from '../constants';
import { DataTable, Column } from './ui/DataTable';
import { ComplianceBadge } from './ui/ComplianceBadge';
import { LoadMoreButton } from './common/LoadMoreButton';
import { Briefcase, Globe, ShieldCheck, Cpu } from 'lucide-react';

interface InitiativesListProps {
  initiatives: TInitiative[];
  onSelectInitiative: (initiative: TInitiative) => void;
  nextCursor?: string | null;
  loading?: boolean;
  onLoadMore?: () => void;
}

const ConfidenceBar: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'bg-accent-teal' : pct >= 60 ? 'bg-accent-amber' : 'bg-accent-red';
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/5">
        <div 
            className={`h-full rounded-full ${color} transition-all duration-1000 shadow-[0_0_10px_rgba(45,212,191,0.3)]`} 
            style={{ width: `${pct}%` }} 
        />
      </div>
      <span className="text-[10px] font-black tabular-nums text-text-muted-dark uppercase tracking-widest">{pct}%</span>
    </div>
  );
};

export const InitiativesList: React.FC<InitiativesListProps> = ({ 
    initiatives, 
    onSelectInitiative,
    nextCursor,
    loading,
    onLoadMore
}) => {
    const columns: Column<TInitiative>[] = useMemo(() => [
      {
        key: 'title',
        header: 'Strategic Initiative',
        sortable: true,
        width: '35%',
        render: (row) => (
          <div className="py-1">
            <div className="font-bold text-white tracking-tight text-sm group-hover:text-accent-teal transition-colors">{row.title}</div>
            <div className="text-[10px] text-text-muted-dark font-medium truncate max-w-xs mt-1 uppercase tracking-wider opacity-60">{row.description}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => (
          <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.15em] border backdrop-blur-md ${STATUS_STYLES[row.status]}`}>
            {row.status}
          </span>
        ),
      },
      {
        key: 'sector',
        header: 'Compliance Environment',
        sortable: true,
        render: (row) => (
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-teal opacity-50" />
                <ComplianceBadge sector={row.sector} />
            </div>
        ),
      },
      {
        key: 'confidenceScore',
        header: 'Cortex Score',
        sortable: true,
        render: (row) => (
            <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-accent-teal opacity-50" />
                <ConfidenceBar score={(row as any).confidenceScore ?? 0.82} />
            </div>
        ),
      },
      {
        key: 'owner',
        header: 'Lead Analyst',
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.owner.avatarUrl ? (
              <img className="h-8 w-8 rounded-xl border border-white/10 object-cover shadow-lg" src={row.owner.avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
                <div className="h-8 w-8 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                    {row.owner.name.charAt(0)}
                </div>
            )}
            <span className="text-xs font-bold text-white/80">{row.owner.name}</span>
          </div>
        ),
      },
    ], []);

    return (
        <div className="space-y-10 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-teal/20 rounded-lg">
                            <Briefcase className="h-5 w-5 text-accent-teal" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter">Strategic Briefcase</h1>
                    </div>
                    <p className="text-sm text-text-muted-dark font-medium uppercase tracking-[0.3em] opacity-60">Real-time Global Perspective</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-xl group hover:border-white/10 transition-all">
                    <Globe className="h-4 w-4 text-accent-teal animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{(initiatives || []).length} Active Vectors</span>
                </div>
            </div>

            <div className="glass-surface metallic-sheen border border-border-dark rounded-[2.5rem] overflow-hidden shadow-2xl p-1">
                <DataTable<TInitiative>
                  columns={columns}
                  data={initiatives || []}
                  pageSize={20}
                  loading={loading && (initiatives || []).length === 0}
                  onRowClick={onSelectInitiative}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No initiatives found. Create your first initiative to get started."
                />
            </div>

            <div className="flex justify-center">
                <LoadMoreButton 
                    onClick={onLoadMore || (() => {})} 
                    loading={!!loading} 
                    hasNextPage={!!nextCursor} 
                    label="Expand Intelligence Grid"
                />
            </div>
        </div>
    );
};
