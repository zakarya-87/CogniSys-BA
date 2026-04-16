
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
    CheckCircle2,
    Users,
    GitBranch, // Added for Dependency toggle
    Info
} from 'lucide-react';

const SmartGanttChart: React.FC<{ 
    data: TProjectVitalsAdvanced, 
    onUpdateTask?: (taskId: string, start: number, duration: number) => void 
}> = ({ data, onUpdateTask }) => {
    const { t } = useTranslation(['projectHub']);
    const dayWidth = 48;
    const [draggingTask, setDraggingTask] = useState<{ 
        id: string, 
        type: 'move' | 'resize', 
        startX: number, 
        initialStart: number, 
        initialDuration: number, 
        currentStart: number, 
        currentDuration: number 
    } | null>(null);
    const [showDeps, setShowDeps] = useState(true);
    
    const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
    const sortedTasks = useMemo(() => tasks.slice().sort((a, b) => (a.start || 0) - (b.start || 0)), [tasks]);
    const maxDays = tasks.length > 0 ? Math.max(...tasks.map(t => (t.start || 0) + (t.duration || 1))) + 5 : 15;

    const handleMouseDown = (e: React.MouseEvent, taskId: string, type: 'move' | 'resize', start: number, duration: number) => {
        e.preventDefault();
        setDraggingTask({
            id: taskId,
            type,
            startX: e.clientX,
            initialStart: start,
            initialDuration: duration,
            currentStart: start,
            currentDuration: duration
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingTask) return;
            const deltaX = e.clientX - draggingTask.startX;
            const deltaDays = Math.round(deltaX / dayWidth);

            if (draggingTask.type === 'move') {
                const newStart = Math.max(0, draggingTask.initialStart + deltaDays);
                setDraggingTask(prev => prev ? { ...prev, currentStart: newStart } : null);
            } else if (draggingTask.type === 'resize') {
                const newDuration = Math.max(1, draggingTask.initialDuration + deltaDays);
                setDraggingTask(prev => prev ? { ...prev, currentDuration: newDuration } : null);
            }
        };

        const handleMouseUp = () => {
            if (draggingTask && onUpdateTask) {
                onUpdateTask(draggingTask.id, draggingTask.currentStart, draggingTask.currentDuration);
            }
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

    // Calculate dependency lines
    const dependencyLines = useMemo(() => {
        if (!showDeps || tasks.length === 0) return [];
        const lines: { x1: number, y1: number, x2: number, y2: number, isCritical: boolean }[] = [];
        const taskMap = new Map(tasks.map(t => [t.id, t]));
        
        sortedTasks.forEach((task, idx) => {
            const y1 = idx * 56 + 14 + 14; // Corrected: idx * rowHeight + topMargin + halfBarHeight
            (task.dependencies || []).forEach(depId => {
                const depTask = taskMap.get(depId);
                if (depTask) {
                    const depIdx = sortedTasks.findIndex(t => t.id === depId);
                    if (depIdx !== -1) {
                        const x1 = ((depTask.start || 0) + (depTask.duration || 1)) * dayWidth;
                        const yDep = depIdx * 56 + 14 + 14;
                        const x2 = (task.start || 0) * dayWidth;
                        lines.push({ x1, y1: yDep, x2, y2: y1, isCritical: task.isCritical && depTask.isCritical });
                    }
                }
            });
        });
        return lines;
    }, [showDeps, tasks, sortedTasks, dayWidth]);

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2 px-2">
                <Button 
                    onClick={() => setShowDeps(!showDeps)} 
                    variant="outline" 
                    className={`rounded-xl px-4 py-2 border-white/10 text-[10px] font-black uppercase tracking-widest transition-all ${showDeps ? 'bg-accent-teal/20 text-accent-teal border-accent-teal/30' : 'text-white/40'}`}
                >
                    <GitBranch className="h-3.5 w-3.5 mr-2" />
                    {showDeps ? 'Hide Dependencies' : 'Show Dependencies'}
                </Button>
            </div>

            <div className="glass-surface metallic-sheen rounded-3xl overflow-hidden border border-border-dark shadow-2xl transition-all duration-500">
                <div className="overflow-x-auto custom-scrollbar p-1">
                    <div className="relative min-w-full" style={{ width: `${maxDays * dayWidth + 220}px` }}>
                        {/* Header Days */}
                        <div className="flex bg-white/5 backdrop-blur-md h-12 items-center sticky top-0 z-30 border-b border-border-dark">
                            <div className="w-[220px] shrink-0 sticky left-0 z-40 bg-slate-900/80 backdrop-blur-xl border-r border-border-dark px-6 text-[10px] font-black uppercase tracking-[0.2em] text-accent-teal">
                                {t('projectHub:taskName')}
                            </div>
                            {Array.from({ length: maxDays }).map((_, i) => (
                                <div key={i} className="w-[48px] shrink-0 text-center text-[10px] font-black text-white/30 tracking-tighter border-r border-white/5 last:border-0 uppercase flex items-center justify-center">
                                    D{i+1}
                                </div>
                            ))}
                        </div>

                        {/* Rows Area */}
                        <div className="relative divide-y divide-white/5">
                            {/* Dependency Lines (SVG Overlay) */}
                            <svg 
                                className="absolute inset-0 pointer-events-none z-0" 
                                style={{ 
                                    left: '220px', 
                                    width: `${maxDays * dayWidth}px`, 
                                    height: `${sortedTasks.length * 56}px` 
                                }}
                            >
                                <defs>
                                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orientation="auto">
                                        <polygon points="0 0, 6 2, 0 4" className="fill-white/20" />
                                    </marker>
                                    <marker id="arrowhead-critical" markerWidth="6" markerHeight="4" refX="5" refY="2" orientation="auto">
                                        <polygon points="0 0, 6 2, 0 4" className="fill-accent-red/40" />
                                    </marker>
                                </defs>
                                {dependencyLines.map((line, i) => {
                                    const path = `M ${line.x1} ${line.y1} L ${line.x1 + 10} ${line.y1} L ${line.x1 + 10} ${line.y2} L ${line.x2} ${line.y2}`;
                                    return (
                                        <path 
                                            key={i} 
                                            d={path} 
                                            fill="none" 
                                            className={line.isCritical ? "stroke-accent-red/40" : "stroke-white/20"} 
                                            strokeWidth="1.5" 
                                            markerEnd={line.isCritical ? "url(#arrowhead-critical)" : "url(#arrowhead)"}
                                            strokeDasharray={line.isCritical ? "0" : "4 2"}
                                        />
                                    );
                                })}
                            </svg>

                            {sortedTasks.length === 0 ? (
                                <div className="p-12 text-center text-sm text-text-muted-dark font-light italic">{t('projectHub:noTasks')}</div>
                            ) : sortedTasks.map((task, idx) => {
                                const isDone = task.status === 'done' || task.progress === 100;
                                const isGhosting = draggingTask?.id === task.id;
                                const displayStart = isGhosting ? draggingTask.currentStart : (task.start || 0);
                                const displayDuration = isGhosting ? draggingTask.currentDuration : (task.duration || 1);
                                
                                return (
                                    <div key={task.id} className={`flex h-14 group transition-colors duration-300 ${isDone ? 'opacity-40 grayscale-[0.5]' : 'hover:bg-white/[0.02]'}`}>
                                        {/* Task Label */}
                                        <div className="w-[220px] shrink-0 sticky left-0 z-20 bg-slate-900/80 backdrop-blur-xl border-r border-border-dark flex items-center px-6 text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                                            <div className="flex items-center gap-2 truncate">
                                                {isDone ? (
                                                    <CheckCircle2 className="h-4 w-4 text-accent-emerald flex-shrink-0" />
                                                ) : task.isCritical ? (
                                                    <Flame className="h-4 w-4 text-accent-red animate-pulse flex-shrink-0" />
                                                ) : (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-accent-teal/50 group-hover:bg-accent-teal transition-all" />
                                                )}
                                                <span className={isDone ? 'line-through opacity-50' : ''}>{task.name}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Gantt Bar Area */}
                                        <div className="relative flex-grow">
                                            {/* Grid Lines */}
                                            {Array.from({ length: maxDays }).map((_, d) => (
                                                <div key={d} className="absolute top-0 bottom-0 border-r border-white/5 pointer-events-none" style={{ left: `${(d+1) * dayWidth}px` }} />
                                            ))}
                                            
                                            {/* original position ghost */}
                                            {isGhosting && (
                                                <div 
                                                    className="absolute top-[14px] h-[28px] rounded-xl border-2 border-dashed border-white/20 bg-white/5 pointer-events-none opacity-50 transition-all"
                                                    style={{ 
                                                        left: `${task.start * dayWidth}px`, 
                                                        width: `${task.duration * dayWidth}px` 
                                                    }}
                                                />
                                            )}

                                            {/* The Bar */}
                                            <div 
                                                className={`absolute top-[14px] h-[28px] rounded-xl shadow-2xl flex items-center px-4 transition-all duration-300 group-hover:brightness-110 cursor-grab active:cursor-grabbing select-none z-10 ${
                                                    isGhosting ? 'opacity-90 scale-[1.05] z-50 shadow-[0_20px_40px_rgba(0,0,0,0.5)] ring-2 ring-white/50' : ''
                                                } ${
                                                    isDone 
                                                        ? 'bg-gradient-to-r from-emerald-600/50 to-emerald-500/50' 
                                                        : task.isCritical 
                                                            ? 'bg-gradient-to-r from-red-600 to-rose-500 ring-2 ring-red-500/30' 
                                                            : 'bg-gradient-to-r from-accent-teal to-indigo-500'
                                                }`}
                                                style={{ 
                                                    left: `${displayStart * dayWidth}px`, 
                                                    width: `${displayDuration * dayWidth}px` 
                                                }}
                                                onMouseDown={(e) => handleMouseDown(e, task.id, 'move', task.start || 0, task.duration || 1)}
                                            >
                                                {/* Tooltip on drag */}
                                                {isGhosting && (
                                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/20 px-3 py-1.5 rounded-lg shadow-2xl z-[100] whitespace-nowrap animate-in fade-in zoom-in duration-200">
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                            <Clock className="h-3 w-3 text-accent-teal" />
                                                            Start: Day {displayStart + 1} • <span className="text-accent-teal">{displayDuration} Days</span>
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Progress Overlay */}
                                                {(task.progress || 0) > 0 && !isDone && (
                                                    <div className="absolute inset-0 bg-white/20 pointer-events-none rounded-xl" style={{ width: `${task.progress}%` }} />
                                                )}
                                                
                                                <span className="text-[10px] font-black uppercase text-white tracking-widest truncate mix-blend-overlay">
                                                    {task.assignee}
                                                </span>
                                                
                                                {/* Resize Handle (Right) */}
                                                <div 
                                                    className="absolute right-0 top-0 bottom-0 w-6 cursor-ew-resize hover:bg-white/10 flex items-center justify-center group/resize"
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        handleMouseDown(e, task.id, 'resize', task.start || 0, task.duration || 1);
                                                    }}
                                                >
                                                    <div className="h-4 w-1 bg-white/30 rounded-full group-hover/resize:scale-y-125 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResourceHeatmap: React.FC<{ resources: TProjectVitalsAdvanced['resources'], tasks: TProjectVitalsAdvanced['tasks'] }> = ({ resources, tasks }) => {
    const { t } = useTranslation(['projectHub']);
    const safeResources = Array.isArray(resources) ? resources : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    
    if (safeResources.length === 0) {
        return <div className="text-text-muted-dark italic text-sm py-12 text-center">{t('projectHub:noResourceData')}</div>;
    }

    const maxDays = safeTasks.length > 0 ? Math.max(...safeTasks.map(t => (t.start || 0) + (t.duration || 1))) + 5 : 15;
    
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
        if (tasksCount === 0) return 'bg-white/[0.03] text-transparent';
        if (tasksCount === 1) return 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
        if (tasksCount === 2) return 'bg-accent-amber/20 text-accent-amber border border-accent-amber/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
        return 'bg-accent-red text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse';
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {safeResources.map((res, i) => {
                    let colorClass = 'bg-accent-emerald';
                    if (res.utilization > 100) colorClass = 'bg-accent-red shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                    else if (res.utilization > 80) colorClass = 'bg-accent-amber shadow-[0_0_15px_rgba(245,158,11,0.2)]';

                    return (
                        <div key={res.assignee} className="glass-card metallic-sheen p-6 flex flex-col gap-4 transition-all duration-500 group">
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">{res.assignee}</span>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full text-white uppercase tracking-widest ${colorClass}`}>
                                    {res.utilization}%
                                </span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden ring-1 ring-white/5">
                                <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${Math.min(res.utilization, 100)}%` }} />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-[10px] text-text-muted-dark font-bold uppercase tracking-widest opacity-60">{res.tasks} {t('projectHub:activeTasks')}</p>
                                <Users className="h-3 w-3 text-white/20" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="glass-surface metallic-sheen border border-border-dark rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-max">
                        <div className="flex bg-white/5 backdrop-blur-md h-12 sticky top-0 z-30 border-b border-white/5">
                            <div className="w-48 px-6 flex items-center text-[10px] font-black text-accent-teal uppercase tracking-[0.2em] bg-slate-900/80 backdrop-blur-xl border-r border-white/5 sticky left-0 z-40">
                                {t('projectHub:teamMember')}
                            </div>
                            {Array.from({ length: maxDays }).map((_, i) => (
                                <div key={i} className="w-12 flex items-center justify-center text-[10px] font-black text-white/30 border-r border-white/5 last:border-0 uppercase tracking-tighter">
                                    D{i + 1}
                                </div>
                            ))}
                        </div>
                        <div className="divide-y divide-white/5">
                            {safeResources.map(res => (
                                <div key={res.assignee} className="flex h-12 group hover:bg-white/[0.02] transition-colors">
                                    <div className="w-48 px-6 text-xs font-bold text-white/70 group-hover:text-white bg-slate-900/80 backdrop-blur-xl border-r border-white/5 sticky left-0 z-20 transition-colors flex items-center">
                                        {res.assignee}
                                    </div>
                                    {workload[res.assignee].map((count, i) => (
                                        <div key={i} className="w-12 flex items-center justify-center border-r border-white/5 last:border-0 p-1.5">
                                            <div className={`w-full h-full rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-500 scale-90 group-hover:scale-100 ${getHeatmapColor(count)} shadow-sm`}>
                                                {count > 0 ? count : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-6 p-4 glass-card max-w-fit mx-auto">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[.2em]">{t('projectHub:legend')}</span>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-white/[0.03]"></div> 
                    <span className="text-[10px] font-bold text-text-muted-dark uppercase">{t('projectHub:zeroTasks')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-accent-emerald/40 ring-1 ring-accent-emerald/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"></div> 
                    <span className="text-[10px] font-bold text-text-muted-dark uppercase">{t('projectHub:oneTaskOptimal')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-accent-amber/40 ring-1 ring-accent-amber/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"></div> 
                    <span className="text-[10px] font-bold text-text-muted-dark uppercase">{t('projectHub:twoTasksHeavy')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-accent-red ring-1 ring-accent-red/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]"></div> 
                    <span className="text-[10px] font-bold text-text-muted-dark uppercase">{t('projectHub:threePlusTasksOverallocated')}</span>
                </div>
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
            const updatedTasksMap = new Map(updatedTasks.map((ut: any) => [ut.id, ut]));
            const mergedTasks = (Array.isArray(advancedVitals?.tasks) ? advancedVitals.tasks : []).map(t => {
                const updated = updatedTasksMap.get(t.id);
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
        <div className="space-y-10">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tight">{t('projectHub:title')}</h1>
                    <p className="text-sm text-text-muted-dark font-medium uppercase tracking-[0.3em] opacity-60">Operations Intelligence Hub</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                    <select
                        value={selectedInitiative?.id || ''}
                        onChange={(e) => handleSelectInitiative(e.target.value)}
                        className="p-3 border-0 rounded-xl bg-slate-900/50 text-white text-sm focus:ring-2 focus:ring-accent-teal min-w-[200px] outline-none font-bold appearance-none scrollbar-hide"
                    >
                        <option value="" disabled className="bg-slate-900">{t('projectHub:selectInitiative')}</option>
                        {Object.keys(groupedInitiatives).sort().map(sector => (
                            <optgroup key={sector} label={sector} className="bg-slate-900 text-[10px] uppercase font-bold text-accent-teal/50">
                                {groupedInitiatives[sector].map(init => (
                                    <option key={init.id} value={init.id} className="bg-slate-900 text-white font-medium capitalize">{init.title}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>

                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />

                    {advancedVitals && selectedInitiative && (
                        <Button onClick={handleAutoPrioritize} disabled={isLoading} variant="outline" className="border-accent-teal/30 text-accent-teal hover:bg-accent-teal/10 rounded-xl px-4 text-xs font-black uppercase tracking-widest">
                            <Zap className="h-4 w-4 mr-2 filter drop-shadow(0 0 5px currentColor)"/>
                            {t('projectHub:autoPrioritize')}
                        </Button>
                    )}
                    <Button onClick={handleGenerateWbs} disabled={isLoading || !selectedInitiative} variant="primary" className="rounded-xl px-5 text-xs font-black uppercase tracking-widest">
                        {isLoading ? <Spinner /> : <><LayoutGrid className="h-4 w-4 mr-2"/> {wbs ? t('projectHub:recalculatePlan') : t('projectHub:generatePlan')}</>}
                    </Button>
                    {wbs && selectedInitiative && (
                        <Button onClick={handleSave} variant="primary" className="bg-accent-emerald hover:bg-accent-emerald/80 rounded-xl px-5 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                           <Download className="h-4 w-4 mr-2"/>
                            {t('projectHub:save')}
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="glass-card p-4 bg-accent-red/5 flex items-center gap-3 animate-shake">
                    <Flame className="h-5 w-5 text-accent-red" />
                    <p className="text-sm font-bold text-accent-red tracking-tight">{error}</p>
                </div>
            )}

            {!selectedInitiative && (
                <div className="flex flex-col items-center justify-center py-32 glass-surface border-2 border-dashed border-white/5 rounded-[2.5rem] metallic-sheen group">
                    <div className="bg-white/5 p-8 rounded-full mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-700">
                        <BarChart3 className="h-20 w-20 text-white opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em]">{t('projectHub:selectInitiative')}</h3>
                    <p className="text-text-muted-dark max-w-sm text-center mt-3 font-medium opacity-60 leading-relaxed">{t('projectHub:selectInitiativeDesc')}</p>
                </div>
            )}

            {advancedVitals && (
                <div className="space-y-10 animate-fade-in-up">
                    {/* Metrics Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="glass-card p-8 flex flex-col justify-between group hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] transition-all duration-500">
                            <div>
                                <p className="text-[10px] font-black text-accent-red uppercase tracking-[.3em] opacity-80 mb-2">{t('projectHub:criticalPathDuration')}</p>
                                <p className="text-5xl font-black text-white tracking-tighter">{advancedVitals.criticalPathDuration}<span className="text-sm font-bold text-text-muted-dark ml-2">DAYS</span></p>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-accent-red uppercase tracking-widest bg-accent-red/10 px-3 py-1.5 rounded-full w-fit">
                                <TrendingUp className="h-3 w-3" />
                                Efficiency Threshold
                            </div>
                        </div>

                        <div className="lg:col-span-3 glass-card p-8 relative overflow-hidden group transition-all duration-500">
                            {/* Ambient Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-teal/10 rounded-full blur-3xl -me-32 -mt-32 opacity-50 group-hover:scale-125 transition-transform duration-1000" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-accent-teal/20 rounded-lg">
                                        <Sparkles className="h-5 w-5 text-accent-teal filter drop-shadow(0 0 5px currentColor)" />
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                                        {t('projectHub:aiRiskAnalysis')}
                                    </h3>
                                </div>
                                <p className="text-base text-text-muted-dark leading-relaxed font-medium">
                                    {advancedVitals.riskAnalysis}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Optimization Advice Section */}
                    <div className="glass-surface p-8 relative border-accent-amber/20 group hover:border-accent-amber/40 transition-all duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent-amber/20 rounded-2xl shadow-inner">
                                    <Lightbulb className="h-6 w-6 text-accent-amber" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">
                                        {t('projectHub:strategicOptimizationAdvice')}
                                    </h3>
                                    <p className="text-[10px] text-accent-amber font-black uppercase tracking-[0.2em] opacity-60">LLM Vector Analysis Protocol</p>
                                </div>
                            </div>
                            
                            {!optimizationAdvice && (
                                <Button 
                                    onClick={handleGetOptimizationAdvice} 
                                    disabled={isOptimizing} 
                                    variant="outline"
                                    className="border-accent-amber/40 text-accent-amber hover:bg-accent-amber/20 rounded-xl px-6"
                                >
                                    {isOptimizing ? <Spinner /> : <><Sparkles className="h-4 w-4 mr-2"/> {t('projectHub:getAiAdvice')}</>}
                                </Button>
                            )}
                        </div>
                        
                        {optimizationAdvice ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none glass-card p-6 shadow-xl metallic-sheen overflow-y-auto max-h-[400px] custom-scrollbar">
                                <ReactMarkdown>{optimizationAdvice}</ReactMarkdown>
                                <div className="mt-6 flex justify-end">
                                    <Button 
                                        onClick={() => setOptimizationAdvice(null)} 
                                        variant="ghost" 
                                        className="text-accent-amber hover:bg-accent-amber/10 rounded-lg font-black uppercase tracking-widest text-[10px]"
                                    >
                                        {t('projectHub:dismiss')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center glass-card bg-white/[0.01]">
                                <p className="text-sm text-text-muted-dark font-medium italic opacity-60">
                                    {t('projectHub:optimizationAdviceDesc')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Main Content Tabs */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[1.25rem] w-fit border border-white/5">
                            <button
                                onClick={() => setActiveTab('Schedule')}
                                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                                    activeTab === 'Schedule' 
                                        ? 'bg-accent-teal text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-100' 
                                        : 'text-white/40 hover:text-white hover:bg-white/5 scale-95'
                                }`}
                            >
                                {t('projectHub:intelligentSchedule')}
                            </button>
                            <button
                                onClick={() => setActiveTab('Resources')}
                                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                                    activeTab === 'Resources' 
                                        ? 'bg-accent-teal text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-100' 
                                        : 'text-white/40 hover:text-white hover:bg-white/5 scale-95'
                                }`}
                            >
                                {t('projectHub:resourceHeatmap')}
                            </button>
                        </div>

                        <div className="transition-all duration-700">
                            {activeTab === 'Schedule' ? (
                                <SmartGanttChart data={advancedVitals} onUpdateTask={handleUpdateTask} />
                            ) : (
                                <ResourceHeatmap resources={Array.isArray(advancedVitals?.resources) ? advancedVitals.resources : []} tasks={Array.isArray(advancedVitals?.tasks) ? advancedVitals.tasks : []} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
