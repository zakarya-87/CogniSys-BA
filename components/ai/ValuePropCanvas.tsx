
import React, { useState } from 'react';
import { TInitiative, TValuePropCanvas } from '../../types';
import { generateValuePropCanvas } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface ValuePropCanvasProps {
    initiative: TInitiative;
}

const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;

const CanvasSection: React.FC<{ title: string; items: string[]; color: string; icon: string }> = ({ title, items, color, icon }) => (
    <div className={`p-3 rounded-lg border ${color} h-full overflow-y-auto custom-scrollbar max-h-48`}>
        <h4 className="font-bold text-xs uppercase mb-2 opacity-80 flex items-center gap-1">{icon} {title}</h4>
        <ul className="list-disc list-inside text-xs space-y-1">
            {items.map((item, i) => (
                <li key={i} className="leading-snug">{item}</li>
            ))}
        </ul>
    </div>
);

export const ValuePropCanvas: React.FC<ValuePropCanvasProps> = ({ initiative }) => {
    const [product, setProduct] = useState(initiative.title);
    const [error, setError] = useState<string | null>(null);
    const [segment, setSegment] = useState('Early Adopters');
    const [canvas, setCanvas] = useState<TValuePropCanvas | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!product.trim() || !segment.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateValuePropCanvas(product, segment, initiative.sector);
            setCanvas(result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate canvas.");
        } finally {
            setIsLoading(false);
        }
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
                        <HeartIcon className="h-7 w-7 text-accent-teal" />
                        Intelligent Value Proposition Canvas
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Ensure product-market fit by mapping user needs to features (Strategyzer).
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product / Offering</label>
                        <input 
                            type="text" 
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-teal"
                            placeholder="e.g. Premium Subscription"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Segment</label>
                        <input 
                            type="text" 
                            value={segment}
                            onChange={(e) => setSegment(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-teal"
                            placeholder="e.g. Small Business Owners"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleGenerate} disabled={isLoading || !product || !segment}>
                        {isLoading ? <Spinner /> : 'Map Value'}
                    </Button>
                </div>
            </div>

            {canvas && (
                <div className="flex-grow animate-fade-in-down flex flex-col gap-6">
                    {(!canvas.customerProfile || !canvas.valueMap) ? (
                        <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 mb-4">
                            <h3 className="font-bold mb-2">Analysis Format Error</h3>
                            <p>The generated analysis data is in an unexpected format. Please click "Map Value" to regenerate it.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
                                {/* Left: Value Map (Square) */}
                                <div className="border-2 border-accent-teal/20 dark:border-accent-teal/30 rounded-xl p-4 flex flex-col bg-white dark:bg-gray-900 relative">
                                    <div className="absolute top-2 left-2 text-sm font-bold text-accent-teal uppercase tracking-widest">Value Map (Product)</div>
                                    
                                    <div className="flex-grow grid grid-rows-2 gap-2 mt-6">
                                        <div className="grid grid-cols-2 gap-2">
                                             <CanvasSection 
                                                title="Gain Creators" 
                                                items={canvas.valueMap?.gainCreators || []} 
                                                color="bg-accent-emerald/10 dark:bg-accent-emerald/20 border-accent-emerald/20 dark:border-accent-emerald/30 text-accent-emerald"
                                                icon="⚡"
                                            />
                                             <CanvasSection 
                                                title="Pain Relievers" 
                                                items={canvas.valueMap?.painRelievers || []} 
                                                color="bg-accent-red/10 dark:bg-accent-red/20 border-accent-red/20 dark:border-accent-red/30 text-accent-red"
                                                icon="💊"
                                            />
                                        </div>
                                        <CanvasSection 
                                            title="Products & Services" 
                                            items={canvas.valueMap?.products || []} 
                                            color="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                                            icon="📦"
                                        />
                                    </div>
                                </div>

                                {/* Right: Customer Profile (Circle - Visual Approximation) */}
                                <div className="border-2 border-accent-emerald/20 dark:border-accent-emerald/30 rounded-full p-8 flex flex-col bg-white dark:bg-gray-900 relative aspect-square max-h-[500px] mx-auto w-full max-w-[500px]">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-2 text-sm font-bold text-accent-emerald uppercase tracking-widest">Customer Profile</div>
                                    
                                    <div className="h-full flex flex-col gap-2">
                                        <div className="flex-1">
                                            <CanvasSection 
                                                title="Gains (Outcomes)" 
                                                items={canvas.customerProfile?.gains || []} 
                                                color="bg-accent-emerald/10 dark:bg-accent-emerald/20 border-accent-emerald/20 dark:border-accent-emerald/30 text-accent-emerald"
                                                icon="😊"
                                            />
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <div className="w-1/2">
                                                 <CanvasSection 
                                                    title="Jobs to be Done" 
                                                    items={canvas.customerProfile?.jobs || []} 
                                                    color="bg-accent-teal/10 dark:bg-accent-teal/20 border-accent-teal/20 dark:border-accent-teal/30 text-accent-teal"
                                                    icon="🔨"
                                                />
                                            </div>
                                            <div className="w-1/2">
                                                <CanvasSection 
                                                    title="Pains (Risks)" 
                                                    items={canvas.customerProfile?.pains || []} 
                                                    color="bg-accent-red/10 dark:bg-accent-red/20 border-accent-red/20 dark:border-accent-red/30 text-accent-red"
                                                    icon="😫"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-accent-teal/10 dark:bg-accent-teal/20 p-4 rounded-lg border border-accent-teal/20 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-accent-teal mb-1">Product-Market Fit Analysis</h3>
                                    <p className="text-sm text-accent-teal/80">{canvas.analysis}</p>
                                </div>
                                <div className="text-center ml-4 pl-4 border-l border-accent-teal/20 dark:border-accent-teal/30">
                                    <div className="text-xs font-bold text-accent-teal/60 uppercase">Fit Score</div>
                                    <div className="text-3xl font-black text-accent-teal">{canvas.fitScore}%</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
