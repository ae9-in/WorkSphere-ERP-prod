// ─────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────

export interface JWTPayload {
  sub: string;
  employeeId: string;
  companyId: string;
  role: string;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AuthUser {
  userId: string;
  employeeId: string;
  companyId: string;
  companySlug?: string;
  role: UserRole;
  permissions: string[];
  email: string;
  fullName: string;
  photo?: string;
  sessionId: string;
}

export type UserRole =
  | 'super_admin'
  | 'company_admin'
  | 'hr_head'
  | 'hr_executive'
  | 'payroll_manager'
  | 'department_manager'
  | 'reporting_manager'
  | 'employee'
  | 'auditor'
  | 'finance'
  | 'it_admin'
  | 'guest';

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  requiresMFA: boolean;
}

export interface MFAInput {
  code: string;
  sessionToken: string;
}
