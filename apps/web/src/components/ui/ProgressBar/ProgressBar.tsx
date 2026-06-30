import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value:      number; // 0 to 100
  max?:       number;
  className?: string;
  showLabel?: boolean;
  color?:     string;
}

export function ProgressBar({ value, max = 100, className, showLabel = false, color }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full flex flex-col gap-1.5">
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold text-ag-ink-2">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('ag-progress-bar', className)}>
        <div
          className="ag-progress-bar__fill"
          style={{
            width: `${percentage}%`,
            background: color || undefined,
          }}
        />
      </div>
    </div>
  );
}
