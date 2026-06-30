// ─────────────────────────────────────────────────────────────────────────────
// Real API Service Layer — WorkSphere ERP
// Replaces mock.service.ts with real HTTP calls to the Express backend.
// All requests go through the axios client in api.ts which auto-attaches JWT.
// ─────────────────────────────────────────────────────────────────────────────

import api from './api';
import type { AuthUser } from '@/types/auth.types';
import type { Employee, EmployeeListItem } from '@/types/employee.types';
import type { PayrollRun } from '@/types/payroll.types';
import type { Notification } from '@/types/api.types';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authService = {
  async login(
    email: string,
    password: string,
    portal?: 'super_admin' | 'tenant_admin' | 'employee'
  ): Promise<{ user: AuthUser; accessToken: string }> {
    const res = await api.post<{ success: boolean; data: { user: AuthUser; accessToken: string } }>(
      '/auth/login',
      { email, password, portal }
    );
    return res.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<AuthUser> {
    const res = await api.get<{ success: boolean; data: AuthUser }>('/auth/me');
    return res.data.data;
  },

  async signup(data: any): Promise<{ user: AuthUser; accessToken: string }> {
    const res = await api.post<{ success: boolean; data: { user: AuthUser; accessToken: string } }>(
      '/auth/signup',
      data
    );
    return res.data.data;
  },
};

// ── Platform Super Admin ─────────────────────────────────────────────────────

export const adminService = {
  async listCompanies(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/admin/companies');
    return res.data.data;
  },

  async updateCompanyStatus(companyId: string, status: 'active' | 'suspended'): Promise<any> {
    const res = await api.patch<{ success: boolean; data: any }>(`/admin/companies/${companyId}/status`, { status });
    return res.data.data;
  },

  async updateCompanySubscription(companyId: string, subscriptionPlan: 'free' | 'growth' | 'enterprise'): Promise<any> {
    const res = await api.patch<{ success: boolean; data: any }>(`/admin/companies/${companyId}/subscription`, { subscriptionPlan });
    return res.data.data;
  },

  async getPlatformStats(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/admin/stats');
    return res.data.data;
  }
};

// ── Employees ─────────────────────────────────────────────────────────────────

export const employeeService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ employees: EmployeeListItem[]; total: number; page: number; totalPages: number }> {
    const res = await api.get<{
      success: boolean;
      data: { employees: EmployeeListItem[]; total: number; page: number; totalPages: number };
    }>('/employees', { params });
    return res.data.data;
  },

  async getById(id: string): Promise<Employee> {
    const res = await api.get<{ success: boolean; data: Employee }>(`/employees/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Employee>): Promise<Employee> {
    const res = await api.post<{ success: boolean; data: Employee }>('/employees', data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    const res = await api.patch<{ success: boolean; data: Employee }>(`/employees/${id}`, data);
    return res.data.data;
  },

  async dispatchAction(id: string, action: string, data: any): Promise<Employee> {
    const res = await api.post<{ success: boolean; data: Employee }>(`/employees/${id}/actions`, { action, data });
    return res.data.data;
  },
};

// ── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardService = {
  async getKPIs() {
    const res = await api.get('/dashboard/kpis');
    return res.data.data;
  },

  async getDeptDistribution() {
    const res = await api.get('/dashboard/dept-distribution');
    return res.data.data;
  },

  async getHeadcountTrend() {
    const res = await api.get('/dashboard/headcount-trend');
    return res.data.data;
  },

  async getAttendanceTrend() {
    const res = await api.get('/attendance/weekly');
    return res.data.data;
  },

  async getWorkModeDist() {
    const res = await api.get('/dashboard/dept-distribution');
    // Derive work mode distribution from the employee data via a secondary call
    const empRes = await api.get('/employees', { params: { limit: 100 } });
    const employees = empRes.data.data?.employees ?? [];
    const modes: Record<string, number> = { Onsite: 0, Hybrid: 0, Remote: 0 };
    for (const emp of employees) {
      const mode = (emp.job?.workMode ?? '').toLowerCase();
      if (mode === 'onsite') modes['Onsite']++;
      else if (mode === 'hybrid') modes['Hybrid']++;
      else if (mode === 'remote') modes['Remote']++;
    }
    return [
      { name: 'Onsite', value: modes['Onsite'], color: '#5B3CF5' },
      { name: 'Hybrid', value: modes['Hybrid'], color: '#00C48C' },
      { name: 'Remote', value: modes['Remote'], color: '#2BB5FF' },
    ];
  },

  async getActivities() {
    const res = await api.get('/dashboard/activities');
    return res.data.data;
  },

  async getBirthdays() {
    const res = await api.get('/dashboard/birthdays');
    return res.data.data;
  },
};

// ── Payroll (Extended) ─────────────────────────────────────────────────────────

export const payrollService = {
  async getRuns(): Promise<PayrollRun[]> {
    const res = await api.get<{ success: boolean; data: PayrollRun[] }>('/payroll/runs');
    return res.data.data;
  },

  async createRun(month: number, year: number): Promise<PayrollRun> {
    const res = await api.post<{ success: boolean; data: PayrollRun }>('/payroll/runs', { month, year });
    return res.data.data;
  },

  async processRun(id: string): Promise<void> {
    await api.post(`/payroll/runs/${id}/process`);
  },

  async approveRun(id: string): Promise<PayrollRun> {
    const res = await api.post<{ success: boolean; data: PayrollRun }>(`/payroll/runs/${id}/approve`);
    return res.data.data;
  },

  async lockRun(id: string): Promise<PayrollRun> {
    const res = await api.post<{ success: boolean; data: PayrollRun }>(`/payroll/runs/${id}/lock`);
    return res.data.data;
  },

  async getPayslips(id: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>(`/payroll/runs/${id}/payslips`);
    return res.data.data;
  },

  async getPayslipPdf(id: string): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>(`/payroll/payslips/${id}/pdf`);
    return res.data.data;
  },

  async getStructures(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/payroll/structures');
    return res.data.data;
  },

  async createStructure(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/payroll/structures', data);
    return res.data.data;
  },

  async updateStructure(id: string, data: any): Promise<any> {
    const res = await api.put<{ success: boolean; data: any }>(`/payroll/structures/${id}`, data);
    return res.data.data;
  }
};

// ── Leave Management ─────────────────────────────────────────────────────────

export const leaveService = {
  async getTypes(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/leave/types');
    return res.data.data;
  },

  async createType(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/leave/types', data);
    return res.data.data;
  },

  async apply(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/leave/apply', data);
    return res.data.data;
  },

  async getApplications(params?: { status?: string; employeeId?: string }): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/leave/applications', { params });
    return res.data.data;
  },

  async getApplication(id: string): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>(`/leave/applications/${id}`);
    return res.data.data;
  },

  async approve(id: string, comments?: string): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/leave/applications/${id}/approve`, { comments });
    return res.data.data;
  },

  async reject(id: string, comments?: string): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/leave/applications/${id}/reject`, { comments });
    return res.data.data;
  },

  async getBalance(employeeId?: string): Promise<any[]> {
    const url = employeeId ? `/leave/balance/${employeeId}` : '/leave/balance';
    const res = await api.get<{ success: boolean; data: any[] }>(url);
    return res.data.data;
  }
};

// ── Workflows ───────────────────────────────────────────────────────────────

export const workflowService = {
  async getPending(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/workflow/pending');
    return res.data.data;
  },

  async action(id: string, action: 'approve' | 'reject', comments?: string): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/workflow/${id}/action`, { action, comments });
    return res.data.data;
  },

  async delegate(id: string, toUserId: string): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/workflow/${id}/delegate`, { toUserId });
    return res.data.data;
  }
};

// ── Documents ───────────────────────────────────────────────────────────────

export const documentService = {
  async upload(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/documents/upload', data);
    return res.data.data;
  },

  async getAll(params?: { category?: string; employeeId?: string }): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/documents', { params });
    return res.data.data;
  },

  async download(id: string): Promise<string> {
    const res = await api.get<{ success: boolean; data: { url: string } }>(`/documents/${id}/download`);
    return res.data.data.url;
  },

  async verify(id: string): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/documents/${id}/verify`);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  async getExpiring(days?: number): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/documents/expiring', { params: { days } });
    return res.data.data;
  }
};

// ── Assets ─────────────────────────────────────────────────────────────────

export const assetService = {
  async create(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/assets', data);
    return res.data.data;
  },

  async getAll(params?: { status?: string; category?: string; employeeId?: string }): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/assets', { params });
    return res.data.data;
  },

  async assign(id: string, data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/assets/${id}/assign`, data);
    return res.data.data;
  },

  async return(id: string, data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/assets/${id}/return`, data);
    return res.data.data;
  },

  async getByEmployee(employeeId: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>(`/assets/employee/${employeeId}`);
    return res.data.data;
  },

  async getSummary(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/assets/reports/summary');
    return res.data.data;
  }
};

// ── Reports ────────────────────────────────────────────────────────────────

export const reportService = {
  async getHeadcount(groupBy: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/employees/headcount', { params: { groupBy } });
    return res.data.data;
  },

  async getAttrition(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/employees/attrition');
    return res.data.data;
  },

  async getDiversity(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/employees/diversity');
    return res.data.data;
  },

  async getAttendanceReport(month?: number, year?: number): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/attendance/monthly', { params: { month, year } });
    return res.data.data;
  },

  async getLatecomers(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/attendance/latecomers');
    return res.data.data;
  },

  async getPayrollCost(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/payroll/cost');
    return res.data.data;
  },

  async getStatutory(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/reports/payroll/statutory');
    return res.data.data;
  },

  async getLeaveSummary(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/leave/summary');
    return res.data.data;
  },

  async runCustom(data: any): Promise<any[]> {
    const res = await api.post<{ success: boolean; data: any[] }>('/reports/custom/run', data);
    return res.data.data;
  }
};

// ── Settings ───────────────────────────────────────────────────────────────

export const settingsService = {
  async getCompany(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/settings/company');
    return res.data.data;
  },

  async updateCompany(data: any): Promise<any> {
    const res = await api.put<{ success: boolean; data: any }>('/settings/company', data);
    return res.data.data;
  },

  async initialize(): Promise<void> {
    await api.post('/settings/company/initialize');
  },

  async getDepartments(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/settings/departments');
    return res.data.data;
  },

  async addDepartment(data: any): Promise<any[]> {
    const res = await api.post<{ success: boolean; data: any[] }>('/settings/departments', data);
    return res.data.data;
  },

  async updateDepartment(id: string, data: any): Promise<any[]> {
    const res = await api.put<{ success: boolean; data: any[] }>(`/settings/departments/${id}`, data);
    return res.data.data;
  },

  async deleteDepartment(id: string): Promise<any[]> {
    const res = await api.delete<{ success: boolean; data: any[] }>(`/settings/departments/${id}`);
    return res.data.data;
  },

  async getDesignations(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/settings/designations');
    return res.data.data;
  },

  async addDesignation(data: any): Promise<any[]> {
    const res = await api.post<{ success: boolean; data: any[] }>('/settings/designations', data);
    return res.data.data;
  },

  async updateDesignation(id: string, data: any): Promise<any[]> {
    const res = await api.put<{ success: boolean; data: any[] }>(`/settings/designations/${id}`, data);
    return res.data.data;
  },

  async deleteDesignation(id: string): Promise<any[]> {
    const res = await api.delete<{ success: boolean; data: any[] }>(`/settings/designations/${id}`);
    return res.data.data;
  },

  async getHolidays(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/settings/holiday-calendars');
    return res.data.data;
  },

  async saveHolidays(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/settings/holiday-calendars', data);
    return res.data.data;
  }
};

// ── Audit Logs ─────────────────────────────────────────────────────────────

export const auditService = {
  async getLogs(params?: { page?: number; limit?: number; action?: string; email?: string }): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/audit/logs', { params });
    return res.data.data;
  }
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const res = await api.get<{ success: boolean; data: Notification[] }>('/notifications');
    return res.data.data;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};

// ── Global Search ─────────────────────────────────────────────────────────────

export const searchService = {
  async search(query: string) {
    if (!query || query.length < 2) {
      return { employees: [], payroll: [], attendance: [], documents: [], total: 0 };
    }
    const res = await api.get('/search', { params: { q: query } });
    return res.data.data;
  },
};

// ── Attendance ────────────────────────────────────────────────────────────────

export const attendanceService = {
  async list(params?: { date?: string; page?: number; limit?: number }) {
    const res = await api.get('/attendance', { params });
    return res.data.data;
  },

  async getSummary() {
    const res = await api.get('/attendance/summary');
    return res.data.data;
  },

  async getWeeklyTrend() {
    const res = await api.get('/attendance/weekly');
    return res.data.data;
  },

  async checkIn(payload: { employeeId: string; fullName: string; workMode: string }) {
    const res = await api.post('/attendance/checkin', payload);
    return res.data.data;
  },

  async checkOut(id: string) {
    const res = await api.patch(`/attendance/${id}/checkout`);
    return res.data.data;
  },
};

// ── Approvals ─────────────────────────────────────────────────────────────────

export const approvalsService = {
  async list(status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending') {
    const res = await api.get('/approvals', { params: { status } });
    return res.data.data as {
      _id: string;
      employeeId: string;
      fullName: string;
      type: 'Leave Request' | 'Attendance Regularization' | 'Expense Claim';
      details: string;
      status: string;
      dateRange?: string;
      amount?: string;
      requestedAt: string;
    }[];
  },

  async approve(id: string) {
    const res = await api.patch(`/approvals/${id}/approve`);
    return res.data.data;
  },

  async reject(id: string) {
    const res = await api.patch(`/approvals/${id}/reject`);
    return res.data.data;
  },

  async create(payload: {
    employeeId: string;
    fullName: string;
    type: 'Leave Request' | 'Attendance Regularization' | 'Expense Claim';
    details: string;
    dateRange?: string;
    amount?: string;
  }) {
    const res = await api.post('/approvals', payload);
    return res.data.data;
  },
};

// ── Onboarding ────────────────────────────────────────────────────────────────

export const onboardingService = {
  async create(payload: any) {
    const res = await api.post<{ success: boolean; data: any }>('/onboarding/new', payload);
    return res.data.data;
  },
};

