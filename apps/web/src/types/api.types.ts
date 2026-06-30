// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  type: 'employee' | 'payroll' | 'attendance' | 'document';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  photo?: string;
  url: string;
}

export interface SearchResponse {
  employees: SearchResult[];
  payroll: SearchResult[];
  attendance: SearchResult[];
  documents: SearchResult[];
  total: number;
}

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  url?: string;
  createdAt: string;
  actor?: {
    name: string;
    photo?: string;
  };
}

export type NotificationType =
  | 'approval_request'
  | 'approval_granted'
  | 'approval_rejected'
  | 'payroll_processed'
  | 'attendance_regularization'
  | 'onboarding_task'
  | 'offboarding_task'
  | 'document_uploaded'
  | 'birthday'
  | 'anniversary'
  | 'system';
