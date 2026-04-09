
import { useState, useEffect, useCallback } from 'react';
import { THiveState, THiveMessage, THiveStep } from '../types';

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
    const [state, setState] = useState<THiveState>(INITIAL_STATE);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount or initiative change
    useEffect(() => {
        if (!initiativeId) {
            setState(INITIAL_STATE);
            setIsLoaded(true);
            return;
        }

        try {
            const saved = localStorage.getItem(`hive_state_${initiativeId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Hydrate logic to ensure types match (optional migrations could go here)
                setState(parsed);
            } else {
                setState(INITIAL_STATE);
            }
        } catch (e) {
            console.error("Failed to load Hive state:", e);
            setState(INITIAL_STATE);
        } finally {
            setIsLoaded(true);
        }
    }, [initiativeId]);

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        if (!isLoaded || !initiativeId) return;
        
        try {
            localStorage.setItem(`hive_state_${initiativeId}`, JSON.stringify(state));
        } catch (e) {
            console.error("Failed to save Hive state:", e);
        }
    }, [state, initiativeId, isLoaded]);

    const resetState = useCallback(() => {
        setState(INITIAL_STATE);
        if (initiativeId) {
            localStorage.removeItem(`hive_state_${initiativeId}`);
        }
    }, [initiativeId]);

    return {
        state,
        setState,
        resetState,
        isLoaded
    };
};
