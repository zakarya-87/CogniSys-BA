
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { AIAPI, InitiativeAPI } from '../src/services/api';
import { cacheArtifact } from '../services/offlineCache';

interface ArtifactContextType {
  isAILoading: boolean;
  triggerWBS: (initiativeId: string, projectId: string) => Promise<void>;
  triggerRisks: (initiativeId: string, projectId: string) => Promise<void>;
  saveArtifact: (initiativeId: string, projectId: string, type: string, content: any) => Promise<void>;
}

const ArtifactContext = createContext<ArtifactContextType | undefined>(undefined);

export const ArtifactProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isAILoading, setIsAILoading] = useState(false);

  const triggerWBS = useCallback(async (initiativeId: string, projectId: string) => {
    if (!user?.orgId) return;
    setIsAILoading(true);
    try {
      await AIAPI.triggerWBS(user.orgId, initiativeId);
    } catch (err) {
      console.error('Failed to trigger WBS:', err);
      throw err;
    } finally {
      setIsAILoading(false);
    }
  }, [user]);

  const triggerRisks = useCallback(async (initiativeId: string, projectId: string) => {
    if (!user?.orgId) return;
    setIsAILoading(true);
    try {
      await AIAPI.triggerRisks(user.orgId, initiativeId);
    } catch (err) {
      console.error('Failed to trigger Risk Assessment:', err);
      throw err;
    } finally {
      setIsAILoading(false);
    }
  }, [user]);

  const saveArtifact = useCallback(async (initiativeId: string, projectId: string, type: string, content: any) => {
    if (!user?.orgId) return;
    try {
      // Note: This logic previously existed in InitiativeContext. 
      // It handles updating the initiative with the new artifact.
      const updateData: any = {};
      updateData[type] = content;
      await InitiativeAPI.update(user.orgId, projectId, initiativeId, updateData);
      cacheArtifact(`${initiativeId}-${type}`, content, type).catch(() => {});
    } catch (err) {
      console.error('Failed to save artifact:', err);
      throw err;
    }
  }, [user]);

  return (
    <ArtifactContext.Provider value={{
      isAILoading,
      triggerWBS,
      triggerRisks,
      saveArtifact
    }}>
      {children}
    </ArtifactContext.Provider>
  );
};

export const useArtifacts = () => {
  const context = useContext(ArtifactContext);
  if (!context) throw new Error('useArtifacts must be used within an ArtifactProvider');
  return context;
};
