
import React, { useState, useEffect } from 'react';
import { TInitiative, TWorkshopPlan } from '../../types';
import { generateWorkshopAgenda } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface WorkshopFacilitatorProps {
    initiative: TInitiative;
}

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 13.5h.008v.008H12v-.008z" /></svg>;
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>;

export const WorkshopFacilitator: React.FC<WorkshopFacilitatorProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [goal, setGoal] = useState('Define MVP Requirements');
    const [error, setError] = useState<string | null>(null);
    const [duration, setDuration] = useState('2 hours');
    const [audience, setAudience] = useState('Stakeholders, Developers, Product Owner');
    const [plan, setPlan] = useState<TWorkshopPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.workshopPlan) {
            setPlan(initiative.artifacts.workshopPlan);
        }
    }, [initiative.id, initiative.artifacts]);

    // Timer logic
    useEffect(() => {
        let timer: any;
        if (activeItemIndex !== null && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (activeItemIndex !== null && timeLeft === 0) {
            alert("Time's up for this activity!");
            setActiveItemIndex(null); // Stop timer
        }
        return () => clearInterval(timer);
    }, [activeItemIndex, timeLeft]);

    const handleGenerate = async () => {
        if (!goal || !duration) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateWorkshopAgenda(goal, duration, audience, initiative.sector);
            setPlan(result);
            saveArtifact(initiative.id, 'workshopPlan', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate workshop agenda.");
        } finally {
            setIsLoading(false);
        }
    };

    const startItem = (index: number) => {
        if (!plan || !plan.items) return;
        setActiveItemIndex(index);
        setTimeLeft(plan.items[index].durationMinutes * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
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
                        <UserGroupIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Workshop Facilitator
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Plan structured elicitation sessions with AI-generated agendas (BABOK 10.50).
                    </p>
                </div>
            </div>

            {!plan && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Workshop Goal</label>
                            <input 
                                type="text" 
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                            <input 
                                type="text" 
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience</label>
                            <input 
                                type="text" 
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleGenerate} disabled={isLoading}>
                            {isLoading ? <Spinner /> : 'Plan Workshop'}
                        </Button>
                    </div>
                </div>
            )}

            {plan && (
                <div className="flex-grow flex flex-col gap-6 animate-fade-in-down">
                    {/* Header */}
                    <div className="bg-accent-purple/10 dark:bg-accent-purple/20 p-4 rounded-lg border border-accent-purple/20 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-accent-purple">{plan.title}</h3>
                            <p className="text-sm text-accent-purple/80">Total Duration: {plan.totalDuration}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold text-accent-purple/60">Icebreaker</p>
                            <p className="text-sm font-medium italic text-accent-purple/90">"{plan.icebreaker}"</p>
                        </div>
                    </div>

                    {/* Active Timer Bar */}
                    {activeItemIndex !== null && (
                        <div className="bg-gray-900 text-white p-4 rounded-lg flex items-center justify-between shadow-lg sticky top-0 z-10">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Now Running</p>
                                <p className="text-lg font-bold">{plan.items[activeItemIndex].activity}</p>
                            </div>
                            <div className="text-4xl font-mono font-black text-accent-emerald">
                                {formatTime(timeLeft)}
                            </div>
                            <button 
                                onClick={() => setActiveItemIndex(null)}
                                className="text-xs bg-accent-red hover:bg-accent-red/80 px-3 py-1 rounded"
                            >
                                Stop
                            </button>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {(plan.items || []).map((item, i) => (
                            <div 
                                key={i} 
                                className={`relative pl-8 border-l-2 ${activeItemIndex === i ? 'border-accent-emerald' : 'border-gray-200 dark:border-gray-700'}`}
                            >
                                {/* Time Bubble */}
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${activeItemIndex === i ? 'bg-accent-emerald border-accent-emerald' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}></div>
                                
                                <div className={`p-4 rounded-lg border transition-all ${
                                    activeItemIndex === i 
                                        ? 'bg-accent-emerald/10 dark:bg-accent-emerald/20 border-accent-emerald/20 dark:border-accent-emerald/30 shadow-md' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                }`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{item.timeSlot}</span>
                                                <h4 className="font-bold text-gray-900 dark:text-white">{item.activity}</h4>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                                            
                                            {item.relatedModule && (
                                                <span className="inline-flex items-center text-xs font-medium text-accent-purple bg-accent-purple/10 px-2 py-1 rounded border border-accent-purple/20">
                                                    Tool: {item.relatedModule}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                <ClockIcon className="h-3 w-3" /> {item.durationMinutes}m
                                            </span>
                                            {activeItemIndex !== i && (
                                                <button 
                                                    onClick={() => startItem(i)}
                                                    className="p-1.5 rounded-full bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 dark:bg-accent-purple/20 dark:text-accent-purple dark:hover:bg-accent-purple/30 transition-colors"
                                                    title="Start Timer"
                                                >
                                                    <PlayIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tips Footer */}
                    <div className="bg-accent-amber/10 dark:bg-accent-amber/20 p-4 rounded-lg border border-accent-amber/20">
                        <h4 className="text-sm font-bold text-accent-amber mb-2 uppercase">Facilitator Tips</h4>
                        <ul className="list-disc list-inside text-sm text-accent-amber/80 space-y-1">
                            {(plan.facilitatorTips || []).map((tip, i) => (
                                <li key={i}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="flex justify-center">
                        <button onClick={() => setPlan(null)} className="text-sm text-gray-500 hover:underline">
                            Plan New Workshop
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
