
import React from 'react';
import { TMindMapNode } from '../../types';

interface RenderNodeProps {
    node: TMindMapNode;
    angleRange: [number, number];
    depth: number;
    cx: number;
    cy: number;
}

export const RenderMindMapNode: React.FC<RenderNodeProps> = ({ node, angleRange, depth, cx, cy }) => {
    // Layout Logic:
    // Root at (cx, cy)
    // Children distributed radially around parent within angleRange
    
    if (!node) return null;

    const [startAngle, endAngle] = angleRange;
    const totalAngle = endAngle - startAngle;
    
    const children = node.children || [];
    const childCount = children.length;
    
    // Base radius grows slightly with depth to spread out
    const radius = 180; 

    return (
        <g>
            {children.map((child, i) => {
                // Distribute children evenly in the available sector
                const sectorSize = totalAngle / childCount;
                const myAngle = startAngle + i * sectorSize + sectorSize / 2;
                
                const childX = cx + radius * Math.cos(myAngle) / (depth * 0.6); 
                const childY = cy + radius * Math.sin(myAngle) / (depth * 0.6);

                // Bezier connector
                const path = `M${cx},${cy} Q${(cx+childX)/2},${(cy+childY)/2} ${childX},${childY}`;

                return (
                    <g key={child.id}>
                        <path d={path} stroke={child.color || node.color || '#9ca3af'} strokeWidth="2" fill="none" opacity="0.6" />
                        <RenderMindMapNode 
                            node={{...child, color: child.color || node.color}} 
                            angleRange={[startAngle + i * sectorSize, startAngle + (i+1) * sectorSize]} 
                            depth={depth + 1} 
                            cx={childX} 
                            cy={childY} 
                        />
                    </g>
                );
            })}

            {/* Draw Self */}
            <g transform={`translate(${cx}, ${cy})`}>
                <rect 
                    x={-50} y={-15} width={100} height={30} 
                    rx="15" 
                    fill={depth === 1 ? '#1e293b' : 'white'} 
                    stroke={node.color || '#1e293b'} 
                    strokeWidth="2"
                    className="shadow-sm"
                />
                <text 
                    x="0" y="5" 
                    textAnchor="middle" 
                    className={`text-[10px] font-bold pointer-events-none ${depth === 1 ? 'fill-white' : 'fill-gray-900'}`}
                    style={{ fontSize: depth === 1 ? '12px' : '10px' }}
                >
                    {(node.label || '').length > 15 ? (node.label || '').substring(0,14) + '..' : (node.label || '')}
                </text>
            </g>
        </g>
    );
};
