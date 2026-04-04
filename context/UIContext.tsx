import { createContext, useContext } from 'react';
import { Theme } from '../types';

export interface UIContextType {
  currentView: string;
  theme: Theme;
  toastMessage: string;
  aiModel: string;
  hiveCommand: string | null;
  setCurrentView: (view: any) => void;
  setTheme: (theme: Theme) => void;
  setToastMessage: (msg: string) => void;
  setAiModel: (model: string) => void;
  setHiveCommand: (command: string | null) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

/** Thin provider alias — CatalystProvider supplies the value. */
export const UIProvider = UIContext.Provider;

export const useUI = (): UIContextType => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within a UIContext.Provider');
  return ctx;
};
