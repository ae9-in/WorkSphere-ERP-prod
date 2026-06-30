// ─────────────────────────────────────────────
// App-wide constants
// ─────────────────────────────────────────────

export const APP_NAME = 'WorkSphere ERP';
export const APP_TAGLINE = 'Work Without Weight.';
export const APP_VERSION = '1.0.0';

export const DEFAULT_PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 300;
export const TOAST_DURATION_MS = 4000;
export const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

export const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com';

export const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'Finance', 'Human Resources', 'Operations', 'Legal', 'IT',
  'Customer Success', 'Data Science', 'Security', 'Administration',
] as const;

export const LOCATIONS = [
  'Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'Pune',
  'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Remote',
] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
] as const;

export const TAX_REGIMES = [
  { value: 'new', label: 'New Tax Regime' },
  { value: 'old', label: 'Old Tax Regime' },
] as const;

export const DOCUMENT_TYPES = [
  'offer_letter', 'joining_letter', 'appointment_letter',
  'increment_letter', 'promotion_letter', 'relieving_letter',
  'experience_letter', 'noc', 'id_card', 'other',
] as const;

export const PAYROLL_COMPONENTS = {
  earnings: [
    'Basic Salary', 'HRA', 'Special Allowance', 'Conveyance Allowance',
    'Medical Allowance', 'LTA', 'Performance Bonus', 'Overtime',
    'Arrears', 'Joining Bonus', 'Retention Bonus',
  ],
  deductions: [
    'PF Employee', 'ESI Employee', 'Professional Tax',
    'TDS', 'Loan EMI', 'Advance Recovery', 'LOP Deduction',
  ],
} as const;

// Color maps for charts (using AG palette)
export const CHART_COLORS = [
  '#5B3CF5', '#00C48C', '#FFB020', '#2BB5FF',
  '#FF4C8B', '#3D3BF3', '#FF5F57', '#8E88A8',
];

// Nav routes
export const ROUTES = {
  LOGIN:               '/login',
  FORGOT_PASSWORD:     '/forgot-password',
  MFA:                 '/mfa',
  DASHBOARD:           '/',
  EMPLOYEES:           '/employees',
  EMPLOYEE_CREATE:     '/employees/new',
  EMPLOYEE_PROFILE:    '/employees/:id',
  ONBOARDING:          '/onboarding',
  ONBOARDING_DETAIL:   '/onboarding/:id',
  OFFBOARDING:         '/offboarding',
  OFFBOARDING_DETAIL:  '/offboarding/:id',
  PAYROLL:             '/payroll',
  PAYROLL_RUN:         '/payroll/runs',
  PAYROLL_RUN_DETAIL:  '/payroll/runs/:id',
  SALARY_STRUCTURES:   '/payroll/structures',
  PAYSLIPS:            '/payroll/payslips',
  ATTENDANCE:          '/attendance',
  ATTENDANCE_LOG:      '/attendance/log',
  REGULARIZATION:      '/attendance/regularization',
  SHIFTS:              '/attendance/shifts',
  REPORTS:             '/reports',
  APPROVALS:           '/approvals',
  NOTIFICATIONS:       '/notifications',
  AUDIT_LOGS:          '/audit',
  SETTINGS:            '/settings',
  SETTINGS_COMPANY:    '/settings/company',
  SETTINGS_ROLES:      '/settings/roles',
  SETTINGS_WORKFLOWS:  '/settings/workflows',
} as const;
