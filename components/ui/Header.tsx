

import React, { useMemo } from 'react';
import { useCatalyst } from '../../context/CatalystContext';
import { Search, ArrowLeft, PanelLeftClose, PanelLeftOpen, ChevronRight, Home, LayoutGrid, Minimize2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from '../../src/components/ui/LanguageSwitcher';
import { NotificationBell } from './NotificationBell';
import { motion } from 'motion/react';

interface HeaderProps {
  onOpenCommandPalette?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isFocusModeActive?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({ onOpenCommandPalette, onToggleSidebar, isSidebarOpen = true, isFocusModeActive = false }) => {
  const { currentView, setCurrentView, selectedInitiative, selectInitiative, user, toggleFocusMode } = useCatalyst();

  const breadcrumbs = useMemo(() => {
    const list = [{ label: 'Dashboard', view: 'dashboard', icon: Home }];
    
    if (selectedInitiative) {
      list.push({ label: selectedInitiative.sector, view: 'dashboard', icon: LayoutGrid });
      list.push({ label: selectedInitiative.title, view: null, icon: null });
    } else if (currentView !== 'dashboard') {
      const viewLabel = currentView.charAt(0).toUpperCase() + currentView.slice(1).replace(/([A-Z])/g, ' $1');
      list.push({ label: viewLabel, view: currentView, icon: null });
    }
    
    return list;
  }, [currentView, selectedInitiative]);

  const handleBreadcrumbClick = (view: any) => {
    if (!view) return;
    setCurrentView(view);
    selectInitiative(null);
  };

  return (
    <header className={`flex items-center justify-between px-6 glass-surface z-10 flex-shrink-0 transition-all duration-300 sticky top-0 rounded-b-[3.5rem] mt-4 mx-6 border-b border-white/5 shadow-2xl backdrop-blur-3xl metallic-sheen ${
      isFocusModeActive ? 'h-12 px-4' : 'h-24 px-10'
    }`}>
        <div className="flex items-center overflow-hidden gap-4">
            {/* Sidebar toggle — repurposed as Exit Focus in focus mode */}
            {onToggleSidebar && !isFocusModeActive && (
            <button 
              onClick={onToggleSidebar} 
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="p-4 rounded-2xl hover:bg-white/10 transition-all flex-shrink-0 text-white/40 hover:text-accent-teal active:scale-95 border border-white/5 glass-surface"
            >
                {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
            )}
            
            {/* Catalyst Breadcrumbs */}
            <nav className="flex items-center gap-4 overflow-hidden">
                {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                        {idx > 0 && <ChevronRight className="h-4 w-4 text-white/10 flex-shrink-0" />}
                        <motion.button 
                            whileHover={{ y: -1 }}
                            onClick={() => handleBreadcrumbClick(crumb.view)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all whitespace-nowrap ${
                                idx === breadcrumbs.length - 1 
                                    ? 'text-white font-black italic tracking-tighter cursor-default' 
                                    : 'text-white/30 font-bold hover:text-accent-teal hover:bg-white/5'
                            }`}
                        >
                            {crumb.icon && <crumb.icon className={`h-4 w-4 ${idx === breadcrumbs.length - 1 ? 'text-accent-teal' : ''}`} />}
                            <span className="text-xs uppercase tracking-[0.2em]">{crumb.label}</span>
                        </motion.button>
                    </React.Fragment>
                ))}
            </nav>
        </div>
        
        {/* Right controls — hidden in focus mode */}
        {!isFocusModeActive && (
        <div className="flex items-center gap-10">
            {/* Intelligence Swarm Trigger */}
            <motion.div 
               whileHover={{ scale: 1.01 }}
               onTap={onOpenCommandPalette}
               className="relative hidden 2xl:block group"
            >
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-20">
                    <Search className="h-4 w-4 text-white/20 group-hover:text-accent-teal transition-all duration-300" />
                </div>
                <div 
                    className="pl-14 pr-6 py-4 bg-white/[0.02] border border-white/5 rounded-[1.8rem] text-sm text-white w-[420px] cursor-pointer transition-all duration-500 hover:bg-white/[0.06] hover:border-accent-teal/30 hover:shadow-[0_0_50px_rgba(0,212,170,0.1)] flex items-center justify-between backdrop-blur-2xl group relative overflow-hidden" 
                >
                    <span className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px] group-hover:text-white/40 transition-colors relative z-10">Neural Search...</span>
                    
                    <div className="flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity relative z-10">
                      <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[9px] font-black text-white/60">⌘ K</span>
                      </div>
                    </div>
                </div>
            </motion.div>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 pr-8 border-r border-white/5">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
              
              <div className="flex items-center gap-6">
                <NotificationBell />
                
                {/* User Identity Node */}
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="relative cursor-pointer"
                >
                  {user ? (
                      <div className="relative group">
                        <img 
                          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} 
                          alt="Avatar" 
                          className="h-12 w-12 rounded-[1.2rem] shadow-2xl border-2 border-white/10 group-hover:border-accent-teal transition-all object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent-teal border-2 border-primary shadow-xl neural-pulse" />
                      </div>
                  ) : (
                      <div className="h-12 w-12 rounded-[1.2rem] bg-gradient-to-tr from-accent-teal to-accent-cyan flex items-center justify-center text-primary text-xs font-black shadow-2xl border-2 border-white/10">
                          CO
                      </div>
                  )}
                </motion.div>
              </div>
            </div>
        </div>
        )}

        {/* Focus Mode Exit Button — shown only in focus mode */}
        {isFocusModeActive && (
          <button
            onClick={toggleFocusMode}
            aria-label="Exit Focus Mode"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-accent-teal/60 hover:text-accent-teal border border-accent-teal/10 hover:border-accent-teal/30 hover:bg-accent-teal/5 transition-all duration-200"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span className="uppercase tracking-widest">Exit Focus</span>
            <span className="ml-1 text-white/20">Esc</span>
          </button>
        )}
    </header>
  );
});
