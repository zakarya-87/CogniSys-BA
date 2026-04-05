

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { TInitiative, InitiativeStatus, Theme, TWorkBreakdown, TActivity, TTeamMember, TOrganization, TProject, UserRole } from '../types';
import { MOCK_INITIATIVES, AI_TEAM_MEMBERS } from '../constants';
import { DomainRules } from '../utils/domainRules';
import { generateAgentComment, setAiModelId } from '../services/geminiService';
import { MemoryService } from '../services/memoryService';
import { OrganizationAPI, ProjectAPI, InitiativeAPI, AIAPI } from '../src/services/api';
import { logger } from '../src/utils/logger';
import {
    auth,
    githubProvider,
    googleProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    type FirebaseUser,
} from '../firebase';
import { UIContext, UIContextType } from './UIContext';
import { AuthContext, AuthContextType, User } from './AuthContext';
import { OrgContext, OrgContextType } from './OrgContext';
import { InitiativeContext, InitiativeContextType } from './InitiativeContext';

// Re-export focused hooks so components can subscribe to a single domain
export { useUI } from './UIContext';
export { useAuth } from './AuthContext';
export { useOrg } from './OrgContext';
export { useInitiative } from './InitiativeContext';

// Error codes that indicate popup was blocked by browser tracking prevention
// or privacy settings (Edge, Safari ITP) — fall back to redirect flow in these cases
const POPUP_FALLBACK_ERRORS = new Set([
    'auth/popup-blocked',
    'auth/cancelled-popup-request',
    'auth/web-storage-unsupported',
    'auth/internal-error',
    'auth/operation-not-supported-in-this-environment',
]);

type CatalystContextType = UIContextType & AuthContextType & OrgContextType & InitiativeContextType;

const CatalystContext = createContext<CatalystContextType | undefined>(undefined);

export const CatalystProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State Initialization with Robust Error Handling
    const [initiatives, setInitiativesState] = useState<TInitiative[]>(() => {
        try {
            const saved = localStorage.getItem('cognisys-initiatives');
            // No MOCK_INITIATIVES fallback — real data comes from the API
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
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
    const [apiError, setApiError] = useState<string | null>(null);

    // Ref so fetchDataForOrgs can access current orgs without a stale closure
    const organizationsRef = useRef<TOrganization[]>(organizations);
    useEffect(() => { organizationsRef.current = organizations; }, [organizations]);

    // --- Data Fetching ---
    // Accepts the org list explicitly to avoid circular deps with organizations state
    const fetchDataForOrgs = useCallback(async (orgs: TOrganization[]) => {
        if (!orgs.length) return;
        setLoading(true);
        setApiError(null);
        try {
            const allProjects: TProject[] = [];
            const allInitiatives: TInitiative[] = [];
            await Promise.all(orgs.map(async (org) => {
                const [projectsRes, initiativesRes] = await Promise.all([
                    ProjectAPI.list(org.id),
                    InitiativeAPI.listByOrg(org.id),
                ]);
                allProjects.push(...(projectsRes.data ?? []));
                allInitiatives.push(...(initiativesRes.data ?? []));
            }));
            setProjectsState(allProjects);
            setInitiativesState(allInitiatives);
        } catch (error: any) {
            const status = error?.response?.status;
            if (status === 403) {
                setApiError('Access denied. Your session may be missing org permissions — try signing out and back in.');
            } else {
                setApiError('Could not load data from the server. Showing cached version.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Public fetchInitialData — uses current orgs from ref
    const fetchInitialData = useCallback(async () => {
        await fetchDataForOrgs(organizationsRef.current);
    }, [fetchDataForOrgs]);

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
                logger.error("Failed to save initiatives to local storage", e);
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

    // On mount: consume any pending redirect result (fires after signInWithRedirect).
    // Must be called to complete the redirect flow — onAuthStateChanged fires once processed.
    useEffect(() => {
        getRedirectResult(auth)
            .then((result) => {
                if (result?.user) {
                    // Redirect completed — onAuthStateChanged will also fire,
                    // but log here for visibility
                    logger.log('Redirect sign-in succeeded:', result.user.displayName);
                }
            })
            .catch((err) => {
                if (err?.code && err.code !== 'auth/popup-closed-by-user') {
                    logger.error('Redirect sign-in error:', err?.code, err?.message);
                    setToastMessage('Sign-in failed. Please try again.');
                }
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        credentials: 'include',
                        body: JSON.stringify({ idToken }),
                    });
                } catch (err) {
                    // Session cookie is best-effort; token auth still works
                }
                // Refresh data from API using orgs already in localStorage
                const storedOrgs = (() => {
                    try { return JSON.parse(localStorage.getItem('cognisys-organizations') || '[]'); }
                    catch { return []; }
                })();
                fetchDataForOrgs(storedOrgs);
            } else {
                setUser(null);
                localStorage.removeItem('cognisys-user');
            }
        });
        return unsubscribe;
    }, [mapFirebaseUser, fetchDataForOrgs]);

    // Sign in with GitHub via Firebase
    const login = useCallback(async () => {
        try {
            await signInWithPopup(auth, githubProvider);
            // onAuthStateChanged fires automatically — no manual setUser needed
        } catch (err: any) {
            if (POPUP_FALLBACK_ERRORS.has(err?.code)) {
                // Browser tracking prevention or popup blocked — use redirect flow
                logger.warn('GitHub popup blocked, falling back to redirect:', err?.code);
                await signInWithRedirect(auth, githubProvider);
            } else if (err?.code !== 'auth/popup-closed-by-user') {
                logger.error('GitHub sign-in error:', err);
                setToastMessage('Failed to sign in with GitHub.');
            }
        }
    }, [setToastMessage]);

    // Sign in with Google via Firebase
    const loginWithGoogle = useCallback(async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            if (POPUP_FALLBACK_ERRORS.has(err?.code)) {
                // Browser tracking prevention or popup blocked — use redirect flow
                logger.warn('Google popup blocked, falling back to redirect:', err?.code);
                await signInWithRedirect(auth, googleProvider);
            } else if (err?.code !== 'auth/popup-closed-by-user') {
                logger.error('Google sign-in error:', err);
                setToastMessage('Failed to sign in with Google.');
            }
        }
    }, [setToastMessage]);

    // Sign out from Firebase + clear server session
    const logout = useCallback(async () => {
        try {
            await signOut(auth);
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            setToastMessage('Logged out successfully.');
        } catch (err) {
            logger.error('Logout failed:', err);
        }
    }, [setToastMessage]);

    const addOrganization = useCallback(async (org: Partial<TOrganization>) => {
        try {
            const res = await OrganizationAPI.create(org);
            const newOrg: TOrganization = res.data;
            setOrganizationsState(prev => [...prev, newOrg]);
            setToastMessage('Organization created successfully.');
            // Force-refresh the ID token so the new orgId+role claims from
            // provisionOrgClaims() are included in subsequent API requests.
            await auth.currentUser?.getIdToken(/* forceRefresh */ true);
            fetchDataForOrgs([newOrg]);
        } catch (error) {
            setToastMessage('Failed to create organization.');
        }
    }, [setToastMessage, fetchDataForOrgs]);

    const addProject = useCallback(async (orgId: string, project: Partial<TProject>) => {
        try {
            const res = await ProjectAPI.create(orgId, project);
            const newProject: TProject = res.data;
            setProjectsState(prev => [...prev, newProject]);
            setToastMessage('Project created successfully.');
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
        // Optimistic update — state updates immediately for instant UI feedback
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

        // Write-through to API (fire-and-forget; local state is source of truth until sync)
        if (initiative.orgId && initiative.projectId) {
            void InitiativeAPI.create(initiative.orgId, initiative.projectId, initiative).catch(() => {
                // Non-blocking — initiative already persisted to localStorage
            });
        }
    }, [setToastMessage]);

    const updateInitiative = useCallback((initiative: TInitiative) => {
        setInitiativesState(prev => prev.map(i => i.id === initiative.id ? initiative : i));
        if (selectedInitiative?.id === initiative.id) {
            setSelectedInitiative(initiative);
        }
        setToastMessage(`Initiative "${initiative.title}" updated.`);
        // Write-through to API (fire-and-forget)
        if (initiative.orgId && initiative.projectId) {
            void InitiativeAPI.update(
                initiative.orgId,
                initiative.projectId,
                initiative.id,
                initiative
            ).catch(() => { /* non-blocking */ });
        }
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
                        logger.error("AI reaction failed", e);
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
        if(confirm("Are you sure? This will clear all your initiatives and reload from the server.")) {
            setInitiativesState([]);
            setSelectedInitiative(null);
            setCurrentView('dashboard');
            setActivities([]);
            localStorage.removeItem('cognisys-initiatives');
            setToastMessage('Data cleared. Reloading from server...');
            fetchInitialData();
        }
    }, [setToastMessage, fetchInitialData]);

    const exportData = useCallback(async () => {
        const hiveStates: Record<string, any> = {};
        initiatives.forEach(init => {
            const stateStr = localStorage.getItem(`hive_state_${init.id}`);
            if (stateStr) {
                try {
                    hiveStates[init.id] = JSON.parse(stateStr);
                } catch (e) {
                    logger.error(`Failed to parse hive state for ${init.id}`);
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
            logger.error(e);
            setToastMessage("Failed to import data. Invalid file.");
        }
    }, [setToastMessage]);

    // ── Domain-scoped memos — each re-runs only when its own slice changes ─────
    const authValue = useMemo<AuthContextType>(() => ({
        user,
        login,
        loginWithGoogle,
        logout,
    }), [user, login, loginWithGoogle, logout]);

    const orgValue = useMemo<OrgContextType>(() => ({
        organizations,
        projects,
        loading,
        apiError,
        setOrganizations: setOrganizationsState,
        setProjects: setProjectsState,
        addOrganization,
        addProject,
        fetchInitialData,
    }), [organizations, projects, loading, apiError, addOrganization, addProject, fetchInitialData]);

    const initiativeValue = useMemo<InitiativeContextType>(() => ({
        initiatives,
        selectedInitiative,
        activities,
        unreadActivities,
        setInitiatives: setInitiativesState,
        selectInitiative: setSelectedInitiative,
        markActivitiesRead,
        addInitiative,
        updateInitiative,
        updateInitiativeStatus,
        saveArtifact,
        resetData,
        saveWbs,
        triggerWBS,
        triggerRisks,
        exportData,
        importData,
    }), [initiatives, selectedInitiative, activities, unreadActivities, markActivitiesRead,
        addInitiative, updateInitiative, updateInitiativeStatus, saveArtifact, resetData,
        saveWbs, triggerWBS, triggerRisks, exportData, importData]);

    const uiValue = useMemo<UIContextType>(() => ({
        currentView,
        theme,
        toastMessage,
        aiModel,
        hiveCommand,
        setCurrentView,
        setTheme: setThemeState,
        setToastMessage,
        setAiModel: setAiModelState,
        setHiveCommand,
    }), [currentView, theme, toastMessage, aiModel, hiveCommand, setCurrentView, setToastMessage]);

    const contextValue = useMemo<CatalystContextType>(() => ({
        ...authValue,
        ...orgValue,
        ...initiativeValue,
        ...uiValue,
    }), [authValue, orgValue, initiativeValue, uiValue]);

    return (
        <UIContext.Provider value={uiValue}>
            <AuthContext.Provider value={authValue}>
                <OrgContext.Provider value={orgValue}>
                    <InitiativeContext.Provider value={initiativeValue}>
                        <CatalystContext.Provider value={contextValue}>
                            {children}
                        </CatalystContext.Provider>
                    </InitiativeContext.Provider>
                </OrgContext.Provider>
            </AuthContext.Provider>
        </UIContext.Provider>
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
