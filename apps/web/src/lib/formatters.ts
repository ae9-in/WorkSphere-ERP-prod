// ─────────────────────────────────────────────
// Formatters — dates, currency, numbers, duration
// ─────────────────────────────────────────────

import { format, formatDistanceToNow, differenceInMonths, differenceInYears, parseISO, isValid } from 'date-fns';

// ── Currency ──────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = 'INR',
  compact = false
): string {
  if (compact) {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
    if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)}L`;
    if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ── Dates ─────────────────────────────────────

export function formatDate(date: string | Date | undefined, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, fmt);
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | Date | undefined): string {
  return formatDate(date, 'dd MMM yyyy, hh:mm a');
}

export function formatRelative(date: string | Date | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

export function formatMonthYear(date: string | Date | undefined): string {
  return formatDate(date, 'MMMM yyyy');
}

// ── Tenure / Duration ─────────────────────────

export function formatTenure(dateOfJoining: string | undefined): string {
  if (!dateOfJoining) return '—';
  try {
    const doj = parseISO(dateOfJoining);
    const now = new Date();
    const years = differenceInYears(now, doj);
    const months = differenceInMonths(now, doj) % 12;

    if (years === 0) return `${months}m`;
    if (months === 0) return `${years}y`;
    return `${years}y ${months}m`;
  } catch {
    return '—';
  }
}

export function formatDuration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`;
  if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`;
  return `${y}y ${m}m`;
}

// ── Names ─────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
}

export function formatName(firstName: string, lastName: string, middleName?: string): string {
  return [firstName, middleName, lastName].filter(Boolean).join(' ');
}

// ── Employee ID ───────────────────────────────

export function formatEmployeeId(id: string): string {
  return id.toUpperCase();
}

// ── Status Labels ─────────────────────────────

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active:         'Active',
  inactive:       'Inactive',
  on_leave:       'On Leave',
  notice_period:  'Notice Period',
  resigned:       'Resigned',
  terminated:     'Terminated',
  retired:        'Retired',
  absconding:     'Absconding',
};

export const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  full_time:   'Full Time',
  part_time:   'Part Time',
  contract:    'Contract',
  intern:      'Intern',
  consultant:  'Consultant',
  probation:   'Probation',
};

export const WORK_MODE_LABELS: Record<string, string> = {
  onsite: 'Onsite',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

// ── File size ─────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ── Phone ─────────────────────────────────────

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

// ── CTC breakdown ─────────────────────────────

export function ctcBreakdown(ctc: number, basicPercent = 40) {
  const monthly = Math.round(ctc / 12);
  const basic   = Math.round(monthly * basicPercent / 100);
  const hra     = Math.round(basic * 0.5);
  const special = monthly - basic - hra;
  return {
    annual: { ctc, basic: basic * 12, hra: hra * 12, special: special * 12 },
    monthly: { gross: monthly, basic, hra, special },
  };
}
