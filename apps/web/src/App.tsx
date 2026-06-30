import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AppRouter } from './router/AppRouter';
import { Toaster } from 'sonner';
import './styles/globals.css';
import './styles/animations.css';
import './styles/print.css';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
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

export default App;
