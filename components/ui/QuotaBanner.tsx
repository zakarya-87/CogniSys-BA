import React from 'react';
import { useApiStatus } from '../../context/ApiStatusContext';
import { useUI } from '../../context/UIContext';
import { AlertTriangle } from 'lucide-react';

export const QuotaBanner: React.FC = () => {
  const { quotaExceeded } = useApiStatus();
  const { isFocusModeActive } = useUI();

  if (!quotaExceeded || isFocusModeActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 flex items-center justify-center shadow-lg">
      <AlertTriangle className="mr-2" />
      <span>
        Gemini API quota exceeded. Please check your plan and billing details.
      </span>
    </div>
  );
};
