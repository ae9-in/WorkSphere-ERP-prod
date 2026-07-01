// ─────────────────────────────────────────────
// Route definitions
// ─────────────────────────────────────────────

export const routes = {
  // Public
  LANDING:         '/',
  MODULES:         '/modules/:moduleId',
  COMPANY:         '/company/:sectionId',
  LOGIN:           '/login',
  ADMIN_LOGIN:     '/admin/login',
  EMPLOYEE_LOGIN:  '/employee/login',
  SIGNUP:          '/signup',
  WORKSPACE_SETUP: '/workspace-setup',
  FORGOT_PASSWORD: '/forgot-password',
  MFA:             '/mfa',

  // Dashboard
  ADMIN_DASHBOARD: '/admin/dashboard',
  DASHBOARD: '/dashboard',

  // Employees
  EMPLOYEES:        '/employees',
  EMPLOYEE_CREATE:  '/employees/new',
  EMPLOYEE_PROFILE: '/employees/:id',

  // Onboarding
  ONBOARDING:        '/onboarding',
  ONBOARDING_NEW:     '/onboarding/new',
  ONBOARDING_DETAIL: '/onboarding/:id',

  // Offboarding
  OFFBOARDING:        '/offboarding',
  OFFBOARDING_DETAIL: '/offboarding/:id',

  // Payroll
  PAYROLL:           '/payroll',
  PAYROLL_RUNS:      '/payroll/runs',
  PAYROLL_RUN:       '/payroll/runs/:id',
  SALARY_STRUCTURES: '/payroll/structures',
  PAYSLIPS:          '/payroll/payslips',
  PAYROLL_REPORTS:   '/payroll/reports',

  // Attendance
  ATTENDANCE:       '/attendance',
  ATTENDANCE_LOG:   '/attendance/log',
  REGULARIZATION:   '/attendance/regularization',
  SHIFTS:           '/attendance/shifts',
  HOLIDAYS:         '/attendance/holidays',

  // Reports
  REPORTS: '/reports',

  // Leave Management
  LEAVE:              '/leave',
  LEAVE_APPLY:        '/leave/apply',
  LEAVE_BALANCE:      '/leave/balance',
  LEAVE_HISTORY:      '/leave/history',

  // Documents
  DOCUMENTS:          '/documents',

  // Assets
  ASSETS:             '/assets',

  // Admin
  APPROVALS:      '/approvals',
  NOTIFICATIONS:  '/notifications',
  AUDIT:          '/audit',
  SETTINGS:       '/settings',
  SETTINGS_CO:    '/settings/company',
  SETTINGS_DEPT:  '/settings/departments',
  SETTINGS_DESG:  '/settings/designations',
  SETTINGS_ROLES: '/settings/roles',
  SETTINGS_WF:    '/settings/workflows',
  SETTINGS_EMAIL: '/settings/email-templates',
} as const;

export function buildRoute(route: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (acc, [key, val]) => acc.replace(`:${key}`, val),
    route
  );
}
