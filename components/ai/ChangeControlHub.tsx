
import React, { useState } from 'react';
import { TInitiative, TChangeRequest, TImpactAnalysis } from '../../types';
import { generateImpactAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ChangeControlHubProps {
    initiative: TInitiative;
}

const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>;

export const ChangeControlHub: React.FC<ChangeControlHubProps> = ({ initiative }) => {
    const [changeRequests, setChangeRequests] = useState<TChangeRequest[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (initiative.artifacts?.changeRequests) {
            setChangeRequests(Array.isArray(initiative.artifacts.changeRequests) ? initiative.artifacts.changeRequests : []);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleCreateCR = async () => {
        if (!newTitle || !newDesc) return;
        setError(null);
        setIsLoading(true);

        try {
            const analysis = await generateImpactAnalysis(newDesc, initiative.title, initiative.sector);
            
            const newCR: TChangeRequest = {
                id: `cr-${Date.now()}`,
                title: newTitle,
                description: newDesc,
                status: 'Pending',
                date: new Date().toLocaleDateString(),
                dateLogged: new Date().toLocaleDateString(),
                requester: 'Current User', // In a real app, this would come from auth context
                analysis: analysis
            };

            setChangeRequests([newCR, ...changeRequests]);
            setIsCreating(false);
            setNewTitle('');
            setNewDesc('');
        } catch (error) {
            console.error(error);
            setError("Failed to analyze impact. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDecision = (id: string, decision: 'Approved' | 'Rejected' | 'Deferred') => {
        setChangeRequests(prev => prev.map(cr => 
            cr.id === id ? { ...cr, status: decision } : cr
        ));
    };

    const riskColor = (score: string) => {
        switch(score) {
            case 'High': return 'text-accent-red bg-accent-red/10 border border-accent-red/20';
            case 'Medium': return 'text-accent-amber bg-accent-amber/10 border border-accent-amber/20';
            case 'Low': return 'text-accent-emerald bg-accent-emerald/10 border border-accent-emerald/20';
            default: return 'text-text-muted-dark bg-surface-dark border border-surface-light';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ScaleIcon className="h-6 w-6 text-accent-purple" /> Change Control Board
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">Log change requests and use AI to assess impact, risk, and compliance before approval.</p>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)}>+ New Change Request</Button>
                )}
            </div>

            {isCreating && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-accent-purple/20 animate-fade-in-down">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Log New Change Request</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="e.g., Change Payment Provider to Stripe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description & Rationale</label>
                            <textarea 
                                rows={4}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                placeholder="Describe the change and why it is needed..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={handleCreateCR} disabled={isLoading || !newTitle || !newDesc}>
                                {isLoading ? <Spinner /> : 'Analyze Impact & Submit'}
                            </Button>
                            <button 
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {(changeRequests || []).length === 0 && !isCreating && (
                     <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <ScaleIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Change Requests</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Requests submitted for approval will appear here.</p>
                    </div>
                )}
                
                {(changeRequests || []).map(cr => (
                    <div key={cr.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 border-accent-purple">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cr.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold 
                                            ${cr.status === 'Approved' ? 'bg-accent-emerald/10 text-accent-emerald' : 
                                              cr.status === 'Rejected' ? 'bg-accent-red/10 text-accent-red' : 
                                              cr.status === 'Deferred' ? 'bg-accent-amber/10 text-accent-amber' :
                                              'bg-accent-purple/10 text-accent-purple'}`}>
                                            {cr.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Logged by {cr.requester} on {cr.dateLogged}</p>
                                </div>
                                {cr.status === 'Pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDecision(cr.id, 'Approved')} className="p-2 text-accent-emerald hover:bg-accent-emerald/10 rounded-full" title="Approve"><CheckCircleIcon className="h-6 w-6" /></button>
                                        <button onClick={() => handleDecision(cr.id, 'Rejected')} className="p-2 text-accent-red hover:bg-accent-red/10 rounded-full" title="Reject"><XCircleIcon className="h-6 w-6" /></button>
                                        <button onClick={() => handleDecision(cr.id, 'Deferred')} className="p-2 text-accent-amber hover:bg-accent-amber/10 rounded-full" title="Defer"><ClockIcon className="h-6 w-6" /></button>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-6">{cr.description}</p>

                            {cr.analysis && (
                                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-accent-amber" /> Impact Analysis
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Risk Score:</span>
                                                <span className={`font-bold px-2 rounded ${riskColor(cr.analysis.riskScore)}`}>{cr.analysis.riskScore}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Effort Est:</span>
                                                <span className="font-medium dark:text-gray-200">{cr.analysis.effortEstimation}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1">Impacted Areas:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {(cr.analysis.impactedAreas || []).map((area, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs">{area}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Recommendation</h4>
                                        <p className="text-sm font-medium text-accent-purple mb-1">
                                            Verdict: {cr.analysis.recommendation}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                            "{cr.analysis.justification}"
                                        </p>
                                        {cr.analysis.complianceCheck && cr.analysis.complianceCheck !== 'None' && (
                                            <div className="mt-2 text-xs text-accent-red bg-accent-red/10 p-2 rounded border border-accent-red/20">
                                                <strong>Compliance Flag:</strong> {cr.analysis.complianceCheck}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
