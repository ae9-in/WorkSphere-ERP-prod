import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { routes } from './routes';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isLoading       = useAuthStore(s => s.isLoading);
  const location        = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ag-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-ag-primary flex items-center justify-center animate-pulse-soft">
            <span className="text-white font-display font-bold text-lg">WS</span>
          </div>
          <p className="text-ag-ink-3 text-sm animate-pulse-soft">Loading WorkSphere ERP…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={routes.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
