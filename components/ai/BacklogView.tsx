
import React, { useState, useMemo, useCallback } from 'react';
import { 
    TBacklogItem, 
    BacklogItemStatus, 
    BacklogItemPriority, 
    TSubtask, 
    TInitiative 
} from '../../types';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { generateUserStories } from '../../services/geminiService';
import { 
    Plus, 
    Zap, 
    CheckCircle2, 
    Clock, 
    ArrowRight, 
    ArrowLeft, 
    Trash2, 
    Link, 
    Wand2,
    ChevronDown,
    ChevronUp,
    Layout,
    CheckSquare,
    AlertCircle
} from 'lucide-react';

interface BacklogViewProps {
    items: TBacklogItem[];
    setItems: React.Dispatch<React.SetStateAction<TBacklogItem[]>>;
    initiative: TInitiative;
}

const priorityStyles = {
    [BacklogItemPriority.HIGH]: 'text-accent-red border-accent-red/20 bg-accent-red/5 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
    [BacklogItemPriority.MEDIUM]: 'text-accent-amber border-accent-amber/20 bg-accent-amber/5 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    [BacklogItemPriority.LOW]: 'text-accent-emerald border-accent-emerald/20 bg-accent-emerald/5 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
};

const typeIcons = {
    'Requirement': Layout,
    'Task': CheckSquare,
    'User Story': Zap,
};

const BacklogItemCard: React.FC<{ 
    item: TBacklogItem; 
    allItems: TBacklogItem[];
    onStatusChange: (id: string, newStatus: BacklogItemStatus) => void;
    onToggleSubtask: (itemId: string, subtaskId: string) => void;
    onAddSubtask: (itemId: string, subtaskTitle: string) => void;
    onUpdateDependencies: (itemId: string, dependencies: string[]) => void;
    onDeleteItem: (id: string) => void;
}> = ({ item, allItems, onStatusChange, onToggleSubtask, onAddSubtask, onUpdateDependencies, onDeleteItem }) => {
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [isManagingDependencies, setIsManagingDependencies] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const TypeIcon = typeIcons[item.type as keyof typeof typeIcons] || CheckSquare;

    const handleAddSubtaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubtaskTitle.trim()) {
            onAddSubtask(item.id, newSubtaskTitle.trim());
            setNewSubtaskTitle('');
            setIsAddingSubtask(false);
            setIsExpanded(true);
        }
    };

    const handleAddDependency = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const depId = e.target.value;
        if (depId && !item.dependencies?.includes(depId)) {
            onUpdateDependencies(item.id, [...(item.dependencies || []), depId]);
        }
        e.target.value = ""; // Reset select
    };

    const completedSubtasks = item.subtasks?.filter(st => st.isCompleted).length || 0;
    const totalSubtasks = item.subtasks?.length || 0;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const availableDependencies = allItems.filter(i => i.id !== item.id && !item.dependencies?.includes(i.id));

    return (
        <div className="group relative bg-white/5 border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/10 hover:shadow-2xl animate-fade-in group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg bg-white/5`}>
                            <TypeIcon className="h-3 w-3 text-gray-400" />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${priorityStyles[item.priority]}`}>
                            {item.priority}
                        </span>
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight leading-tight group-hover:text-accent-teal transition-colors">
                        {item.title}
                    </h4>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-accent-red/10 text-gray-500 hover:text-accent-red transition-all"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                    >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>

            {totalSubtasks > 0 && (
                <div className="mt-3">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Progress</span>
                        <span className="text-[10px] font-black text-white">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-accent-teal transition-all duration-500 shadow-[0_0_8px_rgba(45,212,191,0.5)]" 
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {isExpanded && (
                <div className="mt-4 space-y-4 animate-slide-up">
                    {/* Subtasks Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Execution Path</span>
                            <button 
                                onClick={() => setIsAddingSubtask(true)}
                                className="text-[9px] font-black text-accent-teal uppercase tracking-widest hover:underline"
                            >
                                Add Step
                            </button>
                        </div>
                        <ul className="space-y-1.5">
                            {item.subtasks?.map(subtask => (
                                <li key={subtask.id} className="flex items-center gap-2 group/st">
                                    <input
                                        type="checkbox"
                                        checked={subtask.isCompleted}
                                        onChange={() => onToggleSubtask(item.id, subtask.id)}
                                        className="h-3.5 w-3.5 rounded border-white/10 bg-white/5 text-accent-teal focus:ring-accent-teal transition-all cursor-pointer"
                                    />
                                    <span className={`text-xs ${subtask.isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                        {subtask.title}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {isAddingSubtask && (
                            <form onSubmit={handleAddSubtaskSubmit} className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    placeholder="Enter subtask..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-teal"
                                    autoFocus
                                />
                                <button type="submit" className="p-1 rounded-lg bg-accent-teal/20 text-accent-teal">
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Dependencies Section */}
                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dependencies</span>
                            <button 
                                onClick={() => setIsManagingDependencies(!isManagingDependencies)}
                                className="text-[9px] font-black text-accent-amber uppercase tracking-widest hover:underline"
                            >
                                {isManagingDependencies ? 'Done' : 'Manage'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {item.dependencies?.map(depId => {
                                const depItem = allItems.find(i => i.id === depId);
                                return depItem ? (
                                    <div key={depId} className="flex items-center gap-1.5 px-2 py-1 bg-accent-amber/5 border border-accent-amber/20 rounded-lg text-[10px] text-accent-amber">
                                        <Link className="h-2.5 w-2.5" />
                                        <span>{depItem.title}</span>
                                    </div>
                                ) : null;
                            })}
                            {isManagingDependencies && (
                                <select 
                                    onChange={handleAddDependency}
                                    value=""
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-400 focus:outline-none"
                                >
                                    <option value="" disabled>Link Task...</option>
                                    {availableDependencies.map(dep => (
                                        <option key={dep.id} value={dep.id}>{dep.title}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex items-center justify-between mt-4 pt-3 border-t border-white/${isExpanded ? '5' : '10'}`}>
                <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                        {item.status === BacklogItemStatus.TODO ? 'Queued' : item.status === BacklogItemStatus.IN_PROGRESS ? 'Active' : 'Archived'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {item.status !== BacklogItemStatus.TODO && (
                        <button onClick={() => onStatusChange(item.id, BacklogItemStatus.TODO)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white">
                            <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {item.status !== BacklogItemStatus.DONE && (
                        <button 
                            onClick={() => onStatusChange(item.id, item.status === BacklogItemStatus.TODO ? BacklogItemStatus.IN_PROGRESS : BacklogItemStatus.DONE)} 
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-accent-teal transition-all"
                        >
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const BacklogColumn: React.FC<{ 
    title: string; 
    status: BacklogItemStatus;
    items: TBacklogItem[]; 
    allItems: TBacklogItem[];
    onStatusChange: (id: string, newStatus: BacklogItemStatus) => void;
    onToggleSubtask: (itemId: string, subtaskId: string) => void;
    onAddSubtask: (itemId: string, subtaskTitle: string) => void;
    onUpdateDependencies: (itemId: string, dependencies: string[]) => void;
    onDeleteItem: (id: string) => void;
}> = ({ title, status, items, allItems, onStatusChange, onToggleSubtask, onAddSubtask, onUpdateDependencies, onDeleteItem }) => {
    return (
        <div className="flex-1 min-w-[320px] flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                        status === BacklogItemStatus.TODO ? 'bg-accent-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]' :
                        status === BacklogItemStatus.IN_PROGRESS ? 'bg-accent-teal shadow-[0_0_10px_rgba(45,212,191,0.5)]' :
                        'bg-accent-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    }`} />
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">{title}</h3>
                </div>
                <span className="text-[10px] font-black text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl opacity-20">
                        <CheckCircle2 className="h-8 w-8 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Clear Runway</span>
                    </div>
                ) : (
                    items.map(item => (
                        <BacklogItemCard 
                            key={item.id} 
                            item={item} 
                            allItems={allItems} 
                            onStatusChange={onStatusChange} 
                            onToggleSubtask={onToggleSubtask} 
                            onAddSubtask={onAddSubtask} 
                            onUpdateDependencies={onUpdateDependencies}
                            onDeleteItem={onDeleteItem}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export const BacklogView: React.FC<BacklogViewProps> = ({ items, setItems, initiative }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateStories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let context = '';
            if (initiative.artifacts?.scopeStatement) {
                context += `\nBased on IN-SCOPE items: ${initiative.artifacts.scopeStatement.inScope.join(', ')}.`;
            }
            if (initiative.artifacts?.analysisPlan?.deliverables) {
                 context += `\nTo deliver: ${initiative.artifacts.analysisPlan.deliverables.join(', ')}.`;
            }
            
            const newStories = await generateUserStories(initiative.title, initiative.sector, context);
            const storiesArray = Array.isArray(newStories) ? newStories : (newStories as any)?.stories || [];
            
            const newBacklogItems: TBacklogItem[] = storiesArray.map((story: any) => ({
                id: `b-${Date.now()}-${Math.random()}`,
                title: story.title,
                priority: story.priority,
                status: BacklogItemStatus.TODO,
                type: 'User Story',
                subtasks: [],
                dependencies: []
            }));
            setItems(prev => [...newBacklogItems, ...prev]);
        } catch(e) {
            setError('Failed to generate user stories.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncIntel = useCallback(() => {
        const elicitationReport = initiative.artifacts?.elicitation_report;
        if (!elicitationReport?.requirements) return;

        const existingTitles = new Set((items || []).map(i => i.title));
        const newItems: TBacklogItem[] = elicitationReport.requirements
            .filter((req: string) => !existingTitles.has(req))
            .map((req: string) => ({
                id: `b-sync-${Date.now()}-${Math.random()}`,
                title: req,
                priority: BacklogItemPriority.MEDIUM,
                status: BacklogItemStatus.TODO,
                type: 'Requirement',
                subtasks: [],
                dependencies: []
            }));

        if (newItems.length > 0) {
            setItems(prev => [...prev, ...newItems]);
        }
    }, [initiative.artifacts?.elicitation_report, items, setItems]);

    const handleStatusChange = (id: string, newStatus: BacklogItemStatus) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    };

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleToggleSubtask = (itemId: string, subtaskId: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId && item.subtasks) {
                return {
                    ...item,
                    subtasks: item.subtasks.map(subtask => 
                        subtask.id === subtaskId 
                            ? { ...subtask, isCompleted: !subtask.isCompleted } 
                            : subtask
                    )
                };
            }
            return item;
        }));
    };

    const handleAddSubtask = (itemId: string, subtaskTitle: string) => {
        const newSubtask: TSubtask = {
            id: `st-${Date.now()}`,
            title: subtaskTitle,
            isCompleted: false,
        };
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    subtasks: [...(item.subtasks || []), newSubtask]
                };
            }
            return item;
        }));
    };

    const handleUpdateDependencies = (itemId: string, dependencies: string[]) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, dependencies };
            }
            return item;
        }));
    };

    const columns = useMemo(() => {
        const safeItems = items || [];
        return {
            [BacklogItemStatus.TODO]: safeItems.filter(i => i.status === BacklogItemStatus.TODO),
            [BacklogItemStatus.IN_PROGRESS]: safeItems.filter(i => i.status === BacklogItemStatus.IN_PROGRESS),
            [BacklogItemStatus.DONE]: safeItems.filter(i => i.status === BacklogItemStatus.DONE),
        };
    }, [items]);

    const hasIntel = !!initiative.artifacts?.elicitation_report;

    return (
        <div className="space-y-8 h-full flex flex-col p-4 animate-fade-in">
            <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 pb-6 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-accent-purple/20 rounded-xl">
                            <Layout className="h-6 w-6 text-accent-purple" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">Tactical Backlog</h2>
                    </div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-[0.2em]">Execution & Resource Orchestration Grid</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    {hasIntel && (
                        <button 
                            onClick={handleSyncIntel}
                            className="px-4 py-2 bg-accent-teal/10 border border-accent-teal/20 rounded-xl text-[10px] font-black text-accent-teal uppercase tracking-widest hover:bg-accent-teal/20 transition-all flex items-center gap-2"
                        >
                            <Zap className="h-3.5 w-3.5" />
                            Sync Discovery Hub
                        </button>
                    )}
                    <button 
                        onClick={handleGenerateStories} 
                        disabled={isLoading}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        {isLoading ? <Spinner className="h-3.5 w-3.5" /> : <Wand2 className="h-3.5 w-3.5 text-accent-purple" />}
                        AI Synthesis for {initiative.sector}
                    </button>
                </div>
            </div>
            
            {error && (
                <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-xs text-accent-red animate-shake">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
            
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[600px]">
                <BacklogColumn 
                    title="Plan" 
                    status={BacklogItemStatus.TODO}
                    items={columns[BacklogItemStatus.TODO]} 
                    allItems={items} 
                    onStatusChange={handleStatusChange} 
                    onToggleSubtask={handleToggleSubtask} 
                    onAddSubtask={handleAddSubtask} 
                    onUpdateDependencies={handleUpdateDependencies}
                    onDeleteItem={handleDeleteItem}
                />
                <BacklogColumn 
                    title="Active" 
                    status={BacklogItemStatus.IN_PROGRESS}
                    items={columns[BacklogItemStatus.IN_PROGRESS]} 
                    allItems={items} 
                    onStatusChange={handleStatusChange} 
                    onToggleSubtask={handleToggleSubtask} 
                    onAddSubtask={handleAddSubtask} 
                    onUpdateDependencies={handleUpdateDependencies}
                    onDeleteItem={handleDeleteItem}
                />
                <BacklogColumn 
                    title="Complete" 
                    status={BacklogItemStatus.DONE}
                    items={columns[BacklogItemStatus.DONE]} 
                    allItems={items} 
                    onStatusChange={handleStatusChange} 
                    onToggleSubtask={handleToggleSubtask} 
                    onAddSubtask={handleAddSubtask} 
                    onUpdateDependencies={handleUpdateDependencies}
                    onDeleteItem={handleDeleteItem}
                />
            </div>
        </div>
    );
};
