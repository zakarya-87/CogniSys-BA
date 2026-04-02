
import React, { useState, useCallback, useEffect } from 'react';
import { TInitiative, TKpi, TPerformanceAnalysis, TFeedbackAnalysis } from '../../types';
import { generatePerformanceAnalysis, analyzeUserFeedback } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface SolutionEvaluatorProps {
  initiative: TInitiative;
}

const MOCK_KPIS: TKpi[] = [
    { name: "User Engagement", value: 75, target: 80, unit: '%', higherIsBetter: true, trend: 'stable' },
    { name: "Avg. Load Time", value: 450, target: 300, unit: 'ms', higherIsBetter: false, trend: 'declining' },
    { name: "Revenue per User", value: 13.20, target: 12.50, unit: '$/user', higherIsBetter: true, trend: 'improving' },
    { name: "CSAT Score", value: 8.2, target: 9.0, unit: '/10', higherIsBetter: true, trend: 'declining' },
];

const KpiCard: React.FC<{ kpi: TKpi }> = ({ kpi }) => {
    const percentage = kpi.higherIsBetter ? (kpi.value / kpi.target) * 100 : (kpi.target / kpi.value) * 100;
    const isSuccess = kpi.higherIsBetter ? kpi.value >= kpi.target : kpi.value <= kpi.target;
    
    let barColor = 'bg-accent-amber';
    if (percentage < 75) barColor = 'bg-accent-red';
    if (isSuccess) barColor = 'bg-accent-emerald';

    const trendConfig = {
        improving: {
            icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
            color: 'text-accent-emerald dark:text-accent-emerald/80',
        },
        declining: {
            icon: <ArrowTrendingDownIcon className="h-5 w-5" />,
            color: 'text-accent-red dark:text-accent-red/80',
        },
        stable: {
            icon: <MinusIcon className="h-5 w-5" />,
            color: 'text-gray-500 dark:text-gray-400',
        }
    };
    const trend = trendConfig[kpi.trend];

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="flex justify-between items-baseline">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{kpi.name}</p>
                <p className={`text-xs font-semibold ${isSuccess ? 'text-accent-emerald dark:text-accent-emerald/80' : 'text-accent-red dark:text-accent-red/80'}`}>
                    Target: {kpi.target}{kpi.unit}
                </p>
            </div>
             <div className="flex items-end justify-between my-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}<span className="text-base font-normal text-gray-500 dark:text-gray-400">{kpi.unit}</span></p>
                {trend && (
                    <span className={`inline-flex items-center ${trend.color}`}>
                        {trend.icon}
                    </span>
                )}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
        </div>
    );
};

const VoCAnalyzer: React.FC<{ initiative: TInitiative }> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [feedback, setFeedback] = useState("The new mobile app interface is sleek, but I can't find the logout button! Also, the transaction history takes forever to load on weekends. Otherwise, good job.");
    const [analysis, setAnalysis] = useState<TFeedbackAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initiative.artifacts?.feedbackAnalysis) {
            setAnalysis(initiative.artifacts.feedbackAnalysis);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleAnalyze = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await analyzeUserFeedback(feedback, initiative.sector);
            setAnalysis(result);
            saveArtifact(initiative.id, 'feedbackAnalysis', result);
        } catch (e) {
            console.error(e);
            setError("Failed to analyze feedback");
        } finally {
            setIsLoading(false);
        }
    };

    const sentimentColor = (score: number) => {
        if (score > 20) return 'bg-accent-emerald';
        if (score < -20) return 'bg-accent-red';
        return 'bg-accent-amber';
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Raw User Feedback (Reviews, Tickets, Emails)</label>
                <textarea
                    rows={4}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Paste user feedback here..."
                />
                {error && (
                    <div className="mt-2 p-3 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 text-sm">
                        {error}
                    </div>
                )}
                <div className="mt-2">
                    <Button onClick={handleAnalyze} disabled={isLoading || !feedback.trim()}>
                        {isLoading ? <Spinner /> : 'Analyze Voice of Customer'}
                    </Button>
                </div>
            </div>

            {analysis && (
                <div className="animate-fade-in-down space-y-6">
                    {/* Sentiment Meter */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                        <div className="flex justify-between items-end mb-2">
                            <h4 className="font-bold text-gray-700 dark:text-gray-200">Overall Sentiment</h4>
                            <span className="text-xl font-black text-gray-900 dark:text-white">{analysis.overallSentiment > 0 ? '+' : ''}{analysis.overallSentiment}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 h-4 rounded-full relative overflow-hidden">
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-black/20 z-10"></div>
                            <div 
                                className={`h-full transition-all duration-1000 ${sentimentColor(analysis.overallSentiment)}`} 
                                style={{ 
                                    width: `${Math.abs(analysis.overallSentiment)}%`, 
                                    marginLeft: analysis.overallSentiment > 0 ? '50%' : `calc(50% - ${Math.abs(analysis.overallSentiment)}%)` 
                                }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Negative (-100)</span>
                            <span>Neutral (0)</span>
                            <span>Positive (+100)</span>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 italic">"{analysis.summary}"</p>
                    </div>

                    {/* Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(analysis.insights || []).map((insight, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-accent-purple">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-gray-900 dark:text-white">{insight.theme}</h5>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        insight.sentiment === 'Positive' ? 'bg-accent-emerald/10 text-accent-emerald' : 
                                        insight.sentiment === 'Negative' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-amber/10 text-accent-amber'
                                    }`}>
                                        {insight.sentiment}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{insight.recommendation}</p>
                                <button className="text-xs text-accent-purple dark:text-accent-purple/90 font-semibold hover:underline flex items-center">
                                    + Add to Backlog
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const SolutionEvaluator: React.FC<SolutionEvaluatorProps> = ({ initiative }) => {
  const { saveArtifact } = useCatalyst();
  const [activeTab, setActiveTab] = useState<'KPI' | 'VoC'>('KPI');
  const [analysis, setAnalysis] = useState<TPerformanceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      if (initiative.artifacts?.performanceAnalysis) {
          setAnalysis(initiative.artifacts.performanceAnalysis);
      }
  }, [initiative.id, initiative.artifacts]);

  const handleAnalysis = useCallback(async () => {
    setError(null);
        setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await generatePerformanceAnalysis(MOCK_KPIS);
      setAnalysis(result);
      saveArtifact(initiative.id, 'performanceAnalysis', result);
    } catch (err) {
      setError('Failed to generate analysis. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [initiative.id, saveArtifact]);

  const severityStyles = {
    High: 'bg-accent-red/10 text-accent-red dark:bg-accent-red/20 dark:text-accent-red/90',
    Medium: 'bg-accent-amber/10 text-accent-amber dark:bg-accent-amber/20 dark:text-accent-amber/90',
    Low: 'bg-accent-purple/10 text-accent-purple dark:bg-accent-purple/20 dark:text-accent-purple/90',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Solution Evaluation</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Measure value delivery via Quantitative (KPI) and Qualitative (VoC) methods.</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex gap-1">
            <button onClick={() => setActiveTab('KPI')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'KPI' ? 'bg-accent-purple text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>KPIs</button>
            <button onClick={() => setActiveTab('VoC')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'VoC' ? 'bg-accent-purple text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>Voice of Customer</button>
        </div>
      </div>
      
      {activeTab === 'KPI' ? (
          <div className="animate-fade-in-down space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MOCK_KPIS.map((kpi) => <KpiCard key={kpi.name} kpi={kpi} />)}
            </div>

            <div className="text-center">
                <Button onClick={handleAnalysis} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 
                        <>
                            <BeakerIcon className="h-5 w-5 mr-2" />
                            Run Performance Analysis
                        </>
                    }
                </Button>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {analysis && (
                <div className="space-y-6 pt-4">
                    {/* Detected Anomalies */}
                    <div>
                        <h3 className="text-xl font-semibold mb-3 flex items-center">
                            <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-accent-amber" />
                            Detected Anomalies
                        </h3>
                        <div className="space-y-3">
                            {(analysis.anomalies || []).map((item, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-start gap-4">
                                    <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityStyles[item.severity]}`}>{item.severity}</div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{item.kpi}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.summary}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Root Cause Summary */}
                    <div className="bg-accent-purple/10 dark:bg-accent-purple/20 border-l-4 border-accent-purple p-4 rounded-r-lg">
                        <h3 className="text-xl font-semibold mb-2 text-accent-purple dark:text-accent-purple/90 flex items-center">
                            <LightBulbIcon className="h-6 w-6 mr-2"/>
                            AI Root Cause Insights
                        </h3>
                        <p className="text-gray-800 dark:text-gray-300">{analysis.rootCauseSummary}</p>
                    </div>
                </div>
            )}
          </div>
      ) : (
          <VoCAnalyzer initiative={initiative} />
      )}
    </div>
  );
};

// Icons
const ArrowTrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
);
const ArrowTrendingDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>
);
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
);
const BeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 01-6.23-.693L4.2 15.3m15.6 0c1.255 0 2.443.29 3.5.832v-2.67a1.5 1.5 0 00-1.5-1.5h-15a1.5 1.5 0 00-1.5 1.5v2.67c1.057-.542 2.245-.832 3.5-.832h12.5z" /></svg>
);
const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
);
const LightBulbIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-11.62a6.01 6.01 0 00-3 0a6.01 6.01 0 001.5 11.62z" /></svg>
);
