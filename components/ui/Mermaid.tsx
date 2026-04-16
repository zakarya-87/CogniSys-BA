
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default', // You can change this to 'dark', 'forest', etc.
  securityLevel: 'loose', // Allows for more flexibility in diagrams
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
