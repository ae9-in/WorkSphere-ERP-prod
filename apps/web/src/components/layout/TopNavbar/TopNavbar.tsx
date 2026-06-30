import React from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { MagnifyingGlass, Bell, Question, SignOut, User, Gear } from '@phosphor-icons/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router-dom';

export function TopNavbar() {
  const { setGlobalSearchOpen, setNotificationDrawerOpen } = useUIStore();
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-ag-surface border-b border-ag-border px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search Button */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="flex items-center gap-3 bg-ag-canvas border border-ag-border px-3.5 py-2 rounded-xl text-ag-ink-3 text-xs font-medium hover:border-ag-border-strong transition-colors w-64 shadow-xs"
        >
          <MagnifyingGlass size={16} className="text-ag-ink-3" />
          <span className="flex-1 text-left">Search records...</span>
          <kbd className="bg-ag-surface px-1.5 py-0.5 rounded text-[10px] font-mono border border-ag-border text-ag-ink-3 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Help Icon */}
        <button
          title="Help & Documentation"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-ag-ink-2 hover:bg-ag-surface-2 transition-colors border border-transparent hover:border-ag-border"
        >
          <Question size={18} />
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => setNotificationDrawerOpen(true)}
          title="Notifications"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-ag-ink-2 hover:bg-ag-surface-2 transition-colors relative border border-transparent hover:border-ag-border"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="ag-notif-badge">{unreadCount}</span>
          )}
        </button>

        <div className="h-5 w-px bg-ag-border" />

        {/* Profile Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-ag-surface-2 transition-colors outline-none cursor-pointer">
              <Avatar name={user?.fullName || 'User'} src={user?.photo} size="sm" />
              <span className="text-xs font-bold text-ag-ink hidden md:inline-block">{user?.fullName}</span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="w-56 bg-ag-surface rounded-xl border border-ag-border shadow-modal p-1.5 z-50 animate-scale-in"
            >
              <div className="px-3 py-2 border-b border-ag-border mb-1">
                <p className="text-xs font-bold text-ag-ink">{user?.fullName}</p>
                <p className="text-[11px] text-ag-ink-3 truncate">{user?.email}</p>
              </div>
              <DropdownMenu.Item
                onClick={() => navigate(`/employees/${user?.employeeId}`)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ag-ink-2 hover:text-ag-ink hover:bg-ag-surface-2 rounded-lg cursor-pointer outline-none transition-colors"
              >
                <User size={16} />
                <span>My Profile</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ag-ink-2 hover:text-ag-ink hover:bg-ag-surface-2 rounded-lg cursor-pointer outline-none transition-colors"
              >
                <Gear size={16} />
                <span>Settings</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-ag-border my-1" />
              <DropdownMenu.Item
                onClick={logout}
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
