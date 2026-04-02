
import React, { useState, useEffect } from 'react';
import { TInitiative, TIssue } from '../../types';
import { analyzeIssue } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface IssueTrackerProps {
    initiative: TInitiative;
}

const ExclamationCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;
const ClipboardDocumentCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>;

export const IssueTracker: React.FC<IssueTrackerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [issues, setIssues] = useState<TIssue[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.issues) {
            setIssues(Array.isArray(initiative.artifacts.issues) ? initiative.artifacts.issues : []);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleLogIssue = async () => {
        if (!description.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const analysis = await analyzeIssue(description, initiative.sector);
            const newIssue: TIssue = {
                id: `issue-${Date.now()}`,
                ...analysis
            };
            const safeIssues = Array.isArray(issues) ? issues : [];
            const updatedIssues = [newIssue, ...safeIssues];
            setIssues(updatedIssues);
            saveArtifact(initiative.id, 'issues', updatedIssues);
            setDescription('');
        } catch (error) {
            console.error(error);
            setError("Failed to analyze issue.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = (id: string) => {
        const safeIssues = Array.isArray(issues) ? issues : [];
        const updatedIssues = safeIssues.map(iss => 
            iss.id === id ? { ...iss, status: 'Resolved' } : iss
        );
        setIssues(updatedIssues as any); // Cast to satisfy TIssue type
        saveArtifact(initiative.id, 'issues', updatedIssues);
    };

    const severityColors = {
        'Critical': 'bg-accent-red/10 text-accent-red dark:bg-accent-red/20',
        'High': 'bg-accent-amber/10 text-accent-amber dark:bg-accent-amber/20',
        'Medium': 'bg-accent-amber/5 text-accent-amber/80 dark:bg-accent-amber/10',
        'Low': 'bg-accent-emerald/10 text-accent-emerald dark:bg-accent-emerald/20',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ExclamationCircleIcon className="h-7 w-7 text-accent-purple" />
                        Issue & Concern Tracker
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage active project issues and stakeholder concerns (BABOK 10.26).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Log New Issue</label>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        placeholder="e.g. Legal team blocked the data access request."
                    />
                    <Button onClick={handleLogIssue} disabled={isLoading || !description}>
                        {isLoading ? <Spinner /> : 'Analyze & Log'}
                    </Button>
                </div>
            </div>

            <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-2">
                {(issues || []).length === 0 && !isLoading && (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                        <ClipboardDocumentCheckIcon className="h-16 w-16 mx-auto mb-2 opacity-20" />
                        <p>No active issues. Smooth sailing!</p>
                    </div>
                )}
                
                {(issues || []).map(issue => (
                    <div key={issue.id} className={`bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm transition-all ${issue.status === 'Resolved' ? 'border-accent-emerald/20 dark:border-accent-emerald/30 opacity-70' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${severityColors[issue.severity]}`}>
                                    {issue.severity}
                                </span>
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{issue.title}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">Owner: {issue.owner}</span>
                                {issue.status !== 'Resolved' && (
                                    <button 
                                        onClick={() => handleResolve(issue.id)}
                                        className="text-xs bg-accent-emerald/10 dark:bg-accent-emerald/20 text-accent-emerald px-3 py-1 rounded hover:bg-accent-emerald/20 dark:hover:bg-accent-emerald/30 transition-colors"
                                    >
                                        Resolve
                                    </button>
                                )}
                                {issue.status === 'Resolved' && (
                                    <span className="text-xs font-bold text-accent-emerald flex items-center gap-1">
                                        ✓ Resolved
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{issue.description}</p>
                        
                        <div className="bg-accent-purple/5 dark:bg-accent-purple/10 p-3 rounded border border-accent-purple/10 dark:border-accent-purple/20">
                            <h5 className="text-xs font-bold text-accent-purple dark:text-accent-purple/80 uppercase mb-1">Recommended Resolution</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{issue.resolution}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
