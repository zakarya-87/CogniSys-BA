
import React, { useState, useEffect } from 'react';
import { TInitiative, TReviewPackage, TApprover } from '../../types';
import { auditReviewPackage } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ApprovalCenterProps {
    initiative: TInitiative;
}

const DocumentCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>;
const FingerPrintIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" /></svg>;
const ShieldExclamationIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg>;

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ initiative }) => {
    const [packages, setPackages] = useState<TReviewPackage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initiative.artifacts?.approvalPackages) {
            setPackages(Array.isArray(initiative.artifacts.approvalPackages) ? initiative.artifacts.approvalPackages : []);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleCreatePackage = async () => {
        if (!title || !description) return;
        setError(null);
        setIsLoading(true);
        try {
            const audit = await auditReviewPackage(title, description, initiative.sector);
            const newPackage: TReviewPackage = {
                id: `pkg-${Date.now()}`,
                title,
                description,
                status: 'Draft',
                createdDate: new Date().toLocaleDateString(),
                aiAudit: audit,
                approvers: [
                    { id: 'a1', name: 'Product Owner', role: 'Strategy Lead', status: 'Pending' },
                    { id: 'a2', name: 'Tech Lead', role: 'Architecture', status: 'Pending' }
                ]
            };
            setPackages([newPackage, ...packages]);
            setIsCreating(false);
            setTitle('');
            setDescription('');
        } catch (error) {
            console.error(error);
            setError("Failed to create package.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOff = (pkgId: string, approverId: string, decision: 'Approved' | 'Rejected') => {
        setPackages(prev => prev.map(pkg => {
            if (pkg.id !== pkgId) return pkg;
            
            const updatedApprovers = pkg.approvers.map(a => 
                a.id === approverId ? { ...a, status: decision } : a
            );
            
            const allApproved = updatedApprovers.every(a => a.status === 'Approved');
            const anyRejected = updatedApprovers.some(a => a.status === 'Rejected');
            const newStatus = anyRejected ? 'Rejected' : allApproved ? 'Baselined' : 'In Review';

            return { ...pkg, approvers: updatedApprovers, status: newStatus };
        }));
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Baselined': return 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20';
            case 'In Review': return 'bg-accent-purple/10 text-accent-purple border-accent-purple/20';
            case 'Rejected': return 'bg-accent-red/10 text-accent-red border-accent-red/20';
            default: return 'bg-surface-dark text-text-muted-dark border-surface-light';
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
                        <DocumentCheckIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Approval Center
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Baseline requirements with AI pre-audits and digital sign-offs (BABOK 5.5).
                    </p>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)}>+ New Review Package</Button>
                )}
            </div>

            {isCreating && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-6 animate-fade-in-down">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Create Review Package</h3>
                    <div className="space-y-4">
                        <input 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            placeholder="Package Title (e.g. Core Banking Module v1.0)"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                        <textarea 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            rows={3}
                            placeholder="Describe what is included (e.g. BRD, Data Model, UAT Scripts)..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <Button onClick={handleCreatePackage} disabled={isLoading || !title}>
                                {isLoading ? <Spinner /> : 'Audit & Create'}
                            </Button>
                            <button onClick={() => setIsCreating(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {(packages || []).map(pkg => (
                    <div key={pkg.id} className={`border-l-4 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 ${getStatusColor(pkg.status).split(' ')[0]}`}>
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pkg.title}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getStatusColor(pkg.status)}`}>
                                        {pkg.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{pkg.description}</p>
                                
                                {/* AI Audit */}
                                <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-xs text-gray-500 uppercase">AI Readiness Score</span>
                                        <span className={`font-black text-lg ${pkg.aiAudit.score >= 80 ? 'text-accent-emerald' : 'text-accent-amber'}`}>
                                            {pkg.aiAudit.score}/100
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{pkg.aiAudit.summary}</p>
                                    {(pkg.aiAudit.flags || []).length > 0 && (
                                        <div className="text-xs text-accent-red">
                                            <strong className="flex items-center gap-1"><ShieldExclamationIcon className="h-3 w-3"/> Attention:</strong>
                                            <ul className="list-disc list-inside pl-1 mt-1">
                                                {pkg.aiAudit.flags.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Approvers */}
                            <div className="w-full lg:w-1/3 flex flex-col gap-3">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Sign-off Chain</h4>
                                {(pkg.approvers || []).map(approver => (
                                    <div key={approver.id} className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-white">{approver.name}</p>
                                            <p className="text-xs text-gray-500">{approver.role}</p>
                                        </div>
                                        {approver.status === 'Pending' ? (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleSignOff(pkg.id, approver.id, 'Approved')} className="p-1 text-accent-emerald hover:bg-accent-emerald/10 rounded" title="Sign">
                                                    <FingerPrintIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleSignOff(pkg.id, approver.id, 'Rejected')} className="p-1 text-accent-red hover:bg-accent-red/10 rounded" title="Reject">
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                approver.status === 'Approved' ? 'text-accent-emerald bg-accent-emerald/10' : 'text-accent-red bg-accent-red/10'
                                            }`}>
                                                {approver.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {(packages || []).length === 0 && !isCreating && (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                        <DocumentCheckIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>No review packages yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
