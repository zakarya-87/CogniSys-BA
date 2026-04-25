import React from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

interface LoadMoreButtonProps {
    onClick: () => void;
    loading: boolean;
    hasNextPage: boolean;
    label?: string;
    loadingLabel?: string;
    className?: string;
}

/**
 * A premium, glassmorphic button for manual cursor-based pagination.
 */
export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
    onClick,
    loading,
    hasNextPage,
    label = 'Load More',
    loadingLabel = 'Synchronizing...',
    className = ''
}) => {
    if (!hasNextPage && !loading) return null;

    return (
        <div className={`flex justify-center py-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${className}`}>
            <button
                onClick={onClick}
                disabled={loading}
                className={`
                    group relative flex items-center gap-2 px-8 py-3.5 
                    bg-surface-light/40 dark:bg-surface-dark/40 
                    backdrop-blur-md border border-border-light dark:border-border-dark 
                    rounded-2xl transition-all duration-300
                    text-text-muted-light dark:text-text-muted-dark font-bold uppercase tracking-widest text-[11px]
                    hover:border-accent-purple/50 hover:text-accent-purple hover:shadow-2xl hover:shadow-accent-purple/10
                    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                `}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{loadingLabel}</span>
                    </>
                ) : (
                    <>
                        <span>{label}</span>
                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </>
                )}
                
                {/* Subtle outer glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-accent-purple/5 blur-xl -z-10" />
            </button>
        </div>
    );
};
