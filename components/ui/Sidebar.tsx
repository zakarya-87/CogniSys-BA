
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from '../../App';
import { useCatalyst } from '../../context/CatalystContext';
import { motion, AnimatePresence } from 'motion/react';

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
    BrainCircuit,
    Zap
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
  <motion.button 
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 w-full relative group overflow-hidden ${
      collapsed ? 'justify-center' : 'text-left'
    } ${
      active 
        ? 'text-accent-teal' 
        : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="absolute inset-0 bg-accent-teal/10 border border-accent-teal/20 rounded-xl z-0"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
    
    <div className={`relative z-10 flex-shrink-0 ${active ? 'text-accent-teal' : 'text-white/40 group-hover:text-white'} transition-colors`}>
      {icon}
    </div>
    
    {!collapsed && <span className="relative z-10 flex-1 truncate">{label}</span>}
    
    {!collapsed && badge !== undefined && badge !== 0 ? (
      <span className={`relative z-10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full ${typeof badge === 'string' ? 'bg-accent-teal shadow-[0_0_10px_rgba(0,212,170,0.3)]' : 'bg-accent-red'} shadow-sm`}>
        {badge}
      </span>
    ) : null}

    {/* Tooltip when collapsed */}
    {collapsed && (
      <span className="absolute left-full ms-2 px-3 py-1.5 text-xs font-bold text-white glass-card backdrop-blur-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-all duration-200 translate-x-1 group-hover:translate-x-0">
        {label}
        {badge !== undefined && badge !== 0 && <span className="ms-1.5 text-accent-teal">({badge})</span>}
      </span>
    )}
  </motion.button>
);

interface SidebarProps {
    activeView: View;
    onNavigate: (view: View) => void;
    isCollapsed?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ activeView, onNavigate, isCollapsed = false, onClose }) => {
  const { unreadActivities, user, login, loginWithGoogle, logout } = useCatalyst();
  const { t } = useTranslation(['sidebar', 'common']);

  // Close drawer on ESC key (mobile)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleNavigate = (view: View) => {
    onNavigate(view);
    // Auto-close drawer on mobile after navigation
    if (onClose) onClose();
  };

  return (
    /*
     * Layout strategy:
     *  - md+: inline aside, collapses to icon-rail (w-24) or full (w-80)
     *  - <md:  fixed drawer overlay, slides in from left, sits above content
     */
    <aside
      className={[
        // MOBILE: fixed full-height overlay drawer
        'fixed inset-y-0 left-0 z-50 md:relative md:inset-auto',
        // DESKTOP: inline flex-shrink-0
        'md:flex-shrink-0',
        // Shared visual treatment
        'glass-card metallic-sheen flex flex-col h-full overflow-hidden m-4 shadow-2xl',
        // Width
        isCollapsed ? 'md:w-24' : 'md:w-80',
        // Always full-width on mobile (constrained by the m-4 margin)
        'w-[calc(100vw-2rem)] max-w-[20rem]',
        // Slide transition — hidden off-screen when collapsed on mobile, visible on desktop
        'transition-transform duration-300 ease-in-out',
        isCollapsed ? '-translate-x-[calc(100%+2rem)] md:translate-x-0' : 'translate-x-0',
      ].join(' ')}
      aria-label="Main navigation"
    >
      {/* Brand Identity: Catalyst Hub */}
      <div className={`h-24 flex items-center flex-shrink-0 ${isCollapsed ? 'justify-center px-4' : 'px-8'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent-teal/10 rounded-2xl flex-shrink-0 border border-accent-teal/20 shadow-[0_0_20px_rgba(0,212,170,0.1)] neural-pulse">
            <BrainCircuit className="h-7 w-7 text-accent-teal" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-white whitespace-nowrap leading-none italic">COGNISYS</span>
              <span className="text-[9px] font-black text-accent-teal uppercase tracking-[0.4em] mt-1">The Catalyst Hub</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Contextual User Node */}
      <div className={`flex-shrink-0 ${isCollapsed ? 'px-4 py-4' : 'px-6 py-4'}`}>
        {user ? (
          isCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt="Avatar" className="w-12 h-12 rounded-2xl border-2 border-accent-teal/20 shadow-lg object-cover" referrerPolicy="no-referrer" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-teal border-2 border-primary rounded-full" />
              </div>
              <button onClick={logout} className="text-white/20 hover:text-accent-red transition-colors p-2 rounded-xl hover:bg-accent-red/10" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 rounded-[1.5rem] shadow-inner group metallic-sheen">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="relative">
                  <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt="Avatar" className="w-11 h-11 rounded-[1rem] border-2 border-white/10 shadow-sm object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-accent-teal border-2 border-surface-darker rounded-full shadow-sm" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-white italic tracking-tight truncate">{user.name}</span>
                  <span className="text-[10px] text-accent-teal font-black uppercase tracking-widest mt-0.5">Enterprise Plan</span>
                </div>
              </div>
              <button onClick={logout} className="text-white/20 hover:text-accent-red transition-colors p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3">
            <button 
                onClick={login}
                className="w-full flex items-center justify-center gap-3 bg-accent-teal text-primary py-3 px-4 rounded-2xl transition-all hover:shadow-[0_8px_25px_rgba(0,212,170,0.3)] active:scale-[0.98] text-xs font-black"
            >
                <GitBranch className="h-4 w-4" />
                {!isCollapsed && <span className="uppercase tracking-widest">Connect Intelligence</span>}
            </button>
          </div>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto py-6 space-y-10 custom-scrollbar ${isCollapsed ? 'px-4' : 'px-6'}`}>
        <div>
          {!isCollapsed && <p className="px-4 mb-4 text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Strategic Hub</p>}
          <div className="space-y-2">
            <NavItem collapsed={isCollapsed} icon={<Briefcase className="h-5 w-5" />} label={t('sidebar:myWorkspace')} active={activeView === 'myWorkspace'} onClick={() => handleNavigate('myWorkspace')} />
            <NavItem collapsed={isCollapsed} icon={<LayoutDashboard className="h-5 w-5" />} label={t('sidebar:dashboard')} active={activeView === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
            <NavItem collapsed={isCollapsed} icon={<FolderKanban className="h-5 w-5" />} label={t('sidebar:initiatives')} active={activeView === 'initiatives'} onClick={() => handleNavigate('initiatives')} />
            <NavItem collapsed={isCollapsed} icon={<Activity className="h-5 w-5" />} label={t('sidebar:pulse')} active={activeView === 'pulse'} onClick={() => handleNavigate('pulse')} />
          </div>
        </div>

        <div>
          {!isCollapsed && <p className="px-4 mb-4 text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Tactical Operations</p>}
          <div className="space-y-2">
            <NavItem collapsed={isCollapsed} icon={<Swords className="h-5 w-5" />} label={t('sidebar:warRoom')} active={activeView === 'warRoom'} onClick={() => handleNavigate('warRoom')} />
            <NavItem collapsed={isCollapsed} icon={<Zap className="h-5 w-5" />} label={t('sidebar:oracle')} active={activeView === 'oracle'} onClick={() => handleNavigate('oracle')} />
            <NavItem collapsed={isCollapsed} icon={<Eye className="h-5 w-5" />} label={t('sidebar:visionBoard')} active={activeView === 'visionBoard'} onClick={() => handleNavigate('visionBoard')} />
            <NavItem collapsed={isCollapsed} icon={<Hammer className="h-5 w-5" />} label={t('sidebar:construct')} active={activeView === 'construct'} onClick={() => handleNavigate('construct')} />
          </div>
        </div>

        <div>
          {!isCollapsed && <p className="px-4 mb-4 text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Intelligence Services</p>}
          <div className="space-y-2">
            <NavItem collapsed={isCollapsed} icon={<Cpu className="h-5 w-5" />} label={t('sidebar:cortex')} active={activeView === 'cortex'} onClick={() => handleNavigate('cortex')} />
            <NavItem collapsed={isCollapsed} icon={<Network className="h-5 w-5" />} label={t('sidebar:hive')} active={activeView === 'hive'} onClick={() => handleNavigate('hive')} />
            <NavItem collapsed={isCollapsed} icon={<ClipboardList className="h-5 w-5" />} label={t('sidebar:projectHub')} active={activeView === 'projectHub'} onClick={() => handleNavigate('projectHub')} />
            <NavItem collapsed={isCollapsed} icon={<PieChart className="h-5 w-5" />} label={t('sidebar:intelligenceCenter')} active={activeView === 'intelligenceCenter'} onClick={() => handleNavigate('intelligenceCenter')} />
            <NavItem collapsed={isCollapsed} icon={<BarChart3 className="h-5 w-5" />} label={t('sidebar:reports')} active={activeView === 'reports'} onClick={() => handleNavigate('reports')} />
          </div>
        </div>
        
        <div className={`pt-8 border-t border-white/5`}>
          <NavItem collapsed={isCollapsed} icon={<Settings className="h-5 w-5" />} label={t('sidebar:settings')} active={activeView === 'settings'} onClick={() => handleNavigate('settings')} />
          <NavItem collapsed={isCollapsed} icon={<HelpCircle className="h-5 w-5" />} label={t('sidebar:help')} active={activeView === 'help'} onClick={() => handleNavigate('help')} />
        </div>
      </nav>
    </aside>
  );
});

