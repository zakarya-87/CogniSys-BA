import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonTable } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T>({
  columns,
  data,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  keyExtractor,
  className = '',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }, [sortKey, sortDir]);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pagedData = useMemo(
    () => sortedData.slice(page * pageSize, (page + 1) * pageSize),
    [sortedData, page, pageSize]
  );

  if (loading) {
    return <SkeletonTable rows={pageSize} cols={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted-light dark:text-text-muted-dark">
        <ChevronsUpDown className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] shadow-2xl backdrop-blur-xl metallic-sheen">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-8 py-6 text-left font-black text-[10px] uppercase tracking-[0.3em] text-white/40 ${
                    col.sortable ? 'cursor-pointer select-none hover:text-accent-teal transition-all' : ''
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-2">
                    {col.header}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        {sortKey === col.key && sortDir === 'asc' ? (
                          <ChevronUp className="w-4 h-4 text-accent-cyan" />
                        ) : sortKey === col.key && sortDir === 'desc' ? (
                          <ChevronDown className="w-4 h-4 text-accent-cyan" />
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 opacity-20" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pagedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={`group transition-all duration-500 ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-accent-teal/5'
                    : 'hover:bg-white/[0.01]'
                }`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-8 py-5 tabular-nums text-white/70 group-hover:text-white transition-colors">
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 tabular-nums">
            {page * pageSize + 1} – {Math.min((page + 1) * pageSize, sortedData.length)} <span className="mx-1 opacity-50">/</span> {sortedData.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-3 rounded-xl border border-white/5 bg-white/5 hover:border-accent-teal/40 hover:bg-accent-teal/10 disabled:opacity-10 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest tabular-nums">
                Page {page + 1} <span className="mx-1 opacity-30">/</span> {totalPages}
                </span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-3 rounded-xl border border-white/5 bg-white/5 hover:border-accent-teal/40 hover:bg-accent-teal/10 disabled:opacity-10 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
