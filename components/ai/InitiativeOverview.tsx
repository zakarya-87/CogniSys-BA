
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative, TDailyBriefing } from '../../types';
import { generateDailyBriefing, generatePhaseAdvice } from '../../services/geminiService';
import { Spinner } from '../ui/Spinner';
import { Brain, ClipboardList, Rocket, ChevronRight, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useUI } from '../../context/UIContext';

interface InitiativeOverviewProps {
    initiative: TInitiative;
    onNavigate?: (tab: string) => void;
}

const BoltIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
const ClipboardDocumentCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" /></svg>;
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;

export const InitiativeOverview: React.FC<InitiativeOverviewProps> = ({ initiative, onNavigate }) => {
    const { t, i18n } = useTranslation(['common', 'dashboard']);
    const { isFocusModeActive } = useUI();
    const currentLanguage = i18n.language;
    const [briefing, setBriefing] = useState<TDailyBriefing | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activePhase, setActivePhase] = useState<'THINK' | 'PLAN' | 'ACT'>('THINK');
    const [phaseAdvice, setPhaseAdvice] = useState<string | null>(null);
    const [isAdviceLoading, setIsAdviceLoading] = useState(false);

    const calculatePhaseProgress = () => {
        const artifacts = initiative.artifacts || {};
        
        // THINK: Elicitation, Requirements, Analysis & Design
        const thinkKeys = [
            'elicitation', 'requirements', 'personas', 'sipoc', 'conceptModel', 
            'glossary', 'useCaseDiagram', 'storyMap', 'observationPlan', 
            'c4Model', 'dfdModel', 'conflictAnalysis', 'focusGroupResult', 
            'documentAnalysis', 'stateModel', 'prioritization', 'businessRules'
        ];
        const thinkCount = thinkKeys.filter(k => artifacts[k]).length;
        const thinkProgress = Math.min(100, (thinkCount / (thinkKeys.length * 0.6)) * 100); // 60% of modules is considered "complete" for the phase

        // PLAN: Strategy & Planning, Documentation & Governance
        const planKeys = [
            'strategy', 'roadmap', 'cba', 'pestleAnalysis', 'risks', 
            'capabilityMap', 'stakeholderRegistry', 'apiSpec', 'workshopPlan', 
            'competitorAnalysis', 'presentationDeck', 'traceabilityGraph', 
            'vendorAssessment', 'nfrs', 'survey', 'accessControlMatrix', 
            'issues', 'scopeStatement', 'analysisPlan', 'apmAnalysis', 
            'gapAnalysis', 'visionVideo', 'bpmnFlow'
        ];
        const planCount = planKeys.filter(k => artifacts[k]).length;
        const planProgress = Math.min(100, (planCount / (planKeys.length * 0.5)) * 100);

        // ACT: Execution & Delivery, Evaluation & Improve
        const backlog = artifacts.backlog || [];
        const completedBacklog = backlog.filter((i: any) => i.status === 'Done').length;
        const backlogProgress = backlog.length > 0 ? (completedBacklog / backlog.length) * 100 : 0;
        
        const actKeys = [
            'uat', 'releaseNotes', 'evaluation', 'benefitsRealization', 
            'rootCauseAnalysis', 'feedbackAnalysis', 'performanceAnalysis', 
            'retrospective', 'knowledgeBase'
        ];
        const actCount = actKeys.filter(k => artifacts[k]).length;
        const actArtifactProgress = Math.min(100, (actCount / (actKeys.length * 0.5)) * 100);
        
        const actProgress = (backlogProgress * 0.7) + (actArtifactProgress * 0.3);

        return {
            THINK: Math.round(thinkProgress),
            PLAN: Math.round(planProgress),
            ACT: Math.round(actProgress)
        };
    };

    const phaseProgress = calculatePhaseProgress();

    const fetchBriefing = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateDailyBriefing(initiative.title, initiative.sector, currentLanguage);
            setBriefing(result);
        } catch (error: any) {
            console.error("Failed to load briefing", error);
            setError(error.message || "Failed to load briefing");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPhaseAdvice = async (phase: string) => {
        setIsAdviceLoading(true);
        try {
            const advice = await generatePhaseAdvice(initiative, phase, currentLanguage);
            setPhaseAdvice(advice);
        } catch (error) {
            console.error("Failed to load phase advice", error);
        } finally {
            setIsAdviceLoading(false);
        }
    };

    useEffect(() => {
        fetchBriefing();
        // Determine active phase based on progress
        if (phaseProgress.THINK < 100) setActivePhase('THINK');
        else if (phaseProgress.PLAN < 100) setActivePhase('PLAN');
        else setActivePhase('ACT');
    }, [initiative.id]);

    useEffect(() => {
        fetchPhaseAdvice(activePhase);
    }, [activePhase, initiative.id]);

    const getSentimentColor = (s: string) => {
        if (s === 'Positive') return 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20';
        if (s === 'Negative') return 'bg-accent-red/10 text-accent-red border-accent-red/20';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="space-y-6">
            {/* Hero Section - Hidden in Focus Mode */}
            {!isFocusModeActive && (
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <BoltIcon className="h-40 w-40" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{initiative.sector}</span>
                            <span className="bg-accent-cyan/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent-cyan/50">{initiative.status}</span>
                        </div>
                        <h1 className="text-4xl font-extrabold mb-4">{initiative.title}</h1>
                        <p className="text-lg text-gray-300 max-w-2xl font-light leading-relaxed">{initiative.description}</p>
                        
                        <div className="flex items-center mt-6 gap-4">
                            {onNavigate && (
                                <button 
                                    onClick={() => onNavigate('Strategy')}
                                    className="bg-accent-purple hover:bg-accent-purple-dark text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-accent-purple/30 group"
                                >
                                    <Rocket className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                                    {t('dashboard:strategy.generate')}
                                </button>
                            )}
                            <div className="flex items-center gap-4">
                                <img src={initiative.owner.avatarUrl} alt={initiative.owner.name} className="w-10 h-10 rounded-full border-2 border-white/30" />
                                <div>
                                    <p className="text-sm font-bold">{initiative.owner.name}</p>
                                    <p className="text-xs opacity-70">Initiative Lead</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Think-Plan-Act Progress Tracker - Hidden in Focus Mode */}
            {!isFocusModeActive && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { name: 'THINK', progress: phaseProgress.THINK, icon: <Brain className="w-5 h-5" />, color: 'bg-accent-cyan', bgColor: 'bg-surface-dark dark:bg-surface-darker', textColor: 'text-accent-cyan dark:text-accent-cyan' },
                        { name: 'PLAN', progress: phaseProgress.PLAN, icon: <ClipboardList className="w-5 h-5" />, color: 'bg-accent-amber', bgColor: 'bg-accent-amber/10 dark:bg-accent-amber/20', textColor: 'text-accent-amber dark:text-accent-amber' },
                        { name: 'ACT', progress: phaseProgress.ACT, icon: <Rocket className="w-5 h-5" />, color: 'bg-accent-emerald', bgColor: 'bg-accent-emerald/10 dark:bg-accent-emerald/20', textColor: 'text-accent-emerald dark:text-accent-emerald' }
                    ].map(phase => (
                        <button 
                            key={phase.name} 
                            onClick={() => setActivePhase(phase.name as any)}
                            className={`bg-white dark:bg-gray-800 rounded-xl p-5 border transition-all text-left ${activePhase === phase.name ? 'ring-2 ring-accent-cyan border-transparent shadow-md' : 'border-gray-200 dark:border-gray-700 shadow-sm hover:border-gray-300'}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-lg ${phase.bgColor} ${phase.textColor}`}>
                                    {phase.icon}
                                </div>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">{phase.progress}%</span>
                            </div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{phase.name} Phase</h4>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div className={`${phase.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${phase.progress}%` }}></div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* AI Briefing & Phase Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Briefing */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-accent-cyan rounded-full"></span>
                            {t('dashboard:initiative.dailyBriefing')}
                        </h2>
                        
                        {isLoading ? (
                            <div className="flex justify-center py-10"><Spinner /></div>
                        ) : error ? (
                            <div className="text-center py-10">
                                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                                <button onClick={fetchBriefing} className="bg-accent-purple hover:bg-accent-purple-dark text-white px-4 py-2 rounded-md">{t('dashboard:initiative.retry')}</button>
                            </div>
                        ) : briefing ? (
                            <div className="animate-fade-in-down">
                                <div className={`mb-6 p-4 rounded-lg border ${getSentimentColor(briefing.sentiment)} flex items-center justify-between`}>
                                    <span className="font-semibold">{t('dashboard:initiative.projectSentiment')}</span>
                                    <span className="font-black uppercase tracking-wider">{briefing.sentiment}</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6 font-serif">
                                    {briefing.summary}
                                </p>
                                
                                <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">{t('dashboard:initiative.criticalRisks')}</h3>
                                <ul className="space-y-3">
                                    {(briefing.risks || []).map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-accent-red/5 dark:bg-accent-red/10 p-3 rounded-md border border-accent-red/10">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-accent-red flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-800 dark:text-gray-200">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>

                    {/* Strategic Phase Advice */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Lightbulb className="h-6 w-6 text-accent-amber" />
                            {t('dashboard:initiative.strategicAdvice', { phase: activePhase })}
                        </h2>
                        {isAdviceLoading ? (
                            <div className="flex justify-center py-6"><Spinner /></div>
                        ) : phaseAdvice ? (
                            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                                <ReactMarkdown>{phaseAdvice}</ReactMarkdown>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">{t('dashboard:initiative.selectPhase')}</p>
                        )}
                    </div>
                </div>

                {/* KPI / Widgets - Hidden in Focus Mode */}
                {!isFocusModeActive && (
                    <div className="space-y-6">
                        {/* Progress */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                                {t('dashboard:initiative.roadmapVelocity')}
                            </h3>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-black text-gray-900 dark:text-white">68%</span>
                                <span className="text-sm text-gray-500 mb-1">{t('dashboard:initiative.completion')}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-accent-purple h-2 rounded-full" style={{ width: '68%' }}></div>
                            </div>
                        </div>

                        {/* Pending Approvals */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400" />
                                {t('dashboard:initiative.pendingDecisions')}
                            </h3>
                            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard:initiative.changeRequests')}</span>
                                <span className="font-bold bg-accent-amber/10 text-accent-amber px-2 py-0.5 rounded text-sm border border-accent-amber/20">2 {t('dashboard:initiative.pending')}</span>
                            </div>
                        </div>

                        {/* Business Rules */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-icons-round text-gray-400">gavel</span>
                                {t('dashboard:initiative.businessRules')}
                            </h3>
                            {initiative.artifacts?.businessRules?.length > 0 ? (
                                <ul className="space-y-2">
                                    {initiative.artifacts.businessRules.map((rule: any, i: number) => (
                                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                                            {rule.rule}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">{t('dashboard:initiative.noBusinessRules')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
