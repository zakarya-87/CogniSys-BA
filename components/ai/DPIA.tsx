import { generateDPIA } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useEffect } from 'react';

interface DPIAProps {
    initiative: TInitiative;
    orgId: string;
}

const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
const LockClosedIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>;
const HistoryIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;

export const DPIA: React.FC<DPIAProps> = ({ initiative, orgId }) => {
    const [assessment, setAssessment] = useState<TDPIA | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'assessment' | 'audit'>('assessment');

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateDPIA(initiative.title, initiative.sector);
            setAssessment(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate DPIA.");
        } finally {
            setIsLoading(false);
        }
    };
    const fetchAuditLogs = async () => {
        try {
            // In a real app, we'd have a ListAuditLogs backend method
            // For now, we simulate fetching recent ai_operation events
            setAuditLogs([
                { id: '1', agent: 'Orchestrator', action: 'delegate', verdict: 'Pass', timestamp: Date.now() - 120000, metadata: { thought: 'Analyzing feasibility for Sprint 5...' } },
                { id: '2', agent: 'Guardian', action: 'ethics_scan', verdict: 'Pass', timestamp: Date.now() - 300000, metadata: { thought: 'No PII detected in instructions.' } }
            ]);
        } catch (e) {
            console.error("Failed to fetch audit logs:", e);
        }
    };

    useEffect(() => {
        if (activeTab === 'audit') fetchAuditLogs();
    }, [activeTab]);

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
                        <LockClosedIcon className="h-7 w-7 text-accent-purple" />
                        Governance & Ethics Hub
                    </h2>
                    <div className="flex gap-4 mt-2">
                        <button 
                            onClick={() => setActiveTab('assessment')}
                            className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${activeTab === 'assessment' ? 'border-accent-purple text-accent-purple' : 'border-transparent text-gray-400'}`}
                        >
                            Impact Assessment
                        </button>
                        <button 
                            onClick={() => setActiveTab('audit')}
                            className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${activeTab === 'audit' ? 'border-accent-purple text-accent-purple' : 'border-transparent text-gray-400'}`}
                        >
                            AI Audit Feed
                        </button>
                    </div>
                </div>
                {activeTab === 'assessment' && (
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <Spinner /> : 'Run Privacy Audit'}
                    </Button>
                )}
            </div>

            {activeTab === 'assessment' ? (
                <>
                    {!assessment && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <ShieldCheckIcon className="h-16 w-16 text-gray-400 mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Ensure GDPR/HIPAA compliance. Click "Run Privacy Audit" to scan for PII and ethical risks.
                    </p>
                </div>
            )}

            {assessment && (
                <div className="flex-grow animate-fade-in-down space-y-6">
                    {/* Score Card */}
                    <div className="flex items-center gap-6 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-center pr-6 border-r border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 uppercase font-bold">Privacy Score</p>
                            <p className={`text-4xl font-black ${assessment.privacyScore > 80 ? 'text-accent-emerald' : 'text-accent-red'}`}>
                                {assessment.privacyScore}
                            </p>
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                                <ScaleIcon className="h-5 w-5"/> Ethical AI Review
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{assessment.ethicsReview}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* PII Inventory */}
                        <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase">PII Inventory</h4>
                            <div className="space-y-2">
                                {(assessment.piiInventory || []).map((item, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-gray-100 dark:border-gray-600">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-800 dark:text-white">{item.field}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.category}</span>
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                            item.sensitivity === 'High' ? 'bg-red-100 text-red-800' : 
                                            item.sensitivity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {item.sensitivity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Privacy Risks */}
                        <div className="bg-accent-red/10 p-4 rounded-lg border border-accent-red/20">
                            <h4 className="font-bold text-accent-red mb-3 text-sm uppercase">Identified Risks</h4>
                            <div className="space-y-3">
                                {(assessment.risks || []).map((risk, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded border-l-4 border-accent-red shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-sm text-gray-900 dark:text-white">{risk.risk}</span>
                                            <span className="text-xs font-bold text-accent-red">{risk.regulation}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2">{risk.impact}</p>
                                        <div className="text-xs bg-accent-emerald/10 text-accent-emerald p-2 rounded">
                                            <strong>Mitigation:</strong> {risk.mitigation}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {!assessment ? (
                <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {auditLogs.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                             <HistoryIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                             <p>No audit events recorded for this initiative.</p>
                        </div>
                    ) : (
                        auditLogs.map(log => (
                            <div key={log.id} className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex gap-4">
                                <div className={`w-1 shadow transition-colors shrink-0 rounded-full ${log.verdict === 'Pass' ? 'bg-accent-emerald' : 'bg-accent-red'}`}></div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tighter bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{log.agent}</span>
                                            <span className="text-[10px] text-gray-500 uppercase">{log.action}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 italic mb-2">
                                        "{log.metadata?.thought?.substring(0, 120)}..."
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                             <UserIcon className="h-3 w-3 text-gray-400" />
                                             <span className="text-[10px] text-gray-400">System Orchestrator</span>
                                        </div>
                                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                            log.verdict === 'Pass' ? 'text-accent-emerald border-accent-emerald/20 bg-accent-emerald/5' : 'text-accent-red border-accent-red/20 bg-accent-red/5'
                                        }`}>
                                            {log.verdict === 'Pass' ? 'SAFE' : 'VIOLATION'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : null}
            </>
        ) : null}
        </div>
    );
};
