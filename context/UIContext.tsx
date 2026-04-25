import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Theme } from '../types';
import { setAiModelId } from '../services/geminiService';

export interface UIContextType {
  currentView: string;
  theme: Theme;
  toastMessage: string;
  aiModel: string;
  hiveCommand: string | null;
  isFocusModeActive: boolean;
  setCurrentView: (view: any) => void;
  setTheme: (theme: Theme) => void;
  setToastMessage: (msg: string) => void;
  setAiModel: (model: string) => void;
  setHiveCommand: (command: string | null) => void;
  toggleFocusMode: () => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [toastMessageState, setToastMessageState] = useState('');
  const [hiveCommand, setHiveCommand] = useState<string | null>(null);

  const [isFocusModeActive, setFocusModeActive] = useState<boolean>(() => {
    try { return localStorage.getItem('cognisys-focus-mode') === 'true'; }
    catch { return false; }
  });
  
  const [aiModel, setAiModelState] = useState<string>(() => {
    try {
      return localStorage.getItem('cognisys-ai-model') || 'gemini-2.5-flash';
    } catch {
      return 'gemini-2.5-flash';
    }
  });

  // Theme synchronization
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Focus Mode — sync html class + persist
  useEffect(() => {
    if (isFocusModeActive) {
      document.documentElement.classList.add('focus-mode');
    } else {
      document.documentElement.classList.remove('focus-mode');
    }
  }, [isFocusModeActive]);

  const toggleFocusMode = useCallback(() => {
    setFocusModeActive(prev => {
      const next = !prev;
      try { localStorage.setItem('cognisys-focus-mode', String(next)); } catch {}
      return next;
    });
  }, []);

  // AI model persistence and sync
  useEffect(() => {
    localStorage.setItem('cognisys-ai-model', aiModel);
    setAiModelId(aiModel);
  }, [aiModel]);

  const setToastMessage = useCallback((msg: string) => {
    setToastMessageState(msg);
    setTimeout(() => setToastMessageState(''), 3000);
  }, []);

  const value = useMemo(() => ({
    currentView,
    theme,
    toastMessage: toastMessageState,
    aiModel,
    hiveCommand,
    isFocusModeActive,
    setCurrentView,
    setTheme: setThemeState,
    setToastMessage,
    setAiModel: setAiModelState,
    setHiveCommand,
    toggleFocusMode,
  }), [currentView, theme, toastMessageState, aiModel, hiveCommand, isFocusModeActive, toggleFocusMode, setToastMessage]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within a UIProvider');
  return ctx;
};

/** Shortcut hook for theme management - maintains compatibility with legacy components */
export const useTheme = () => {
    const { theme, setTheme } = useUI();
    return { theme, setTheme };
};
