import React from 'react';
import { TBpmnFlow } from '../../types';
import { Mermaid } from '../Mermaid';

const sanitizeId = (id?: string) => (id || '').replace(/[^a-zA-Z0-9_]/g, '_');

const generateMermaidBpmn = (flow: TBpmnFlow) => {
    let mermaid = 'graph LR\n'; // Left to right works better for BPMN
    
    // Theme application inside the chart
    mermaid += '    classDef task fill:rgba(0,0,0,0.6),stroke:#22d3ee,stroke-width:1px,color:#fff,rx:10,ry:10;\n';
    mermaid += '    classDef start_end fill:rgba(34,211,238,0.1),stroke:#22d3ee,stroke-width:2px,color:#fff;\n';
    mermaid += '    classDef gateway fill:rgba(168,85,247,0.1),stroke:#a855f7,stroke-width:2px,color:#fff;\n';

    // Map nodes
    (flow.nodes || []).forEach(node => {
        const safeLabel = (node.label || 'Unnamed Node').replace(/"/g, '&quot;');
        const safeId = sanitizeId(node.id || 'node');
        let shape = `["<div style='padding:10px'>${safeLabel}</div>"]`;
        let className = 'task';

        if (node.type === 'start' || node.type === 'end') {
            shape = `(("${safeLabel}"))`;
            className = 'start_end';
        } else if (node.type === 'gateway') {
            shape = `{"${safeLabel}"}`;
            className = 'gateway';
        }
        
        mermaid += `    ${safeId}${shape}\n`;
        mermaid += `    class ${safeId} ${className}\n`;
    });

    // Map edges
    (flow.edges || []).forEach(edge => {
        if (edge.source && edge.target) {
            mermaid += `    ${sanitizeId(edge.source)} --> ${sanitizeId(edge.target)}\n`;
        }
    });
    
    return mermaid;
};

export const RenderBpmnFlow: React.FC<{ flow: TBpmnFlow }> = ({ flow }) => {
    if (!flow || !flow.nodes || !flow.edges) return null;

    return <Mermaid chart={generateMermaidBpmn(flow)} />;
};
