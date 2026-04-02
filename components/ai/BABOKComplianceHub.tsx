
import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { TInitiative, BABOKKnowledgeArea } from '../../types';
import { BABOK_KA_MAPPING } from '../../constants';
import { CheckCircle2, XCircle, Info, ArrowRight, Sparkles, X, LayoutGrid, Radar as RadarIcon } from 'lucide-react';
import { generateBABOKRoadmap } from '../../services/geminiService';
import { Spinner } from '../ui/Spinner';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface BABOKComplianceHubProps {
    initiative: TInitiative;
    onNavigate: (moduleName: string) => void;
}

export const BABOKComplianceHub: React.FC<BABOKComplianceHubProps> = ({ initiative, onNavigate }) => {
    const { t, i18n } = useTranslation(['common', 'dashboard']);
    const [selectedKA, setSelectedKA] = useState<BABOKKnowledgeArea | null>(null);
    const [roadmap, setRoadmap] = useState<string | null>(null);
    const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'radar'>('grid');

    const kaStats = useMemo(() => {
        const stats = Object.entries(BABOK_KA_MAPPING).map(([ka, modules]) => {
            const implementedModules = modules.filter(mod => {
                // Check if artifact exists for this module
                const artifactKeys = Object.keys(initiative.artifacts || {});
                return artifactKeys.some(key => key.toLowerCase().includes(mod.toLowerCase().replace(/\s/g, '')));
            });

            const score = modules.length > 0 ? Math.round((implementedModules.length / modules.length) * 100) : 0;

            return {
                ka: ka as BABOKKnowledgeArea,
                modules,
                implementedModules,
                score
            };
        });
        return stats;
    }, [initiative.artifacts]);

    const overallScore = Math.round(kaStats.reduce((acc, curr) => acc + curr.score, 0) / kaStats.length);

    const radarData = useMemo(() => {
        return kaStats.map(s => ({
            subject: s.ka.split(' ').map(w => w[0]).join(''), // Abbreviate for radar
            fullSubject: s.ka,
            A: s.score,
            fullMark: 100,
        }));
    }, [kaStats]);

    const handleGenerateRoadmap = async (ka: BABOKKnowledgeArea) => {
        setSelectedKA(ka);
        setIsLoadingRoadmap(true);
        setRoadmap(null);
        try {
            const stat = kaStats.find(s => s.ka === ka);
            const artifacts = (stat?.implementedModules || []).map(m => m);
            const missing = (stat?.modules || []).filter(m => !stat?.implementedModules.includes(m));
            const res = await generateBABOKRoadmap(ka, initiative.sector, artifacts, missing, i18n.language);
            setRoadmap(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingRoadmap(false);
        }
    };

    return (
        <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t('dashboard:babok.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{t('dashboard:babok.description')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mr-2">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-surface-dark text-accent-cyan dark:bg-surface-darker dark:text-accent-cyan' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('radar')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'radar' ? 'bg-surface-dark text-accent-cyan dark:bg-surface-darker dark:text-accent-cyan' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Radar View"
                        >
                            <RadarIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-right">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Overall Maturity</div>
                            <div className="text-3xl font-black text-accent-cyan dark:text-accent-cyan">{overallScore}%</div>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-accent-cyan border-t-transparent animate-spin-slow flex items-center justify-center">
                            <span className="text-[10px] font-bold">KA</span>
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === 'radar' ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Maturity Radar</h3>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Compliance"
                                    dataKey="A"
                                    stroke="var(--color-accent-cyan)"
                                    fill="var(--color-accent-cyan)"
                                    fillOpacity={0.6}
                                />
                                <RechartsTooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-xl">
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{data.fullSubject}</p>
                                                    <p className="text-accent-cyan dark:text-accent-cyan font-black text-lg">{data.A}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
                        {radarData.map(d => (
                            <div key={d.subject} className="flex items-center gap-2 text-xs">
                                <span className="font-black text-accent-cyan w-8">{d.subject}:</span>
                                <span className="text-gray-600 dark:text-gray-400 truncate">{d.fullSubject}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kaStats.map((stat) => (
                        <div key={stat.ka} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight pr-4">{stat.ka}</h3>
                                    <div className={`text-lg font-black ${stat.score > 70 ? 'text-accent-emerald' : stat.score > 30 ? 'text-accent-amber' : 'text-accent-red'}`}>
                                        {stat.score}%
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${stat.score > 70 ? 'bg-accent-emerald' : stat.score > 30 ? 'bg-accent-amber' : 'bg-accent-red'}`}
                                        style={{ width: `${stat.score}%` }}
                                    />
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1 space-y-4">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Implemented Features</div>
                                    <div className="flex flex-wrap gap-2">
                                        {stat.modules.map(mod => {
                                            const isImplemented = stat.implementedModules.includes(mod);
                                            return (
                                                <button
                                                    key={mod}
                                                    onClick={() => onNavigate(mod)}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                                        isImplemented 
                                                            ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20' 
                                                            : 'bg-gray-50 text-gray-400 border border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    {isImplemented ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                    {mod}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 italic max-w-[150px]">
                                    {stat.score === 100 
                                        ? "Fully compliant with BABOK standards." 
                                        : stat.score > 50 
                                        ? "Good coverage. Refine documentation." 
                                        : "Limited coverage. Needs attention."}
                                </p>
                                <button 
                                    onClick={() => handleGenerateRoadmap(stat.ka)}
                                    className="flex items-center gap-1 text-[10px] font-bold text-accent-cyan hover:text-accent-cyan-dark dark:text-accent-cyan dark:hover:text-accent-cyan-light uppercase tracking-wider"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    Roadmap
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Maturity Roadmap Modal/Overlay */}
            {selectedKA && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{selectedKA}</h3>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">AI-Powered Maturity Roadmap</p>
                            </div>
                            <button 
                                onClick={() => { setSelectedKA(null); setRoadmap(null); }}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            {isLoadingRoadmap ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Spinner className="h-10 w-10 text-accent-cyan" />
                                    <p className="text-gray-500 animate-pulse font-medium">Consulting BABOK v3 Standards...</p>
                                </div>
                            ) : roadmap ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{roadmap}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">Failed to generate roadmap. Please try again.</p>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                            <button 
                                onClick={() => { setSelectedKA(null); setRoadmap(null); }}
                                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold text-sm shadow-lg transition-all"
                            >
                                Close Roadmap
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-surface-dark dark:bg-surface-darker p-6 rounded-xl border border-border-dark dark:border-border-dark flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-surface-darker dark:bg-surface-dark flex items-center justify-center flex-shrink-0">
                    <Info className="h-8 w-8 text-accent-cyan dark:text-accent-cyan" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="font-bold text-text-dark dark:text-text-light">AI Governance Recommendation</h4>
                    <p className="text-sm text-text-dark dark:text-text-light mt-1">
                        Based on the current maturity score, the system recommends focusing on <strong>{kaStats.sort((a,b) => a.score - b.score)[0].ka}</strong>. 
                        Launch the <strong>Technique Library</strong> to find appropriate tools for this Knowledge Area.
                    </p>
                </div>
                <button 
                    onClick={() => onNavigate('Techniques')}
                    className="px-6 py-2 bg-accent-cyan hover:bg-accent-cyan-dark text-white rounded-lg font-bold text-sm shadow-lg shadow-accent-cyan/30 transition-all flex items-center gap-2"
                >
                    Open Toolkit <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
