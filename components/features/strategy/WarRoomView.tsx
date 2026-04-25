
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative } from '../../../types';
import { ShieldAlert, Zap, Users, MessageSquare, Terminal, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { Button } from '../../ui/Button';

interface WarRoomViewProps {
    initiatives: TInitiative[];
}

export const WarRoomView: React.FC<WarRoomViewProps> = ({ initiatives }) => {
    const { t } = useTranslation(['dashboard']);
    const [crisisLevel, setCrisisLevel] = useState<'low' | 'medium' | 'high'>('medium');

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 font-mono relative selection:bg-accent-red/30 selection:text-white">
            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none bg-scanline opacity-[0.03] z-50"></div>
            
            {/* Header / StatusBar */}
            <div className="h-14 border-b border-red-900/30 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent-red animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
                        <span className="text-xs font-black tracking-[0.3em] uppercase">War Room :: Alpha</span>
                    </div>
                    <div className="h-4 w-px bg-red-900/30"></div>
                    <div className="flex gap-4 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        <span>SYS: COGNISYS_CORE</span>
                        <span>NET: ENCRYPTED_V3</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/20 px-3 py-1 rounded">
                        <Users className="h-3 w-3 text-accent-red" />
                        <span className="text-[10px] font-bold">5 ACTIVE AGENTS</span>
                    </div>
                </div>
            </div>

            {/* Main Battle Grid */}
            <div className="flex-1 overflow-hidden grid grid-cols-12 gap-px bg-red-900/10 p-4 relative">
                {/* Left Panel: Primary Alerts */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                    {/* Main Critical Alert */}
                    <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/30 rounded-lg p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldAlert className="h-24 w-24 text-accent-red" />
                        </div>
                        <div className="flex gap-4 items-start relative z-10">
                            <div className="bg-accent-red/20 p-4 rounded-xl">
                                <AlertTriangle className="h-8 w-8 text-accent-red" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-accent-red mb-2 uppercase tracking-tighter">CRITICAL CONFLICT DETECTED</h3>
                                <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-2xl font-sans">
                                    Strategic overlap between <span className="text-white font-bold">'Project Phoenix'</span> and <span className="text-white font-bold">'Project Icarus'</span>. Concurrent resource requirements for <span className="font-mono text-accent-red">DATA_CORE_PROVISIONING</span> exceed max throughput by 42%.
                                </p>
                                <div className="flex gap-3">
                                    <Button className="bg-accent-red hover:bg-red-600 text-white border-none text-[10px] h-9 font-black px-6">DEPLOY MITIGATION</Button>
                                    <Button variant="outline" className="border-red-900/50 text-accent-red hover:bg-red-950/30 text-[10px] h-9 font-black">ANALYZE SECONDARY IMPACT</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
                             <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                <span>Threat Level</span>
                                <Zap className="h-3 w-3 text-accent-amber" />
                             </div>
                             <div className="text-2xl font-black text-white">MODERATE</div>
                             <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-accent-amber w-1/2"></div>
                             </div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
                             <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                <span>Latency</span>
                                <Terminal className="h-3 w-3 text-accent-emerald" />
                             </div>
                             <div className="text-2xl font-black text-white">12ms</div>
                             <div className="flex items-center gap-1">
                                <span className="text-[10px] text-accent-emerald">OPTIMAL</span>
                                <div className="flex-1 h-px bg-accent-emerald/20"></div>
                             </div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
                             <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                <span>Personnel</span>
                                <Users className="h-3 w-3 text-accent-purple" />
                             </div>
                             <div className="text-2xl font-black text-white">SECURE</div>
                             <div className="text-[10px] text-slate-500">ALL STAKEDHOLDERS ALIGNED</div>
                        </div>
                    </div>

                    {/* Live Intelligence Feed */}
                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg flex-1 min-h-[400px] flex flex-col">
                        <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[.3em]">INTELLIGENCE_STREAM</span>
                            <div className="flex gap-2">
                                <div className="w-1 h-1 rounded-full bg-accent-red"></div>
                                <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            </div>
                        </div>
                        <div className="flex-1 p-4 font-mono text-[11px] space-y-3 overflow-y-auto custom-scrollbar">
                            <div className="flex gap-4 group">
                                <span className="text-slate-600 shrink-0">14:02:11</span>
                                <span className="text-accent-purple font-bold">[ORCHESTRATOR]</span>
                                <span className="text-slate-300">New competitive move detected: Competitor X announced LLM module.</span>
                            </div>
                            <div className="flex gap-4 group">
                                <span className="text-slate-600 shrink-0">14:02:45</span>
                                <span className="text-accent-emerald font-bold">[OPTIMIZER]</span>
                                <span className="text-slate-300">Recalculating vision trajectory for Q4. Confidence 94%.</span>
                            </div>
                            <div className="flex gap-4 group animate-pulse">
                                <span className="text-slate-600 shrink-0">14:05:01</span>
                                <span className="text-accent-red font-bold">[GUARDIAN]</span>
                                <span className="text-slate-300">Warning: Ethical deviation in automated procurement script.</span>
                            </div>
                            <div className="flex gap-4 group">
                                <span className="text-slate-600 shrink-0">14:07:22</span>
                                <span className="text-accent-blue font-bold">[SYSTEM]</span>
                                <span className="text-slate-400">Memory cleanup complete. 4.2GB freed.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Active Response */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col gap-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[.3em] text-center border-b border-slate-800 pb-4">RESPONSE_PROTOCOLS</h4>
                        <div className="grid grid-cols-2 gap-3">
                             <button className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-accent-red transition-all group">
                                 <Flame className="h-6 w-6 text-slate-500 group-hover:text-accent-red" />
                                 <span className="text-[9px] font-bold uppercase">Emergency Shift</span>
                             </button>
                             <button className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-accent-emerald transition-all group">
                                 <ShieldCheck className="h-6 w-6 text-slate-500 group-hover:text-accent-emerald" />
                                 <span className="text-[9px] font-bold uppercase">Lock Baseline</span>
                             </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="h-4 w-4 text-accent-purple" />
                            <span className="text-[10px] font-black uppercase tracking-[.3em]">SECURE_CHAT</span>
                        </div>
                        <div className="flex-1"></div>
                        <div className="relative">
                            <input className="w-full bg-black/40 border border-slate-800 rounded px-4 py-3 text-[10px] focus:ring-1 focus:ring-red-900/50 focus:border-red-900/50 outline-none placeholder:text-slate-700" placeholder="ENTER COMMAND..." />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-700">⏎ SEND</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Status Bar */}
            <div className="h-8 bg-accent-red flex items-center px-4 justify-between shrink-0 z-20">
                <span className="text-[9px] font-black text-red-950 uppercase tracking-[.5em]">SYSTEM_STABLE_V4.2.1-PROD</span>
                <span className="text-[9px] font-black text-red-950 uppercase tracking-[.2em]">{new Date().toISOString()}</span>
            </div>
        </div>
    );
};
