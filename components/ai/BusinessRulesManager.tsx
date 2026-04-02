
import React, { useState, useEffect } from 'react';
import { TInitiative, TDecisionTable, TRuleAudit } from '../../types';
import { generateDecisionTable, auditBusinessRules } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface BusinessRulesManagerProps {
    initiative: TInitiative;
}

const TableCellsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25v1.5c0 .621.504 1.125 1.125 1.125m17.25-2.625h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125v1.5c0 .621-.504 1.125-1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 1.5c0 .621.504-1.125 1.125-1.125M3.375 18.375h7.5" /></svg>;
const BoltIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const CheckBadgeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;

export const BusinessRulesManager: React.FC<BusinessRulesManagerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [policyText, setPolicyText] = useState('If user score > 700 and income > 50000, approve loan. If score < 600, reject. Else, refer to manual review.');
    const [error, setError] = useState<string | null>(null);
    const [decisionTable, setDecisionTable] = useState<TDecisionTable | null>(null);
    const [audit, setAudit] = useState<TRuleAudit | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);

    // Load persisted artifacts
    useEffect(() => {
        if (initiative.artifacts?.businessRules) {
            setDecisionTable(initiative.artifacts.businessRules.table);
            setAudit(initiative.artifacts.businessRules.audit);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!policyText.trim()) return;
        setError(null);
        setIsLoading(true);
        setDecisionTable(null);
        setAudit(null);
        try {
            const result = await generateDecisionTable(policyText, initiative.sector);
            setDecisionTable(result);
            // Persist (Audit is null initially)
            saveArtifact(initiative.id, 'businessRules', { table: result, audit: null });
        } catch (e) {
            console.error(e);
            setError("Failed to generate table.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAudit = async () => {
        if (!decisionTable) return;
        setIsAuditing(true);
        try {
            const result = await auditBusinessRules(decisionTable);
            setAudit(result);
            // Update persistence with audit
            saveArtifact(initiative.id, 'businessRules', { table: decisionTable, audit: result });
        } catch (e) {
            console.error(e);
            setError("Failed to audit rules.");
        } finally {
            setIsAuditing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6 h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TableCellsIcon className="h-6 w-6 text-accent-purple" />
                        Business Rules Manager
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Define, model, and validate complex decision logic (BABOK 10.9).
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Policy Description (Natural Language)
                </label>
                <textarea 
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                    rows={3}
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    placeholder="E.g., If customer is VIP and order > $1000, apply 10% discount..."
                />
                <Button onClick={handleGenerate} disabled={isLoading || !policyText}>
                    {isLoading ? <Spinner /> : 'Model Decision Table'}
                </Button>
            </div>

            {decisionTable && (
                <div className="flex-grow animate-fade-in-down">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{decisionTable.name}</h3>
                            <Button onClick={handleAudit} disabled={isAuditing} className="bg-accent-emerald hover:bg-accent-emerald/80">
                                {isAuditing ? <Spinner /> : <><BoltIcon className="h-4 w-4 mr-2"/> Audit Logic</>}
                            </Button>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                <thead>
                                    <tr>
                                        <th colSpan={(decisionTable.inputs || []).length} className="bg-accent-purple/10 text-center border-b border-r border-gray-300 dark:border-gray-600 py-2 text-sm font-bold text-accent-purple">
                                            Conditions (Inputs)
                                        </th>
                                        <th colSpan={(decisionTable.outputs || []).length} className="bg-accent-emerald/10 text-center border-b border-gray-300 dark:border-gray-600 py-2 text-sm font-bold text-accent-emerald">
                                            Actions (Outputs)
                                        </th>
                                    </tr>
                                    <tr className="bg-gray-100 dark:bg-gray-800">
                                        {(decisionTable.inputs || []).map((input, i) => (
                                            <th key={`in-${i}`} className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                                {input}
                                            </th>
                                        ))}
                                        {(decisionTable.outputs || []).map((output, i) => (
                                            <th key={`out-${i}`} className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                                {output}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(decisionTable.rules || []).map((row, rIndex) => (
                                        <tr key={rIndex} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            {row.map((cell, cIndex) => (
                                                <td key={cIndex} className={`p-2 text-sm border-t border-r border-gray-200 dark:border-gray-700 ${cIndex < (decisionTable.inputs || []).length ? 'text-accent-purple' : 'text-accent-emerald font-medium'}`}>
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {audit && (
                        <div className="mt-6 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <h4 className="font-bold text-gray-900 dark:text-white">Logic Audit Report</h4>
                                {audit.isSound ? (
                                    <span className="px-2 py-1 rounded bg-accent-emerald/10 text-accent-emerald text-xs font-bold flex items-center gap-1">
                                        <CheckBadgeIcon className="h-4 w-4"/> Sound
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 rounded bg-accent-amber/10 text-accent-amber text-xs font-bold flex items-center gap-1">
                                        <ExclamationTriangleIcon className="h-4 w-4"/> Issues Found
                                    </span>
                                )}
                            </div>
                            
                            <div className="space-y-2 text-sm">
                                {(audit.gaps || []).length > 0 && (
                                    <div className="text-accent-red">
                                        <strong>Missing Scenarios:</strong>
                                        <ul className="list-disc list-inside pl-2">{(audit.gaps || []).map((g,i) => <li key={i}>{g}</li>)}</ul>
                                    </div>
                                )}
                                {(audit.overlaps || []).length > 0 && (
                                    <div className="text-accent-amber">
                                        <strong>Conflicting Rules:</strong>
                                        <ul className="list-disc list-inside pl-2">{(audit.overlaps || []).map((o,i) => <li key={i}>{o}</li>)}</ul>
                                    </div>
                                )}
                                {(audit.suggestions || []).length > 0 && (
                                    <div className="text-accent-purple">
                                        <strong>Suggestions:</strong>
                                        <ul className="list-disc list-inside pl-2">{(audit.suggestions || []).map((s,i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}
                                {(audit.gaps || []).length === 0 && (audit.overlaps || []).length === 0 && (
                                    <p className="text-accent-emerald">No logical gaps or conflicts detected. The logic appears complete.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
