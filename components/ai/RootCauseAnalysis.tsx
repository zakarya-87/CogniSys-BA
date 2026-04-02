
import React, { useState, useEffect } from 'react';
import { TInitiative, TRootCauseAnalysis } from '../../types';
import { generateRootCauseAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface RootCauseAnalysisProps {
    initiative: TInitiative;
}

const MagnifyingGlassIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const ArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;

export const RootCauseAnalysis: React.FC<RootCauseAnalysisProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [problem, setProblem] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TRootCauseAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'5Whys' | 'Fishbone'>('5Whys');

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.rootCauseAnalysis) {
            setAnalysis(initiative.artifacts.rootCauseAnalysis);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!problem.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateRootCauseAnalysis(problem, initiative.sector);
            setAnalysis(result);
            saveArtifact(initiative.id, 'rootCauseAnalysis', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate Root Cause Analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderFiveWhys = () => {
        if (!analysis) return null;
        return (
            <div className="space-y-4 max-w-2xl mx-auto py-4">
                <div className="bg-accent-red/10 dark:bg-accent-red/20 p-4 rounded-lg border border-accent-red/20 dark:border-accent-red/30 text-center">
                    <h3 className="text-sm font-bold text-accent-red dark:text-accent-red/90 uppercase">The Problem</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{analysis.fiveWhys?.problem || problem}</p>
                </div>

                {(analysis.fiveWhys?.steps || []).map((why, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <ArrowDownIcon className="h-6 w-6 text-gray-300 dark:text-gray-600 my-2" />
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full relative">
                            <span className="absolute top-2 left-2 text-xs font-bold text-gray-400">Why?</span>
                            <p className="text-center text-gray-700 dark:text-gray-200 mt-2">{why}</p>
                        </div>
                    </div>
                ))}

                <div className="flex flex-col items-center">
                    <ArrowDownIcon className="h-6 w-6 text-gray-300 dark:text-gray-600 my-2" />
                    <div className="bg-accent-emerald/10 dark:bg-accent-emerald/20 p-6 rounded-lg border border-accent-emerald/20 dark:border-accent-emerald/30 w-full text-center">
                        <h3 className="text-sm font-bold text-accent-emerald dark:text-accent-emerald/90 uppercase flex items-center justify-center gap-2">
                            ROOT CAUSE
                        </h3>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">{analysis.fiveWhys?.rootCause}</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderFishbone = () => {
        if (!analysis) return null;
        // Simple SVG rendering logic reused/adapted
        const categories = analysis.fishbone || [];
        return (
            <div className="overflow-x-auto custom-scrollbar p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <svg width="1000" height="600" viewBox="0 0 1000 600" className="min-w-[800px]">
                    {/* Spine */}
                    <line x1="50" y1="300" x2="850" y2="300" className="stroke-gray-800 dark:stroke-gray-200" strokeWidth="4" />
                    
                    {/* Head */}
                    <path d="M850,300 L980,250 L980,350 Z" className="fill-accent-red" />
                    <text x="915" y="305" textAnchor="middle" className="fill-white font-bold text-xs" style={{writingMode: 'vertical-rl', textOrientation: 'upright'}}>PROBLEM</text>

                    {categories.map((category, catIndex) => {
                        const isTop = catIndex % 2 === 0;
                        const xBase = 150 + Math.floor(catIndex / 2) * 250;
                        const yBase = 300;
                        const yEnd = isTop ? 100 : 500;
                        
                        return (
                            <g key={catIndex}>
                                {/* Bone */}
                                <line x1={xBase} y1={yBase} x2={xBase + 50} y2={yEnd} className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="2" />
                                
                                {/* Category Label Box */}
                                <rect x={xBase + 10} y={isTop ? yEnd - 30 : yEnd} width="100" height="30" rx="4" className="fill-accent-purple/10 dark:fill-accent-purple/20 stroke-accent-purple" />
                                <text x={xBase + 60} y={isTop ? yEnd - 10 : yEnd + 20} textAnchor="middle" className="text-xs font-bold fill-accent-purple dark:fill-accent-purple/90">{category.name}</text>

                                {/* Causes */}
                                {(category.causes || []).map((cause, causeIndex) => {
                                    const causeY = isTop 
                                        ? yBase - 40 - (causeIndex * 30) 
                                        : yBase + 40 + (causeIndex * 30);
                                    // Linear interpolation for X to follow the angled bone
                                    const causeX = xBase + 10 + (causeIndex * 8); 

                                    return (
                                        <g key={causeIndex}>
                                            <line x1={causeX} y1={causeY} x2={causeX + 80} y2={causeY} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1" />
                                            <text x={causeX + 85} y={causeY + 4} className="text-[10px] fill-gray-700 dark:fill-gray-300">{cause}</text>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
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
                        <MagnifyingGlassIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Root Cause Analysis
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Identify the underlying cause of defects or issues (BABOK 10.40).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Problem Statement</label>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        placeholder="e.g. User retention dropped by 15% last month"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !problem}>
                        {isLoading ? <Spinner /> : 'Analyze Root Cause'}
                    </Button>
                </div>
            </div>

            {analysis && (
                <div className="flex-grow animate-fade-in-down flex flex-col">
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                        <button
                            onClick={() => setActiveTab('5Whys')}
                            className={`px-6 py-2 font-medium text-sm border-b-2 transition-colors ${
                                activeTab === '5Whys' 
                                    ? 'border-accent-purple text-accent-purple dark:text-accent-purple/90' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            5 Whys Method
                        </button>
                        <button
                            onClick={() => setActiveTab('Fishbone')}
                            className={`px-6 py-2 font-medium text-sm border-b-2 transition-colors ${
                                activeTab === 'Fishbone' 
                                    ? 'border-accent-purple text-accent-purple dark:text-accent-purple/90' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            Fishbone Diagram
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2">
                        {activeTab === '5Whys' ? renderFiveWhys() : renderFishbone()}
                    </div>

                    <div className="mt-6 p-4 bg-accent-purple/10 dark:bg-accent-purple/20 border-l-4 border-accent-purple rounded-r-lg">
                        <h4 className="font-bold text-accent-purple dark:text-accent-purple/90 mb-2">Recommended Corrective Action</h4>
                        <p className="text-gray-700 dark:text-gray-300">{analysis.correctiveAction}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
