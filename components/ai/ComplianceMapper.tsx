
import React, { useState } from 'react';
import { TInitiative, TComplianceMatrix, TComplianceReport } from '../../types';
import { generateComplianceMatrix, generateComplianceReport } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ComplianceMapperProps {
    initiative: TInitiative;
}

const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 0121 12z" /></svg>;
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>;

export const ComplianceMapper: React.FC<ComplianceMapperProps> = ({ initiative }) => {
    const [matrix, setMatrix] = useState<TComplianceMatrix | null>(null);
    const [fullReport, setFullReport] = useState<TComplianceReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateComplianceMatrix(initiative.title, initiative.sector);
            setMatrix(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate compliance matrix.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateFullReport = async () => {
        setError(null);
        setIsGeneratingFull(true);
        try {
            const report = await generateComplianceReport(initiative);
            setFullReport(report);
        } catch (error) {
            console.error(error);
            setError("Failed to generate full compliance report.");
        } finally {
            setIsGeneratingFull(false);
        }
    };

    const handleExportReport = () => {
        if (!fullReport) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullReport, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `compliance_report_${initiative.id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const statusConfig = {
        'Compliant': { bg: 'bg-accent-emerald/10', text: 'text-accent-emerald', icon: '✅' },
        'Partial': { bg: 'bg-accent-amber/10', text: 'text-accent-amber', icon: '⚠️' },
        'Gap': { bg: 'bg-accent-red/10', text: 'text-accent-red', icon: '❌' },
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-accent-emerald';
        if (score >= 50) return 'text-accent-amber';
        return 'text-accent-red';
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
                        <ScaleIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Compliance Mapper
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Audit requirements against sector-specific regulations (e.g., HIPAA, GDPR, PCI-DSS).
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <Spinner /> : `Audit for ${initiative.sector}`}
                    </Button>
                    <Button onClick={handleGenerateFullReport} disabled={isGeneratingFull} variant="outline">
                        {isGeneratingFull ? <Spinner /> : 'Generate Full Report'}
                    </Button>
                </div>
            </div>

            {fullReport && (
                <div className="mb-6 p-4 bg-accent-purple/10 rounded-lg border border-accent-purple/20">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-accent-purple">Full Compliance Report Generated</h3>
                        <Button onClick={handleExportReport}>Export JSON</Button>
                    </div>
                    <p className="text-sm text-accent-purple/80">{fullReport.executiveSummary}</p>
                </div>
            )}

            {!matrix && !isLoading && !fullReport && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <ShieldCheckIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Identify regulatory gaps before they become liabilities. Click "Audit" to map requirements to standards or "Generate Full Report" for a comprehensive analysis.
                    </p>
                </div>
            )}

            {matrix && (
                <div className="flex-grow flex flex-col animate-fade-in-down">
                    {/* Header Stats */}
                    <div className="flex items-center gap-6 mb-6 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="text-center pr-6 border-r border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 uppercase font-bold">Standard</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{matrix.standard}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold">Compliance Score</p>
                            <p className={`text-3xl font-black ${getScoreColor(matrix.score)}`}>{matrix.score}%</p>
                        </div>
                        <div className="flex-grow">
                            {/* Simple Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                <div 
                                    className={`h-4 rounded-full ${matrix.score >= 80 ? 'bg-accent-emerald' : matrix.score >= 50 ? 'bg-accent-amber' : 'bg-accent-red'}`} 
                                    style={{ width: `${matrix.score}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Matrix Table */}
                    <div className="overflow-x-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Regulation Clause</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Evidence / Remediation</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {(matrix.items || []).map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{item.clause}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full gap-1 items-center ${statusConfig[item.status].bg} ${statusConfig[item.status].text}`}>
                                                {statusConfig[item.status].icon} {item.status}
                                            </span>
                                        </td>
                                         <td className="px-6 py-4 text-sm">
                                            {item.status === 'Compliant' ? (
                                                <span className="text-accent-emerald font-mono text-xs block bg-accent-emerald/10 p-1 rounded">
                                                    Linked: {item.evidence}
                                                </span>
                                            ) : (
                                                <div>
                                                    <span className="text-accent-red block mb-1 font-semibold">Missing Requirement:</span>
                                                    <span className="text-gray-600 dark:text-gray-300 italic">{item.remediation}</span>
                                                    <button className="block mt-2 text-xs text-accent-purple hover:underline font-bold">
                                                        + Add to Backlog
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
