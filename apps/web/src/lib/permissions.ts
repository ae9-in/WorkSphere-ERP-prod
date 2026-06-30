// ─────────────────────────────────────────────
// RBAC Permission Helpers
// ─────────────────────────────────────────────

import { UserRole } from '@/types/auth.types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*:*'],

  company_admin: [
    'employee:*', 'onboarding:*', 'offboarding:*',
    'payroll:*', 'attendance:*', 'reports:*',
    'settings:*', 'audit:read', 'workflow:*', 'documents:*',
  ],

  hr_head: [
    'employee:*', 'onboarding:*', 'offboarding:*',
    'payroll:read', 'payroll:approve',
    'attendance:*', 'reports:*',
    'documents:*', 'workflow:read', 'workflow:approve',
  ],

  hr_executive: [
    'employee:read', 'employee:write',
    'onboarding:read', 'onboarding:write',
    'offboarding:read', 'offboarding:write',
    'attendance:read', 'attendance:write',
    'documents:read', 'documents:write',
    'reports:read',
  ],

  payroll_manager: [
    'payroll:*', 'employee:read',
    'attendance:read', 'reports:read', 'reports:export',
  ],

  department_manager: [
    'employee:read',
    'attendance:read', 'attendance:approve',
    'onboarding:read', 'offboarding:read',
    'reports:read',
  ],

  reporting_manager: [
    'employee:read', 'attendance:read',
    'attendance:approve', 'reports:read',
  ],

  employee: [
    'employee:read_self', 'attendance:read_self',
    'payroll:read_self', 'documents:read_self',
  ],

  auditor: ['audit:read', 'reports:read', 'reports:export'],
  finance: ['payroll:read', 'payroll:export', 'reports:read'],
  it_admin: ['settings:*', 'audit:read'],
  guest:    ['employee:read'],
};

export function hasPermission(permissions: string[], permission: string): boolean {
  if (!permissions || permissions.length === 0) return false;

  // Wildcard super admin
  if (permissions.includes('*:*')) return true;

  // Exact match
  if (permissions.includes(permission)) return true;

  // Resource wildcard (e.g. 'employee:*' covers 'employee:write')
  const [resource] = permission.split(':');
  if (permissions.includes(`${resource}:*`)) return true;

  return false;
}

export function getPermissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.guest;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:        'Super Admin',
  company_admin:      'Company Admin',
  hr_head:            'HR Head',
  hr_executive:       'HR Executive',
  payroll_manager:    'Payroll Manager',
  department_manager: 'Department Manager',
  reporting_manager:  'Reporting Manager',
  employee:           'Employee',
  auditor:            'Auditor',
  finance:            'Finance',
  it_admin:           'IT Admin',
  guest:              'Guest',
};
