
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sidebar } from './components/ui/Sidebar';
import { Header } from './components/ui/Header';
import { Dashboard } from './components/Dashboard';
import { InitiativeView } from './components/InitiativeView';
import { TInitiative, InitiativeStatus, TWorkBreakdown, Sector } from './types';
import { Toast } from './components/ui/Toast';
import { InitiativesList } from './components/InitiativesList';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { HelpView } from './components/HelpView';
import { ProjectHub } from './components/ProjectHub';
import { IntelligenceCenter } from './components/IntelligenceCenter';
import { GlobalAssistant } from './components/ai/GlobalAssistant';
import { CommandPalette } from './components/ui/CommandPalette';
import { MyWorkspace } from './components/MyWorkspace';
import { TheHive } from './components/TheHive';
import { CortexView } from './components/CortexView';
import { PredictiveCoreView } from './components/PredictiveCoreView';
import { PulseView } from './components/PulseView';
import { WarRoomView } from './components/WarRoomView';
import { ConstructView } from './components/ConstructView';
import { VisionBoard } from './components/VisionBoard';
import { CatalystProvider, useCatalyst } from './context/CatalystContext';
import { ApiStatusProvider } from './context/ApiStatusContext';
import { QuotaBanner } from './components/ui/QuotaBanner';
import { setAiModelId } from './services/geminiService';

import { InitiativeForm } from './components/InitiativeForm';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export type View = 'dashboard' | 'initiatives' | 'projectHub' | 'intelligenceCenter' | 'reports' | 'settings' | 'help' | 'myWorkspace' | 'hive' | 'cortex' | 'predictiveCore' | 'pulse' | 'warRoom' | 'construct' | 'visionBoard';
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
        setAiModel
    } = useCatalyst();

    const [initialHubInitiativeId, setInitialHubInitiativeId] = useState<string | null>(null);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [requestedModule, setRequestedModule] = useState<string | null>(null);

    const [isCreatingInitiative, setIsCreatingInitiative] = useState(false);

    // Sync AI Model Service
    useEffect(() => {
        setAiModelId(aiModel);
    }, [aiModel]);

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

            const newInitiative: TInitiative = {
                id: `init-${Date.now()}`,
                orgId: 'org-0',
                projectId: 'proj-0', // Default project
                title,
                description: description || '',
                status: InitiativeStatus.PLANNING,
                sector: sector || randomSector,
                owner: {
                    name: 'Brenda, the Ecosystem Manager',
                    avatarUrl: 'https://i.pravatar.cc/150?u=brenda'
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
            case 'initiatives': return <InitiativesList initiatives={initiatives} onSelectInitiative={selectInitiative} />;
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
            <div className="flex h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-sans overflow-hidden selection:bg-primary selection:text-white">
                {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
                <Sidebar activeView={currentView as View} onNavigate={handleNavigate} isCollapsed={!isSidebarOpen} />
                {isCreatingInitiative && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                    <Header 
                        initiativeName={selectedInitiative?.title} 
                        onBack={selectedInitiative ? () => selectInitiative(null) : undefined}
                        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        isSidebarOpen={isSidebarOpen}
                        title={currentView === 'predictiveCore' ? 'Predictive Core' : undefined}
                        subtitle={currentView === 'predictiveCore' ? 'Phase 11 Roadmap' : undefined}
                    />
                    <main className="flex-1 flex flex-col overflow-y-auto relative custom-scrollbar">
                        <ErrorBoundary componentName="Main Content Area">
                            <motion.div 
                                key={selectedInitiative ? selectedInitiative.id : currentView}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="h-full w-full"
                            >
                                {renderMainContent()}
                            </motion.div>
                        </ErrorBoundary>
                    </main>
                    
                    <ErrorBoundary componentName="Global Assistant">
                        <GlobalAssistant initiative={selectedInitiative} />
                    </ErrorBoundary>
                    
                    <ErrorBoundary componentName="Command Palette">
                        <CommandPalette 
                            isOpen={isCommandPaletteOpen} 
                            onClose={() => setIsCommandPaletteOpen(false)}
                            onNavigate={handleNavigate}
                            onAction={handleCommandAction}
                            selectedInitiative={selectedInitiative}
                        />
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
                <MainLayout />
            </CatalystProvider>
        </ErrorBoundary>
    );
};

export default App;
