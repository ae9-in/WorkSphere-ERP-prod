// ─────────────────────────────────────────────────────────────────────────────
// Real API Service Layer — WorkSphere ERP
// Replaces mock.service.ts with real HTTP calls to the Express backend.
// All requests go through the axios client in api.ts which auto-attaches JWT.
// ─────────────────────────────────────────────────────────────────────────────

import api from './api';
export { api };
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

  async getTimeline(id: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>(`/employees/${id}/timeline`);
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
  },

  async recalculateRun(id: string): Promise<void> {
    await api.post(`/payroll/runs/${id}/recalculate`);
  },

  async reopenRun(id: string): Promise<any> {
    const res = await api.post(`/payroll/runs/${id}/reopen`);
    return res.data.data;
  },

  async requestReimbursement(payload: { category: string; amount: number; reason: string; receiptUrl?: string; employeeId?: string }): Promise<any> {
    const res = await api.post('/payroll/reimbursement', payload);
    return res.data.data;
  },

  async listReimbursements(employeeId?: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/payroll/reimbursement', { params: { employeeId } });
    return res.data.data;
  },

  async approveReimbursement(id: string, status: string): Promise<any> {
    const res = await api.post(`/payroll/reimbursement/${id}/approve`, { status });
    return res.data.data;
  },

  async requestLoan(payload: { employeeId: string; principalAmount: number; interestRate?: number; emiAmount: number; installments: number; reason?: string }): Promise<any> {
    const res = await api.post('/payroll/loans', payload);
    return res.data.data;
  },

  async listLoans(employeeId?: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/payroll/loans', { params: { employeeId } });
    return res.data.data;
  },

  async approveLoan(id: string, status: string): Promise<any> {
    const res = await api.post(`/payroll/loans/${id}/approve`, { status });
    return res.data.data;
  },

  async createAdjustment(payload: { employeeId: string; type: string; amount: number; reason: string }): Promise<any> {
    const res = await api.post('/payroll/adjustment', payload);
    return res.data.data;
  },

  async listAdjustments(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/payroll/adjustment');
    return res.data.data;
  },

  async listLedgers(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/payroll/ledger');
    return res.data.data;
  },

  async getDashboard(): Promise<any> {
    const res = await api.get('/payroll/dashboard');
    return res.data.data;
  },

  async getAnalytics(): Promise<any> {
    const res = await api.get('/payroll/analytics');
    return res.data.data;
  },

  async assignSalary(payload: { employeeId: string; structureId?: string; payGroupId?: string; ctc: number; effectiveDate: string }): Promise<any> {
    const res = await api.post('/payroll/salary/assign', payload);
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
    const payload = {
      ...data,
      from_date: data.from,
      to_date: data.to
    };
    const res = await api.post<{ success: boolean; data: any }>('/leave/apply', payload);
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
    const res = await api.get<{ success: boolean; data: any[] }>('/leave/balances', { params: { employeeId } });
    return res.data.data;
  },

  async cancel(applicationId: string, comments?: string): Promise<any> {
    const res = await api.post('/leave/cancel', { applicationId, comments });
    return res.data.data;
  },

  async withdraw(applicationId: string): Promise<any> {
    const res = await api.post('/leave/withdraw', { applicationId });
    return res.data.data;
  },

  async runAccrual(payload: { employeeId?: string; leaveTypeId?: string }): Promise<any> {
    const res = await api.post('/leave/accrual', payload);
    return res.data.data;
  },

  async runCarryForward(payload: { sourceYear: number; targetYear: number }): Promise<any> {
    const res = await api.post('/leave/carry-forward', payload);
    return res.data.data;
  },

  async requestEncashment(payload: { leaveTypeId: string; days: number; reason?: string; employeeId?: string }): Promise<any> {
    const res = await api.post('/leave/encashment', payload);
    return res.data.data;
  },

  async listEncashments(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/leave/encashment');
    return res.data.data;
  },

  async approveEncashment(id: string, payload: { status: string; comments?: string }): Promise<any> {
    const res = await api.post(`/leave/encashment/${id}/approve`, payload);
    return res.data.data;
  },

  async listLedgers(employeeId?: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/leave/ledger', { params: { employeeId } });
    return res.data.data;
  },

  async getDashboard(): Promise<any> {
    const res = await api.get('/leave/dashboard');
    return res.data.data;
  },

  async getAnalytics(): Promise<any> {
    const res = await api.get('/leave/analytics');
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

// ── Inventory & Warehouse ───────────────────────────────────────────────────

export const inventoryService = {
  async getCategories(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/inventory/categories');
    return res.data.data;
  },

  async createCategory(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/inventory/categories', data);
    return res.data.data;
  },

  async getItems(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/inventory/items');
    return res.data.data;
  },

  async createItem(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/inventory/items', data);
    return res.data.data;
  },

  async getWarehouses(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/inventory/warehouses');
    return res.data.data;
  },

  async createWarehouse(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/inventory/warehouses', data);
    return res.data.data;
  },

  async getLocations(warehouseCode?: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/inventory/locations', { params: { warehouseCode } });
    return res.data.data;
  },

  async createLocation(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/inventory/locations', data);
    return res.data.data;
  },

  async stockIn(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/inventory/stock-in', data);
    return res.data.data;
  },

  async stockOut(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/inventory/stock-out', data);
    return res.data.data;
  },

  async transfer(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/inventory/transfers', data);
    return res.data.data;
  },

  async getAdjustments(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/inventory/adjustments');
    return res.data.data;
  },

  async createAdjustment(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/inventory/adjustments', data);
    return res.data.data;
  },

  async approveAdjustment(id: string, status: 'approved' | 'rejected'): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/inventory/adjustments/${id}/approve`, { status });
    return res.data.data;
  },

  async submitCount(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/inventory/count', data);
    return res.data.data;
  },

  async getCounts(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/inventory/count');
    return res.data.data;
  },

  async getCountDetails(id: string): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>(`/inventory/count/${id}`);
    return res.data.data;
  },

  async approveCount(id: string, status: 'approved' | 'rejected'): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/inventory/count/${id}/approve`, { status });
    return res.data.data;
  },

  async getValuation(method: string = 'AVERAGE'): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/inventory/valuation', { params: { method } });
    return res.data.data;
  },

  async getReorders(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/inventory/reorder');
    return res.data.data;
  },

  async getDashboard(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/inventory/dashboard');
    return res.data.data;
  },

  async getAnalytics(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/inventory/analytics');
    return res.data.data;
  },

  async getForecast(itemCode: string, horizonDays?: number): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/inventory/forecast', { params: { itemCode, horizonDays } });
    return res.data.data;
  },

  async getOptimization(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/inventory/optimization');
    return res.data.data;
  }
};

// ── Manufacturing & Production Planning ─────────────────────────────────────

export const manufacturingService = {
  async getPlants(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/plants');
    return res.data.data;
  },

  async createPlant(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/plants', data);
    return res.data.data;
  },

  async createCalendar(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/calendars', data);
    return res.data.data;
  },

  async getBoms(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/bom');
    return res.data.data;
  },

  async createBom(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/bom', data);
    return res.data.data;
  },

  async getWorkCenters(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/work-centers');
    return res.data.data;
  },

  async createWorkCenter(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/work-centers', data);
    return res.data.data;
  },

  async getMachines(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/machines');
    return res.data.data;
  },

  async createMachine(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/machines', data);
    return res.data.data;
  },

  async getRoutings(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/routings');
    return res.data.data;
  },

  async createRouting(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/routings', data);
    return res.data.data;
  },

  async getProductionOrders(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/orders');
    return res.data.data;
  },

  async createProductionOrder(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/orders', data);
    return res.data.data;
  },

  async releaseWorkOrder(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/work-orders', data);
    return res.data.data;
  },

  async getWorkOrders(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/work-orders');
    return res.data.data;
  },

  async completeWorkOrder(id: string, data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/manufacturing/work-orders/${id}/complete`, data);
    return res.data.data;
  },

  async runMrp(): Promise<any[]> {
    const res = await api.post<{ success: boolean; data: any[] }>('/manufacturing/mrp');
    return res.data.data;
  },

  async submitQualityInspection(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/quality', data);
    return res.data.data;
  },

  async getQualityInspections(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/quality');
    return res.data.data;
  },

  async getNcrs(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/ncr');
    return res.data.data;
  },

  async updateCapa(id: string, data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/manufacturing/ncr/${id}/capa`, data);
    return res.data.data;
  },

  async submitScrap(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/manufacturing/scrap', data);
    return res.data.data;
  },

  async getScraps(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/scrap');
    return res.data.data;
  },

  async getDashboard(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/manufacturing/dashboard');
    return res.data.data;
  },

  async getOee(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/oee');
    return res.data.data;
  },

  async getAnalytics(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/manufacturing/analytics');
    return res.data.data;
  },

  async getCapacity(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/capacity');
    return res.data.data;
  },

  async getForecast(plantCode: string, horizonDays?: number): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/manufacturing/forecast', { params: { plantCode, horizonDays } });
    return res.data.data;
  },

  async getMaintenance(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/manufacturing/maintenance');
    return res.data.data;
  }
};

// ── Maintenance Management (CMMS-EAM) ────────────────────────────────────────

export const maintenanceService = {
  async getAssets(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/maintenance/assets');
    return res.data.data;
  },

  async createAsset(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/maintenance/assets', data);
    return res.data.data;
  },

  async createPmPlan(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/maintenance/pm-plans', data);
    return res.data.data;
  },

  async submitWorkRequest(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/maintenance/work-request', data);
    return res.data.data;
  },

  async createWorkOrder(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/maintenance/work-order', data);
    return res.data.data;
  },

  async consumeSpareParts(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/maintenance/work-order/consume-parts', data);
    return res.data.data;
  },

  async completeWorkOrder(id: string, data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>(`/maintenance/work-order/${id}/complete`, data);
    return res.data.data;
  },

  async submitInspection(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/maintenance/inspection', data);
    return res.data.data;
  },

  async submitTelemetry(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/maintenance/telemetry', data);
    return res.data.data;
  },

  async simulatePredictive(): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/maintenance/predict');
    return res.data.data;
  },

  async getDashboard(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/maintenance/dashboard');
    return res.data.data;
  },

  async getReliability(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/maintenance/reliability');
    return res.data.data;
  },

  async getReports(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/maintenance/reports');
    return res.data.data;
  },

  async getAnalytics(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/maintenance/analytics');
    return res.data.data;
  },

  async getHealth(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/maintenance/health');
    return res.data.data;
  },

  async getKpis(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/maintenance/kpis');
    return res.data.data;
  }
};

// ── Supply Chain Management (SCM) ──────────────────────────────────────────

export const supplyChainService = {
  async getShipments(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/supply-chain/shipments');
    return res.data.data;
  },

  async createShipment(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/shipments', data);
    return res.data.data;
  },

  async confirmDispatch(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/dispatch', data);
    return res.data.data;
  },

  async createRoute(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/routes', data);
    return res.data.data;
  },

  async submitPod(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/pod', data);
    return res.data.data;
  },

  async processReturn(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/reverse', data);
    return res.data.data;
  },

  async updateTelemetry(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/telemetry', data);
    return res.data.data;
  },

  async simulateAI(): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/predict');
    return res.data.data;
  },

  async getDashboard(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/supply-chain/dashboard');
    return res.data.data;
  },

  async getAnalytics(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/supply-chain/analytics');
    return res.data.data;
  },

  async getTracking(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/supply-chain/tracking');
    return res.data.data;
  },

  async getCosts(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/supply-chain/costs');
    return res.data.data;
  },

  async getOptimization(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/supply-chain/optimization');
    return res.data.data;
  },

  async getReports(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/supply-chain/reports');
    return res.data.data;
  },

  // Setup helpers
  async createNetworkNode(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/network', data);
    return res.data.data;
  },

  async getNetworkNodes(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/supply-chain/network');
    return res.data.data;
  },

  async createDC(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/distribution-centers', data);
    return res.data.data;
  },

  async getDCs(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/supply-chain/distribution-centers');
    return res.data.data;
  },

  async createPartner(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/partners', data);
    return res.data.data;
  },

  async getPartners(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/supply-chain/partners');
    return res.data.data;
  },

  async createCarrier(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/carriers', data);
    return res.data.data;
  },

  async getCarriers(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/supply-chain/carriers');
    return res.data.data;
  },

  async createVehicle(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/fleet', data);
    return res.data.data;
  },

  async getVehicles(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/supply-chain/fleet');
    return res.data.data;
  },

  async createDriver(data: any): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/supply-chain/drivers', data);
    return res.data.data;
  },

  async getDrivers(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/supply-chain/drivers');
    return res.data.data;
  }
};


export const reportService = {
  async getHeadcount(groupBy: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/headcount', { params: { groupBy } });
    return res.data.data;
  },

  async getAttrition(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/attrition');
    return res.data.data;
  },

  async getDiversity(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/diversity');
    return res.data.data;
  },

  async getAttendanceReport(month?: number, year?: number): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/attendance', { params: { month, year } });
    return res.data.data;
  },

  async getLatecomers(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/latecomers');
    return res.data.data;
  },

  async getPayrollCost(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/payroll-cost');
    return res.data.data;
  },

  async getStatutory(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/reports/statutory');
    return res.data.data;
  },

  async getLeaveSummary(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/leave-summary');
    return res.data.data;
  },

  async runCustom(data: any): Promise<any[]> {
    const res = await api.post<{ success: boolean; data: any[] }>('/reports/custom', data);
    return res.data.data;
  },

  // ── Module 13 New Analytics Endpoints ───────────────────────
  async getExecutiveSummary(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/reports/executive-summary');
    return res.data.data;
  },

  async getHRDashboard(): Promise<any> {
    const res = await api.get<{ success: boolean; data: any }>('/reports/hr-dashboard');
    return res.data.data;
  },

  async getAttendanceTrends(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/attendance-trends');
    return res.data.data;
  },

  async getWorkforceGrowth(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/workforce-growth');
    return res.data.data;
  },

  async getDepartmentStats(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/department-stats');
    return res.data.data;
  },

  async getPayrollTrends(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>('/reports/payroll-trends');
    return res.data.data;
  },
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

  async checkIn(payload: { employeeId: string; fullName: string; workMode: string; lat?: number; lng?: number }) {
    const res = await api.post('/attendance/checkin', payload);
    return res.data.data;
  },

  async checkOut(id: string) {
    const res = await api.patch(`/attendance/${id}/checkout`);
    return res.data.data;
  },

  async startBreak(payload: { date: string; breakType: string; employeeId?: string }) {
    const res = await api.post('/attendance/breaks/start', payload);
    return res.data.data;
  },

  async endBreak(payload: { date: string; employeeId?: string }) {
    const res = await api.post('/attendance/breaks/end', payload);
    return res.data.data;
  },

  async requestRegularization(payload: { date: string; requestType: string; checkIn?: string; checkOut?: string; reason: string; employeeId?: string }) {
    const res = await api.post('/attendance/regularization', payload);
    return res.data.data;
  },

  async listRegularizations() {
    const res = await api.get('/attendance/regularization');
    return res.data.data;
  },

  async approveRegularization(id: string, payload: { status: string; comments?: string }) {
    const res = await api.post(`/attendance/regularization/${id}/approve`, payload);
    return res.data.data;
  },

  async lockAttendance(payload: { startDate: string; endDate: string }) {
    const res = await api.post('/attendance/lock', payload);
    return res.data.data;
  },

  async listShifts() {
    const res = await api.get('/attendance/shifts');
    return res.data.data;
  },

  async createShift(payload: any) {
    const res = await api.post('/attendance/shifts', payload);
    return res.data.data;
  },

  async assignShift(payload: { employeeId: string; shiftId: string; effectiveDate: string }) {
    const res = await api.post('/attendance/shifts/assign', payload);
    return res.data.data;
  },

  async getAnalytics() {
    const res = await api.get('/attendance/analytics');
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

