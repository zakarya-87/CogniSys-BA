
import React from 'react';
import { TSlide, Sector } from '../../types';

interface SlideRendererProps {
    slide: TSlide;
    sector: Sector | string;
    contextFooter: string;
}

const SECTOR_THEMES: { [key: string]: { bg: string; accent: string; text: string } } = {
    [Sector.SAAS_CLOUD]: { bg: 'bg-sky-900', accent: 'bg-sky-500', text: 'text-sky-100' },
    [Sector.FINTECH]: { bg: 'bg-slate-900', accent: 'bg-emerald-500', text: 'text-emerald-50' },
    [Sector.GREEN_ENERGY]: { bg: 'bg-teal-900', accent: 'bg-lime-400', text: 'text-lime-50' },
    [Sector.CIRCULAR_ECONOMY]: { bg: 'bg-cyan-900', accent: 'bg-cyan-400', text: 'text-cyan-50' },
    [Sector.AGRITECH_FOODTECH]: { bg: 'bg-amber-900', accent: 'bg-amber-500', text: 'text-amber-50' },
    [Sector.INDUSTRY_4_0]: { bg: 'bg-orange-900', accent: 'bg-orange-500', text: 'text-orange-50' },
    [Sector.BIOTECH_PHARMA]: { bg: 'bg-rose-900', accent: 'bg-rose-500', text: 'text-rose-50' },
    [Sector.GENERAL]: { bg: 'bg-gray-900', accent: 'bg-indigo-500', text: 'text-gray-100' },
};

export const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, sector, contextFooter }) => {
    const theme = SECTOR_THEMES[sector] || SECTOR_THEMES[Sector.GENERAL];

    return (
        <div className={`w-full h-full flex flex-col justify-between p-8 ${theme.bg} text-white shadow-lg rounded-xl relative overflow-hidden aspect-video select-none`}>
            {/* Decorative Background Element */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 ${theme.accent}`}></div>
            <div className={`absolute top-40 -left-10 w-40 h-40 rounded-full opacity-10 ${theme.accent}`}></div>

            <div className="z-10 flex-grow">
                <div className="flex justify-between items-center border-b border-white/20 pb-4 mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">{slide.title}</h2>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-black/30 border border-white/10 ${theme.text}`}>
                        {slide.type.toUpperCase()}
                    </span>
                </div>
                
                <ul className="space-y-4">
                    {(slide.bullets || []).map((bullet, i) => (
                        <li key={i} className="flex items-start text-lg font-light leading-relaxed">
                            <span className={`mr-3 mt-2 w-1.5 h-1.5 flex-shrink-0 rounded-full ${theme.accent}`}></span>
                            {bullet}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="z-10 border-t border-white/20 pt-3 flex justify-between items-center text-xs opacity-60 font-mono">
                <span>{contextFooter}</span>
                <span>{slide.footer}</span>
            </div>
        </div>
    );
};
