
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TInitiative } from '../../../types';
import { Eye, Target, TrendingUp, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../ui/Button';

interface VisionBoardProps {
    initiatives: TInitiative[];
}

export const VisionBoard: React.FC<VisionBoardProps> = ({ initiatives }) => {
    const { t } = useTranslation(['dashboard']);
    const [selectedInitiative, setSelectedInitiative] = useState<TInitiative | null>(initiatives[0] || null);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Eye className="h-10 w-10 text-accent-purple" />
                        Vision Board
                    </h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-2 font-medium">Visualise the strategic future of your portfolio.</p>
                </div>
                <Button className="bg-accent-purple shadow-lg shadow-accent-purple/25">
                    <Plus className="h-4 w-4 mr-2" />
                    New Vision artifact
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Vision Pillars */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Target className="h-32 w-32" />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] font-bold text-accent-purple uppercase tracking-[0.2em] mb-4 block">Strategic Goal</span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Market Dominance 2026</h3>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-6">
                                Achieve 35% market share in the MENA logistics sector through AI-driven route optimization and predictive warehousing.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-accent-purple">75% Complete</span>
                                <div className="flex-1 h-1.5 bg-accent-purple/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent-purple w-3/4 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-accent-purple to-indigo-600 p-8 rounded-3xl shadow-xl shadow-accent-purple/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Sparkles className="absolute -bottom-4 -right-4 h-24 w-24 text-white/10" />
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] mb-4 block">AI Insight</span>
                        <h3 className="text-2xl font-bold text-white mb-4">Recursive Growth Pattern</h3>
                        <p className="text-sm text-white/80 leading-relaxed mb-6">
                            By leveraging shared data between Agritech and Fintech initiatives, we can reduce CAC by an estimated 22% in Q4.
                        </p>
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-fit text-xs font-bold bg-white/5">
                            EXPLORE SYNERGY
                        </Button>
                    </div>

                    <div className="md:col-span-2 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-accent-emerald" />
                                Portfolio Trajectory
                            </h3>
                            <select className="bg-surface-darker/5 dark:bg-surface-darker/20 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none">
                                <option>Next 12 Months</option>
                                <option>Next 3 Years</option>
                            </select>
                        </div>
                        <div className="aspect-[21/9] w-full bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl flex items-center justify-center border border-dashed border-border-light dark:border-border-dark">
                             <div className="text-center">
                                <ImageIcon className="h-10 w-10 text-text-muted-light/20 dark:text-text-muted-dark/20 mx-auto mb-2" />
                                <span className="text-[10px] font-bold text-text-muted-light/40 uppercase tracking-widest">Growth Analytics Visualisation</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Quick Access */}
                <div className="space-y-6">
                    <div className="bg-surface-darker/5 dark:bg-surface-darker/30 p-6 rounded-3xl border border-border-light dark:border-border-dark">
                         <h4 className="text-[10px] font-bold uppercase text-text-muted-light dark:text-text-muted-dark tracking-[0.2em] mb-4">Core Principles</h4>
                         <div className="space-y-4">
                             {['AI-Native First', 'Recursive Scalability', 'Data Integrity', 'Founder Speed'].map(p => (
                                 <div key={p} className="flex items-center gap-3">
                                     <div className="h-1.5 w-1.5 rounded-full bg-accent-purple"></div>
                                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p}</span>
                                 </div>
                             ))}
                         </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-3xl shadow-sm">
                        <h4 className="text-[10px] font-bold uppercase text-text-muted-light dark:text-text-muted-dark tracking-[0.2em] mb-4">Visionary Team</h4>
                        <div className="flex -space-x-3 overflow-hidden mb-4">
                            {[1, 2, 3, 4].map(i => (
                                <img key={i} className="inline-block h-10 w-10 rounded-xl ring-4 ring-white dark:ring-surface-dark object-cover" src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${30 + i}.jpg`} alt="" />
                            ))}
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-accent-purple text-white text-xs font-bold ring-4 ring-white dark:ring-surface-dark">
                                +3
                            </div>
                        </div>
                        <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                            Ensuring strategic alignment across all engineering and product teams.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
