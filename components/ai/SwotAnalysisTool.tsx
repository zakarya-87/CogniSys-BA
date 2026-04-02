
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, TSwotAnalysis, TArtifact } from '../../types';
import { generateSwotAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface SwotAnalysisToolProps {
    initiative?: TInitiative;
    onSaveArtifact?: (artifact: TArtifact) => void;
}

const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MinusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ArrowUpCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
const DocumentArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;


export const SwotAnalysisTool: React.FC<SwotAnalysisToolProps> = ({ initiative, onSaveArtifact }) => {
    const { t, i18n } = useTranslation(['dashboard']);
    const currentLanguage = i18n.language;
    const [context, setContext] = useState(
        initiative 
            ? (currentLanguage === 'ar' 
                ? `بالنسبة لمبادرتنا: "${initiative.title}". شركتنا هي شركة صغيرة ومتوسطة مرنة في قطاع التكنولوجيا، تهدف إلى زيادة حصتها في السوق.`
                : `For our initiative: "${initiative.title}". Our company is an agile SME in the tech sector, aiming to increase market share.`)
            : ''
    );
    const [swot, setSwot] = useState<TSwotAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!context) return;
        setIsLoading(true);
        setError(null);
        setSwot(null);
        try {
            const result = await generateSwotAnalysis(context, initiative?.sector, currentLanguage);
            setSwot(result);
        } catch (err) {
            setError(t('common:errors.failedToGenerate', 'Failed to generate SWOT analysis. Please try again.'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [context, initiative?.sector, currentLanguage, t]);
    
    const handleSave = () => {
        if (swot && onSaveArtifact) {
            onSaveArtifact(swot);
        }
    };

    const SwotQuadrant: React.FC<{ title: string; items: string[]; className: string; icon: React.ReactNode }> = ({ title, items, className, icon }) => (
        <div className={`p-4 rounded-lg ${className}`}>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">{icon}{title}</h3>
            <ul className="list-disc list-inside space-y-2">
                {(items || []).map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard:tools.swot.title')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{t('dashboard:tools.swot.description')}</p>
            </div>
            
            <div className="space-y-2">
                <label htmlFor="swot-context" className="block text-sm font-medium">{t('dashboard:tools.swot.contextLabel')}</label>
                <textarea
                    id="swot-context"
                    rows={4}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder={t('dashboard:tools.swot.placeholder')}
                />
            </div>
            
            <div className="flex items-center gap-4">
                 <Button onClick={handleGenerate} disabled={isLoading || !context}>
                    {isLoading ? <Spinner /> : t('dashboard:tools.swot.generate')}
                </Button>
                 {swot && onSaveArtifact && (
                    <Button onClick={handleSave} className="bg-accent-emerald hover:bg-accent-emerald/90 focus:ring-accent-emerald">
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        {t('dashboard:tools.swot.save')}
                    </Button>
                )}
            </div>

            {error && <p className="text-accent-red">{error}</p>}
            
            {swot && (
                <div className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900 dark:text-white">
                        <SwotQuadrant title={t('dashboard:strategy.swot.strengths')} items={swot.strengths} className="bg-accent-emerald/10 dark:bg-accent-emerald/20" icon={<PlusCircleIcon className="h-6 w-6 text-accent-emerald" />} />
                        <SwotQuadrant title={t('dashboard:strategy.swot.weaknesses')} items={swot.weaknesses} className="bg-accent-red/10 dark:bg-accent-red/20" icon={<MinusCircleIcon className="h-6 w-6 text-accent-red" />} />
                        <SwotQuadrant title={t('dashboard:strategy.swot.opportunities')} items={swot.opportunities} className="bg-accent-purple/10 dark:bg-accent-purple/20" icon={<ArrowUpCircleIcon className="h-6 w-6 text-accent-purple" />} />
                        <SwotQuadrant title={t('dashboard:strategy.swot.threats')} items={swot.threats} className="bg-accent-amber/10 dark:bg-accent-amber/20" icon={<ExclamationTriangleIcon className="h-6 w-6 text-accent-amber" />} />
                    </div>
                </div>
            )}
        </div>
    );
};
