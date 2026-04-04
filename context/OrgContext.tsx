import { createContext, useContext } from 'react';
import { TOrganization, TProject } from '../types';

export interface OrgContextType {
  organizations: TOrganization[];
  projects: TProject[];
  loading: boolean;
  apiError: string | null;
  setOrganizations: (organizations: TOrganization[]) => void;
  setProjects: (projects: TProject[]) => void;
  addOrganization: (org: Partial<TOrganization>) => Promise<void>;
  addProject: (orgId: string, project: Partial<TProject>) => Promise<void>;
  fetchInitialData: () => Promise<void>;
}

export const OrgContext = createContext<OrgContextType | undefined>(undefined);

/** Thin provider alias — CatalystProvider supplies the value. */
export const OrgProvider = OrgContext.Provider;

export const useOrg = (): OrgContextType => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within an OrgContext.Provider');
  return ctx;
};
