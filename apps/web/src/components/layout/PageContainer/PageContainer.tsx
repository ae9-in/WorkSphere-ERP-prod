import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children:   React.ReactNode;
  title?:     string;
  subtitle?:  string;
  actions?:   React.ReactNode;
  className?: string;
}

export function PageContainer({ children, title, subtitle, actions, className }: PageContainerProps) {
  return (
    <div className={cn('ag-page', className)}>
      {(title || actions) && (
        <div className="ag-section-header">
          <div>
            {title && <h1 className="ag-section-title">{title}</h1>}
            {subtitle && <p className="ag-section-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
