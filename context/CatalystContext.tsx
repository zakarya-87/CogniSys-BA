

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { TInitiative, InitiativeStatus, Theme, TWorkBreakdown, TActivity, TTeamMember, TOrganization, TProject, UserRole } from '../types';
import { MOCK_INITIATIVES, AI_TEAM_MEMBERS } from '../constants';
import { DomainRules } from '../utils/domainRules';
import { generateAgentComment, setAiModelId } from '../services/geminiService';
import { MemoryService } from '../services/memoryService';
import { OrganizationAPI, ProjectAPI, InitiativeAPI, AIAPI } from '../src/services/api';
import {
    auth,
    githubProvider,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    type FirebaseUser,
} from '../firebase';

interface User {
    id: string;
    name: string;
    avatarUrl?: string;
    role?: UserRole; // Added role
}

interface CatalystContextType {
    initiatives: TInitiative[];
    organizations: TOrganization[]; // Added
    projects: TProject[]; // Added
    selectedInitiative: TInitiative | null;
    currentView: string;
    theme: Theme;
    toastMessage: string;
    aiModel: string;
    hiveCommand: string | null;
    activities: TActivity[];
    unreadActivities: number;
    user: User | null;
    
    // Actions
    setInitiatives: (initiatives: TInitiative[]) => void;
    setOrganizations: (organizations: TOrganization[]) => void; // Added
    setProjects: (projects: TProject[]) => void; // Added
    selectInitiative: (initiative: TInitiative | null) => void;
    setCurrentView: (view: any) => void;
    setTheme: (theme: Theme) => void;
    setToastMessage: (msg: string) => void;
    setAiModel: (model: string) => void;
    setHiveCommand: (command: string | null) => void;
    markActivitiesRead: () => void;
    login: () => void;
    loginWithGoogle: () => void;
    logout: () => void;
    
    // Domain Actions
    addInitiative: (initiative: TInitiative) => void;
    updateInitiative: (initiative: TInitiative) => void;
    updateInitiativeStatus: (id: string, status: InitiativeStatus) => void;
    saveArtifact: (initiativeId: string, key: string, data: any) => void;
    resetData: () => void;
    saveWbs: (initiativeId: string, wbs: TWorkBreakdown) => void;
    
    // Organization/Project Actions
    addOrganization: (org: Partial<TOrganization>) => Promise<void>;
    addProject: (orgId: string, project: Partial<TProject>) => Promise<void>;
    
    // AI Actions
    triggerWBS: (orgId: string, initiativeId: string) => Promise<void>;
    triggerRisks: (orgId: string, initiativeId: string) => Promise<void>;

    // Persistence
    exportData: () => Promise<string>;
    importData: (json: string) => void;
}

const CatalystContext = createContext<CatalystContextType | undefined>(undefined);

export const CatalystProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    console.log("CatalystProvider rendered");
    // State Initialization with Robust Error Handling
    const [initiatives, setInitiativesState] = useState<TInitiative[]>(() => {
        try {
            const saved = localStorage.getItem('cognisys-initiatives');
            return saved ? JSON.parse(saved) : MOCK_INITIATIVES;
        } catch (e) {
            console.error("Failed to parse initiatives from local storage, resetting to defaults.", e);
            return MOCK_INITIATIVES;
        }
    });

    const [organizations, setOrganizationsState] = useState<TOrganization[]>(() => {
        try {
            const saved = localStorage.getItem('cognisys-organizations');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [projects, setProjectsState] = useState<TProject[]>(() => {
        try {
            const saved = localStorage.getItem('cognisys-projects');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [activities, setActivities] = useState<TActivity[]>([]);
    const [selectedInitiative, setSelectedInitiative] = useState<TInitiative | null>(null);
    const [currentView, setCurrentView] = useState<string>('dashboard');
    const [theme, setThemeState] = useState<Theme>('dark');
    const [toastMessage, setToastMessageState] = useState('');
    const [hiveCommand, setHiveCommand] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('cognisys-user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [aiModel, setAiModelState] = useState<string>(() => {
        try {
            return localStorage.getItem('cognisys-ai-model') || 'gemini-2.5-flash';
        } catch {
            return 'gemini-2.5-flash';
        }
    });

    const [loading, setLoading] = useState(false);

    // --- Data Fetching ---
    const fetchInitialData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // For now, assume user has at least one org or we fetch all they have access to
            // This is a simplified version for the integration phase
            // In a real app, we'd have an 'activeOrgId'
        } catch (error) {
            console.error("Failed to fetch initial data", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const unreadActivities = useMemo(() => activities.filter(a => !a.read).length, [activities]);

    // --- Performance Optimization: Debounced Persistence ---
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        localStorage.setItem('cognisys-organizations', JSON.stringify(organizations));
    }, [organizations]);

    useEffect(() => {
        localStorage.setItem('cognisys-projects', JSON.stringify(projects));
    }, [projects]);

    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem('cognisys-initiatives', JSON.stringify(initiatives));
            } catch (e) {
                console.error("Failed to save initiatives to local storage", e);
            }
        }, 1000); 

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [initiatives]);

    useEffect(() => {
        localStorage.setItem('cognisys-ai-model', aiModel);
        // Sync active model to the AI service so all generateX() calls use the selected provider
        setAiModelId(aiModel);
    }, [aiModel]);

    // Theme Effect
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Helper to show toast
    const setToastMessage = useCallback((msg: string) => {
        setToastMessageState(msg);
        setTimeout(() => setToastMessageState(''), 3000);
    }, []);

    // ── Firebase Auth ─────────────────────────────────────────────────────────
    // Map a Firebase user to our internal User shape
    const mapFirebaseUser = useCallback((fbUser: FirebaseUser): User => ({
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email || 'Unknown',
        avatarUrl: fbUser.photoURL || undefined,
    }), []);

    // Listen to Firebase auth state changes — single source of truth for user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            // E2E test bypass: if Playwright injected a test user, don't let Firebase override it
            if (!fbUser && localStorage.getItem('__playwright_skip_auth__')) return;
            if (fbUser) {
                const mapped = mapFirebaseUser(fbUser);
                setUser(mapped);
                localStorage.setItem('cognisys-user', JSON.stringify(mapped));
                // Send ID token to server to create an httpOnly session cookie
                try {
                    const idToken = await fbUser.getIdToken();
                    await fetch('/api/auth/firebase-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken }),
                    });
                } catch (err) {
                    console.warn('Could not sync Firebase session with server:', err);
                }
            } else {
                setUser(null);
                localStorage.removeItem('cognisys-user');
            }
        });
        return unsubscribe;
    }, [mapFirebaseUser]);

    // Sign in with GitHub via Firebase
    const login = useCallback(async () => {
        try {
            await signInWithPopup(auth, githubProvider);
            // onAuthStateChanged fires automatically — no manual setUser needed
        } catch (err: any) {
            if (err?.code === 'auth/popup-blocked') {
                setToastMessage('Please allow popups to sign in.');
            } else if (err?.code !== 'auth/popup-closed-by-user') {
                console.error('GitHub sign-in error:', err);
                setToastMessage('Failed to sign in with GitHub.');
            }
        }
    }, [setToastMessage]);

    // Sign in with Google via Firebase
    const loginWithGoogle = useCallback(async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            if (err?.code === 'auth/popup-blocked') {
                setToastMessage('Please allow popups to sign in.');
            } else if (err?.code !== 'auth/popup-closed-by-user') {
                console.error('Google sign-in error:', err);
                setToastMessage('Failed to sign in with Google.');
            }
        }
    }, [setToastMessage]);

    // Sign out from Firebase + clear server session
    const logout = useCallback(async () => {
        try {
            await signOut(auth);
            await fetch('/api/auth/logout', { method: 'POST' });
            setToastMessage('Logged out successfully.');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    }, [setToastMessage]);

    const addOrganization = useCallback(async (org: Partial<TOrganization>) => {
        try {
            const response = await OrganizationAPI.create(org);
            setToastMessage('Organization created successfully.');
            // Refresh orgs
        } catch (error) {
            setToastMessage('Failed to create organization.');
        }
    }, [setToastMessage]);

    const addProject = useCallback(async (orgId: string, project: Partial<TProject>) => {
        try {
            await ProjectAPI.create(orgId, project);
            setToastMessage('Project created successfully.');
            // Refresh projects
        } catch (error) {
            setToastMessage('Failed to create project.');
        }
    }, [setToastMessage]);

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

    const markActivitiesRead= useCallback(() => {
        setActivities(prev => prev.map(a => ({ ...a, read: true })));
    }, []);

    // --- Actions ---

    const addInitiative = useCallback((initiative: TInitiative) => {
        setInitiativesState(prev => [initiative, ...prev]);
        setToastMessage(`Initiative "${initiative.title}" created.`);
        
        // Activity Log
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
        setActivities(prev => [activity, ...prev]);

    }, [setToastMessage]);

    const updateInitiative = useCallback((initiative: TInitiative) => {
        setInitiativesState(prev => prev.map(i => i.id === initiative.id ? initiative : i));
        if (selectedInitiative?.id === initiative.id) {
            setSelectedInitiative(initiative);
        }
        setToastMessage(`Initiative "${initiative.title}" updated.`);
    }, [selectedInitiative, setToastMessage]);

    const updateInitiativeStatus = useCallback((id: string, newStatus: InitiativeStatus) => {
        let initiativeTitle = '';
        
        setInitiativesState(prev => {
            const init = prev.find(i => i.id === id);
            if (!init) return prev;

            initiativeTitle = init.title;

            // Domain Rule Check
            const ruleCheck = DomainRules.canAdvanceStatus(init, newStatus);
            if (!ruleCheck.allowed) {
                setToastMessage(`Error: ${ruleCheck.reason}`);
                return prev;
            }

            return prev.map(i => 
                i.id === id ? { ...i, status: newStatus, lastUpdated: new Date().toISOString() } : i
            );
        });
        
        // Optimistic update message
        if (selectedInitiative?.id === id) {
             setSelectedInitiative(prev => prev ? { ...prev, status: newStatus } : null);
        }

        if (initiativeTitle) {
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
            setActivities(prev => [activity, ...prev]);
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
        
        setToastMessage('Artifact saved.');

        // --- PULSE SYSTEM: TRIGGER AI REACTION ---
        if (initiativeTitle) {
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
            setActivities(prev => [newActivity, ...prev]);

            // Determine which agent should react
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

                        setActivities(prev => prev.map(act => 
                            act.id === activityId 
                                ? { ...act, comments: [...act.comments, newComment], read: false } // Mark unread on new comment
                                : act
                        ));
                        setToastMessage(`${interestedAgent.name} commented on your work.`);
                    } catch (e) {
                        console.error("AI reaction failed", e);
                    }
                }, 2000); // 2 second delay for "thinking" effect
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

    const resetData = useCallback(() => {
        if(confirm("Are you sure? This will delete all your initiatives and restore the defaults.")) {
            setInitiativesState(MOCK_INITIATIVES);
            setSelectedInitiative(null);
            setCurrentView('dashboard');
            setActivities([]);
            localStorage.removeItem('cognisys-initiatives');
            setToastMessage('System reset to defaults.');
        }
    }, [setToastMessage]);

    const exportData = useCallback(async () => {
        const hiveStates: Record<string, any> = {};
        initiatives.forEach(init => {
            const stateStr = localStorage.getItem(`hive_state_${init.id}`);
            if (stateStr) {
                try {
                    hiveStates[init.id] = JSON.parse(stateStr);
                } catch (e) {
                    console.error(`Failed to parse hive state for ${init.id}`);
                }
            }
        });

        const memories = await MemoryService.loadMemories();

        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            initiatives,
            settings: { theme, aiModel },
            hiveStates,
            memories
        };
        return JSON.stringify(data, null, 2);
    }, [initiatives, theme, aiModel]);

    const importData = useCallback((json: string) => {
        try {
            const data = JSON.parse(json);
            if (!Array.isArray(data.initiatives)) throw new Error("Invalid data format");
            
            setInitiativesState(data.initiatives);
            if (data.settings) {
                setThemeState(data.settings.theme || 'dark');
                setAiModelState(data.settings.aiModel || 'gemini-2.5-flash');
            }
            if (data.hiveStates) {
                Object.entries(data.hiveStates).forEach(([id, state]) => {
                    localStorage.setItem(`hive_state_${id}`, JSON.stringify(state));
                });
            }
            setToastMessage("Data imported successfully.");
        } catch (e) {
            console.error(e);
            setToastMessage("Failed to import data. Invalid file.");
        }
    }, [setToastMessage]);

    const contextValue = useMemo(() => ({
        initiatives,
        organizations,
        projects,
        selectedInitiative,
        currentView,
        theme,
        toastMessage,
        aiModel,
        hiveCommand,
        activities,
        unreadActivities,
        user,
        setInitiatives: setInitiativesState,
        setOrganizations: setOrganizationsState,
        setProjects: setProjectsState,
        selectInitiative: setSelectedInitiative,
        setCurrentView,
        setTheme: setThemeState,
        setToastMessage,
        setAiModel: setAiModelState,
        setHiveCommand,
        markActivitiesRead,
        login,
        logout,
        addInitiative,
        updateInitiative,
        updateInitiativeStatus,
        saveArtifact,
        resetData,
        saveWbs,
        addOrganization,
        addProject,
        triggerWBS,
        triggerRisks,
        exportData,
        importData
    }), [
        initiatives, organizations, projects, selectedInitiative, currentView, theme, toastMessage, aiModel, hiveCommand, activities, unreadActivities, user, login, loginWithGoogle, logout, addInitiative, updateInitiative, updateInitiativeStatus, saveArtifact, resetData, saveWbs, addOrganization, addProject, triggerWBS, triggerRisks, exportData, importData
    ]);

    return (
        <CatalystContext.Provider value={contextValue}>
            {children}
        </CatalystContext.Provider>
    );
};

export const useCatalyst = () => {
    const context = useContext(CatalystContext);
    if (context === undefined) {
        throw new Error('useCatalyst must be used within a CatalystProvider');
    }
    return context;
};

export const useTheme = () => {
    const { theme, setTheme } = useCatalyst();
    return { theme, setTheme };
};
