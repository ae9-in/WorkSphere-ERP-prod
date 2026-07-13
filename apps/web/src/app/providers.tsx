'use client';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Create a single client-side queryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <>{children}</>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1433',
            color: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #3D3BF3',
          },
        }}
      />
    </QueryClientProvider>
  );
}
