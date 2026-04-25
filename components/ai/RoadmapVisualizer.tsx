
import React, { useState, useEffect, useMemo } from 'react';
import { TInitiative, TRoadmap } from '../../types';
import { generateRoadmap } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';
import { 
    Calendar, 
    Zap, 
    ChevronRight, 
    Target, 
    Sparkles,
    MousePointer2,
    Clock,
    Layers
} from 'lucide-react';

interface RoadmapVisualizerProps {
    initiative: TInitiative;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const GanttChart: React.FC<{ roadmap: TRoadmap; viewMode: 'monthly' | 'quarterly' }> = ({ roadmap, viewMode }) => {
    const chartWidth = 1000;
    const headerHeight = 50;
    const rowHeight = 60;
    const phases = roadmap.phases || [];
    const milestones = roadmap.milestones || [];
    const chartHeight = Math.max(300, phases.length * rowHeight + 100);

    const timeLabels = viewMode === 'monthly' ? MONTHS : QUARTERS;
    const totalUnits = timeLabels.length;
    const colWidth = chartWidth / totalUnits;

    // Gradient definitions for SVG
    const gradients = useMemo(() => [
        { id: 'grad-purple', from: '#A855F7', to: '#7C3AED' },
        { id: 'grad-teal', from: '#2DD4BF', to: '#0D9488' },
        { id: 'grad-emerald', from: '#10B981', to: '#059669' },
        { id: 'grad-amber', from: '#F59E0B', to: '#D97706' },
        { id: 'grad-red', from: '#EF4444', to: '#DC2626' },
    ], []);

    return (
        <div className="relative overflow-x-auto custom-scrollbar bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <svg width={chartWidth} height={chartHeight + headerHeight} className="min-w-full font-sans select-none">
                <defs>
                    {gradients.map(g => (
                        <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={g.from} />
                            <stop offset="100%" stopColor={g.to} />
                        </linearGradient>
                    ))}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Vertical Grid Lines */}
                {timeLabels.map((label, i) => (
                    <g key={i}>
                        <rect 
                            x={i * colWidth} 
                            y={0} 
                            width={colWidth} 
                            height={chartHeight + headerHeight} 
                            className="fill-transparent stroke-white/5 stroke-[0.5]" 
                        />
                        <text 
                            x={i * colWidth + colWidth/2} 
                            y={30} 
                            textAnchor="middle" 
                            className="text-[10px] font-black fill-gray-500 uppercase tracking-widest"
                        >
                            {label}
                        </text>
                    </g>
                ))}

                {/* Phases (Bars) */}
                {phases.map((phase, i) => {
                    const y = headerHeight + i * rowHeight + 20;
                    
                    // Logic for mapping duration/start based on viewMode
                    let startIdx = Number(phase.startMonth) || 0;
                    let duration = Number(phase.durationMonths) || 1;
                    
                    if (viewMode === 'quarterly') {
                        startIdx = Math.floor(startIdx / 3);
                        duration = Math.max(1, Math.ceil(duration / 3));
                    }

                    const x = startIdx * colWidth + 5;
                    const width = duration * colWidth - 10;
                    const gradId = gradients[i % gradients.length].id;
                    
                    return (
                        <g key={phase.id || `phase-${i}`} className="group cursor-pointer">
                            <rect 
                                x={x} 
                                y={y} 
                                width={width} 
                                height={32} 
                                rx="16" 
                                className="fill-black opacity-40 shadow-xl" 
                            />
                            <rect 
                                x={x} 
                                y={y} 
                                width={width} 
                                height={32} 
                                rx="16" 
                                fill={`url(#${gradId})`}
                                className="opacity-80 group-hover:opacity-100 transition-all duration-300"
                                style={{ filter: 'url(#glow)' }}
                            />
                            <text 
                                x={x + 16} 
                                y={y + 20} 
                                className="text-[11px] font-black fill-white pointer-events-none drop-shadow-md"
                            >
                                {phase.name}
                            </text>
                        </g>
                    );
                })}

                {/* Milestones (Tactical Diamonds) */}
                {milestones.map((ms, i) => {
                    let monthIdx = Number(ms.month) || 0;
                    if (viewMode === 'quarterly') {
                        monthIdx = Math.floor(monthIdx / 3);
                    }
                    
                    const x = monthIdx * colWidth + colWidth/2;
                    const yOffset = phases.length * rowHeight + 80;
                    
                    return (
                        <g key={ms.id || `ms-${i}`} className="group">
                            <line 
                                x1={x} 
                                y1={headerHeight} 
                                x2={x} 
                                y2={yOffset} 
                                className="stroke-accent-red/30 stroke-1 stroke-dashed opacity-50 group-hover:opacity-100 transition-opacity" 
                            />
                            <path 
                                d={`M${x},${yOffset} L${x+8},${yOffset+8} L${x},${yOffset+16} L${x-8},${yOffset+8} Z`} 
                                className="fill-accent-red stroke-white/50 stroke-1 group-hover:scale-125 transition-transform origin-center"
                                style={{ filter: 'url(#glow)' }}
                            />
                            <text 
                                x={x} 
                                y={yOffset + 35} 
                                textAnchor="middle" 
                                className="text-[9px] font-black fill-accent-red uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity"
                            >
                                {ms.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
            
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-60 hover:opacity-100 transition-opacity">
                <MousePointer2 className="h-3 w-3 text-accent-teal" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Interactive Board</span>
            </div>
        </div>
    );
};

export const RoadmapVisualizer: React.FC<RoadmapVisualizerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [roadmap, setRoadmap] = useState<TRoadmap | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');

    useEffect(() => {
        if (initiative.artifacts?.roadmap) {
            setRoadmap(initiative.artifacts.roadmap);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateRoadmap(initiative.title, initiative.sector);
            const roadmapData = { ...result };
            setRoadmap(roadmapData);
            saveArtifact(initiative.id, 'roadmap', roadmapData);
        } catch (error) {
            console.error(error);
            setError("Tactical link failed. Check engine status.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-8 animate-fade-in p-2">
            <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 pb-6 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-accent-teal/20 rounded-xl">
                            <Calendar className="h-6 w-6 text-accent-teal" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Strategic Pulse</h2>
                    </div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-[0.2em]">Execution Roadmap & Milestone Sync</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
                        <button 
                            onClick={() => setViewMode('monthly')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-accent-teal text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Monthly
                        </button>
                        <button 
                            onClick={() => setViewMode('quarterly')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'quarterly' ? 'bg-accent-teal text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Quarterly
                        </button>
                    </div>
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 group"
                    >
                        {isLoading ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 text-accent-teal group-hover:rotate-12 transition-transform" />}
                        Generate Plan
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-2xl border border-accent-red/20 mb-4 animate-shake">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Zap className="h-3 w-3" /> System Malfunction
                    </h3>
                    <p className="text-xs opacity-80">{error}</p>
                </div>
            )}

            <div className="flex-1 min-h-[500px] flex flex-col gap-6">
                {!roadmap && !isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.02] rounded-[2.5rem] border-2 border-dashed border-white/5 p-12 group transition-all hover:border-accent-teal/20">
                        <div className="relative mb-6">
                            <Calendar className="h-16 w-16 text-gray-700 opacity-50 group-hover:text-accent-teal/40 transition-colors" />
                            <Target className="h-6 w-6 text-accent-teal absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </div>
                        <p className="text-gray-500 font-bold text-center max-w-sm uppercase tracking-widest text-[11px] leading-relaxed">
                            No strategic artifacts found. <br />
                            <span className="text-accent-teal opacity-60">Initialize the pulse generator to architect the path.</span>
                        </p>
                    </div>
                ) : isLoading ? (
                    <div className="flex-1 flex items-center justify-center bg-white/[0.02] rounded-[2.5rem] border border-white/5">
                        <div className="flex flex-col items-center gap-4">
                            <Spinner className="h-12 w-12 text-accent-teal" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] animate-pulse">Calculating Vectors...</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 space-y-6 slide-up">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-accent-purple" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">FY 2024 Blueprint</span>
                                </div>
                                <div className="flex items-center gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-accent-purple rounded-sm"></div> Current Ops</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-accent-red rotate-45"></div> Critical Target</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-teal/10 rounded-xl border border-accent-teal/20 text-[10px] font-black text-accent-teal uppercase tracking-widest">
                                <Layers className="h-3 w-3" />
                                {phases.length} Active Phases
                            </div>
                        </div>
                        
                        <div className="relative group">
                            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent-teal/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <GanttChart roadmap={roadmap!} viewMode={viewMode} />
                            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-accent-teal/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                            {milestones.slice(0, 4).map((ms, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:border-accent-red/20 transition-all">
                                    <div className="flex items-center gap-2 mb-2 text-accent-red">
                                        <Target className="h-3 w-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Milestone {idx + 1}</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-tight">{ms.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Estimated Month: {ms.month}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
