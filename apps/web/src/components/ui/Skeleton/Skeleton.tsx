import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?:     string | number;
  height?:    string | number;
  circle?:    boolean;
}

export function Skeleton({ className, width, height, circle = false }: SkeletonProps) {
  const style: React.CSSProperties = {
    width:  width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      style={style}
      className={cn(
        'ag-skeleton',
        circle ? 'rounded-full' : 'rounded-md',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="ag-card flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton circle width={40} height={40} />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <Skeleton height={20} width="100%" />
      <Skeleton height={20} width="80%" />
    </div>
  );
}
