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

  // Gradient IDs to avoid collision if multiple logos exist
  const purpleGradId = `purple-grad-${variant}`;
  const indigoGradId = `indigo-grad-${variant}`;

  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)}>
      {/* WS Intertwined Monogram SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          {isWhite ? (
            <>
              <linearGradient id={purpleGradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
              </linearGradient>
            </>
          ) : isDark ? (
            <>
              <linearGradient id={purpleGradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0F172A" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.05" />
              </linearGradient>
            </>
          ) : (
            <>
              <linearGradient id={purpleGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A88BFF" />
                <stop offset="40%" stopColor="#5B3CF5" />
                <stop offset="100%" stopColor="#1E1F4B" />
              </linearGradient>
              <linearGradient id={indigoGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </>
          )}
        </defs>

        {/* Base Sphere */}
        {isWhite ? (
          <circle cx="50" cy="50" r="46" fill={`url(#${purpleGradId})`} stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.3" />
        ) : isDark ? (
          <circle cx="50" cy="50" r="46" fill={`url(#${purpleGradId})`} stroke="#0F172A" strokeWidth="2" strokeOpacity="0.3" />
        ) : (
          <>
            <circle cx="50" cy="50" r="46" fill={`url(#${purpleGradId})`} />
            <circle cx="50" cy="50" r="46" fill={`url(#${indigoGradId})`} />
          </>
        )}

        {/* W Fusion path */}
        <path
          d="M 28 20 C 18 45 18 72 35 80 C 38 81 41 80 43 76 C 47 60 48 45 50 30 C 52 45 53 60 57 76 C 59 80 62 81 65 80 C 82 72 82 45 72 20 C 68 20 66 22 66 24 C 75 45 74 68 62 72 C 60 72 59 71 58 68 C 54 50 52 42 50 38 C 48 42 46 50 42 68 C 41 71 40 72 38 72 C 26 68 25 45 34 24 C 34 22 32 20 28 20 Z"
          fill={isWhite ? '#FFFFFF' : isDark ? '#0F172A' : '#FFFFFF'}
        />
      </svg>

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
