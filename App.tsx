
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Shell components — always visible, stay eager
import { Sidebar } from './components/ui/Sidebar';
import { Header } from './components/ui/Header';
import { Toast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { InitiativeForm } from './components/InitiativeForm';
import { QuotaBanner } from './components/ui/QuotaBanner';
import { Spinner } from './components/ui/Spinner';
import { FocusModeButton } from './components/ui/FocusModeButton';

// Routed views — lazy-loaded on first navigation (~40-60% initial bundle reduction)
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const InitiativeView = lazy(() => import('./components/InitiativeView').then(m => ({ default: m.InitiativeView })));
const InitiativesList = lazy(() => import('./components/InitiativesList').then(m => ({ default: m.InitiativesList })));
const ReportsView = lazy(() => import('./components/ReportsView').then(m => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const HelpView = lazy(() => import('./components/HelpView').then(m => ({ default: m.HelpView })));
const ProjectHub = lazy(() => import('./components/ProjectHub').then(m => ({ default: m.ProjectHub })));
const IntelligenceCenter = lazy(() => import('./components/IntelligenceCenter').then(m => ({ default: m.IntelligenceCenter })));
const GlobalAssistant = lazy(() => import('./components/ai/GlobalAssistant').then(m => ({ default: m.GlobalAssistant })));
const CommandPalette = lazy(() => import('./components/ui/CommandPalette').then(m => ({ default: m.CommandPalette })));
const MyWorkspace = lazy(() => import('./components/MyWorkspace').then(m => ({ default: m.MyWorkspace })));
const TheHive = lazy(() => import('./components/TheHive').then(m => ({ default: m.TheHive })));
const CortexView = lazy(() => import('./components/CortexView').then(m => ({ default: m.CortexView })));
const PredictiveCoreView = lazy(() => import('./components/PredictiveCoreView').then(m => ({ default: m.PredictiveCoreView })));
const PulseView = lazy(() => import('./components/PulseView').then(m => ({ default: m.PulseView })));
const WarRoomView = lazy(() => import('./components/WarRoomView').then(m => ({ default: m.WarRoomView })));
const ConstructView = lazy(() => import('./components/ConstructView').then(m => ({ default: m.ConstructView })));
const VisionBoard = lazy(() => import('./components/VisionBoard').then(m => ({ default: m.VisionBoard })));


import { TInitiative, InitiativeStatus, TWorkBreakdown, Sector } from './types';
import { CatalystProvider, useCatalyst } from './context/CatalystContext';
import { ApiStatusProvider } from './context/ApiStatusContext';
import { setAiModelId } from './services/geminiService';
import { LoginView } from './components/LoginView';
import { OnboardingWizard } from './components/OnboardingWizard';

const ViewFallback = () => (
    <div className="flex h-full items-center justify-center">
        <Spinner />
    </div>
);

export type View = 'dashboard' | 'initiatives' | 'projectHub' | 'intelligenceCenter' | 'reports' | 'settings' | 'help' | 'myWorkspace' | 'hive' | 'cortex' | 'predictiveCore' | 'pulse' | 'warRoom' | 'construct' | 'visionBoard' | 'oracle';
export type Theme = 'light' | 'dark' | 'system';

const MainLayout: React.FC = () => {
    const { 
        initiatives, 
        selectedInitiative, 
        selectInitiative, 
        currentView, 
        setCurrentView, 
        toastMessage, 
        setToastMessage,
        addInitiative,
        updateInitiative,
        updateInitiativeStatus,
        saveWbs,
        aiModel,
        setAiModel,
        user,
        projects,
        loading,
        loadingMore,
        initiativesNextCursor,
        loadMoreInitiatives,
        isFocusModeActive,
        toggleFocusMode,
    } = useCatalyst();

    const [initialHubInitiativeId, setInitialHubInitiativeId] = useState<string | null>(null);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
    const [requestedModule, setRequestedModule] = useState<string | null>(null);

    // Auto-close sidebar when viewport shrinks to mobile
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const [isCreatingInitiative, setIsCreatingInitiative] = useState(false);

    // Sync AI Model Service
    useEffect(() => {
        setAiModelId(aiModel);
    }, [aiModel]);

    // Keyboard shortcut — Command Palette ⌘K / Ctrl+K
    // Keyboard shortcut — Focus Mode Ctrl+Shift+F
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                toggleFocusMode();
            }
            // Escape exits Focus Mode (sidebar ESC is handled within Sidebar itself)
            if (e.key === 'Escape' && isFocusModeActive) {
                toggleFocusMode();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFocusModeActive, toggleFocusMode]);

    // Error Formatting Utility
    const getFriendlyErrorMessage = (error: unknown, context: string): string => {
        if (error instanceof Error) {
            const msg = error.message;
            if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) return `Connection Error during ${context}.`;
            if (msg.includes('429') || msg.includes('Quota')) return `Service Busy during ${context}. Try again later.`;
            if (msg.includes('JSON')) return `Data Error during ${context}.`;
            return `Error during ${context}: ${msg}`;
        }
        return `An unexpected error occurred during ${context}.`;
    };

    const handleNavigate = (view: View) => {
        setCurrentView(view);
        selectInitiative(null);
        setInitialHubInitiativeId(null);
        setRequestedModule(null);
    };

    const handleCreateInitiative = (title?: string, description?: string, sector?: Sector) => {
        if (!title) {
            setIsCreatingInitiative(true);
            return;
        }
        try {
            const sectors = Object.values(Sector);
            const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
            const orgId = user?.orgId || 'org-0';
            const projectId = projects?.[0]?.id || 'proj-0';

            const newInitiative: TInitiative = {
                id: `init-${Date.now()}`,
                orgId,
                projectId,
                title,
                description: description || '',
                status: InitiativeStatus.PLANNING,
                sector: sector || randomSector,
                owner: {
                    name: user?.name || 'Coach',
                    avatarUrl: user?.avatarUrl || 'https://i.pravatar.cc/150?u=coach'
                },
                artifacts: {} // Initialize empty artifacts
            };
            addInitiative(newInitiative);
            selectInitiative(newInitiative);
            setCurrentView('initiatives');
        } catch (error) {
            console.error("Error creating initiative:", error);
            setToastMessage(getFriendlyErrorMessage(error, 'Initiative Creation'));
        }
    };

    const handleEditInitiative = (initiative: TInitiative) => {
        try {
            updateInitiative(initiative);
            setToastMessage(`Initiative "${initiative.title}" updated.`);
        } catch (error) {
            console.error("Error updating initiative:", error);
            setToastMessage(getFriendlyErrorMessage(error, 'Initiative Update'));
        }
    };

    const handleCommandAction = (action: string) => {
        try {
            if (action.startsWith('nav_module:')) {
                const moduleName = action.split(':')[1];
                if (selectedInitiative) {
                    setRequestedModule(moduleName);
                }
            } else if (action === 'createInitiative') {
                handleCreateInitiative();
            } else if (action === 'addStory') {
                setRequestedModule('Backlog');
                setToastMessage("Opened Backlog to add story.");
            } else if (action === 'logRisk') {
                setRequestedModule('Risk');
                setToastMessage("Opened Risk Ledger.");
            }
        } catch (error) {
             console.error("Error executing command:", error);
             setToastMessage("Command execution failed.");
        }
    };

    const handleViewProjectPlan = (initiative: TInitiative) => {
        setInitialHubInitiativeId(initiative.id);
        setCurrentView('projectHub');
        selectInitiative(null);
    };

    const handleSelectInitiativeFromCortex = (id: string) => {
        const init = initiatives.find(i => i.id === id);
        if (init) {
            selectInitiative(init);
        }
    };

    const renderMainContent = () => {
        if (selectedInitiative) {
            return (
                <InitiativeView
                    initiative={selectedInitiative}
                    onUpdateStatus={updateInitiativeStatus}
                    onEditInitiative={handleEditInitiative}
                    setToastMessage={setToastMessage}
                    onViewProjectPlan={handleViewProjectPlan}
                    requestedModule={requestedModule}
                />
            );
        }
        switch (currentView) {
            case 'myWorkspace': return <MyWorkspace initiatives={initiatives} />;
            case 'dashboard': return <Dashboard initiatives={initiatives} onSelectInitiative={selectInitiative} onCreateInitiative={handleCreateInitiative} />;
            case 'initiatives': return (
                <InitiativesList 
                    initiatives={initiatives} 
                    onSelectInitiative={selectInitiative}
                    nextCursor={initiativesNextCursor}
                    loading={loadingMore}
                    onLoadMore={loadMoreInitiatives}
                />
            );
            case 'hive': return <TheHive />;
            case 'cortex': return <CortexView initiatives={initiatives} onSelectInitiative={handleSelectInitiativeFromCortex} />;
            case 'predictiveCore': return <PredictiveCoreView />;
            case 'pulse': return <PulseView />;
            case 'warRoom': return <WarRoomView />;
            case 'construct': return <ConstructView />;
            case 'visionBoard': return <VisionBoard />;
            case 'projectHub': return <ProjectHub initiatives={initiatives} onSaveWbs={saveWbs} initialSelectedInitiativeId={initialHubInitiativeId} />;
            case 'intelligenceCenter': return <IntelligenceCenter initiatives={initiatives} onCreateInitiative={handleCreateInitiative} />;
            case 'reports': return <ReportsView initiatives={initiatives} onSelectInitiative={selectInitiative} />;
            case 'settings': return <SettingsView />;
            case 'help': return <HelpView />;
            default: return <Dashboard initiatives={initiatives} onSelectInitiative={selectInitiative} onCreateInitiative={handleCreateInitiative} />;
        }
    };

    return (
        <ApiStatusProvider>
            <QuotaBanner />
            <div className="flex h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-sans overflow-hidden selection:bg-accent-teal selection:text-white relative">
                {/* Global Ambient Background — dim in focus mode */}
                <div className={`absolute inset-0 bg-grid-pattern pointer-events-none transition-opacity duration-500 ${isFocusModeActive ? 'opacity-5' : 'opacity-10'}`} />
                <div className={`absolute inset-0 bg-gradient-to-tr from-accent-teal/5 via-transparent to-accent-cyan/5 pointer-events-none transition-opacity duration-500 ${isFocusModeActive ? 'opacity-30' : 'opacity-100'}`} />

                {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
                
                {/* Mobile backdrop — dims content, closes drawer on tap; hidden in focus mode */}
                {isSidebarOpen && !isFocusModeActive && (
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close navigation"
                    />
                )}

                <Sidebar
                    activeView={currentView as View}
                    onNavigate={handleNavigate}
                    isCollapsed={!isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    isFocusModeActive={isFocusModeActive}
                />
                
                {isCreatingInitiative && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <InitiativeForm 
                            projectId="proj-0"
                            onSubmit={(init) => {
                                handleCreateInitiative(init.title, init.description, init.sector);
                                setIsCreatingInitiative(false);
                            }}
                            onCancel={() => setIsCreatingInitiative(false)}
                        />
                    </div>
                )}
                
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {!isFocusModeActive && (
                        <Header 
                            initiativeName={selectedInitiative?.title} 
                            onBack={selectedInitiative ? () => selectInitiative(null) : undefined}
                            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                            isSidebarOpen={isSidebarOpen}
                            title={currentView === 'predictiveCore' ? 'Predictive Core' : undefined}
                            subtitle={currentView === 'predictiveCore' ? 'Phase 11 Roadmap' : undefined}
                            isFocusModeActive={isFocusModeActive}
                        />
                    )}
                    
                    <main className={`flex-1 flex flex-col overflow-y-auto relative custom-scrollbar transition-all duration-300 ${isFocusModeActive ? 'p-0' : 'p-4 xl:p-6'}`}>
                        {/* Scroll Progress Indicator — visible only in Focus Mode */}
                        {isFocusModeActive && <div className="focus-scroll-indicator" aria-hidden="true" />}
                        <ErrorBoundary componentName="Main Content Area">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={selectedInitiative ? `init-${selectedInitiative.id}` : `view-${currentView}`}
                                    initial={{ opacity: 0, y: 12, scale: 0.99 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -12, scale: 0.99 }}
                                    transition={{ 
                                        type: 'spring',
                                        stiffness: 260,
                                        damping: 24,
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="h-full w-full"
                                >
                                    <Suspense fallback={<ViewFallback />}>
                                        {renderMainContent()}
                                    </Suspense>
                                </motion.div>
                            </AnimatePresence>
                        </ErrorBoundary>
                    </main>

                    {/* Focus Mode FAB — always visible */}
                    <FocusModeButton />
                    
                    <ErrorBoundary componentName="Global Assistant">
                        <Suspense fallback={null}>
                            <GlobalAssistant initiative={selectedInitiative} />
                        </Suspense>
                    </ErrorBoundary>
                    
                    <ErrorBoundary componentName="Command Palette">
                        <Suspense fallback={null}>
                            <CommandPalette 
                                isOpen={isCommandPaletteOpen} 
                                onClose={() => setIsCommandPaletteOpen(false)}
                                onNavigate={handleNavigate}
                                onAction={handleCommandAction}
                                selectedInitiative={selectedInitiative}
                            />
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </div>
        </ApiStatusProvider>
    );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary componentName="Root Application">
            <CatalystProvider>
                <AuthGate />
            </CatalystProvider>
        </ErrorBoundary>
    );
};

const AuthGate: React.FC = () => {
    const { user, organizations, loading, setCurrentView } = useCatalyst();
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

    const showWizard =
        user !== null &&
        organizations.length === 0 &&
        !loading &&
        !hasCompletedOnboarding;

    const handleWizardComplete = (action?: 'dashboard' | 'settings') => {
        setHasCompletedOnboarding(true);
        if (action === 'settings') {
            setCurrentView('settings');
        } else {
            setCurrentView('dashboard');
        }
    };

    if (user === null) return <LoginView />;
    if (showWizard) return <OnboardingWizard onComplete={handleWizardComplete} />;
    return <MainLayout />;
};

export default App;
