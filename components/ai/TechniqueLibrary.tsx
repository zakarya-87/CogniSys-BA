
import React, { useState, useMemo } from 'react';
import { BABOK_TECHNIQUES } from '../../constants';
// FIX: Imported TInitiative and TArtifact to resolve missing type errors.
import { TTechnique, TTechniqueCategory, TInitiative, TArtifact } from '../../types';
import { DecisionMatrixTool } from './DecisionMatrixTool';
import { ProcessModelerTool } from './ProcessModelerTool';
import { RaciMatrixTool } from './RaciMatrixTool';
import { FishboneDiagramTool } from './FishboneDiagramTool';
import { SwotAnalysisTool } from './SwotAnalysisTool';
import { GenericTechniqueAssistant } from './GenericTechniqueAssistant';

interface TechniqueLibraryProps {
    activeTechnique: string | null;
    setActiveTechnique: (techniqueName: string | null) => void;
    initiative: TInitiative; // Made required as Generic Assistant needs it
    onSaveArtifact?: (artifact: TArtifact) => void;
}

const categoryStyles: { [key in TTechniqueCategory]: string } = {
    'Strategy Analysis': 'bg-accent-red/10 text-accent-red dark:bg-accent-red/20',
    'Elicitation & Collaboration': 'bg-accent-purple/10 text-accent-purple dark:bg-accent-purple/20',
    'Requirements Analysis': 'bg-accent-purple/10 text-accent-purple dark:bg-accent-purple/20',
    'Solution Evaluation': 'bg-accent-emerald/10 text-accent-emerald dark:bg-accent-emerald/20',
};

const TechniqueCard: React.FC<{ technique: TTechnique; onSelect: () => void; }> = ({ technique, onSelect }) => (
    <div 
        onClick={onSelect}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
    >
        <h3 className="font-bold text-gray-900 dark:text-white">{technique.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 my-2 line-clamp-2 h-10">{technique.description}</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryStyles[technique.category]}`}>{technique.category}</span>
    </div>
);

const uniqueCategories = [...new Set(BABOK_TECHNIQUES.map(t => t.category))];

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const ArrowsUpDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>;


export const TechniqueLibrary: React.FC<TechniqueLibraryProps> = ({ activeTechnique, setActiveTechnique, initiative, onSaveArtifact }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<TTechniqueCategory | 'All'>('All');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    const filteredAndSortedTechniques = useMemo(() => {
        let techniques = [...BABOK_TECHNIQUES];

        if (selectedCategory !== 'All') {
            techniques = techniques.filter(tech => tech.category === selectedCategory);
        }

        if (searchTerm) {
            techniques = techniques.filter(tech => 
                tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tech.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        techniques.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });

        return techniques;
    }, [searchTerm, selectedCategory, sortOrder]);

    const renderActiveTool = () => {
        switch(activeTechnique) {
            case 'Decision Matrix':
                return <DecisionMatrixTool initiative={initiative} />;
            case 'Process Modeling':
                return <ProcessModelerTool initiative={initiative} />;
            case 'RACI Matrix':
                return <RaciMatrixTool initiative={initiative} />;
            case 'Fishbone Diagram':
                return <FishboneDiagramTool />;
            case 'SWOT Analysis':
                return <SwotAnalysisTool initiative={initiative} onSaveArtifact={onSaveArtifact} />;
            default:
                // Fallback to Generic Assistant for any other technique
                if (activeTechnique) {
                    return <GenericTechniqueAssistant techniqueName={activeTechnique} initiative={initiative} />;
                }
                return (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Select a technique to get started</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose a technique from the library to launch its interactive tool.</p>
                    </div>
                );
        }
    };

    if (activeTechnique) {
        return (
            <div className="space-y-4">
                 <button onClick={() => setActiveTechnique(null)} className="text-sm font-semibold text-accent-purple hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                    Back to Technique Library
                </button>
                {renderActiveTool()}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Intelligent Technique Toolkit</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Explore BABOK® techniques and launch interactive tools to facilitate your analysis work.</p>
                
                <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">Category:</span>
                        {['All', ...uniqueCategories].map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category as TTechniqueCategory | 'All')}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                    selectedCategory === category
                                        ? 'bg-accent-purple text-white shadow'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search techniques by keyword..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                            />
                        </div>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <ArrowsUpDownIcon className="h-5 w-5" />
                            <span>Sort ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedTechniques.map(tech => (
                    <TechniqueCard 
                        key={tech.id} 
                        technique={tech} 
                        onSelect={() => setActiveTechnique(tech.name)} 
                    />
                ))}
            </div>
            {filteredAndSortedTechniques.length === 0 && (
                 <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg col-span-full">
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">No Techniques Found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
                </div>
            )}
        </div>
    );
};
