import React from 'react';
import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import '../styles/animations.css';
import '../styles/print.css';

export const metadata: Metadata = {
  title: 'WorkSphere ERP | Enterprise Workspace Solutions',
  description: 'AI-Powered unified enterprise management system for human resources, payroll, attendance, leave, workflows, and assets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased text-ag-ink bg-ag-canvas min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
