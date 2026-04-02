
import React, { useState } from 'react';
import { TSlide, Sector } from '../../types';
import { SlideRenderer } from './SlideRenderer';

interface PresentationViewerProps {
    slides: TSlide[];
    title: string;
    sector: Sector | string;
}

const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;

export const PresentationViewer: React.FC<PresentationViewerProps> = ({ slides, title, sector }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, (slides || []).length - 1));
    const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

    if (!slides || !Array.isArray(slides) || slides.length === 0) return null;

    return (
        <div className="w-full max-w-lg mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-700">
            <div className="relative aspect-video">
                <SlideRenderer 
                    slide={slides[currentSlide]} 
                    sector={sector} 
                    contextFooter={`${title} // ${currentSlide + 1} of ${(slides || []).length}`} 
                />
                
                {/* Controls */}
                <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                    <button 
                        onClick={prevSlide} 
                        disabled={currentSlide === 0}
                        className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0 transition-all pointer-events-auto"
                    >
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <button 
                        onClick={nextSlide} 
                        disabled={currentSlide === (slides || []).length - 1}
                        className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0 transition-all pointer-events-auto"
                    >
                        <ChevronRightIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {slides.map((_, i) => (
                        <div 
                            key={i} 
                            onClick={() => setCurrentSlide(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === currentSlide ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="bg-gray-900 p-2 flex justify-between items-center text-xs text-gray-400">
                <span>{title}</span>
                <button 
                    onClick={() => alert("PDF Export Simulated")} 
                    className="hover:text-white transition-colors"
                >
                    Download PDF
                </button>
            </div>
        </div>
    );
};
