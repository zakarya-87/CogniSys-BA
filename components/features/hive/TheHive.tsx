
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { THiveState, THiveMessage, TInitiative, TVectorMemory } from '../../../types';
import { HiveService } from '../../../services/hiveService';
import { useHivePersistence } from '../../../hooks/useHivePersistence';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useCatalyst } from '../../../context/CatalystContext';
import { MemoryService } from '../../../services/memoryService';

import { 
  Trash2 as TrashIcon, 
  Search as MagnifyingGlassIcon,
  BarChart3 as PresentationChartBarIcon,
  ShieldAlert as ShieldExclamationIcon,
  Database as CircleStackIcon,
  Map as MapIcon,
  Box as CubeTransparentIcon,
  Pause,
  Square as StopIcon
} from 'lucide-react';

import { AgentAvatar } from './AgentAvatar';
import { NeuralGraph } from './NeuralGraph';
import { MemoryPanel } from './MemoryPanel';
import { HiveMessage } from './HiveMessage';
import { HiveApprovalCard } from './HiveApprovalCard';

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
            const stream = HiveService.processStepStream(currentState, activeInitiative);
            let lastState = currentState;

            for await (const message of stream as any) {
                // Update or add the message in the state
                const existingIdx = lastState.messages.findIndex(m => m.id === message.id);
                let updatedMessages = [...lastState.messages];
                
                if (existingIdx >= 0) {
                    updatedMessages[existingIdx] = message;
                } else {
                    updatedMessages.push(message);
                }

                const nextPartialState = { ...lastState, messages: updatedMessages, activeAgent: message.agent };
                lastState = nextPartialState;
                setState(nextPartialState);

                if (stopRef.current) break;
            }

            // The final state is the return value of the generator, but in JS 
            // for-await-of doesn't give the return value directly. 
            // However, processStepStream is designed to yield message objects 
            // and we manage the state transition manually or via a separate final call.
            // Let's re-run a small logic to determine completion.
            
            const nextState = { ...lastState, status: lastState.status === 'completed' ? 'completed' : 'running' };
            
            if (nextState.status === 'running' && !nextState.approvalRequest && !stopRef.current) {
                setTimeout(() => runLoop(nextState), 1500); 
            } else {
                setIsProcessing(false);
            }
        } catch (e: any) {
            console.error("Critical Hive Error:", e);
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
            await MemoryService.clear();
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
                        <div className="relative z-10 flex gap-6 flex-wrap justify-center max-w-4xl mx-auto">
                            <AgentAvatar agent="Scout" active={state.activeAgent === 'Scout'} />
                            <AgentAvatar agent="Simulation" active={state.activeAgent === 'Simulation'} />
                            <AgentAvatar agent="Orchestrator" active={state.activeAgent === 'Orchestrator'} />
                            <AgentAvatar agent="Integromat" active={state.activeAgent === 'Integromat'} />
                            <AgentAvatar agent="Guardian" active={state.activeAgent === 'Guardian'} />
                            <AgentAvatar agent="Archimedes" active={state.activeAgent === 'Archimedes'} />
                            <AgentAvatar agent="Alethea" active={state.activeAgent === 'Alethea'} />
                            <AgentAvatar agent="Chronos" active={state.activeAgent === 'Chronos'} />
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

                        {state.messages.map((msg) => (
                            <HiveMessage key={msg.id} msg={msg} activeInitiative={activeInitiative} />
                        ))}
                        
                        {/* APPROVAL CARD */}
                        {state.status === 'waiting_approval' && state.approvalRequest && (
                            <HiveApprovalCard approvalRequest={state.approvalRequest} onApproval={handleApproval} />
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
