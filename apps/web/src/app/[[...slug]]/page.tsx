'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the main App component with SSR disabled to prevent hydration mismatches with react-router-dom
const App = dynamic(() => import('../../App'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-ag-canvas">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-ag-ink-3 text-sm">Initializing WorkSphere...</span>
      </div>
    </div>
  )
});

export default function CatchAllPage() {
  return <App />;
}
