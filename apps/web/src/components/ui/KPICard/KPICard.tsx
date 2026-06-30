import React from 'react';
import { Card } from '../Card/Card';
import { TrendUp, TrendDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';

interface KPICardProps {
  title:       string;
  value:       number | string;
  subtext?:    string;
  trend?:      { value: number; label: string; isPositive: boolean };
  icon?:       React.ReactNode;
  iconBg?:     string;
  className?:  string;
  formatter?:  (val: any) => string;
}

export function KPICard({
  title,
  value,
  subtext,
  trend,
  icon,
  iconBg = 'bg-ag-primary-light text-ag-primary',
  className,
  formatter,
}: KPICardProps) {
  const formattedValue = typeof value === 'number'
    ? (formatter ? formatter(value) : formatNumber(value))
    : value;

  return (
    <Card hover className={cn('flex flex-col justify-between h-full', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-ag-ink-3 uppercase tracking-wider block mb-1">
            {title}
          </span>
          <div className="ag-kpi-number text-3xl font-extrabold font-display text-ag-ink tracking-tight mt-1">
            {formattedValue}
          </div>
        </div>
        {icon && (
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
            {icon}
          </div>
        )}
      </div>

      {(trend || subtext) && (
        <div className="flex items-center gap-2 mt-4 text-xs font-medium pt-3 border-t border-ag-border/60">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md',
                trend.isPositive ? 'bg-[#E6FAF4] text-ag-mint' : 'bg-[#FFF0EF] text-ag-coral'
              )}
            >
              {trend.isPositive ? <TrendUp size={14} weight="bold" /> : <TrendDown size={14} weight="bold" />}
              {trend.value}%
            </span>
          )}
          <span className="text-ag-ink-3 truncate">{trend ? trend.label : subtext}</span>
        </div>
      )}
    </Card>
  );
}
