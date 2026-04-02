
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
    Github,
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
  const { unreadActivities, user, login, logout } = useCatalyst();
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
            <button onClick={login} className="w-full flex items-center justify-center p-2 rounded-xl bg-primary dark:bg-accent-purple text-white transition-all hover:shadow-lg" title="Connect GitHub">
              <Github className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={login}
              className="w-full flex items-center justify-center gap-2 bg-primary dark:bg-accent-purple text-white py-2.5 px-4 rounded-xl transition-all hover:shadow-lg active:scale-[0.98] text-sm font-bold shadow-md"
            >
              <Github className="h-4 w-4" />
              <span>Connect GitHub</span>
            </button>
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

