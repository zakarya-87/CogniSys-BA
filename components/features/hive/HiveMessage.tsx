
import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserCircle as UserCircleIcon, 
  ShieldAlert as ShieldExclamationIcon, 
  CheckCircle as CheckCircleIcon, 
  Film as FilmIcon 
} from 'lucide-react';
import { THiveMessage, TVectorMemory, TInitiative } from '../../../types';
import { MonteCarloVisualizer } from '../../ui/Charts';
import { RenderBpmnFlow } from '../../ui/RenderBpmnFlow';
import { RenderSequenceDiagram } from '../../ui/RenderSequenceDiagram';
import { RenderMindMapNode } from '../../ui/RenderMindMap';
import { PresentationViewer } from '../../ui/PresentationViewer';

interface HiveMessageProps {
  msg: THiveMessage;
  activeInitiative?: TInitiative;
}

export const HiveMessage: React.FC<HiveMessageProps> = ({ msg, activeInitiative }) => {
    const { t } = useTranslation('dashboard');

    return (
        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
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
    );
};
