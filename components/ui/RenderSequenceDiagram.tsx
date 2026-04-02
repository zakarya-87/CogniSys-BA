
import React from 'react';
import { TSequenceDiagram } from '../../types';

export const RenderSequenceDiagram: React.FC<{ diagram: TSequenceDiagram }> = ({ diagram }) => {
    // Defensive checks
    const participants = Array.isArray(diagram?.participants) ? diagram.participants : [];
    const messages = Array.isArray(diagram?.messages) ? diagram.messages : [];
    
    const participantWidth = 150;
    const padding = 50;
    const messageHeight = 50;
    const headerHeight = 60;
    
    const width = Math.max(800, participants.length * participantWidth + padding * 2);
    const height = headerHeight + messages.length * messageHeight + 50;

    const getParticipantX = (index: number) => padding + index * participantWidth + participantWidth / 2;

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <defs>
                <marker id="arrow-solid" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" className="fill-gray-800 dark:fill-gray-200" />
                </marker>
                <marker id="arrow-open" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L9,3 L0,6" className="stroke-gray-800 dark:stroke-gray-200 fill-none" />
                </marker>
            </defs>

            {/* Participants */}
            {participants.map((p, i) => {
                const x = getParticipantX(i);
                return (
                    <g key={p.id}>
                        {/* Lifeline */}
                        <line x1={x} y1={headerHeight} x2={x} y2={height - 20} className="stroke-gray-400 dark:stroke-gray-600 stroke-1" strokeDasharray="4" />
                        
                        {/* Header Box */}
                        <rect x={x - 60} y={10} width={120} height={40} rx="4" className="fill-gray-100 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" />
                        <text x={x} y={35} textAnchor="middle" className="text-xs font-bold fill-gray-800 dark:fill-gray-200" style={{fontSize: '12px'}}>
                            {p.name}
                        </text>
                        <text x={x} y={15} textAnchor="middle" className="text-[8px] fill-gray-500 uppercase tracking-widest bg-white dark:bg-gray-900">
                            {p.type}
                        </text>
                    </g>
                );
            })}

            {/* Messages */}
            {messages.map((msg, i) => {
                const fromIdx = participants.findIndex(p => p.id === msg.from);
                const toIdx = participants.findIndex(p => p.id === msg.to);
                
                if (fromIdx === -1 || toIdx === -1) return null;

                const x1 = getParticipantX(fromIdx);
                const x2 = getParticipantX(toIdx);
                const y = headerHeight + (i + 1) * messageHeight;
                const isSelf = fromIdx === toIdx;

                if (isSelf) {
                    return (
                        <g key={i}>
                            <polyline 
                                points={`${x1},${y-10} ${x1+30},${y-10} ${x1+30},${y+10} ${x1},${y+10}`}
                                fill="none"
                                className="stroke-gray-800 dark:stroke-gray-200"
                                strokeWidth="1.5"
                                markerEnd="url(#arrow-solid)"
                            />
                            <text x={x1 + 35} y={y} className="text-xs fill-gray-600 dark:fill-gray-400" style={{fontSize: '10px'}}>
                                {msg.label}
                            </text>
                        </g>
                    );
                }

                return (
                    <g key={i}>
                        <line 
                            x1={x1} y1={y} x2={x2} y2={y} 
                            className="stroke-gray-800 dark:stroke-gray-200" 
                            strokeWidth="1.5"
                            strokeDasharray={msg.type === 'Response' ? "4" : ""}
                            markerEnd={msg.type === 'Response' ? "url(#arrow-open)" : "url(#arrow-solid)"}
                        />
                        <text 
                            x={(x1 + x2) / 2} 
                            y={y - 5} 
                            textAnchor="middle" 
                            className="text-xs fill-gray-600 dark:fill-gray-400 bg-white dark:bg-gray-900 px-1"
                            style={{fontSize: '11px'}}
                        >
                            {msg.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};
