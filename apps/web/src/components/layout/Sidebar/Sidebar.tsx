import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Logo } from '@/components/ui/Logo/Logo';
import { cn } from '@/lib/utils';
import { approvalsService } from '@/services/api.service';
import * as Lucide from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badgeKey?: 'approvals';
  roles?: string[];
}

interface DomainSection {
  title: string;
  icon: string;
  items: NavItem[];
  roles?: string[];
}

const domainSections: DomainSection[] = [
  {
    title: 'Human Resources (HRMS)',
    icon: 'Briefcase',
    items: [
      { label: 'Recruitment (ATS)', href: '/recruitment', icon: 'Briefcase' },
      { label: 'Onboarding', href: '/onboarding', icon: 'UserCheck' },
      { label: 'Offboarding', href: '/offboarding', icon: 'UserCog' },
      { label: 'Attendance', href: '/attendance', icon: 'Clock' },
      { label: 'Leave Management', href: '/leave', icon: 'Calendar' },
      { label: 'Payroll', href: '/payroll', icon: 'DollarSign' },
      { label: 'Performance', href: '/performance', icon: 'TrendingUp' },
      { label: 'Learning Management (LMS)', href: '/lms', icon: 'GraduationCap' },
      { label: 'Employee Documents', href: '/documents', icon: 'FileText' }
    ]
  },
  {
    title: 'Finance',
    icon: 'DollarSign',
    items: [
      { label: 'Accounting', href: '/finance/accounting', icon: 'CreditCard' },
      { label: 'Expenses', href: '/finance/expenses', icon: 'Receipt' },
      { label: 'Invoicing', href: '/finance/invoicing', icon: 'FileText' },
      { label: 'Budgeting', href: '/finance/budgeting', icon: 'PieChart' },
      { label: 'Tax Management', href: '/finance/tax', icon: 'ShieldAlert' }
    ]
  },
  {
    title: 'Sales (CRM)',
    icon: 'TrendingUp',
    items: [
      { label: 'Leads', href: '/sales/leads', icon: 'TrendingUp' },
      { label: 'Customers', href: '/sales/customers', icon: 'Users' },
      { label: 'Quotations', href: '/sales/quotations', icon: 'FileText' },
      { label: 'Sales Orders', href: '/sales/orders', icon: 'ShoppingCart' },
      { label: 'Follow Ups', href: '/sales/follow-ups', icon: 'ArrowLeftRight' }
    ]
  },
  {
    title: 'Inventory',
    icon: 'Package',
    items: [
      { label: 'Inventory', href: '/inventory', icon: 'Package' },
      { label: 'Warehouse', href: '/inventory/warehouses', icon: 'Warehouse' },
      { label: 'Purchase Orders', href: '/inventory/purchase-orders', icon: 'FileCheck' },
      { label: 'Suppliers', href: '/inventory/suppliers', icon: 'Users2' },
      { label: 'Stock Movement', href: '/inventory/operations', icon: 'ArrowUpDown' }
    ]
  },
  {
    title: 'Projects',
    icon: 'FolderKanban',
    items: [
      { label: 'Projects', href: '/projects/projects', icon: 'FolderKanban' },
      { label: 'Tasks', href: '/projects/tasks', icon: 'ClipboardList' },
      { label: 'Timesheets', href: '/projects/timesheets', icon: 'Clock' },
      { label: 'Milestones', href: '/projects/milestones', icon: 'Compass' }
    ]
  },
  {
    title: 'Operations',
    icon: 'Laptop',
    items: [
      { label: 'Assets', href: '/assets', icon: 'Laptop' },
      { label: 'Manufacturing', href: '/manufacturing', icon: 'Factory' },
      { label: 'Maintenance', href: '/maintenance', icon: 'Wrench' },
      { label: 'Supply Chain', href: '/supply-chain', icon: 'Truck' },
      { label: 'Helpdesk', href: '/helpdesk', icon: 'Headset' },
      { label: 'Workflow Automation', href: '/workflows/dashboard', icon: 'GitBranch' }
    ]
  },
  {
    title: 'Collaboration',
    icon: 'Rss',
    items: [
      { label: 'Feeds', href: '/community', icon: 'Rss' }
    ]
  },
  {
    title: 'Analytics',
    icon: 'BarChart3',
    items: [
      { label: 'Reports', href: '/analytics/reports', icon: 'BarChart3' },
      { label: 'Dashboards', href: '/analytics/dashboard', icon: 'LineChart' },
      { label: 'Business Intelligence', href: '/analytics/ai', icon: 'Cpu' }
    ]
  },
  {
    title: 'Administration',
    icon: 'UserCog',
    roles: ['super_admin', 'admin', 'manager'],
    items: [
      { label: 'User Management', href: '/admin/users', icon: 'UserCog' },
      { label: 'Roles & Permissions', href: '/admin/permissions', icon: 'Shield' },
      { label: 'Company Settings', href: '/admin/company-settings', icon: 'Building2' },
      { label: 'Approvals', href: '/admin/approvals', icon: 'CheckSquare', badgeKey: 'approvals' },
      { label: 'Notifications', href: '/admin/notifications', icon: 'Bell' },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: 'History', roles: ['super_admin', 'admin'] },
      { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
      { label: 'Integrations', href: '/admin/integrations', icon: 'Share2' }
    ]
  }
];

function renderIcon(name: string, size = 18, className = '') {
  const IconComponent = (Lucide as any)[name] || Lucide.HelpCircle;
  return <IconComponent size={size} className={className} />;
}

const DESKTOP_BREAKPOINT = 1024;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export function Sidebar() {
  const location = useLocation();
  const normPath = location.pathname.replace(/^\/w\/[^/]+/, '') || '/';
  const {
    sidebarCollapsed, toggleSidebar, sidebarWidth, setSidebarWidth,
    sidebarMobileOpen, setSidebarMobileOpen
  } = useUIStore();
  const { user, logout } = useAuth();
  const isDesktop = useIsDesktop();

  const [pendingApprovals, setPendingApprovals] = React.useState<number>(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [hoveredSection, setHoveredSection] = React.useState<string | null>(null);

  // Load expanded states from localStorage
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('ag-sidebar-expanded-sections');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Approvals Count polling
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

  // Check section activation
  const isSectionActive = React.useCallback((section: DomainSection) => {
    return section.items.some(item =>
      item.href === '/dashboard'
        ? normPath === '/dashboard' || normPath === '/'
        : normPath.startsWith(item.href)
    );
  }, [normPath]);

  // Auto-expand section on location change
  React.useEffect(() => {
    const activeSec = domainSections.find(isSectionActive);
    if (activeSec) {
      setExpandedSections(prev => {
        if (prev[activeSec.title]) return prev;
        const next = { ...prev, [activeSec.title]: true };
        localStorage.setItem('ag-sidebar-expanded-sections', JSON.stringify(next));
        return next;
      });
    }
  }, [location.pathname, isSectionActive]);

  // Role permissions checking
  const checkPermission = React.useCallback((roles?: string[]) => {
    if (!roles) return true;
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user?.role]);

  // Filter sections based on search query
  const filteredSections = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const sectionsToVerify = domainSections.filter(sec => checkPermission(sec.roles));

    if (!query) return sectionsToVerify;

    return sectionsToVerify.map(sec => {
      const secMatches = sec.title.toLowerCase().includes(query);
      const itemsToKeep = sec.items.filter(item =>
        item.label.toLowerCase().includes(query) && checkPermission(item.roles)
      );

      if (secMatches) {
        return sec;
      }
      if (itemsToKeep.length > 0) {
        return { ...sec, items: itemsToKeep };
      }
      return null;
    }).filter(Boolean) as DomainSection[];
  }, [searchQuery, checkPermission]);

  // Auto-expand searched matches
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const next: Record<string, boolean> = {};
      filteredSections.forEach(sec => {
        next[sec.title] = true;
      });
      setExpandedSections(next);
    }
  }, [searchQuery, filteredSections]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = { [title]: !prev[title] };
      localStorage.setItem('ag-sidebar-expanded-sections', JSON.stringify(next));
      return next;
    });
  };

  // Close mobile sidebar when nav item is clicked
  const handleNavClick = () => {
    if (!isDesktop) {
      setSidebarMobileOpen(false);
    }
  };

  // ── Desktop sidebar config ───────────────────────────────────────────────
  const widthVal = sidebarCollapsed ? 72 : sidebarWidth;
  const [isDragging, setIsDragging] = React.useState(false);

  const startResize = React.useCallback((mouseDownEvent: React.MouseEvent | React.TouchEvent) => {
    mouseDownEvent.preventDefault();
    setIsDragging(true);
    document.body.classList.add('sidebar-resizing');

    const doResize = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const newWidth = Math.max(280, Math.min(520, currentX));
      setSidebarWidth(newWidth);
    };

    const stopResize = () => {
      setIsDragging(false);
      document.body.classList.remove('sidebar-resizing');
      window.removeEventListener('mousemove', doResize);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('touchmove', doResize);
      window.removeEventListener('touchend', stopResize);
    };

    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('touchmove', doResize);
    window.addEventListener('touchend', stopResize);
  }, [setSidebarWidth]);

  // ── Mobile: slide-in from left as full-height drawer ────────────────────
  // ── Tablet: same as mobile ───────────────────────────────────────────────
  // ── Desktop: permanent, collapsible, resizable ───────────────────────────

  if (!isDesktop) {
    return (
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            role="navigation"
            aria-label="Main navigation"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-ag-surface border-r border-ag-border z-40 flex flex-col justify-between overflow-hidden select-none shadow-2xl"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <style>{`
              .custom-scrollbar::-webkit-scrollbar { width: 4px; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
              .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: var(--ag-border-strong); }
            `}</style>

            {/* Mobile Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-ag-border flex-shrink-0">
              <Link to={user?.role === 'super_admin' ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-3" onClick={handleNavClick}>
                <Logo showText size={28} />
              </Link>
              <button
                onClick={() => setSidebarMobileOpen(false)}
                aria-label="Close navigation"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-2 transition-colors"
              >
                <Lucide.X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pt-3 flex-shrink-0">
              <div className="relative flex items-center bg-ag-surface-2 border border-ag-border hover:border-ag-primary-light focus-within:border-ag-primary focus-within:ring-2 focus-within:ring-ag-primary/20 rounded-xl px-3 py-2 transition-all">
                <Lucide.Search size={14} className="text-ag-ink-3 mr-2" />
                <input
                  type="text"
                  placeholder="Search ERP modules…"
                  className="w-full bg-transparent text-xs text-ag-ink font-semibold focus:outline-none placeholder-ag-ink-3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* Nav List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 custom-scrollbar">
              <div className="space-y-1">
                <Link to="/dashboard" onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 py-3 px-3 rounded-xl text-xs font-semibold text-ag-ink-2 hover:bg-ag-surface-2 hover:text-ag-ink transition-all',
                    location.pathname === '/dashboard' && 'bg-gradient-to-r from-ag-primary to-ag-primary-dark text-white hover:text-white shadow-md shadow-ag-primary/25'
                  )}
                >
                  {renderIcon('LayoutDashboard', 18, location.pathname === '/dashboard' ? 'text-white' : 'text-ag-ink-2')}
                  <span className="truncate">Dashboard</span>
                </Link>
                <Link to="/employees" onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 py-3 px-3 rounded-xl text-xs font-semibold text-ag-ink-2 hover:bg-ag-surface-2 hover:text-ag-ink transition-all',
                    location.pathname.startsWith('/employees') && 'bg-gradient-to-r from-ag-primary to-ag-primary-dark text-white hover:text-white shadow-md shadow-ag-primary/25'
                  )}
                >
                  {renderIcon('Users', 18, location.pathname.startsWith('/employees') ? 'text-white' : 'text-ag-ink-2')}
                  <span className="truncate">Employees</span>
                </Link>
              </div>

              <hr className="border-t border-ag-border my-2" />

              <div className="space-y-2">
                {filteredSections.map((section) => {
                  const isActive = isSectionActive(section);
                  const isExpanded = !!expandedSections[section.title];

                  return (
                    <div key={section.title} className="relative rounded-xl overflow-visible">
                      <button
                        onClick={() => toggleSection(section.title)}
                        className={cn(
                          'w-full flex items-center justify-between py-3 px-3 rounded-xl text-xs font-semibold text-ag-ink-2 hover:bg-ag-surface-2 transition-all',
                          isActive && !isExpanded && 'bg-ag-primary-light text-ag-primary'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {renderIcon(section.icon, 18, isActive ? 'text-ag-primary' : 'text-ag-ink-2')}
                          <span className={cn('truncate', isActive && 'text-ag-primary font-bold')}>{section.title}</span>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <Lucide.ChevronDown size={14} className="text-ag-ink-3" />
                        </motion.div>
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden pl-4 mt-1 space-y-1"
                          >
                            {section.items.map((item) => {
                              const isChildActive = normPath.startsWith(item.href);
                              const displayBadge = item.badgeKey === 'approvals'
                                ? (pendingApprovals > 0 ? pendingApprovals : undefined)
                                : undefined;
                              return (
                                <Link
                                  key={item.href}
                                  to={item.href}
                                  onClick={handleNavClick}
                                  className={cn(
                                    'flex items-center gap-3 py-2.5 px-3 rounded-lg text-[11px] font-semibold text-ag-ink-3 hover:bg-ag-surface-2/60 hover:text-ag-ink transition-all',
                                    isChildActive && 'text-ag-primary bg-ag-primary-light/40 font-bold'
                                  )}
                                >
                                  {renderIcon(item.icon, 14, isChildActive ? 'text-ag-primary' : 'text-ag-ink-3')}
                                  <span className="flex-1 truncate">{item.label}</span>
                                  {displayBadge !== undefined && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-ag-accent-coral text-white shrink-0">
                                      {displayBadge}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-ag-border flex flex-col gap-2 flex-shrink-0 bg-ag-surface">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-ag-surface-2/60 min-w-0">
                <Avatar name={user?.fullName || 'User'} src={user?.photo} size="sm" className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ag-ink truncate">{user?.fullName}</p>
                  <p className="text-[11px] text-ag-ink-3 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  aria-label="Sign out"
                  className="touch-target text-ag-ink-3 hover:text-ag-coral p-1 rounded-md transition-colors flex-shrink-0"
                >
                  <Lucide.LogOut size={18} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  // ── Desktop Sidebar ───────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .sidebar-resizing,
        .sidebar-resizing * {
          cursor: col-resize !important;
          user-select: none !important;
          transition: none !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: var(--ag-border-strong, #E4DFFF);
        }
      `}</style>

      <motion.aside
        role="navigation"
        aria-label="Main navigation"
        initial={false}
        animate={{ width: widthVal }}
        transition={{ duration: isDragging ? 0 : 0.2, ease: 'easeInOut' }}
        style={{ width: widthVal } as any}
        className="fixed top-0 left-0 bottom-0 bg-ag-surface border-r border-ag-border z-40 flex flex-col justify-between overflow-hidden select-none shadow-lg"
      >
        {/* Top Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-ag-border flex-shrink-0">
          <Link to={user?.role === 'super_admin' ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-3 overflow-hidden">
            <Logo showText={!sidebarCollapsed} size={30} />
          </Link>
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-2 transition-colors"
            >
              <Lucide.ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Global Search Bar */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3 flex-shrink-0">
            <div className="relative flex items-center bg-ag-surface-2 border border-ag-border hover:border-ag-primary-light focus-within:border-ag-primary focus-within:ring-2 focus-within:ring-ag-primary/20 rounded-xl px-3 py-2 transition-all">
              <Lucide.Search size={14} className="text-ag-ink-3 mr-2" />
              <input
                type="text"
                placeholder="Search ERP modules…"
                className="w-full bg-transparent text-xs text-ag-ink font-semibold focus:outline-none placeholder-ag-ink-3"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Nav list container */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 custom-scrollbar">
          {/* Main Dashboard & Employees */}
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-semibold text-ag-ink-2 hover:bg-ag-surface-2 hover:text-ag-ink transition-all',
                location.pathname === '/dashboard' && 'bg-gradient-to-r from-ag-primary to-ag-primary-dark text-white hover:text-white hover:from-ag-primary hover:to-ag-primary-dark shadow-md shadow-ag-primary/25',
                sidebarCollapsed && 'justify-center px-0'
              )}
              title={sidebarCollapsed ? 'Dashboard' : undefined}
            >
              {renderIcon('LayoutDashboard', 18, location.pathname === '/dashboard' ? 'text-white' : 'text-ag-ink-2')}
              {!sidebarCollapsed && <span className="truncate">Dashboard</span>}
            </Link>

            <Link
              to="/employees"
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-semibold text-ag-ink-2 hover:bg-ag-surface-2 hover:text-ag-ink transition-all',
                location.pathname.startsWith('/employees') && 'bg-gradient-to-r from-ag-primary to-ag-primary-dark text-white hover:text-white hover:from-ag-primary hover:to-ag-primary-dark shadow-md shadow-ag-primary/25',
                sidebarCollapsed && 'justify-center px-0'
              )}
              title={sidebarCollapsed ? 'Employees' : undefined}
            >
              {renderIcon('Users', 18, location.pathname.startsWith('/employees') ? 'text-white' : 'text-ag-ink-2')}
              {!sidebarCollapsed && <span className="truncate">Employees</span>}
            </Link>
          </div>

          <hr className="border-t border-ag-border my-2" />

          {/* Business Domains Accordion */}
          <div className="space-y-2">
            {filteredSections.map((section) => {
              const isActive = isSectionActive(section);
              const isExpanded = !!expandedSections[section.title];

              return (
                <div
                  key={section.title}
                  className="relative rounded-xl overflow-visible"
                  onMouseEnter={() => setHoveredSection(section.title)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={cn(
                      'w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-semibold text-ag-ink-2 hover:bg-ag-surface-2 transition-all',
                      isActive && !isExpanded && 'bg-ag-primary-light text-ag-primary',
                      sidebarCollapsed && 'justify-center px-0'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {renderIcon(section.icon, 18, isActive ? 'text-ag-primary' : 'text-ag-ink-2')}
                      {!sidebarCollapsed && (
                        <span className={cn('truncate', isActive && 'text-ag-primary font-bold')}>
                          {section.title}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Lucide.ChevronDown size={14} className="text-ag-ink-3" />
                      </motion.div>
                    )}
                  </button>

                  {/* Expanded submenu (desktop) */}
                  {!sidebarCollapsed && (
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden pl-4 mt-1 space-y-1"
                        >
                          {section.items.map((item) => {
                            const isChildActive = normPath.startsWith(item.href);
                            const displayBadge = item.badgeKey === 'approvals'
                              ? (pendingApprovals > 0 ? pendingApprovals : undefined)
                              : undefined;

                            return (
                              <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                  'flex items-center gap-3 py-2 px-3 rounded-lg text-[11px] font-semibold text-ag-ink-3 hover:bg-ag-surface-2/60 hover:text-ag-ink transition-all',
                                  isChildActive && 'text-ag-primary bg-ag-primary-light/40 font-bold'
                                )}
                              >
                                {renderIcon(item.icon, 14, isChildActive ? 'text-ag-primary' : 'text-ag-ink-3')}
                                <span className="flex-1 truncate">{item.label}</span>
                                {displayBadge !== undefined && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-ag-accent-coral text-white shrink-0">
                                    {displayBadge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  {/* Collapsed tooltip dropdown */}
                  <AnimatePresence>
                    {sidebarCollapsed && hoveredSection === section.title && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="absolute left-[64px] top-0 bg-ag-surface border border-ag-border rounded-xl shadow-2xl p-2 w-52 z-50 flex flex-col gap-1"
                      >
                        <div className="px-3 py-1.5 text-[10px] font-bold text-ag-primary uppercase tracking-wider border-b border-ag-border-light mb-1">
                          {section.title}
                        </div>
                        {section.items.map((item) => {
                          const isChildActive = normPath.startsWith(item.href);
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              className={cn(
                                'flex items-center gap-2.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-ag-ink-2 hover:bg-ag-surface-2 hover:text-ag-ink transition-all',
                                isChildActive && 'bg-ag-primary-light text-ag-primary'
                              )}
                            >
                              {renderIcon(item.icon, 14, isChildActive ? 'text-ag-primary' : 'text-ag-ink-2')}
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer / User Profile */}
        <div className="p-3 border-t border-ag-border flex flex-col gap-2 flex-shrink-0 bg-ag-surface">
          {sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="w-full h-9 rounded-lg flex items-center justify-center text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-2 transition-colors mb-1"
            >
              <Lucide.ChevronRight size={16} />
            </button>
          )}
          <div className={cn('flex items-center gap-3 p-2 rounded-xl bg-ag-surface-2/60 min-w-0', sidebarCollapsed && 'justify-center p-0 bg-transparent')}>
            <Avatar name={user?.fullName || 'User'} src={user?.photo} size="sm" className="flex-shrink-0" />
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
                aria-label="Sign out"
                className="text-ag-ink-3 hover:text-ag-coral p-1 rounded-md transition-colors flex-shrink-0"
              >
                <Lucide.LogOut size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Drag Resizer Handle */}
        <div
          onMouseDown={startResize}
          onTouchStart={startResize}
          tabIndex={0}
          role="separator"
          aria-valuenow={widthVal}
          aria-valuemin={280}
          aria-valuemax={520}
          aria-label="Sidebar resize handle"
          className="absolute top-0 right-0 bottom-0 w-[6px] -mr-[3px] cursor-col-resize z-50 group select-none focus:outline-none"
        >
          <div
            className={cn(
              "w-[2px] h-full mx-auto transition-all rounded-full",
              isDragging ? "bg-ag-primary w-[3px]" : "bg-transparent group-hover:bg-ag-border-strong"
            )}
          />
        </div>
      </motion.aside>
    </>
  );
}
