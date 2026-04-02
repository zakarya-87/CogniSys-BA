
import React, { useState, useEffect } from 'react';
import { TInitiative, TRoadmap } from '../../types';
import { generateRoadmap } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface RoadmapVisualizerProps {
    initiative: TInitiative;
}

const CalendarDaysIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 13.5h.008v.008H12v-.008z" /></svg>;

const GanttChart: React.FC<{ roadmap: TRoadmap }> = ({ roadmap }) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalMonths = 12;
    const chartWidth = 800;
    const chartHeight = 300;
    const headerHeight = 40;
    const rowHeight = 50;
    const colWidth = chartWidth / totalMonths;

    const phases = roadmap.phases || [];
    const milestones = roadmap.milestones || [];

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <svg width={chartWidth} height={chartHeight + headerHeight} className="min-w-full">
                {/* Header Grid */}
                <g>
                    {months.map((m, i) => (
                        <g key={i}>
                            <rect x={i * colWidth} y={0} width={colWidth} height={chartHeight + headerHeight} className={`fill-transparent stroke-gray-100 dark:stroke-gray-700`} />
                            <text x={i * colWidth + colWidth/2} y={25} textAnchor="middle" className="text-xs font-bold fill-gray-500 uppercase">{m}</text>
                        </g>
                    ))}
                </g>

                {/* Phases (Bars) */}
                {phases.map((phase, i) => {
                    const y = headerHeight + i * rowHeight + 10;
                    const width = (Number(phase.durationMonths) || 1) * colWidth;
                    const x = (Number(phase.startMonth) || 0) * colWidth;
                    
                    return (
                        <g key={phase.id || `phase-${i}`}>
                            {/* Bar Shadow */}
                            <rect x={x+2} y={y+2} width={width} height={30} rx="4" className="fill-black opacity-10" />
                            {/* Main Bar */}
                            <rect 
                                x={x} 
                                y={y} 
                                width={width} 
                                height={30} 
                                rx="4" 
                                className={`${phase.color ? phase.color.replace('bg-', 'fill-') : 'fill-accent-purple'} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`} 
                            />
                            <text x={x + 10} y={y + 20} className="text-xs font-bold fill-white pointer-events-none">{phase.name}</text>
                        </g>
                    );
                })}

                {/* Milestones (Diamonds) */}
                {milestones.map((ms, i) => {
                    const x = (Number(ms.month) || 0) * colWidth + colWidth/2;
                    const y = headerHeight + phases.length * rowHeight + 30; // Place below bars
                    
                    return (
                        <g key={ms.id || `ms-${i}`}>
                            <line x1={x} y1={headerHeight} x2={x} y2={y} className="stroke-accent-red/50 stroke-1 stroke-dashed opacity-50" />
                            <path d={`M${x},${y} L${x+8},${y+8} L${x},${y+16} L${x-8},${y+8} Z`} className="fill-accent-red stroke-white dark:stroke-gray-900 stroke-2" />
                            <text x={x} y={y + 30} textAnchor="middle" className="text-[10px] font-bold fill-accent-red dark:fill-accent-red/90 uppercase">{ms.name}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const RoadmapVisualizer: React.FC<RoadmapVisualizerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [roadmap, setRoadmap] = useState<TRoadmap | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
            // Ensure colors are valid tailwind classes if AI hallucinates
            const coloredPhases = (result.phases || []).map((p, i) => ({
                ...p,
                color: ['fill-accent-purple', 'fill-accent-cyan', 'fill-accent-emerald', 'fill-accent-amber', 'fill-accent-red'][i % 5]
            }));
            const roadmapData = { ...result, phases: coloredPhases };
            setRoadmap(roadmapData);
            saveArtifact(initiative.id, 'roadmap', roadmapData);
        } catch (error) {
            console.error(error);
            setError("Failed to generate roadmap.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 mb-4">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarDaysIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Roadmap Visualizer
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        High-level strategic timeline and milestone planning (BABOK 3.4).
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : `Generate ${initiative.sector} Roadmap`}
                </Button>
            </div>

            {!roadmap && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <CalendarDaysIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Visualize the strategic path from inception to launch. Click to architect the timeline.
                    </p>
                </div>
            )}

            {roadmap && (
                <div className="flex-grow animate-fade-in-down bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">FY 2024 Strategic Plan</h3>
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-accent-purple rounded-sm"></div> Phase</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-accent-red rotate-45"></div> Milestone</span>
                        </div>
                    </div>
                    <GanttChart roadmap={roadmap} />
                </div>
            )}
        </div>
    );
};
