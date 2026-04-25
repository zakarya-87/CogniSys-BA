import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#22d3ee',
    primaryTextColor: '#fff',
    primaryBorderColor: '#22d3ee',
    lineColor: '#52525b',
    secondaryColor: '#a855f7',
    tertiaryColor: '#10b981',
    mainBkg: 'rgba(0,0,0,0.4)',
    nodeBorder: 'rgba(34,211,238,0.2)',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  securityLevel: 'loose',
});

interface MermaidProps {
  chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Generate a unique ID for the diagram
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      // Render the diagram
      mermaid.render(id, chart).then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      }).catch(err => {
        console.error('Mermaid rendering error:', err);
      });
    }
  }, [chart]);

  return <div ref={containerRef} className="mermaid-container" />;
};
