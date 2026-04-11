import React, { useMemo } from 'react';
import { TInitiative } from '../types';
import { STATUS_STYLES } from '../constants';
import { DataTable, Column } from './ui/DataTable';
import { ComplianceBadge } from './ui/ComplianceBadge';

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
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-text-muted-light dark:text-text-muted-dark">{pct}%</span>
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
        header: 'Initiative',
        sortable: true,
        width: '35%',
        render: (row) => (
          <div>
            <div className="font-semibold text-text-main-light dark:text-text-main-dark">{row.title}</div>
            <div className="text-xs text-text-muted-light dark:text-text-muted-dark truncate max-w-xs mt-0.5">{row.description}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => (
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${STATUS_STYLES[row.status]}`}>
            {row.status}
          </span>
        ),
      },
      {
        key: 'sector',
        header: 'Compliance',
        sortable: true,
        render: (row) => <ComplianceBadge sector={row.sector} />,
      },
      {
        key: 'confidenceScore',
        header: 'AI Confidence',
        sortable: true,
        render: (row) => <ConfidenceBar score={(row as any).confidenceScore ?? 0.82} />,
      },
      {
        key: 'owner',
        header: 'Owner',
        render: (row) => (
          <div className="flex items-center gap-2">
            {row.owner.avatarUrl && (
              <img className="h-7 w-7 rounded-lg border border-border-light dark:border-border-dark object-cover" src={row.owner.avatarUrl} alt="" referrerPolicy="no-referrer" />
            )}
            <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark">{row.owner.name}</span>
          </div>
        ),
      },
    ], []);

    return (
        <div className="glass-card-light dark:glass-card p-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">All Initiatives</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-1">A comprehensive view of your strategic portfolio.</p>
                </div>
                <div className="bg-accent-teal/10 dark:bg-accent-teal/20 px-6 py-2.5 rounded-xl border border-accent-teal/20 w-fit">
                    <span className="text-xs font-bold text-accent-teal uppercase tracking-widest tabular-nums">{initiatives.length} Total Initiatives</span>
                </div>
            </div>

            <DataTable<TInitiative>
              columns={columns}
              data={initiatives}
              pageSize={10}
              loading={loading && initiatives.length === 0}
              onRowClick={onSelectInitiative}
              keyExtractor={(row) => row.id}
              emptyMessage="No initiatives found. Create your first initiative to get started."
            />

            {nextCursor && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-accent-teal text-white rounded-xl font-bold text-sm shadow-lg shadow-accent-teal/20 hover:bg-accent-teal/90 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load More Initiatives from Server'}
                    </button>
                </div>
            )}
        </div>
    );
};
