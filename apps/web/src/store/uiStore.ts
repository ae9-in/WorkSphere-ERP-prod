import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  sidebarCollapsed:     boolean;
  sidebarMobileOpen:    boolean;
  globalSearchOpen:     boolean;
  notificationDrawerOpen: boolean;

  toggleSidebar:            () => void;
  setSidebarCollapsed:      (v: boolean) => void;
  setSidebarMobileOpen:     (v: boolean) => void;
  setGlobalSearchOpen:      (v: boolean) => void;
  setNotificationDrawerOpen:(v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set) => ({
      sidebarCollapsed:      false,
      sidebarMobileOpen:     false,
      globalSearchOpen:      false,
      notificationDrawerOpen: false,

      toggleSidebar: () => set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }),

      setSidebarCollapsed: (v) => set((state) => {
        state.sidebarCollapsed = v;
      }),

      setSidebarMobileOpen: (v) => set((state) => {
        state.sidebarMobileOpen = v;
      }),

      setGlobalSearchOpen: (v) => set((state) => {
        state.globalSearchOpen = v;
      }),

      setNotificationDrawerOpen: (v) => set((state) => {
        state.notificationDrawerOpen = v;
      }),
    })),
    {
      name:    'ag-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
