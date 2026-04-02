
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, InitiativeStatus, TPortfolioFinancials, TPortfolioRisks } from '../types';
import { STATUS_STYLES } from '../constants';
import { generatePortfolioReport, generatePortfolioFinancials, generatePortfolioRisks } from '../services/geminiService';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

interface ReportsViewProps {
  initiatives: TInitiative[];
  onSelectInitiative: (initiative: TInitiative) => void;
}

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = 'bg-accent-purple' }) => (
  <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-border-light dark:border-border-dark flex items-center space-x-4 transition-all duration-300 hover:shadow-md">
    <div className={`${color} text-white p-3.5 rounded-xl shadow-lg shadow-current/20`}>{icon}</div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">{title}</p>
      <p className="text-3xl font-bold text-text-light dark:text-text-dark tracking-tight">{value}</p>
    </div>
  </div>
);

const BarChart: React.FC<{ data: { label: string; value: number }[]; onClick: (label: string) => void; selected: string | null; onHover: (event: React.MouseEvent | null, data: { label: string; value: number } | null) => void }> = ({ data, onClick, selected, onHover }) => {
    const { t } = useTranslation(['reports']);
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const statusColors: { [key in InitiativeStatus]?: string } = {
        [InitiativeStatus.PLANNING]: 'bg-accent-purple',
        [InitiativeStatus.AWAITING_APPROVAL]: 'bg-accent-amber',
        [InitiativeStatus.IN_DEVELOPMENT]: 'bg-accent-blue',
        [InitiativeStatus.LIVE]: 'bg-accent-emerald',
        [InitiativeStatus.ON_HOLD]: 'bg-text-muted-light',
    };
  
    return (
        <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
            <h3 className="text-lg font-bold mb-6 text-text-light dark:text-text-dark tracking-tight">{t('reports:initiativesByStatus')}</h3>
            <div className="space-y-5">
                {data.map(({ label, value }) => (
                    <div 
                        key={label} 
                        className="flex items-center group cursor-pointer" 
                        onClick={() => onClick(label)}
                        onMouseEnter={(e) => onHover(e, { label, value })}
                        onMouseLeave={() => onHover(null, null)}
                    >
                        <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark w-36 truncate uppercase tracking-wider">{label}</span>
                        <div className="flex-1 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-full h-7 relative overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ease-out ${statusColors[label as InitiativeStatus] || 'bg-gray-400'} ${selected === label ? 'ring-2 ring-offset-2 ring-accent-purple dark:ring-offset-surface-dark' : 'group-hover:opacity-80'}`} 
                                style={{ width: `${(value / maxValue) * 100}%` }}
                            />
                             <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-white drop-shadow-sm">{value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PieChart: React.FC<{ data: { label: string; value: number }[]; onClick: (label: string) => void; selected: string | null; onHover: (event: React.MouseEvent | null, data: { label: string; value: number } | null) => void }> = ({ data, onClick, selected, onHover }) => {
    const { t } = useTranslation(['reports']);
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#6B7280'];
    
    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };
    
    let cumulativePercent = 0;
    const slices = data.map((item, index) => {
        const percent = item.value / total;
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += percent;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = percent > 0.5 ? 1 : 0;

        const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'L 0 0',
        ].join(' ');

        return {
            ...item,
            pathData,
            color: colors[index % colors.length],
        };
    });

    return (
        <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
            <h3 className="text-lg font-bold mb-6 text-text-light dark:text-text-dark tracking-tight">{t('reports:initiativesByOwner')}</h3>
            <div className="flex flex-col lg:flex-row items-center gap-10">
                <div className="w-40 h-40 relative">
                    <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="drop-shadow-xl">
                        {slices.map((slice) => (
                            <path
                                key={slice.label}
                                d={slice.pathData}
                                fill={slice.color}
                                className="cursor-pointer transition-all duration-300 hover:opacity-90"
                                style={{ transform: selected === slice.label ? 'scale(1.08)' : 'scale(1)', transformOrigin: 'center' }}
                                onClick={() => onClick(slice.label)}
                                onMouseEnter={(e) => onHover(e, { label: slice.label, value: slice.value })}
                                onMouseLeave={() => onHover(null, null)}
                            />
                        ))}
                    </svg>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 flex-1">
                    {data.map((item, index) => (
                        <div 
                            key={item.label} 
                            className={`flex items-center p-2 rounded-xl cursor-pointer transition-all duration-200 ${selected === item.label ? 'bg-accent-purple/10 ring-1 ring-accent-purple/20' : 'hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20'}`} 
                            onClick={() => onClick(item.label)}
                            onMouseEnter={(e) => onHover(e, item)}
                            onMouseLeave={() => onHover(null, null)}
                        >
                            <span className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{ backgroundColor: colors[index % colors.length] }} />
                            <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider truncate max-w-[120px]">{item.label}</span>
                            <span className="ml-auto text-xs font-bold text-text-light dark:text-text-dark">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export const ReportsView: React.FC<ReportsViewProps> = ({ initiatives, onSelectInitiative }) => {
  const { t } = useTranslation(['reports']);
  const [activeTab, setActiveTab] = useState<'Executive' | 'Financial' | 'Risk'>('Executive');
  
  // Executive State
  const [filter, setFilter] = useState<{ type: 'status' | 'owner'; value: string } | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: React.ReactNode; x: number; y: number } | null>(null);
  const [reportSummary, setReportSummary] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Financial State
  const [financials, setFinancials] = useState<TPortfolioFinancials | null>(null);
  const [loadingFin, setLoadingFin] = useState(false);

  // Risk State
  const [risks, setRisks] = useState<TPortfolioRisks | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Handlers for Financials
  const handleLoadFinancials = async () => {
      setLoadingFin(true);
      try {
          const res = await generatePortfolioFinancials(initiatives);
          setFinancials(res);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingFin(false);
      }
  };

  // Handlers for Risks
  const handleLoadRisks = async () => {
      setLoadingRisk(true);
      try {
          const res = await generatePortfolioRisks(initiatives);
          setRisks(res);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingRisk(false);
      }
  };

  const summaryData = useMemo(() => {
    const safeInitiatives = Array.isArray(initiatives) ? initiatives : [];
    return {
      total: safeInitiatives.length,
      live: safeInitiatives.filter(i => i.status === InitiativeStatus.LIVE).length,
      planning: safeInitiatives.filter(i => i.status === InitiativeStatus.PLANNING).length,
    };
  }, [initiatives]);

  const statusData = useMemo(() => {
    const safeInitiatives = Array.isArray(initiatives) ? initiatives : [];
    const statusCounts = safeInitiatives.reduce((acc, initiative) => {
      acc[initiative.status] = (acc[initiative.status] || 0) + 1;
      return acc;
    }, {} as { [key in InitiativeStatus]: number });

    return Object.values(InitiativeStatus).map(status => ({
        label: status,
        value: statusCounts[status] || 0
    })).filter(item => item.value > 0);
  }, [initiatives]);

  const ownerData = useMemo(() => {
    const safeInitiatives = Array.isArray(initiatives) ? initiatives : [];
    const ownerCounts = safeInitiatives.reduce((acc, initiative) => {
      acc[initiative.owner.name] = (acc[initiative.owner.name] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
      
    return Object.entries(ownerCounts).map(([label, value]) => ({ label, value }));
  }, [initiatives]);

  const filteredInitiatives = useMemo(() => {
    const safeInitiatives = Array.isArray(initiatives) ? initiatives : [];
    if (!filter) return [];
    if (filter.type === 'status') {
      return safeInitiatives.filter(i => i.status === filter.value);
    }
    if (filter.type === 'owner') {
      return safeInitiatives.filter(i => i.owner.name === filter.value);
    }
    return [];
  }, [initiatives, filter]);
  
  const handleChartClick = (type: 'status' | 'owner', value: string) => {
    if (filter && filter.type === type && filter.value === value) {
        setFilter(null);
    } else {
        setFilter({ type, value });
    }
  };

  const handleChartHover = (event: React.MouseEvent | null, data: { label: string; value: number } | null) => {
    if (!event || !data) {
      setTooltip(null);
      return;
    }
    setTooltip({
      visible: true,
      content: (
        <div className="px-3 py-1.5 bg-surface-darker text-white rounded-lg shadow-xl border border-white/10 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{data.label}:</span>
          <span className="text-xs font-bold">{data.value}</span>
        </div>
      ),
      x: event.pageX,
      y: event.pageY,
    });
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReportError(null);
    setReportSummary(null);
    try {
      const summary = await generatePortfolioReport(initiatives);
      setReportSummary(summary);
    } catch (err) {
      setReportError(t('reports:failedGenerateReport'));
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-8 relative h-full flex flex-col p-2">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-text-light dark:text-text-dark tracking-tight mb-2">{t('reports:title')}</h1>
            <p className="text-text-muted-light dark:text-text-muted-dark">{t('reports:subtitle')}</p>
          </div>
          
          <div className="flex bg-surface-darker/5 dark:bg-surface-darker/30 p-1.5 rounded-2xl border border-border-light dark:border-border-dark w-fit">
              {(['Executive', 'Financial', 'Risk'] as const).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)} 
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                        activeTab === tab 
                            ? 'bg-surface-light dark:bg-surface-dark text-accent-purple shadow-sm ring-1 ring-border-light dark:ring-border-dark' 
                            : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                    }`}
                  >
                      {tab === 'Risk' ? t('reports:riskAndCompliance') : t(`reports:${tab.toLowerCase()}`)}
                  </button>
              ))}
          </div>
      </div>

      {activeTab === 'Executive' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title={t('reports:totalInitiatives')} value={summaryData.total.toString()} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} color="bg-accent-purple" />
                <SummaryCard title={t('reports:liveProjects')} value={summaryData.live.toString()} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="bg-accent-emerald" />
                <SummaryCard title={t('reports:inPlanning')} value={summaryData.planning.toString()} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>} color="bg-accent-amber" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <BarChart 
                    data={statusData} 
                    onClick={(label) => handleChartClick('status', label)} 
                    selected={filter?.type === 'status' ? filter.value : null}
                    onHover={handleChartHover}
                />
                <PieChart 
                    data={ownerData} 
                    onClick={(label) => handleChartClick('owner', label)}
                    selected={filter?.type === 'owner' ? filter.value : null}
                    onHover={handleChartHover}
                />
              </div>

              {/* Filtered List / Report Gen */}
              <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-text-light dark:text-text-dark tracking-tight">
                            {filter ? `${t('reports:filtered')}: ${filter.value}` : t('reports:portfolioSummary')}
                        </h3>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                            {filter ? t('reports:viewingInitiativesMatching', { type: filter.type, value: filter.value }) : t('reports:aiPoweredOverview')}
                        </p>
                      </div>
                      {!filter && (
                          <Button onClick={handleGenerateReport} disabled={isGeneratingReport} className="shadow-lg shadow-accent-purple/20">
                              {isGeneratingReport ? <Spinner className="mr-2" /> : null}
                              {isGeneratingReport ? t('reports:analyzingPortfolio') : t('reports:generateAiReport')}
                          </Button>
                      )}
                  </div>

                  {filter ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {filteredInitiatives.map(init => (
                              <div 
                                key={init.id} 
                                className="group p-4 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-xl border border-border-light dark:border-border-dark hover:border-accent-purple/50 transition-all duration-300 cursor-pointer" 
                                onClick={() => onSelectInitiative(init)}
                              >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-text-light dark:text-text-dark group-hover:text-accent-purple transition-colors">{init.title}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_STYLES[init.status]}`}>{init.status}</span>
                                  </div>
                                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark line-clamp-2">{init.description}</p>
                              </div>
                          ))}
                       </div>
                  ) : (
                      <div className="bg-surface-darker/5 dark:bg-surface-darker/20 p-8 rounded-2xl border border-border-light dark:border-border-dark min-h-[160px] flex items-center justify-center">
                          {reportSummary ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="text-text-light dark:text-text-dark leading-relaxed whitespace-pre-wrap">{reportSummary}</p>
                              </div>
                          ) : (
                              <div className="text-center space-y-2">
                                <p className="text-text-muted-light dark:text-text-muted-dark italic">{t('reports:strategicIntelligenceReady')}</p>
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent-purple/60">{t('reports:clickButtonToBegin')}</p>
                              </div>
                          )}
                          {reportError && <p className="text-accent-red text-sm mt-2 font-bold">{reportError}</p>}
                      </div>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'Financial' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {!financials && !loadingFin && (
                  <div className="flex flex-col items-center justify-center py-32 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark border-dashed">
                       <div className="w-16 h-16 bg-accent-emerald/10 text-accent-emerald rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">{t('reports:financialIntelligence')}</h3>
                       <p className="text-text-muted-light dark:text-text-muted-dark mb-8 text-center max-w-md">{t('reports:loadAnalyzeFinancial')}</p>
                       <Button onClick={handleLoadFinancials} className="bg-accent-emerald hover:bg-accent-emerald/90 text-white shadow-lg shadow-accent-emerald/20 px-10">
                            {t('reports:loadFinancialData')}
                       </Button>
                  </div>
              )}
              {loadingFin && <div className="flex flex-col items-center justify-center py-32"><Spinner className="mb-4" /><p className="text-sm font-bold uppercase tracking-widest text-text-muted-light animate-pulse">{t('reports:aggregatingFinancials')}</p></div>}
              
              {financials && (
                  <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <SummaryCard title={t('reports:totalBudget')} value={`$${financials.totalBudget.toLocaleString()}`} icon={<span>💰</span>} color="bg-accent-emerald" />
                          <SummaryCard title={t('reports:totalSpend')} value={`$${financials.totalSpend.toLocaleString()}`} icon={<span>💸</span>} color="bg-accent-red" />
                          <SummaryCard title={t('reports:projRoi')} value={`${financials.projectedROI}%`} icon={<span>📈</span>} color="bg-accent-purple" />
                      </div>
                      
                      <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
                          <h3 className="text-lg font-bold mb-6 text-text-light dark:text-text-dark tracking-tight">{t('reports:initiativeBreakdown')}</h3>
                          <div className="overflow-x-auto custom-scrollbar -mx-8">
                              <table className="w-full text-left border-collapse">
                                  <thead>
                                      <tr className="bg-surface-darker/5 dark:bg-surface-darker/30">
                                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark pl-8">{t('reports:initiative')}</th>
                                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark text-right">{t('reports:budget')}</th>
                                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark text-right">{t('reports:spend')}</th>
                                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark text-right pr-8">{t('reports:roi')}</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                      {(Array.isArray(financials?.breakdown) ? financials.breakdown : []).map(item => (
                                          <tr key={item.id} className="hover:bg-surface-darker/5 dark:hover:bg-surface-darker/10 transition-colors">
                                              <td className="p-4 font-bold text-text-light dark:text-text-dark pl-8">{item.title}</td>
                                              <td className="p-4 text-right text-text-muted-light dark:text-text-muted-dark font-mono text-xs">${item.budget.toLocaleString()}</td>
                                              <td className="p-4 text-right text-text-muted-light dark:text-text-muted-dark font-mono text-xs">${item.spend.toLocaleString()}</td>
                                              <td className={`p-4 text-right font-bold pr-8 ${item.roi > 0 ? 'text-accent-emerald' : 'text-accent-red'}`}>{item.roi}%</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                      
                      <div className="bg-accent-purple/5 dark:bg-accent-purple/10 p-8 rounded-2xl border border-accent-purple/20 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-accent-purple text-white rounded-lg flex items-center justify-center shadow-lg shadow-accent-purple/20">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h4 className="font-bold text-accent-purple uppercase tracking-widest text-xs">{t('reports:aiFinancialInsight')}</h4>
                          </div>
                          <p className="text-text-light dark:text-text-dark leading-relaxed">{financials.aiAnalysis}</p>
                      </div>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'Risk' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {!risks && !loadingRisk && (
                  <div className="flex flex-col items-center justify-center py-32 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark border-dashed">
                       <div className="w-16 h-16 bg-accent-red/10 text-accent-red rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                       </div>
                       <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">{t('reports:riskComplianceMatrix')}</h3>
                       <p className="text-text-muted-light dark:text-text-muted-dark mb-8 text-center max-w-md">{t('reports:identifyAssessMitigate')}</p>
                       <Button onClick={handleLoadRisks} className="bg-accent-red hover:bg-accent-red/90 text-white shadow-lg shadow-accent-red/20 px-10">
                            {t('reports:loadRiskProfile')}
                       </Button>
                  </div>
              )}
              {loadingRisk && <div className="flex flex-col items-center justify-center py-32"><Spinner className="mb-4" /><p className="text-sm font-bold uppercase tracking-widest text-text-muted-light animate-pulse">{t('reports:scanningRiskLandscape')}</p></div>}
              
              {risks && (
                  <div className="space-y-8">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="bg-accent-red/5 dark:bg-accent-red/10 p-6 rounded-2xl border border-accent-red/20 text-center shadow-sm">
                              <span className="block text-4xl font-bold text-accent-red mb-1 tracking-tight">{risks.criticalCount}</span>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-accent-red/80">{t('reports:critical')}</span>
                          </div>
                          <div className="bg-accent-amber/5 dark:bg-accent-amber/10 p-6 rounded-2xl border border-accent-amber/20 text-center shadow-sm">
                              <span className="block text-4xl font-bold text-accent-amber mb-1 tracking-tight">{risks.highCount}</span>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-accent-amber/80">{t('reports:high')}</span>
                          </div>
                          <div className="bg-accent-amber/5 dark:bg-accent-amber/10 p-6 rounded-2xl border border-accent-amber/20 text-center shadow-sm">
                              <span className="block text-4xl font-bold text-accent-amber mb-1 tracking-tight">{risks.mediumCount}</span>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-accent-amber/80">{t('reports:medium')}</span>
                          </div>
                          <div className="bg-accent-emerald/5 dark:bg-accent-emerald/10 p-6 rounded-2xl border border-accent-emerald/20 text-center shadow-sm">
                              <span className="block text-4xl font-bold text-accent-emerald mb-1 tracking-tight">{risks.avgComplianceScore}%</span>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-accent-emerald/80">{t('reports:avgCompliance')}</span>
                          </div>
                      </div>
                      <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
                          <h3 className="text-lg font-bold mb-6 text-accent-red tracking-tight uppercase tracking-[0.2em] text-xs">{t('reports:topPortfolioRisks')}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(Array.isArray(risks?.topRisks) ? risks.topRisks : []).map((risk, i) => (
                                  <div key={i} className="flex justify-between items-center p-5 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-xl border-l-4 border-accent-red transition-all duration-300 hover:translate-x-1">
                                      <div>
                                          <p className="font-bold text-text-light dark:text-text-dark mb-1">{risk.risk}</p>
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">{t('reports:project')} {risk.initiative}</p>
                                      </div>
                                      <span className="text-[10px] font-bold bg-accent-red/10 text-accent-red px-3 py-1 rounded-full border border-accent-red/20">{risk.severity}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="bg-surface-darker/5 dark:bg-surface-darker/20 p-8 rounded-2xl border border-border-light dark:border-border-dark shadow-inner">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-text-light dark:bg-text-dark text-surface-light dark:text-surface-dark rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <h4 className="font-bold text-text-light dark:text-text-dark uppercase tracking-widest text-xs">{t('reports:aiRiskAssessment')}</h4>
                          </div>
                          <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed italic">{risks.aiAnalysis}</p>
                      </div>
                  </div>
              )}
           </div>
      )}

      {/* Tooltip */}
      {tooltip && tooltip.visible && (
        <div
          className="fixed z-[100] pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-4 animate-in fade-in zoom-in duration-200"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};
