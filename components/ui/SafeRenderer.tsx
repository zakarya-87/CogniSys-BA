import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface SafeRendererProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName: string;
}

export const SafeRenderer: React.FC<SafeRendererProps> = ({ children, fallback, componentName }) => {
  const defaultFallback = (
    <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-md text-center text-sm text-gray-500">
      <p>Unable to render {componentName}.</p>
      <p className="text-xs mt-1">The AI generated an invalid structure.</p>
    </div>
  );

  return (
    <ErrorBoundary componentName={componentName} fallback={fallback || defaultFallback}>
      {children}
    </ErrorBoundary>
  );
};
