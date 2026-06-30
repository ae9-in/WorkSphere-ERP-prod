import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole, requirePermission, verifyTenant } from '../middleware/rbac.middleware';

// Auth
import { login, logout, getMe, refresh, signup } from '../controllers/auth.controller';

// Platform Super Admin
import {
  listCompanies,
  updateCompanyStatus,
  updateCompanySubscription,
  getPlatformStats
} from '../controllers/admin.controller';

// Employees
import { listEmployees, getEmployee, createEmployee, updateEmployee } from '../controllers/employee.controller';

// Dashboard
import { getKPIs, getDeptDistribution, getHeadcountTrend, getActivities, getBirthdays, getPublicStats } from '../controllers/dashboard.controller';

// Payroll
import {
  getPayrollRuns,
  createPayrollRun,
  processPayrollRun,
  approvePayrollRun,
  lockPayrollRun,
  getPayslipsForRun,
  getPayslipPdf,
  getSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure
} from '../controllers/payroll.controller';

// Leave
import {
  createLeaveType,
  getLeaveTypes,
  applyLeave,
  listLeaveApplications,
  getLeaveApplication,
  approveLeave,
  rejectLeave,
  getLeaveBalance
} from '../controllers/leave.controller';

// Workflow
import {
  getPendingApprovals,
  actionWorkflowInstance,
  delegateWorkflowInstance
} from '../controllers/workflow.controller';

// Documents
import {
  uploadDocument,
  getDocuments,
  downloadDocument,
  verifyDocument,
  deleteDocument,
  getExpiringDocuments
} from '../controllers/document.controller';

// Assets
import {
  createAsset,
  getAssets,
  assignAsset,
  returnAsset,
  getAssetsByEmployee,
  getAssetSummaryReport
} from '../controllers/asset.controller';

// Reports
import {
  getHeadcountReport,
  getAttritionReport,
  getDiversityReport,
  getMonthlyAttendanceReport,
  getLatecomersReport,
  getPayrollCostReport,
  getStatutoryReport,
  getLeaveSummaryReport,
  runCustomReport
} from '../controllers/report.controller';

// Settings
import {
  getCompanySettings,
  updateCompanySettings,
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getDesignations,
  addDesignation,
  updateDesignation,
  deleteDesignation,
  getHolidayCalendars,
  saveHolidayCalendar,
  initializeCompanySettings
} from '../controllers/settings.controller';

// Audit
import { getAuditLogs } from '../controllers/audit.controller';


// Notifications
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller';

// Search
import { search } from '../controllers/search.controller';

// Attendance
import { getAttendance, getAttendanceSummary, getWeeklyTrend, checkIn, checkOut } from '../controllers/attendance.controller';

// Approvals
import { getApprovals, approveRequest, rejectRequest, createApproval } from '../controllers/approvals.controller';

// Onboarding Workflow
import { createOnboardingWorkflow } from '../controllers/onboarding.controller';

// Employee Actions
import { dispatchEmployeeAction } from '../controllers/employee-actions.controller';

const router = Router();

// ── Public Stats ────────────────────────────────────────────────
router.get ('/public/stats', getPublicStats);

// ── Auth ────────────────────────────────────────────────────────
router.post('/auth/login',   login);
router.post('/auth/signup',  signup);
router.post('/auth/logout',  authMiddleware, verifyTenant, logout);
router.post('/auth/refresh', refresh);
router.get ('/auth/me',      authMiddleware, verifyTenant, getMe);

// ── Platform Super Admin ────────────────────────────────────────
router.get  ('/admin/companies',             authMiddleware, requireRole(['super_admin']), listCompanies);
router.patch('/admin/companies/:id/status',  authMiddleware, requireRole(['super_admin']), updateCompanyStatus);
router.patch('/admin/companies/:id/subscription', authMiddleware, requireRole(['super_admin']), updateCompanySubscription);
router.get  ('/admin/stats',                 authMiddleware, requireRole(['super_admin']), getPlatformStats);

// ── Employees ───────────────────────────────────────────────────
router.get  ('/employees',      authMiddleware, verifyTenant, listEmployees);
router.post ('/employees',      authMiddleware, verifyTenant, requireRole(['super_admin', 'company_admin', 'hr_head', 'hr_executive']), createEmployee);
router.get  ('/employees/:id',  authMiddleware, verifyTenant, getEmployee);
router.patch('/employees/:id',  authMiddleware, verifyTenant, requireRole(['super_admin', 'company_admin', 'hr_head']), updateEmployee);

// ── Dashboard ───────────────────────────────────────────────────
router.get('/dashboard/kpis',              authMiddleware, verifyTenant, getKPIs);
router.get('/dashboard/dept-distribution', authMiddleware, verifyTenant, getDeptDistribution);
router.get('/dashboard/headcount-trend',   authMiddleware, verifyTenant, getHeadcountTrend);
router.get('/dashboard/activities',        authMiddleware, verifyTenant, getActivities);
router.get('/dashboard/birthdays',         authMiddleware, verifyTenant, getBirthdays);

// ── Payroll (Extended) ───────────────────────────────────────────────
router.get   ('/payroll/runs', authMiddleware, verifyTenant, getPayrollRuns);
router.post  ('/payroll/runs', authMiddleware, verifyTenant, createPayrollRun);
router.post  ('/payroll/runs/:id/process', authMiddleware, verifyTenant, processPayrollRun);
router.post  ('/payroll/runs/:id/approve', authMiddleware, verifyTenant, approvePayrollRun);
router.post  ('/payroll/runs/:id/lock', authMiddleware, verifyTenant, lockPayrollRun);
router.get   ('/payroll/runs/:id/payslips', authMiddleware, verifyTenant, getPayslipsForRun);
router.get   ('/payroll/payslips/:id/pdf', authMiddleware, verifyTenant, getPayslipPdf);
router.get   ('/payroll/structures', authMiddleware, verifyTenant, getSalaryStructures);
router.post  ('/payroll/structures', authMiddleware, verifyTenant, createSalaryStructure);
router.put   ('/payroll/structures/:id', authMiddleware, verifyTenant, updateSalaryStructure);

// ── Leave Management ────────────────────────────────────────────────
router.post  ('/leave/types', authMiddleware, verifyTenant, createLeaveType);
router.get   ('/leave/types', authMiddleware, verifyTenant, getLeaveTypes);
router.post  ('/leave/apply', authMiddleware, verifyTenant, applyLeave);
router.get   ('/leave/applications', authMiddleware, verifyTenant, listLeaveApplications);
router.get   ('/leave/applications/:id', authMiddleware, verifyTenant, getLeaveApplication);
router.post  ('/leave/applications/:id/approve', authMiddleware, verifyTenant, approveLeave);
router.post  ('/leave/applications/:id/reject', authMiddleware, verifyTenant, rejectLeave);
router.get   ('/leave/balance', authMiddleware, verifyTenant, getLeaveBalance);
router.get   ('/leave/balance/:employeeId', authMiddleware, verifyTenant, getLeaveBalance);

// ── Workflows ───────────────────────────────────────────────────────
router.get   ('/workflow/pending', authMiddleware, verifyTenant, getPendingApprovals);
router.post  ('/workflow/:id/action', authMiddleware, verifyTenant, actionWorkflowInstance);
router.post  ('/workflow/:id/delegate', authMiddleware, verifyTenant, delegateWorkflowInstance);

// ── Documents ──────────────────────────────────────────────────────
router.post  ('/documents/upload', authMiddleware, verifyTenant, uploadDocument);
router.get   ('/documents', authMiddleware, verifyTenant, getDocuments);
router.get   ('/documents/expiring', authMiddleware, verifyTenant, getExpiringDocuments);
router.get   ('/documents/:id/download', authMiddleware, verifyTenant, downloadDocument);
router.post  ('/documents/:id/verify', authMiddleware, verifyTenant, verifyDocument);
router.delete('/documents/:id', authMiddleware, verifyTenant, deleteDocument);

// ── Assets ─────────────────────────────────────────────────────────
router.post  ('/assets', authMiddleware, verifyTenant, createAsset);
router.get   ('/assets', authMiddleware, verifyTenant, getAssets);
router.post  ('/assets/:id/assign', authMiddleware, verifyTenant, assignAsset);
router.post  ('/assets/:id/return', authMiddleware, verifyTenant, returnAsset);
router.get   ('/assets/employee/:employeeId', authMiddleware, verifyTenant, getAssetsByEmployee);
router.get   ('/assets/reports/summary', authMiddleware, verifyTenant, getAssetSummaryReport);

// ── Reports ────────────────────────────────────────────────────────
router.get   ('/reports/employees/headcount', authMiddleware, verifyTenant, getHeadcountReport);
router.get   ('/reports/employees/attrition', authMiddleware, verifyTenant, getAttritionReport);
router.get   ('/reports/employees/diversity', authMiddleware, verifyTenant, getDiversityReport);
router.get   ('/reports/attendance/monthly', authMiddleware, verifyTenant, getMonthlyAttendanceReport);
router.get   ('/reports/attendance/latecomers', authMiddleware, verifyTenant, getLatecomersReport);
router.get   ('/reports/payroll/cost', authMiddleware, verifyTenant, getPayrollCostReport);
router.get   ('/reports/payroll/statutory', authMiddleware, verifyTenant, getStatutoryReport);
router.get   ('/reports/leave/summary', authMiddleware, verifyTenant, getLeaveSummaryReport);
router.post  ('/reports/custom/run', authMiddleware, verifyTenant, runCustomReport);

// ── Settings ───────────────────────────────────────────────────────
router.get   ('/settings/company', authMiddleware, verifyTenant, getCompanySettings);
router.put   ('/settings/company', authMiddleware, verifyTenant, updateCompanySettings);
router.post  ('/settings/company/initialize', authMiddleware, verifyTenant, initializeCompanySettings);
router.get   ('/settings/departments', authMiddleware, verifyTenant, getDepartments);
router.post  ('/settings/departments', authMiddleware, verifyTenant, addDepartment);
router.put   ('/settings/departments/:id', authMiddleware, verifyTenant, updateDepartment);
router.delete('/settings/departments/:id', authMiddleware, verifyTenant, deleteDepartment);
router.get   ('/settings/designations', authMiddleware, verifyTenant, getDesignations);
router.post  ('/settings/designations', authMiddleware, verifyTenant, addDesignation);
router.put   ('/settings/designations/:id', authMiddleware, verifyTenant, updateDesignation);
router.delete('/settings/designations/:id', authMiddleware, verifyTenant, deleteDesignation);
router.get   ('/settings/holiday-calendars', authMiddleware, verifyTenant, getHolidayCalendars);
router.post  ('/settings/holiday-calendars', authMiddleware, verifyTenant, saveHolidayCalendar);

// ── Audit ──────────────────────────────────────────────────────────
router.get   ('/audit/logs', authMiddleware, verifyTenant, getAuditLogs);


// ── Notifications ───────────────────────────────────────────────
router.get  ('/notifications',          authMiddleware, verifyTenant, getNotifications);
router.patch('/notifications/read-all', authMiddleware, verifyTenant, markAllRead);
router.patch('/notifications/:id/read', authMiddleware, verifyTenant, markRead);

// ── Search ──────────────────────────────────────────────────────
router.get('/search', authMiddleware, verifyTenant, search);

// ── Attendance ──────────────────────────────────────────────────
router.get ('/attendance',             authMiddleware, verifyTenant, getAttendance);
router.get ('/attendance/summary',     authMiddleware, verifyTenant, getAttendanceSummary);
router.get ('/attendance/weekly',      authMiddleware, verifyTenant, getWeeklyTrend);
router.post('/attendance/checkin',     authMiddleware, verifyTenant, checkIn);
router.patch('/attendance/:id/checkout', authMiddleware, verifyTenant, checkOut);

// ── Approvals ───────────────────────────────────────────────────
router.get  ('/approvals',             authMiddleware, verifyTenant, getApprovals);
router.post ('/approvals',             authMiddleware, verifyTenant, createApproval);
router.patch('/approvals/:id/approve', authMiddleware, verifyTenant, requireRole(['super_admin', 'company_admin', 'hr_head']), approveRequest);
router.patch('/approvals/:id/reject',  authMiddleware, verifyTenant, requireRole(['super_admin', 'company_admin', 'hr_head']), rejectRequest);

// ── Onboarding ──────────────────────────────────────────────────
router.post ('/onboarding/new',        authMiddleware, verifyTenant, requireRole(['super_admin', 'company_admin', 'hr_head']), createOnboardingWorkflow);

// ── Employee Actions ────────────────────────────────────────────
router.post ('/employees/:id/actions',  authMiddleware, verifyTenant, dispatchEmployeeAction);

export default router;
