import React from 'react';
import { cn } from '@/lib/utils';
import type { EmployeeStatus } from '@/types/employee.types';
import type { PayrollStatus } from '@/types/payroll.types';

// ── Generic Badge ─────────────────────────────

interface BadgeProps {
  children:   React.ReactNode;
  variant?:   'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  size?:      'sm' | 'md';
  dot?:       boolean;
  className?: string;
}

const badgeVariantClasses = {
  default: 'bg-ag-surface-2 text-ag-ink-2',
  primary: 'bg-ag-primary-light text-ag-primary',
  success: 'bg-[#E6FAF4] text-[#00875A]',
  warning: 'bg-[#FFF8E6] text-[#946000]',
  danger:  'bg-[#FFF0EF] text-[#D93025]',
  info:    'bg-[#E8F6FF] text-[#0077B6]',
  muted:   'bg-[#F0F0F5] text-[#5E5A72]',
};

const badgeSizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function Badge({ children, variant = 'default', size = 'md', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill font-semibold font-body',
        badgeVariantClasses[variant],
        badgeSizeClasses[size],
        className
      )}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          variant === 'success' ? 'bg-[#00875A]' :
          variant === 'warning' ? 'bg-[#946000]' :
          variant === 'danger'  ? 'bg-[#D93025]' :
          variant === 'primary' ? 'bg-ag-primary' :
          variant === 'info'    ? 'bg-[#0077B6]'  :
          'bg-ag-ink-3'
        )} />
      )}
      {children}
    </span>
  );
}

// ── Status Badge — Employee ───────────────────

const EMPLOYEE_STATUS_BADGE: Record<EmployeeStatus, { variant: BadgeProps['variant']; label: string }> = {
  active:        { variant: 'success', label: 'Active' },
  inactive:      { variant: 'muted',   label: 'Inactive' },
  on_leave:      { variant: 'warning', label: 'On Leave' },
  notice_period: { variant: 'warning', label: 'Notice Period' },
  resigned:      { variant: 'danger',  label: 'Resigned' },
  terminated:    { variant: 'danger',  label: 'Terminated' },
  retired:       { variant: 'muted',   label: 'Retired' },
  absconding:    { variant: 'danger',  label: 'Absconding' },
};

interface StatusBadgeProps {
  status: EmployeeStatus | PayrollStatus | string;
  size?:  'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = EMPLOYEE_STATUS_BADGE[status as EmployeeStatus];

  if (config) {
    return (
      <Badge variant={config.variant} size={size} dot>
        {config.label}
      </Badge>
    );
  }

  // Payroll statuses
  const payrollMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    draft:      { variant: 'muted',   label: 'Draft' },
    processing: { variant: 'primary', label: 'Processing' },
    completed:  { variant: 'info',    label: 'Completed' },
    approved:   { variant: 'success', label: 'Approved' },
    paid:       { variant: 'success', label: 'Paid' },
    cancelled:  { variant: 'danger',  label: 'Cancelled' },
  };

  const pConfig = payrollMap[status];
  if (pConfig) {
    return <Badge variant={pConfig.variant} size={size} dot>{pConfig.label}</Badge>;
  }

  // Fallback
  return <Badge variant="default" size={size}>{status}</Badge>;
}

// ── Work Mode Badge ───────────────────────────

export function WorkModeBadge({ mode }: { mode: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    onsite: { variant: 'primary', label: '🏢 Onsite' },
    remote: { variant: 'success', label: '🏠 Remote' },
    hybrid: { variant: 'info',    label: '⚡ Hybrid' },
  };
  const config = map[mode] ?? { variant: 'default', label: mode };
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}
