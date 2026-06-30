import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import {
  House, Users, Rocket, SignOut, CurrencyInr,
  CalendarCheck, ChartBar, CheckSquare, Bell, Gear, ShieldCheck,
  CaretLeft, CaretRight, UserPlus, FileText, FolderOpen, Laptop, CalendarBlank
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { approvalsService } from '@/services/api.service';

interface NavSection {
  title: string;
  items: {
    label: string;
    icon: React.ReactNode;
    href: string;
    badge?: string | number;
  }[];
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', icon: <House size={20} />, href: '/dashboard' },
      { label: 'Employees', icon: <Users size={20} />, href: '/employees' },
    ],
  },
  {
    title: 'MODULES',
    items: [
      { label: 'Onboarding',  icon: <Rocket size={20} />,        href: '/onboarding' },
      { label: 'Offboarding', icon: <UserPlus size={20} />,      href: '/offboarding' },
      { label: 'Leave',       icon: <CalendarBlank size={20} />, href: '/leave' },
      { label: 'Payroll',     icon: <CurrencyInr size={20} />,   href: '/payroll' },
      { label: 'Attendance',  icon: <CalendarCheck size={20} />, href: '/attendance' },
      { label: 'Documents',   icon: <FolderOpen size={20} />,    href: '/documents' },
      { label: 'Assets',      icon: <Laptop size={20} />,        href: '/assets' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Reports', icon: <ChartBar size={20} />, href: '/reports' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Approvals',     icon: <CheckSquare size={20} />, href: '/approvals' },
      { label: 'Notifications', icon: <Bell size={20} />,        href: '/notifications' },
      { label: 'Settings',      icon: <Gear size={20} />,        href: '/settings' },
      { label: 'Audit Logs',    icon: <ShieldCheck size={20} />, href: '/audit' },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuth();
  const [pendingApprovals, setPendingApprovals] = React.useState<number>(0);

  React.useEffect(() => {
    let active = true;
    async function loadCount() {
      try {
        const list = await approvalsService.list('pending');
        if (active) setPendingApprovals(list.length);
      } catch {
        // ignore
      }
    }
    loadCount();
    const timer = setInterval(loadCount, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed top-0 left-0 bottom-0 bg-ag-surface border-r border-ag-border z-40 flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Top Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-ag-border flex-shrink-0">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-ag-primary flex items-center justify-center text-white font-display font-bold text-base flex-shrink-0 shadow-sm">
            WS
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-display font-extrabold text-lg text-ag-ink whitespace-nowrap tracking-tight"
            >
              WorkSphere
            </motion.span>
          )}
        </Link>
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-2 transition-colors"
          >
            <CaretLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!sidebarCollapsed && (
              <div className="ag-nav-section-label px-2">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = item.href === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.href);

              const displayBadge = item.label === 'Approvals'
                ? (pendingApprovals > 0 ? pendingApprovals : undefined)
                : item.badge;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'ag-nav-item',
                    isActive && 'ag-nav-item--active',
                    sidebarCollapsed && 'justify-center px-0'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className={cn('flex-shrink-0', isActive ? 'text-ag-primary' : 'text-ag-ink-2')}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!sidebarCollapsed && displayBadge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ag-accent-coral text-white">
                      {displayBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-ag-border flex flex-col gap-2 flex-shrink-0 bg-ag-surface">
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-full h-9 rounded-lg flex items-center justify-center text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-2 transition-colors mb-1"
          >
            <CaretRight size={16} />
          </button>
        )}
        <div className={cn('flex items-center gap-3 p-2 rounded-xl bg-ag-surface-2/60', sidebarCollapsed && 'justify-center p-0 bg-transparent')}>
          <Avatar name={user?.fullName || 'User'} src={user?.photo} size="sm" />
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ag-ink truncate">{user?.fullName}</p>
              <p className="text-[11px] text-ag-ink-3 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="text-ag-ink-3 hover:text-ag-coral p-1 rounded-md transition-colors"
            >
              <SignOut size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
