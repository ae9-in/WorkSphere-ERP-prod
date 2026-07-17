import { useState, useEffect } from 'react';

const breakpoints = {
  xs:  360,
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  '2xl': 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Returns reactive breakpoint booleans matching the Tailwind `screens` config.
 *
 * Usage:
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useBreakpoint();
 * ```
 */
export function useBreakpoint() {
  const isXs      = useMediaQuery(`(min-width: ${breakpoints.xs}px)`);
  const isSm      = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);
  const isMd      = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isLg      = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isXl      = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);
  const is2xl     = useMediaQuery(`(min-width: ${breakpoints['2xl']}px)`);

  return {
    /** xs ≥ 360px */
    isXs,
    /** sm ≥ 640px */
    isSm,
    /** md ≥ 768px — tablet portrait and up */
    isMd,
    /** lg ≥ 1024px — desktop and up */
    isLg,
    /** xl ≥ 1280px */
    isXl,
    /** 2xl ≥ 1536px */
    is2xl,

    // Semantic aliases
    /** < 768px (phones) */
    isMobile:  !isMd,
    /** 768px–1023px (tablets) */
    isTablet:   isMd && !isLg,
    /** ≥ 1024px (laptops, desktops) */
    isDesktop:  isLg,
    /** ≥ 1280px (large desktop) */
    isLargeDesktop: isXl,

    // Current active breakpoint label
    current: (() => {
      if (is2xl) return '2xl';
      if (isXl)  return 'xl';
      if (isLg)  return 'lg';
      if (isMd)  return 'md';
      if (isSm)  return 'sm';
      if (isXs)  return 'xs';
      return 'xxs';
    })() as Breakpoint | 'xxs',
  };
}
