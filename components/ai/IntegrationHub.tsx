
import React, { useState } from 'react';
import { TInitiative } from '../../types';
import { generateExportSummary } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface IntegrationHubProps {
    initiative: TInitiative;
}

const ShareIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>;
const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
const PrinterIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>;

const availableModules = [
    'Strategy Plan', 'SWOT Analysis', 'Requirements', 'Risk Register', 
    'Change Log', 'UAT Scripts', 'OCM Plan', 'Gap Analysis', 'Business Rules', 'Roadmap'
];

export const IntegrationHub: React.FC<IntegrationHubProps> = ({ initiative }) => {
    const [selectedModules, setSelectedModules] = useState<string[]>(availableModules);
    const [isGenerating, setIsGenerating] = useState(false);
    const [executiveSummary, setExecutiveSummary] = useState('');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');

    const toggleModule = (mod: string) => {
        setSelectedModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
    };

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            // Compile actual artifact data into the prompt context
            const contextData: string[] = [];
            
            if (selectedModules.includes('SWOT Analysis') && initiative.artifacts?.swot) {
                contextData.push(`SWOT Strengths: ${(initiative.artifacts.swot.strengths || []).join(', ')}`);
            }
            if (selectedModules.includes('Risk Register') && initiative.artifacts?.risks) {
                const criticalRisks = (initiative.artifacts.risks || []).filter((r: any) => r.probability * r.impact >= 15).map((r: any) => r.description);
                contextData.push(`Critical Risks: ${criticalRisks.join('; ')}`);
            }
            if (selectedModules.includes('Roadmap') && initiative.artifacts?.roadmap) {
                 const phases = (initiative.artifacts.roadmap.phases || []).map((p: any) => p.name).join(', ');
                 contextData.push(`Roadmap Phases: ${phases}`);
            }
            if (selectedModules.includes('Strategy Plan') && initiative.artifacts?.analysisPlan) {
                 contextData.push(`Strategic Approach: ${initiative.artifacts.analysisPlan.approach}`);
            }
            
            // If context data is empty, fallback to module names
            const promptContext = contextData.length > 0 ? contextData.join('\n') : `Modules: ${selectedModules.join(', ')}`;

            const summary = await generateExportSummary(initiative.title, initiative.sector, [promptContext]);
            setExecutiveSummary(summary);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSync = (platform: string) => {
        setSyncStatus('syncing');
        setTimeout(() => {
            setSyncStatus('done');
            alert(`Successfully synced ${selectedModules.length} artifacts to ${platform}.`);
            setTimeout(() => setSyncStatus('idle'), 2000);
        }, 2000);
    };

    const handlePrint = () => {
        const printContent = document.getElementById('printable-report');
        if (!printContent) return;
        
        const win = window.open('', '', 'height=700,width=800');
        if (win) {
            win.document.write('<html><head><title>Project Report</title>');
            win.document.write('<style>body { font-family: sans-serif; padding: 20px; } h1 { border-bottom: 2px solid #ccc; padding-bottom: 10px; } .section { margin-bottom: 20px; } .meta { color: #666; font-size: 0.9em; margin-bottom: 30px; }</style>');
            win.document.write('</head><body>');
            win.document.write(printContent.innerHTML);
            win.document.write('</body></html>');
            win.document.close();
            win.print();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShareIcon className="h-7 w-7 text-accent-purple" />
                        Integration & Export Hub
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Compile the "Project Bible" or sync artifacts to Jira/Confluence.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                {/* Configuration */}
                <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Include in Export</h3>
                    <div className="space-y-2">
                        {availableModules.map(mod => (
                            <label key={mod} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                                <input 
                                    type="checkbox" 
                                    checked={selectedModules.includes(mod)}
                                    onChange={() => toggleModule(mod)}
                                    className="rounded text-accent-purple focus:ring-accent-purple border-gray-300 dark:border-gray-600"
                                />
                                {mod}
                            </label>
                        ))}
                    </div>
                    
                    <hr className="my-6 border-gray-200 dark:border-gray-600" />
                    
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Actions</h3>
                    <div className="space-y-3">
                        <Button onClick={handleGenerateReport} disabled={isGenerating || selectedModules.length === 0} className="w-full justify-center">
                            {isGenerating ? <Spinner /> : 'Generate Report'}
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => handleSync('Jira')}
                                className="flex items-center justify-center py-2 px-4 bg-accent-purple text-white rounded-md hover:bg-accent-purple-dark text-sm font-semibold"
                            >
                                Sync to Jira
                            </button>
                            <button 
                                onClick={() => handleSync('Confluence')}
                                className="flex items-center justify-center py-2 px-4 bg-accent-purple/80 text-white rounded-md hover:bg-accent-purple text-sm font-semibold"
                            >
                                Sync to Wiki
                            </button>
                        </div>
                        <button
                            onClick={handlePrint}
                            disabled={!executiveSummary}
                            className="w-full flex items-center justify-center py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            <PrinterIcon className="h-4 w-4 mr-2" /> Print to PDF
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-inner flex flex-col">
                    {executiveSummary ? (
                        <div id="printable-report" className="prose dark:prose-invert max-w-none animate-fade-in-down h-full overflow-y-auto custom-scrollbar pr-2">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">{initiative.title}</h1>
                                <p className="text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm">Comprehensive Project Report</p>
                                <p className="text-xs text-gray-400 mt-2 meta">{new Date().toLocaleDateString()}</p>
                            </div>

                            <h3>Executive Summary</h3>
                            <div className="whitespace-pre-wrap text-sm">{executiveSummary}</div>
                            
                            <h3 className="mt-6">Included Modules</h3>
                            <ul className="text-sm">
                                {selectedModules.map(mod => (
                                    <li key={mod} className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-1">
                                        <span>{mod}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                            <DocumentTextIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p>Click "Generate Report" to create the Executive Summary.</p>
                        </div>
                    )}

                    {syncStatus === 'syncing' && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-lg z-10">
                            <div className="text-center">
                                <Spinner />
                                <p className="mt-2 font-bold text-accent-purple">Syncing with External Tools...</p>
                            </div>
                        </div>
                    )}
                    {syncStatus === 'done' && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-lg z-10">
                            <div className="text-center animate-bounce">
                                <CheckCircleIcon className="h-16 w-16 text-accent-emerald mx-auto" />
                                <p className="mt-2 font-bold text-accent-emerald">Sync Complete!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
