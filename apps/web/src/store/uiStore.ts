import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  sidebarCollapsed:     boolean;
  sidebarMobileOpen:    boolean;
  globalSearchOpen:     boolean;
  notificationDrawerOpen: boolean;
  sidebarWidth:         number;

  toggleSidebar:            () => void;
  setSidebarCollapsed:      (v: boolean) => void;
  setSidebarMobileOpen:     (v: boolean) => void;
  setGlobalSearchOpen:      (v: boolean) => void;
  setNotificationDrawerOpen:(v: boolean) => void;
  setSidebarWidth:          (w: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set) => ({
      sidebarCollapsed:      false,
      sidebarMobileOpen:     false,
      globalSearchOpen:      false,
      notificationDrawerOpen: false,
      sidebarWidth:          320,

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

      setSidebarWidth: (w) => set((state) => {
        state.sidebarWidth = w;
      }),
    })),
    {
      name:    'ag-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth:     state.sidebarWidth,
      }),
    }
  )
);
