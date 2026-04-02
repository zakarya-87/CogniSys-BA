import React from 'react';
import { TBpmnFlow } from '../../types';
import { Mermaid } from '../Mermaid';

const sanitizeId = (id?: string) => (id || '').replace(/[^a-zA-Z0-9_]/g, '_');

const generateMermaidBpmn = (flow: TBpmnFlow) => {
    let mermaid = 'graph TD\n';
    
    // Map nodes
    (flow.nodes || []).forEach(node => {
        const safeLabel = (node.label || 'Unnamed Node').replace(/"/g, '&quot;');
        let shape = '["' + safeLabel + '"]';
        if (node.type === 'start' || node.type === 'end') shape = '(("' + safeLabel + '"))';
        else if (node.type === 'gateway') shape = '{"' + safeLabel + '"}';
        
        mermaid += `    ${sanitizeId(node.id || 'node')}${shape}\n`;
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
