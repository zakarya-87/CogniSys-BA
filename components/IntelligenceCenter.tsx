
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { 
    TInitiative, 
    TKpi, 
    TStrategicRecommendation, 
    TKpiForecast, 
    TDailyBriefing, 
    Sector 
} from '../types';
import { 
    generateStrategicRecommendations, 
    generateKpiForecast 
} from '../services/geminiService';
import { generateDailyBriefing, generateKpiInsights } from '../services/aiService';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { 
    Lightbulb, 
    TrendingUp, 
    TrendingDown, 
    Minus, 
    Zap, 
    BarChart3, 
    PieChart, 
    Activity, 
    Brain, 
    ShieldAlert, 
    CheckCircle2,
    MessageSquareQuote,
    RefreshCw,
    Plus,
    Sparkles
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart as RePieChart, 
    Pie, 
    Cell 
} from 'recharts';

const getMockKpis = (t: any): TKpi[] => [
    { name: t('intelligenceCenter.kpi.userEngagement'), value: 75, target: 80, unit: '%', higherIsBetter: true, trend: 'stable' },
    { name: t('intelligenceCenter.kpi.avgLoadTime'), value: 450, target: 300, unit: t('intelligenceCenter.kpi.unit.ms'), higherIsBetter: false, trend: 'declining' },
    { name: t('intelligenceCenter.kpi.revenuePerUser'), value: 13.20, target: 12.50, unit: t('intelligenceCenter.kpi.unit.perUser'), higherIsBetter: true, trend: 'improving' },
    { name: t('intelligenceCenter.kpi.featureAdoption'), value: 32, target: 40, unit: '%', higherIsBetter: true, trend: 'declining' },
];

const KpiCard: React.FC<{ kpi: TKpi; onClick: () => void; isSelected: boolean }> = ({ kpi, onClick, isSelected }) => {
    const { t } = useTranslation(['dashboard']);
    const percentage = kpi.higherIsBetter ? (kpi.value / kpi.target) * 100 : (kpi.target / kpi.value) * 100;
    const isSuccess = kpi.higherIsBetter ? kpi.value >= kpi.target : kpi.value <= kpi.target;
    
    let barColor = 'bg-accent-amber';
    if (percentage < 75) barColor = 'bg-accent-red';
    if (isSuccess) barColor = 'bg-accent-emerald';

    const trendConfig = {
        improving: { icon: <TrendingUp className="h-5 w-5" />, color: 'text-accent-emerald' },
        declining: { icon: <TrendingDown className="h-5 w-5" />, color: 'text-accent-red' },
        stable: { icon: <Minus className="h-5 w-5" />, color: 'text-text-muted-light dark:text-text-muted-dark' }
    };
    const trend = trendConfig[kpi.trend];

    return (
        <div 
            onClick={onClick}
            className={`p-8 rounded-3xl cursor-pointer transition-all border-2 group ${isSelected ? 'bg-surface-light dark:bg-surface-darker border-accent-teal shadow-2xl shadow-accent-teal/20 -translate-y-1' : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark hover:border-accent-teal/50 hover:shadow-xl hover:-translate-y-1'}`}
        >
            <div className="flex justify-between items-baseline mb-6">
                <p className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">{kpi.name}</p>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isSuccess ? 'text-accent-emerald' : 'text-accent-red'}`}>
                    {t('intelligenceCenter.kpiTarget', { target: kpi.target, unit: kpi.unit })}
                </p>
            </div>
             <div className="flex items-end justify-between mb-6">
                <p className="text-5xl font-black text-text-main-light dark:text-text-main-dark tracking-tighter">{kpi.value}<span className="text-lg font-bold text-text-muted-light dark:text-text-muted-dark ml-1">{kpi.unit}</span></p>
                {trend && <span className={`inline-flex items-center p-2 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-xl ${trend.color}`}>{trend.icon}</span>}
            </div>
            <div className="w-full bg-surface-darker/10 dark:bg-surface-darker/50 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div className={`${barColor} h-full rounded-full transition-all duration-700 shadow-sm`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
        </div>
    );
};

const ForecastChart: React.FC<{ forecast: TKpiForecast }> = ({ forecast }) => {
    const { t } = useTranslation(['dashboard']);
    const data = useMemo(() => {
        return [
            {
                period: 'Current',
                value: forecast.currentValue,
                confidenceHigh: forecast.currentValue,
                confidenceLow: forecast.currentValue,
            },
            ...forecast.forecast.map(f => ({
                period: f.date,
                value: f.value,
                confidenceHigh: f.confidenceHigh,
                confidenceLow: f.confidenceLow,
            }))
        ];
    }, [forecast]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.05} />
                        <XAxis 
                            dataKey="period" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af', letterSpacing: '0.1em' }}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af', letterSpacing: '0.1em' }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#0a0a0a', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '16px', 
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' 
                            }} 
                        />
                        <Area
                            type="monotone"
                            dataKey="confidenceHigh"
                            stroke="none"
                            fill="#8B5CF6"
                            fillOpacity={0.05}
                            connectNulls
                        />
                        <Area
                            type="monotone"
                            dataKey="confidenceLow"
                            stroke="none"
                            fill="#8B5CF6"
                            fillOpacity={0.05}
                            connectNulls
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8B5CF6"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-8 p-8 bg-accent-teal/5 dark:bg-accent-teal/10 border-l-4 border-accent-teal rounded-2xl shadow-inner">
                <h4 className="text-[10px] font-black text-accent-teal uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> {t('intelligenceCenter.aiPredictiveInsight')}
                </h4>
                <p className="text-sm font-medium text-text-main-light dark:text-text-main-dark leading-relaxed italic">"{forecast.insight}"</p>
            </div>
        </div>
    );
};

export const IntelligenceCenter: React.FC<{ initiatives: TInitiative[]; onCreateInitiative: (title: string, description: string, sector?: any) => void; }> = ({ initiatives, onCreateInitiative }) => {
    const { t, i18n } = useTranslation(['dashboard']);
    const mockKpis = useMemo(() => getMockKpis(t), [t]);
    const [recommendations, setRecommendations] = useState<TStrategicRecommendation[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedKpi, setSelectedKpi] = useState<TKpi | null>(null);
    const [forecast, setForecast] = useState<TKpiForecast | null>(null);
    const [isForecasting, setIsForecasting] = useState(false);
    const [briefing, setBriefing] = useState<TDailyBriefing | null>(null);
    const [isBriefingLoading, setIsBriefingLoading] = useState(false);
    const [kpiInsights, setKpiInsights] = useState<{ analysis: string; drivers: string[]; recommendations: string[] } | null>(null);
    const [isKpiInsightLoading, setIsKpiInsightLoading] = useState(false);

    const sectorData = useMemo(() => {
        const counts: Record<string, number> = {};
        initiatives.forEach(init => {
            counts[init.sector] = (counts[init.sector] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [initiatives]);

    const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#00D4FF', '#EC4899'];

    useEffect(() => {
        const fetchBriefing = async () => {
            setIsBriefingLoading(true);
            try {
                const result = await generateDailyBriefing(initiatives, i18n.language);
                setBriefing(result);
            } catch (e) {
                console.error(e);
            } finally {
                setIsBriefingLoading(false);
            }
        };

        if (initiatives.length > 0) {
            fetchBriefing();
        }
    }, [initiatives, i18n.language]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setRecommendations(null);
        try {
            const result = await generateStrategicRecommendations(initiatives, mockKpis, Sector.GENERAL, i18n.language);
            setRecommendations(result);
        } catch (err) {
            setError(t('intelligenceCenter.errorGenerate'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKpiClick = async (kpi: TKpi) => {
        if (selectedKpi?.name === kpi.name) return; // Prevent re-fetch
        setSelectedKpi(kpi);
        setIsForecasting(true);
        setIsKpiInsightLoading(true);
        setForecast(null);
        setKpiInsights(null);
        try {
            // Using a generic sector for aggregate dashboard context
            const forecastPromise = generateKpiForecast(kpi.name, kpi.value, 'Technology & SaaS', i18n.language); 
            const insightsPromise = generateKpiInsights(kpi, i18n.language);
            
            const [forecastResult, insightsResult] = await Promise.all([forecastPromise, insightsPromise]);
            
            setForecast(forecastResult);
            setKpiInsights(insightsResult);
        } catch (e) {
            console.error(e);
        } finally {
            setIsForecasting(false);
            setIsKpiInsightLoading(false);
        }
    };
    
    const sourceStyles: Record<string, string> = {
        'Underperforming Feature': 'bg-accent-red/10 text-accent-red border-accent-red/20',
        'High-Engagement Segment': 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
        'Market Threat': 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
    };

    const getSourceTranslationKey = (source: string) => {
        if (source === 'Underperforming Feature') return 'underperformingFeature';
        if (source === 'High-Engagement Segment') return 'highEngagementSegment';
        if (source === 'Market Threat') return 'marketThreat';
        return source;
    };

    const getSentimentTranslationKey = (sentiment: string) => {
        if (sentiment === 'Positive') return 'positive';
        if (sentiment === 'Cautionary') return 'cautionary';
        if (sentiment === 'Negative') return 'negative';
        return sentiment;
    };

    return (
        <div className="p-8 space-y-12 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black text-text-main-light dark:text-text-main-dark tracking-tighter">{t('intelligenceCenter.title')}</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark font-medium mt-2 text-lg">{t('intelligenceCenter.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-accent-emerald bg-accent-emerald/10 px-6 py-3 rounded-2xl border border-accent-emerald/20 shadow-sm">
                    <Activity className="h-4 w-4 animate-pulse" />
                    {t('intelligenceCenter.liveMonitoring')}
                </div>
            </div>

            {/* Daily Briefing Section */}
            <div className="bg-surface-dark dark:bg-surface-darker rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden border border-border-dark group">
                <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="p-5 bg-accent-teal/20 rounded-3xl backdrop-blur-xl border border-accent-teal/30 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                            <Brain className="h-10 w-10 text-accent-teal" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter">{t('intelligenceCenter.executiveBriefing')}</h2>
                            <p className="text-text-muted-dark font-black uppercase tracking-[0.2em] text-[10px] mt-2 opacity-70">{t('intelligenceCenter.aiSynthesized', { count: initiatives.length })}</p>
                        </div>
                    </div>

                    {isBriefingLoading ? (
                        <div className="flex items-center gap-6 animate-pulse py-10">
                            <RefreshCw className="h-8 w-8 animate-spin text-accent-teal" />
                            <span className="text-2xl font-black tracking-tight text-text-muted-dark">{t('intelligenceCenter.synthesizing')}</span>
                        </div>
                    ) : briefing ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-10">
                                <p className="text-3xl leading-tight text-white font-black tracking-tight italic">
                                    "{briefing.summary}"
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="bg-surface-darker/40 backdrop-blur-xl rounded-3xl p-8 border border-border-dark shadow-inner hover:border-accent-emerald/30 transition-colors">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-emerald mb-6 flex items-center gap-3">
                                            <TrendingUp className="h-5 w-5" /> {t('intelligenceCenter.opportunities')}
                                        </h3>
                                        <ul className="space-y-4">
                                            {briefing.opportunities.map((item, i) => (
                                                <li key={i} className="text-sm font-bold flex items-start gap-4 text-text-muted-dark leading-relaxed">
                                                    <span className="mt-2 w-2 h-2 rounded-full bg-accent-emerald shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-surface-darker/40 backdrop-blur-xl rounded-3xl p-8 border border-border-dark shadow-inner hover:border-accent-teal/30 transition-colors">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-teal mb-6 flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5" /> {t('intelligenceCenter.topPriorities')}
                                        </h3>
                                        <ul className="space-y-4">
                                            {briefing.priorities.map((item, i) => (
                                                <li key={i} className="text-sm font-bold flex items-start gap-4 text-text-muted-dark leading-relaxed">
                                                    <span className="mt-2 w-2 h-2 rounded-full bg-accent-teal shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="bg-surface-darker/40 backdrop-blur-xl rounded-3xl p-8 border border-border-dark shadow-inner hover:border-accent-amber/30 transition-colors">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-amber mb-6 flex items-center gap-3">
                                        <ShieldAlert className="h-5 w-5" /> {t('intelligenceCenter.criticalRisks')}
                                    </h3>
                                    <ul className="space-y-4">
                                        {briefing.risks.map((item, i) => (
                                            <li key={i} className="text-sm font-black flex items-start gap-4 text-text-muted-dark leading-relaxed">
                                                <span className="mt-2 w-2.5 h-2.5 rounded-full bg-accent-amber shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex items-center gap-4 bg-surface-darker/40 backdrop-blur-xl rounded-2xl px-6 py-4 border border-border-dark w-fit shadow-lg">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted-dark">{t('intelligenceCenter.sentiment')}</span>
                                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border shadow-sm ${
                                        briefing.sentiment === 'Positive' ? 'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/30' :
                                        briefing.sentiment === 'Cautionary' ? 'bg-accent-red/20 text-accent-red border-accent-red/30' :
                                        'bg-gray-400/20 text-gray-300 border-gray-400/30'
                                    }`}>
                                        {t(`intelligenceCenter.sentimentValue.${getSentimentTranslationKey(briefing.sentiment)}`, { defaultValue: briefing.sentiment })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center">
                            <p className="text-text-muted-dark italic font-bold text-xl opacity-50">{t('intelligenceCenter.noBriefing')}</p>
                        </div>
                    )}
                </div>
                <div className="absolute -right-20 -bottom-20 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-1000">
                    <Brain className="h-[30rem] w-[30rem]" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left: KPIs */}
                <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark p-10 rounded-[2.5rem] shadow-sm border border-border-light dark:border-border-dark">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl font-black text-text-main-light dark:text-text-main-dark flex items-center gap-4 tracking-tighter">
                            <BarChart3 className="h-8 w-8 text-accent-teal" />
                            {t('intelligenceCenter.liveKpiDashboard')}
                        </h2>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark bg-surface-darker/5 dark:bg-surface-darker/20 px-4 py-1.5 rounded-full border border-border-light dark:border-border-dark">{t('intelligenceCenter.updatedRealTime')}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {mockKpis.map(kpi => (
                            <KpiCard 
                                key={kpi.name} 
                                kpi={kpi} 
                                onClick={() => handleKpiClick(kpi)}
                                isSelected={selectedKpi?.name === kpi.name}
                            />
                        ))}
                    </div>
                </div>

                {/* Right: Sector Distribution */}
                <div className="bg-surface-light dark:bg-surface-dark p-10 rounded-[2.5rem] shadow-sm border border-border-light dark:border-border-dark">
                    <h2 className="text-3xl font-black text-text-main-light dark:text-text-main-dark flex items-center gap-4 mb-10 tracking-tighter">
                        <PieChart className="h-8 w-8 text-accent-emerald" />
                        {t('intelligenceCenter.portfolioMix')}
                    </h2>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={sectorData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={10}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {sectorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#0a0a0a', 
                                        border: 'none', 
                                        borderRadius: '16px', 
                                        color: '#fff',
                                        fontSize: '11px',
                                        fontWeight: '900',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)'
                                    }} 
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-10 space-y-4">
                        {sectorData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-4 h-4 rounded-lg shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-[11px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.1em] truncate max-w-[180px]">{entry.name}</span>
                                </div>
                                <span className="text-base font-black text-text-main-light dark:text-text-main-dark">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Predictive Analytics & Insights */}
                <div className="bg-surface-light dark:bg-surface-dark p-10 rounded-[2.5rem] shadow-sm border border-border-light dark:border-border-dark flex flex-col">
                    <h2 className="text-3xl font-black text-text-main-light dark:text-text-main-dark flex items-center gap-4 mb-10 tracking-tighter">
                        <TrendingUp className="h-9 w-9 text-accent-teal" />
                        {t('intelligenceCenter.predictiveAnalytics')}
                    </h2>
                    {isForecasting || isKpiInsightLoading ? (
                        <div className="flex-grow flex flex-col items-center justify-center min-h-[500px]">
                            <div className="relative">
                                <Spinner />
                                <Brain className="h-6 w-6 text-accent-teal absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <p className="mt-8 text-accent-teal font-black uppercase tracking-[0.3em] text-xs animate-pulse">{t('intelligenceCenter.runningForecast')}</p>
                        </div>
                    ) : (forecast && kpiInsights) ? (
                        <div className="flex-grow space-y-12 animate-in fade-in duration-500">
                            <div>
                                <h3 className="text-xl font-black text-text-main-light dark:text-text-main-dark mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-2 h-8 bg-accent-teal rounded-full" />
                                    {t('intelligenceCenter.forecastTitle', { kpiName: forecast.kpiName })}
                                </h3>
                                <ForecastChart forecast={forecast} />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-border-light dark:border-border-dark">
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-text-main-light dark:text-text-main-dark mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                                        <div className="p-2 bg-accent-teal/10 rounded-xl">
                                            <Brain className="h-5 w-5 text-accent-teal" />
                                        </div>
                                        {t('intelligenceCenter.strategicAnalysis')}
                                    </h4>
                                    <p className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark leading-relaxed italic">
                                        {kpiInsights.analysis}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-text-main-light dark:text-text-main-dark mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                                        <div className="p-2 bg-accent-emerald/10 rounded-xl">
                                            <Activity className="h-5 w-5 text-accent-emerald" />
                                        </div>
                                        {t('intelligenceCenter.keyDrivers')}
                                    </h4>
                                    <ul className="space-y-4">
                                        {kpiInsights.drivers.map((driver, i) => (
                                            <li key={i} className="text-xs font-black text-text-muted-light dark:text-text-muted-dark flex items-start gap-4 p-3 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl border border-border-light dark:border-border-dark hover:border-accent-emerald/30 transition-colors">
                                                <span className="mt-1.5 w-2 h-2 rounded-full bg-accent-emerald shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                {driver}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="bg-surface-darker/5 dark:bg-surface-darker/20 p-8 rounded-3xl border border-border-light dark:border-border-dark shadow-inner">
                                <h4 className="text-[11px] font-black text-text-main-light dark:text-text-main-dark mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                                    <div className="p-2 bg-accent-amber/10 rounded-xl">
                                        <Lightbulb className="h-5 w-5 text-accent-amber" />
                                    </div>
                                    {t('intelligenceCenter.recommendedActions')}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {kpiInsights.recommendations.map((rec, i) => (
                                        <div key={i} className="flex items-start gap-4 text-xs font-black text-text-muted-light dark:text-text-muted-dark p-4 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:border-accent-teal/30 transition-all hover:shadow-md">
                                            <CheckCircle2 className="h-5 w-5 text-accent-teal mt-0.5 shrink-0" />
                                            {rec}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-text-muted-light dark:text-text-muted-dark min-h-[500px] bg-surface-darker/5 dark:bg-surface-darker/20 rounded-[2rem] border-4 border-dashed border-border-light dark:border-border-dark group">
                            <Activity className="h-24 w-24 mb-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500" />
                            <p className="font-black uppercase tracking-[0.3em] text-[10px] opacity-60">{t('intelligenceCenter.selectKpiPrompt')}</p>
                        </div>
                    )}
                </div>

                {/* Strategic Feedback Loop */}
                <div className="bg-surface-light dark:bg-surface-dark p-10 rounded-[2.5rem] shadow-sm border border-border-light dark:border-border-dark">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-8 mb-12">
                        <div>
                            <h2 className="text-3xl font-black text-text-main-light dark:text-text-main-dark flex items-center gap-4 tracking-tighter">
                                <Lightbulb className="h-9 w-9 text-accent-amber" /> {t('intelligenceCenter.strategicLoop')}
                            </h2>
                            <p className="text-lg font-medium text-text-muted-light dark:text-text-muted-dark mt-2">{t('intelligenceCenter.aiDrivenGrowth')}</p>
                        </div>
                        <Button onClick={handleGenerate} disabled={isLoading} className="px-10 py-4 rounded-2xl shadow-2xl hover:shadow-accent-teal/40 transition-all active:scale-95 font-black uppercase tracking-widest text-xs">
                            {isLoading ? <Spinner /> : <><RefreshCw className="h-5 w-5 mr-3 animate-spin-slow" /> {t('intelligenceCenter.generate')}</>}
                        </Button>
                    </div>

                    {error && (
                        <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl mb-8 animate-in shake duration-500">
                            <p className="text-accent-red text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" /> {error}
                            </p>
                        </div>
                    )}
                    
                    {recommendations ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {recommendations.map(rec => (
                                <div key={rec.id} className="bg-surface-light dark:bg-surface-darker/30 p-8 rounded-3xl border border-border-light dark:border-border-dark hover:shadow-2xl hover:border-accent-teal/40 transition-all group relative overflow-hidden">
                                    <div className="flex items-start justify-between gap-6 mb-6">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark group-hover:border-accent-teal/50 transition-colors">
                                                <MessageSquareQuote className="h-6 w-6 text-accent-teal" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-text-main-light dark:text-text-main-dark tracking-tight">{rec.title}</h3>
                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border mt-3 inline-block shadow-sm ${sourceStyles[rec.source] || 'bg-gray-400/20 text-gray-300 border-gray-400/30'}`}>
                                                    {t(`intelligenceCenter.source.${getSourceTranslationKey(rec.source)}`, { defaultValue: rec.source })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark mb-8 leading-relaxed line-clamp-3 italic opacity-80 group-hover:opacity-100 transition-opacity">"{rec.justification}"</p>
                                    <Button 
                                        onClick={() => onCreateInitiative(rec.title, rec.justification)}
                                        variant="outline"
                                        className="w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] border-2 rounded-2xl hover:bg-accent-teal hover:text-white hover:border-accent-teal transition-all group-hover:shadow-lg"
                                    >
                                        <Plus className="h-4 w-4 mr-3" /> {t('intelligenceCenter.convertToInitiative')}
                                    </Button>
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-10 transition-opacity">
                                        <Sparkles className="h-12 w-12 text-accent-teal" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-text-muted-light dark:text-text-muted-dark bg-surface-darker/5 dark:bg-surface-darker/20 rounded-[2rem] border-4 border-dashed border-border-light dark:border-border-dark group">
                            <Lightbulb className="h-24 w-24 mb-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500" />
                            <p className="font-black uppercase tracking-[0.3em] text-[10px] opacity-60">{t('intelligenceCenter.clickGeneratePrompt')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
