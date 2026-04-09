
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, Sector } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useCatalyst } from '../context/CatalystContext';
import { IntelligenceIngestor } from './ai/IntelligenceIngestor';
import { motion, AnimatePresence } from 'motion/react';

import { 
  Zap, 
  Folder, 
  Sparkles, 
  Eye, 
  Plus, 
  LayoutGrid, 
  TrendingUp, 
  Layers,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

interface DashboardProps {
  initiatives: TInitiative[];
  onSelectInitiative: (initiative: TInitiative) => void;
  onCreateInitiative: (title?: string, description?: string, sector?: Sector) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ initiatives, onSelectInitiative, onCreateInitiative }) => {
  const { setHiveCommand, setCurrentView, user, loading, apiError } = useCatalyst();
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const [isIngestorOpen, setIsIngestorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Reset to page 1 when search changes
  useEffect(() => setPage(1), [searchQuery]);
  
  const numberFormatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const percentFormatter = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent' }), [i18n.language]);
  
  // Group initiatives by Sector
  const filteredInitiatives = useMemo(() => {
    if (!searchQuery.trim()) return initiatives;
    const query = searchQuery.toLowerCase();
    return initiatives.filter(init => 
      init.title.toLowerCase().includes(query) || 
      init.description.toLowerCase().includes(query) ||
      init.sector.toLowerCase().includes(query)
    );
  }, [initiatives, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredInitiatives.length / ITEMS_PER_PAGE));

  const paginatedInitiatives = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredInitiatives.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInitiatives, page]);

  const groupedInitiatives = useMemo(() => {
    const groups: Record<string, TInitiative[]> = {};
    paginatedInitiatives.forEach(init => {
      if (!groups[init.sector]) {
        groups[init.sector] = [];
      }
      groups[init.sector].push(init);
    });
    return groups;
  }, [paginatedInitiatives]);

  const sortedSectors = Object.keys(groupedInitiatives).sort();

  const stats = useMemo(() => {
    return [
      { 
        label: t('dashboard:activeInitiatives'), 
        value: numberFormatter.format(initiatives.length), 
        icon: Folder, 
        color: 'text-accent-purple', 
        bg: 'bg-accent-purple/10',
        description: t('dashboard:activeStrategicProjects')
      },
      { 
        label: t('dashboard:activeSectors'), 
        value: numberFormatter.format(new Set(initiatives.map(i => i.sector)).size), 
        icon: LayoutGrid, 
        color: 'text-accent-blue', 
        bg: 'bg-accent-blue/10',
        description: t('dashboard:diversifiedEcosystem')
      },
      { 
        label: t('dashboard:efficiency'), 
        value: percentFormatter.format(0.94), 
        icon: TrendingUp, 
        color: 'text-accent-green', 
        bg: 'bg-accent-green/10',
        description: t('dashboard:executionEfficiency')
      },
    ];
  }, [initiatives, t, numberFormatter, percentFormatter]);

  const handleNightlyWatchman = () => {
      setHiveCommand("ACTIVATE NIGHTLY WATCHMAN PROTOCOL: Scan all active projects for market shifts using Scout, then have Guardian verify compliance risks, and finally Integromat should summarize the status.");
      setCurrentView('hive');
  };

  return (
    <div className="p-6 md:p-10 space-y-16 max-w-[1800px] mx-auto">
      {/* API Error Banner */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-6 py-4 text-red-600 dark:text-red-400"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </motion.div>
      )}

      {/* Loading Skeleton */}
      {loading && initiatives.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-surface-light dark:bg-surface-dark rounded-3xl border border-border-light dark:border-border-dark animate-pulse" />
          ))}
        </div>
      )}
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col lg:flex-row justify-between lg:items-end gap-10"
      >
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-12 bg-accent-purple rounded-full" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-purple">{t('dashboard:title')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-text-main-light dark:text-text-main-dark tracking-tight leading-none">
                {t('common:welcome', { name: user?.name?.split(' ')[0] || 'Strategist' })}
            </h1>
            <p className="text-text-muted-light dark:text-text-muted-dark text-xl max-w-2xl font-light leading-relaxed">
              {t('dashboard:subtitle')}
            </p>
        </div>
        <div className="flex gap-4 flex-wrap">
            <Button 
                variant="outline"
                onClick={handleNightlyWatchman}
                className="group border-border-light dark:border-border-dark px-6 py-6 rounded-2xl hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20 transition-all duration-300"
            >
                <Eye className="h-5 w-5 me-3 text-accent-purple group-hover:scale-110 transition-transform" />
                <span className="font-semibold">{t('dashboard:nightlyWatchman')}</span>
            </Button>
            <Button 
                variant="outline"
                onClick={() => setIsIngestorOpen(true)}
                className="group border-border-light dark:border-border-dark px-6 py-6 rounded-2xl hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20 transition-all duration-300"
            >
                <Sparkles className="h-5 w-5 me-3 text-accent-amber group-hover:rotate-12 transition-transform" />
                <span className="font-semibold">{t('dashboard:ingestIntelligence')}</span>
            </Button>
            <Button 
              onClick={() => onCreateInitiative()} 
              className="px-10 py-6 rounded-2xl bg-accent-purple hover:bg-accent-purple/90 text-white shadow-xl shadow-accent-purple/20 transition-all duration-300 hover:-translate-y-1"
            >
                <Plus className="h-5 w-5 me-3" />
                <span className="font-semibold">{t('common:create')}</span>
            </Button>
        </div>
      </motion.div>

      {/* Stats Grid - Technical Dashboard Recipe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-surface-light dark:bg-surface-dark p-8 rounded-3xl border border-border-light dark:border-border-dark shadow-sm flex flex-col gap-6 hover:shadow-xl hover:border-accent-purple/30 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="absolute top-0 end-0 w-32 h-32 bg-accent-purple/5 rounded-full -me-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className={`${stat.bg} p-4 rounded-2xl transition-all group-hover:scale-110 group-hover:rotate-3 duration-500`}>
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-accent-green uppercase tracking-widest bg-accent-green/10 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                +12%
              </div>
            </div>
            
            <div className="relative z-10">
              <p className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold tracking-tighter text-text-main-light dark:text-text-main-dark">{stat.value}</p>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark font-medium">{stat.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 border-y border-border-light dark:border-border-dark">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute ps-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted-light dark:text-text-muted-dark group-focus-within:text-accent-purple transition-colors" />
          <input 
            type="text"
            placeholder={t('dashboard:searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-12 pe-4 py-4 bg-surface-darker/5 dark:bg-surface-darker/20 border border-border-light dark:border-border-dark rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-text-muted-light dark:text-text-muted-dark">
          <Layers className="h-4 w-4" />
          <span>{t('dashboard:showingStats', { filtered: numberFormatter.format(filteredInitiatives.length), total: numberFormatter.format(initiatives.length) })}</span>
        </div>
      </div>

      {isIngestorOpen && (
          <IntelligenceIngestor 
              onClose={() => setIsIngestorOpen(false)} 
              onIngested={(title, description, sector) => {
                  onCreateInitiative(title, description, sector);
                  setIsIngestorOpen(false);
              }} 
          />
      )}

      {filteredInitiatives.length === 0 && !loading ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 bg-surface-light dark:bg-surface-dark rounded-[2.5rem] border border-dashed border-border-light dark:border-border-dark shadow-inner"
          >
              <div className="bg-accent-purple/10 p-10 rounded-3xl mb-8 relative">
                  <div className="absolute inset-0 bg-accent-purple/20 rounded-3xl animate-ping opacity-20" />
                  <Folder className="h-20 w-20 text-accent-purple relative z-10" />
              </div>
              <h3 className="text-4xl font-bold text-text-main-light dark:text-text-main-dark mb-4 tracking-tight">{t('dashboard:noInitiativesFound')}</h3>
              <p className="text-text-muted-light dark:text-text-muted-dark mb-12 max-w-md text-center text-xl font-light leading-relaxed">
                {searchQuery ? t('dashboard:noResultsFor', { query: searchQuery }) : t('dashboard:startByCreating')}
              </p>
              <Button onClick={() => onCreateInitiative()} className="px-14 py-6 rounded-2xl text-xl bg-accent-purple hover:bg-accent-purple/90 text-white shadow-2xl shadow-accent-purple/30 transition-all duration-300 hover:-translate-y-1">
                  <Plus className="h-7 w-7 me-3" />
                  {t('dashboard:createFirst')}
              </Button>
          </motion.div>
      ) : (
          <>
          <div className="space-y-24">
            {sortedSectors.map((sector, sIdx) => (
                <div key={sector} className="space-y-12">
                    <div className="flex items-end justify-between group">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-accent-purple" />
                            <span className="text-[10px] font-bold text-accent-purple uppercase tracking-[0.3em]">{t('dashboard:sectorVertical')}</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <h2 className="text-4xl font-bold text-text-main-light dark:text-text-main-dark tracking-tighter uppercase">
                                {sector}
                            </h2>
                            <div className="h-px w-24 bg-border-light dark:bg-border-dark group-hover:w-48 transition-all duration-700" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark px-6 py-3 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                          <span className="text-sm font-bold text-text-main-light dark:text-text-main-dark">
                              {numberFormatter.format(groupedInitiatives[sector].length)}
                          </span>
                          <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
                              {t('dashboard:activeProjects')}
                          </span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {groupedInitiatives[sector].map((initiative, iIdx) => (
                          <motion.div
                            key={initiative.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: (sIdx * 0.1) + (iIdx * 0.05) }}
                          >
                            <Card initiative={initiative} onClick={() => onSelectInitiative(initiative)} />
                          </motion.div>
                        ))}
                    </div>
                </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-accent-purple/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm font-semibold">Prev</span>
              </button>
              <span className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-accent-purple/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-semibold">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          </>
      )}

      {/* Footer CTA */}
      <div className="pt-20 pb-10 border-t border-border-light dark:border-border-dark flex flex-col items-center text-center space-y-8">
        <div className="bg-surface-darker/5 dark:bg-surface-darker/20 p-4 rounded-full">
          <Zap className="h-8 w-8 text-accent-amber animate-pulse" />
        </div>
        <div className="space-y-2">
          <h4 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark tracking-tight">{t('dashboard:readyToExpand')}</h4>
          <p className="text-text-muted-light dark:text-text-muted-dark">{t('dashboard:leverageAI')}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsIngestorOpen(true)}
          className="group px-10 py-5 rounded-2xl border-accent-purple/30 hover:border-accent-purple hover:bg-accent-purple/5 transition-all duration-300"
        >
          <span className="font-bold text-accent-purple me-2">{t('dashboard:exploreOpportunities')}</span>
          <ArrowRight className="h-4 w-4 text-accent-purple group-hover:translate-x-1 transition-transform rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
};