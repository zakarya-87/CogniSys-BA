
import React, { useState } from 'react';
import { TInitiative } from '../../types';
import { useCatalyst } from '../../context/CatalystContext';
import { Button } from '../ui/Button';

interface ArtifactExplorerProps {
    initiative: TInitiative;
}

const FolderIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>;
const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.92-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const ArrowDownTrayIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;

export const ArtifactExplorer: React.FC<ArtifactExplorerProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    // Filter out null/undefined artifacts (soft deleted)
    const artifacts = initiative.artifacts || {};
    const keys = Object.keys(artifacts).filter(k => artifacts[k] !== null && artifacts[k] !== undefined);

    const handleDelete = (key: string) => {
        if (confirm(`Are you sure you want to delete the "${key}" artifact? This effectively resets the corresponding module.`)) {
            // Soft delete by setting to null
            saveArtifact(initiative.id, key, null);
            if (selectedKey === key) setSelectedKey(null);
        }
    };

    const handleDownload = (key: string) => {
        const data = artifacts[key];
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${initiative.title.replace(/\s+/g, '_')}_${key}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FolderIcon className="h-7 w-7 text-accent-purple" />
                        Artifact Explorer
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage and audit all AI-generated data assets for this initiative.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full overflow-hidden">
                {/* File List */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 text-sm">
                        Files ({keys.length})
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {keys.length === 0 && (
                            <p className="text-center text-gray-500 text-sm mt-10">No artifacts generated yet.</p>
                        )}
                        {keys.map(key => (
                            <div 
                                key={key}
                                onClick={() => setSelectedKey(key)}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm group ${
                                    selectedKey === key 
                                        ? 'bg-accent-purple/10 text-accent-purple' 
                                        : 'hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <DocumentIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{key}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="lg:col-span-2 bg-gray-900 rounded-lg border border-gray-700 flex flex-col overflow-hidden text-gray-300">
                    {selectedKey ? (
                        <>
                            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                                <span className="font-mono text-sm font-bold text-white">{selectedKey}.json</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleDownload(selectedKey)}
                                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                                        title="Download JSON"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(selectedKey)}
                                        className="p-1.5 hover:bg-accent-red/10 rounded text-accent-red hover:text-accent-red transition-colors"
                                        title="Delete Artifact"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-grow overflow-auto custom-scrollbar p-4 font-mono text-xs">
                                <pre>{JSON.stringify(artifacts[selectedKey], null, 2)}</pre>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-600">
                            <FolderIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p>Select an artifact to view raw data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
