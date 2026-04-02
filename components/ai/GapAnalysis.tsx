
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, TGapReport, Sector } from '../../types';
import { generateGapAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface GapAnalysisProps {
    initiative: TInitiative;
}

const ArrowsRightLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>;

export const GapAnalysis: React.FC<GapAnalysisProps> = ({ initiative }) => {
    const { t, i18n } = useTranslation(['common', 'dashboard']);
    const currentLanguage = i18n.language;
    const { saveArtifact } = useCatalyst();
    const [current, setCurrent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [future, setFuture] = useState('');
    const [report, setReport] = useState<TGapReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.gapAnalysis) {
            setReport(initiative.artifacts.gapAnalysis);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!current.trim() || !future.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateGapAnalysis(current, future, initiative.sector as Sector, initiative.description, currentLanguage);
            setReport(result);
            saveArtifact(initiative.id, 'gapAnalysis', result);
        } catch (error) {
            console.error(error);
            setError(t('dashboard:gap.error_generate'));
        } finally {
            setIsLoading(false);
        }
    };

    const categoryColors = {
        'Process': 'border-accent-purple text-accent-purple bg-accent-purple/10',
        'Technology': 'border-accent-purple/60 text-accent-purple/80 bg-accent-purple/5',
        'People': 'border-accent-emerald text-accent-emerald bg-accent-emerald/10',
        'Policy': 'border-accent-amber text-accent-amber bg-accent-amber/10',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ArrowsRightLeftIcon className="h-7 w-7 text-accent-purple" />
                        {t('dashboard:gap.title')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('dashboard:gap.description')}
                    </p>
                </div>
            </div>

            {!report && (
                <div className="space-y-6 max-w-4xl mx-auto w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('dashboard:gap.current_state')}</label>
                            <textarea
                                rows={5}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                                placeholder={t('dashboard:gap.current_placeholder')}
                                value={current}
                                onChange={(e) => setCurrent(e.target.value)}
                            />
                        </div>
                        <div className="bg-accent-purple/10 p-4 rounded-lg border border-accent-purple/20">
                            <label className="block text-sm font-bold text-accent-purple mb-2">{t('dashboard:gap.future_state')}</label>
                            <textarea
                                rows={5}
                                className="w-full p-3 border border-accent-purple/30 dark:border-accent-purple/40 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                                placeholder={t('dashboard:gap.future_placeholder')}
                                value={future}
                                onChange={(e) => setFuture(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <Button onClick={handleGenerate} disabled={isLoading || !current || !future} className="w-full md:w-auto px-8">
                            {isLoading ? <Spinner /> : t('dashboard:gap.generate')}
                        </Button>
                    </div>
                </div>
            )}

            {report && (
                <div className="flex-grow animate-fade-in-down space-y-8">
                    <div className="flex justify-center items-center gap-4">
                        <div className="text-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-xs">
                            <p className="text-xs text-gray-500 uppercase font-bold">AS-IS</p>
                            <p className="font-medium text-sm truncate" title={report.currentStateDesc}>{report.currentStateDesc}</p>
                        </div>
                        <div className="flex-shrink-0 text-gray-400">
                            <ArrowsRightLeftIcon className="h-6 w-6" />
                        </div>
                        <div className="text-center px-4 py-2 bg-accent-purple/10 rounded-lg max-w-xs">
                            <p className="text-xs text-accent-purple uppercase font-bold">TO-BE</p>
                            <p className="font-medium text-sm truncate" title={report.futureStateDesc}>{report.futureStateDesc}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {(report.gaps || []).map((gap, idx) => (
                            <div key={gap.id} className={`relative flex flex-col md:flex-row items-stretch border-l-4 rounded-r-lg shadow-sm bg-white dark:bg-gray-800 ${categoryColors[gap.category].split(' ')[0]}`}>
                                {/* Left: Gap Definition */}
                                <div className="flex-1 p-4 border-r border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${categoryColors[gap.category].split(' ').slice(1).join(' ')}`}>
                                            {gap.category}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{gap.gap}</h4>
                                    <div className="text-xs text-gray-500 space-y-1 mt-2">
                                        <p><span className="font-semibold">{t('dashboard:gap.current')}:</span> {gap.current}</p>
                                        <p><span className="font-semibold">{t('dashboard:gap.future')}:</span> {gap.future}</p>
                                    </div>
                                </div>

                                {/* Center: Connector (Visual only on desktop) */}
                                <div className="hidden md:flex flex-col justify-center items-center w-12 bg-gray-50 dark:bg-gray-900/50 text-gray-300">
                                    <svg className="w-6 h-6 transform rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>

                                {/* Right: Strategy */}
                                <div className="flex-1 p-4 bg-accent-purple/5">
                                    <h5 className="text-xs font-bold text-accent-purple uppercase mb-2">{t('dashboard:gap.bridging_strategy')}</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {gap.strategy}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-center pt-6">
                        <button onClick={() => setReport(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
                            {t('dashboard:gap.start_new')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
