import React, { useRef, useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  description?: string;
  colorType: 'violet' | 'sky' | 'emerald' | 'indigo';
}

const colorConfig = {
  violet: {
    brandColor: '#5B3CF5',
    iconBg: 'bg-[#EDE8FF] text-[#5B3CF5] border-[#5B3CF5]/10',
    hoverBorder: 'hover:border-[#5B3CF5]',
    focusRing: 'focus-visible:ring-[#5B3CF5]',
    spotlightColor: 'rgba(91, 60, 245, 0.14)',
    cardBg: 'bg-gradient-to-br from-white via-white to-[#F8F6FF]',
  },
  sky: {
    brandColor: '#2BB5FF',
    iconBg: 'bg-[#EAF8FF] text-[#2BB5FF] border-[#2BB5FF]/10',
    hoverBorder: 'hover:border-[#2BB5FF]',
    focusRing: 'focus-visible:ring-[#2BB5FF]',
    spotlightColor: 'rgba(43, 181, 255, 0.14)',
    cardBg: 'bg-gradient-to-br from-white via-white to-[#F2FAFF]',
  },
  emerald: {
    brandColor: '#00C48C',
    iconBg: 'bg-[#E6FAF4] text-[#00C48C] border-[#00C48C]/10',
    hoverBorder: 'hover:border-[#00C48C]',
    focusRing: 'focus-visible:ring-[#00C48C]',
    spotlightColor: 'rgba(0, 196, 140, 0.14)',
    cardBg: 'bg-gradient-to-br from-white via-white to-[#F2FFF9]',
  },
  indigo: {
    brandColor: '#3D3BF3',
    iconBg: 'bg-[#EFEFFF] text-[#3D3BF3] border-[#3D3BF3]/10',
    hoverBorder: 'hover:border-[#3D3BF3]',
    focusRing: 'focus-visible:ring-[#3D3BF3]',
    spotlightColor: 'rgba(61, 59, 243, 0.14)',
    cardBg: 'bg-gradient-to-br from-white via-white to-[#F4F4FF]',
  },
};

export function StatCard({
  label,
  value,
  suffix = '',
  prefix = '',
  icon,
  description,
  colorType,
}: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Clean up ripples
  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples(prev => prev.slice(1));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  const config = colorConfig[colorType] || colorConfig.violet;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    // Subtle 3D tilt: max 4 degrees rotation
    const maxTilt = 4;
    const tiltX = -((y - rect.height / 2) / (rect.height / 2)) * maxTilt;
    const tiltY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples(prev => [...prev, { x, y, id: Date.now() }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setRipples(prev => [...prev, { x: rect.width / 2, y: rect.height / 2, id: Date.now() }]);
      }
    }
  };

  // Determine container styles dynamically to handle smooth transitions
  const cardTransform = isHovered && !prefersReducedMotion
    ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-6px)`
    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';

  const spotlightStyle = isHovered && !prefersReducedMotion
    ? { background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, ${config.spotlightColor}, transparent 80%)` }
    : undefined;

  const dynamicStyle: React.CSSProperties = {
    transform: cardTransform,
    borderColor: isHovered ? config.brandColor : '#E4DFFF',
    boxShadow: isHovered
      ? `0 12px 24px -10px rgba(0, 0, 0, 0.04), 0 20px 40px -15px ${config.brandColor}22, inset 0 0 0 1px ${config.brandColor}1F`
      : '0 1px 3px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.01), inset 0 0 0 1px rgba(0, 0, 0, 0.01)',
    transition: isHovered
      ? 'transform 100ms cubic-bezier(0.25, 1, 0.5, 1), border-color 300ms ease, box-shadow 300ms ease, background-color 300ms ease'
      : 'transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease, background-color 300ms ease',
  };

  return (
    <div
      ref={cardRef}
      role="status"
      aria-label={`${label} metric: ${prefix}${value}${suffix}`}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative overflow-hidden rounded-[24px] border p-6 cursor-pointer select-none',
        'outline-none',
        'active:scale-[0.98]',
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        'h-full flex flex-col justify-between',
        config.cardBg,
        config.focusRing
      )}
      style={dynamicStyle}
    >
      {/* Dynamic spotlight layer */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={spotlightStyle}
        />
      )}

      {/* Glass-like sweep sheen */}
      {!prefersReducedMotion && <div className="glass-shine" />}

      {/* Click ripple layer */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            backgroundColor: config.brandColor,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Top Left: Premium icon container */}
      <div
        className={cn(
          'p-2.5 w-fit rounded-full flex items-center justify-center border transition-all duration-300',
          'group-hover:rotate-[12deg] group-hover:scale-110',
          config.iconBg
        )}
      >
        {icon}
      </div>

      {/* Bottom Center Content */}
      <div className="mt-6 flex flex-col">
        {/* Large statistic */}
        <h4 className="font-display font-extrabold text-3xl md:text-4xl text-[#1A1433] tracking-tight transition-transform duration-300 group-hover:scale-[1.03] origin-left select-text">
          {prefix}
          <CountUp
            end={value}
            duration={2.2}
            separator=","
            decimals={value % 1 !== 0 ? 2 : 0}
            enableScrollSpy
            scrollSpyOnce
          />
          {suffix}
        </h4>

        {/* Small uppercase label */}
        <p className="text-[10px] text-ag-ink-3 mt-1.5 uppercase font-extrabold tracking-widest leading-none">
          {label}
        </p>

        {/* Secondary description */}
        {description && (
          <span className="text-[11px] text-ag-ink-3/80 font-medium leading-normal mt-1.5 opacity-85 block">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
