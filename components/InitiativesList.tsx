import React, { useState, useMemo } from 'react';
import { TInitiative, InitiativeStatus } from '../types';
import { STATUS_STYLES } from '../constants';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface InitiativesListProps {
  initiatives: TInitiative[];
  onSelectInitiative: (initiative: TInitiative) => void;
  nextCursor?: string | null;
  loading?: boolean;
  onLoadMore?: () => void;
}

type SortKey = 'title' | 'status';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 5;

const SortIcon: React.FC<{ order: SortOrder | null }> = ({ order }) => {
    if (!order) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return order === 'asc' ? <ArrowUp className="h-4 w-4 text-accent-purple" /> : <ArrowDown className="h-4 w-4 text-accent-purple" />;
};

export const InitiativesList: React.FC<InitiativesListProps> = ({ 
    initiatives, 
    onSelectInitiative,
    nextCursor,
    loading,
    onLoadMore
}) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder } | null>({ key: 'title', order: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);

    const sortedInitiatives = useMemo(() => {
        let sortableItems = [...initiatives];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.order === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.order === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [initiatives, sortConfig]);
    
    const totalPages = Math.ceil(sortedInitiatives.length / ITEMS_PER_PAGE);

    const paginatedInitiatives = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedInitiatives.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedInitiatives, currentPage]);

    const requestSort = (key: SortKey) => {
        let order: SortOrder = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }
        setSortConfig({ key, order });
        setCurrentPage(1); // Reset to first page on new sort
    };
    
    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-border-light dark:border-border-dark animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">All Initiatives</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-1">A comprehensive view of your strategic portfolio.</p>
                </div>
                <div className="bg-accent-purple/10 dark:bg-accent-purple/20 px-6 py-2.5 rounded-xl border border-accent-purple/20 w-fit">
                    <span className="text-xs font-bold text-accent-purple uppercase tracking-widest">{initiatives.length} Total Initiatives</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                    <thead className="bg-surface-darker/5 dark:bg-surface-darker/30">
                        <tr>
                            <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">
                                <button onClick={() => requestSort('title')} className="flex items-center gap-2 hover:text-text-main-light dark:hover:text-text-main-dark transition-colors outline-none">
                                    Title
                                    <SortIcon order={sortConfig?.key === 'title' ? sortConfig.order : null} />
                                </button>
                            </th>
                            <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">
                                <button onClick={() => requestSort('status')} className="flex items-center gap-2 hover:text-text-main-light dark:hover:text-text-main-dark transition-colors outline-none">
                                    Status
                                    <SortIcon order={sortConfig?.key === 'status' ? sortConfig.order : null} />
                                </button>
                            </th>
                            <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">
                                Owner & Sector
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-surface-light dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark">
                        {paginatedInitiatives.map((initiative) => (
                            <tr 
                                key={initiative.id} 
                                onClick={() => onSelectInitiative(initiative)} 
                                className="hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20 cursor-pointer transition-all group"
                            >
                                <td className="px-8 py-6 whitespace-nowrap">
                                    <div className="text-base font-bold text-text-main-light dark:text-text-main-dark group-hover:text-accent-purple transition-colors">{initiative.title}</div>
                                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark truncate max-w-md mt-1">
                                        {initiative.description}
                                    </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap">
                                    <span className={`text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border ${STATUS_STYLES[initiative.status]}`}>
                                        {initiative.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-xl border border-border-light dark:border-border-dark shadow-sm object-cover" src={initiative.owner.avatarUrl} alt="" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-text-main-light dark:text-text-main-dark">{initiative.owner.name}</div>
                                            <div className="text-[10px] font-bold text-accent-purple uppercase tracking-wider">{initiative.sector}</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-light dark:border-border-dark">
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-text-main-light dark:text-text-main-dark bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl hover:bg-surface-darker/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
                            Page
                        </span>
                        <div className="bg-accent-purple/10 dark:bg-accent-purple/20 px-3 py-1 rounded-lg border border-accent-purple/20">
                            <span className="text-sm font-bold text-accent-purple">
                                {currentPage}
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
                            of {totalPages}
                        </span>
                    </div>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-text-main-light dark:text-text-main-dark bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl hover:bg-surface-darker/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                    >
                        Next
                    </button>
                </div>
            )}

            {nextCursor && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-accent-purple text-white rounded-xl font-bold text-sm shadow-lg shadow-accent-purple/20 hover:bg-accent-purple/90 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load More Initiatives from Server'}
                    </button>
                </div>
            )}
        </div>
    );
};
