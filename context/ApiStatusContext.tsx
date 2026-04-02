import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiStatusContextType {
  quotaExceeded: boolean;
  setQuotaExceeded: (value: boolean) => void;
}

const ApiStatusContext = createContext<ApiStatusContextType>({
  quotaExceeded: false,
  setQuotaExceeded: () => {},
});

export const ApiStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <ApiStatusContext.Provider value={{ quotaExceeded, setQuotaExceeded }}>
      {children}
    </ApiStatusContext.Provider>
  );
};

export const useApiStatus = () => useContext(ApiStatusContext);
