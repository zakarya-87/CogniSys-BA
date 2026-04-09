import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TOrganization, TProject } from '../types';
import { useAuth } from './AuthContext';
import { firestoreWatchOrganization, firestoreWatchProjects } from '../services/firestoreService';
import { OrganizationAPI, ProjectAPI } from '../src/services/api';
import { logger } from '../src/utils/logger';

export interface OrgContextType {
  organizations: TOrganization[];
  projects: TProject[];
  loading: boolean;
  apiError: string | null;
  addOrganization: (org: Partial<TOrganization>) => Promise<TOrganization>;
  addProject: (orgId: string, project: Partial<TProject>) => Promise<void>;
}

export const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, refreshToken } = useAuth();
  
  const [organizations, setOrganizations] = useState<TOrganization[]>([]);
  const [projects, setProjects] = useState<TProject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // If no user or the user doesn't have an orgId claim, clear out.
    if (!user || !user.orgId) {
      setOrganizations([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(null);

    const unsubOrg = firestoreWatchOrganization(user.orgId, (org) => {
      setOrganizations(org ? [org] : []);
      setLoading(false);
    });

    const unsubProjects = firestoreWatchProjects(user.orgId, (projs) => {
      setProjects(projs);
    });

    return () => {
      unsubOrg();
      unsubProjects();
    };
  }, [user]);

  const addOrganization = useCallback(async (org: Partial<TOrganization>) => {
    try {
      const payload = { ...org, id: org.id || `org-${Date.now()}` } as TOrganization;
      await OrganizationAPI.create(payload);
      
      // Wait for backend to propagate claims (1s) and refresh local token
      await new Promise(resolve => setTimeout(resolve, 1500));
      await refreshToken();
      
      return payload;
    } catch (e: any) {
      logger.error('Failed to create organization', e);
      setApiError('Failed to create organization');
      throw e;
    }
  }, [refreshToken]);

  const addProject = useCallback(async (orgId: string, project: Partial<TProject>) => {
    try {
      const payload = { ...project, id: project.id || `proj-${Date.now()}` };
      await ProjectAPI.create(orgId, payload);
    } catch (e: any) {
      logger.error('Failed to create project', e);
      setApiError('Failed to create project');
      throw e;
    }
  }, []);

  return (
    <OrgContext.Provider 
      value={{ 
        organizations, 
        projects, 
        loading, 
        apiError, 
        addOrganization, 
        addProject 
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = (): OrgContextType => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within an OrgProvider');
  return ctx;
};
