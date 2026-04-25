
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, Sector } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useCatalyst } from '../context/CatalystContext';
import { IntelligenceIngestor } from './ai/IntelligenceIngestor';
import { motion, AnimatePresence } from 'motion/react';
import { WidgetErrorBoundary } from './ui/WidgetErrorBoundary';

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
  Globe
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

interface DashboardProps {
  initiatives: TInitiative[];
  onSelectInitiative: (initiative: TInitiative) => void;
  onCreateInitiative: (title?: string, description?: string, sector?: Sector) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ initiatives = [], onSelectInitiative, onCreateInitiative }) => {
  const { setHiveCommand, setCurrentView, user, loading, apiError } = useCatalyst();
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const [isIngestorOpen, setIsIngestorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Reset to page 1 when search changes
  useEffect(() => setPage(1), [searchQuery]);
  
  const numberFormatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const percentFormatter = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent' }), [i18n.language]);
  
  const filteredInitiatives = useMemo(() => {
    const list = initiatives || [];
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(init => 
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
    const list = initiatives || [];
    const avgConfidence = list.length > 0
      ? list.reduce((sum, i) => sum + ((i as any).confidenceScore ?? 0.82), 0) / list.length
      : 0;
    return [
      { 
        label: t('dashboard:activeInitiatives'), 
        value: numberFormatter.format(list.length), 
        icon: Folder, 
        color: 'text-accent-teal', 
        bg: 'bg-accent-teal/10',
        description: t('dashboard:activeStrategicProjects')
      },
      { 
        label: t('dashboard:activeSectors'), 
        value: numberFormatter.format(new Set(list.map(i => i.sector)).size), 
        icon: LayoutGrid, 
        color: 'text-accent-teal', 
        bg: 'bg-accent-teal/10',
        description: t('dashboard:diversifiedEcosystem')
      },
      { 
        label: t('dashboard:efficiency'), 
        value: percentFormatter.format(0.94), 
        icon: TrendingUp, 
        color: 'text-accent-teal', 
        bg: 'bg-accent-teal/10',
        description: t('dashboard:executionEfficiency')
      },
      { 
        label: 'AI Confidence', 
        value: percentFormatter.format(avgConfidence), 
        icon: Sparkles, 
        color: 'text-accent-teal', 
        bg: 'bg-accent-teal/10',
        description: 'Average across initiatives'
      },
    ];
  }, [initiatives, t, numberFormatter, percentFormatter]);

  const handleNightlyWatchman = () => {
      setHiveCommand("ACTIVATE NIGHTLY WATCHMAN PROTOCOL: Scan all active projects for market shifts using Scout, then have Guardian verify compliance risks, and finally Integromat should summarize the status.");
      setCurrentView('hive');
  };

  return (
    <div className="p-4 sm:p-8 md:p-16 space-y-16 md:space-y-24 max-w-[2200px] mx-auto overflow-x-hidden">
      {/* Strategic API Alert */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 glass-card px-8 py-5 text-accent-red"
        >
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 shrink-0 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">{apiError}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-2 bg-accent-red/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent-red hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Pulse
          </button>
        </motion.div>
      )}

      {/* Hero: Catalyst Command Center */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col 2xl:flex-row justify-between 2xl:items-end gap-16 relative"
      >
        <div className="space-y-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="h-px w-20 bg-gradient-to-r from-accent-teal to-transparent" />
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-accent-teal/80">{t('dashboard:title')}</span>
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] italic">
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/10">
                  {t('common:welcome', { name: user?.name?.split(' ')[0] || 'Strategist' })}
                </span>
            </h1>
            <p className="text-white/40 text-2xl max-w-4xl font-medium leading-relaxed uppercase tracking-tight">
              {t('dashboard:subtitle')}
            </p>
        </div>
        <div className="flex gap-6 flex-wrap relative z-10">
            <Button 
                variant="outline"
                onClick={handleNightlyWatchman}
                className="group glass-card px-10 py-10 transition-all duration-700 shadow-2xl"
            >
                <Eye className="h-7 w-7 me-4 text-accent-teal group-hover:scale-125 transition-transform duration-700" />
                <span className="font-black uppercase tracking-[0.3em] text-xs">Run Nightly Watchman</span>
            </Button>
            <Button 
                variant="outline"
                onClick={() => setIsIngestorOpen(true)}
                className="group glass-card px-10 py-10 transition-all duration-700 shadow-2xl"
            >
                <Sparkles className="h-7 w-7 me-4 text-accent-amber group-hover:rotate-45 transition-transform duration-700 shadow-[0_0_20px_rgba(245,158,11,0.2)]" />
                <span className="font-black uppercase tracking-[0.3em] text-xs">Quick Create</span>
            </Button>
            <Button 
              onClick={() => onCreateInitiative()} 
              className="px-14 py-10 rounded-[2.5rem] bg-accent-teal hover:bg-accent-teal/80 text-primary shadow-[0_20px_50px_rgba(0,212,170,0.3)] transition-all duration-700 hover:-translate-y-2 group"
            >
                <Plus className="h-7 w-7 me-4 group-hover:rotate-90 transition-transform duration-700" />
                <span className="font-black uppercase tracking-[0.3em] text-xs">New Initiative</span>
            </Button>
        </div>
      </motion.div>

      {/* Stats Bento Grid: High-Fidelity Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-10">
        {stats.map((stat, i) => {
          const isHero = i === 2; 
          
          return (
            <WidgetErrorBoundary key={i} title={stat.label}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                className={`glass-card metallic-sheen p-6 md:p-12 flex flex-col gap-6 md:gap-10 hover:shadow-[0_50px_100px_rgba(0,0,0,0.7)] transition-all duration-1000 group relative overflow-hidden cursor-default ${
                  isHero ? 'xl:col-span-2' : ''
                }`}
              >
                <div className="absolute top-0 end-0 w-80 h-80 bg-accent-teal/5 rounded-full -me-40 -mt-40 group-hover:bg-accent-teal/10 transition-colors duration-1000 blur-[80px]" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div className={`bg-white/5 p-8 rounded-[2rem] transition-all group-hover:bg-accent-teal/10 group-hover:scale-110 duration-1000 shadow-inner ring-1 ring-white/5`}>
                    <stat.icon className={`h-12 w-12 text-accent-teal filter drop-shadow(0 0 20px hsla(168,100%,42%,0.4))`} />
                  </div>
                  <div className="flex items-center gap-3 text-xs font-black text-accent-teal uppercase tracking-[0.4em] bg-accent-teal/10 border border-accent-teal/20 px-6 py-3 rounded-full backdrop-blur-3xl">
                    <TrendingUp className="h-4 w-4" />
                    {isHero ? '+18.2%' : '+12.4%'}
                  </div>
                </div>
                
                <div className="relative z-10 space-y-6">
                  <p className="text-[12px] font-black text-white/30 uppercase tracking-[0.6em] group-hover:text-white/60 transition-all duration-1000">{stat.label}</p>
                  <div className="flex items-baseline flex-wrap md:flex-nowrap gap-4 md:gap-8">
                    <p className={`${isHero ? 'text-6xl md:text-[7rem]' : 'text-5xl md:text-8xl'} font-black tracking-tighter text-white drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] leading-none italic`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-white/20 font-black uppercase tracking-[0.3em] leading-relaxed max-w-[140px]">{stat.description}</p>
                  </div>
                </div>
              </motion.div>
            </WidgetErrorBoundary>
          );
        })}
      </div>

      {/* Dynamic Context Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-12 py-12 border-y border-white/5 px-8 backdrop-blur-xl glass-surface rounded-[3rem]">
        <div className="relative w-full xl:w-[600px] group">
          <Search className="absolute ps-8 top-1/2 -translate-y-1/2 h-7 w-7 text-white/10 group-focus-within:text-accent-teal transition-all duration-700" />
          <input 
            type="text"
            placeholder={t('dashboard:searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-20 pe-10 py-7 bg-white/[0.02] border border-white/5 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-accent-teal/5 focus:border-accent-teal/20 focus:bg-white/[0.05] transition-all text-lg font-medium text-white shadow-inner"
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-12">
            <div className="flex items-center gap-5 px-8 py-4 bg-white/[0.03] rounded-2xl border border-white/5 group transition-all neural-pulse">
                <Globe className="h-6 w-6 text-accent-teal" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Operations Pulse</span>
                    <span className="text-xs font-black text-accent-teal uppercase tracking-[0.3em]">Synapse Stable</span>
                </div>
            </div>
            <div className="flex items-center gap-5 text-[12px] font-black text-white/30 uppercase tracking-[0.4em]">
              <Layers className="h-5 w-5" />
              <span>{t('dashboard:showingStats', { filtered: numberFormatter.format(filteredInitiatives.length), total: numberFormatter.format(initiatives.length) })}</span>
            </div>
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

      {/* Sector Logic Visualization */}
      {filteredInitiatives.length === 0 && !loading ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-52 rounded-[5rem] border border-dashed border-white/10 bg-white/[0.02] shadow-2xl relative overflow-hidden"
          >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/5 to-transparent pointer-events-none" />
              <div className="bg-accent-teal/5 p-16 rounded-[3rem] mb-12 relative shadow-inner">
                  <div className="absolute inset-0 bg-accent-teal/20 rounded-[3rem] animate-ping opacity-20" />
                  <Folder className="h-28 w-28 text-accent-teal relative z-10" />
              </div>
              <h3 className="text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">{t('dashboard:noInitiativesFound')}</h3>
              <p className="text-white/20 mb-16 max-w-xl text-center text-xl font-medium leading-relaxed uppercase tracking-[0.3em]">
                {searchQuery ? t('dashboard:noResultsFor', { query: searchQuery }) : t('dashboard:startByCreating')}
              </p>
              <Button onClick={() => onCreateInitiative()} className="px-20 py-10 rounded-[3rem] text-xl bg-accent-teal hover:bg-accent-teal/90 text-primary shadow-[0_40px_80px_rgba(0,212,170,0.4)] transition-all duration-700 hover:-translate-y-3 group">
                  <Plus className="h-10 w-10 me-6 group-hover:rotate-90 transition-transform duration-700" />
                  <span className="font-black uppercase tracking-widest">{t('dashboard:createFirst')}</span>
              </Button>
          </motion.div>
      ) : (
          <div className="space-y-40">
            {sortedSectors.map((sector, sIdx) => (
                <div key={sector} className="space-y-20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 group">
                        <div className="flex items-center gap-10 w-full md:w-auto">
                            <div className="relative">
                                <div className="absolute inset-0 bg-accent-teal/40 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="relative h-24 w-24 flex items-center justify-center glass-card metallic-sheen shadow-2xl transition-all duration-700">
                                    <LayoutGrid className="h-10 w-10 text-accent-teal" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-[11px] font-black text-accent-teal uppercase tracking-[0.6em]">{t('dashboard:sectorVertical')}</span>
                                    <div className="h-px w-24 bg-accent-teal/20 group-hover:w-48 transition-all duration-1000" />
                                </div>
                                <h2 className="text-6xl font-black text-white tracking-tighter uppercase leading-none italic group-hover:not-italic transition-all duration-700">
                                    {sector}
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-10 glass-card px-12 py-7 shadow-2xl transition-all duration-700">
                          <div className="flex flex-col items-end">
                            <span className="text-3xl font-black text-white tracking-tight italic">
                                {numberFormatter.format(groupedInitiatives[sector].length)}
                            </span>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                                {t('dashboard:activeProjects')}
                            </span>
                          </div>
                          <div className="h-12 w-px bg-white/10" />
                          <ChevronRight className="h-8 w-8 text-accent-teal opacity-20 group-hover:opacity-100 transition-all group-hover:translate-x-3 duration-700" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-14">
                        {groupedInitiatives[sector].map((initiative, iIdx) => (
                          <motion.div
                            key={initiative.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: (sIdx * 0.1) + (iIdx * 0.05) }}
                          >
                            <Card initiative={initiative} onClick={() => onSelectInitiative(initiative)} index={iIdx} />
                          </motion.div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Pagination Navigation */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-8 py-20">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="group flex items-center gap-6 px-12 py-7 glass-card transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-2xl"
                  >
                    <ChevronLeft className="h-6 w-6 text-white group-hover:-translate-x-2 transition-transform opacity-40 group-hover:opacity-100" />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80">Previous Sector</span>
                  </button>
                  <div className="flex items-center gap-6 px-12 py-7 rounded-[2.5rem] glass-surface shadow-inner border border-white/5">
                      <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em]">
                        Grid Matrix {page} <span className="mx-4 opacity-10">/</span> {totalPages}
                      </span>
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="group flex items-center gap-6 px-12 py-7 glass-card transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-2xl"
                  >
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80">Next Sector</span>
                    <ChevronRight className="h-6 w-6 text-white group-hover:translate-x-2 transition-transform opacity-40 group-hover:opacity-100" />
                  </button>
                </div>
              )}
          </div>
      )}

      {/* Strategic Expansion CTA */}
      <div className="relative pt-60 pb-32 flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative group cursor-pointer mb-16">
            <div className="absolute inset-0 bg-accent-teal/30 blur-[120px] rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-1000" />
            <div className="relative glass-card p-14 hover:scale-110 transition-transform duration-1000 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                <Zap className="h-20 w-20 text-accent-teal drop-shadow-[0_0_30px_rgba(0,212,170,0.6)]" />
            </div>
        </div>
        <div className="space-y-6 max-w-4xl px-8">
          <h4 className="text-6xl md:text-7xl font-black text-white tracking-tighter uppercase leading-tight italic">{t('dashboard:readyToExpand')}</h4>
          <p className="text-white/20 font-medium uppercase tracking-[0.5em] text-[12px] leading-relaxed max-w-2xl mx-auto">{t('dashboard:leverageAI')}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsIngestorOpen(true)}
          className="mt-20 group px-20 py-10 glass-card transition-all duration-1000 shadow-2xl"
        >
          <span className="font-black text-white/80 uppercase tracking-[0.4em] text-[11px] me-6 group-hover:text-accent-teal transition-colors">Project Opportunity Hub</span>
          <ArrowRight className="h-6 w-6 text-accent-teal group-hover:translate-x-6 transition-transform duration-1000" />
        </Button>
      </div>
    </div>
  );
};