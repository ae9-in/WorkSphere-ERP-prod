import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CardProps {
  children:   React.ReactNode;
  className?: string;
  hover?:     boolean;
  padding?:   'none' | 'sm' | 'md' | 'lg';
  onClick?:   () => void;
  id?:        string;
}

const paddingMap = {
  none: 'p-0',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export function Card({ children, className, hover = false, padding = 'md', onClick, id }: CardProps) {
  const Tag = onClick ? motion.div : 'div';

  return (
    <Tag
      id={id}
      onClick={onClick}
      className={cn(
        'bg-ag-surface border border-ag-border rounded-lg shadow-card',
        paddingMap[padding],
        hover && 'transition-all duration-200 cursor-pointer hover:border-ag-border-strong hover:shadow-hover hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
      {...(onClick ? { whileTap: { scale: 0.99 } } : {})}
    >
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-5', className)}>
      <div>
        <h3 className="font-display font-700 text-lg text-ag-ink leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-ag-ink-3 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

export function CardDivider() {
  return <hr className="border-t border-ag-border my-5" />;
}
