
import React, { useState, useMemo } from 'react';
import { TBacklogItem, BacklogItemStatus, BacklogItemPriority, TSubtask, TInitiative } from '../../types';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { generateUserStories } from '../../services/geminiService';

interface BacklogViewProps {
    items: TBacklogItem[];
    setItems: React.Dispatch<React.SetStateAction<TBacklogItem[]>>;
    initiative: TInitiative;
}

const priorityStyles = {
    [BacklogItemPriority.HIGH]: 'bg-accent-red/10 text-accent-red',
    [BacklogItemPriority.MEDIUM]: 'bg-accent-amber/10 text-accent-amber',
    [BacklogItemPriority.LOW]: 'bg-accent-purple/10 text-accent-purple',
};

const typeStyles = {
    'Requirement': 'bg-accent-purple/10 text-accent-purple',
    'Task': 'bg-surface-dark text-text-muted-dark',
    'User Story': 'bg-accent-emerald/10 text-accent-emerald',
};

const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const WandSparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>;
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const ArrowUturnLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;

const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;

const BacklogItem: React.FC<{ 
    item: TBacklogItem; 
    allItems: TBacklogItem[];
    onStatusChange: (id: string, newStatus: BacklogItemStatus) => void;
    onToggleSubtask: (itemId: string, subtaskId: string) => void;
    onAddSubtask: (itemId: string, subtaskTitle: string) => void;
    onUpdateDependencies: (itemId: string, dependencies: string[]) => void;
}> = ({ item, allItems, onStatusChange, onToggleSubtask, onAddSubtask, onUpdateDependencies }) => {
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [isManagingDependencies, setIsManagingDependencies] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const handleAddSubtaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubtaskTitle.trim()) {
            onAddSubtask(item.id, newSubtaskTitle.trim());
            setNewSubtaskTitle('');
            setIsAddingSubtask(false);
        }
    };

    const handleAddDependency = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const depId = e.target.value;
        if (depId && !item.dependencies?.includes(depId)) {
            onUpdateDependencies(item.id, [...(item.dependencies || []), depId]);
        }
        e.target.value = ""; // Reset select
    };

    const handleRemoveDependency = (depId: string) => {
        onUpdateDependencies(item.id, (item.dependencies || []).filter(id => id !== depId));
    };

    const completedSubtasks = item.subtasks?.filter(st => st.isCompleted).length || 0;
    const totalSubtasks = item.subtasks?.length || 0;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const availableDependencies = allItems.filter(i => i.id !== item.id && !item.dependencies?.includes(i.id));

    return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{item.title}</p>
            
            {item.subtasks && item.subtasks.length > 0 && (
                <div className="my-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Subtasks Progress</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div className="bg-accent-purple h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                    <ul className="space-y-1">
                        {item.subtasks.map(subtask => (
                            <li key={subtask.id} className={`flex items-center text-sm transition-opacity ${subtask.isCompleted ? 'opacity-50' : ''}`}>
                                <input
                                    type="checkbox"
                                    id={`subtask-${subtask.id}`}
                                    checked={subtask.isCompleted}
                                    onChange={() => onToggleSubtask(item.id, subtask.id)}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-accent-purple focus:ring-accent-purple mr-2 cursor-pointer"
                                />
                                <label 
                                    htmlFor={`subtask-${subtask.id}`} 
                                    className={`cursor-pointer ${subtask.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    {subtask.title}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {item.dependencies && item.dependencies.length > 0 && (
                <div className="my-2 p-2 bg-accent-amber/10 rounded-md border border-accent-amber/20">
                    <div className="flex items-center gap-1 mb-1">
                        <LinkIcon className="h-3 w-3 text-accent-amber" />
                        <span className="text-xs font-semibold text-accent-amber">Depends on:</span>
                    </div>
                    <ul className="space-y-1">
                        {item.dependencies.map(depId => {
                            const depItem = allItems.find(i => i.id === depId);
                            return depItem ? (
                                <li key={depId} className="text-xs text-accent-amber flex justify-between items-center bg-white dark:bg-gray-800 px-2 py-1 rounded border border-accent-amber/20">
                                    <span className="truncate mr-2" title={depItem.title}>{depItem.title}</span>
                                    {isManagingDependencies && (
                                        <button onClick={() => handleRemoveDependency(depId)} className="text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30">
                                            <TrashIcon className="h-3 w-3" />
                                        </button>
                                    )}
                                </li>
                            ) : null;
                        })}
                    </ul>
                </div>
            )}

            {isAddingSubtask && (
                <form onSubmit={handleAddSubtaskSubmit} className="my-2 flex gap-2">
                    <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="New subtask title..."
                        className="flex-grow p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-accent-purple"
                        autoFocus
                    />
                    <button type="submit" className="px-2 py-1 text-xs font-semibold text-white bg-accent-purple rounded-md hover:bg-accent-purple/80">Add</button>
                    <button type="button" onClick={() => setIsAddingSubtask(false)} className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                </form>
            )}

            {isManagingDependencies && (
                <div className="my-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Add Dependency</label>
                    <div className="flex gap-2">
                        <select 
                            onChange={handleAddDependency} 
                            defaultValue=""
                            className="flex-grow p-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-accent-purple"
                        >
                            <option value="" disabled>Select task...</option>
                            {availableDependencies.map(dep => (
                                <option key={dep.id} value={dep.id}>{dep.title}</option>
                            ))}
                        </select>
                        <button type="button" onClick={() => setIsManagingDependencies(false)} className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Done</button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50 mt-2">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityStyles[item.priority]}`}>{item.priority}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeStyles[item.type]}`}>{item.type}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsManagingDependencies(!isManagingDependencies)} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${isManagingDependencies ? 'text-accent-purple bg-accent-purple/10' : 'text-gray-500'}`} title="Manage dependencies">
                        <LinkIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => setIsAddingSubtask(true)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Add subtask">
                        <PlusCircleIcon className="h-4 w-4" />
                    </button>
                    {item.status !== BacklogItemStatus.TODO && (
                         <button onClick={() => onStatusChange(item.id, BacklogItemStatus.TODO)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Move to To Do">
                           <ArrowUturnLeftIcon className="h-4 w-4" />
                        </button>
                    )}
                    {item.status !== BacklogItemStatus.DONE && (
                        <button onClick={() => onStatusChange(item.id, item.status === BacklogItemStatus.TODO ? BacklogItemStatus.IN_PROGRESS : BacklogItemStatus.DONE)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Move right">
                             <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const BacklogColumn: React.FC<{ 
    title: string; 
    items: TBacklogItem[]; 
    allItems: TBacklogItem[];
    onStatusChange: (id: string, newStatus: BacklogItemStatus) => void;
    onToggleSubtask: (itemId: string, subtaskId: string) => void;
    onAddSubtask: (itemId: string, subtaskTitle: string) => void;
    onUpdateDependencies: (itemId: string, dependencies: string[]) => void;
    children?: React.ReactNode 
}> = ({ title, items, allItems, onStatusChange, onToggleSubtask, onAddSubtask, onUpdateDependencies, children }) => {
    return (
        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg flex-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{title} ({items.length})</h3>
            <div className="space-y-3">
                {items.map(item => <BacklogItem key={item.id} item={item} allItems={allItems} onStatusChange={onStatusChange} onToggleSubtask={onToggleSubtask} onAddSubtask={onAddSubtask} onUpdateDependencies={onUpdateDependencies} />)}
            </div>
            {children}
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
            // Intelligent Context Chaining
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
                type: 'User Story'
            }));
            setItems(prev => [...newBacklogItems, ...prev]);
        } catch(e) {
            setError('Failed to generate user stories.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = (id: string, newStatus: BacklogItemStatus) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
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

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Initiative Backlog</h2>
                    <p className="text-gray-600 dark:text-gray-400">Manage, prioritize, and track work items for this initiative.</p>
                </div>
                 <Button onClick={handleGenerateStories} disabled={isLoading}>
                    {isLoading ? <Spinner/> : <><WandSparklesIcon className="h-5 w-5 mr-2" /> Generate User Stories for {initiative.sector}</>}
                </Button>
            </div>
            
            {error && <p className="text-red-500 px-6">{error}</p>}
            
            <div className="flex flex-col lg:flex-row gap-6">
                <BacklogColumn title="To Do" items={columns[BacklogItemStatus.TODO]} allItems={items} onStatusChange={handleStatusChange} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} onUpdateDependencies={handleUpdateDependencies} />
                <BacklogColumn title="In Progress" items={columns[BacklogItemStatus.IN_PROGRESS]} allItems={items} onStatusChange={handleStatusChange} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} onUpdateDependencies={handleUpdateDependencies} />
                <BacklogColumn title="Done" items={columns[BacklogItemStatus.DONE]} allItems={items} onStatusChange={handleStatusChange} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} onUpdateDependencies={handleUpdateDependencies} />
            </div>
        </div>
    );
};
