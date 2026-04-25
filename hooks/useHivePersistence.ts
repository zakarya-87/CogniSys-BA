
import { useState, useEffect, useCallback } from 'react';
import { THiveState, THiveMessage, THiveStep } from '../types';
import { cacheHiveState, getCachedHiveState } from '../services/offlineCache';
import { MissionAPI } from '../src/services/api';
import { useCatalyst } from '../context/CatalystContext';

const INITIAL_STATE: THiveState = {
    goal: '',
    status: 'idle',
    activeAgent: 'Orchestrator',
    messages: [],
    artifacts: {},
    history: [],
    stepQueue: []
};

export const useHivePersistence = (initiativeId: string) => {
    const { user } = useCatalyst();
    const orgId = user?.orgId || '';
    const [state, setState] = useState<THiveState>(INITIAL_STATE);
    const [missionId, setMissionId] = useState<string>('');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage first, then fall back to IndexedDB
    useEffect(() => {
        if (!initiativeId) {
            setState(INITIAL_STATE);
            setIsLoaded(true);
            return;
        }

        let loaded = false;
        try {
            const saved = localStorage.getItem(`hive_state_${initiativeId}`);
            if (saved) {
                setState(JSON.parse(saved));
                loaded = true;
            }
        } catch (e) {
            console.error("Failed to load Hive state from localStorage:", e);
        }

        if (loaded) {
            setIsLoaded(true);
            return;
        }

        // Fall back to Remote Firestore if available
        const loadFromRemote = async () => {
            if (!orgId || !initiativeId) return;
            try {
                const response = await MissionAPI.listByInitiative(orgId, initiativeId);
                const missions = response.data;
                if (missions && missions.length > 0) {
                    const latest = missions[0];
                    setState(latest.state);
                    setMissionId(latest.id);
                    loaded = true;
                }
            } catch (e) {
                console.warn("Failed to fetch remote missions:", e);
            }
        };

        const loadSequence = async () => {
            await loadFromRemote();
            if (loaded) {
                setIsLoaded(true);
                return;
            }

            // Fall back to IndexedDB if localStorage and Remote had nothing
            try {
                const cached = await getCachedHiveState(initiativeId);
                if (cached) {
                    setState(cached);
                } else {
                    setState(INITIAL_STATE);
                }
            } catch (e) {
                console.error("Failed to load Hive state from IndexedDB:", e);
                setState(INITIAL_STATE);
            } finally {
                setIsLoaded(true);
            }
        };
        
        loadSequence();
    }, [initiativeId, orgId]);

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        if (!isLoaded || !initiativeId) return;
        
        try {
            localStorage.setItem(`hive_state_${initiativeId}`, JSON.stringify(state));
        } catch (e) {
            console.error("Failed to save Hive state:", e);
        }
        cacheHiveState(initiativeId, state).catch(() => {});
    }, [state, initiativeId, isLoaded]);

    const resetState = useCallback(() => {
        setState(INITIAL_STATE);
        if (initiativeId) {
            localStorage.removeItem(`hive_state_${initiativeId}`);
            cacheHiveState(initiativeId, INITIAL_STATE).catch(() => {});
        }
    }, [initiativeId]);

    return {
        state,
        setState,
        resetState,
        isLoaded,
        missionId,
        setMissionId
    };
};
