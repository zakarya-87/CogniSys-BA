
import React, { useState, useEffect } from 'react';
import { TInitiative, TAPMAnalysis, TApplication } from '../../types';
import { generateAPMAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface ApplicationPortfolioProps {
    initiative: TInitiative;
}

const Square3Stack3DIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>;
const WrenchScrewdriverIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.66-4.66c-.384-.317-.626-.74-.766-1.208M11.42 15.17L5.877 21m5.543-5.83l-2.496 3.03c-.317.384-.74.626-1.208.766m9.86-9.86l-4.66 4.66c-.384.317-.626.74-.766 1.208m5.423-5.423L21 5.877m-5.83 5.543l3.03 2.496c.384.317.626.74.766 1.208m-9.86-9.86L3 17.25A2.652 2.652 0 005.877 21l5.877-5.877m0 0l2.496-3.03c.317-.384.74-.626 1.208-.766" /></svg>;

const TIME_ZONES = [
    { name: 'TOLERATE', x: 50, y: 50, w: 50, h: 50, color: 'bg-accent-purple/10 border-accent-purple/20', text: 'text-accent-purple' }, // High Health, High Value
    { name: 'INVEST', x: 50, y: 0, w: 50, h: 50, color: 'bg-accent-amber/10 border-accent-amber/20', text: 'text-accent-amber' }, // Low Health, High Value
    { name: 'MIGRATE', x: 0, y: 50, w: 50, h: 50, color: 'bg-accent-emerald/10 border-accent-emerald/20', text: 'text-accent-emerald' }, // High Health, Low Value
    { name: 'ELIMINATE', x: 0, y: 0, w: 50, h: 50, color: 'bg-accent-red/10 border-accent-red/20', text: 'text-accent-red' }, // Low Health, Low Value
];

export const ApplicationPortfolio: React.FC<ApplicationPortfolioProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [appList, setAppList] = useState('Legacy CRM, Mainframe Core, Mobile App v1, Reporting Server');
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TAPMAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedApp, setSelectedApp] = useState<TApplication | null>(null);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.apmAnalysis) {
            setAnalysis(initiative.artifacts.apmAnalysis);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!appList.trim()) return;
        setError(null);
        setIsLoading(true);
        setSelectedApp(null);
        try {
            const apps = appList.split(',').map(s => s.trim()).filter(Boolean);
            const result = await generateAPMAnalysis(apps, initiative.sector);
            setAnalysis(result);
            saveArtifact(initiative.id, 'apmAnalysis', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate APM analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Square3Stack3DIcon className="h-7 w-7 text-accent-purple" />
                        Application Portfolio Manager (TIME)
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Strategic assessment of IT assets: Tolerate, Invest, Migrate, or Eliminate.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Applications to Assess (Comma Separated)
                </label>
                <div className="flex gap-3">
                    <textarea 
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                        value={appList}
                        onChange={(e) => setAppList(e.target.value)}
                        placeholder="e.g. SAP, Custom Billing, Legacy Portal"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !appList}>
                        {isLoading ? <Spinner /> : 'Assess Portfolio'}
                    </Button>
                </div>
            </div>

            {analysis && (
                <div className="flex-grow flex flex-col lg:flex-row gap-8 animate-fade-in-down h-[500px]">
                    {/* Quadrant Chart */}
                    <div className="flex-grow relative border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                        {/* Background Zones */}
                        {TIME_ZONES.map(zone => (
                            <div 
                                key={zone.name}
                                className={`absolute border ${zone.color} flex items-center justify-center`}
                                style={{ left: `${zone.x}%`, bottom: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}
                            >
                                <span className={`text-2xl font-black opacity-20 ${zone.text}`}>{zone.name}</span>
                            </div>
                        ))}

                        {/* Axes Labels */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-500 uppercase">Technical Health →</div>
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-gray-500 uppercase">Business Value →</div>

                        {/* App Dots */}
                        {(analysis.apps || []).map((app, index) => (
                            <div 
                                key={`${app.id}-${index}`}
                                onClick={() => setSelectedApp(app)}
                                className={`absolute w-8 h-8 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-125 transition-transform border-2 border-white dark:border-gray-900 z-10 ${
                                    app.strategy === 'Invest' ? 'bg-accent-amber text-black' :
                                    app.strategy === 'Tolerate' ? 'bg-accent-purple text-white' :
                                    app.strategy === 'Migrate' ? 'bg-accent-emerald text-white' :
                                    'bg-accent-red text-white'
                                }`}
                                style={{ 
                                    left: `${(app.technicalHealth / 10) * 90 + 5}%`, // Normalized 0-10 to %
                                    bottom: `${(app.businessValue / 10) * 90 + 5}%` 
                                }}
                                title={`${app.name} (${app.strategy})`}
                            >
                                {app.name.charAt(0)}
                            </div>
                        ))}
                    </div>

                    {/* Details Panel */}
                    <div className="w-full lg:w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto custom-scrollbar">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Asset Details</h3>
                        {selectedApp ? (
                            <div className="animate-fade-in-down">
                                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{selectedApp.name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedApp.age} • {selectedApp.description}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                            <div className="text-xs text-gray-500">Value</div>
                                            <div className="font-bold">{selectedApp.businessValue}/10</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                            <div className="text-xs text-gray-500">Health</div>
                                            <div className="font-bold">{selectedApp.technicalHealth}/10</div>
                                        </div>
                                    </div>
                                    
                                    <div className={`p-3 rounded-md text-center font-bold text-white ${
                                        selectedApp.strategy === 'Invest' ? 'bg-accent-amber' :
                                        selectedApp.strategy === 'Tolerate' ? 'bg-accent-purple' :
                                        selectedApp.strategy === 'Migrate' ? 'bg-accent-emerald' :
                                        'bg-accent-red'
                                    }`}>
                                        STRATEGY: {selectedApp.strategy}
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                            <WrenchScrewdriverIcon className="h-3 w-3"/> Recommendation
                                        </h5>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                                            {selectedApp.recommendation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-10">
                                Click on a bubble in the chart to view details.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
