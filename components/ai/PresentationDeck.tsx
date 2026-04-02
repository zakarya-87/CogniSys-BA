
import React, { useState, useEffect } from 'react';
import { TInitiative, TSlide, Sector } from '../../types';
import { generatePresentation } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';
import { SlideRenderer } from '../ui/SlideRenderer';

interface PresentationDeckProps {
    initiative: TInitiative;
}

const PresentationChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>;
const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;

export const PresentationDeck: React.FC<PresentationDeckProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [slides, setSlides] = useState<TSlide[]>([]);
    const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.presentationDeck) {
            setSlides(initiative.artifacts.presentationDeck.slides || []);
            setExecutiveSummary(initiative.artifacts.presentationDeck.executiveSummary || null);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const result = await generatePresentation(initiative.title, initiative.description, initiative.sector);
            const safeSlides = Array.isArray(result.slides) ? result.slides : [];
            setSlides(safeSlides);
            setExecutiveSummary(result.executiveSummary || null);
            setCurrentSlide(0);
            saveArtifact(initiative.id, 'presentationDeck', { slides: safeSlides, executiveSummary: result.executiveSummary });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, (slides || []).length - 1));
    const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <PresentationChartBarIcon className="h-6 w-6 text-accent-purple" />
                        Catalyst Presentation Engine
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Turn your analysis into a boardroom-ready pitch deck for the {initiative.sector} sector.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <Spinner /> : ((slides || []).length > 0 ? 'Regenerate Deck' : 'Generate Pitch Deck')}
                    </Button>
                    {(slides || []).length > 0 && (
                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        </button>
                    )}
                </div>
            </div>

            {(slides || []).length > 0 ? (
                <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black p-10 flex items-center justify-center' : 'relative w-full aspect-video mx-auto max-w-4xl'}`}>
                    
                    <SlideRenderer 
                        slide={slides[currentSlide]} 
                        sector={initiative.sector} 
                        contextFooter={`${initiative.title} // Slide ${currentSlide + 1}`} 
                    />
                    
                    {/* Controls */}
                    <button 
                        onClick={prevSlide} 
                        disabled={currentSlide === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                    >
                        <ChevronLeftIcon className="h-8 w-8" />
                    </button>
                    <button 
                        onClick={nextSlide} 
                        disabled={currentSlide === (slides || []).length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                    >
                        <ChevronRightIcon className="h-8 w-8" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {(Array.isArray(slides) ? slides : []).map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-4' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                !isLoading && (
                    <div className="bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                        <PresentationChartBarIcon className="h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Deck Generated</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mt-2">
                            Click "Generate Pitch Deck" to have the AI synthesize your vision, strategy, and roadmap into a professional presentation.
                        </p>
                    </div>
                )
            )}

            {executiveSummary && (
                <div className="bg-accent-purple/5 dark:bg-accent-purple/10 border border-accent-purple/10 dark:border-accent-purple/20 rounded-lg p-6 mt-6">
                    <h3 className="text-lg font-semibold text-accent-purple dark:text-accent-purple/90 mb-3">Executive Summary</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {executiveSummary}
                    </p>
                </div>
            )}
        </div>
    );
};
