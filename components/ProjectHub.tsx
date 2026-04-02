
import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { TInitiative, TWorkBreakdown, InitiativeStatus, TProjectVitalsAdvanced, Sector } from '../types';
import { generateWbs, analyzeCriticalPath, generateOptimizationAdvice } from '../services/geminiService';
import { MOCK_BACKLOG } from '../constants';
import { useCatalyst } from '../context/CatalystContext';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { 
    Sparkles, 
    Lightbulb, 
    Zap, 
    TrendingUp, 
    LayoutGrid, 
    Clock, 
    Flame, 
    BarChart3, 
    Download,
    CheckCircle2
} from 'lucide-react';

const SmartGanttChart: React.FC<{ data: TProjectVitalsAdvanced, onUpdateTask?: (taskId: string, start: number, duration: number) => void }> = ({ data, onUpdateTask }) => {
    const { t } = useTranslation(['projectHub']);
    const dayWidth = 40;
    const rowHeight = 40;
    const headerHeight = 30;
    
    // Defensive check: Ensure data exists and tasks is a valid array.
    const tasks = Array.isArray(data?.tasks) ? data.tasks : [];

    // Sort tasks by start time using slice to avoid mutating original array
    const sortedTasks = tasks.slice().sort((a, b) => (a.start || 0) - (b.start || 0));
    const maxDays = tasks.length > 0 ? Math.max(...sortedTasks.map(t => (t.start || 0) + (t.duration || 1))) + 2 : 10;

    const [draggingTask, setDraggingTask] = useState<{ id: string, type: 'move' | 'resize', startX: number, initialStart: number, initialDuration: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, taskId: string, type: 'move' | 'resize', start: number, duration: number) => {
        e.stopPropagation();
        setDraggingTask({
            id: taskId,
            type,
            startX: e.clientX,
            initialStart: start,
            initialDuration: duration
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingTask || !onUpdateTask) return;

            const deltaX = e.clientX - draggingTask.startX;
            const deltaDays = Math.round(deltaX / dayWidth);

            if (draggingTask.type === 'move') {
                const newStart = Math.max(0, draggingTask.initialStart + deltaDays);
                onUpdateTask(draggingTask.id, newStart, draggingTask.initialDuration);
            } else if (draggingTask.type === 'resize') {
                const newDuration = Math.max(1, draggingTask.initialDuration + deltaDays);
                onUpdateTask(draggingTask.id, draggingTask.initialStart, newDuration);
            }
        };

        const handleMouseUp = () => {
            setDraggingTask(null);
        };

        if (draggingTask) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingTask, onUpdateTask, dayWidth]);

    return (
        <div className="overflow-x-auto bg-surface-light dark:bg-surface-darker border border-gray-200 dark:border-border-dark rounded-lg select-none custom-scrollbar">
            <div className="relative" style={{ width: `${Math.max(800, maxDays * dayWidth + 200)}px` }}>
                {/* Header Days */}
                <div className="flex border-b border-gray-200 dark:border-border-dark h-[30px]">
                    <div className="w-[200px] border-r border-gray-200 dark:border-border-dark bg-surface-light dark:bg-surface-dark shrink-0 sticky left-0 z-10 flex items-center px-2 text-xs font-bold text-gray-500">
                        {t('projectHub:taskName')}
                    </div>
                    {Array.from({ length: maxDays }).map((_, i) => (
                        <div key={i} className="w-[40px] border-r border-gray-100 dark:border-border-dark text-center text-[10px] text-gray-400 leading-[30px]">
                            D{i+1}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {sortedTasks.length === 0 ? (
                     <div className="p-4 text-sm text-gray-500">{t('projectHub:noTasks')}</div>
                ) : sortedTasks.map((task) => {
                    const isDone = task.status === 'done' || task.progress === 100;
                    const progress = task.progress || (isDone ? 100 : 0);
                    
                    return (
                    <div key={task.id} className={`flex border-b border-gray-100 dark:border-border-dark h-[40px] hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isDone ? 'opacity-70' : ''}`}>
                        {/* Task Label */}
                        <div className="w-[200px] border-r border-gray-200 dark:border-border-dark bg-surface-light dark:bg-surface-darker shrink-0 sticky left-0 z-10 flex items-center px-2 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-accent-emerald mr-1" />
                            ) : task.isCritical ? (
                                <span title="Critical Path"><Flame className="h-3 w-3 text-accent-red mr-1" /></span>
                            ) : null}
                            <span className={isDone ? 'line-through text-gray-400' : ''}>{task.name}</span>
                        </div>
                        
                        {/* Gantt Bar Area */}
                        <div className="relative flex-grow">
                            {/* Grid Lines */}
                            {Array.from({ length: maxDays }).map((_, d) => (
                                <div key={d} className="absolute top-0 bottom-0 border-r border-gray-100 dark:border-border-dark pointer-events-none" style={{ left: `${(d+1) * dayWidth}px` }}></div>
                            ))}
                            
                            {/* The Bar */}
                            <div 
                                className={`absolute top-[8px] h-[24px] rounded-full shadow-sm text-[10px] flex items-center px-2 text-white overflow-hidden whitespace-nowrap transition-colors hover:opacity-90 cursor-move ${
                                    isDone
                                        ? 'bg-accent-emerald'
                                        : task.isCritical 
                                            ? 'bg-accent-red ring-2 ring-accent-red/30' 
                                            : 'bg-accent-purple'
                                }`}
                                style={{ 
                                    left: `${(task.start || 0) * dayWidth}px`, 
                                    width: `${(task.duration || 1) * dayWidth}px` 
                                }}
                                title={`${task.name}: ${task.duration} days (${task.assignee}) - ${progress}%`}
                                onMouseDown={(e) => handleMouseDown(e, task.id, 'move', task.start || 0, task.duration || 1)}
                            >
                                {/* Progress Fill */}
                                {progress > 0 && (
                                    <div 
                                        className="absolute left-0 top-0 bottom-0 bg-black/20 pointer-events-none"
                                        style={{ width: `${progress}%` }}
                                    />
                                )}
                                
                                <span className="truncate pointer-events-none relative z-10">{task.assignee} {progress > 0 && `(${progress}%)`}</span>
                                
                                {/* Resize Handle */}
                                <div 
                                    className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-black/20 rounded-r-full z-20"
                                    onMouseDown={(e) => handleMouseDown(e, task.id, 'resize', task.start || 0, task.duration || 1)}
                                />
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
};

const ResourceHeatmap: React.FC<{ resources: TProjectVitalsAdvanced['resources'], tasks: TProjectVitalsAdvanced['tasks'] }> = ({ resources, tasks }) => {
    const { t } = useTranslation(['projectHub']);
    const safeResources = Array.isArray(resources) ? resources : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    
    if (safeResources.length === 0) {
        return <div className="text-gray-500 text-sm">{t('projectHub:noResourceData')}</div>;
    }

    const maxDays = safeTasks.length > 0 ? Math.max(...safeTasks.map(t => (t.start || 0) + (t.duration || 1))) + 2 : 10;
    
    // Calculate daily workload per assignee
    const workload: Record<string, number[]> = {};
    safeResources.forEach(res => {
        workload[res.assignee] = Array(maxDays).fill(0);
    });

    safeTasks.forEach(task => {
        if (task.assignee && workload[task.assignee]) {
            const start = task.start || 0;
            const duration = task.duration || 1;
            for (let i = start; i < start + duration; i++) {
                if (i < maxDays) {
                    workload[task.assignee][i] += 1;
                }
            }
        }
    });

    const getHeatmapColor = (tasksCount: number) => {
        if (tasksCount === 0) return 'bg-gray-100 dark:bg-surface-dark';
        if (tasksCount === 1) return 'bg-accent-emerald/20 text-accent-emerald';
        if (tasksCount === 2) return 'bg-accent-amber/20 text-accent-amber';
        return 'bg-accent-red text-white';
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {safeResources.map(res => {
                    let color = 'bg-accent-emerald';
                    if (res.utilization > 100) color = 'bg-accent-red';
                    else if (res.utilization > 80) color = 'bg-accent-amber';

                    return (
                        <div key={res.assignee} className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-border-dark">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{res.assignee}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${color}`}>
                                    {res.utilization}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(res.utilization, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{res.tasks} {t('projectHub:activeTasks')}</p>
                        </div>
                    );
                })}
            </div>

            <div className="bg-surface-light dark:bg-surface-darker border border-gray-200 dark:border-border-dark rounded-lg overflow-x-auto custom-scrollbar">
                <div className="min-w-max">
                    <div className="flex border-b border-gray-200 dark:border-border-dark">
                        <div className="w-48 p-3 font-bold text-sm text-gray-700 dark:text-gray-300 bg-surface-light dark:bg-surface-dark sticky left-0 z-10 border-r border-gray-200 dark:border-border-dark">
                            {t('projectHub:teamMember')}
                        </div>
                        {Array.from({ length: maxDays }).map((_, i) => (
                            <div key={i} className="w-10 p-2 text-center text-xs font-medium text-gray-500 border-r border-gray-100 dark:border-border-dark">
                                D{i + 1}
                            </div>
                        ))}
                    </div>
                    {safeResources.map(res => (
                        <div key={res.assignee} className="flex border-b border-gray-100 dark:border-border-dark last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="w-48 p-3 text-sm font-medium text-gray-900 dark:text-gray-100 bg-surface-light dark:bg-surface-darker sticky left-0 z-10 border-r border-gray-200 dark:border-border-dark flex items-center">
                                {res.assignee}
                            </div>
                            {workload[res.assignee].map((count, i) => (
                                <div key={i} className="w-10 p-1 border-r border-gray-100 dark:border-border-dark">
                                    <div className={`w-full h-full min-h-[28px] rounded flex items-center justify-center text-xs font-bold transition-colors ${getHeatmapColor(count)}`} title={`${count} tasks on Day ${i + 1}`}>
                                        {count > 0 ? count : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-bold">{t('projectHub:legend')}</span>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-100 dark:bg-surface-dark"></div> {t('projectHub:zeroTasks')}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-accent-emerald/20"></div> {t('projectHub:oneTaskOptimal')}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-accent-amber/20"></div> {t('projectHub:twoTasksHeavy')}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-accent-red"></div> {t('projectHub:threePlusTasksOverallocated')}</div>
            </div>
        </div>
    );
};

interface ProjectHubProps {
    initiatives: TInitiative[];
    onSaveWbs: (initiativeId: string, wbs: TWorkBreakdown) => void;
    initialSelectedInitiativeId: string | null;
}

export const ProjectHub: React.FC<ProjectHubProps> = ({ initiatives, onSaveWbs, initialSelectedInitiativeId }) => {
    const { t } = useTranslation(['projectHub']);
    const { setToastMessage } = useCatalyst();
    const [selectedInitiative, setSelectedInitiative] = useState<TInitiative | null>(null);
    const [wbs, setWbs] = useState<TWorkBreakdown | null>(null);
    const [advancedVitals, setAdvancedVitals] = useState<TProjectVitalsAdvanced | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationAdvice, setOptimizationAdvice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'Schedule' | 'Resources'>('Schedule');

    useEffect(() => {
        if (initialSelectedInitiativeId) {
            const init = (initiatives || []).find(i => i.id === initialSelectedInitiativeId);
            if (init) {
                setSelectedInitiative(init);
                if (init.wbs) {
                    setWbs(init.wbs);
                    handleAdvancedAnalysis(init, init.wbs);
                }
            }
        }
    }, [initialSelectedInitiativeId, initiatives]);

    const handleSelectInitiative = (id: string) => {
        const initiative = (initiatives || []).find(i => i.id === id);
        if (initiative) {
            setSelectedInitiative(initiative);
            setWbs(initiative.wbs || null);
            setAdvancedVitals(null);
            setError(null);
            if (initiative.wbs) {
                handleAdvancedAnalysis(initiative, initiative.wbs);
            }
        }
    };

    const handleGenerateWbs = async () => {
        if (!selectedInitiative) return;
        setIsLoading(true);
        setError(null);
        setOptimizationAdvice(null);
        try {
            // Use initiative's backlog if available, otherwise fallback to mock
            const backlogToUse = selectedInitiative.artifacts?.backlog || MOCK_BACKLOG;
            const result = await generateWbs(selectedInitiative, backlogToUse);
            setWbs(result);
            await handleAdvancedAnalysis(selectedInitiative, result);
        } catch (err) {
            setError(t('projectHub:failedGenerateWbs'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdvancedAnalysis = async (init: TInitiative, wbsData: TWorkBreakdown) => {
        setIsLoading(true);
        try {
            const context = JSON.stringify(wbsData);
            const result = await analyzeCriticalPath(context, init.sector);
            setAdvancedVitals(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (selectedInitiative && wbs) {
            onSaveWbs(selectedInitiative.id, wbs);
        }
    };

    // Group approved initiatives
    const groupedInitiatives = useMemo(() => {
        const approved = (initiatives || []).filter(i => 
            i.status === InitiativeStatus.IN_DEVELOPMENT || 
            i.status === InitiativeStatus.LIVE || 
            i.status === InitiativeStatus.AWAITING_APPROVAL
        );
        const groups: Record<string, TInitiative[]> = {};
        approved.forEach(init => {
            if (!groups[init.sector]) groups[init.sector] = [];
            groups[init.sector].push(init);
        });
        return groups;
    }, [initiatives]);

    const handleUpdateTask = (taskId: string, start: number, duration: number) => {
        if (!advancedVitals) return;
        
        const updatedTasks = (Array.isArray(advancedVitals?.tasks) ? advancedVitals.tasks : []).map(t => 
            t.id === taskId ? { ...t, start, duration } : t
        );
        
        setAdvancedVitals({
            ...advancedVitals,
            tasks: updatedTasks
        });
    };

    const handleAutoPrioritize = async () => {
        if (!advancedVitals || !selectedInitiative) return;
        setIsLoading(true);
        setError(null);
        try {
            const { autoPrioritizeTasks } = await import('../services/geminiService');
            const updatedTasks = await autoPrioritizeTasks(Array.isArray(advancedVitals?.tasks) ? advancedVitals.tasks : [], selectedInitiative.title, selectedInitiative.sector);
            
            // Merge updated tasks back into advancedVitals
            const mergedTasks = (Array.isArray(advancedVitals?.tasks) ? advancedVitals.tasks : []).map(t => {
                const updated = updatedTasks.find((ut: any) => ut.id === t.id);
                return updated ? { ...t, ...updated } : t;
            });

            setAdvancedVitals({
                ...advancedVitals,
                tasks: mergedTasks
            });
            
            setToastMessage?.(t('projectHub:scheduleOptimized'));
        } catch (err) {
            setError(t('projectHub:failedAutoPrioritize'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetOptimizationAdvice = async () => {
        if (!advancedVitals || !selectedInitiative) return;
        setIsOptimizing(true);
        try {
            const context = `
                Initiative: ${selectedInitiative.title}
                Critical Path: ${advancedVitals.criticalPathDuration} days
                Risk Analysis: ${advancedVitals.riskAnalysis}
                Tasks: ${advancedVitals.tasks.length}
                Resources: ${advancedVitals.resources.length}
            `;
            const advice = await generateOptimizationAdvice(context, selectedInitiative.sector);
            setOptimizationAdvice(advice);
        } catch (err) {
            console.error(err);
        } finally {
            setIsOptimizing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('projectHub:title')}</h1>
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 sm:mt-0">
                    <select
                        value={selectedInitiative?.id || ''}
                        onChange={(e) => handleSelectInitiative(e.target.value)}
                        className="w-full sm:w-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-surface-light dark:bg-surface-dark focus:ring-2 focus:ring-accent-purple"
                    >
                        <option value="" disabled>{t('projectHub:selectInitiative')}</option>
                        {Object.keys(groupedInitiatives).sort().map(sector => (
                            <optgroup key={sector} label={sector}>
                                {groupedInitiatives[sector].map(init => (
                                    <option key={init.id} value={init.id}>{init.title}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {advancedVitals && selectedInitiative && (
                        <Button onClick={handleAutoPrioritize} disabled={isLoading} variant="outline" className="border-accent-purple/20 text-accent-purple hover:bg-accent-purple/10">
                            <Zap className="h-4 w-4 mr-2"/>
                            {t('projectHub:autoPrioritize')}
                        </Button>
                    )}
                    <Button onClick={handleGenerateWbs} disabled={isLoading || !selectedInitiative} variant="primary">
                        {isLoading ? <Spinner /> : <><LayoutGrid className="h-5 w-5 mr-2"/> {wbs ? t('projectHub:recalculatePlan') : t('projectHub:generatePlan')}</>}
                    </Button>
                    {wbs && selectedInitiative && (
                        <Button onClick={handleSave} variant="primary" className="bg-accent-emerald hover:bg-accent-emerald/80">
                           <Download className="h-5 w-5 mr-2"/>
                            {t('projectHub:save')}
                        </Button>
                    )}
                </div>
            </div>

            {error && <p className="text-red-500">{error}</p>}

            {!selectedInitiative && (
                <div className="flex flex-col items-center justify-center py-20 bg-surface-light dark:bg-surface-dark/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <BarChart3 className="h-16 w-16 text-gray-400 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('projectHub:selectInitiative')}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{t('projectHub:selectInitiativeDesc')}</p>
                </div>
            )}

            {advancedVitals && (
                <div className="space-y-6 animate-fade-in-down">
                    {/* Metrics Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border-l-4 border-accent-red">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('projectHub:criticalPathDuration')}</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{advancedVitals.criticalPathDuration} {t('projectHub:days')}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-accent-red opacity-20" />
                            </div>
                        </div>
                        <div className="md:col-span-2 bg-accent-purple/10 p-6 rounded-lg border border-accent-purple/20 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-accent-purple flex items-center gap-2 mb-2">
                                    <Sparkles className="h-5 w-5 text-accent-purple" /> {t('projectHub:aiRiskAnalysis')}
                                </h3>
                                <p className="text-sm text-accent-purple/80">{advancedVitals.riskAnalysis}</p>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <Sparkles className="h-24 w-24 text-accent-purple" />
                            </div>
                        </div>
                    </div>

                    {/* Optimization Advice Section */}
                    <div className="bg-accent-amber/10 border border-accent-amber/20 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-accent-amber flex items-center gap-2">
                                <Lightbulb className="h-6 w-6 text-accent-amber" /> {t('projectHub:strategicOptimizationAdvice')}
                            </h3>
                            {!optimizationAdvice && (
                                <Button 
                                    onClick={handleGetOptimizationAdvice} 
                                    disabled={isOptimizing} 
                                    variant="outline"
                                    className="border-accent-amber/30 text-accent-amber hover:bg-accent-amber/10"
                                >
                                    {isOptimizing ? <Spinner /> : t('projectHub:getAiAdvice')}
                                </Button>
                            )}
                        </div>
                        
                        {optimizationAdvice ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-accent-amber">
                                <ReactMarkdown>{optimizationAdvice}</ReactMarkdown>
                                <div className="mt-4 flex justify-end">
                                    <Button 
                                        onClick={() => setOptimizationAdvice(null)} 
                                        variant="ghost" 
                                        className="text-accent-amber hover:text-accent-amber/80"
                                    >
                                        {t('projectHub:dismiss')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-accent-amber/70 italic">
                                {t('projectHub:optimizationAdviceDesc')}
                            </p>
                        )}
                    </div>

                    {/* Main Content Tabs */}
                    <div>
                        <div className="toggle-bar-container mb-6">
                            <button
                                onClick={() => setActiveTab('Schedule')}
                                className={`toggle-item ${
                                    activeTab === 'Schedule' 
                                        ? 'toggle-item-active' 
                                        : 'toggle-item-inactive'
                                }`}
                            >
                                {t('projectHub:intelligentSchedule')}
                            </button>
                            <button
                                onClick={() => setActiveTab('Resources')}
                                className={`toggle-item ${
                                    activeTab === 'Resources' 
                                        ? 'toggle-item-active' 
                                        : 'toggle-item-inactive'
                                }`}
                            >
                                {t('projectHub:resourceHeatmap')}
                            </button>
                        </div>

                        {activeTab === 'Schedule' ? (
                            <SmartGanttChart data={advancedVitals} onUpdateTask={handleUpdateTask} />
                        ) : (
                            <ResourceHeatmap resources={Array.isArray(advancedVitals?.resources) ? advancedVitals.resources : []} tasks={Array.isArray(advancedVitals?.tasks) ? advancedVitals.tasks : []} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
