import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoLoopProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  direction?: 'left' | 'right';
  speedSeconds?: number;
  className?: string;
}

export function LogoLoop<T>({
  items,
  renderItem,
  direction = 'left',
  speedSeconds = 30,
  className,
}: LogoLoopProps<T>) {
  const [isHovered, setIsHovered] = useState(false);

  // Duplicate items twice to ensure it wraps around seamlessly for a 100% smooth loop
  const duplicatedItems = [...items, ...items];

  const animationClass = direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right';

  return (
    <div
      className={cn('relative w-full overflow-hidden select-none py-1', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn('flex w-max gap-6', animationClass)}
        style={{
          animationPlayState: isHovered ? 'paused' : 'running',
          animationDuration: `${speedSeconds}s`,
        }}
      >
        {duplicatedItems.map((item, idx) => (
          <div key={idx} className="flex-shrink-0">
            {renderItem(item, idx)}
          </div>
        ))}
      </div>
    </div>
  );
}
export default LogoLoop;
