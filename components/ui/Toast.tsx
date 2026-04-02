import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto close after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 bg-accent-emerald text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-down z-50">
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 mr-2" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};