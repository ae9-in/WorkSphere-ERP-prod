import React from 'react';
import { cn, getAvatarColor } from '@/lib/utils';
import { getInitials } from '@/lib/formatters';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

interface AvatarProps {
  src?:       string;
  name:       string;
  size?:      'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor  = getAvatarColor(name);

  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full select-none flex-shrink-0',
        sizeClasses[size],
        className
      )}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={name}
        className="h-full w-full object-cover rounded-full"
      />
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center font-display font-bold text-white uppercase"
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
