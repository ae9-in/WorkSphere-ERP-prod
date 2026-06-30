import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AuthUser } from '@/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser:         (user: AuthUser) => void;
  setAccessToken:  (token: string) => void;
  setLoading:      (loading: boolean) => void;
  logout:          () => void;
  updateUser:      (partial: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,
      isLoading:       false,

      setUser: (user) => set((state) => {
        state.user            = user;
        state.isAuthenticated = true;
        state.isLoading       = false;
      }),

      setAccessToken: (token) => set((state) => {
        state.accessToken = token;
      }),

      setLoading: (loading) => set((state) => {
        state.isLoading = loading;
      }),

      logout: () => set((state) => {
        state.user            = null;
        state.accessToken     = null;
        state.isAuthenticated = false;
        state.isLoading       = false;
      }),

      updateUser: (partial) => set((state) => {
        if (state.user) {
          Object.assign(state.user, partial);
        }
      }),
    })),
    {
      name:    'ag-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken:     state.accessToken,
      }),
    }
  )
);
