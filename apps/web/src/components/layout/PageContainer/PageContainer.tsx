import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children:   React.ReactNode;
  title?:     string;
  subtitle?:  string;
  actions?:   React.ReactNode;
  className?: string;
  /** Removes max-width cap for very wide tables/dashboards */
  fullWidth?: boolean;
}

export function PageContainer({ children, title, subtitle, actions, className, fullWidth }: PageContainerProps) {
  return (
    <div className={cn('ag-page', fullWidth && 'max-w-none', className)}>
      {(title || actions) && (
        <div className="ag-section-header">
          <div className="min-w-0">
            {title && <h1 className="ag-section-title">{title}</h1>}
            {subtitle && <p className="ag-section-subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
