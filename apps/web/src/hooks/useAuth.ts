import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api.service';
import { useCallback } from 'react';
import { toast } from 'sonner';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setAccessToken, logout: storeLogout } = useAuthStore();

  const login = useCallback(async (email: string, password: string, portal?: 'super_admin' | 'tenant_admin' | 'employee') => {
    try {
      const { user, accessToken } = await authService.login(email, password, portal);
      setUser(user);
      setAccessToken(accessToken);
      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [setUser, setAccessToken]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      storeLogout();
      window.location.href = '/login';
    }
  }, [storeLogout]);

  return { user, isAuthenticated, isLoading, login, logout };
}
