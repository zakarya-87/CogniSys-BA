
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { firestoreWatchActivities, firestoreSetUserPrefs, firestoreGetUserPrefs } from '../services/firestoreService';
import { ActivityAPI } from '../src/services/api';

interface PulseContextType {
  activities: any[];
  unreadCount: number;
  lastReadTimestamp: number;
  markPulseAsRead: () => void;
  fetchMoreActivities: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}

const PulseContext = createContext<PulseContextType | undefined>(undefined);

export const PulseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Sync lastRead from Firestore
  useEffect(() => {
    if (!user) return;
    firestoreGetUserPrefs(user.id).then((prefs: any) => {
      if (prefs?.lastReadPulse) setLastReadTimestamp(prefs.lastReadPulse);
    });
  }, [user]);

  // Real-time listener for Pulse activities
  useEffect(() => {
    if (!user?.orgId) {
      setActivities([]);
      return;
    }

    const unsub = firestoreWatchActivities(user.orgId, (acts) => {
      setActivities(prev => {
        // Merge strategy: Update existing or add new ones at the top
        const historical = prev.filter(p => !acts.find(a => a.id === p.id));
        return [...acts, ...historical].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
    }, 20);

    return () => unsub();
  }, [user]);

  const fetchMoreActivities = useCallback(async () => {
    if (!user?.orgId || !hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const response = await ActivityAPI.list(user.orgId, { limit: 20, cursor: nextCursor || undefined });
      const { data, nextCursor: next } = response.data;
      
      setActivities(prev => {
          const combined = [...prev, ...data];
          // Unique by ID
          return Array.from(new Map(combined.map(item => [item.id, item])).values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
      
      setNextCursor(next);
      setHasMore(!!next);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, hasMore, isLoading, nextCursor]);

  const markPulseAsRead = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    setLastReadTimestamp(now);
    firestoreSetUserPrefs(user.id, { lastReadPulse: now }).catch(console.error);
  }, [user]);

  const unreadCount = activities.filter(a => 
    new Date(a.timestamp).getTime() > lastReadTimestamp
  ).length;

  return (
    <PulseContext.Provider value={{
      activities,
      unreadCount,
      lastReadTimestamp,
      markPulseAsRead,
      fetchMoreActivities,
      hasMore,
      isLoading
    }}>
      {children}
    </PulseContext.Provider>
  );
};

export const usePulse = () => {
  const context = useContext(PulseContext);
  if (!context) throw new Error('usePulse must be used within a PulseProvider');
  return context;
};
