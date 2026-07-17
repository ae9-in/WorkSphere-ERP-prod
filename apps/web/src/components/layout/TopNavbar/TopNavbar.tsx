import React from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { MagnifyingGlass, Bell, Question, SignOut, User, Gear, List } from '@phosphor-icons/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router-dom';

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

export function TopNavbar() {
  const { setGlobalSearchOpen, setNotificationDrawerOpen, toggleMobileSidebar } = useUIStore();
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  return (
    <header
      className="h-16 bg-ag-surface border-b border-ag-border px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Left side — hamburger (mobile/tablet) + breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Hamburger — only visible on mobile/tablet */}
        {!isDesktop && (
          <button
            onClick={toggleMobileSidebar}
            aria-label="Open navigation menu"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-ag-ink-2 hover:bg-ag-surface-2 transition-colors border border-transparent hover:border-ag-border flex-shrink-0"
          >
            <List size={22} weight="bold" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right side — search + icons + profile */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
        {/* Search — full bar on desktop, icon-only on mobile/tablet */}
        {isDesktop ? (
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="flex items-center gap-3 bg-ag-canvas border border-ag-border px-3.5 py-2 rounded-xl text-ag-ink-3 text-xs font-medium hover:border-ag-border-strong transition-colors w-56 xl:w-64 shadow-xs"
            aria-label="Search records"
          >
            <MagnifyingGlass size={16} className="text-ag-ink-3 flex-shrink-0" />
            <span className="flex-1 text-left truncate">Search records...</span>
            <kbd className="bg-ag-surface px-1.5 py-0.5 rounded text-[10px] font-mono border border-ag-border text-ag-ink-3 shadow-2xs hidden lg:inline-block">
              ⌘K
            </kbd>
          </button>
        ) : (
          <button
            onClick={() => setGlobalSearchOpen(true)}
            aria-label="Search records"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-ag-ink-2 hover:bg-ag-surface-2 transition-colors border border-transparent hover:border-ag-border"
          >
            <MagnifyingGlass size={18} />
          </button>
        )}

        {/* Help Icon — hidden on very small screens */}
        <button
          title="Help & Documentation"
          aria-label="Help and documentation"
          className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-ag-ink-2 hover:bg-ag-surface-2 transition-colors border border-transparent hover:border-ag-border"
        >
          <Question size={18} />
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => setNotificationDrawerOpen(true)}
          title="Notifications"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-ag-ink-2 hover:bg-ag-surface-2 transition-colors relative border border-transparent hover:border-ag-border"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="ag-notif-badge" aria-hidden="true">{unreadCount}</span>
          )}
        </button>

        <div className="h-5 w-px bg-ag-border hidden sm:block" />

        {/* Profile Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-ag-surface-2 transition-colors outline-none cursor-pointer"
              aria-label="Account menu"
            >
              <Avatar name={user?.fullName || 'User'} src={user?.photo} size="sm" />
              <span className="text-xs font-bold text-ag-ink hidden xl:inline-block max-w-[120px] truncate">
                {user?.fullName}
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="w-56 bg-ag-surface rounded-xl border border-ag-border shadow-modal p-1.5 z-50 animate-scale-in"
            >
              <div className="px-3 py-2 border-b border-ag-border mb-1">
                <p className="text-xs font-bold text-ag-ink truncate">{user?.fullName}</p>
                <p className="text-[11px] text-ag-ink-3 truncate">{user?.email}</p>
              </div>
              <DropdownMenu.Item
                onSelect={() => navigate(`/employees/${user?.employeeId}`)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ag-ink-2 hover:text-ag-ink hover:bg-ag-surface-2 rounded-lg cursor-pointer outline-none transition-colors"
              >
                <User size={16} />
                <span>My Profile</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => navigate('/settings')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ag-ink-2 hover:text-ag-ink hover:bg-ag-surface-2 rounded-lg cursor-pointer outline-none transition-colors"
              >
                <Gear size={16} />
                <span>Settings</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-ag-border my-1" />
              <DropdownMenu.Item
                onSelect={logout}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ag-coral hover:bg-[#FFF0EF] rounded-lg cursor-pointer outline-none transition-colors"
              >
                <SignOut size={16} />
                <span>Sign Out</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
