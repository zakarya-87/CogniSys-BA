
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TSwotAnalysis, TInitiative, TBusinessModelCanvas, TReportDetailLevel, TRecommendedTechnique, TSuggestedKpi } from '../../types';
import { generateSwotAnalysis, generateBusinessModelCanvas, generateInvestmentAnalysis, recommendTechniques, suggestKpis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { RecommendedTechniques } from '../ui/RecommendedTechniques';


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
    
    // Check if the user has edited the context/goal. 
    // If they haven't (or if it's empty), reset to the new default.
    // This is a simplified check.
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
    <div className={`p-6 rounded-xl shadow-inner border border-white/20 dark:border-black/20 ${className} transition-transform hover:scale-[1.02]`}>
      <h3 className="text-2xl font-black mb-4 flex items-center gap-3 uppercase tracking-wider opacity-80">{icon}{title}</h3>
      <ul className="list-disc list-inside space-y-2 text-sm md:text-base font-medium">
        {(items || []).map((item, index) => <li key={index} className="leading-relaxed">{item}</li>)}
      </ul>
    </div>
  );

  const CanvasBlock: React.FC<{ title: string; items: string[]; icon: React.ReactNode; className?: string }> = ({ title, items, icon, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col ${className}`}>
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center pb-2 border-b border-gray-100 dark:border-gray-700 uppercase tracking-wide text-xs">{icon}<span className="ml-2">{title}</span></h4>
        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1.5 flex-grow">
            {(items || []).map((item, index) => <li key={index} className="leading-snug">{item}</li>)}
        </ul>
    </div>
  );

  return (
    <div className="flex gap-6">
        <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard:strategy.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('dashboard:strategy.description')}</p>
            
            <div className="space-y-4">
                <div>
                <label htmlFor="context" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dashboard:strategy.contextLabel')}</label>
                <div className="flex items-center space-x-2 mb-2">
                    <button onClick={() => handleAddDocument('report')} disabled={documents.includes('report')} className="flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700">
                    <DocumentTextIcon className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('dashboard:strategy.addReport')}
                    </button>
                    <button onClick={() => handleAddDocument('market')} disabled={documents.includes('market')} className="flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ChartBarIcon className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('dashboard:strategy.addMarket')}
                    </button>
                </div>
                <textarea
                    id="context"
                    rows={5}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-teal"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder={t('dashboard:strategy.contextPlaceholder')}
                />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard:strategy.investment.financialProjections')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard:strategy.investment.projectedCost')}</label>
                            <input 
                                type="number"
                                id="cost"
                                value={projectedCost}
                                onChange={(e) => setProjectedCost(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-teal"
                                placeholder={t('dashboard:strategy.investment.budgetPlaceholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="revenue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard:strategy.investment.expectedRevenue')}</label>
                            <input 
                                type="number"
                                id="revenue"
                                value={expectedRevenue}
                                onChange={(e) => setExpectedRevenue(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-teal"
                                placeholder={t('dashboard:strategy.investment.budgetPlaceholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard:strategy.investment.timeframe')}</label>
                            <input 
                                type="text"
                                id="timeframe"
                                value={timeframe}
                                onChange={(e) => setTimeframe(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-teal"
                                placeholder={t('dashboard:strategy.investment.timelinePlaceholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="detailLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard:strategy.investment.detailLevel')}</label>
                            <select
                                id="detailLevel"
                                value={reportDetailLevel}
                                onChange={(e) => setReportDetailLevel(e.target.value as TReportDetailLevel)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-teal"
                            >
                                <option value="basic">{t('dashboard:strategy.investment.basic')}</option>
                                <option value="detailed">{t('dashboard:strategy.investment.detailed')}</option>
                                <option value="executive">{t('dashboard:strategy.investment.executive')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                 <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard:strategy.kpi.title')}</h3>
                    <div>
                        <label htmlFor="businessGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard:strategy.kpi.businessGoal')}</label>
                        <textarea 
                            id="businessGoal"
                            value={businessGoal}
                            onChange={(e) => setBusinessGoal(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-teal"
                            rows={3}
                            placeholder={t('dashboard:strategy.kpi.goalPlaceholder')}
                        />
                    </div>
                    <div className="mt-2">
                        <Button onClick={handleSuggestKpis} disabled={isGeneratingKpis || !businessGoal}>
                            {isGeneratingKpis ? <Spinner /> : t('dashboard:strategy.kpi.suggest')}
                        </Button>
                    </div>

                    {kpiError && <p className="text-accent-red mt-2">{kpiError}</p>}

                    {(suggestedKpis || []).length > 0 && (
                        <div className="mt-4 space-y-3">
                             <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">{t('dashboard:strategy.kpi.suggested')}</h4>
                            {suggestedKpis.map((kpi, index) => (
                                <div key={index} className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md flex items-start gap-3">
                                    <CheckBadgeIcon className="h-5 w-5 text-accent-emerald flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="font-bold text-gray-800 dark:text-gray-200">{kpi.kpi}</h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{kpi.goal}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <Button onClick={handleGenerateAnalysis} disabled={isLoading || !context}>
                {isLoading ? <Spinner /> : t('dashboard:strategy.generate')}
            </Button>

            {error && <p className="text-accent-red">{error}</p>}

            {swot && (
                <div className="pt-4">
                    <h3 className="text-xl font-semibold mb-4 text-center">{t('dashboard:strategy.swot.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900 dark:text-white">
                        <SwotQuadrant title={t('dashboard:strategy.swot.strengths')} items={swot.strengths} className="bg-accent-emerald/10 dark:bg-accent-emerald/20" icon={<PlusCircleIcon className="h-6 w-6 text-accent-emerald" />} />
                        <SwotQuadrant title={t('dashboard:strategy.swot.weaknesses')} items={swot.weaknesses} className="bg-accent-red/10 dark:bg-accent-red/20" icon={<MinusCircleIcon className="h-6 w-6 text-accent-red" />} />
                        <SwotQuadrant title={t('dashboard:strategy.swot.opportunities')} items={swot.opportunities} className="bg-accent-teal/10 dark:bg-accent-teal/20" icon={<ArrowUpCircleIcon className="h-6 w-6 text-accent-teal" />} />
                        <SwotQuadrant title={t('dashboard:strategy.swot.threats')} items={swot.threats} className="bg-accent-amber/10 dark:bg-accent-amber/20" icon={<ExclamationTriangleIcon className="h-6 w-6 text-accent-amber" />} />
                    </div>
                </div>
            )}

            {canvas && (
                <div className="pt-8">
                    <h3 className="text-xl font-semibold mb-4 text-center">{t('dashboard:strategy.canvas.title')}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 text-sm bg-gray-100 dark:bg-gray-900 p-4 rounded-xl border border-gray-300 dark:border-gray-700 shadow-inner">
                        <div className="lg:col-span-2 flex"><CanvasBlock title={t('dashboard:strategy.canvas.keyPartnerships')} items={canvas.keyPartnerships} icon={<UsersIcon className="h-5 w-5 text-gray-500" />} className="w-full" /></div>
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <CanvasBlock title={t('dashboard:strategy.canvas.keyActivities')} items={canvas.keyActivities} icon={<BoltIcon className="h-5 w-5 text-gray-500"/>} className="flex-1" />
                            <CanvasBlock title={t('dashboard:strategy.canvas.keyResources')} items={canvas.keyResources} icon={<KeyIcon className="h-5 w-5 text-gray-500"/>} className="flex-1" />
                        </div>
                        <div className="lg:col-span-2 flex"><CanvasBlock title={t('dashboard:strategy.canvas.valuePropositions')} items={canvas.valuePropositions} icon={<GiftIcon className="h-5 w-5 text-gray-500"/>} className="w-full" /></div>
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <CanvasBlock title={t('dashboard:strategy.canvas.customerRelationships')} items={canvas.customerRelationships} icon={<HeartIcon className="h-5 w-5 text-gray-500"/>} className="flex-1" />
                            <CanvasBlock title={t('dashboard:strategy.canvas.channels')} items={canvas.channels} icon={<TruckIcon className="h-5 w-5 text-gray-500"/>} className="flex-1" />
                        </div>
                        <div className="lg:col-span-2 flex"><CanvasBlock title={t('dashboard:strategy.canvas.customerSegments')} items={canvas.customerSegments} icon={<UserGroupIcon className="h-5 w-5 text-gray-500"/>} className="w-full" /></div>
                        
                        <div className="lg:col-span-5 flex"><CanvasBlock title={t('dashboard:strategy.canvas.costStructure')} items={canvas.costStructure} icon={<TagIcon className="h-5 w-5 text-gray-500"/>} className="w-full" /></div>
                        <div className="lg:col-span-5 flex"><CanvasBlock title={t('dashboard:strategy.canvas.revenueStreams')} items={canvas.revenueStreams} icon={<CurrencyDollarIcon className="h-5 w-5 text-gray-500"/>} className="w-full" /></div>
                    </div>
                </div>
            )}

            {investmentAnalysis && (
                <div className="pt-8">
                    <h3 className="text-xl font-semibold mb-4 text-center flex items-center justify-center gap-2">
                        <BanknotesIcon className="h-6 w-6 text-gray-500" />
                        {t('dashboard:strategy.investment.title')}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
                            {investmentAnalysis}
                        </pre>
                    </div>
                </div>
            )}
        </div>
        <div className="w-80 flex-shrink-0">
            <RecommendedTechniques
                techniques={recommendedTechniques}
                isLoading={isLoadingRecs}
                onSelectTechnique={onNavigateToTechnique}
            />
        </div>
    </div>
  );
};


// Icons
const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MinusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ArrowUpCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
const CheckBadgeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;

// Canvas Icons
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const BoltIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const KeyIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
const GiftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>;
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 9h.008v.008H6V9z" /></svg>;
const CurrencyDollarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BanknotesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;
