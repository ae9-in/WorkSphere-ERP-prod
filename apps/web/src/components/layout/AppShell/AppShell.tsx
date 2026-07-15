import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { TopNavbar } from '../TopNavbar/TopNavbar';
import { GlobalSearch } from '@/components/shared/GlobalSearch/GlobalSearch';
import { NotificationCenter } from '@/components/shared/NotificationCenter/NotificationCenter';
import { useUIStore } from '@/store/uiStore';
import { motion } from 'framer-motion';

export function AppShell() {
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);
  const sidebarWidth = useUIStore(s => s.sidebarWidth);
  const widthVal = sidebarCollapsed ? 72 : sidebarWidth;

  return (
    <div className="min-h-screen bg-ag-canvas flex flex-col">
      <Sidebar />
      <div
        style={{ paddingLeft: `${widthVal}px` }}
        className="flex-1 flex flex-col min-w-0 min-h-screen transition-[padding] duration-200 ease-in-out"
      >
        <TopNavbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearch />
      <NotificationCenter />
    </div>
  );
}
