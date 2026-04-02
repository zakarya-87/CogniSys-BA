import React, { useState } from 'react';

interface Cause {
    id: number;
    text: string;
}

interface Category {
    name: string;
    causes: Cause[];
}

const initialCategories: Category[] = [
    { name: 'People', causes: [{ id: 1, text: 'Lack of training' }] },
    { name: 'Process', causes: [{ id: 1, text: 'No clear SOP' }] },
    { name: 'Technology', causes: [{ id: 1, text: 'System downtime' }] },
    { name: 'Management', causes: [{ id: 1, text: 'Poor communication' }] },
    { name: 'Environment', causes: [{ id: 1, text: 'Noisy workplace' }] },
    { name: 'Measurement', causes: [{ id: 1, text: 'Inaccurate data' }] },
];

export const FishboneDiagramTool: React.FC = () => {
    const [problem, setProblem] = useState('Low User Engagement');
    const [categories, setCategories] = useState<Category[]>(initialCategories);

    const handleAddCause = (categoryIndex: number) => {
        const newCategories = [...categories];
        const newCause = { id: Date.now(), text: 'New Cause' };
        newCategories[categoryIndex].causes.push(newCause);
        setCategories(newCategories);
    };
    
    const handleCauseChange = (categoryIndex: number, causeId: number, newText: string) => {
        const newCategories = [...categories];
        const cause = newCategories[categoryIndex].causes.find(c => c.id === causeId);
        if (cause) {
            cause.text = newText;
        }
        setCategories(newCategories);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Interactive Fishbone (Ishikawa) Diagram</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Identify potential root causes for a specific problem by brainstorming and categorizing ideas.</p>
            </div>
            
            <div className="space-y-2">
                <label htmlFor="problem" className="block text-sm font-medium">Problem / Effect</label>
                <input
                    id="problem"
                    type="text"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    className="w-full max-w-lg p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                />
            </div>

            <div className="overflow-x-auto custom-scrollbar p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <svg width="1000" height="600" viewBox="0 0 1000 600" className="min-w-full">
                    {/* Spine */}
                    <line x1="50" y1="300" x2="850" y2="300" className="stroke-gray-800 dark:stroke-gray-200" strokeWidth="3" />
                    
                    {/* Head */}
                    <rect x="850" y="270" width="130" height="60" className="fill-accent-purple" />
                    <text x="915" y="305" textAnchor="middle" className="fill-white font-bold">{problem}</text>

                    {categories.map((category, catIndex) => {
                        const isTop = catIndex % 2 === 0;
                        const y = isTop ? 150 : 450;
                        const lineYEnd = isTop ? 295 : 305;
                        const textY = isTop ? y - 10 : y + 20;
                        const causeYStart = isTop ? y + 20 : y - 20;

                        return (
                            <g key={category.name}>
                                {/* Main Bone */}
                                <line x1={150 + catIndex * 120} y1={y} x2={150 + catIndex * 120} y2={lineYEnd} className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="2" />
                                <text x={150 + catIndex * 120} y={textY} textAnchor="middle" className="font-semibold fill-gray-900 dark:fill-white">{category.name}</text>
                                <button onClick={() => handleAddCause(catIndex)} className="text-accent-purple text-xs">
                                    <foreignObject x={135 + catIndex * 120} y={isTop ? y - 35 : y + 20} width="30" height="20">
                                       <div title="Add Cause" className="w-5 h-5 bg-accent-purple text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-accent-purple/80">+</div>
                                    </foreignObject>
                                </button>
                                
                                {/* Causes */}
                                {category.causes.map((cause, causeIndex) => (
                                    <g key={cause.id}>
                                         <line x1={150 + catIndex * 120} y1={y} x2={120 + catIndex * 120 + (causeIndex % 2 * 60)} y2={isTop ? y + 20 + causeIndex * 30 : y - 20 - causeIndex * 30} className="stroke-gray-500 dark:stroke-gray-500" strokeWidth="1" />
                                        <foreignObject x={80 + catIndex * 120 + (causeIndex % 2 * 60)} y={isTop ? y + 10 + causeIndex * 30 : y - 40 - causeIndex * 30} width="80" height="25">
                                            <input
                                                type="text"
                                                value={cause.text}
                                                onChange={(e) => handleCauseChange(catIndex, cause.id, e.target.value)}
                                                className="w-full text-xs p-1 bg-transparent border-b border-gray-400 focus:outline-none focus:border-accent-purple dark:text-gray-300"
                                            />
                                        </foreignObject>
                                    </g>
                                ))}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
