
import React from 'react';
import { TCortexGraph, TCortexNode, TCortexLink } from '../../../../types';

interface CortexGraphProps {
    renderedNodes: (TCortexNode & { x: number; y: number })[];
    renderedLinks: (TCortexLink & { sourceNode: TCortexNode & { x: number; y: number }; targetNode: TCortexNode & { x: number; y: number } })[];
    loading: boolean;
    error: string | null;
    t: (key: string) => string;
}

export const CortexGraph: React.FC<CortexGraphProps> = ({ renderedNodes, renderedLinks, loading, error, t }) => {
    return (
        <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-accent-teal/20 blur-2xl rounded-full animate-pulse" />
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-teal"></div>
                    </div>
                    <p className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest animate-pulse">{t('cortex.analyzing')}</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center max-w-md">
                    <div className="bg-accent-red/10 p-6 rounded-3xl mb-6">
                      <span className="text-accent-red text-4xl">⚠️</span>
                    </div>
                    <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-3 tracking-tight">{t('cortex.analysisFailed')}</h3>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-8 leading-relaxed">{error}</p>
                </div>
            ) : (
                <svg className="w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 600">
                    <defs>
                        <filter height="200%" id="glow-indigo" width="200%" x="-50%" y="-50%">
                            <feGaussianBlur result="coloredBlur" stdDeviation="3"></feGaussianBlur>
                            <feMerge>
                                <feMergeNode in="coloredBlur"></feMergeNode>
                                <feMergeNode in="SourceGraphic"></feMergeNode>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    <g className="opacity-40 stroke-border-light dark:stroke-border-dark" strokeWidth="1">
                        <line strokeDasharray="4" x1="400" x2="250" y1="300" y2="150"></line>
                        <line x1="400" x2="550" y1="300" y2="150"></line>
                        <line x1="400" x2="600" y1="300" y2="350"></line>
                        <line x1="400" x2="200" y1="300" y2="400"></line>
                        <line x1="400" x2="400" y1="300" y2="500"></line>
                        <line className="stroke-accent-red" strokeDasharray="2" strokeWidth="2" x1="250" x2="200" y1="150" y2="400"></line>
                        <line x1="550" x2="600" y1="150" y2="350"></line>
                        <line x1="250" x2="150" y1="150" y2="150"></line>
                    </g>
                    <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(400, 300)">
                        <circle className="glow-node" fill="#0F172A" r="40" stroke="#00d4ff" strokeWidth="2"></circle>
                        <circle fill="#00d4ff" opacity="0.1" r="30"></circle>
                        <text fill="#E2E8F0" fontFamily="Inter" fontSize="10" fontWeight="bold" textAnchor="middle" x="0" y="5">AI Transformation</text>
                        <text fill="#94A3B8" fontFamily="Inter" fontSize="8" textAnchor="middle" x="0" y="18">Core Program</text>
                    </g>
                    <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(250, 150)">
                        <circle fill="#0F172A" r="25" stroke="#00d4ff" strokeWidth="2"></circle>
                        <text fill="#E2E8F0" fontFamily="Inter" fontSize="9" textAnchor="middle" x="0" y="4">Agritech</text>
                    </g>
                    <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(150, 150)">
                        <circle fill="#1E293B" r="15" stroke="#00D4AA" strokeWidth="2"></circle>
                        <image clipPath="circle(15px at 15px 15px)" height="30" href="https://randomuser.me/api/portraits/women/44.jpg" width="30" x="-15" y="-15"/>
                    </g>
                    <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(550, 150)">
                        <circle fill="#0F172A" r="25" stroke="#00d4ff" strokeWidth="2"></circle>
                        <text fill="#E2E8F0" fontFamily="Inter" fontSize="9" textAnchor="middle" x="0" y="4">Logistics</text>
                    </g>
                    <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(200, 400)">
                        <polygon fill="#1E293B" points="0,-25 22,12 -22,12" stroke="#EF4444" strokeWidth="2"></polygon>
                        <text fill="#EF4444" fontFamily="Inter" fontSize="8" fontWeight="bold" textAnchor="middle" x="0" y="4">Compliance</text>
                    </g>
                    <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(400, 500)">
                        <rect fill="#1E293B" height="30" rx="4" stroke="#F59E0B" strokeWidth="2" width="40" x="-20" y="-15"></rect>
                        <text fill="#E2E8F0" fontFamily="Inter" fontSize="8" textAnchor="middle" x="0" y="4">Cloud Infra</text>
                    </g>
                    <g className="cursor-pointer hover:scale-110 transition-transform duration-300" transform="translate(600, 350)">
                        <circle fill="#1E293B" r="18" stroke="#00D4AA" strokeWidth="2"></circle>
                        <image clipPath="circle(18px at 18px 18px)" height="36" href="https://randomuser.me/api/portraits/men/32.jpg" width="36" x="-18" y="-18"/>
                    </g>
                    <g transform="translate(225, 275)">
                        <rect fill="#1E293B" height="16" rx="8" stroke="#334155" width="60" x="-30" y="-8"></rect>
                        <text fill="#EF4444" fontSize="8" textAnchor="middle" x="0" y="3">High Risk</text>
                    </g>
                </svg>
            )}
        </div>
    );
};
