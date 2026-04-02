
import React, { useState, useEffect } from 'react';
import { TInitiative, TPersonalBriefing, TUnifiedTask } from '../types';
import { generatePersonalBriefing } from '../services/geminiService';
import { Briefcase, CheckCircle, Clock, Play, Pause, Sparkles, Layout, Target, CheckSquare } from 'lucide-react';
import { Spinner } from './ui/Spinner';

interface MyWorkspaceProps {
    initiatives: TInitiative[];
}

export const MyWorkspace: React.FC<MyWorkspaceProps> = ({ initiatives }) => {
    const [briefing, setBriefing] = useState<TPersonalBriefing | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tasks, setTasks] = useState<TUnifiedTask[]>([]);
    
    // Focus Timer State
    const [timerActive, setTimerActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                // In a real app, 'Brenda' would be from auth context
                const result = await generatePersonalBriefing('Brenda', initiatives);
                setBriefing(result);
                // Defensive check: ensure tasks is always an array
                setTasks(Array.isArray(result?.tasks) ? result.tasks : []);
            } catch (error) {
                console.error(error);
                // Fallback for tasks if API fails completely
                setTasks([]);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [initiatives]);

    useEffect(() => {
        let interval: any;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
            alert("Focus session complete!");
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const toggleTask = (id: string) => {
        setTasks(prev => (Array.isArray(prev) ? prev : []).map(t => t.id === id ? { ...t, status: t.status === 'Done' ? 'Pending' : 'Done' } : t));
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'Approval': return 'bg-accent-purple/10 text-accent-purple dark:bg-accent-purple/20 dark:text-accent-purple';
            case 'Action Item': return 'bg-accent-amber/10 text-accent-amber dark:bg-accent-amber/20 dark:text-accent-amber';
            default: return 'bg-accent-purple/10 text-accent-purple dark:bg-accent-purple/20 dark:text-accent-purple';
        }
    };

    // Safe array for rendering
    const safeTasks = Array.isArray(tasks) ? tasks : [];

    return (
        <div className="space-y-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-4 tracking-tight">
                        <Briefcase className="h-10 w-10 text-accent-purple" />
                        My Workspace
                    </h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark">Manage your daily focus and unified task stream.</p>
                </div>
                <div className="flex items-center gap-6 bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
                    <div className="text-right">
                        <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-bold uppercase tracking-widest mb-1">Focus Timer</p>
                        <p className="font-mono text-2xl font-bold text-accent-purple tracking-tighter">{formatTime(timeLeft)}</p>
                    </div>
                    <button 
                        onClick={() => setTimerActive(!timerActive)}
                        className={`p-4 rounded-xl text-white transition-all duration-300 shadow-lg ${
                            timerActive 
                                ? 'bg-accent-red shadow-accent-red/20 hover:scale-105' 
                                : 'bg-accent-green shadow-accent-green/20 hover:scale-105'
                        }`}
                    >
                        {timerActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="flex-grow flex items-center justify-center">
                    <Spinner />
                </div>
            )}

            {briefing && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Left: Briefing & Focus */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-gradient-to-br from-accent-purple to-accent-blue text-white p-8 rounded-2xl shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                              <Sparkles className="w-32 h-32" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight">{briefing.greeting}</h2>
                            <p className="opacity-90 text-sm leading-relaxed mb-8 italic">"{briefing.summary}"</p>
                            
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-inner">
                                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-white/80 mb-2 tracking-widest">
                                  <Target className="w-3 h-3" />
                                  Today's Strategic Focus
                                </div>
                                <p className="font-bold text-xl leading-tight">{briefing.focusItem}</p>
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm p-8 border border-border-light dark:border-border-dark">
                            <h3 className="text-xs font-bold text-text-main-light dark:text-text-main-dark uppercase tracking-widest mb-6 flex items-center gap-2">
                              <Layout className="w-4 h-4 text-accent-purple" />
                              Workspace Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center p-5 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl border border-border-light dark:border-border-dark">
                                    <p className="text-3xl font-bold text-text-main-light dark:text-text-main-dark mb-1">{safeTasks.filter(t => t.status !== 'Done').length}</p>
                                    <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-bold uppercase tracking-widest">Open Items</p>
                                </div>
                                <div className="text-center p-5 bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl border border-border-light dark:border-border-dark">
                                    <p className="text-3xl font-bold text-accent-green mb-1">{safeTasks.filter(t => t.status === 'Done').length}</p>
                                    <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-bold uppercase tracking-widest">Completed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Unified Inbox */}
                    <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-border-light dark:border-border-dark flex flex-col h-[650px] overflow-hidden">
                        <div className="p-8 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-surface-darker/5 dark:bg-surface-darker/30">
                            <div className="space-y-1">
                              <h3 className="font-bold text-xl text-text-main-light dark:text-text-main-dark flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-accent-purple" />
                                Unified Inbox
                              </h3>
                              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Aggregated from all active initiatives</p>
                            </div>
                            <div className="bg-accent-purple/10 dark:bg-accent-purple/20 px-3 py-1 rounded-full border border-accent-purple/20">
                              <span className="text-[10px] font-bold text-accent-purple uppercase tracking-widest">{safeTasks.length} Items</span>
                            </div>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-4 flex-grow bg-surface-darker/5 dark:bg-surface-darker/10 custom-scrollbar">
                            {safeTasks.map((task, index) => (
                                <div 
                                    key={task.id ? `${task.id}-${index}` : index} 
                                    className={`group flex items-center p-5 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border transition-all duration-300 ${
                                        task.status === 'Done' 
                                          ? 'opacity-60 border-transparent grayscale' 
                                          : 'border-border-light dark:border-border-dark hover:border-accent-purple/50 dark:hover:border-accent-purple/50 hover:shadow-md'
                                    }`}
                                >
                                    <button 
                                        onClick={() => toggleTask(task.id)}
                                        className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 mr-5 flex items-center justify-center transition-all duration-300 ${
                                            task.status === 'Done' 
                                              ? 'bg-accent-green border-accent-green text-white scale-110' 
                                              : 'border-border-light dark:border-border-dark hover:border-accent-purple group-hover:scale-110'
                                        }`}
                                    >
                                        {task.status === 'Done' && <CheckCircle className="h-4 w-4" />}
                                    </button>
                                    
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <p className={`text-base font-bold truncate transition-all ${task.status === 'Done' ? 'line-through text-text-muted-light dark:text-text-muted-dark' : 'text-text-main-light dark:text-text-main-dark'}`}>
                                                {task.title}
                                            </p>
                                            <span className={`flex-shrink-0 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${getTypeColor(task.type)}`}>
                                                {task.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted-light dark:text-text-muted-dark">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Briefcase className="h-3.5 w-3.5 text-accent-purple/60" /> {task.project}
                                            </span>
                                            {task.priority === 'High' && (
                                                <span className="text-accent-red font-bold flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                                                    <Clock className="h-3.5 w-3.5" /> High Priority
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {safeTasks.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                  <div className="bg-accent-green/10 p-4 rounded-full">
                                    <CheckCircle className="w-12 h-12 text-accent-green" />
                                  </div>
                                  <p className="text-text-muted-light dark:text-text-muted-dark font-medium">No tasks found. You're all caught up!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
