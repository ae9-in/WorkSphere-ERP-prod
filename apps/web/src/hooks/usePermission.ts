import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { useCallback } from 'react';

export function usePermission() {
  const permissions = useAuthStore(state => state.user?.permissions ?? []);
  const role        = useAuthStore(state => state.user?.role);

  const can = useCallback((permission: string): boolean => {
    return hasPermission(permissions, permission);
  }, [permissions]);

  const canAny = useCallback((...perms: string[]): boolean => {
    return perms.some(p => hasPermission(permissions, p));
  }, [permissions]);

  const canAll = useCallback((...perms: string[]): boolean => {
    return perms.every(p => hasPermission(permissions, p));
  }, [permissions]);

  return { can, canAny, canAll, permissions, role };
}
