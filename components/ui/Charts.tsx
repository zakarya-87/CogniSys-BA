
import React from 'react';
import { TMonteCarloResult, TTornadoItem } from '../../types';

export const MonteCarloVisualizer: React.FC<{ data: TMonteCarloResult }> = ({ data }) => {
    const height = 300;
    const width = 800;
    
    // Safety check for buckets
    const buckets = data?.buckets || [];
    
    if (buckets.length === 0) {
        return (
             <div className="h-[300px] w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No simulation data generated yet.</p>
             </div>
        );
    }

    const barWidth = width / buckets.length;
    const maxH = Math.max(...buckets.map(b => b.heightPercent || 0), 1);

    return (
        <div className="relative w-full group">
            <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible w-full h-auto drop-shadow-sm">
                 <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                 </defs>

                 {/* Grid Lines */}
                 {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                    <line 
                        key={i}
                        x1="0" 
                        y1={height - 20 - (height - 40) * p} 
                        x2={width} 
                        y2={height - 20 - (height - 40) * p} 
                        className="stroke-gray-100 dark:stroke-gray-800"
                        strokeWidth="1"
                    />
                 ))}

                 {/* Bars */}
                 {buckets.map((bucket, i) => {
                     const rawHeight = typeof bucket.heightPercent === 'number' ? bucket.heightPercent : 0;
                     const barH = (rawHeight / maxH) * (height - 40);
                     
                     return (
                         <g key={i} className="group/bar">
                             <rect 
                                x={i * barWidth + 2} 
                                y={height - barH - 20} 
                                width={Math.max(barWidth - 4, 1)} 
                                height={Math.max(barH, 1)} 
                                fill="url(#barGradient)"
                                className="opacity-80 group-hover/bar:opacity-100 transition-all duration-300" 
                                rx="4"
                             />
                             {/* Tooltip-like value on hover */}
                             <text 
                                x={i * barWidth + barWidth/2} 
                                y={height - barH - 25} 
                                textAnchor="middle" 
                                className="text-[10px] fill-indigo-600 dark:fill-indigo-400 font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity"
                             >
                                {Math.round(rawHeight)}%
                             </text>
                             <text 
                                x={i * barWidth + barWidth/2} 
                                y={height} 
                                textAnchor="middle" 
                                className="text-[9px] fill-gray-400 dark:fill-gray-500 font-medium"
                                fontSize="9"
                             >
                                 {bucket.range}
                             </text>
                         </g>
                     );
                 })}
            </svg>
            
            {/* Stats Overlay */}
            <div className="absolute top-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 text-xs transition-transform hover:scale-105">
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500 font-medium">P10 (Optimistic):</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">{data.p10}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500 font-medium">Mean (Expected):</span>
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">{data.mean}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500 font-medium">P90 (Pessimistic):</span>
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">{data.p90}</span>
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
             <div className="h-[200px] w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No sensitivity factors identified.</p>
             </div>
        );
    }
    
    const height = Math.max(safeItems.length * 60 + 60, 200);
    const centerX = width / 2;
    
    const maxDev = Math.max(
        ...safeItems.flatMap(i => [
            Math.abs((i.impactHigh || 0) - (i.base || 0)), 
            Math.abs((i.base || 0) - (i.impactLow || 0))
        ]), 
    1);
    
    const scale = (width / 2 - 100) / maxDev;

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl w-full h-auto shadow-inner">
                <defs>
                    <linearGradient id="lowGradient" x1="1" y1="0" x2="0" y2="0">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                    <linearGradient id="highGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                </defs>

                <line x1={centerX} y1={40} x2={centerX} y2={height - 20} className="stroke-gray-200 dark:stroke-gray-700 stroke-2" strokeDasharray="4 4" />
                
                {/* Impact Labels */}
                <text x={centerX - 100} y={30} textAnchor="end" className="text-[9px] fill-indigo-500 font-bold uppercase tracking-widest">Low Impact</text>
                <text x={centerX + 100} y={30} textAnchor="start" className="text-[9px] fill-red-500 font-bold uppercase tracking-widest">High Impact</text>

                <rect x={centerX - 60} y={10} width={120} height={24} rx="12" className="fill-gray-100 dark:fill-gray-800" />
                <text x={centerX} y={26} textAnchor="middle" className="text-[10px] fill-gray-500 dark:fill-gray-400 font-black uppercase tracking-widest">Base: {safeItems[0]?.base || 0}</text>

                {safeItems.map((item, i) => {
                    const y = 80 + i * 60;
                    const base = item.base || 0;
                    const low = item.impactLow || 0;
                    const high = item.impactHigh || 0;

                    const lowW = Math.abs(base - low) * scale;
                    const highW = Math.abs(high - base) * scale;

                    return (
                        <g key={i} className="group/tornado">
                            {/* Low Bar (Left) */}
                            <rect 
                                x={centerX - lowW} 
                                y={y - 15} 
                                width={lowW} 
                                height={30} 
                                fill="url(#lowGradient)"
                                className="opacity-80 group-hover/tornado:opacity-100 transition-opacity" 
                                rx="4"
                            />
                            {/* High Bar (Right) */}
                            <rect 
                                x={centerX} 
                                y={y - 15} 
                                width={highW} 
                                height={30} 
                                fill="url(#highGradient)"
                                className="opacity-80 group-hover/tornado:opacity-100 transition-opacity" 
                                rx="4"
                            />
                            
                            {/* Variable Label */}
                            <text x={centerX} y={y - 22} textAnchor="middle" className="text-xs font-black fill-gray-900 dark:fill-gray-100 uppercase tracking-tight">{item.variable}</text>
                            
                            {/* Values */}
                            <text x={centerX - lowW - 8} y={y + 5} textAnchor="end" className="text-[11px] font-mono font-bold fill-indigo-600 dark:fill-indigo-400">{low}</text>
                            <text x={centerX + highW + 8} y={y + 5} textAnchor="start" className="text-[11px] font-mono font-bold fill-red-600 dark:fill-red-400">{high}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
