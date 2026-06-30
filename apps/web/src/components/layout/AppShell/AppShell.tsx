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

  return (
    <div className="min-h-screen bg-ag-canvas flex flex-col">
      <Sidebar />
      <motion.div
        animate={{ paddingLeft: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-1 flex flex-col min-w-0 min-h-screen"
      >
        <TopNavbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </motion.div>

      {/* Global Modals & Drawers */}
      <GlobalSearch />
      <NotificationCenter />
    </div>
  );
}
