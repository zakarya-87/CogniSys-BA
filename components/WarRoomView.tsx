
import React from 'react';

export const WarRoomView: React.FC = () => {
    return (
        <div className="flex-1 overflow-hidden flex flex-col p-6 h-full relative">
            <style>{`
                .agent-glow-indigo {
                    box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
                }
                .agent-glow-purple {
                    box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
                }
                .agent-glow-green {
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
                }
                .agent-glow-red {
                    box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-accent-red animate-pulse-slow"></span>
                        The War Room: Autonomous Strategy Debate
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-text-muted-dark mt-1">
                        Topic: <span className="text-gray-900 dark:text-gray-300 font-medium">Q3 Market Expansion vs. Product Consolidation</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-border-dark text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <span className="material-icons-outlined text-base">pause</span> Pause Debate
                    </button>
                    <button className="px-4 py-2 bg-accent-teal hover:bg-accent-teal/80 text-white text-sm font-medium rounded-md shadow-lg shadow-accent-teal/20 transition-all flex items-center gap-2">
                        <span className="material-icons-outlined text-base">gavel</span> Force Consensus
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex-[2] bg-surface-light dark:bg-surface-darker border border-gray-200 dark:border-border-dark rounded-xl relative overflow-hidden flex flex-col">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                        </div>
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-border-dark flex justify-between items-center z-10 bg-surface-light/50 dark:bg-surface-darker/50 backdrop-blur-sm">
                            <span className="text-xs font-mono font-medium text-gray-500 uppercase tracking-wider">Active Agents: 4</span>
                            <span className="text-xs font-mono text-accent-emerald flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald"></span> Live Session
                            </span>
                        </div>
                        <div className="flex-1 relative flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 dark:opacity-40" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="line-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0"></stop>
                                        <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1"></stop>
                                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"></stop>
                                    </linearGradient>
                                </defs>
                                <circle cx="50%" cy="50%" fill="none" r="150" stroke="#334155" strokeDasharray="4 4" strokeWidth="1"></circle>
                                <line stroke="url(#line-gradient)" strokeWidth="2" x1="50%" x2="50%" y1="50%" y2="25%">
                                    <animate attributeName="stroke-dasharray" dur="2s" repeatCount="indefinite" values="0,100;100,0"></animate>
                                </line>
                                <line stroke="url(#line-gradient)" strokeWidth="2" x1="50%" x2="75%" y1="50%" y2="50%"></line>
                                <line stroke="url(#line-gradient)" strokeWidth="2" x1="50%" x2="50%" y1="50%" y2="75%"></line>
                                <line stroke="url(#line-gradient)" strokeWidth="2" x1="50%" x2="25%" y1="50%" y2="50%"></line>
                            </svg>
                            <div className="relative z-10 w-32 h-32 rounded-full border-2 border-accent-teal/30 bg-surface-light dark:bg-surface-dark flex flex-col items-center justify-center text-center p-2 shadow-2xl shadow-accent-teal/10">
                                <div className="absolute inset-0 rounded-full border border-accent-teal/20 animate-ping opacity-20"></div>
                                <span className="material-icons-round text-3xl text-accent-teal mb-1">hub</span>
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Nexus</span>
                                <span className="text-xs font-bold text-gray-800 dark:text-white leading-tight">Strategic<br/>Core</span>
                            </div>
                            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center animate-float">
                                <div className="relative group">
                                    <div className="w-16 h-16 rounded-full bg-surface-light dark:bg-surface-dark border-2 border-accent-teal flex items-center justify-center agent-glow-purple transition-transform transform group-hover:scale-110">
                                        <span className="material-icons-round text-2xl text-accent-teal">psychology</span>
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-accent-teal rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-background-dark">!</div>
                                    <div className="absolute top-0 left-20 w-64 p-3 bg-surface-light dark:bg-surface-dark/90 backdrop-blur-md rounded-lg rounded-tl-none border border-accent-teal/30 shadow-xl z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                        <p className="text-xs text-gray-300">Synthesizing risk vectors. The consolidation strategy aligns with 78% of Q4 KPIs.</p>
                                    </div>
                                </div>
                                <span className="mt-2 text-xs font-bold text-accent-teal">Orchestrator</span>
                                <span className="text-[10px] text-gray-500">System Lead</span>
                            </div>
                            <div className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center animate-float" style={{ animationDelay: '1s' }}>
                                <div className="relative group">
                                    <div className="w-14 h-14 rounded-full bg-surface-light dark:bg-surface-dark border-2 border-accent-emerald flex items-center justify-center agent-glow-green transition-transform transform group-hover:scale-110">
                                        <span className="material-icons-round text-2xl text-accent-emerald">travel_explore</span>
                                    </div>
                                </div>
                                <span className="mt-2 text-xs font-bold text-accent-emerald">Scout</span>
                                <span className="text-[10px] text-gray-500">Market Intel</span>
                            </div>
                            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center animate-float" style={{ animationDelay: '0.5s' }}>
                                <div className="relative group">
                                    <div className="w-14 h-14 rounded-full bg-surface-light dark:bg-surface-dark border-2 border-accent-teal flex items-center justify-center agent-glow-purple transition-transform transform group-hover:scale-110">
                                        <span className="material-icons-round text-2xl text-accent-teal">shield</span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-emerald rounded-full border-2 border-background-dark"></div>
                                </div>
                                <span className="mt-2 text-xs font-bold text-accent-teal">Guardian</span>
                                <span className="text-[10px] text-gray-500">Compliance</span>
                            </div>
                            <div className="absolute left-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center animate-float" style={{ animationDelay: '1.5s' }}>
                                <div className="relative group">
                                    <div className="w-14 h-14 rounded-full bg-surface-light dark:bg-surface-dark border-2 border-accent-red flex items-center justify-center agent-glow-red transition-transform transform group-hover:scale-110">
                                        <span className="material-icons-round text-2xl text-accent-red">warning</span>
                                    </div>
                                    <div className="absolute -bottom-10 -right-20 w-48 p-2 bg-accent-red/10 border border-accent-red/30 rounded-md backdrop-blur-sm z-20">
                                        <div className="flex gap-2 items-center">
                                            <div className="flex space-x-0.5 h-3 items-end">
                                                <div className="w-1 bg-accent-red h-full animate-pulse"></div>
                                                <div className="w-1 bg-accent-red h-2/3 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-1 bg-accent-red h-1/2 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="text-[10px] text-accent-red font-bold">Objection Raised</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="mt-2 text-xs font-bold text-accent-red">Sentry</span>
                                <span className="text-[10px] text-gray-500">Risk Analysis</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                <span className="material-icons-outlined text-accent-teal">auto_graph</span>
                                Consensus Synthesis
                            </h3>
                            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Forming... 68%</span>
                        </div>
                        <div className="flex-1 flex gap-6">
                            <div className="flex-1 space-y-3">
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Current trajectory favors <strong className="text-accent-teal">Product Consolidation</strong>. Scout reports market saturation in adjacent sectors, reducing expansion viability. However, Sentry flags a <span className="text-accent-red">significant risk</span> of competitor leapfrogging if R&D budget is cut. 
                                </p>
                                <div className="bg-gray-100 dark:bg-surface-darker p-3 rounded-lg border border-gray-200 dark:border-border-dark">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-icons-outlined text-sm text-accent-teal">lightbulb</span>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Emerging Recommendation:</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Hybrid approach: Consolidate core product lines while maintaining a lean "Skunkworks" team for exploratory expansion.</p>
                                </div>
                            </div>
                            <div className="w-48 flex flex-col gap-3 border-l border-gray-200 dark:border-border-dark pl-6">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">Confidence</span>
                                        <span className="text-gray-900 dark:text-white">82%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-accent-teal h-full rounded-full" style={{ width: '82%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">Risk Profile</span>
                                        <span className="text-accent-red">High</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-accent-red h-full rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">Resource Load</span>
                                        <span className="text-accent-emerald">Optimal</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-accent-emerald h-full rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-96 flex flex-col bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Debate Feed</h3>
                        <div className="flex gap-2">
                            <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <span className="material-icons-outlined text-sm">filter_list</span>
                            </button>
                            <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <span className="material-icons-outlined text-sm">download</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-accent-teal/20 flex items-center justify-center border border-accent-teal/30 text-accent-teal">
                                    <span className="material-icons-round text-sm">psychology</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-accent-teal">Orchestrator</span>
                                    <span className="text-[10px] text-gray-500">11:42 AM</span>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none border border-gray-100 dark:border-border-dark shadow-sm">
                                    <p className="text-xs text-gray-700 dark:text-gray-300">Initiating debate sequence. Primary objective: Determine Q3 resource allocation.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-accent-emerald/20 flex items-center justify-center border border-accent-emerald/30 text-accent-emerald">
                                    <span className="material-icons-round text-sm">travel_explore</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-accent-emerald">Scout</span>
                                    <span className="text-[10px] text-gray-500">11:43 AM</span>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none border border-gray-100 dark:border-border-dark shadow-sm">
                                    <p className="text-xs text-gray-700 dark:text-gray-300">External data indicates a 15% drop in competitor spending on expansion. Market is contracting.</p>
                                    <div className="mt-2 flex gap-1">
                                        <span className="px-1.5 py-0.5 bg-accent-emerald/10 text-accent-emerald text-[10px] rounded border border-accent-emerald/20">Source: Bloomberg</span>
                                        <span className="px-1.5 py-0.5 bg-accent-emerald/10 text-accent-emerald text-[10px] rounded border border-accent-emerald/20">Data: Q2 Report</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-accent-red/20 flex items-center justify-center border border-accent-red/30 text-accent-red animate-pulse">
                                    <span className="material-icons-round text-sm">warning</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-accent-red">Sentry</span>
                                    <span className="text-[10px] text-gray-500">11:45 AM</span>
                                </div>
                                <div className="bg-accent-red/5 dark:bg-accent-red/10 p-3 rounded-lg rounded-tl-none border border-accent-red/20 shadow-sm">
                                    <p className="text-xs text-gray-800 dark:text-gray-200">Warning. If we contract now, we lose first-mover advantage in the APAC region. Risk probability: 78%.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-accent-teal/20 flex items-center justify-center border border-accent-teal/30 text-accent-teal">
                                    <span className="material-icons-round text-sm">shield</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-accent-teal">Guardian</span>
                                    <span className="text-[10px] text-gray-500">11:46 AM</span>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none border border-gray-100 dark:border-border-dark shadow-sm">
                                    <p className="text-xs text-gray-700 dark:text-gray-300">Noted, Sentry. However, regulatory headwinds in APAC are increasing. Consolidation is the safer compliance route.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center opacity-50">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="material-icons-round text-sm text-gray-500">more_horiz</span>
                            </div>
                            <div className="text-[10px] text-gray-500 italic">Orchestrator is processing...</div>
                        </div>
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark">
                        <div className="relative">
                            <input className="w-full bg-gray-100 dark:bg-surface-darker border-none rounded-md py-2 pl-3 pr-10 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-accent-teal" placeholder="Inject human feedback..." type="text" />
                            <button className="absolute right-2 top-1.5 text-accent-teal hover:text-accent-teal/80">
                                <span className="material-icons-round text-sm">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="fixed bottom-6 right-6 z-50">
                <button className="w-12 h-12 bg-accent-teal hover:bg-accent-teal/90 rounded-full shadow-lg shadow-accent-teal/30 flex items-center justify-center text-white transition-transform hover:scale-105">
                    <span className="material-icons-round">auto_awesome</span>
                </button>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-background-dark">3</div>
            </div>
        </div>
    );
};
