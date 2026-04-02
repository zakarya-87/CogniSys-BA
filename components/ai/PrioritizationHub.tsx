
import React, { useState, useEffect } from 'react';
import { TInitiative, TPrioritizationAnalysis } from '../../types';
import { prioritizeBacklog, suggestFeatures } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ReferenceLine } from 'recharts';

interface PrioritizationHubProps {
    initiative: TInitiative;
}

const QueueListIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;
const AdjustmentsVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" /></svg>;
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;

const moscowColors: Record<string, string> = {
    'Must Have': 'bg-accent-red/10 text-accent-red border-accent-red/20 dark:bg-accent-red/20 dark:text-accent-red/90 dark:border-accent-red/30',
    'Should Have': 'bg-accent-amber/10 text-accent-amber border-accent-amber/20 dark:bg-accent-amber/20 dark:text-accent-amber/90 dark:border-accent-amber/30',
    'Could Have': 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20 dark:bg-accent-emerald/20 dark:text-accent-emerald/90 dark:border-accent-emerald/30',
    'Won\'t Have': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

const kanoColors: Record<string, string> = {
    'Basic': 'bg-accent-purple/10 text-accent-purple',
    'Performance': 'bg-accent-blue/10 text-accent-blue',
    'Delighter': 'bg-accent-pink/10 text-accent-pink',
};

export const PrioritizationHub: React.FC<PrioritizationHubProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [features, setFeatures] = useState('Biometric Login, Push Notifications, Dark Mode, Export to PDF, Social Login, Offline Mode');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TPrioritizationAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [activeTab, setActiveTab] = useState<'MoSCoW' | 'RICE' | 'Kano' | 'Matrix'>('MoSCoW');

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.prioritization) {
            setAnalysis(initiative.artifacts.prioritization);
        }
    }, [initiative.id, initiative.artifacts]);

    const handlePrioritize = async () => {
        if (!features.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const featureList = features.split(',').map(f => f.trim()).filter(f => f);
            const result = await prioritizeBacklog(featureList, initiative.sector);
            setAnalysis(result);
            saveArtifact(initiative.id, 'prioritization', result);
        } catch (error) {
            console.error(error);
            setError("Failed to prioritize backlog.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestFeatures = async () => {
        setIsSuggesting(true);
        setError(null);
        try {
            const suggested = await suggestFeatures(initiative);
            setFeatures(suggested.join(', '));
        } catch (error) {
            console.error(error);
            setError("Failed to suggest features.");
        } finally {
            setIsSuggesting(false);
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
                        <QueueListIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Prioritization Hub
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Scientific ranking using MoSCoW, RICE, and Kano frameworks (BABOK 5.3).
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={handleSuggestFeatures} 
                    disabled={isSuggesting}
                    className="flex items-center gap-2"
                >
                    {isSuggesting ? <Spinner /> : <SparklesIcon className="h-4 w-4" />}
                    AI Suggest Features
                </Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features to Prioritize (comma separated)</label>
                <div className="flex gap-3">
                    <textarea 
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple/50"
                        rows={2}
                        value={features}
                        onChange={(e) => setFeatures(e.target.value)}
                        placeholder="e.g. Feature A, Feature B, Feature C..."
                    />
                    <Button onClick={handlePrioritize} disabled={isLoading || !features} className="flex-shrink-0 self-start mt-1">
                        {isLoading ? <Spinner /> : 'Rank & Score'}
                    </Button>
                </div>
            </div>

            {(analysis || []).length > 0 && (
                <div className="flex-grow flex flex-col animate-fade-in-down">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                        {(['MoSCoW', 'RICE', 'Kano', 'Matrix'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                                    activeTab === tab 
                                        ? 'border-accent-purple text-accent-purple dark:text-accent-purple/90' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {tab === 'Matrix' ? 'Value vs Effort' : tab}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-grow overflow-auto custom-scrollbar">
                        {activeTab === 'Matrix' && (
                            <div className="h-[400px] w-full bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis 
                                            type="number" 
                                            dataKey="effort" 
                                            name="Effort" 
                                            domain={[0, 10]} 
                                            stroke="#9ca3af"
                                            tick={{ fontSize: 12 }}
                                        >
                                            <Label value="Effort (1-10)" position="bottom" offset={0} style={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }} />
                                        </XAxis>
                                        <YAxis 
                                            type="number" 
                                            dataKey="value" 
                                            name="Value" 
                                            domain={[0, 10]} 
                                            stroke="#9ca3af"
                                            tick={{ fontSize: 12 }}
                                        >
                                            <Label value="Value (1-10)" angle={-90} position="left" offset={0} style={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }} />
                                        </YAxis>
                                        <ZAxis type="number" dataKey="z" range={[60, 400]} />
                                        <Tooltip 
                                            cursor={{ strokeDasharray: '3 3' }} 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-xl max-w-xs">
                                                            <p className="font-bold text-gray-900 dark:text-white mb-1">{data.featureTitle}</p>
                                                            <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-600 dark:text-gray-400">
                                                                <span>Value: <span className="font-bold text-accent-emerald">{data.value}</span></span>
                                                                <span>Effort: <span className="font-bold text-accent-amber">{data.effort}</span></span>
                                                            </div>
                                                            <p className="mt-2 text-[10px] italic text-gray-500 dark:text-gray-400 leading-tight">{data.reasoning}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        
                                        {/* Quadrant Lines */}
                                        <ReferenceLine x={5} stroke="#9ca3af" strokeWidth={1} />
                                        <ReferenceLine y={5} stroke="#9ca3af" strokeWidth={1} />

                                        {/* Quadrant Labels */}
                                        <text x="75%" y="25%" textAnchor="middle" className="fill-gray-300 dark:fill-gray-700 text-xs font-bold pointer-events-none uppercase">Quick Wins</text>
                                        <text x="25%" y="25%" textAnchor="middle" className="fill-gray-300 dark:fill-gray-700 text-xs font-bold pointer-events-none uppercase">Major Projects</text>
                                        <text x="25%" y="75%" textAnchor="middle" className="fill-gray-300 dark:fill-gray-700 text-xs font-bold pointer-events-none uppercase">Fill-ins</text>
                                        <text x="75%" y="75%" textAnchor="middle" className="fill-gray-300 dark:fill-gray-700 text-xs font-bold pointer-events-none uppercase">Thankless Tasks</text>

                                        <Scatter 
                                            name="Features" 
                                            data={analysis.map(item => ({ ...item, z: 100 }))} 
                                            fill="#6366f1" 
                                            strokeWidth={2}
                                            stroke="#4f46e5"
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {activeTab === 'MoSCoW' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {['Must Have', 'Should Have', 'Could Have', 'Won\'t Have'].map(cat => (
                                    <div key={cat} className={`rounded-lg border p-4 ${moscowColors[cat].split(' ')[0]} bg-opacity-20`}>
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-center">{cat}</h3>
                                        <div className="space-y-2">
                                            {(Array.isArray(analysis) ? analysis : []).filter(item => item.moscow === cat).map(item => (
                                                <div key={item.featureId} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-inherit text-sm">
                                                    <p className="font-medium text-gray-900 dark:text-white">{item.featureTitle}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.reasoning}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'RICE' && (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Feature</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Reach</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Impact</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Confidence</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Effort</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-accent-purple uppercase">RICE Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {[...(Array.isArray(analysis) ? analysis : [])].sort((a,b) => (b.rice?.score || 0) - (a.rice?.score || 0)).map(item => (
                                            <tr key={item.featureId}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.featureTitle}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{item.rice?.reach || 0}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{item.rice?.impact || 0}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{item.rice?.confidence || 0}%</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{item.rice?.effort || 0}</td>
                                                <td className="px-4 py-3 text-sm text-center font-bold text-accent-purple dark:text-accent-purple/90">{(item.rice?.score || 0).toFixed(0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'Kano' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {['Basic', 'Performance', 'Delighter'].map(type => (
                                    <div key={type} className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`w-3 h-3 rounded-full ${kanoColors[type]}`}></span>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200">{type} Needs</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {(Array.isArray(analysis) ? analysis : []).filter(item => item.kano === type).map(item => (
                                                <li key={item.featureId} className="p-2 bg-white dark:bg-gray-800 rounded shadow-sm text-sm border-l-4 border-gray-300 dark:border-gray-600">
                                                    {item.featureTitle}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-xs text-gray-500 mt-4 italic">
                                            {type === 'Basic' ? 'Must be present, but wont increase satisfaction.' :
                                             type === 'Performance' ? 'Linear relationship with satisfaction.' :
                                             'Unexpected features that create high delight.'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
