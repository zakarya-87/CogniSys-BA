
import React, { useState, useEffect } from 'react';
import { TInitiative, TStakeholderProfile } from '../../types';
import { analyzeStakeholder } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface StakeholderManagerProps {
    initiative: TInitiative;
}

const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;

export const StakeholderManager: React.FC<StakeholderManagerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [stakeholders, setStakeholders] = useState<TStakeholderProfile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [newRole, setNewRole] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.stakeholderRegistry) {
            setStakeholders(initiative.artifacts.stakeholderRegistry);
        } else {
            // Default mock data if no persistence found
            setStakeholders([
                { id: '1', name: 'Sponsor', role: 'Executive Sponsor', power: 'High', interest: 'High', attitude: 'Supporter', strategy: 'Manage Closely. Weekly concise status updates.' },
                { id: '2', name: 'End Users', role: 'End Users', power: 'Low', interest: 'High', attitude: 'Neutral', strategy: 'Keep Informed. Regular newsletters and UAT involvement.' }
            ]);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleAddStakeholder = async () => {
        if (!newRole.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const profile = await analyzeStakeholder(newRole, initiative.description, initiative.sector);
            const updatedList = [...stakeholders, profile];
            setStakeholders(updatedList);
            saveArtifact(initiative.id, 'stakeholderRegistry', updatedList);
            setNewRole('');
        } catch (error) {
            console.error(error);
            setError("Failed to analyze stakeholder.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to position stakeholders on grid (0-100 scale approx)
    const getGridPosition = (power: string, interest: string, index: number, total: number) => {
        const jitter = (index % 3) * 10;
        
        let top = 50;
        let left = 50;

        if (power === 'High' && interest === 'High') { top = 20 + jitter; left = 70 + jitter; }
        else if (power === 'High' && interest === 'Low') { top = 20 + jitter; left = 20 + jitter; }
        else if (power === 'Low' && interest === 'High') { top = 70 + jitter; left = 70 + jitter; }
        else { top = 70 + jitter; left = 20 + jitter; } // Low, Low

        return { top: `${top}%`, left: `${left}%` };
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 mb-4">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <UsersIcon className="h-7 w-7 text-accent-purple" />
                        Stakeholder Engagement Hub
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">Map stakeholders and define engagement strategies (BABOK Chapter 3).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                {/* Left: Registry */}
                <div className="lg:col-span-1 flex flex-col h-full">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">Add Stakeholder</h3>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                placeholder="e.g., Chief Compliance Officer"
                                className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                            />
                            <Button onClick={handleAddStakeholder} disabled={isLoading || !newRole.trim()} className="px-3">
                                {isLoading ? <Spinner /> : <PlusIcon className="h-5 w-5" />}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">AI will auto-analyze Power & Interest.</p>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {stakeholders.map(s => (
                            <div key={s.id} className="bg-white dark:bg-gray-700 p-3 rounded border-l-4 border-accent-purple shadow-sm">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-gray-800 dark:text-white">{s.role}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                        s.attitude === 'Supporter' ? 'bg-accent-emerald/10 text-accent-emerald' : 
                                        s.attitude === 'Opponent' ? 'bg-accent-red/10 text-accent-red' : 'bg-gray-200 text-gray-700'
                                    }`}>{s.attitude}</span>
                                </div>
                                <div className="flex gap-2 mt-2 text-xs text-gray-500 dark:text-gray-300">
                                    <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">Power: {s.power}</span>
                                    <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">Interest: {s.interest}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">"{s.strategy}"</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Matrix */}
                <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 relative min-h-[500px]">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 text-center">Power / Interest Grid</h3>
                    
                    {/* Grid Container */}
                    <div className="w-full h-full relative border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg">
                        {/* Labels */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400 uppercase">High Interest</div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400 uppercase">Low Interest</div>
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-gray-400 uppercase origin-center">High Power</div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-xs font-bold text-gray-400 uppercase origin-center">Low Power</div>

                        {/* Quadrant Lines */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 dark:bg-gray-700"></div>

                        {/* Quadrant Labels (Watermarks) */}
                        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 text-3xl font-black text-gray-100 dark:text-gray-700 opacity-50 pointer-events-none">Keep Satisfied</div>
                        <div className="absolute top-1/4 left-3/4 -translate-x-1/2 -translate-y-1/2 text-3xl font-black text-gray-100 dark:text-gray-700 opacity-50 pointer-events-none">Manage Closely</div>
                        <div className="absolute top-3/4 left-1/4 -translate-x-1/2 -translate-y-1/2 text-3xl font-black text-gray-100 dark:text-gray-700 opacity-50 pointer-events-none">Monitor</div>
                        <div className="absolute top-3/4 left-3/4 -translate-x-1/2 -translate-y-1/2 text-3xl font-black text-gray-100 dark:text-gray-700 opacity-50 pointer-events-none">Keep Informed</div>

                        {/* Dots */}
                        {stakeholders.map((s, i) => {
                            const pos = getGridPosition(s.power, s.interest, i, stakeholders.length);
                            return (
                                <div 
                                    key={s.id} 
                                    className="absolute w-8 h-8 rounded-full bg-accent-purple text-white flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white dark:border-gray-900 cursor-pointer hover:scale-110 transition-transform group z-10"
                                    style={{ top: pos.top, left: pos.left }}
                                >
                                    {s.role.charAt(0)}
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black text-white text-xs rounded p-1 hidden group-hover:block z-20 text-center">
                                        {s.role}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
