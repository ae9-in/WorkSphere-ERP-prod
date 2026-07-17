import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { routes } from './routes';
import { AppShell } from '@/components/layout/AppShell/AppShell';

// ── Lazy-loaded pages ─────────────────────────
const LandingPage        = lazy(() => import('@/views/marketing/LandingPage'));
const HRModulesPage      = lazy(() => import('@/views/marketing/HRModulesPage'));
const CompanyPage        = lazy(() => import('@/views/marketing/CompanyPage'));
const LoginPage          = lazy(() => import('@/views/auth/LoginPage'));
const AdminLoginPage     = lazy(() => import('@/views/auth/AdminLoginPage'));
const EmployeeLoginPage  = lazy(() => import('@/views/auth/EmployeeLoginPage'));
const AdminDashboardPage = lazy(() => import('@/views/admin/AdminDashboardPage'));
const SignUpPage         = lazy(() => import('@/views/auth/SignUpPage'));
const WorkspaceSetupPage = lazy(() => import('@/views/auth/WorkspaceSetupPage'));
const ForgotPasswordPage = lazy(() => import('@/views/auth/ForgotPasswordPage'));
const MFAPage            = lazy(() => import('@/views/auth/MFAPage'));
const DashboardPage      = lazy(() => import('@/views/dashboard/DashboardPage'));
const EmployeeListPage   = lazy(() => import('@/views/employees/EmployeeListPage'));
const EmployeeProfilePage= lazy(() => import('@/views/employees/EmployeeProfilePage'));
const EmployeeCreatePage = lazy(() => import('@/views/employees/EmployeeCreatePage'));

// Real Notifications Page
const NotificationsPage = lazy(() => import('@/views/modules/NotificationsPage'));

// Modular pages
const OnboardingPage  = lazy(() => import('@/views/modules/OnboardingPage'));
const OnboardingWizardPage = lazy(() => import('@/views/modules/OnboardingWizardPage'));
const OffboardingPage = lazy(() => import('@/views/modules/OffboardingPage'));
const PayrollPage     = lazy(() => import('@/views/modules/PayrollPage'));
const AttendancePage  = lazy(() => import('@/views/modules/AttendancePage'));
const ReportsPage     = lazy(() => import('@/views/modules/ReportsPage'));
const ApprovalsPage   = lazy(() => import('@/views/modules/ApprovalsPage'));
const SettingsPage    = lazy(() => import('@/views/modules/SettingsPage'));
const LeavePage       = lazy(() => import('@/views/modules/LeavePage'));
const DocumentsPage   = lazy(() => import('@/views/modules/DocumentsPage'));
const AssetPage       = lazy(() => import('@/views/modules/AssetPage'));
const InventoryPage   = lazy(() => import('@/views/modules/InventoryPage'));
const ManufacturingPage = lazy(() => import('@/views/modules/ManufacturingPage'));
const MaintenancePage = lazy(() => import('@/views/modules/MaintenancePage'));
const SupplyChainPage = lazy(() => import('@/views/modules/SupplyChainPage'));
const AuditPage       = lazy(() => import('@/views/modules/AuditPage'));
const RecruitmentPage = lazy(() => import('@/views/modules/RecruitmentPage'));
const CandidateProfilePage = lazy(() => import('@/views/modules/CandidateProfilePage'));
const PerformancePage = lazy(() => import('@/views/modules/PerformancePage'));
const LMSPage = lazy(() => import('@/views/modules/LMSPage'));
const CommunityPage = lazy(() => import('@/views/modules/CommunityPage'));
const HelpdeskPage = lazy(() => import('@/views/modules/HelpdeskPage'));
const ModulePlaceholderPage = lazy(() => import('@/views/modules/ModulePlaceholderPage'));
const FinancePage = lazy(() => import('@/views/modules/FinancePage'));
const CRMPage = lazy(() => import('@/views/modules/CRMPage'));
const ProjectsPage = lazy(() => import('@/views/modules/ProjectsPage'));
const WorkflowsPage = lazy(() => import('@/views/modules/WorkflowsPage'));
const AnalyticsPage = lazy(() => import('@/views/modules/AnalyticsPage'));
const AdminCenterPage = lazy(() => import('@/views/modules/AdminCenterPage'));

// ── Page loader ────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-ag-ink-3 text-sm">Loading…</span>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path={routes.LANDING}         element={<LandingPage />} />
          <Route path="/modules/:moduleId"     element={<HRModulesPage />} />
          <Route path="/company/:sectionId"    element={<CompanyPage />} />
          <Route path={routes.LOGIN}           element={<LoginPage />} />
          <Route path={routes.ADMIN_LOGIN}     element={<AdminLoginPage />} />
          <Route path={routes.EMPLOYEE_LOGIN}  element={<EmployeeLoginPage />} />
          <Route path={routes.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
          <Route path={routes.SIGNUP}          element={<SignUpPage />} />
          <Route path={routes.WORKSPACE_SETUP} element={<WorkspaceSetupPage />} />
          <Route path={routes.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={routes.MFA}             element={<MFAPage />} />

          {/* Protected routes */}
          <Route
            element={
              <PrivateRoute>
                <AppShell />
              </PrivateRoute>
            }
          >
            <Route path={routes.DASHBOARD}        element={<DashboardPage />} />
            <Route path={routes.EMPLOYEES}        element={<EmployeeListPage />} />
            <Route path={routes.EMPLOYEE_CREATE}  element={<EmployeeCreatePage />} />
            <Route path={routes.EMPLOYEE_PROFILE} element={<EmployeeProfilePage />} />

            {/* Real Module Pages */}
            <Route path="/onboarding/new" element={<OnboardingWizardPage />} />
            <Route path="/onboarding/*"  element={<OnboardingPage />} />
            <Route path="/offboarding/*" element={<OffboardingPage />} />
            <Route path="/payroll/*"     element={<PayrollPage />} />
            <Route path="/attendance/*"  element={<AttendancePage />} />
            <Route path="/reports/*"     element={<ReportsPage />} />
            <Route path="/approvals"     element={<Navigate to="/admin/approvals" replace />} />
            <Route path="/settings/*"    element={<Navigate to="/admin/company-settings" replace />} />
            <Route path="/leave/*"       element={<LeavePage />} />
            <Route path="/documents/*"   element={<DocumentsPage />} />
            <Route path="/assets/*"      element={<AssetPage />} />
            <Route path="/inventory/*"   element={<InventoryPage />} />
            <Route path="/manufacturing/*" element={<ManufacturingPage />} />
            <Route path="/maintenance/*" element={<MaintenancePage />} />
            <Route path="/supply-chain/*" element={<SupplyChainPage />} />
            <Route path="/audit"         element={<Navigate to="/admin/audit-logs" replace />} />
            <Route path="/notifications" element={<Navigate to="/admin/notifications" replace />} />
            <Route path="/recruitment/candidates/:id" element={<CandidateProfilePage />} />
            <Route path="/recruitment/*" element={<RecruitmentPage />} />
            <Route path="/performance/*" element={<PerformancePage />} />
            <Route path="/lms/*" element={<LMSPage />} />
            <Route path="/community/*" element={<CommunityPage />} />
            <Route path="/helpdesk/*" element={<HelpdeskPage />} />
            <Route path="/workflows/*" element={<WorkflowsPage />} />

            {/* Placeholder modules */}
            <Route path="/finance/:moduleKey" element={<FinancePage />} />
            <Route path="/sales/:moduleKey" element={<CRMPage />} />
            <Route path="/projects/*" element={<ProjectsPage />} />
            <Route path="/analytics/*" element={<AnalyticsPage />} />
            <Route path="/admin/*" element={<AdminCenterPage />} />
            <Route path="/placeholder/:moduleKey" element={<ModulePlaceholderPage />} />
          </Route>

          {/* Protected routes (with workspace slug namespace) */}
          <Route
            path="/w/:workspaceSlug"
            element={
              <PrivateRoute>
                <AppShell />
              </PrivateRoute>
            }
          >
            <Route path="dashboard"        element={<DashboardPage />} />
            <Route path="employees"        element={<EmployeeListPage />} />
            <Route path="employees/new"    element={<EmployeeCreatePage />} />
            <Route path="employees/:id"    element={<EmployeeProfilePage />} />

            {/* Real Module Pages */}
            <Route path="onboarding/new" element={<OnboardingWizardPage />} />
            <Route path="onboarding/*"  element={<OnboardingPage />} />
            <Route path="offboarding/*" element={<OffboardingPage />} />
            <Route path="payroll/*"     element={<PayrollPage />} />
            <Route path="attendance/*"  element={<AttendancePage />} />
            <Route path="reports/*"     element={<ReportsPage />} />
            <Route path="approvals"     element={<Navigate to="admin/approvals" replace />} />
            <Route path="settings/*"    element={<Navigate to="admin/company-settings" replace />} />
            <Route path="leave/*"       element={<LeavePage />} />
            <Route path="documents/*"   element={<DocumentsPage />} />
            <Route path="assets/*"      element={<AssetPage />} />
            <Route path="inventory/*"   element={<InventoryPage />} />
            <Route path="manufacturing/*" element={<ManufacturingPage />} />
            <Route path="maintenance/*" element={<MaintenancePage />} />
            <Route path="supply-chain/*" element={<SupplyChainPage />} />
            <Route path="audit"         element={<Navigate to="admin/audit-logs" replace />} />
            <Route path="notifications" element={<Navigate to="admin/notifications" replace />} />
            <Route path="recruitment/candidates/:id" element={<CandidateProfilePage />} />
            <Route path="recruitment/*" element={<RecruitmentPage />} />
            <Route path="performance/*" element={<PerformancePage />} />
            <Route path="lms/*" element={<LMSPage />} />
            <Route path="community/*" element={<CommunityPage />} />
            <Route path="helpdesk/*" element={<HelpdeskPage />} />
            <Route path="workflows/*" element={<WorkflowsPage />} />

            {/* Placeholder modules */}
            <Route path="finance/:moduleKey" element={<FinancePage />} />
            <Route path="sales/:moduleKey" element={<CRMPage />} />
            <Route path="projects/*" element={<ProjectsPage />} />
            <Route path="analytics/*" element={<AnalyticsPage />} />
            <Route path="admin/*" element={<AdminCenterPage />} />
            <Route path="placeholder/:moduleKey" element={<ModulePlaceholderPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={routes.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
