import React from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

// ── Types ─────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  icon?:     React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

// ── Variant styles ────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-ag-primary text-white hover:bg-ag-primary-hover border border-transparent',
  secondary: 'bg-ag-primary-light text-ag-primary border border-ag-border-strong hover:bg-[#E0D8FF]',
  ghost:     'bg-transparent text-ag-ink-2 border border-ag-border hover:bg-ag-surface-2 hover:text-ag-ink',
  danger:    'bg-[#FFF0EF] text-ag-coral border border-[#FFD0CE] hover:bg-[#FFE0DE]',
  icon:      'bg-ag-surface-2 text-ag-ink-2 border border-transparent hover:bg-ag-border hover:text-ag-ink',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-11 min-h-[44px] px-3 text-xs gap-1.5',
  md: 'h-11 min-h-[44px] px-6 text-sm gap-2',
  lg: 'h-12 min-h-[44px] px-8 text-base gap-2',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'w-11 h-11 min-w-[44px] min-h-[44px] p-0',
  md: 'w-11 h-11 min-w-[44px] min-h-[44px] p-0',
  lg: 'w-12 h-12 min-w-[44px] min-h-[44px] p-0',
};

// ── Component ─────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, iconRight, children, fullWidth, className, disabled, ...props }, ref) => {
    const isIcon = variant === 'icon';

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
        whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
        transition={{ duration: 0.12 }}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-body font-semibold',
          'rounded-pill transition-all duration-150 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ag-primary focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',

          // Variant
          variantClasses[variant],

          // Size
          isIcon ? iconSizeClasses[size] : sizeClasses[size],

          // Full width
          fullWidth && 'w-full',

          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children && <span>{children}</span>}
            {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
