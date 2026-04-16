
import React, { useMemo, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    ResponsiveContainer, 
    BarChart as ReBarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as ReTooltip, 
    PieChart as RePieChart, 
    Pie, 
    Cell, 
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import { TInitiative, InitiativeStatus, TPortfolioFinancials, TPortfolioRisks } from '../../../types';
import { STATUS_STYLES } from '../../../constants';
import { generatePortfolioReport, generatePortfolioFinancials, generatePortfolioRisks } from '../../../services/geminiService';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { FileText, Download, Share2, AlertTriangle, TrendingUp, PieChart as PieIcon, BarChart3, Activity } from 'lucide-react';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

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

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-3xl shadow-sm border border-border-light dark:border-border-dark transition-all duration-500 hover:shadow-xl hover:shadow-accent-purple/5">
        <h3 className="text-sm font-bold mb-6 text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">{title}</h3>
        <div className="h-[300px] w-full">
            {children}
        </div>
    </div>
);



export const ReportsView: React.FC<ReportsViewProps> = ({ initiatives, onSelectInitiative }) => {
  const { t } = useTranslation(['reports']);
  const [activeTab, setActiveTab] = useState<'Executive' | 'Financial' | 'Risk' | 'Analytics'>('Executive');
  
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
              {(['Executive', 'Financial', 'Risk', 'Analytics'] as const).map(tab => (
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
                <SummaryCard title={t('reports:totalInitiatives')} value={summaryData.total.toString()} icon={<FileText className="w-6 h-6" />} color="bg-accent-purple" />
                <SummaryCard title={t('reports:liveProjects')} value={summaryData.live.toString()} icon={<Activity className="w-6 h-6" />} color="bg-accent-emerald" />
                <SummaryCard title={t('reports:inPlanning')} value={summaryData.planning.toString()} icon={<TrendingUp className="w-6 h-6" />} color="bg-accent-amber" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title={t('reports:initiativesByStatus')}>
                   <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart 
                            data={statusData}
                            layout="vertical"
                            margin={{ left: 20, right: 30, top: 5, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="label" 
                                type="category" 
                                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                                width={120}
                            />
                            <ReTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar 
                                dataKey="value" 
                                radius={[0, 10, 10, 0]} 
                                onClick={(data) => handleChartClick('status', data.label)}
                                className="cursor-pointer"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                        fillOpacity={filter?.value === entry.label ? 1 : 0.7}
                                    />
                                ))}
                            </Bar>
                        </ReBarChart>
                   </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title={t('reports:portfolioDiversity')}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={ownerData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="label"
                                onClick={(data) => handleChartClick('owner', data.label)}
                                className="cursor-pointer"
                            >
                                {ownerData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                        fillOpacity={filter?.value === entry.label ? 1 : 0.8}
                                    />
                                ))}
                            </Pie>
                            <ReTooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </RePieChart>
                    </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap gap-4 items-center">
                  <Button variant="secondary" onClick={() => window.print()} className="gap-2 rounded-xl">
                      <Download className="w-4 h-4" /> PDF Report
                  </Button>
                  <Button variant="secondary" className="gap-2 rounded-xl border-accent-blue/30 text-accent-blue">
                      <Share2 className="w-4 h-4" /> Sync to JIRA
                  </Button>
                  <Button variant="secondary" className="gap-2 rounded-xl border-accent-emerald/30 text-accent-emerald">
                      <FileText className="w-4 h-4" /> Confluence Page
                  </Button>
              </div>

              {/* Filtered List / Report Gen */}
              <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-3xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/5 blur-3xl -mr-32 -mt-32 rounded-full pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
                      <div>
                        <h3 className="text-xl font-bold text-text-light dark:text-text-dark tracking-tight">
                            {filter ? `${t('reports:filtered')}: ${filter.value}` : t('reports:portfolioSummary')}
                        </h3>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark font-medium opacity-80 mt-1">
                            {filter ? t('reports:viewingInitiativesMatching', { type: filter.type, value: filter.value }) : t('reports:aiPoweredOverview')}
                        </p>
                      </div>
                      {!filter && (
                          <Button onClick={handleGenerateReport} disabled={isGeneratingReport} className="shadow-2xl shadow-accent-purple/20 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl px-8">
                              {isGeneratingReport ? <Spinner className="mr-2" /> : <Activity className="mr-2 w-4 h-4" />}
                              {isGeneratingReport ? t('reports:analyzingPortfolio') : t('reports:generateAiReport')}
                          </Button>
                      )}
                  </div>

                  {filter ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                          {filteredInitiatives.map(init => (
                              <div 
                                key={init.id} 
                                className="group p-5 bg-white dark:bg-surface-darker/40 rounded-2xl border border-border-light dark:border-border-dark hover:border-accent-purple/50 hover:shadow-xl hover:shadow-accent-purple/5 transition-all duration-500 cursor-pointer" 
                                onClick={() => onSelectInitiative(init)}
                              >
                                  <div className="flex justify-between items-start mb-3">
                                    <span className="font-bold text-text-light dark:text-text-dark group-hover:text-accent-purple transition-colors">{init.title}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg ${STATUS_STYLES[init.status]}`}>{init.status}</span>
                                  </div>
                                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark line-clamp-2 leading-relaxed">{init.description}</p>
                              </div>
                          ))}
                       </div>
                  ) : (
                      <div className="bg-white/50 dark:bg-surface-darker/20 p-8 rounded-2xl border border-border-light dark:border-border-dark min-h-[220px] flex items-center justify-center relative z-10 backdrop-blur-sm">
                          {reportSummary ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none animate-in fade-in slide-in-from-top-4 duration-700">
                                <p className="text-text-light dark:text-text-dark leading-relaxed whitespace-pre-wrap">{reportSummary}</p>
                              </div>
                          ) : (
                              <div className="text-center space-y-3 opacity-60">
                                <PieIcon className="w-12 h-12 mx-auto text-accent-purple/40" />
                                <p className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark italic uppercase tracking-widest">{t('reports:strategicIntelligenceReady')}</p>
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
                  <div className="flex flex-col items-center justify-center py-32 bg-surface-light dark:bg-surface-dark rounded-3xl border border-border-light dark:border-border-dark border-dashed group hover:border-accent-purple/50 transition-all duration-500">
                       <div className="w-20 h-20 bg-accent-emerald/10 text-accent-emerald rounded-full flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                             <TrendingUp className="w-10 h-10" />
                       </div>
                       <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2 tracking-tight">{t('reports:financialIntelligence')}</h3>
                       <p className="text-text-muted-light dark:text-text-muted-dark mb-10 text-center max-w-md font-medium opacity-80">{t('reports:loadAnalyzeFinancial')}</p>
                       <Button onClick={handleLoadFinancials} className="bg-accent-emerald hover:bg-accent-emerald/90 text-white shadow-2xl shadow-accent-emerald/20 px-12 rounded-xl py-6 text-sm font-bold uppercase tracking-widest">
                             {t('reports:loadFinancialData')}
                       </Button>
                  </div>
              )}
              {loadingFin && (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="relative">
                        <Spinner className="w-12 h-12 text-accent-emerald" />
                        <div className="absolute inset-0 bg-accent-emerald/20 blur-xl animate-pulse rounded-full" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-text-muted-light animate-pulse">{t('reports:aggregatingFinancials')}</p>
                </div>
              )}
              
              {financials && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <SummaryCard title={t('reports:totalBudget')} value={`$${(financials.totalBudget / 1000).toFixed(1)}K`} icon={<span>💰</span>} color="bg-accent-emerald" />
                          <SummaryCard title={t('reports:totalSpend')} value={`$${(financials.totalSpend / 1000).toFixed(1)}K`} icon={<span>💸</span>} color="bg-accent-red" />
                          <SummaryCard title={t('reports:projRoi')} value={`${financials.projectedROI}%`} icon={<TrendingUp className="w-6 h-6" />} color="bg-accent-purple" />
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2">
                            <ChartContainer title={t('reports:spendVsBudgetTrend')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart 
                                        data={[
                                            { month: 'Jan', budget: financials.totalBudget * 0.2, spend: financials.totalSpend * 0.15 },
                                            { month: 'Feb', budget: financials.totalBudget * 0.4, spend: financials.totalSpend * 0.35 },
                                            { month: 'Mar', budget: financials.totalBudget * 0.6, spend: financials.totalSpend * 0.55 },
                                            { month: 'Apr', budget: financials.totalBudget * 0.8, spend: financials.totalSpend * 0.8 },
                                            { month: 'May', budget: financials.totalBudget, spend: financials.totalSpend },
                                            { month: 'Jun (Proj)', budget: financials.totalBudget * 1.1, spend: financials.totalSpend * 1.05 }
                                        ]}
                                    >
                                        <defs>
                                            <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} strokeOpacity={0.3} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} strokeOpacity={0.3} />
                                        <ReTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="budget" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorBudget)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="spend" stroke="#10B981" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={3} />
                                        <Legend verticalAlign="top" align="right" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                          </div>

                          <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-3xl shadow-sm border border-border-light dark:border-border-dark flex flex-col justify-center relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-emerald/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700" />
                              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark mb-6 relative z-10">{t('reports:efficiencyScore')}</h4>
                              <div className="text-6xl font-black text-accent-emerald mb-4 relative z-10 tracking-tighter">
                                  {Math.round((financials.totalBudget / (financials.totalSpend || 1)) * 10)}
                                  <span className="text-2xl opacity-40 ml-1">/100</span>
                              </div>
                              <p className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark relative z-10 leading-relaxed">
                                  Your portfolio is currently operating at <span className="text-accent-emerald font-bold">peak efficiency</span>. Spend is tracking closely with milestone delivery.
                              </p>
                          </div>
                      </div>
                      
                      <div className="bg-surface-light dark:bg-surface-dark p-0 rounded-3xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden transition-all duration-500 hover:shadow-2xl">
                          <div className="px-8 py-6 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-white/50 dark:bg-surface-darker/20">
                              <h3 className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">{t('reports:initiativeBreakdown')}</h3>
                              <Button variant="secondary" size="sm" className="rounded-lg text-[10px] uppercase font-bold tracking-widest px-4 py-2 h-auto border-border-light dark:border-border-dark">Export CSV</Button>
                          </div>
                          <div className="overflow-x-auto custom-scrollbar">
                              <table className="w-full text-left border-collapse">
                                  <thead>
                                      <tr className="bg-surface-darker/5 dark:bg-surface-darker/30">
                                          <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark pl-8">{t('reports:initiative')}</th>
                                          <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark text-right">{t('reports:budget')}</th>
                                          <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark text-right">{t('reports:spend')}</th>
                                          <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark text-right pr-8">{t('reports:roi')}</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                      {(Array.isArray(financials?.breakdown) ? financials.breakdown : []).map(item => (
                                          <tr key={item.id} className="hover:bg-surface-darker/5 dark:hover:bg-surface-darker/10 transition-colors group cursor-pointer">
                                              <td className="p-5 font-bold text-text-light dark:text-text-dark pl-8 transition-transform group-hover:translate-x-1">{item.title}</td>
                                              <td className="p-5 text-right text-text-muted-light dark:text-text-muted-dark font-mono text-xs">${item.budget.toLocaleString()}</td>
                                              <td className="p-5 text-right text-text-muted-light dark:text-text-muted-dark font-mono text-xs">${item.spend.toLocaleString()}</td>
                                              <td className={`p-5 text-right font-black pr-8 ${item.roi > 0 ? 'text-accent-emerald' : 'text-accent-red'}`}>{item.roi}%</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-accent-purple/5 to-accent-blue/5 dark:from-accent-purple/10 dark:to-accent-blue/10 p-10 rounded-3xl border border-accent-purple/20 shadow-xl relative overflow-hidden group transition-all duration-700">
                          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-purple/5 blur-[100px] -mr-48 -mt-48 rounded-full pointer-events-none group-hover:bg-accent-purple/10 transition-colors duration-700" />
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-accent-purple text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-accent-purple/30 group-hover:rotate-12 transition-transform duration-500">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h4 className="font-black text-accent-purple uppercase tracking-[0.3em] text-xs transition-all duration-500 group-hover:tracking-[0.4em]">{t('reports:aiFinancialInsight')}</h4>
                          </div>
                          <p className="text-text-light dark:text-text-dark leading-relaxed font-medium text-lg relative z-10">{financials.aiAnalysis}</p>
                      </div>
                  </div>
              )}
          </div>
      )}


      {activeTab === 'Risk' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {!risks && !loadingRisk && (
                  <div className="flex flex-col items-center justify-center py-32 bg-surface-light dark:bg-surface-dark rounded-3xl border border-border-light dark:border-border-dark border-dashed group hover:border-accent-red/50 transition-all duration-500">
                       <div className="w-20 h-20 bg-accent-red/10 text-accent-red rounded-full flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                             <AlertTriangle className="w-10 h-10" />
                       </div>
                       <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2 tracking-tight">{t('reports:riskComplianceMatrix')}</h3>
                       <p className="text-text-muted-light dark:text-text-muted-dark mb-10 text-center max-w-md font-medium opacity-80">{t('reports:identifyAssessMitigate')}</p>
                       <Button onClick={handleLoadRisks} className="bg-accent-red hover:bg-accent-red/90 text-white shadow-2xl shadow-accent-red/20 px-12 rounded-xl py-6 text-sm font-bold uppercase tracking-widest">
                             {t('reports:loadRiskProfile')}
                       </Button>
                  </div>
              )}
              {loadingRisk && (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="relative">
                        <Spinner className="w-12 h-12 text-accent-red" />
                        <div className="absolute inset-0 bg-accent-red/20 blur-xl animate-pulse rounded-full" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-text-muted-light animate-pulse">{t('reports:scanningRiskLandscape')}</p>
                </div>
              )}
              
              {risks && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-border-light dark:border-border-dark text-center shadow-sm hover:shadow-xl hover:shadow-accent-red/5 transition-all duration-500">
                              <span className="block text-5xl font-black text-accent-red mb-1 tracking-tighter">{risks.criticalCount}</span>
                              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent-red opacity-60">{t('reports:critical')}</span>
                          </div>
                          <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-border-light dark:border-border-dark text-center shadow-sm hover:shadow-xl hover:shadow-accent-amber/5 transition-all duration-500">
                              <span className="block text-5xl font-black text-accent-amber mb-1 tracking-tighter">{risks.highCount}</span>
                              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent-amber opacity-60">{t('reports:high')}</span>
                          </div>
                          <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-border-light dark:border-border-dark text-center shadow-sm hover:shadow-xl hover:shadow-accent-amber/5 transition-all duration-500">
                              <span className="block text-5xl font-black text-accent-amber mb-1 tracking-tighter">{risks.mediumCount}</span>
                              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent-amber opacity-60">{t('reports:medium')}</span>
                          </div>
                          <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-border-light dark:border-border-dark text-center shadow-sm hover:shadow-xl hover:shadow-accent-emerald/5 transition-all duration-500">
                              <span className="block text-5xl font-black text-accent-emerald mb-1 tracking-tighter">{risks.avgComplianceScore}%</span>
                              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent-emerald opacity-60">{t('reports:avgCompliance')}</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <ChartContainer title="Risk Sensitivity Radar">
                             <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                    { subject: 'Financial', A: 120, B: 110, fullMark: 150 },
                                    { subject: 'Technical', A: 98, B: 130, fullMark: 150 },
                                    { subject: 'Compliance', A: 86, B: 130, fullMark: 150 },
                                    { subject: 'Market', A: 99, B: 100, fullMark: 150 },
                                    { subject: 'Security', A: 85, B: 90, fullMark: 150 },
                                    { subject: 'Velocity', A: 65, B: 85, fullMark: 150 },
                                ]}>
                                    <PolarGrid strokeOpacity={0.1} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                    <Radar name="Current Portfolio" dataKey="A" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                                    <Radar name="Target Profile" dataKey="B" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
                                    <Legend />
                                </RadarChart>
                             </ResponsiveContainer>
                          </ChartContainer>

                          <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-3xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
                              <h3 className="text-sm font-bold mb-6 text-accent-red tracking-[0.2em] uppercase">{t('reports:topPortfolioRisks')}</h3>
                              <div className="space-y-4">
                                  {(Array.isArray(risks?.topRisks) ? risks.topRisks : []).map((risk, i) => (
                                      <div key={i} className="flex justify-between items-center p-6 bg-white dark:bg-surface-darker/40 rounded-2xl border-l-4 border-accent-red transition-all duration-300 hover:translate-x-1 hover:shadow-lg shadow-accent-red/5">
                                          <div>
                                              <p className="font-bold text-text-light dark:text-text-dark mb-1">{risk.risk}</p>
                                              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark opacity-60">{t('reports:project')} {risk.initiative}</p>
                                          </div>
                                          <span className="text-[10px] font-black bg-accent-red text-white px-4 py-1.5 rounded-lg shadow-lg shadow-accent-red/20">{risk.severity}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="bg-gradient-to-br from-surface-darker/5 to-surface-darker/10 dark:from-surface-darker/20 dark:to-surface-darker/30 p-10 rounded-3xl border border-border-light dark:border-border-dark shadow-inner relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[100px] -mr-48 -mt-48 rounded-full pointer-events-none" />
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-text-light dark:bg-text-dark text-surface-light dark:text-surface-dark rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h4 className="font-black text-text-light dark:text-text-dark uppercase tracking-[0.3em] text-xs">{t('reports:aiRiskAssessment')}</h4>
                          </div>
                          <p className="text-lg text-text-muted-light dark:text-text-muted-dark leading-relaxed italic font-medium relative z-10">{risks.aiAnalysis}</p>
                      </div>
                  </div>
              )}
           </div>
      )}


      {/* Tooltip */}
      {activeTab === 'Analytics' && (
        <Suspense fallback={<div className="py-16 text-center text-text-muted-light dark:text-text-muted-dark text-sm">Loading Analytics…</div>}>
          <AnalyticsDashboard />
        </Suspense>
      )}

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
