
import React, { useState, useMemo } from 'react';
import { TInitiative, TBacklogItem, TReleaseNote } from '../../types';
import { generateReleaseNotes } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ReleaseNotesWriterProps {
    initiative: TInitiative;
    backlogItems: TBacklogItem[];
}

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MegaphoneIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.439.875.971 1.114 1.566.294.738.294 1.555 0 2.294a3.495 3.495 0 01-1.114 1.566" /></svg>;

export const ReleaseNotesWriter: React.FC<ReleaseNotesWriterProps> = ({ initiative, backlogItems }) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [version, setVersion] = useState('1.0.0');
    const [notes, setNotes] = useState<TReleaseNote | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filter for DONE items only, with defensive check using Array.isArray
    const doneItems = useMemo(() => (Array.isArray(backlogItems) ? backlogItems : []).filter(i => i.status === 'Done'), [backlogItems]);

    const toggleItem = (title: string) => {
        setSelectedItems(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
    };

    const handleSelectAll = () => {
        if (selectedItems.length === doneItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(doneItems.map(i => i.title));
        }
    };

    const handleGenerate = async () => {
        if (selectedItems.length === 0) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateReleaseNotes(selectedItems, initiative.sector, version);
            setNotes(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate release notes.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!notes) return;
        const text = `# ${notes.title}\nVersion: ${notes.version}\n\n${notes.intro}\n\n${(notes.sections || []).map(s => `## ${s.type}\n${(s.items || []).map(i => `- ${i}`).join('\n')}`).join('\n\n')}\n\n${notes.closing}`;
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
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
                        <MegaphoneIcon className="h-7 w-7 text-accent-purple" />
                        Intelligent Release Notes Writer
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Turn completed backlog items into user-friendly communication assets.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left: Selection */}
                <div className="flex flex-col gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex-grow mr-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Version</label>
                                <input 
                                    type="text" 
                                    value={version} 
                                    onChange={(e) => setVersion(e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                />
                            </div>
                            <Button onClick={handleGenerate} disabled={isLoading || selectedItems.length === 0}>
                                {isLoading ? <Spinner /> : 'Draft Release Notes'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-grow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Completed Items ({doneItems.length})</span>
                            <button onClick={handleSelectAll} className="text-xs text-accent-purple dark:text-accent-purple/90 hover:underline">
                                {selectedItems.length === doneItems.length && doneItems.length > 0 ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 flex-grow">
                            {doneItems.length === 0 && (
                                <p className="text-center text-sm text-gray-500 mt-4">No completed items in backlog.</p>
                            )}
                            {doneItems.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => toggleItem(item.title)}
                                    className={`flex items-center p-2 rounded cursor-pointer text-sm transition-colors ${
                                        selectedItems.includes(item.title) 
                                            ? 'bg-accent-purple/10 text-accent-purple dark:text-accent-purple/90' 
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItems.includes(item.title)}
                                        onChange={() => {}} 
                                        className="rounded text-accent-purple focus:ring-accent-purple/50 mr-3 pointer-events-none"
                                    />
                                    {item.title}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col relative">
                    {!notes ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                            <SparklesIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-center">Select items and click "Draft Release Notes"<br/>to see the AI magic.</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in-down flex flex-col h-full">
                            <div className="flex justify-end mb-2">
                                <button onClick={handleCopy} className="text-xs font-bold text-accent-purple dark:text-accent-purple/90 hover:underline flex items-center">
                                    Copy Markdown
                                </button>
                            </div>
                            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 prose dark:prose-invert max-w-none">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{notes.title}</h1>
                                <p className="text-sm text-gray-500 font-mono mb-4">{new Date().toLocaleDateString()} | v{notes.version}</p>
                                
                                <p className="text-gray-700 dark:text-gray-300 italic mb-6">{notes.intro}</p>

                                {(notes.sections || []).map((section, i) => (
                                    <div key={i} className="mb-6">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
                                            {section.type}
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {(section.items || []).map((item, j) => (
                                                <li key={j} className="text-gray-700 dark:text-gray-300 text-sm">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}

                                <hr className="my-6 border-gray-200 dark:border-gray-700" />
                                <p className="text-gray-600 dark:text-gray-400 font-medium">{notes.closing}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
