import React from 'react';
import { TMonteCarloResult, TTornadoItem } from '../../types';

export const MonteCarloVisualizer: React.FC<{ data: TMonteCarloResult }> = ({ data }) => {
    const height = 300;
    const width = 800;
    
    // Safety check for buckets
    const buckets = data?.buckets || [];
    
    if (buckets.length === 0) {
        return (
             <div className="h-[300px] w-full flex flex-col items-center justify-center bg-black/40 rounded-[2.5rem] border border-dashed border-white/5">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Awaiting Simulation Feed</p>
             </div>
        );
    }

    const barWidth = width / buckets.length;
    const maxH = Math.max(...buckets.map(b => b.heightPercent || 0), 1);

    return (
        <div className="relative w-full group overflow-hidden rounded-[2rem]">
            <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible w-full h-auto drop-shadow-2xl">
                 <defs>
                    <linearGradient id="mcBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2DD4BF" />
                        <stop offset="100%" stopColor="#818CF8" />
                    </linearGradient>
                    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                    </pattern>
                 </defs>

                 {/* High Density Grid */}
                 <rect width={width} height={height} fill="url(#gridPattern)" />

                 {/* Tactical Axis */}
                 <line x1="0" y1={height - 20} x2={width} y2={height - 20} className="stroke-white/10" strokeWidth="1" />

                 {/* Bars */}
                 {buckets.map((bucket, i) => {
                     const rawHeight = typeof bucket.heightPercent === 'number' ? bucket.heightPercent : 0;
                     const barH = (rawHeight / maxH) * (height - 60);
                     
                     return (
                         <g key={i} className="group/bar">
                             <rect 
                                x={i * barWidth + 4} 
                                y={height - barH - 20} 
                                width={Math.max(barWidth - 8, 2)} 
                                height={Math.max(barH, 1)} 
                                fill="url(#mcBarGradient)"
                                className="opacity-40 group-hover/bar:opacity-100 transition-all duration-500" 
                                rx="4"
                             />
                             {/* Tooltip value */}
                             <text 
                                x={i * barWidth + barWidth/2} 
                                y={height - barH - 30} 
                                textAnchor="middle" 
                                className="text-[10px] fill-accent-cyan font-black italic opacity-0 group-hover/bar:opacity-100 transition-all"
                             >
                                {Math.round(rawHeight)}%
                             </text>
                             <text 
                                x={i * barWidth + barWidth/2} 
                                y={height - 5} 
                                textAnchor="middle" 
                                className="text-[8px] fill-white/20 font-black uppercase tracking-tighter"
                             >
                                 {bucket.range}
                             </text>
                         </g>
                     );
                 })}
            </svg>
            
            {/* Tactical Confidence Cards */}
            <div className="absolute top-6 right-8 flex gap-4">
                <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl transition-transform hover:scale-105 group/stats">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 italic">Optimistic (P10)</span>
                        <span className="text-xl font-black text-accent-emerald italic tabular-nums group-hover/stats:text-white transition-colors">{data.p10}h</span>
                    </div>
                </div>
                <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl transition-transform hover:scale-105 group/stats">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 italic">Expected (P50)</span>
                        <span className="text-xl font-black text-accent-cyan italic tabular-nums group-hover/stats:text-white transition-colors">{data.p50}h</span>
                    </div>
                </div>
                <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl transition-transform hover:scale-105 group/stats">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 italic">Exposure (P90)</span>
                        <span className="text-xl font-black text-accent-red italic tabular-nums group-hover/stats:text-white transition-colors">{data.p90}h</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TornadoVisualizer: React.FC<{ items: TTornadoItem[] }> = ({ items }) => {
    const width = 800;
    const safeItems = Array.isArray(items) ? items : [];
    
    if (safeItems.length === 0) {
        return (
             <div className="h-[200px] w-full flex flex-col items-center justify-center bg-black/40 rounded-[2.5rem] border border-dashed border-white/5">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">No Sensitivity Data Isolated</p>
             </div>
        );
    }
    
    const height = Math.max(safeItems.length * 80 + 100, 300);
    const centerX = width / 2;
    
    const maxDev = Math.max(
        ...safeItems.flatMap(i => [
            Math.abs((i.impactHigh || 0) - (i.base || 0)), 
            Math.abs((i.base || 0) - (i.impactLow || 0))
        ]), 
    1);
    
    const scale = (width / 2 - 180) / maxDev;

    return (
        <div className="w-full relative overflow-hidden rounded-[2.5rem] bg-black/20 p-8 group">
            <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible w-full h-auto drop-shadow-2xl">
                <defs>
                    <linearGradient id="lowTornadoGradient" x1="1" y1="0" x2="0" y2="0">
                        <stop offset="0%" stopColor="#818CF8" />
                        <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                    <linearGradient id="highTornadoGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FB7185" />
                        <stop offset="100%" stopColor="#F43F5E" />
                    </linearGradient>
                </defs>

                {/* Tactical Backdrop */}
                <rect width={width} height={height} className="fill-white/[0.01]" rx="20"/>
                
                {/* Central Axis */}
                <line x1={centerX} y1={60} x2={centerX} y2={height - 20} className="stroke-white/10 stroke-2" strokeDasharray="6 6" />
                
                {/* Baseline Label */}
                <g transform={`translate(${centerX}, 30)`}>
                    <rect x="-80" y="-15" width="160" height="30" rx="15" className="fill-white/5 border border-white/10" />
                    <text textAnchor="middle" y="5" className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Base Engine: {safeItems[0]?.base || 0}h</text>
                </g>

                {safeItems.map((item, i) => {
                    const y = 100 + i * 80;
                    const base = item.base || 0;
                    const low = item.impactLow || 0;
                    const high = item.impactHigh || 0;

                    const lowW = Math.abs(base - low) * scale;
                    const highW = Math.abs(high - base) * scale;

                    return (
                        <g key={i} className="group/tornado transition-all duration-500">
                            {/* Low Bar (Left) */}
                            <rect 
                                x={centerX - lowW} 
                                y={y - 18} 
                                width={lowW} 
                                height={36} 
                                fill="url(#lowTornadoGradient)"
                                className="opacity-20 group-hover/tornado:opacity-100 transition-all duration-500" 
                                rx="6"
                            />
                            {/* High Bar (Right) */}
                            <rect 
                                x={centerX} 
                                y={y - 18} 
                                width={highW} 
                                height={36} 
                                fill="url(#highTornadoGradient)"
                                className="opacity-20 group-hover/tornado:opacity-100 transition-all duration-500" 
                                rx="6"
                            />
                            
                            {/* Variable Label - High Contrast */}
                            <text x={centerX} y={y - 25} textAnchor="middle" className="text-[11px] font-black text-white/50 uppercase italic tracking-tighter group-hover/tornado:text-white transition-colors">{item.variable}</text>
                            
                            {/* Marginal impact numeric feedback */}
                            <text x={centerX - lowW - 12} y={y + 5} textAnchor="end" className="text-[11px] font-black text-indigo-400 italic tabular-nums transition-all group-hover/tornado:translate-x-[-4px]">{low}</text>
                            <text x={centerX + highW + 12} y={y + 5} textAnchor="start" className="text-[11px] font-black text-rose-400 italic tabular-nums transition-all group-hover/tornado:translate-x-[4px]">{high}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
