
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, TOCMPlan, Sector } from '../../types';
import { generateOCMPlan } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface OCMHubProps {
    initiative: TInitiative;
}

const MegaphoneIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.439.875.971 1.114 1.566.294.738.294 1.555 0 2.294a3.495 3.495 0 01-1.114 1.566" /></svg>;
const AcademicCapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.216 50.552 50.552 0 00-2.658.813m-15.482 0A50.553 50.553 0 0112 13.489a50.551 50.551 0 016.482-1.206 48.663 48.663 0 00-.966 2.747c-.001.033-.004.067-.01.1a.233.233 0 01-.01.052v.002a.076.076 0 01-.003.007 6.14 6.14 0 00-4.518 4.198.75.75 0 001.452.386 4.632 4.632 0 013.42-3.168c.693-.157 1.415-.058 2.056.237.67.308 1.156 1.001 1.156 1.78V21a.75.75 0 001.5 0v-3.21a2.25 2.25 0 00-1.156-1.988 2.267 2.267 0 00-2.056-.264 4.65 4.65 0 01-.57.192 48.57 48.57 0 00-.936-2.722" /></svg>;
const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;

export const OCMHub: React.FC<OCMHubProps> = ({ initiative }) => {
    const { t, i18n } = useTranslation(['common', 'dashboard']);
    const currentLanguage = i18n.language;
    const [plan, setPlan] = useState<TOCMPlan | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            // Context Chaining
            let context = '';
            if (initiative.artifacts?.stakeholderRegistry) {
                const stakeholders = (initiative.artifacts.stakeholderRegistry || []).map((s: any) => s.role).join(', ');
                context += `\nTarget Audience derived from Stakeholder Registry: ${stakeholders}.`;
            }

            const result = await generateOCMPlan(initiative.title, initiative.sector as Sector, context, currentLanguage);
            setPlan(result);
        } catch (error) {
            console.error(error);
            setError(t('dashboard:ocm.error_generate'));
        } finally {
            setIsLoading(false);
        }
    };

    const phaseColors = {
        'Pre-Launch': 'bg-accent-amber/10 border-accent-amber/20 text-accent-amber',
        'Launch': 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald',
        'Post-Launch': 'bg-accent-purple/10 border-accent-purple/20 text-accent-purple'
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
                        <MegaphoneIcon className="h-7 w-7 text-accent-purple" />
                        {t('dashboard:ocm.title')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('dashboard:ocm.description')}
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : t('dashboard:ocm.generate')}
                </Button>
            </div>

            {!plan ? (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <UserGroupIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        {t('dashboard:ocm.placeholder')}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8 animate-fade-in-down">
                    {/* Communications Timeline */}
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <MegaphoneIcon className="h-5 w-5 text-accent-purple"/> {t('dashboard:ocm.comm_plan')}
                        </h3>
                        <div className="space-y-4 relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 ml-3">
                            {(plan.communications || []).map((comm, i) => (
                                <div key={comm.id} className="relative mb-6 last:mb-0">
                                    <div className={`absolute -left-[31px] top-2 w-4 h-4 rounded-full border-2 bg-white dark:bg-gray-800 ${
                                        comm.phase === 'Pre-Launch' ? 'border-accent-amber' : comm.phase === 'Launch' ? 'border-accent-emerald' : 'border-accent-purple'
                                    }`}></div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${phaseColors[comm.phase]}`}>
                                                {comm.phase}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{comm.date}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{comm.channel} to {comm.audience}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{comm.message}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Training & Strategy */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        {/* Training */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <AcademicCapIcon className="h-5 w-5 text-accent-emerald"/> {t('dashboard:ocm.training_curriculum')}
                            </h3>
                            <div className="space-y-3">
                                {(plan.training || []).map(mod => (
                                    <div key={mod.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border-l-4 border-accent-emerald shadow-sm">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{mod.title}</h4>
                                        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{mod.format}</span>
                                            <span>{mod.duration}</span>
                                        </div>
                                        <div className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block">
                                            {t('dashboard:ocm.target')}: {mod.targetAudience}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resistance Strategy */}
                        <div className="bg-accent-amber/5 dark:bg-accent-amber/10 p-4 rounded-lg border border-accent-amber/10 dark:border-accent-amber/20">
                            <h3 className="text-sm font-bold text-accent-amber dark:text-accent-amber/80 mb-2 uppercase tracking-wide">
                                {t('dashboard:ocm.resistance_strategy')}
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {plan.resistanceStrategy}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
