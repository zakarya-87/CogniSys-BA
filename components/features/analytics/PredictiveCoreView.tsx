
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useCatalyst } from '../../../context/CatalystContext';
import { 
    Cpu, 
    Activity, 
    Pause, 
    XCircle, 
    Filter, 
    Maximize2, 
    ShieldCheck, 
    CheckCircle2, 
    AlertTriangle, 
    TrendingUp, 
    Layers, 
    DollarSign, 
    Zap,
    ChevronRight,
    Settings
} from 'lucide-react';

export const PredictiveCoreView: React.FC = () => {
    const monteCarloChartRef = useRef<HTMLCanvasElement>(null);
    const tornadoChartRef = useRef<HTMLCanvasElement>(null);
    const monteCarloChartInstance = useRef<Chart | null>(null);
    const tornadoChartInstance = useRef<Chart | null>(null);
    const { theme, setTheme } = useCatalyst();

    useEffect(() => {
        // Generate pseudo-random normal distribution data
        function generateData() {
            let data = [];
            for (let i = 0; i < 50; i++) {
                // Bell curve shape roughly
                let val = Math.exp(-Math.pow(i - 25, 2) / 100) * 100;
                // Add some noise
                val += Math.random() * 10;
                data.push(val);
            }
            return data;
        }

        if (monteCarloChartRef.current) {
            if (monteCarloChartInstance.current) {
                monteCarloChartInstance.current.destroy();
            }
            const ctxMC = monteCarloChartRef.current.getContext('2d');
            if (ctxMC) {
                const gradientMC = ctxMC.createLinearGradient(0, 0, 0, 400);
                gradientMC.addColorStop(0, 'rgba(139, 92, 246, 0.5)'); // Accent purple
                gradientMC.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
                
                monteCarloChartInstance.current = new Chart(ctxMC, {
                    type: 'bar',
                    data: {
                        labels: Array.from({length: 50}, (_, i) => i),
                        datasets: [{
                            label: 'Frequency',
                            data: generateData(),
                            backgroundColor: gradientMC,
                            borderColor: '#8B5CF6',
                            borderWidth: 1,
                            barPercentage: 1.0,
                            categoryPercentage: 1.0,
                            borderRadius: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#161B28',
                                titleColor: '#fff',
                                bodyColor: '#cbd5e1',
                                borderColor: '#2D3748',
                                borderWidth: 1,
                                displayColors: false,
                                callbacks: {
                                    title: (items) => `Outcome Bin: $${items[0].label}M`,
                                    label: (item) => `Probability: ${((item.raw as number) / 10).toFixed(2)}%`
                                }
                            }
                        },
                        scales: {
                            x: {
                                display: true,
                                grid: { display: false },
                                ticks: { display: false } // Hide numbers for cleaner look
                            },
                            y: {
                                display: true,
                                grid: { color: '#2D3748' } as any,
                                ticks: { color: '#64748B' }
                            }
                        }
                    }
                });
            }
        }

        if (tornadoChartRef.current) {
            if (tornadoChartInstance.current) {
                tornadoChartInstance.current.destroy();
            }
            const ctxTornado = tornadoChartRef.current.getContext('2d');
            if (ctxTornado) {
                tornadoChartInstance.current = new Chart(ctxTornado, {
                    type: 'bar',
                    data: {
                        labels: ['Market Demand', 'Raw Material Cost', 'Competitor Entry', 'Reg. Compliance'],
                        datasets: [
                            {
                                label: 'Low Estimate Impact',
                                data: [-25, -15, -10, -5],
                                backgroundColor: '#EF4444', // Danger
                                borderRadius: 4,
                                borderSkipped: false
                            },
                            {
                                label: 'High Estimate Impact',
                                data: [35, 10, 5, 2],
                                backgroundColor: '#10B981', // Success
                                borderRadius: 4,
                                borderSkipped: false
                            }
                        ]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                grid: { color: '#2D3748' } as any,
                                ticks: { color: '#64748B' },
                                stacked: true
                            },
                            y: {
                                grid: { display: false },
                                ticks: { color: '#94A3B8', font: { size: 11 } },
                                stacked: true
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                backgroundColor: '#161B28',
                                borderColor: '#2D3748',
                                borderWidth: 1
                            }
                        }
                    }
                });
            }
        }

        return () => {
            if (monteCarloChartInstance.current) {
                monteCarloChartInstance.current.destroy();
            }
            if (tornadoChartInstance.current) {
                tornadoChartInstance.current.destroy();
            }
        };
    }, []);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 h-full bg-surface-light dark:bg-surface-dark animate-in fade-in duration-700">
            <style>{`
                .neon-text {
                    text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
                }
                .status-dot-pulse {
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
                    animation: pulse-green 2s infinite;
                }
                @keyframes pulse-green {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            `}</style>

            {/* Sim-Agent Status Bar */}
            <div className="bg-surface-light dark:bg-surface-darker rounded-2xl border border-border-light dark:border-border-dark shadow-xl p-6 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 h-1 bg-accent-purple w-1/3 shadow-[0_0_15px_rgba(139, 92, 246, 0.5)] animate-pulse"></div>
                
                <div className="flex items-center gap-5">
                    <div className="relative h-14 w-14 flex items-center justify-center bg-surface-dark rounded-2xl border border-border-dark shadow-inner">
                        <Cpu className="h-7 w-7 text-accent-purple animate-pulse" />
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent-green border-2 border-surface-dark status-dot-pulse shadow-lg shadow-accent-green/20"></div>
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] mb-1">Sim-Agent: <span className="text-accent-purple neon-text">Oracle-9</span></h3>
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-text-main-light dark:text-text-main-dark tracking-tight">Stochastic Process Running</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple/30"></span>
                            <span className="text-sm font-bold text-accent-purple font-mono">Iteration: 14,203 / 50,000</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 max-w-xl mx-6">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                        <span className="text-text-muted-light dark:text-text-muted-dark">Processing Batch 4B...</span>
                        <span className="text-accent-purple font-mono">28% Complete</span>
                    </div>
                    <div className="w-full bg-surface-darker/10 dark:bg-surface-darker/40 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div className="bg-accent-purple h-full rounded-full relative transition-all duration-1000 ease-out" style={{ width: '28%' }}>
                            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[4px]"></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-text-main-light dark:text-text-main-dark hover:bg-surface-darker/10 dark:hover:bg-surface-darker/40 border border-border-light dark:border-border-dark transition-all flex items-center gap-2">
                        <Pause className="h-3 w-3 fill-current" /> Pause
                    </button>
                    <button className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-accent-red hover:bg-accent-red/90 transition-all shadow-lg shadow-accent-red/20 flex items-center gap-2">
                        <XCircle className="h-3 w-3" /> Abort
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Monte Carlo Simulation */}
                <div className="lg:col-span-2 bg-surface-light dark:bg-surface-darker rounded-3xl border border-border-light dark:border-border-dark shadow-sm flex flex-col h-[550px] overflow-hidden">
                    <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-surface-light/50 dark:bg-surface-darker/50 backdrop-blur-md">
                        <div>
                            <h2 className="text-xl font-black text-text-main-light dark:text-text-main-dark tracking-tight">Monte Carlo Simulation</h2>
                            <p className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark mt-1">Probabilistic outcome distribution (ROI vs Risk)</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="p-2.5 rounded-xl hover:bg-surface-darker/10 dark:hover:bg-surface-darker/40 text-text-muted-light dark:text-text-muted-dark transition-colors border border-border-light dark:border-border-dark">
                                <Filter className="h-4 w-4" />
                            </button>
                            <button className="p-2.5 rounded-xl hover:bg-surface-darker/10 dark:hover:bg-surface-darker/40 text-text-muted-light dark:text-text-muted-dark transition-colors border border-border-light dark:border-border-dark">
                                <Maximize2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 p-8 relative w-full h-full">
                        <canvas ref={monteCarloChartRef}></canvas>
                        <div className="absolute top-12 right-12 bg-surface-dark/90 backdrop-blur-xl border border-border-dark p-5 rounded-2xl shadow-2xl text-xs hidden md:block animate-in slide-in-from-right-4 duration-700">
                            <div className="flex justify-between gap-6 mb-3">
                                <span className="text-text-muted-dark font-bold uppercase tracking-wider text-[10px]">P90 Confidence:</span>
                                <span className="text-accent-green font-black text-sm">$4.2M</span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-text-muted-dark font-bold uppercase tracking-wider text-[10px]">Std Dev:</span>
                                <span className="text-white font-mono font-black text-sm">0.42</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 flex flex-col">
                    {/* Sensitivity Analysis */}
                    <div className="bg-surface-light dark:bg-surface-darker rounded-3xl border border-border-light dark:border-border-dark shadow-sm p-6 flex-1 min-h-[260px]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-black text-text-main-light dark:text-text-main-dark tracking-tight">Sensitivity Analysis</h2>
                                <p className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark mt-1">Key variables impacting NPV</p>
                            </div>
                            <button className="text-accent-purple font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1">
                                <Settings className="h-3 w-3" /> Configure
                            </button>
                        </div>
                        <div className="relative h-52 w-full">
                            <canvas ref={tornadoChartRef}></canvas>
                        </div>
                    </div>

                    {/* Ethical Guardian */}
                    <div className="bg-surface-light dark:bg-surface-darker rounded-3xl border border-border-light dark:border-border-dark shadow-sm flex flex-col flex-1 overflow-hidden">
                        <div className="p-5 border-b border-border-light dark:border-border-dark bg-surface-darker/5 dark:bg-surface-darker/20 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent-cyan/10 rounded-lg">
                                    <ShieldCheck className="h-5 w-5 text-accent-cyan" />
                                </div>
                                <h2 className="text-base font-black text-text-main-light dark:text-text-main-dark tracking-tight">Ethical Guardian</h2>
                            </div>
                            <span className="bg-accent-green/10 text-accent-green text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-accent-green/20">AUDIT PASSING</span>
                        </div>
                        <div className="p-0 overflow-hidden flex-1">
                            <div className="p-4 border-b border-border-light dark:border-border-dark flex items-start gap-4 hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20 transition-all cursor-pointer group">
                                <div className="mt-1">
                                    <CheckCircle2 className="h-4 w-4 text-accent-green" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark group-hover:text-accent-purple transition-colors">Bias Check: Demographic Parity</p>
                                    <p className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark mt-1">Disparity index 0.04 (within &lt;0.1 threshold)</p>
                                </div>
                                <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark font-mono">10:42 AM</span>
                            </div>
                            <div className="p-4 border-b border-border-light dark:border-border-dark flex items-start gap-4 hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20 transition-all cursor-pointer group">
                                <div className="mt-1">
                                    <CheckCircle2 className="h-4 w-4 text-accent-green" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark group-hover:text-accent-purple transition-colors">Privacy: PII Redaction</p>
                                    <p className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark mt-1">14 columns hashed via SHA-256</p>
                                </div>
                                <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark font-mono">10:41 AM</span>
                            </div>
                            <div className="p-4 flex items-start gap-4 hover:bg-accent-yellow/5 transition-all cursor-pointer border-l-4 border-l-accent-yellow bg-accent-yellow/5 group">
                                <div className="mt-1">
                                    <AlertTriangle className="h-4 w-4 text-accent-yellow" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark group-hover:text-accent-purple transition-colors">Data Drift Warning</p>
                                    <p className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark mt-1">Input feature 'Market_Vol' shifted by 12%</p>
                                </div>
                                <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark font-mono">09:15 AM</span>
                            </div>
                        </div>
                        <div className="p-3 border-t border-border-light dark:border-border-dark bg-surface-darker/5 dark:bg-surface-darker/20">
                            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-purple hover:text-accent-purple/80 transition-colors w-full py-2 flex items-center justify-center gap-2">
                                View Full Compliance Report <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pb-8">
                <div className="bg-surface-light dark:bg-surface-darker p-6 rounded-3xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-accent-green/10 rounded-xl group-hover:bg-accent-green group-hover:text-white transition-all">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">Confidence Interval</p>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-text-main-light dark:text-text-main-dark tracking-tight">95%</span>
                        <span className="text-xs font-black text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full">+2.4%</span>
                    </div>
                </div>
                <div className="bg-surface-light dark:bg-surface-darker p-6 rounded-3xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-accent-purple/10 rounded-xl group-hover:bg-accent-purple group-hover:text-white transition-all">
                            <Layers className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">Iterations</p>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-text-main-light dark:text-text-main-dark tracking-tight">50k</span>
                        <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">Target</span>
                    </div>
                </div>
                <div className="bg-surface-light dark:bg-surface-darker p-6 rounded-3xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-accent-yellow/10 rounded-xl group-hover:bg-accent-yellow group-hover:text-white transition-all">
                            <DollarSign className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">Compute Cost</p>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-text-main-light dark:text-text-main-dark tracking-tight">$14.20</span>
                        <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">/hr</span>
                    </div>
                </div>
                <div className="bg-surface-light dark:bg-surface-darker p-6 rounded-3xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-accent-cyan/10 rounded-xl group-hover:bg-accent-cyan group-hover:text-white transition-all">
                            <Zap className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em]">Model Version</p>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-text-main-light dark:text-text-main-dark tracking-tight">v4.0.2</span>
                        <span className="text-[10px] font-black text-accent-cyan bg-accent-cyan/10 px-3 py-1 rounded-full uppercase tracking-widest">Latest</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
