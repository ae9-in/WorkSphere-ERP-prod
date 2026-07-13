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
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id={indigoGradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
              </linearGradient>
            </>
          ) : isDark ? (
            <>
              <linearGradient id={purpleGradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
              <linearGradient id={indigoGradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </>
          ) : (
            <>
              {/* Default Gradient Palette matching the uploaded logo: Vibrant Violet-Indigo and Deep Navy */}
              <linearGradient id={purpleGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8A7DFF" />
                <stop offset="100%" stopColor="#5B3CF5" />
              </linearGradient>
              <linearGradient id={indigoGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#434599" />
                <stop offset="100%" stopColor="#1E1F4B" />
              </linearGradient>
            </>
          )}
        </defs>

        {/* 
          Tracing the intertwined "WS" Monogram geometry:
          - A central "W" with wings/arrowheads on outer peaks
          - Left sweeping curve wrapping down (representing the 'S' transition on the left)
          - Right sweeping curve wrapping up (representing the 'S' transition on the right)
        */}
        
        {/* Left/Bottom segment (Purple/Violet Gradient) */}
        <path
          d="M 50 48 L 38 67 L 27 50 L 37 32 M 50 48 L 50 30 L 37 12 L 25 30 L 25 43 L 13 25"
          stroke={`url(#${purpleGradId})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 27 50 C 12 55 12 75 32 75 C 47 75 50 63 50 48"
          stroke={`url(#${purpleGradId})`}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Right/Top segment (Dark Indigo Gradient) */}
        <path
          d="M 50 48 L 62 67 L 73 50 L 63 32 M 50 48 L 50 30 L 63 12 L 75 30 L 75 43 L 87 25"
          stroke={`url(#${indigoGradId})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 73 50 C 88 45 88 25 68 25 C 53 25 50 37 50 48"
          stroke={`url(#${indigoGradId})`}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
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
