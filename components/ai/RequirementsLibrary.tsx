
import React, { useState, useEffect } from 'react';
import { TInitiative, TRequirementPackage, BacklogItemType, BacklogItemPriority } from '../../types';
import { suggestReusablePackages } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface RequirementsLibraryProps {
    initiative: TInitiative;
    onAddToBacklog: (items: any[]) => void;
}

const RectangleStackIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;
const ArrowDownOnSquareStackIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;

export const RequirementsLibrary: React.FC<RequirementsLibraryProps> = ({ initiative, onAddToBacklog }) => {
    const { setToastMessage } = useCatalyst();
    const [packages, setPackages] = useState<TRequirementPackage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

    useEffect(() => {
        handleScan();
    }, []);

    const handleScan = async () => {
        setIsLoading(true);
        try {
            const result = await suggestReusablePackages(initiative.sector);
            setPackages(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = (pkg: TRequirementPackage) => {
        const itemsToImport = (pkg.items || []).map(item => ({
            id: `lib-${Date.now()}-${Math.random()}`,
            title: item.title,
            type: item.type,
            priority: item.priority,
            status: 'To Do'
        }));
        onAddToBacklog(itemsToImport);
        setToastMessage(`Imported ${itemsToImport.length} items from ${pkg.title}`);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <RectangleStackIcon className="h-7 w-7 text-accent-purple" />
                        Requirements Reuse Library
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Accelerate delivery by importing standardized, sector-verified requirement packages (BABOK 5.2).
                    </p>
                </div>
                <Button onClick={handleScan} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Refresh Catalog'}
                </Button>
            </div>

            {packages.length === 0 && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <RectangleStackIcon className="h-16 w-16 mb-4" />
                    <p>Scanning enterprise repository...</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-down overflow-y-auto custom-scrollbar p-1">
                {packages.map(pkg => (
                    <div key={pkg.id} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
                        <div className="p-4 flex-grow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold uppercase bg-accent-purple/10 text-accent-purple dark:bg-accent-purple/20 dark:text-accent-purple/90 px-2 py-0.5 rounded">
                                    {pkg.sector}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{pkg.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{pkg.description}</p>
                            
                            <div className="flex flex-wrap gap-1 mb-4">
                                {(pkg.tags || []).map(tag => (
                                    <span key={tag} className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Expandable Content */}
                        {expandedPkg === pkg.id && (
                            <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 text-sm max-h-48 overflow-y-auto custom-scrollbar">
                                <h4 className="font-bold mb-2 text-xs uppercase text-gray-500">Included Items:</h4>
                                <ul className="space-y-1">
                                    {(pkg.items || []).map((item, i) => (
                                        <li key={i} className="flex justify-between text-gray-700 dark:text-gray-300">
                                            <span>• {item.title}</span>
                                            <span className="text-xs opacity-50">{item.type}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="bg-gray-100 dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <button 
                                onClick={() => setExpandedPkg(prev => prev === pkg.id ? null : pkg.id)}
                                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:underline"
                            >
                                {expandedPkg === pkg.id ? 'Hide Contents' : 'View Contents'}
                            </button>
                            <button 
                                onClick={() => handleImport(pkg)}
                                className="flex items-center gap-1 bg-accent-purple hover:bg-accent-purple/90 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                            >
                                <ArrowDownOnSquareStackIcon className="h-4 w-4" /> Import
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
