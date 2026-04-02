
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { TInitiative } from '../../types';
import { generateProjectDocument } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface DocumentationEngineProps {
    initiative: TInitiative;
}

const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const ClipboardDocumentIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>;

export const DocumentationEngine: React.FC<DocumentationEngineProps> = ({ initiative }) => {
    const [docType, setDocType] = useState('BRD');
    const [documentContent, setDocumentContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateProjectDocument(initiative, docType);
            setDocumentContent(result);
        } catch (err) {
            setError('Failed to generate document. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (documentContent) {
            navigator.clipboard.writeText(documentContent);
            alert("Document copied to clipboard!");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <DocumentIcon className="h-7 w-7 text-accent-purple" />
                        Catalyst Documentation Engine
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">Generate formal, sector-specific project documentation instantly.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-purple flex-grow sm:flex-grow-0"
                    >
                        <option value="BRD">Business Requirements Document (BRD)</option>
                        <option value="SRS">Software Requirements Specification (SRS)</option>
                        <option value="Executive Brief">Executive Briefing</option>
                        <option value="Risk Assessment">Risk Assessment Report</option>
                        <option value="Compliance Checklist">Regulatory Compliance Checklist</option>
                    </select>
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <Spinner /> : 'Draft Document'}
                    </Button>
                </div>
            </div>

            {error && <div className="bg-accent-red/10 text-accent-red p-4 rounded-md mb-4 border border-accent-red/20">{error}</div>}

            <div className="flex-grow bg-gray-50 dark:bg-gray-900/50 p-8 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[500px] overflow-auto shadow-inner relative">
                {documentContent ? (
                    <>
                        <div className="absolute top-4 right-4">
                            <button onClick={handleCopy} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Copy to Clipboard">
                                <ClipboardDocumentIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>
                        <article className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{documentContent}</ReactMarkdown>
                        </article>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <DocumentIcon className="h-16 w-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No document generated yet.</p>
                        <p className="text-sm">Select a document type and click "Draft Document" to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
