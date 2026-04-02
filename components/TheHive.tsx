
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { THiveState, THiveMessage, THiveAgent, TInitiative, THiveStep, TVectorMemory } from '../types';
import { HiveService } from '../services/hiveService';
import { useHivePersistence } from '../hooks/useHivePersistence';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { useCatalyst } from '../context/CatalystContext';
import { RenderBpmnFlow } from './ui/RenderBpmnFlow';
import { RenderSequenceDiagram } from './ui/RenderSequenceDiagram';
import { RenderMindMapNode } from './ui/RenderMindMap';
import { PresentationViewer } from './ui/PresentationViewer';
import { MonteCarloVisualizer } from './ui/Charts';
import { MemoryService } from '../services/memoryService';

import { 
  Box, 
  UserCircle, 
  ShieldAlert, 
  Search, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Film, 
  Map as MapIcon, 
  BarChart3, 
  Square, 
  Database,
  Cpu,
  Activity,
  Zap,
  MessageSquare,
  Brain,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Search as MagnifyingGlassIcon,
  BarChart3 as PresentationChartBarIcon,
  ShieldAlert as ShieldExclamationIcon,
  Database as CircleStackIcon,
  Box as CubeTransparentIcon,
  Trash2 as TrashIcon,
  UserCircle as UserCircleIcon,
  CheckCircle as CheckCircleIcon,
  Film as FilmIcon,
  XCircle as XCircleIcon,
  Square as StopIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AgentAvatar: React.FC<{ agent: THiveAgent; active: boolean; size?: 'sm' | 'lg' }> = React.memo(({ agent, active, size = 'lg' }) => {
    const { t } = useTranslation('dashboard');
    const colors: Record<THiveAgent, string> = {
        Orchestrator: 'bg-accent-purple',
        Scout: 'bg-accent-blue',
        Guardian: 'bg-accent-red',
        Integromat: 'bg-accent-green',
        Simulation: 'bg-accent-amber'
    };

    const sizeClasses = size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-10 h-10 text-xs';

    return (
        <div className={`flex flex-col items-center transition-all duration-500 ${active ? 'scale-110 opacity-100' : size === 'lg' ? 'scale-90 opacity-40 grayscale' : 'opacity-100'}`}>
            <div className={`${sizeClasses} rounded-[2rem] flex items-center justify-center text-white font-bold shadow-xl ${colors[agent]} relative overflow-hidden group`}>
                {active && (
                    <motion.div 
                        layoutId="active-glow"
                        className="absolute inset-0 bg-white/20 animate-pulse"
                    />
                )}
                <span className="relative z-10">{agent.charAt(0)}</span>
                {active && size === 'lg' && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent-green border-4 border-surface-light dark:border-surface-dark rounded-full" />
                )}
            </div>
            {size === 'lg' && (
                <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${active ? 'text-accent-purple' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                    {t(`hive.agent${agent}`)}
                </span>
            )}
        </div>
    );
});

// --- Neural Pathway Visualization ---
const NeuralGraph: React.FC<{ history: THiveStep[], activeAgent: THiveAgent, isAutoRunning: boolean }> = React.memo(({ history, activeAgent, isAutoRunning }) => {
    const { t } = useTranslation('dashboard');
    return (
        <div className="flex items-center gap-4 overflow-x-auto p-6 mask-fade-right custom-scrollbar bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-purple/10 rounded-lg">
                    <Zap className="h-4 w-4 text-accent-purple" />
                </div>
                <div className="h-px w-8 bg-border-light dark:bg-border-dark"></div>
            </div>
            {history.map((step, i) => (
                <motion.div 
                    key={step.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 flex-shrink-0"
                >
                    <div className="flex flex-col items-center group">
                        <AgentAvatar agent={step.agent} active={false} size="sm" />
                        <span className="text-[9px] font-bold text-text-muted-light dark:text-text-muted-dark mt-2 max-w-[80px] truncate text-center uppercase tracking-tighter group-hover:text-accent-purple transition-colors">{step.action}</span>
                    </div>
                    <div className="h-px w-10 bg-border-light dark:bg-border-dark relative">
                        {step.nextAgent && (
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-purple shadow-sm shadow-accent-purple/50" />
                        )}
                    </div>
                </motion.div>
            ))}
            {/* Active Node Pulse */}
            <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative">
                    {isAutoRunning && (
                        <div className="absolute inset-0 bg-accent-purple rounded-[1rem] animate-ping opacity-20"></div>
                    )}
                    <AgentAvatar agent={activeAgent} active={true} size="sm" />
                </div>
                <span className="text-[9px] font-bold text-accent-purple mt-2 uppercase tracking-widest animate-pulse">
                    {isAutoRunning ? t('hive.processing') : t('hive.thinking')}
                </span>
            </div>
        </div>
    );
});

const MemoryPanel: React.FC<{ memories: TVectorMemory[] }> = ({ memories }) => {
    const { t } = useTranslation('dashboard');
    return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl h-full overflow-y-auto border border-border-light dark:border-border-dark custom-scrollbar space-y-6">
        <div className="flex items-center justify-between sticky top-0 bg-surface-light dark:bg-surface-dark pb-4 z-10 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-blue/10 rounded-xl">
                    <Database className="h-5 w-5 text-accent-blue" />
                </div>
                <h3 className="text-sm font-bold text-text-main-light dark:text-text-main-dark uppercase tracking-widest">
                    {t('hive.semanticMemory')}
                </h3>
            </div>
            <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark bg-surface-darker/10 px-2 py-1 rounded-full">
                {t('hive.nodes', { count: memories.length })}
            </span>
        </div>
        {memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                <Brain className="h-12 w-12 text-text-muted-light dark:text-text-muted-dark" />
                <p className="text-xs font-medium italic">{t('hive.noSemanticMemories')}</p>
            </div>
        ) : (
            <div className="space-y-4">
                {memories.map(mem => (
                    <motion.div 
                        key={mem.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface-darker/5 dark:bg-surface-darker/20 p-4 rounded-2xl border border-border-light dark:border-border-dark hover:border-accent-blue/30 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                                mem.type === 'decision' 
                                    ? 'bg-accent-red/10 text-accent-red' 
                                    : 'bg-accent-blue/10 text-accent-blue'
                            }`}>
                                {t(`hive.memoryType${mem.type}`, { defaultValue: mem.type })}
                            </span>
                            <span className="text-[10px] font-medium text-text-muted-light dark:text-text-muted-dark">
                                {new Date(mem.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-xs text-text-main-light dark:text-text-main-dark leading-relaxed font-light group-hover:text-accent-blue transition-colors">
                            {mem.content}
                        </p>
                    </motion.div>
                ))}
            </div>
        )}
    </div>
    );
};

export const TheHive: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const { initiatives, hiveCommand, setHiveCommand } = useCatalyst();
    const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>('');
    const [goal, setGoal] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const stopRef = useRef(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [memories, setMemories] = useState<TVectorMemory[]>([]);

    // Persistent State Hook
    const { state, setState, resetState, isLoaded } = useHivePersistence(selectedInitiativeId);

    const activeInitiative = initiatives.find(i => i.id === selectedInitiativeId);

    // Refresh memory view on mount/change
    useEffect(() => {
        MemoryService.loadMemories().then(setMemories);
        const interval = setInterval(() => {
            MemoryService.loadMemories().then(setMemories);
        }, 5000); // Poll for memory updates every 5s
        return () => clearInterval(interval);
    }, []);

    // Handle cross-module commands (Nightly Watchman)
    useEffect(() => {
        if (hiveCommand) {
            setGoal(hiveCommand);
            if (!selectedInitiativeId && initiatives.length > 0) {
                 setSelectedInitiativeId(initiatives[0].id);
            }
            setTimeout(() => {
                handleStart(hiveCommand);
                setHiveCommand(null);
            }, 500);
        }
    }, [hiveCommand]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [state.messages, state.approvalRequest]);

    const handleStart = async (customGoal?: string) => {
        const targetGoal = customGoal || goal;
        if (!targetGoal.trim()) return;

        stopRef.current = false;
        
        const startMsg: THiveMessage = {
            id: Date.now().toString(),
            role: 'user',
            agent: 'Orchestrator',
            content: targetGoal,
            timestamp: Date.now(),
            status: 'done'
        };

        const newState: THiveState = {
            ...state,
            goal: targetGoal,
            status: 'running',
            messages: [...state.messages, startMsg],
            history: state.history.length > 0 ? state.history : []
        };
        
        setState(newState);
        setGoal('');
        runLoop(newState);
    };

    const runLoop = async (currentState: THiveState) => {
        if (stopRef.current) {
             setIsProcessing(false);
             return;
        }

        setIsProcessing(true);
        try {
            const nextState = await HiveService.processStep(currentState, activeInitiative);
            setState(nextState);

            // Autonomous Loop Logic
            if (nextState.status === 'running' && !nextState.approvalRequest) {
                // Recursive call with delay for UX
                setTimeout(() => runLoop(nextState), 1500); 
            } else {
                setIsProcessing(false);
            }
        } catch (e: any) {
            console.error("Critical Hive Error:", e);
            
            // Inject error message into state to inform user
            const errorState = {
                ...currentState,
                status: 'idle',
                messages: [...currentState.messages, {
                    id: `crit-err-${Date.now()}`,
                    role: 'system',
                    agent: 'Orchestrator',
                    content: t('hive.criticalError', { message: e.message }),
                    timestamp: Date.now()
                }]
            } as THiveState;
            
            setState(errorState);
            setIsProcessing(false);
        }
    };

    const handleStop = () => {
        stopRef.current = true;
        setIsProcessing(false);
    };

    const handleApproval = async (approved: boolean) => {
        setIsProcessing(true);
        try {
            const nextState = await HiveService.resumeStep(state, approved);
            setState(nextState);
            // Resume autonomous loop after approval
            if (nextState.status === 'running') {
                 runLoop(nextState);
            } else {
                setIsProcessing(false);
            }
        } catch (e) {
            console.error(e);
            setIsProcessing(false);
        }
    };

    const handleClearMemory = async () => {
        if (confirm(t('hive.confirmClearMemory'))) {
            resetState();
            await MemoryService.clear(); // Clear vector memory too
            setMemories([]);
        }
    };

    // Quick Actions
    const quickActions = [
        { label: t('hive.marketScan'), icon: <MagnifyingGlassIcon className="h-4 w-4"/>, query: t('hive.marketScanQuery') },
        { label: t('hive.simulateOutcome'), icon: <PresentationChartBarIcon className="h-4 w-4"/>, query: t('hive.simulateOutcomeQuery') },
        { label: t('hive.ethicalAudit'), icon: <ShieldExclamationIcon className="h-4 w-4"/>, query: t('hive.ethicalAuditQuery') },
        { label: t('hive.processFlow'), icon: <MapIcon className="h-4 w-4"/>, query: t('hive.processFlowQuery') },
        { label: t('hive.saveKeyDecision'), icon: <CircleStackIcon className="h-4 w-4"/>, query: t('hive.saveKeyDecisionQuery') },
    ];

    if (!isLoaded) return <div className="flex h-full items-center justify-center"><Spinner /></div>;

    return (
        <div className="h-full flex flex-col bg-surface-light dark:bg-surface-darker rounded-lg overflow-hidden">
            {/* Context Header */}
            <div className="bg-surface-light dark:bg-surface-darker border-b border-gray-200 dark:border-border-dark p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <CubeTransparentIcon className="h-6 w-6 text-accent-purple" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('hive.missionControl')}</h2>
                    {isProcessing && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full animate-pulse border border-green-200">
                            {t('hive.autoPilotActive')}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-4">
                    <select 
                        value={selectedInitiativeId}
                        onChange={(e) => setSelectedInitiativeId(e.target.value)}
                        className="text-sm p-2 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-darker focus:ring-2 focus:ring-accent-purple"
                    >
                        <option value="">{t('hive.selectActiveProject')}</option>
                        {initiatives.map(i => (
                            <option key={i.id} value={i.id}>{i.title}</option>
                        ))}
                    </select>
                    {selectedInitiativeId && (
                        <button onClick={handleClearMemory} className="text-gray-400 hover:text-red-500" title={t('hive.clearBrain')}>
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Neural Pathway Visualization */}
            <div className="bg-surface-light dark:bg-surface-darker border-b border-gray-200 dark:border-border-dark h-16 flex items-center">
                 {state.history.length > 0 ? (
                    <NeuralGraph history={state.history} activeAgent={state.activeAgent} isAutoRunning={isProcessing} />
                 ) : (
                    <div className="px-4 text-xs text-gray-500 italic">{t('hive.neuralPathwayIdle')}</div>
                 )}
            </div>

            <div className="flex-grow flex overflow-hidden">
                {/* Main Visualizer & Chat */}
                <div className="flex-grow flex flex-col border-r border-border-light dark:border-border-dark">
                    <div className="bg-surface-light dark:bg-surface-darker p-8 border-b border-border-light dark:border-border-dark flex justify-center items-center relative shadow-inner overflow-hidden flex-shrink-0">
                        {/* Connecting Lines */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-0.5 bg-border-light dark:bg-border-dark z-0"></div>
                        
                        {/* Agents */}
                        <div className="relative z-10 flex gap-8">
                            <AgentAvatar agent="Scout" active={state.activeAgent === 'Scout'} />
                            <AgentAvatar agent="Simulation" active={state.activeAgent === 'Simulation'} />
                            <AgentAvatar agent="Orchestrator" active={state.activeAgent === 'Orchestrator'} />
                            <AgentAvatar agent="Integromat" active={state.activeAgent === 'Integromat'} />
                            <AgentAvatar agent="Guardian" active={state.activeAgent === 'Guardian'} />
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-surface-light dark:bg-surface-darker custom-scrollbar" ref={scrollRef}>
                        {state.messages.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                                <CubeTransparentIcon className="h-20 w-20 mx-auto mb-4 opacity-20" />
                                <h2 className="text-xl font-bold mb-2">{t('hive.theHiveIsDormant')}</h2>
                                <p>
                                    {selectedInitiativeId 
                                        ? t('hive.assignGoal', { title: activeInitiative?.title }) 
                                        : t('hive.selectProjectFirst')}
                                </p>
                                
                                {selectedInitiativeId && (
                                    <div className="mt-8 flex justify-center gap-3 flex-wrap">
                                        {quickActions.map((action, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => handleStart(action.query)}
                                                className="flex items-center gap-2 px-4 py-2 bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark rounded-lg hover:bg-surface-dark transition-colors shadow-sm text-sm font-medium text-text-light dark:text-text-dark"
                                            >
                                                {action.icon} {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {state.messages.map((msg, i) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                
                                 {/* Chain of Thought Bubble */}
                                {msg.thought && msg.role !== 'user' && (
                                     <div className="max-w-[70%] mb-2 ml-4 relative group">
                                        <div className="absolute -left-2 top-2 w-1 h-full bg-accent-purple/50 dark:bg-accent-purple/80 rounded-full opacity-50"></div>
                                        <div className="pl-3 text-xs italic text-gray-500 dark:text-gray-400 bg-surface-light/50 dark:bg-surface-darker/50 p-2 rounded-r-lg border border-border-light/50 dark:border-border-dark/50 shadow-sm">
                                            <span className="font-bold text-accent-purple text-[10px] uppercase tracking-wider block mb-1">{t('hive.internalMonologue')}</span>
                                            {msg.thought}
                                        </div>
                                    </div>
                                )}

                                <div className={`max-w-[85%] rounded-xl p-4 shadow-md ${
                                    msg.role === 'user' 
                                        ? 'bg-accent-purple text-white' 
                                        : 'bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark'
                                }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {msg.role === 'user' ? <UserCircleIcon className="h-5 w-5"/> : <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded text-white ${
                                            msg.agent === 'Orchestrator' ? 'bg-purple-600' :
                                            msg.agent === 'Scout' ? 'bg-indigo-500' :
                                            msg.agent === 'Guardian' ? 'bg-red-500' : 
                                            msg.agent === 'Simulation' ? 'bg-amber-500' :
                                            'bg-green-500'
                                        }`}>{t(`hive.agent${msg.agent}`, { defaultValue: msg.agent })}</span>}
                                        <span className={`text-xs ${msg.role === 'user' ? 'text-white/80' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    
                                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : 'text-text-light dark:text-text-dark'}`}>
                                        {msg.content}
                                    </div>
                                    
                                    {/* Ethical Check Visualization */}
                                    {msg.metadata?.type === 'ethical_check' && msg.metadata.data && (
                                        <div className="mt-4 bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <ShieldExclamationIcon className="h-5 w-5 text-accent-purple" />
                                                    <h3 className="font-bold text-text-light dark:text-text-dark text-sm">{t('hive.guardianEthicsAudit')}</h3>
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded ${
                                                    msg.metadata.data.score > 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {t('hive.score', { score: msg.metadata.data.score })}
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                                                    <h4 className="font-bold text-red-800 dark:text-red-300 mb-1">{t('hive.biasRisks')}</h4>
                                                    <ul className="list-disc list-inside text-text-light dark:text-text-dark">
                                                        {(msg.metadata.data.biasRisks || []).map((r: any, i: number) => (
                                                            <li key={i}>{r.risk}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                                                    <h4 className="font-bold text-orange-800 dark:text-orange-300 mb-1">{t('hive.privacy')}</h4>
                                                     <ul className="list-disc list-inside text-text-light dark:text-text-dark">
                                                        {(msg.metadata.data.privacyConcerns || []).map((p: any, i: number) => (
                                                            <li key={i}>{p}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-xs text-gray-500 italic">{msg.metadata.data.summary}</p>
                                        </div>
                                    )}

                                    {/* Simulation Visualizer */}
                                    {msg.metadata?.type === 'simulation' && msg.metadata.data && (
                                        <div className="mt-4 bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark rounded-lg p-4">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('hive.monteCarloSimulation')}</p>
                                            <MonteCarloVisualizer data={msg.metadata.data} />
                                        </div>
                                    )}

                                    {/* Memory Read Visualizer */}
                                    {msg.metadata?.type === 'memory_read' && (
                                        <div className="mt-4 bg-yellow-50/50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50 text-xs">
                                            <p className="font-bold text-yellow-800 dark:text-yellow-200 mb-1">{t('hive.semanticMemoryRecalled')}</p>
                                            <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300">
                                                {(msg.metadata.data as TVectorMemory[]).map((mem, midx) => (
                                                    <li key={midx}>{mem.content}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Integromat Data Visualization */}
                                    {msg.metadata?.type === 'jira_ticket_created' && (
                                        <div className="mt-4 bg-green-50/50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200/50 dark:border-green-800/50 flex items-center gap-3">
                                            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                                                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-green-900 dark:text-green-100 text-sm">{t('hive.ticketCreated')}</p>
                                                <p className="text-xs text-green-800 dark:text-green-200">{t('hive.id', { id: msg.metadata.data.id })} • {msg.metadata.data.title}</p>
                                            </div>
                                        </div>
                                    )}

                                     {msg.metadata?.type === 'jira' && msg.metadata.data && (
                                        <div className="mt-4 space-y-2">
                                            {(msg.metadata.data as any[]).map((ticket, idx) => (
                                                <div key={idx} className="bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-lg border-l-4 border-accent-purple flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{ticket.id}</span>
                                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.title}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('hive.assignee', { assignee: ticket.assignee })}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ticket.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'}`}>{t(`hive.priority${ticket.priority}`, { defaultValue: ticket.priority })}</span>
                                                        <span className="text-[10px] text-gray-500">{t(`hive.status${ticket.status.replace(/\s+/g, '')}`, { defaultValue: ticket.status })}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                     {msg.metadata?.type === 'github' && msg.metadata.data && (
                                        <div className="mt-4 space-y-2 font-mono text-xs">
                                            {(msg.metadata.data as any[]).map((commit, idx) => (
                                                <div key={idx} className="bg-surface-light dark:bg-surface-darker p-2 rounded border border-border-light dark:border-border-dark flex justify-between">
                                                    <div>
                                                        <span className="text-purple-600 dark:text-purple-400 font-bold">{commit.id.substring(0,7)}</span>
                                                        <span className="text-text-light dark:text-text-dark ml-2">{commit.message}</span>
                                                    </div>
                                                    <span className="text-gray-500">{commit.author}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Veo Video Player (Sprint 8) */}
                                    {msg.metadata?.type === 'video' && msg.metadata.data?.uri && (
                                        <div className="mt-4 rounded-lg overflow-hidden border border-border-light dark:border-border-dark bg-surface-darker">
                                            <video 
                                                src={msg.metadata.data.uri} 
                                                controls 
                                                autoPlay 
                                                loop
                                                className="w-full h-auto aspect-video object-contain"
                                            />
                                            <div className="p-2 bg-surface-darker/80 text-white text-xs flex justify-between items-center">
                                                <span className="font-bold flex items-center gap-1"><FilmIcon className="h-3 w-3"/> {t('hive.generatedWithVeo')}</span>
                                                <span className="opacity-70 truncate max-w-[200px]">{msg.metadata.data.prompt}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Diagram Renderers (Sprint 8 Part 2) */}
                                    {msg.metadata?.type === 'bpmn' && msg.metadata.data && (
                                        <div className="mt-4 bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark rounded-lg p-4 overflow-x-auto custom-scrollbar">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('hive.bpmnProcess')}</p>
                                            <div className="min-w-[600px]">
                                                <RenderBpmnFlow flow={msg.metadata.data} />
                                            </div>
                                        </div>
                                    )}

                                    {msg.metadata?.type === 'sequence' && msg.metadata.data && (
                                        <div className="mt-4 bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark rounded-lg p-4 overflow-x-auto custom-scrollbar">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('hive.sequenceDiagram')}</p>
                                            <div className="min-w-[600px]">
                                                <RenderSequenceDiagram diagram={msg.metadata.data} />
                                            </div>
                                        </div>
                                    )}

                                    {msg.metadata?.type === 'mindmap' && msg.metadata.data && (
                                        <div className="mt-4 bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark rounded-lg p-4 overflow-hidden relative" style={{ height: '400px' }}>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2 absolute top-2 left-2 z-10">{t('hive.mindMap')}</p>
                                            <svg width="100%" height="100%" viewBox="0 0 1000 600">
                                                <RenderMindMapNode 
                                                    node={msg.metadata.data} 
                                                    angleRange={[0, 2 * Math.PI]} 
                                                    depth={1} 
                                                    cx={500} 
                                                    cy={300} 
                                                />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Presentation Viewer (Sprint 8 Part 3) */}
                                    {msg.metadata?.type === 'presentation' && msg.metadata.data && Array.isArray(msg.metadata.data) && (
                                        <div className="mt-4">
                                            <PresentationViewer 
                                                slides={msg.metadata.data} 
                                                title={activeInitiative?.title || t('hive.presentation')} 
                                                sector={activeInitiative?.sector || t('hive.general')} 
                                            />
                                        </div>
                                    )}

                                     {msg.metadata?.type === 'sql' && msg.metadata.data && (
                                        <div className="mt-4 overflow-x-auto custom-scrollbar">
                                            <table className="min-w-full text-xs text-left border border-border-light dark:border-border-dark">
                                                <thead className="bg-surface-light dark:bg-surface-darker font-bold">
                                                    <tr>
                                                        {Object.keys(msg.metadata.data[0] || {}).map(key => (
                                                            <th key={key} className="px-2 py-1 border border-border-light dark:border-border-dark">{key}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(msg.metadata.data as any[]).map((row, idx) => (
                                                        <tr key={idx} className="bg-surface-light dark:bg-surface-darker">
                                                            {Object.values(row).map((val: any, vIdx) => (
                                                                <td key={vIdx} className="px-2 py-1 border border-border-light dark:border-border-dark">{val}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Structured Intelligence Cards */}
                                    {msg.metadata?.type === 'competitors' && msg.metadata.data && (
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(msg.metadata.data as any[]).map((comp, idx) => (
                                                <div key={idx} className="bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100/50 dark:border-indigo-800/50">
                                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-100">{comp.name}</h4>
                                                    <div className="text-xs mt-1 space-y-1">
                                                        <p className="text-green-700 dark:text-green-300"><strong>+</strong> {comp.strength}</p>
                                                        <p className="text-red-700 dark:text-red-300"><strong>-</strong> {comp.weakness}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Citations */}
                                    {msg.metadata?.sources && (
                                        <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark">
                                            <p className="text-xs font-bold text-gray-500 mb-1">{t('hive.citations')}</p>
                                            <ul className="list-disc list-inside text-xs text-indigo-600 dark:text-indigo-400">
                                                {(msg.metadata.sources as any[]).map((s, idx) => (
                                                    <li key={idx}>
                                                        <a href={s.uri} target="_blank" rel="noreferrer" className="hover:underline">{s.title}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {/* APPROVAL CARD */}
                        {state.status === 'waiting_approval' && state.approvalRequest && (
                            <div className="flex justify-start animate-fade-in-down">
                                <div className="max-w-[85%] rounded-xl p-0 shadow-lg border border-yellow-400/50 bg-surface-light dark:bg-surface-darker overflow-hidden">
                                    <div className="bg-yellow-100/50 dark:bg-yellow-900/40 p-3 flex items-center gap-2 border-b border-yellow-200/50 dark:border-yellow-800/50">
                                        <ShieldExclamationIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                        <span className="font-bold text-yellow-800 dark:text-yellow-200 text-sm">{t('hive.approvalRequired')}</span>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-text-light dark:text-text-dark mb-3">
                                            <span className="font-bold">{t(`hive.agent${state.approvalRequest.agent}`, { defaultValue: state.approvalRequest.agent })}</span> {t('hive.wantsToPerform')} <span className="font-bold text-red-500">{state.approvalRequest.actionType.toUpperCase()}</span> {t('hive.action')}
                                        </p>
                                        <div className="bg-surface-light dark:bg-surface-darker p-3 rounded border border-border-light dark:border-border-dark font-mono text-xs text-gray-600 dark:text-gray-300 mb-4">
                                            {state.approvalRequest.summary}
                                            <pre className="mt-2 text-[10px] opacity-70">
                                                {JSON.stringify(state.approvalRequest.data, null, 2)}
                                            </pre>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleApproval(true)}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2"
                                            >
                                                <CheckCircleIcon className="h-4 w-4" /> {t('hive.approve')}
                                            </button>
                                            <button 
                                                onClick={() => handleApproval(false)}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2"
                                            >
                                                <XCircleIcon className="h-4 w-4" /> {t('hive.reject')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="flex justify-start items-center gap-3">
                                <div className="bg-surface-light dark:bg-surface-darker rounded-lg p-3 flex items-center gap-2 border border-border-light dark:border-border-dark">
                                    <Spinner />
                                    <span className="text-xs text-text-light dark:text-text-dark">{t('hive.agentsAreWorking')}</span>
                                </div>
                                <button 
                                    onClick={handleStop}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold border border-red-300 flex items-center gap-1"
                                >
                                    <StopIcon className="h-4 w-4" /> {t('hive.stopLoop')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-surface-light dark:bg-surface-darker border-t border-border-light dark:border-border-dark">
                        <div className="flex gap-4">
                            <input 
                                type="text" 
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder={selectedInitiativeId ? t('hive.commandTheSwarm') : t('hive.selectProjectFirstInput')}
                                disabled={!selectedInitiativeId || state.status === 'waiting_approval' || (isProcessing && !stopRef.current)}
                                className="flex-grow p-4 bg-surface-light dark:bg-surface-darker border border-border-light dark:border-border-dark focus:border-accent-purple rounded-xl focus:ring-0 text-text-light dark:text-text-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                            />
                            <Button onClick={() => handleStart()} disabled={isProcessing || !goal.trim() || !selectedInitiativeId || state.status === 'waiting_approval'} className="px-8 rounded-xl">
                                {t('hive.activate')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: Memory Panel */}
                <div className="w-80 flex-shrink-0 hidden xl:block">
                    <MemoryPanel memories={memories} />
                </div>
            </div>
        </div>
    );
};
