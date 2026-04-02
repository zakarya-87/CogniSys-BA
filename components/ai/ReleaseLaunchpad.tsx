
import React, { useState, useEffect } from 'react';
import { TInitiative, TReleaseChecklistItem, TReadinessAssessment, InitiativeStatus, TBacklogItem } from '../../types';
import { generateReleaseChecklist, analyzeLaunchReadiness } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ReleaseLaunchpadProps {
    initiative: TInitiative;
    backlogItems: TBacklogItem[]; // Passed to count bugs/status
    onUpdateStatus: (id: string, status: InitiativeStatus) => void;
}

const RocketLaunchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>;
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;

export const ReleaseLaunchpad: React.FC<ReleaseLaunchpadProps> = ({ initiative, backlogItems, onUpdateStatus }) => {
    const [checklist, setChecklist] = useState<TReleaseChecklistItem[]>([]);
    const [assessment, setAssessment] = useState<TReadinessAssessment | null>(null);
    const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        // Initial load of checklist if empty
        if ((checklist || []).length === 0 && initiative.status !== InitiativeStatus.LIVE) {
            handleGenerateChecklist();
        }
    }, [initiative.sector]);

    const handleGenerateChecklist = async () => {
        setIsLoadingChecklist(true);
        try {
            const items = await generateReleaseChecklist(initiative.sector);
            setChecklist(items || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingChecklist(false);
        }
    };

    const toggleItem = (id: string) => {
        setChecklist(prev => (Array.isArray(prev) ? prev : []).map(item => 
            item.id === id ? { ...item, isChecked: !item.isChecked } : item
        ));
        // Invalidate current assessment when data changes
        setAssessment(null); 
    };

    const handleAssess = async () => {
        setIsAnalyzing(true);
        try {
            // Mock bug count for now, or filter backlog items if they have a 'bug' type
            const openBugs = Math.floor(Math.random() * 5); 
            const result = await analyzeLaunchReadiness(checklist || [], openBugs, initiative.sector);
            setAssessment(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleLaunch = () => {
        if (confirm("Are you sure you want to launch this initiative? Status will be updated to LIVE.")) {
            onUpdateStatus(initiative.id, InitiativeStatus.LIVE);
        }
    };

    const getVerdictColor = (verdict: string) => {
        if (verdict === 'GO') return 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20';
        if (verdict === 'NO-GO') return 'text-accent-red bg-accent-red/10 border-accent-red/20';
        return 'text-accent-amber bg-accent-amber/10 border-accent-amber/20';
    };

    if (initiative.status === InitiativeStatus.LIVE) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-md text-center p-8">
                <div className="w-24 h-24 bg-accent-emerald/10 dark:bg-accent-emerald/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <RocketLaunchIcon className="h-12 w-12 text-accent-emerald dark:text-accent-emerald/90" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mission Accomplished!</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    This initiative is currently <strong>LIVE</strong>.
                </p>
                <p className="text-sm text-gray-500 mt-4">Monitor performance in the <strong>Solution Evaluation</strong> module.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <RocketLaunchIcon className="h-6 w-6 text-accent-purple" />
                        Release Launchpad
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Transition management and Go/No-Go decision gate.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleGenerateChecklist} disabled={isLoadingChecklist}>
                        {isLoadingChecklist ? <Spinner /> : 'Refresh Checklist'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Checklist */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-between">
                        <span>Readiness Checklist</span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                            {(Array.isArray(checklist) ? checklist : []).filter(c => c.isChecked).length}/{(Array.isArray(checklist) ? checklist : []).length} Completed
                        </span>
                    </h3>
                    
                    {(Array.isArray(checklist) ? checklist : []).length === 0 && !isLoadingChecklist && <p className="text-sm text-gray-500 italic">No items generated yet.</p>}

                    <div className="space-y-3">
                        {(Array.isArray(checklist) ? checklist : []).map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => toggleItem(item.id)}
                                className={`flex items-start p-3 rounded-md cursor-pointer border transition-all ${
                                    item.isChecked 
                                        ? 'bg-accent-emerald/5 border-accent-emerald/20 dark:bg-accent-emerald/10 dark:border-accent-emerald/30' 
                                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-600 hover:shadow-sm'
                                }`}
                            >
                                <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center mt-0.5 mr-3 ${
                                    item.isChecked ? 'bg-accent-emerald border-accent-emerald text-white' : 'border-gray-400 bg-white dark:bg-gray-700'
                                }`}>
                                    {item.isChecked && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${item.isChecked ? 'text-accent-emerald dark:text-accent-emerald/90' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {item.item}
                                    </p>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">{item.category}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Assessment & Launch */}
                <div className="flex flex-col">
                    {!assessment ? (
                        <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 mb-4">
                            <ShieldCheckIcon className="h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 text-center mb-4 text-sm">
                                Complete the checklist and assess readiness to unlock the launch button.
                            </p>
                            <Button onClick={handleAssess} disabled={isAnalyzing || (checklist || []).length === 0}>
                                {isAnalyzing ? <Spinner /> : 'Analyze Launch Readiness'}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-4 animate-fade-in-down">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-center">
                                    <div className="text-sm text-gray-500 uppercase font-bold">Confidence Score</div>
                                    <div className={`text-4xl font-black ${assessment.score > 80 ? 'text-accent-emerald' : assessment.score > 50 ? 'text-accent-amber' : 'text-accent-red'}`}>
                                        {assessment.score}/100
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-lg border-2 text-xl font-bold ${getVerdictColor(assessment.verdict)}`}>
                                    {assessment.verdict}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">AI Summary</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{assessment.summary}</p>
                            </div>

                            {(assessment.blockers || []).length > 0 && (
                                <div className="bg-accent-red/5 dark:bg-accent-red/10 p-3 rounded-md border border-accent-red/10 dark:border-accent-red/20 mb-4">
                                    <h5 className="text-xs font-bold text-accent-red dark:text-accent-red/90 uppercase mb-1 flex items-center">
                                        <ExclamationTriangleIcon className="h-4 w-4 mr-1"/> Critical Blockers
                                    </h5>
                                    <ul className="list-disc list-inside text-xs text-accent-red dark:text-accent-red/90">
                                        {(assessment.blockers || []).map((b, i) => <li key={i}>{b}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={handleAssess} disabled={isAnalyzing} className="flex-1 bg-gray-500 hover:bg-gray-600">
                                    Re-Assess
                                </Button>
                                <button 
                                    onClick={handleLaunch}
                                    disabled={assessment.verdict === 'NO-GO'}
                                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md font-bold text-white shadow-lg transition-all ${
                                        assessment.verdict === 'NO-GO' 
                                            ? 'bg-gray-300 cursor-not-allowed' 
                                            : assessment.verdict === 'CAUTION'
                                                ? 'bg-accent-amber hover:bg-accent-amber/90'
                                                : 'bg-accent-emerald hover:bg-accent-emerald/90'
                                    }`}
                                >
                                    <RocketLaunchIcon className="h-5 w-5 mr-2" />
                                    LAUNCH INITIATIVE
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
