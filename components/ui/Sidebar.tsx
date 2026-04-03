
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from '../../App';
import { useCatalyst } from '../../context/CatalystContext';

import { 
    LayoutDashboard, 
    FolderKanban, 
    Activity, 
    Swords, 
    TrendingUp, 
    Eye, 
    Hammer, 
    Cpu, 
    Network, 
    ClipboardList, 
    PieChart, 
    BarChart3, 
    Settings, 
    HelpCircle, 
    LogOut,
    GitBranch,
    Briefcase,
    BrainCircuit
} from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number | string;
  collapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, badge, collapsed }) => (
  <button 
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200 w-full relative group ${
      collapsed ? 'justify-center' : 'text-left'
    } ${
      active 
        ? 'bg-accent-purple/10 text-accent-purple dark:text-accent-purple shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]' 
        : 'text-slate-600 dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-darker hover:text-slate-900 dark:hover:text-text-dark'
    }`}
  >
    <div className={`flex-shrink-0 ${active ? 'text-accent-purple' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'} transition-colors`}>
      {icon}
    </div>
    {!collapsed && <span className="flex-1 truncate">{label}</span>}
    {!collapsed && badge !== undefined && badge !== 0 ? (
      <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${typeof badge === 'string' ? 'bg-accent-purple' : 'bg-accent-red'} shadow-sm`}>{badge}</span>
    ) : null}
    {/* Tooltip when collapsed */}
    {collapsed && (
      <span className="absolute left-full ms-2 px-2 py-1 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
        {label}
        {badge !== undefined && badge !== 0 && <span className="ms-1.5 text-accent-purple">({badge})</span>}
      </span>
    )}
  </button>
);

interface SidebarProps {
    activeView: View;
    onNavigate: (view: View) => void;
    isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ activeView, onNavigate, isCollapsed = false }) => {
  const { unreadActivities, user, login, loginWithGoogle, logout } = useCatalyst();
  const { t } = useTranslation(['sidebar', 'common']);

  return (
    <aside className={`flex-shrink-0 border-e border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col h-full z-20 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-border-light dark:border-border-dark flex-shrink-0 ${isCollapsed ? 'justify-center px-2' : 'px-6'}`}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-accent-purple/10 rounded-lg flex-shrink-0">
            <BrainCircuit className="h-6 w-6 text-accent-purple" />
          </div>
          {!isCollapsed && <span className="font-extrabold text-lg tracking-tight text-text-light dark:text-text-dark whitespace-nowrap">COGNISYS</span>}
        </div>
      </div>
      
      {/* User Profile Section */}
      <div className={`flex-shrink-0 ${isCollapsed ? 'px-2 py-3' : 'p-4'}`}>
        {user ? (
          isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" referrerPolicy="no-referrer" />
              <button onClick={logout} className="text-slate-400 hover:text-accent-red transition-colors p-1.5 rounded-lg hover:bg-accent-red/10" title="Logout">
                <LogOut className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-surface-darker p-2.5 rounded-xl border border-border-light dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" referrerPolicy="no-referrer" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-text-light dark:text-text-dark truncate">{user.name}</span>
                  <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-medium uppercase tracking-wider">Pro Plan</span>
                </div>
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-accent-red dark:hover:text-accent-red transition-colors p-1.5 rounded-lg hover:bg-accent-red/10 dark:hover:bg-accent-red/20" title="Logout">
                <LogOut className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          )
        ) : (
          isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button onClick={login} className="w-full flex items-center justify-center p-2 rounded-xl bg-primary dark:bg-accent-purple text-white transition-all hover:shadow-lg" title="Connect GitHub">
                <GitBranch className="h-4 w-4" />
              </button>
              <button onClick={loginWithGoogle} className="w-full flex items-center justify-center p-2 rounded-xl bg-white dark:bg-surface-darker border border-border-light dark:border-slate-700 text-gray-700 dark:text-gray-200 transition-all hover:shadow-lg" title="Sign in with Google">
                {/* Google "G" SVG */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button 
                onClick={login}
                className="w-full flex items-center justify-center gap-2 bg-primary dark:bg-accent-purple text-white py-2.5 px-4 rounded-xl transition-all hover:shadow-lg active:scale-[0.98] text-sm font-bold shadow-md"
              >
                <GitBranch className="h-4 w-4" />
                <span>Connect GitHub</span>
              </button>
              <button
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-surface-darker border border-border-light dark:border-slate-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-xl transition-all hover:shadow-md active:scale-[0.98] text-sm font-semibold"
              >
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto py-2 space-y-6 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <div>
          {!isCollapsed && <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Core Intelligence</p>}
          {isCollapsed && <div className="h-px bg-border-light dark:bg-border-dark mb-2" />}
          <div className="space-y-1">
            <NavItem collapsed={isCollapsed} icon={<Eye className="h-4 w-4" />} label={t('sidebar:visionBoard')} active={activeView === 'visionBoard'} onClick={() => onNavigate('visionBoard')} />
            <NavItem collapsed={isCollapsed} icon={<Hammer className="h-4 w-4" />} label={t('sidebar:construct')} active={activeView === 'construct'} onClick={() => onNavigate('construct')} />
            <NavItem collapsed={isCollapsed} icon={<Cpu className="h-4 w-4" />} label={t('sidebar:cortex')} active={activeView === 'cortex'} onClick={() => onNavigate('cortex')} />
            <NavItem collapsed={isCollapsed} icon={<Network className="h-4 w-4" />} label={t('sidebar:hive')} active={activeView === 'hive'} onClick={() => onNavigate('hive')} />
          </div>
        </div>

        <div>
          {!isCollapsed && <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Operations</p>}
          {isCollapsed && <div className="h-px bg-border-light dark:bg-border-dark mb-2" />}
          <div className="space-y-1">
            <NavItem collapsed={isCollapsed} icon={<ClipboardList className="h-4 w-4" />} label={t('sidebar:projectHub')} active={activeView === 'projectHub'} onClick={() => onNavigate('projectHub')} />
            <NavItem collapsed={isCollapsed} icon={<PieChart className="h-4 w-4" />} label={t('sidebar:intelligenceCenter')} active={activeView === 'intelligenceCenter'} onClick={() => onNavigate('intelligenceCenter')} />
            <NavItem collapsed={isCollapsed} icon={<BarChart3 className="h-4 w-4" />} label={t('sidebar:reports')} active={activeView === 'reports'} onClick={() => onNavigate('reports')} />
          </div>
        </div>
        
        <div className={`pt-4 border-t border-border-light dark:border-border-dark`}>
          <NavItem collapsed={isCollapsed} icon={<Settings className="h-4 w-4" />} label={t('sidebar:settings')} active={activeView === 'settings'} onClick={() => onNavigate('settings')} />
          <NavItem collapsed={isCollapsed} icon={<HelpCircle className="h-4 w-4" />} label={t('sidebar:help')} active={activeView === 'help'} onClick={() => onNavigate('help')} />
        </div>
      </nav>
    </aside>
  );
});

