

import React from 'react';
import { useCatalyst } from '../../context/CatalystContext';
import { Search, ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from '../../src/components/ui/LanguageSwitcher';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  initiativeName?: string;
  onBack?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = React.memo(({ initiativeName, onBack, onOpenCommandPalette, onToggleSidebar, isSidebarOpen = true, title, subtitle }) => {
  const { unreadActivities, setCurrentView, user } = useCatalyst();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark z-10 flex-shrink-0 transition-all duration-300 shadow-sm backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 sticky top-0">
        <div className="flex items-center overflow-hidden">
            {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar} 
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="mr-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-darker transition-all flex-shrink-0 text-slate-500 dark:text-text-muted-dark active:scale-95"
            >
                {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
            )}
            {onBack && (
            <button onClick={onBack} className="mr-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-darker transition-all flex-shrink-0 text-slate-500 dark:text-text-muted-dark active:scale-95">
                <ArrowLeft className="h-5 w-5" />
            </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-text-light dark:text-text-dark truncate flex items-center gap-3 tracking-tight">
              <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="hover:text-accent-purple transition-colors text-left"
                  title="Go to Dashboard"
              >
                  {initiativeName ? initiativeName : (title || 'CogniSys BA')}
              </button>
              {subtitle && !initiativeName && (
                  <span className="text-[10px] font-bold text-accent-purple bg-accent-purple/10 dark:bg-accent-purple/20 px-2 py-0.5 rounded-md uppercase tracking-widest border border-accent-purple/20">
                      {subtitle}
                  </span>
              )}
              </h1>
              {initiativeName && (
                <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">Active Initiative</span>
              )}
            </div>
        </div>
        
        <div className="flex items-center gap-6">
            {/* Command Palette Trigger */}
            <div className="relative hidden lg:block group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-hover:text-accent-purple transition-colors" />
                </span>
                <div 
                    className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-surface-darker border border-border-light dark:border-slate-800 rounded-xl text-sm text-text-light dark:text-text-dark w-72 cursor-pointer transition-all hover:border-accent-purple/50 hover:shadow-sm flex items-center justify-between group-hover:bg-white dark:group-hover:bg-slate-900" 
                    onClick={onOpenCommandPalette}
                >
                    <span className="text-slate-400 font-medium">Search knowledge...</span>
                    <span className="border border-border-light dark:border-slate-700 rounded-lg px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-surface-dark shadow-sm">⌘K</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              {/* Real-time Notification Bell (SSE-powered) */}
              <NotificationBell />
              
              {/* User Avatar */}
              {user ? (
                  <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt="Avatar" className="h-9 w-9 rounded-full shadow-sm border-2 border-white dark:border-slate-700 hover:border-accent-purple transition-all cursor-pointer" referrerPolicy="no-referrer" />
              ) : (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-accent-purple to-accent-cyan flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white dark:border-slate-700">
                      ZK
                  </div>
              )}
            </div>
        </div>
    </header>
  );
});
