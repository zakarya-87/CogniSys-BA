import { createContext, useContext } from 'react';
import { TInitiative, InitiativeStatus, TWorkBreakdown, TActivity } from '../types';

export interface InitiativeContextType {
  initiatives: TInitiative[];
  selectedInitiative: TInitiative | null;
  activities: TActivity[];
  unreadActivities: number;
  setInitiatives: (initiatives: TInitiative[]) => void;
  selectInitiative: (initiative: TInitiative | null) => void;
  markActivitiesRead: () => void;
  addInitiative: (initiative: TInitiative) => void;
  updateInitiative: (initiative: TInitiative) => void;
  updateInitiativeStatus: (id: string, status: InitiativeStatus) => void;
  saveArtifact: (initiativeId: string, key: string, data: any) => void;
  resetData: () => void;
  saveWbs: (initiativeId: string, wbs: TWorkBreakdown) => void;
  triggerWBS: (orgId: string, initiativeId: string) => Promise<void>;
  triggerRisks: (orgId: string, initiativeId: string) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (json: string) => void;
}

export const InitiativeContext = createContext<InitiativeContextType | undefined>(undefined);

/** Thin provider alias — CatalystProvider supplies the value. */
export const InitiativeProvider = InitiativeContext.Provider;

export const useInitiative = (): InitiativeContextType => {
  const ctx = useContext(InitiativeContext);
  if (!ctx) throw new Error('useInitiative must be used within an InitiativeContext.Provider');
  return ctx;
};
