
import React, { useState } from 'react';
import { TInitiative, TBacklogItem, TUatTestCase } from '../../types';
import { generateUatScripts } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface UatCoordinatorProps {
    initiative: TInitiative;
    backlogItems: TBacklogItem[];
}

const BeakerIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 01-6.23-.693L4.2 15.3m15.6 0c1.255 0 2.443.29 3.5.832v-2.67a1.5 1.5 0 00-1.5-1.5h-15a1.5 1.5 0 00-1.5 1.5v2.67c1.057-.542 2.245-.832 3.5-.832h12.5z" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClipboardDocumentListIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;

export const UatCoordinator: React.FC<UatCoordinatorProps> = ({ initiative, backlogItems }) => {
    const [testCases, setTestCases] = useState<TUatTestCase[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTestId, setActiveTestId] = useState<string | null>(null);

    const userStories = (Array.isArray(backlogItems) ? backlogItems : []).filter(i => i.type === 'User Story');

    const handleGenerate = async () => {
        if (userStories.length === 0) return;
        setError(null);
        setIsLoading(true);
        try {
            const scripts = await generateUatScripts(
                userStories.map(s => ({ title: s.title })), 
                initiative.sector
            );
            const scriptsWithIds = (Array.isArray(scripts) ? scripts : []).map((s, i) => ({
                ...s,
                id: s.id || `uat-${Date.now()}-${i}`,
                status: s.status || 'Pending'
            }));
            setTestCases(scriptsWithIds);
        } catch (e) {
            console.error(e);
            setError("Failed to generate UAT scripts.");
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = (id: string, status: 'Pass' | 'Fail') => {
        setTestCases(prev => (Array.isArray(prev) ? prev : []).map(tc => tc.id === id ? { ...tc, status } : tc));
        // If fail, ideally prompt to create a bug (simplified here)
        if (status === 'Fail') {
            setError("Test Failed. Please log a bug in the Backlog module.");
        }
    };

    const toggleDetails = (id: string) => {
        setActiveTestId(prev => prev === id ? null : id);
    };

    const safeTestCases = Array.isArray(testCases) ? testCases : [];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <BeakerIcon className="h-7 w-7 text-accent-teal" />
                        UAT Coordinator
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Automate the creation of User Acceptance Test scripts based on your Backlog.
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || userStories.length === 0}>
                    {isLoading ? <Spinner /> : `Generate Scripts (${userStories.length} Stories)`}
                </Button>
            </div>

            {(!safeTestCases || safeTestCases.length === 0) ? (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Test Scripts</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Click "Generate Scripts" to have the AI analyze your User Stories and create step-by-step UAT instructions for business users.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in-down">
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 px-2">
                        <span>Total Tests: {safeTestCases.length}</span>
                        <span>Passed: {safeTestCases.filter(t => t.status === 'Pass').length}</span>
                    </div>
                    
                    {safeTestCases.map(test => (
                        <div key={test.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                            <div 
                                className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${activeTestId === test.id ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                                onClick={() => toggleDetails(test.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                        test.status === 'Pass' ? 'bg-accent-emerald' : 
                                        test.status === 'Fail' ? 'bg-accent-red' : 'bg-gray-300'
                                    }`}></div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">{test.title}</h4>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                                        test.status === 'Pass' ? 'bg-accent-emerald/10 text-accent-emerald' : 
                                        test.status === 'Fail' ? 'bg-accent-red/10 text-accent-red' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {test.status}
                                    </span>
                                    <span className="text-gray-400 text-xs">{activeTestId === test.id ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {activeTestId === test.id && (
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-4">
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Pre-Conditions</h5>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{test.preConditions}</p>
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Test Steps</h5>
                                                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                                    {(Array.isArray(test?.steps) ? test.steps : []).map((step, i) => (
                                                        <li key={i}>{step}</li>
                                                    ))}
                                                </ol>
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Expected Result</h5>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-accent-emerald/10 dark:bg-accent-emerald/20 p-2 rounded border border-accent-emerald/20">
                                                    {test.expectedResult}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-6">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Exec. Result</p>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); updateStatus(test.id, 'Pass'); }}
                                                className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 font-medium transition-all ${test.status === 'Pass' ? 'bg-accent-emerald text-white shadow-lg' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-accent-emerald hover:bg-accent-emerald/10'}`}
                                            >
                                                <CheckCircleIcon className="h-5 w-5" /> Pass
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); updateStatus(test.id, 'Fail'); }}
                                                className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 font-medium transition-all ${test.status === 'Fail' ? 'bg-accent-red text-white shadow-lg' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-accent-red hover:bg-accent-red/10'}`}
                                            >
                                                <XCircleIcon className="h-5 w-5" /> Fail
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
