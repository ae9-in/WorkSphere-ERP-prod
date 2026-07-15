import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  variant?: 'color' | 'white' | 'dark';
  textClassName?: string;
}

export function Logo({
  className,
  size = 36,
  showText = true,
  variant = 'color',
  textClassName,
}: LogoProps) {
  // Color configuration based on variants
  const isWhite = variant === 'white';
  const isDark = variant === 'dark';



  return (
    <div className={cn('inline-flex items-center gap-1.5 select-none', className)} >
      {/* Logo Image from Public Folder */}
      <img
        src="/logo/logo_main.png"
        alt="WorkSphere Logo"
        className="flex-shrink-0 object-contain"
        style={{
          width: typeof size === 'number' ? size * 1.35 : `calc(${size} * 1.35)`,
          height: typeof size === 'number' ? size * 1.35 : `calc(${size} * 1.35)`,
          filter: isWhite ? 'brightness(0) invert(1)' : isDark ? 'brightness(0)' : 'none'
        }}
      />

      {/* Rebranding Wordmark Text */}
      {showText && (
        <span
          className={cn(
            'font-display font-extrabold text-xl tracking-tight select-none flex items-center',
            isWhite ? 'text-white' : isDark ? 'text-slate-900' : 'text-slate-900',
            textClassName
          )}
        >
          <span className={cn(isWhite ? 'text-white' : isDark ? 'text-slate-700' : 'text-[#6D5DFC]')}>
            Work
          </span>
          <span className={cn(isWhite ? 'text-white/90' : isDark ? 'text-slate-900' : 'text-[#1E1F4B]')}>
            Sphere
          </span>
        </span>
      )}
    </div>
  );
}

export default Logo;
