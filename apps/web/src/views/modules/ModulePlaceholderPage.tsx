import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { ArrowLeft, Construction, Milestone, Layers, Calendar, CheckCircle } from 'lucide-react';

const mockDetails: Record<string, { title: string; subtitle: string; desc: string; steps: string[] }> = {
  accounting: {
    title: 'Financial Accounting',
    subtitle: 'General Ledger & Double-Entry Accounting System',
    desc: 'Core double-entry bookkeeping module to track journal vouchers, trial balances, accounts payable, accounts receivable, and generate balance sheets and profit & loss statements.',
    steps: ['Multi-currency general ledger ledger rules setup', 'Chart of accounts tree configuration', 'P&L and Balance Sheet financial statements builder']
  },
  expenses: {
    title: 'Expense Management',
    subtitle: 'Employee Claims & Corporate Spend Trackers',
    desc: 'Allows employees to submit corporate expenses, attach receipts, process reimbursement requests, and automatically post updates to payroll.',
    steps: ['Mobile OCR receipt scanner parsing OCR data', 'Automated corporate spending policy checks', 'Manager multi-level approvals mapping']
  },
  invoicing: {
    title: 'Billing & Invoicing',
    subtitle: 'Customer Invoices & Payments Reconciliation',
    desc: 'Generates recurring tax invoices, monitors credit terms, integrates with payment gateways, and automates payment reminders.',
    steps: ['Tax invoicing generation with custom templates', 'Recurring customer subscription billing', 'Payment gateway integration (Stripe, Razorpay)']
  },
  budgeting: {
    title: 'Budgeting & Cost Centers',
    subtitle: 'Capital allocation & department budgets',
    desc: 'Establish cost centers, allocate department budgets, track variance analytics, and verify budget control limits during purchase dispatches.',
    steps: ['Department allocation sheets setup', 'Variance analysis & actual vs budget analytics', 'Overdraft alert thresholds config']
  },
  tax: {
    title: 'Tax & Compliance Management',
    subtitle: 'Local Sales Tax, VAT & Corporate Tax Filing',
    desc: 'Calculate tax liabilities, map local tax rates, prepare filings, and audit compliance logs.',
    steps: ['Tax brackets setup per region', 'Automated sales tax liability logs', 'Regulatory compliance audit logs exporting']
  },
  leads: {
    title: 'Leads & Pipeline Management',
    subtitle: 'CRM Opportunity Tracking & Funnel Analytics',
    desc: 'Track sales leads, rate opportunities, schedule calls, log client communications, and monitor funnel conversion metrics.',
    steps: ['Lead capture form builder', 'Pipeline drag-and-drop stage manager', 'Automated follow-up activity reminders']
  },
  customers: {
    title: 'Customer Directory',
    subtitle: 'Customer Accounts & Communication Logs',
    desc: 'Centralized repository of active corporate customers, purchase history logs, support tickets, and key contact details.',
    steps: ['Corporate account profiles directory', 'Activity timeline aggregation', 'Customer lifetime value calculation (CLV)']
  },
  quotations: {
    title: 'CRM Quotations & Estimations',
    subtitle: 'Proforma Invoices & Quotations Builder',
    desc: 'Create, edit, and send professional quotations to prospective clients. Set validity dates and follow up triggers.',
    steps: ['Dynamic estimation lines builder', 'PDF generation & emailing clients', 'Revision history log check']
  },
  orders: {
    title: 'Sales Orders Management',
    subtitle: 'Customer Purchase Orders Processing',
    desc: 'Process confirmed client orders, trigger inventory stock reservations, and dispatch orders to logistics.',
    steps: ['Sales order generation from quotations', 'Inventory stock allocation check', 'Dispatch workflow activation']
  },
  'follow-ups': {
    title: 'Sales Follow Ups & Tasks',
    subtitle: 'CRM Reminders & Next Action Items',
    desc: 'Log phone call logs, set reminders for sales reps, and schedule automated followup emails to conversion prospects.',
    steps: ['Rep dashboard calendar scheduling', 'Email templating automation', 'Deal conversion prediction analysis']
  },
  warehouse: {
    title: 'Warehouse & Bin Configurations',
    subtitle: 'Multi-Location Spatial Grid Layouts',
    desc: 'Define warehouse dimensions, configure aisles and bins layout, manage transfer orders, and track zone metrics.',
    steps: ['Warehouse 2D structural grid layout builder', 'Bin capacity and zone constraints', 'Inter-warehouse transfer logistics']
  },
  'purchase-orders': {
    title: 'Purchase Orders',
    subtitle: 'Supplier Procurement Requests Builder',
    desc: 'Create purchase requisitions, approve vendor orders, automatically receive inbound goods, and verify invoices.',
    steps: ['RFQ request flow with dynamic lines', 'Purchase order approval routing', 'Goods Receipt Note (GRN) matching']
  },
  suppliers: {
    title: 'Supplier Portal & Contacts',
    subtitle: 'Supplier Registry & SLA Agreements',
    desc: 'Directory of suppliers, pricing agreements, delivery time ratings, and compliance checks.',
    steps: ['Supplier directory list', 'Pricing contracts registry', 'Vendor scorecard evaluations']
  },
  'stock-movement': {
    title: 'Stock Movements & Adjustments',
    subtitle: 'Inventory Audit Trails & Transfers Log',
    desc: 'Track internal stock movements, execute inventory audits, write off damaged goods, and verify ledger valuation.',
    steps: ['Aisle to aisle stock movement logging', 'Physical count variance logs', 'Damaged goods write-off workflows']
  },
  projects: {
    title: 'Projects Dashboard',
    subtitle: 'Enterprise Project Management & Gantt Tracks',
    desc: 'Organize project boards, define scope constraints, monitor cost allocation, and manage project health metrics.',
    steps: ['Interactive Gantt chart views', 'Project health metrics dashboards', 'Cross-project cost tracking reports']
  },
  tasks: {
    title: 'Tasks & Kanban Boards',
    subtitle: 'Agile Project Tracking & Task Cards',
    desc: 'Assign task cards, set priorities, manage Kanban boards, track work item dependencies, and log completions.',
    steps: ['Drag-and-drop Kanban interface', 'Task dependency hierarchy trees', 'Sub-task checklist generation']
  },
  timesheets: {
    title: 'Employee Timesheets',
    subtitle: 'Project Billing Hours Tracking',
    desc: 'Log hours worked on individual project tasks, assign billable rates, and process client billing statements.',
    steps: ['Daily and weekly timesheet logs', 'Timesheet approvals routing', 'Client billable rate calculation']
  },
  milestones: {
    title: 'Project Milestones & Delivery',
    subtitle: 'Key Project Deliverables Schedule',
    desc: 'Create key phase delivery dates, tie milestones to invoice rules, and track release approvals.',
    steps: ['Milestone calendar planner', 'Milestone completion triggers billing', 'Release verification logs']
  },
  'workflow-automation': {
    title: 'Workflow Automation Builder',
    subtitle: 'System Actions & BPMN Rule Builder',
    desc: 'Define no-code conditional rules (triggers, conditions, actions) to automate operations across all modules.',
    steps: ['Conditional action trigger builder', 'Multi-module API webhooks configuration', 'Scheduled batch action scripts']
  },
  dashboards: {
    title: 'Executive Dashboards',
    subtitle: 'BI Insights & Live Operation Centers',
    desc: 'Configure real-time monitoring graphs, compile operational metrics, and customize executive layouts.',
    steps: ['Custom graph component widgets library', 'Role-based layout templates builder', 'Real-time database stream updates']
  },
  bi: {
    title: 'Business Intelligence & AI Analytics',
    subtitle: 'Predictive Forecasting & Modeling',
    desc: 'Leverage machine learning models to forecast cashflow, predict inventory shortages, and evaluate recruitment success.',
    steps: ['Predictive regression modeling widgets', 'Ad-hoc query reports builder', 'AI dashboard summary generator']
  },
  users: {
    title: 'User Management Portal',
    subtitle: 'System Users & Account Control',
    desc: 'Manage portal user profiles, toggle active access states, track device logs, and reset security credentials.',
    steps: ['User profile creation list', 'Device location audit check', 'Password policy config rules']
  },
  permissions: {
    title: 'Roles & RBAC Permissions Matrix',
    subtitle: 'Enterprise Security Policy Panel',
    desc: 'Define fine-grained roles (e.g. Finance Auditor, SCM Clerk) and control read/write rights across API routes.',
    steps: ['Role definition creator', 'Field-level access control checkbox grids', 'Inherited permissions tree']
  },
  'company-settings': {
    title: 'Company Profile & Structure',
    subtitle: 'Legal Entities & Department Maps',
    desc: 'Configure global legal entities, registered tax codes, currency rules, and the corporate organization tree.',
    steps: ['Multiple subsidiary company settings', 'Default currency and timezone rules', 'Department hierarchy organization chart']
  },
  integrations: {
    title: 'Integrations & External APIs',
    subtitle: 'Third-Party Webhooks & Connectors',
    desc: 'Configure connectors for external services (Salesforce, QuickBooks, Slack, Stripe) and monitor API metrics.',
    steps: ['OAuth application registry panels', 'Webhooks endpoints listener setup', 'API rate limit logs charts']
  }
};

export default function ModulePlaceholderPage() {
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const activeKey = moduleKey || 'accounting';
  const info = mockDetails[activeKey] || mockDetails.accounting;

  return (
    <PageContainer>
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        {/* Back Link */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-ag-primary hover:text-ag-primary-dark transition-colors">
          <ArrowLeft size={16} />
          Back to Enterprise Dashboard
        </Link>

        {/* Hero Card */}
        <Card className="relative overflow-hidden border border-ag-border bg-ag-surface p-8 rounded-2xl shadow-xl">
          {/* Glassmorphic decorative grid */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-ag-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-ag-accent-coral/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-ag-primary-light flex items-center justify-center text-ag-primary flex-shrink-0">
              <Construction size={32} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-ag-ink tracking-tight">{info.title}</h1>
                <span className="px-2.5 py-1 text-[11px] font-bold bg-ag-accent-coral/10 text-ag-accent-coral border border-ag-accent-coral/20 rounded-full uppercase tracking-wider">
                  Planned Module
                </span>
              </div>
              <p className="text-sm font-medium text-ag-ink-2 mt-1">{info.subtitle}</p>
            </div>
          </div>

          <p className="text-sm text-ag-ink-2 leading-relaxed bg-ag-surface-2/40 p-5 rounded-xl border border-ag-border-light mb-8">
            {info.desc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Implementation Pipeline Checklist */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-ag-ink uppercase tracking-wider flex items-center gap-2">
                <Milestone size={14} className="text-ag-primary" />
                Scheduled Release Checklist
              </h3>
              <div className="space-y-3">
                {info.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-ag-ink-2">
                    <span className="w-5 h-5 rounded bg-ag-surface-2 border border-ag-border flex items-center justify-center font-bold text-ag-ink flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="mt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Metrics */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-ag-ink uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-ag-accent-coral" />
                Planned Specifications
              </h3>
              <div className="space-y-3 bg-ag-surface-2/30 p-4 rounded-xl border border-ag-border-light">
                <div className="flex items-center justify-between text-xs border-b border-ag-border-light pb-2">
                  <span className="font-semibold text-ag-ink-3">Database Layer</span>
                  <span className="font-mono text-ag-ink">PostgreSQL / Alembic</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-ag-border-light pb-2">
                  <span className="font-semibold text-ag-ink-3">Security Level</span>
                  <span className="font-mono text-ag-ink">RBAC Multi-Tenant Scoping</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="font-semibold text-ag-ink-3">Target Scope</span>
                  <span className="font-mono text-ag-ink">WorkSphere Finance / Sales</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

