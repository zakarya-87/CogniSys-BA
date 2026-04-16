import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Activity,
    Target, 
    Zap, 
    Database, 
    ShieldCheck, 
    TrendingUp, 
    Plus,
    Layout,
    Users,
    Key,
    Gift,
    Heart,
    Truck,
    Tag,
    DollarSign,
    Users2,
    CheckCircle2,
    AlertCircle,
    TrendingDown,
    Search,
    FileText,
    BarChart3,
    ArrowUpRight,
    MousePointer2,
    Sparkles,
    Banknote
} from 'lucide-react';
import { TSwotAnalysis, TInitiative, TBusinessModelCanvas, TReportDetailLevel, TRecommendedTechnique, TSuggestedKpi } from '../../types';
import { generateSwotAnalysis, generateBusinessModelCanvas, generateInvestmentAnalysis, recommendTechniques, suggestKpis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { RecommendedTechniques } from '../ui/RecommendedTechniques';
import { useUI } from '../../context/UIContext';

interface StrategyAnalyzerProps {
  initiative: TInitiative;
  onNavigateToTechnique: (techniqueName: string) => void;
}

const MOCK_DOCS = {
  report: "Source: Company Report 2023\nOur key strengths include our patented technology and agile development process. A weakness is our limited marketing budget which restricts reach.",
  market: "Source: Market Analysis Q3 2023\nA new competitor has emerged. However, there is a significant opportunity in the SME sector which is currently underserved. A potential threat is the upcoming change in data privacy regulations."
};

export const StrategyAnalyzer: React.FC<StrategyAnalyzerProps> = ({ initiative, onNavigateToTechnique }) => {
  const { t, i18n } = useTranslation(['common', 'dashboard']);
  const { isFocusModeActive } = useUI();
  const currentLanguage = i18n.language;
  const sector = initiative.sector;
  const [context, setContext] = useState(
    t('dashboard:strategy.defaultContext', { title: initiative.title })
  );
  const [documents, setDocuments] = useState<string[]>([]);
  const [swot, setSwot] = useState<TSwotAnalysis | null>(null);
  const [canvas, setCanvas] = useState<TBusinessModelCanvas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectedCost, setProjectedCost] = useState('500000');
  const [expectedRevenue, setExpectedRevenue] = useState('2500000');
  const [timeframe, setTimeframe] = useState(currentLanguage === 'ar' ? '3 سنوات' : '3 years');
  const [reportDetailLevel, setReportDetailLevel] = useState<TReportDetailLevel>('basic');
  const [investmentAnalysis, setInvestmentAnalysis] = useState<string | null>(null);

  const [businessGoal, setBusinessGoal] = useState(
    t('dashboard:strategy.defaultGoal', { title: initiative.title })
  );
  const [suggestedKpis, setSuggestedKpis] = useState<TSuggestedKpi[]>([]);
  const [isGeneratingKpis, setIsGeneratingKpis] = useState(false);
  const [kpiError, setKpiError] = useState<string | null>(null);

  const [recommendedTechniques, setRecommendedTechniques] = useState<TRecommendedTechnique[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  useEffect(() => {
    const defaultContext = t('dashboard:strategy.defaultContext', { title: initiative.title });
    const defaultGoal = t('dashboard:strategy.defaultGoal', { title: initiative.title });
    
    if (context === "" || context === t('dashboard:strategy.defaultContext', { title: initiative.title, lng: 'ar' }) || context === t('dashboard:strategy.defaultContext', { title: initiative.title, lng: 'en' })) {
      setContext(defaultContext);
    }

    if (businessGoal === "" || businessGoal === t('dashboard:strategy.defaultGoal', { title: initiative.title, lng: 'ar' }) || businessGoal === t('dashboard:strategy.defaultGoal', { title: initiative.title, lng: 'en' })) {
      setBusinessGoal(defaultGoal);
    }

    setTimeframe(t('dashboard:investment.timeframe_value', '3 years'));
  }, [currentLanguage, initiative.id, initiative.title, t]);

  useEffect(() => {
    const fetchRecommendations = async () => {
        setIsLoadingRecs(true);
        try {
            const recs = await recommendTechniques(
                `We are in the 'Strategy Analysis' phase for an initiative titled "${initiative.title}". The goal is to define the future state and assess feasibility.`,
                sector,
                currentLanguage
            );
            setRecommendedTechniques(recs);
        } catch (error) {
            console.error("Failed to fetch recommended techniques:", error);
        } finally {
            setIsLoadingRecs(false);
        }
    };
    fetchRecommendations();
  }, [initiative.title, currentLanguage, sector]);

  const handleAddDocument = (docKey: keyof typeof MOCK_DOCS) => {
    if (documents.includes(docKey)) return;
    setDocuments(prev => [...prev, docKey]);
    setContext(prev => `${prev}\n\n${MOCK_DOCS[docKey]}`);
  };

  const handleGenerateAnalysis = useCallback(async () => {
    if (!context) return;
    setIsLoading(true);
    setError(null);
    setSwot(null);
    setCanvas(null);
    setInvestmentAnalysis(null);
    try {
      const [swotResult, canvasResult] = await Promise.all([
        generateSwotAnalysis(context, sector, currentLanguage),
        generateBusinessModelCanvas(context, sector, currentLanguage)
      ]);
      setSwot(swotResult);
      setCanvas(canvasResult);

      if (projectedCost && expectedRevenue && timeframe) {
        const investmentResult = await generateInvestmentAnalysis(context, projectedCost, expectedRevenue, timeframe, reportDetailLevel, sector, currentLanguage);
        setInvestmentAnalysis(investmentResult);
      }
    } catch (err) {
      setError(t('dashboard:strategy.error_generate'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [context, projectedCost, expectedRevenue, timeframe, reportDetailLevel, sector, currentLanguage, t]);
  
  const handleSuggestKpis = useCallback(async () => {
    if (!businessGoal) return;
    setIsGeneratingKpis(true);
    setKpiError(null);
    setSuggestedKpis([]);
    try {
        const result = await suggestKpis(businessGoal, sector, currentLanguage);
        setSuggestedKpis(result);
    } catch (err) {
        setKpiError(t('dashboard:strategy.error_kpis'));
        console.error(err);
    } finally {
        setIsGeneratingKpis(false);
    }
  }, [businessGoal, sector, currentLanguage, t]);

  const SwotQuadrant: React.FC<{ title: string; items: string[]; className: string; icon: React.ReactNode }> = ({ title, items, className, icon }) => (
    <div className={`p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] ${className}`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]" />
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-black/40 rounded-xl border border-white/10 group-hover:border-white/20 transition-all">
                {icon}
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter italic">{title}</h3>
        </div>
        <ul className="space-y-4">
            {(items || []).map((item, index) => (
                <li key={index} className="flex gap-3 text-sm font-bold text-white/80 leading-relaxed group/item">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 shrink-0 group-hover/item:bg-white transition-colors" />
                    {item}
                </li>
            ))}
        </ul>
      </div>
    </div>
  );

  const CanvasBlock: React.FC<{ title: string; items: string[]; icon: React.ReactNode; className?: string }> = ({ title, items, icon, className = '' }) => (
    <div className={`bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group flex flex-col ${className}`}>
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-black/40 rounded-lg text-white/40 group-hover:text-white transition-colors">
                {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-all">{title}</h4>
        </div>
        <ul className="space-y-2 flex-grow">
            {(items || []).map((item, index) => (
                <li key={index} className="text-[11px] font-bold text-white/40 leading-snug hover:text-white/80 transition-all cursor-default flex gap-2">
                    <span className="text-accent-cyan">•</span> {item}
                </li>
            ))}
        </ul>
    </div>
  );

  return (
    <div className={`flex flex-col xl:flex-row gap-8 slide-up ${isFocusModeActive ? 'pb-20' : ''}`}>
        <div className={`flex-1 space-y-8 h-full`}>
            {/* Header section with tactical styling */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-8 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2.5 bg-accent-cyan/20 rounded-xl border border-accent-cyan/30">
                            <Activity className="h-6 w-6 text-accent-cyan" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Strategy Synthesis</h2>
                    </div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-[0.2em]">Operational Alignment & Competitive Orchestration</p>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={handleGenerateAnalysis} disabled={isLoading || !context} className="px-6 py-3 bg-accent-cyan text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#34e2cf] hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all flex items-center gap-3 disabled:opacity-20">
                        {isLoading ? <Spinner className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                        Execute Analysis
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Context Input Module */}
                <div className="relative group p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.05] transition-all duration-500">
                    <div className="absolute top-0 right-10 transform -translate-y-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-60 flex items-center gap-2">
                        <FileText className="h-3 w-3 text-accent-cyan" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Contextual Feed</span>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleAddDocument('report')} disabled={documents.includes('report')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:bg-accent-cyan hover:text-black transition-all disabled:opacity-10">
                                Import Internal Report
                            </button>
                            <button onClick={() => handleAddDocument('market')} disabled={documents.includes('market')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:bg-accent-emerald hover:text-black transition-all disabled:opacity-10">
                                Import Market Pulse
                            </button>
                        </div>
                        <textarea
                            className="w-full bg-black/40 border-none rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all resize-none font-medium custom-scrollbar h-[180px]"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Describe the initiative context..."
                        />
                    </div>
                </div>

                {/* KPI Objective Terminal */}
                <div className="relative group p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.05] transition-all duration-500">
                    <div className="absolute top-0 right-10 transform -translate-y-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-60 flex items-center gap-2">
                        <Target className="h-3 w-3 text-accent-purple" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Objective Synthesis</span>
                    </div>

                    <div className="space-y-6">
                        <textarea
                            className="w-full bg-black/40 border-none rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all resize-none font-medium custom-scrollbar h-[180px]"
                            value={businessGoal}
                            onChange={(e) => setBusinessGoal(e.target.value)}
                            placeholder="Define high-level business goals..."
                        />
                        <button onClick={handleSuggestKpis} disabled={isGeneratingKpis || !businessGoal} className="w-full py-4 bg-accent-purple/20 border border-accent-purple/30 rounded-xl text-[10px] font-black text-accent-purple uppercase tracking-widest hover:bg-accent-purple hover:text-white transition-all disabled:opacity-10 flex items-center justify-center gap-3">
                             {isGeneratingKpis ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                             Synthesize KPIs
                        </button>
                    </div>
                </div>
            </div>

            {/* Financial Projection Controls */}
            <div className="relative p-1 bg-white/[0.03] border border-white/5 rounded-[2rem] slide-up overflow-hidden group">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
                <div className="relative z-10 p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2 italic">Projected ROI Cost</label>
                        <input type="number" value={projectedCost} onChange={(e) => setProjectedCost(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm font-black text-accent-cyan focus:outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2 italic">Expected Yield</label>
                        <input type="number" value={expectedRevenue} onChange={(e) => setExpectedRevenue(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm font-black text-accent-emerald focus:outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2 italic">Fiscal Timeframe</label>
                        <input type="text" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm font-black text-white focus:outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2 italic">Report Detail Level</label>
                        <select value={reportDetailLevel} onChange={(e) => setReportDetailLevel(e.target.value as any)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none appearance-none cursor-pointer">
                            <option value="basic">Tactical Overview</option>
                            <option value="detailed">In-Depth Synthesis</option>
                            <option value="executive">Executive Summary</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SWOT ANALYSIS */}
            {swot && (
                <div className="pt-12 slide-up">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-px bg-white/5 grow" />
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">SWOT Matrix</h3>
                        <div className="h-px bg-white/5 grow" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SwotQuadrant title="Tactical Strengths" items={swot.strengths} className="bg-accent-emerald/5 border-accent-emerald/20 text-accent-emerald" icon={<CheckCircle2 className="h-6 w-6" />} />
                        <SwotQuadrant title="Operational Weaknesses" items={swot.weaknesses} className="bg-accent-red/5 border-accent-red/20 text-accent-red" icon={<AlertCircle className="h-6 w-6" />} />
                        <SwotQuadrant title="Strategic Opportunities" items={swot.opportunities} className="bg-accent-cyan/5 border-accent-cyan/20 text-accent-cyan" icon={<TrendingUp className="h-6 w-6" />} />
                        <SwotQuadrant title="External Threats" items={swot.threats} className="bg-accent-amber/5 border-accent-amber/20 text-accent-amber" icon={<TrendingDown className="h-6 w-6" />} />
                    </div>
                </div>
            )}

            {/* BUSINESS MODEL CANVAS */}
            {canvas && (
                <div className="pt-20 slide-up">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-px bg-white/5 grow" />
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Business Model Blueprint</h3>
                        <div className="h-px bg-white/5 grow" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 bg-black/40 p-6 rounded-[3rem] border border-white/5">
                        <div className="lg:col-span-2 flex"><CanvasBlock title="Key Partners" items={canvas.keyPartnerships} icon={<Users2 />} className="w-full" /></div>
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <CanvasBlock title="Key Activities" items={canvas.keyActivities} icon={<Zap />} className="flex-1" />
                            <CanvasBlock title="Key Resources" items={canvas.keyResources} icon={<Key />} className="flex-1" />
                        </div>
                        <div className="lg:col-span-2 flex"><CanvasBlock title="Value Prop" items={canvas.valuePropositions} icon={<Gift />} className="w-full bg-accent-cyan/5 border-accent-cyan/20" /></div>
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <CanvasBlock title="Customer Rel." items={canvas.customerRelationships} icon={<Heart />} className="flex-1" />
                            <CanvasBlock title="Channels" items={canvas.channels} icon={<Truck />} className="flex-1" />
                        </div>
                        <div className="lg:col-span-2 flex"><CanvasBlock title="Segments" items={canvas.customerSegments} icon={<Users />} className="w-full" /></div>
                        
                        <div className="lg:col-span-5 flex"><CanvasBlock title="Cost Structure" items={canvas.costStructure} icon={<Tag />} className="w-full h-32" /></div>
                        <div className="lg:col-span-5 flex"><CanvasBlock title="Revenue Streams" items={canvas.revenueStreams} icon={<DollarSign />} className="w-full h-32" /></div>
                    </div>
                </div>
            )}

            {/* INVESTMENT ANALYSIS Result */}
            {investmentAnalysis && (
                <div className="pt-20 slide-up">
                    <div className="relative p-1.5 bg-white/[0.02] rounded-[3rem] border border-white/5 overflow-hidden">
                        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
                        <div className="relative z-10 p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-accent-emerald/20 rounded-2xl border border-accent-emerald/30">
                                    <Banknote className="h-6 w-6 text-accent-emerald" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Investment Synthesis</h3>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Fiscal Feasibility Report</p>
                                </div>
                            </div>
                            <div className="bg-black/60 rounded-[2rem] p-8 border border-white/5 text-sm text-white/70 leading-relaxed font-medium custom-scrollbar max-h-[400px] overflow-auto">
                                <ReactMarkdown className="prose prose-invert max-w-none prose-sm">
                                    {investmentAnalysis}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Result List */}
            {suggestedKpis.length > 0 && (
                <div className="pt-12 slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suggestedKpis.map((kpi, index) => (
                            <div key={index} className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle2 className="h-4 w-4 text-accent-emerald" />
                                    <h5 className="text-xs font-black text-white uppercase tracking-widest italic leading-tight">{kpi.kpi}</h5>
                                </div>
                                <p className="text-[11px] font-medium text-gray-500 leading-relaxed group-hover:text-gray-300 transition-colors">{kpi.goal}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* SIDEBAR */}
        {!isFocusModeActive && (
            <div className="w-full xl:w-96 flex-shrink-0 animate-in slide-in-from-right-8 duration-700">
                <div className="sticky top-24">
                    <RecommendedTechniques
                        techniques={recommendedTechniques}
                        isLoading={isLoadingRecs}
                        onSelectTechnique={onNavigateToTechnique}
                    />
                </div>
            </div>
        )}
    </div>
  );
};
