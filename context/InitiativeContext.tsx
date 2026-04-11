import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { TInitiative, InitiativeStatus, TWorkBreakdown, TActivity } from '../types';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { useOrg } from './OrgContext';
import { 
  firestoreWatchActivities,
  firestoreGetUserPrefs,
  firestoreSetUserPrefs
} from '../services/firestoreService';
import { InitiativeAPI, AIAPI, ActivityAPI } from '../src/services/api';
import { DomainRules } from '../utils/domainRules';
import { AI_TEAM_MEMBERS } from '../constants';
import { generateAgentComment } from '../services/geminiService';
import { MemoryService } from '../services/memoryService';
import { logger } from '../src/utils/logger';
import { cacheInitiatives, getCachedInitiatives, cacheInitiative } from '../services/offlineCache';

export interface InitiativeContextType {
  initiatives: TInitiative[];
  selectedInitiative: TInitiative | null;
  initiativesNextCursor: string | null;
  activities: TActivity[];
  unreadActivities: number;
  setInitiatives: (initiatives: TInitiative[]) => void;
  selectInitiative: (initiative: TInitiative | null) => void;
  markActivitiesRead: () => void;
  addInitiative: (initiative: TInitiative) => void;
  updateInitiative: (initiative: TInitiative) => void;
  updateInitiativeStatus: (id: string, status: InitiativeStatus) => void;
  saveArtifact: (initiativeId: string, key: string, data: any) => void;
  loading: boolean;
  loadingMore: boolean;
  resetData: () => void;
  saveWbs: (initiativeId: string, wbs: TWorkBreakdown) => void;
  triggerWBS: (orgId: string, initiativeId: string) => Promise<void>;
  triggerRisks: (orgId: string, initiativeId: string) => Promise<void>;
  loadMoreInitiatives: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (json: string) => void;
}

export const InitiativeContext = createContext<InitiativeContextType | undefined>(undefined);

export const InitiativeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { setToastMessage, setCurrentView, theme, aiModel } = useUI();
  const { organizations } = useOrg();

  const [initiatives, setInitiativesState] = useState<TInitiative[]>([]);
  const [selectedInitiative, setSelectedInitiative] = useState<TInitiative | null>(null);
  const [initiativesNextCursor, setInitiativesNextCursor] = useState<string | null>(null);
  const [activities, setActivities] = useState<TActivity[]>([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Real-time Firestore sync 
  useEffect(() => {
    if (!user || !user.orgId) {
      setInitiativesState([]);
      setActivities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    
    // Initial fetch with stale-while-revalidate
    const fetchInitialInitiatives = async () => {
        let hasCachedData = false;

        // Serve stale data from IndexedDB cache immediately
        try {
            const cached = await getCachedInitiatives();
            if (cached && cached.length > 0) {
                setInitiativesState(cached);
                setLoading(false);
                hasCachedData = true;
            }
        } catch (_) { /* cache miss is fine */ }

        // Revalidate from server
        try {
            const { data } = await InitiativeAPI.listByOrg(user.orgId!, { limit: 20 });
            setInitiativesState(data.data);
            setInitiativesNextCursor(data.nextCursor);
            cacheInitiatives(data.data).catch(() => {});
        } catch (e) {
            logger.error('Failed to fetch initiatives', e);
        } finally {
            if (!hasCachedData) setLoading(false);
        }
    };

    fetchInitialInitiatives();
    
    const unsubActivities = firestoreWatchActivities(user.orgId, (acts) => {
        setActivities(acts);
    });

    firestoreGetUserPrefs(user.id).then((prefs: any) => {
        if (prefs?.lastReadPulse) setLastReadTimestamp(prefs.lastReadPulse);
    });
    
    return () => {
        unsubActivities();
    };
  }, [user]);

  const loadMoreInitiatives = useCallback(async () => {
    if (!user?.orgId || !initiativesNextCursor || loadingMore) return;
    
    setLoadingMore(true);
    try {
        const { data } = await InitiativeAPI.listByOrg(user.orgId, { 
            limit: 20, 
            cursor: initiativesNextCursor 
        });
        setInitiativesState(prev => [...prev, ...data.data]);
        setInitiativesNextCursor(data.nextCursor);
    } catch (e: any) {
        logger.error('Failed to load more initiatives', e);
        setToastMessage('Failed to load more initiatives');
    } finally {
        setLoadingMore(false);
    }
  }, [user?.orgId, initiativesNextCursor, loadingMore, setToastMessage]);

  // Sync selectedInitiative with updated data from the initiatives list
  useEffect(() => {
    if (selectedInitiative) {
        const latestVersion = initiatives.find(i => i.id === selectedInitiative.id);
        if (latestVersion && JSON.stringify(latestVersion) !== JSON.stringify(selectedInitiative)) {
            setSelectedInitiative(latestVersion);
        }
    }
  }, [initiatives, selectedInitiative]);

  const unreadActivities = useMemo(() => {
    if (!lastReadTimestamp) return activities.length;
    return activities.filter(a => new Date(a.timestamp) > new Date(lastReadTimestamp)).length;
  }, [activities, lastReadTimestamp]);

  const markActivitiesRead = useCallback(() => {
    const now = new Date().toISOString();
    setLastReadTimestamp(now);
    if (user?.id) {
        firestoreSetUserPrefs(user.id, { lastReadPulse: now }).catch(() => {});
    }
  }, [user]);

  const addInitiative = useCallback((initiative: TInitiative) => {
    // State updates immediately via local state for UI feedback.
    // It'll be silently reconciled by Firestore when the write goes through.
    setInitiativesState(prev => [initiative, ...prev]);
    cacheInitiative(initiative.id, initiative).catch(() => {});
    setToastMessage(`Initiative "${initiative.title}" created.`);
    
    const activity: TActivity = {
      id: `act-${Date.now()}`,
      initiativeId: initiative.id,
      initiativeTitle: initiative.title,
      type: 'Status Change',
      description: `Initiative created in ${initiative.sector} sector.`,
      timestamp: new Date().toISOString(),
      authorId: 'user',
      read: false,
      comments: []
    };
    if (initiative.orgId && initiative.projectId) {
      const orgId = initiative.orgId;
      void ActivityAPI.create(orgId, activity).catch(() => {});
      void InitiativeAPI.create(orgId, initiative.projectId, initiative).catch(() => {});
    }
  }, [setToastMessage]);

  const updateInitiative = useCallback((initiative: TInitiative) => {
    setInitiativesState(prev => prev.map(i => i.id === initiative.id ? initiative : i));
    cacheInitiative(initiative.id, initiative).catch(() => {});
    if (selectedInitiative?.id === initiative.id) {
        setSelectedInitiative(initiative);
    }
    setToastMessage(`Initiative "${initiative.title}" updated.`);
    if (initiative.orgId && initiative.projectId) {
        void InitiativeAPI.update(
            initiative.orgId,
            initiative.projectId,
            initiative.id,
            initiative
        ).catch(() => {});
    }
  }, [selectedInitiative, setToastMessage]);

  const updateInitiativeStatus = useCallback((id: string, newStatus: InitiativeStatus) => {
    let initiativeTitle = '';
    
    setInitiativesState(prev => {
        const init = prev.find(i => i.id === id);
        if (!init) return prev;

        initiativeTitle = init.title;
        const ruleCheck = DomainRules.canAdvanceStatus(init, newStatus);
        if (!ruleCheck.allowed) {
            setToastMessage(`Error: ${ruleCheck.reason}`);
            return prev;
        }

        return prev.map(i => 
            i.id === id ? { ...i, status: newStatus, lastUpdated: new Date().toISOString() } : i
        );
    });
    
    if (selectedInitiative?.id === id) {
         setSelectedInitiative(prev => prev ? { ...prev, status: newStatus } : null);
    }

    if (initiativeTitle && user?.orgId) {
         const activity: TActivity = {
            id: `act-${Date.now()}`,
            initiativeId: id,
            initiativeTitle: initiativeTitle,
            type: 'Status Change',
            description: `Status updated to ${newStatus}`,
            timestamp: new Date().toISOString(),
            authorId: 'user',
            read: false,
            comments: []
        };
        void ActivityAPI.create(user.orgId, activity).catch(() => {});
    }

    setToastMessage(`Status updated to ${newStatus}`);
  }, [selectedInitiative, setToastMessage]);

  const saveArtifact = useCallback((initiativeId: string, key: string, data: any) => {
    let initiativeTitle = '';
    
    setInitiativesState(prev => prev.map(i => {
        if (i.id === initiativeId) {
            initiativeTitle = i.title;
            const newArtifacts = { ...(i.artifacts || {}), [key]: data };
            return { ...i, artifacts: newArtifacts, lastUpdated: new Date().toISOString() };
        }
        return i;
    }));
    
    // Cache the updated initiative after artifact save
    const updated = initiatives.find(i => i.id === initiativeId);
    if (updated) {
        cacheInitiative(updated.id, updated).catch(() => {});
    }

    setToastMessage('Artifact saved.');

    // PULSE SYSTEM
    if (initiativeTitle && user?.orgId) {
        const activityId = `act-${Date.now()}`;
        const newActivity: TActivity = {
            id: activityId,
            initiativeId: initiativeId,
            initiativeTitle: initiativeTitle,
            type: 'Artifact Created',
            description: `Generated ${key} artifact.`,
            timestamp: new Date().toISOString(),
            authorId: 'user',
            read: false,
            metadata: { artifactKey: key },
            comments: []
        };
        
        void ActivityAPI.create(user.orgId, newActivity).catch(() => {});

        const interestedAgent = AI_TEAM_MEMBERS.find(agent => agent.focusAreas.includes(key));
        
        if (interestedAgent) {
            setTimeout(async () => {
                try {
                    const commentText = await generateAgentComment(interestedAgent, key, data);
                    const newComment = {
                        id: `cmt-${Date.now()}`,
                        authorId: interestedAgent.id,
                        text: commentText,
                        timestamp: new Date().toISOString()
                    };

                    void ActivityAPI.addComment(activityId, newComment).catch(() => {});
                    setToastMessage(`${interestedAgent.name} commented on your work.`);
                } catch (e) {
                    logger.error("AI reaction failed", e);
                }
            }, 2000);
        }
    }
  }, [setToastMessage]);

  const saveWbs = useCallback((initiativeId: string, wbs: TWorkBreakdown) => {
    setInitiativesState(prev => prev.map(i => 
        i.id === initiativeId ? { ...i, wbs } : i
    ));
    if (selectedInitiative?.id === initiativeId) {
         setSelectedInitiative(prev => prev ? { ...prev, wbs } : null);
    }
    setToastMessage('Project Plan saved.');
  }, [selectedInitiative, setToastMessage]);

  const triggerWBS = useCallback(async (orgId: string, initiativeId: string) => {
    try {
        await AIAPI.triggerWBS(orgId, initiativeId);
        setToastMessage('WBS generation started in background.');
    } catch (error) {
        setToastMessage('Failed to trigger WBS generation.');
    }
  }, [setToastMessage]);

  const triggerRisks = useCallback(async (orgId: string, initiativeId: string) => {
    try {
        await AIAPI.triggerRisks(orgId, initiativeId);
        setToastMessage('Risk assessment started in background.');
    } catch (error) {
        setToastMessage('Failed to trigger risk assessment.');
    }
  }, [setToastMessage]);

  // Legacy local storage actions - repurposed for real database usage appropriately
  const resetData = useCallback(() => {
    if(confirm("Are you sure? This will not wipe the server but will reload your view.")) {
        setSelectedInitiative(null);
        setCurrentView('dashboard');
        setActivities([]);
        setToastMessage('View reset.');
    }
  }, [setToastMessage, setCurrentView]);

  const exportData = useCallback(async () => {
    const memories = await MemoryService.loadMemories();

    const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        initiatives,
        settings: { theme, aiModel },
        memories
    };
    return JSON.stringify(data, null, 2);
  }, [initiatives, theme, aiModel]);

  const importData = useCallback((json: string) => {
    try {
        const data = JSON.parse(json);
        if (!Array.isArray(data.initiatives)) throw new Error("Invalid data format");
        
        // Push missing initiatives from import file to the DB since we don't save to localStorage anymore
        data.initiatives.forEach((init: TInitiative) => {
            if (!initiatives.find(i => i.id === init.id) && init.orgId && init.projectId) {
                void InitiativeAPI.create(init.orgId, init.projectId, init).catch(() => {});
            }
        });
        
        setToastMessage("Data imported successfully back to the server.");
    } catch (e) {
        logger.error(e);
        setToastMessage("Failed to import data. Invalid file.");
    }
  }, [setToastMessage, initiatives]);

  return (
    <InitiativeContext.Provider
      value={{
        initiatives,
        selectedInitiative,
        initiativesNextCursor,
        activities,
        unreadActivities,
        setInitiatives: setInitiativesState,
        selectInitiative: setSelectedInitiative,
        markActivitiesRead,
        addInitiative,
        updateInitiative,
        updateInitiativeStatus,
        saveArtifact,
        loading,
        loadingMore,
        resetData,
        saveWbs,
        triggerWBS,
        triggerRisks,
        loadMoreInitiatives,
        exportData,
        importData
      }}
    >
      {children}
    </InitiativeContext.Provider>
  );
};

export const useInitiative = (): InitiativeContextType => {
  const ctx = useContext(InitiativeContext);
  if (!ctx) throw new Error('useInitiative must be used within an InitiativeProvider');
  return ctx;
};
