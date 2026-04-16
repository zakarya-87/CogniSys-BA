
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative } from '../../../types';
import { LayoutGrid, List, Plus, Search, Filter, Box, Clock, MoreVertical, Star, ArrowUpRight } from 'lucide-react';
import { Button } from '../../ui/Button';

interface MyWorkspaceProps {
    initiatives: TInitiative[];
    onSelectInitiative: (init: TInitiative) => void;
}

export const MyWorkspace: React.FC<MyWorkspaceProps> = ({ initiatives, onSelectInitiative }) => {
    const { t } = useTranslation(['dashboard']);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">My Workspace</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-2 font-medium">Manage your personal strategic focus.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-surface-darker/5 dark:bg-surface-darker/20 rounded-xl p-1 flex gap-1">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-surface-dark shadow-sm text-accent-purple' : 'text-text-muted-light/40 hover:text-text-muted-light'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-surface-dark shadow-sm text-accent-purple' : 'text-text-muted-light/40 hover:text-text-muted-light'}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                    <Button className="bg-accent-purple shadow-lg shadow-accent-purple/20">
                        <Plus className="h-4 w-4 mr-2" />
                        NEW INITIATIVE
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-light/40 group-focus-within:text-accent-purple transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search workspace..." 
                        className="w-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-accent-purple outline-none transition-all shadow-sm"
                    />
                </div>
                <Button variant="outline" className="border-border-light dark:border-border-dark bg-white dark:bg-surface-dark">
                    <Filter className="h-4 w-4 mr-2" />
                    FILTERS
                </Button>
            </div>

            {/* Content Grid */}
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {initiatives.length > 0 ? initiatives.map((init) => (
                    <div 
                        key={init.id} 
                        onClick={() => onSelectInitiative(init)}
                        className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-accent-purple transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <ArrowUpRight className="h-5 w-5 text-accent-purple" />
                        </div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="h-12 w-12 bg-accent-purple/10 rounded-2xl flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
                                <Box className="h-6 w-6 text-accent-purple" />
                            </div>
                            <button className="text-text-muted-light/20 hover:text-accent-amber transition-colors">
                                <Star className="h-5 w-5" />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight group-hover:text-accent-purple transition-colors">{init.title}</h3>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-6 line-clamp-2">{init.description}</p>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-border-light dark:border-border-dark">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-text-muted-light" />
                                <span className="text-[10px] font-bold text-text-muted-light uppercase tracking-widest">Added 2d ago</span>
                            </div>
                            <div className="flex -space-x-2">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-6 w-6 rounded-lg bg-surface-darker/10 dark:bg-surface-darker/30 border-2 border-white dark:border-surface-dark flex items-center justify-center">
                                        <span className="text-[8px] font-bold">U{i}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 bg-surface-darker/5 dark:bg-surface-darker/10 rounded-3xl border-2 border-dashed border-border-light dark:border-border-dark flex flex-col items-center justify-center text-center">
                        <Box className="h-12 w-12 text-text-muted-light/20 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Workspace Empty</h3>
                        <p className="text-sm text-text-muted-light max-w-xs mx-auto">Start by creating your first initiative to see it appearing here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
