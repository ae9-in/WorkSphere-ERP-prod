import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { TopNavbar } from '../TopNavbar/TopNavbar';
import { GlobalSearch } from '@/components/shared/GlobalSearch/GlobalSearch';
import { NotificationCenter } from '@/components/shared/NotificationCenter/NotificationCenter';
import { useUIStore } from '@/store/uiStore';
import { AnimatePresence, motion } from 'framer-motion';

/** Breakpoint at which the sidebar becomes a permanent fixture (desktop) */
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

export function AppShell() {
  const sidebarCollapsed    = useUIStore(s => s.sidebarCollapsed);
  const sidebarWidth        = useUIStore(s => s.sidebarWidth);
  const sidebarMobileOpen   = useUIStore(s => s.sidebarMobileOpen);
  const setSidebarMobileOpen = useUIStore(s => s.setSidebarMobileOpen);

  const isDesktop = useIsDesktop();
  const location  = useLocation();

  // Auto-close mobile sidebar on route change
  React.useEffect(() => {
    if (!isDesktop) {
      setSidebarMobileOpen(false);
    }
  }, [location.pathname, isDesktop, setSidebarMobileOpen]);

  // Desktop: offset content by sidebar width. Mobile/Tablet: no offset (overlay sidebar)
  const desktopPaddingLeft = isDesktop ? (sidebarCollapsed ? 72 : sidebarWidth) : 0;

  return (
    <div className="min-h-screen bg-ag-canvas flex flex-col">
      {/* Skip to main content — accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Sidebar — always rendered, shown as drawer on mobile/tablet */}
      <Sidebar />

      {/* Mobile / Tablet backdrop — dims content when sidebar is open */}
      <AnimatePresence>
        {!isDesktop && sidebarMobileOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-mobile-backdrop"
            aria-hidden="true"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content area — shifts right only on desktop */}
      <div
        style={{ paddingLeft: `${desktopPaddingLeft}px` }}
        className="flex-1 flex flex-col min-w-0 min-h-screen transition-[padding] duration-200 ease-in-out"
      >
        <TopNavbar />
        <main id="main-content" className="flex-1" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearch />
      <NotificationCenter />
    </div>
  );
}
