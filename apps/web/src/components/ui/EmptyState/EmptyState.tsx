import React from 'react';
import { FolderOpen } from '@phosphor-icons/react';
import { Button } from '../Button/Button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title:        string;
  subtitle:     string;
  icon?:        React.ReactNode;
  actionLabel?: string;
  onAction?:    () => void;
  className?:   string;
}

export function EmptyState({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('ag-empty-state', className)}>
      <div className="w-16 h-16 rounded-2xl bg-ag-primary-light text-ag-primary flex items-center justify-center mb-2 shadow-sm">
        {icon || <FolderOpen size={32} weight="duotone" />}
      </div>
      <h3 className="ag-empty-state__title">{title}</h3>
      <p className="ag-empty-state__subtitle">{subtitle}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
