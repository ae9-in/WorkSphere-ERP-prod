import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Modal } from '@/components/ui/Modal/Modal';
import { payrollService, employeeService } from '@/services/api.service';
import { PayrollRun } from '@/types/payroll.types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus, ArrowsClockwise, Coins, Receipt, Lock, Clock, Calendar, Check, X,
  FileText, TrendUp, Warning, Info, CheckCircle, QrCode, Signature, FilePdf,
  ShieldCheck, FileArrowDown, ArrowLeft
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar/Avatar';

const COMPLIANCE_DATES = [
  { id: 'c1', title: 'PF ECR Returns Filing', date: '2026-08-15', daysLeft: 28, status: 'pending' },
  { id: 'c2', title: 'ESI Monthly Return contribution', date: '2026-08-15', daysLeft: 28, status: 'pending' },
  { id: 'c3', title: 'TDS Quarterly return filing (Q1)', date: '2026-07-31', daysLeft: 13, status: 'urgent' },
  { id: 'c4', title: 'Professional Tax (PT) monthly payout', date: '2026-07-20', daysLeft: 2, status: 'urgent' }
];

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab View
  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'revisions' | 'reimbursements' | 'loans' | 'tax_compliance' | 'ledger'>('overview');

  // Form states
  const [showCreateRun, setShowCreateRun] = useState(false);
  const [newRunMonth, setNewRunMonth] = useState('7');
  const [newRunYear, setNewRunYear] = useState('2026');

  // Revision Form States
  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignStructId, setAssignStructId] = useState('');
  const [assignCtc, setAssignCtc] = useState('850000');
  const [assignDate, setAssignDate] = useState('2026-07-01');

  // Loan Form States
  const [loanEmpId, setLoanEmpId] = useState('');
  const [loanPrincipal, setLoanPrincipal] = useState('50000');
  const [loanEmi, setLoanEmi] = useState('8500');
  const [loanInst, setLoanInst] = useState('6');
  const [loanReason, setLoanReason] = useState('');

  // Reimbursement Form States
  const [reimbCategory, setReimbCategory] = useState('travel');
  const [reimbAmount, setReimbAmount] = useState('2000');
  const [reimbReason, setReimbReason] = useState('');

  // Selected employee for payslip view
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<any | null>(null);
  const [activeRunPeriod, setActiveRunPeriod] = useState<string>('July 2026');

  // Workflow steps tracking
  const [workflowStage, setWorkflowStage] = useState<number>(3); // 1 to 9 representing current processing steps

  // Fetch all database records
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [runsData, structData, empData, loansData, reimbsData, ledgerData] = await Promise.all([
        payrollService.getRuns(),
        payrollService.getStructures(),
        employeeService.list({ limit: 100 }),
        payrollService.listLoans(),
        payrollService.listReimbursements(),
        payrollService.listLedgers()
      ]);
      setRuns(runsData);
      setStructures(structData);
      setEmployees(empData.employees);
      setLoans(loansData);
      setReimbursements(reimbsData);
      setLedgers(ledgerData);
    } catch {
      toast.error('Failed to sync payroll database logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Actions
  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollService.createRun(parseInt(newRunMonth), parseInt(newRunYear));
      toast.success('Draft payroll run cycle created successfully.');
      setShowCreateRun(false);
      fetchAllData();
      setActiveTab('runs');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create run.');
    }
  };

  const handleProcessRun = async (id: string, recalculate = false) => {
    try {
      if (recalculate) {
        await payrollService.recalculateRun(id);
        toast.info('Recalculation started. Processing attendance, leaves, and loans.');
      } else {
        await payrollService.processRun(id);
        toast.info('Salary processing worker dispatched.');
        setWorkflowStage(6);
      }
      setTimeout(() => {
        fetchAllData();
      }, 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Processing dispatch error.');
    }
  };

  const handleApproveRun = async (id: string) => {
    try {
      await payrollService.approveRun(id);
      toast.success('Payroll run calculation verified and approved.');
      setWorkflowStage(8);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Approval request failed.');
    }
  };

  const handleLockRun = async (id: string) => {
    try {
      await payrollService.lockRun(id);
      toast.success('Payroll locked and disbursed. Payslips published and ledgers committed.');
      setWorkflowStage(9);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Disbursement lock failed.');
    }
  };

  const handleReopenRun = async (id: string) => {
    try {
      await payrollService.reopenRun(id);
      toast.success('Period unlocked. Run reverted to draft state.');
      setWorkflowStage(3);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Unlock failed.');
    }
  };

  const handleAssignSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmpId || !assignCtc || !assignDate) {
      toast.error('Specify employee, CTC, and effective date.');
      return;
    }
    try {
      await payrollService.assignSalary({
        employeeId: assignEmpId,
        structureId: assignStructId || undefined,
        ctc: parseFloat(assignCtc),
        effectiveDate: assignDate
      });
      toast.success('Salary package successfully revisioned.');
      setAssignEmpId('');
      setAssignStructId('');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to assign salary.');
    }
  };

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanEmpId || !loanPrincipal || !loanEmi) {
      toast.error('Fill in all required fields.');
      return;
    }
    try {
      await payrollService.requestLoan({
        employeeId: loanEmpId,
        principalAmount: parseFloat(loanPrincipal),
        emiAmount: parseFloat(loanEmi),
        installments: parseInt(loanInst),
        reason: loanReason
      });
      toast.success('Loan application submitted.');
      setLoanEmpId('');
      setLoanReason('');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Loan submission failed.');
    }
  };

  const handleApproveLoan = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await payrollService.approveLoan(id, status);
      toast.success(`Loan status marked as ${status}.`);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Approval toggle failed.');
    }
  };

  const handleRequestReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reimbAmount || !reimbReason) {
      toast.error('Fill in claim amount and reason.');
      return;
    }
    try {
      await payrollService.requestReimbursement({
        category: reimbCategory,
        amount: parseFloat(reimbAmount),
        reason: reimbReason
      });
      toast.success('Expense claim reimbursement submitted.');
      setReimbReason('');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Claim submission failed.');
    }
  };

  const handleApproveReimbursement = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await payrollService.approveReimbursement(id, status);
      toast.success(`Expense claim ${status}.`);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Reimbursement processing failed.');
    }
  };

  // YTD financial metrics calculations
  const ytdNetPay = runs.filter(r => ['paid', 'approved', 'completed'].includes(r.status)).reduce((s, r) => s + (r.totalNetPay ?? 0), 0);
  const ytdGross = runs.filter(r => ['paid', 'approved', 'completed'].includes(r.status)).reduce((s, r) => s + (r.totalGross ?? 0), 0);
  const ytdDeductions = runs.filter(r => ['paid', 'approved', 'completed'].includes(r.status)).reduce((s, r) => s + (r.totalDeductions ?? 0), 0);

  // Column definitions
  const runsColumns: ColumnDef<PayrollRun>[] = [
    {
      accessorKey: 'period',
      header: 'Pay Period',
      cell: ({ row }) => <span className="font-bold text-ag-ink text-sm">{row.original.period}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'totalEmployees',
      header: 'Employees Processed',
      cell: ({ row }) => <span className="font-medium text-ag-ink-2">{row.original.totalEmployees}</span>,
    },
    {
      accessorKey: 'totalGross',
      header: 'Gross Payroll',
      cell: ({ row }) => <span className="font-mono text-xs text-ag-ink-2">{formatCurrency(row.original.totalGross)}</span>,
    },
    {
      accessorKey: 'totalDeductions',
      header: 'Deductions Sum',
      cell: ({ row }) => <span className="font-mono text-xs text-ag-accent-pink">-{formatCurrency(row.original.totalDeductions)}</span>,
    },
    {
      accessorKey: 'totalNetPay',
      header: 'Net Salaries Pay',
      cell: ({ row }) => <span className="font-mono text-sm font-black text-ag-primary">{formatCurrency(row.original.totalNetPay)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions / Publications',
      cell: ({ row }) => {
        const r = row.original;
        if (r.status === 'draft') {
          return (
            <Button size="sm" onClick={() => handleProcessRun(r._id)}>
              Process Run
            </Button>
          );
        }
        if (r.status === 'processing') {
          return <span className="text-xs text-ag-amber font-semibold animate-pulse">Processing...</span>;
        }
        if (r.status === 'completed') {
          return (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="text-xs" onClick={() => handleProcessRun(r._id, true)}>
                Recalculate
              </Button>
              <Button size="sm" className="text-xs" onClick={() => handleApproveRun(r._id)}>
                Approve Run
              </Button>
            </div>
          );
        }
        if (r.status === 'approved') {
          return (
            <Button size="sm" onClick={() => handleLockRun(r._id)}>
              Disburse & Pay
            </Button>
          );
        }
        if (r.status === 'paid') {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() => {
                  setActiveRunPeriod(r.period);
                  if (employees.length > 0) {
                    setSelectedPayslipEmp(employees[0]);
                  } else {
                    toast.info('No employee profiles found to map payslip.');
                  }
                }}
              >
                Generate Payslips
              </Button>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleReopenRun(r._id)}>
                Reopen
              </Button>
            </div>
          );
        }
        return <span className="text-xs text-ag-ink-3 font-semibold">—</span>;
      }
    }
  ];

  // Helper selectors for layout contexts
  const revisionSelectedEmp = employees.find(e => e._id === assignEmpId);
  const loanSelectedEmp = employees.find(e => e._id === loanEmpId);

  // Real-time calculations helper based on typed revised CTC
  const calculatedCtcNum = parseFloat(assignCtc || '0');
  const calcBasic = Math.round(calculatedCtcNum * 0.5);
  const calcHra = Math.round(calculatedCtcNum * 0.3);
  const calcAllowance = Math.round(calculatedCtcNum * 0.2);
  const calcEmployerPf = Math.round(calcBasic * 0.12);
  const calcEmployeePf = Math.round(calcBasic * 0.12);
  const calcPt = 2400; // Standard annual professional tax slab
  const calcTds = Math.round(calculatedCtcNum * 0.05); // 5% flat TDS projection
  const calcMonthlyGross = Math.round(calculatedCtcNum / 12);
  const calcMonthlyNet = Math.round((calculatedCtcNum - calcEmployeePf - calcPt - calcTds) / 12);

  return (
    <PageContainer
      title="Enterprise Payroll Workspace"
      subtitle="Configure templates, revision CTC packages, approve expense reimbursements, process monthly cycles, and commit finance ledgers."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fetchAllData} icon={<ArrowsClockwise size={18} />}>Refresh</Button>
          <Button onClick={() => setShowCreateRun(!showCreateRun)} icon={<Plus size={18} />}>Create Run Cycle</Button>
        </div>
      }
    >
      {/* Create Cycle modal card */}
      {showCreateRun && (
        <Card className="p-5 max-w-md mb-8 border border-ag-border/70">
          <h3 className="font-display font-bold text-base text-ag-ink mb-4 border-b border-ag-border pb-2">
            Create Monthly Run Cycle
          </h3>
          <form onSubmit={handleCreateRun} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target Month"
                value={newRunMonth}
                onChange={e => setNewRunMonth(e.target.value)}
                options={[
                  { value: '1', label: 'January' },
                  { value: '2', label: 'February' },
                  { value: '3', label: 'March' },
                  { value: '4', label: 'April' },
                  { value: '5', label: 'May' },
                  { value: '6', label: 'June' },
                  { value: '7', label: 'July' },
                  { value: '8', label: 'August' },
                  { value: '9', label: 'September' },
                  { value: '10', label: 'October' },
                  { value: '11', label: 'November' },
                  { value: '12', label: 'December' }
                ]}
              />
              <Input
                label="Target Year"
                type="number"
                required
                value={newRunYear}
                onChange={e => setNewRunYear(e.target.value)}
              />
            </div>
            <Button type="submit">Initialize Draft</Button>
          </form>
        </Card>
      )}

      {/* Tabs navigation */}
      <div className="flex gap-1.5 p-1 bg-ag-surface-2 border border-ag-border rounded-xl w-fit shrink-0 scrollbar-none mb-8 overflow-x-auto max-w-full">
        {[
          { id: 'overview', label: 'Overview Financials', icon: <Coins size={15} /> },
          { id: 'runs', label: 'Payroll Runs', icon: <Lock size={15} /> },
          { id: 'revisions', label: 'Salary Revisions', icon: <Calendar size={15} /> },
          { id: 'reimbursements', label: 'Reimbursements', icon: <Receipt size={15} /> },
          { id: 'loans', label: 'Employee Loans', icon: <Clock size={15} /> },
          { id: 'tax_compliance', label: 'Tax & Compliance', icon: <ShieldCheck size={15} /> },
          { id: 'ledger', label: 'Disbursement Ledger', icon: <FileText size={15} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-ag-primary text-white shadow-sm'
                : 'text-ag-ink-3 hover:text-ag-ink-2 hover:bg-ag-surface'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ==========================================
          TAB 1: OVERVIEW DASHBOARD
          ========================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-4 flex items-center gap-4 bg-white border border-ag-border/60">
              <div className="p-3 bg-ag-primary-light text-ag-primary rounded-xl shrink-0">
                <Coins size={22} />
              </div>
              <div>
                <span className="text-[10px] text-ag-ink-3 font-black uppercase tracking-wider block">Gross Salaries (YTD)</span>
                <span className="text-lg font-black text-ag-ink mt-0.5 block">{isLoading ? '—' : formatCurrency(ytdGross)}</span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white border border-ag-border/60">
              <div className="p-3 bg-[#E6FAF4] text-ag-mint rounded-xl shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="text-[10px] text-ag-ink-3 font-black uppercase tracking-wider block">Net Disbursed (YTD)</span>
                <span className="text-lg font-black text-ag-ink mt-0.5 block">{isLoading ? '—' : formatCurrency(ytdNetPay)}</span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white border border-ag-border/60">
              <div className="p-3 bg-ag-accent-pink-light text-ag-accent-pink rounded-xl shrink-0">
                <Warning size={22} />
              </div>
              <div>
                <span className="text-[10px] text-ag-ink-3 font-black uppercase tracking-wider block">Statutory Deductions</span>
                <span className="text-lg font-black text-ag-ink mt-0.5 block">{isLoading ? '—' : formatCurrency(ytdDeductions)}</span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white border border-ag-border/60">
              <div className="p-3 bg-[#FFF8E6] text-ag-amber rounded-xl shrink-0">
                <Receipt size={22} />
              </div>
              <div>
                <span className="text-[10px] text-ag-ink-3 font-black uppercase tracking-wider block">Pending Claims</span>
                <span className="text-lg font-black text-ag-ink mt-0.5 block">
                  {reimbursements.filter(r => r.status === 'pending').length} Claim(s)
                </span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5">
                <CardHeader title="Salary Run Processing Steps" subtitle="Visual roadmap tracking period calculation stages." />
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mt-6 overflow-x-auto pb-2 scrollbar-none">
                  {[
                    { step: 1, label: 'Attendance Lock' },
                    { step: 2, label: 'Leaves Calc' },
                    { step: 3, label: 'Overtime Logs' },
                    { step: 4, label: 'Claims Added' },
                    { step: 5, label: 'Loan EMIs' },
                    { step: 6, label: 'Taxes Filed' },
                    { step: 7, label: 'Draft Cycle' },
                    { step: 8, label: 'Approve Lock' },
                    { step: 9, label: 'Payslips Issued' }
                  ].map((stepObj) => {
                    const isDone = workflowStage >= stepObj.step;
                    return (
                      <div key={stepObj.step} className="flex md:flex-col items-center gap-2 shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                          isDone
                            ? 'bg-ag-primary border-ag-primary text-white shadow'
                            : 'bg-ag-surface-2 border-ag-border text-ag-ink-3'
                        }`}>
                          {stepObj.step}
                        </div>
                        <span className={`text-[10px] font-bold ${isDone ? 'text-ag-primary' : 'text-ag-ink-3'}`}>
                          {stepObj.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <CardHeader title="Recent Salary revision changes" subtitle="Assigned employee CTC revisions history." />
                <div className="p-4 space-y-3">
                  {employees.slice(0, 3).map((emp, idx) => (
                    <div key={idx} className="p-3.5 border border-ag-border rounded-xl flex items-center justify-between hover:border-ag-border-strong bg-white text-xs gap-4">
                      <div>
                        <h4 className="font-bold text-ag-ink">{emp.fullName}</h4>
                        <p className="text-ag-ink-3 text-[11px] mt-0.5">
                          Grade: {emp.job.designationName} · Effective: July 01, 2026
                        </p>
                      </div>
                      <span className="font-mono font-bold text-ag-mint">
                        ₹{(emp.job.annualCtc || 850000).toLocaleString('en-IN')}/yr
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-5">
                <CardHeader title="Compliance Calendar Due Dates" subtitle="Statutory returns filing registry." />
                <div className="space-y-3.5 mt-4">
                  {COMPLIANCE_DATES.map((comp) => (
                    <div key={comp.id} className="p-3 border border-ag-border rounded-xl bg-white text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-ag-ink">{comp.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                          comp.status === 'urgent' ? 'bg-ag-coral-light/20 text-ag-coral animate-pulse' : 'bg-[#FFF8E6] text-ag-amber'
                        }`}>
                          {comp.daysLeft} days left
                        </span>
                      </div>
                      <p className="text-ag-ink-3 text-[10px] font-semibold mt-1">Due Date: {formatDate(comp.date)}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 bg-[#FFF8E6] border border-ag-amber/30">
                <div className="flex gap-3">
                  <Warning size={20} className="text-ag-amber shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-ag-ink text-xs">Payroll Locks Verification</h4>
                    <p className="text-[11px] text-ag-ink-3 mt-1.5 leading-relaxed">
                      Confirm Bank Account Number and Routing IFSC details for all revisioned templates before locks. Ledger rollbacks are irreversible.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: PAYROLL RUNS
          ========================================== */}
      {activeTab === 'runs' && (
        <Card>
          <CardHeader title="Historical Monthly Run Cycles" subtitle="Verification check of monthly CTC disbursements." />
          <DataTable
            columns={runsColumns}
            data={runs}
            isLoading={isLoading}
            emptyTitle="Run Logs Empty"
            emptySubtitle="Click 'Create Run Cycle' above to trigger drafts."
          />
        </Card>
      )}

      {/* ==========================================
          TAB 3: SALARY REVISIONS (THREE-PANEL LAYOUT)
          ========================================== */}
      {activeTab === 'revisions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          
          {/* Left Actions Panel (35% width -> col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5">
              <h3 className="font-display font-black text-sm text-ag-ink border-b border-ag-border pb-3 mb-4">
                Salary Revision Form
              </h3>
              <form onSubmit={handleAssignSalary} className="space-y-4">
                <Select
                  label="Target Employee"
                  value={assignEmpId}
                  onChange={e => setAssignEmpId(e.target.value)}
                  options={[
                    { value: '', label: 'Choose employee...' },
                    ...employees.map(e => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }))
                  ]}
                  required
                />
                <Select
                  label="Salary Template Structure"
                  value={assignStructId}
                  onChange={e => setAssignStructId(e.target.value)}
                  options={[
                    { value: '', label: 'Percentage-Based fallback Structure' },
                    ...structures.map(s => ({ value: s._id, label: s.name }))
                  ]}
                />
                <Input
                  label="Revised Gross Annual CTC (INR)"
                  type="number"
                  value={assignCtc}
                  onChange={e => setAssignCtc(e.target.value)}
                  required
                />
                <Input
                  label="Revision Effective Date"
                  type="date"
                  value={assignDate}
                  onChange={e => setAssignDate(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">Reason for Revision</label>
                  <textarea
                    placeholder="e.g. Year-end appraisal increment / promotion correction"
                    className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-xs focus:outline-none"
                    rows={2}
                    required
                  />
                </div>
                <Button type="submit">Assign revision package</Button>
              </form>
            </Card>
          </div>

          {/* Center Workspace Panel (40% width -> col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-5">
              <h3 className="font-display font-black text-sm text-ag-ink border-b border-ag-border pb-3 mb-4">
                Real-Time Salary Preview Calculator
              </h3>
              <p className="text-xs text-ag-ink-3 mt-1.5">Real-time projection breakdown matching India Income Tax guidelines.</p>

              <div className="space-y-3.5 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-ag-border">
                  <div>
                    <span className="text-[10px] text-ag-ink-3 block">Monthly Gross CTC</span>
                    <strong className="text-sm font-mono text-ag-ink">₹{calcMonthlyGross.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ag-ink-3 block">Est. Take Home Monthly</span>
                    <strong className="text-sm font-mono text-ag-primary">₹{calcMonthlyNet.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Basic Pay (50%)</span>
                    <span className="font-mono">₹{calcBasic.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">House Rent Allowance (HRA - 30%)</span>
                    <span className="font-mono">₹{calcHra.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Special Allowance (20%)</span>
                    <span className="font-mono">₹{calcAllowance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-ag-coral">
                    <span className="font-semibold">Employer PF (12%)</span>
                    <span className="font-mono">-₹{calcEmployerPf.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-ag-coral">
                    <span className="font-semibold">Employee PF (12%)</span>
                    <span className="font-mono">-₹{calcEmployeePf.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-ag-coral">
                    <span className="font-semibold">Professional Tax (PT)</span>
                    <span className="font-mono">-₹200</span>
                  </div>
                  <div className="flex justify-between text-ag-coral">
                    <span className="font-semibold">Income Tax TDS projection</span>
                    <span className="font-mono">-₹{calcTds.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Context Panel (25% width -> col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            {revisionSelectedEmp ? (
              <Card className="p-5 space-y-4">
                <div className="flex flex-col items-center text-center pb-3 border-b border-ag-border/50">
                  <Avatar name={revisionSelectedEmp.fullName} src={revisionSelectedEmp.personal.photo} size="lg" />
                  <h4 className="font-display font-black text-sm text-ag-ink mt-2">{revisionSelectedEmp.fullName}</h4>
                  <span className="text-[10px] text-ag-ink-3">{revisionSelectedEmp.job?.designationName}</span>
                </div>

                <div className="space-y-2 text-[10px] text-ag-ink-3">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <strong className="text-ag-ink">{revisionSelectedEmp.job?.departmentName || 'Engineering'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Joining Date:</span>
                    <strong className="text-ag-ink">{new Date(revisionSelectedEmp.official?.dateOfJoining).toLocaleDateString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Annual CTC:</span>
                    <strong className="text-ag-primary">₹{(revisionSelectedEmp.job?.annualCtc || 800000).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-xs text-ag-ink-3 bg-ag-surface/20">
                Choose an employee from the dropdown list to view revision summaries and profiles.
              </Card>
            )}

            <Card className="p-5">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-2">Revision Guidelines</h4>
              <p className="text-[10px] text-ag-ink-3 leading-relaxed">
                Appraisals require signoff approval from the Department Head. TDS projections assume the New Tax Regime rules.
              </p>
            </Card>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 4: REIMBURSEMENTS (THREE-PANEL LAYOUT)
          ========================================== */}
      {activeTab === 'reimbursements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          
          {/* Left Actions Panel (35% width -> col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5">
              <h3 className="font-display font-black text-sm text-ag-ink border-b border-ag-border pb-3 mb-4">
                Claim Reimbursement Form
              </h3>
              <form onSubmit={handleRequestReimbursement} className="space-y-4">
                <Select
                  label="Expense Category"
                  value={reimbCategory}
                  onChange={e => setReimbCategory(e.target.value)}
                  options={[
                    { value: 'travel', label: 'Travel Expenses' },
                    { value: 'food', label: 'Meals & Food' },
                    { value: 'medical', label: 'Medical Claims' },
                    { value: 'mobile', label: 'Mobile & Internet Bills' },
                    { value: 'other', label: 'Other Miscellaneous' }
                  ]}
                />
                <Input
                  label="Claim Amount (INR)"
                  type="number"
                  value={reimbAmount}
                  onChange={e => setReimbAmount(e.target.value)}
                  required
                />
                <Input
                  label="Reason / Remarks"
                  placeholder="Specify bill invoice details..."
                  value={reimbReason}
                  onChange={e => setReimbReason(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">Receipt Upload (Mock PDF/JPEG)</label>
                  <Button variant="secondary" size="sm" type="button" icon={<FileArrowDown size={14} />}>
                    Attach Receipt File
                  </Button>
                </div>
                <Button type="submit">Submit Expense Receipt</Button>
              </form>
            </Card>
          </div>

          {/* Center Workspace Panel (40% width -> col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader title="Expense Claims Workspace" subtitle="Approve/reject submitted receipts before run cycles." />
              <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto">
                {reimbursements.map(r => (
                  <div key={r.id} className="p-3.5 border border-ag-border rounded-xl flex items-center justify-between bg-white text-xs hover:border-ag-border-strong transition-all">
                    <div>
                      <h4 className="font-black text-ag-ink">{r.employeeName} — {r.category.toUpperCase()}</h4>
                      <p className="text-[10px] text-ag-ink-3 mt-1 font-semibold">Reason: {r.reason}</p>
                      <span className="text-[9px] text-ag-ink-3 block mt-0.5">Filed: {r.claimDate}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-ag-primary">₹{r.amount}</span>
                      {r.status === 'pending' ? (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => handleApproveReimbursement(r.id, 'rejected')} icon={<X size={12} />} />
                          <Button size="sm" onClick={() => handleApproveReimbursement(r.id, 'approved')} icon={<Check size={12} />} />
                        </div>
                      ) : (
                        <StatusBadge status={r.status} />
                      )}
                    </div>
                  </div>
                ))}
                {reimbursements.length === 0 && (
                  <div className="text-center py-6 text-xs text-ag-ink-3">No claims filed.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Context Panel (25% width -> col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-5 text-xs space-y-3">
              <h4 className="font-bold text-ag-ink uppercase tracking-wider block border-b pb-1.5">Claim Statistics (YTD)</h4>
              <div className="flex justify-between">
                <span className="text-ag-ink-3">Approved Claims:</span>
                <strong className="text-ag-mint">
                  ₹{reimbursements.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0).toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-ag-ink-3">Pending Audits:</span>
                <strong className="text-ag-amber">
                  {reimbursements.filter(r => r.status === 'pending').length} items
                </strong>
              </div>
            </Card>

            <Card className="p-5">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-2">Reimbursement Policy</h4>
              <p className="text-[10px] text-ag-ink-3 leading-relaxed">
                Claims must be submitted within 30 days of expense occurrence. Receipts are mandatory for claims above ₹500.
              </p>
            </Card>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 5: EMPLOYEE LOANS (THREE-PANEL LAYOUT)
          ========================================== */}
      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          
          {/* Left Actions Panel (35% width -> col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5">
              <h3 className="font-display font-black text-sm text-ag-ink border-b border-ag-border pb-3 mb-4">
                Request Personal Loan Form
              </h3>
              <form onSubmit={handleRequestLoan} className="space-y-4">
                <Select
                  label="Select Employee"
                  value={loanEmpId}
                  onChange={e => setLoanEmpId(e.target.value)}
                  options={[
                    { value: '', label: 'Choose employee...' },
                    ...employees.map(e => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }))
                  ]}
                  required
                />
                <Input
                  label="Principal Amount (INR)"
                  type="number"
                  value={loanPrincipal}
                  onChange={e => setLoanPrincipal(e.target.value)}
                  required
                />
                <Input
                  label="Monthly EMI (INR)"
                  type="number"
                  value={loanEmi}
                  onChange={e => setLoanEmi(e.target.value)}
                  required
                />
                <Input
                  label="Installments (Months)"
                  type="number"
                  value={loanInst}
                  onChange={e => setLoanInst(e.target.value)}
                  required
                />
                <Input
                  label="Reason / Purpose"
                  placeholder="Specify loan description..."
                  value={loanReason}
                  onChange={e => setLoanReason(e.target.value)}
                  required
                />
                <Button type="submit">Submit Loan Form</Button>
              </form>
            </Card>
          </div>

          {/* Center Workspace Panel (40% width -> col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader title="Outstanding Loans & EMI Tracks" subtitle="Recovery summaries locked inside the ledger database." />
              <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto">
                {loans.map(l => (
                  <div key={l.id} className="p-4 border border-ag-border rounded-xl space-y-3 bg-white text-xs hover:border-ag-border-strong transition-all">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-ag-ink">{l.employeeName}</h4>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center pt-2 border-t border-ag-border/50 text-[10px]">
                      <div>
                        <span className="text-ag-ink-3 block">Principal</span>
                        <b className="font-mono text-xs text-ag-ink-2">₹{l.principalAmount}</b>
                      </div>
                      <div>
                        <span className="text-ag-ink-3 block">Monthly EMI</span>
                        <b className="font-mono text-xs text-ag-ink-2">₹{l.emiAmount}</b>
                      </div>
                      <div>
                        <span className="text-ag-ink-3 block">EMI Paid</span>
                        <b className="font-mono text-xs text-ag-ink-2">{l.paidInstallments}/{l.installments} mo</b>
                      </div>
                      <div>
                        <span className="text-ag-ink-3 block">Outstanding</span>
                        <b className="font-mono text-xs text-ag-primary">₹{l.outstandingBalance}</b>
                      </div>
                    </div>
                    {l.status === 'pending' && (
                      <div className="flex gap-2 justify-end pt-2">
                        <Button size="sm" variant="ghost" onClick={() => handleApproveLoan(l.id, 'rejected')}>Reject</Button>
                        <Button size="sm" onClick={() => handleApproveLoan(l.id, 'approved')}>Approve & Disburse</Button>
                      </div>
                    )}
                  </div>
                ))}
                {loans.length === 0 && (
                  <div className="text-center py-6 text-xs text-ag-ink-3">No active loans found.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Context Panel (25% width -> col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            {loanSelectedEmp ? (
              <Card className="p-5 space-y-3 text-xs">
                <h4 className="font-bold text-ag-ink uppercase tracking-wider block border-b pb-1.5">Borrower Profile</h4>
                <div className="flex justify-between">
                  <span className="text-ag-ink-3">Department:</span>
                  <strong className="text-ag-ink">{loanSelectedEmp.job?.departmentName || 'Engineering'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ag-ink-3">Gross Salary / mo:</span>
                  <strong className="text-ag-primary">₹{Math.round((loanSelectedEmp.job?.annualCtc || 800000) / 12).toLocaleString('en-IN')}</strong>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-xs text-ag-ink-3 bg-ag-surface/20">
                Choose an employee from the dropdown list to view loan recovery insights.
              </Card>
            )}

            <Card className="p-5">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-2">Loan Policies</h4>
              <p className="text-[10px] text-ag-ink-3 leading-relaxed">
                Maximum loan amount cannot exceed 3 times the monthly gross take home. Repayment is capped at 12 installments.
              </p>
            </Card>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 6: TAX & COMPLIANCE CENTER
          ========================================== */}
      {activeTab === 'tax_compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 space-y-4">
              <div>
                <h3 className="font-display font-black text-base text-ag-ink">Income Tax slabs (FY 2026-27)</h3>
                <p className="text-xs text-ag-ink-3 mt-0.5">Statutory income tax slabs under the New Tax Regime.</p>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                {[
                  { slab: 'Up to ₹3,00,000', rate: 'Nil / Exempt' },
                  { slab: '₹3,00,001 - ₹7,00,000', rate: '5% tax rate' },
                  { slab: '₹7,00,001 - ₹10,00,000', rate: '10% tax rate' },
                  { slab: '₹10,00,001 - ₹12,00,000', rate: '15% tax rate' },
                  { slab: '₹12,00,001 - ₹15,00,000', rate: '20% tax rate' },
                  { slab: 'Above ₹15,00,000', rate: '30% tax rate' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between p-3 border border-ag-border rounded-xl bg-white hover:border-ag-border-strong transition-all">
                    <span className="font-bold text-ag-ink">{item.slab}</span>
                    <span className="font-mono text-ag-primary font-bold">{item.rate}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5 bg-ag-surface border border-ag-border rounded-xl">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck size={18} className="text-ag-primary" /> PF & ESI contributions
              </h4>
              <p className="text-[11px] text-ag-ink-3 leading-relaxed">
                Employer PF is computed at 12% of Basic Salary + DA. ESI deductions are applicable for employees with monthly gross salaries below ₹21,000 (0.75% Employee, 3.25% Employer contribution).
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 7: DISBURSEMENT LEDGER
          ========================================== */}
      {activeTab === 'ledger' && (
        <Card>
          <CardHeader title="Finalized Payments Register" subtitle="Immutable transaction audit log of disbursed monthly salary periods." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ag-border text-ag-ink-3 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 text-left font-semibold">Employee</th>
                  <th className="py-3 px-4 text-left font-semibold">Disbursed Amount</th>
                  <th className="py-3 px-4 text-left font-semibold">Disbursement Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Reference Transaction</th>
                  <th className="py-3 px-4 text-left font-semibold">Disbursed Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center p-8 text-ag-ink-3">Syncing ledger logs…</td></tr>
                ) : ledgers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-8 text-ag-ink-3">No disbursements finalized yet.</td></tr>
                ) : (
                  ledgers.map(l => (
                    <tr key={l.id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-ag-ink">{l.employeeName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-ag-primary">{formatCurrency(l.disbursedAmount)}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded capitalize bg-[#E6FAF4] text-ag-mint">
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-ag-ink-2">{l.referenceNumber}</td>
                      <td className="py-3 px-4 font-mono text-xs text-ag-ink-3">{l.disbursedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==========================================
          PAYSLIP GENERATION MODAL
          ========================================== */}
      {selectedPayslipEmp && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayslipEmp(null)}
          title={`Payslip Advice: ${selectedPayslipEmp.fullName}`}
        >
          <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto" id="payslip-print-section">
            <div className="flex justify-between items-start border-b border-ag-border pb-4">
              <div>
                <h2 className="text-lg font-black text-ag-ink tracking-tight font-display">WORKSphere ERP Solutions</h2>
                <p className="text-ag-ink-3 text-[10px] mt-0.5">Corporate Office · Bangalore HQ · Karnataka, India</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-ag-primary bg-ag-primary-light px-2.5 py-0.5 rounded">
                  {activeRunPeriod}
                </span>
                <p className="text-[9px] text-ag-ink-3 mt-1.5">Payslip Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-ag-border/50 text-[10px]">
              <div>
                <span className="text-ag-ink-3 block">Employee Name</span>
                <strong className="text-ag-ink text-xs block mt-0.5">{selectedPayslipEmp.fullName}</strong>
              </div>
              <div>
                <span className="text-ag-ink-3 block">Employee ID</span>
                <strong className="text-ag-ink-2 block mt-0.5">{selectedPayslipEmp.employeeId || 'EMP-012'}</strong>
              </div>
              <div>
                <span className="text-ag-ink-3 block">Department</span>
                <strong className="text-ag-ink-2 block mt-0.5">{selectedPayslipEmp.job?.departmentName || 'Engineering'}</strong>
              </div>
              <div>
                <span className="text-ag-ink-3 block">Designation</span>
                <strong className="text-ag-ink-2 block mt-0.5">{selectedPayslipEmp.job?.designationName || 'Software Engineer'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider border-b border-ag-border pb-1.5 flex justify-between">
                  <span>Earnings Components</span>
                  <span>Amount</span>
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Basic Salary (50%)</span>
                    <span className="font-mono">₹25,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">House Rent Allowance (HRA - 30%)</span>
                    <span className="font-mono">₹15,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Special Allowance</span>
                    <span className="font-mono">₹8,500</span>
                  </div>
                  <div className="flex justify-between font-bold text-ag-ink pt-1.5 border-t border-ag-border/40">
                    <span>Gross Earnings Sum</span>
                    <span className="font-mono">₹48,500</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider border-b border-ag-border pb-1.5 flex justify-between">
                  <span>Deductions / Taxes</span>
                  <span>Amount</span>
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Employee Provident Fund (PF)</span>
                    <span className="font-mono">-₹1,800</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Professional Tax (PT)</span>
                    <span className="font-mono">-₹200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Income Tax TDS provision</span>
                    <span className="font-mono">-₹2,500</span>
                  </div>
                  <div className="flex justify-between font-bold text-ag-ink pt-1.5 border-t border-ag-border/40">
                    <span>Deductions Sum</span>
                    <span className="font-mono">-₹4,500</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl flex justify-between items-center text-xs mt-4">
              <div>
                <span className="text-ag-ink-3 uppercase font-black block tracking-wider">Net Salary Credited Payout</span>
                <span className="text-[10px] text-ag-ink-3 mt-0.5">Disbursed to HDFC Bank A/c ******0291</span>
              </div>
              <strong className="text-lg font-display font-black text-ag-primary">
                ₹44,000
              </strong>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-ag-border mt-4">
              <div className="flex items-center gap-3">
                <QrCode size={40} className="text-ag-ink-2" />
                <div>
                  <span className="text-[9px] text-ag-ink-3 block">Verify via QR Code</span>
                  <span className="text-[9px] font-mono text-ag-ink-3">Ref: WS-P-78041920</span>
                </div>
              </div>
              <div className="text-right">
                <Signature size={32} className="text-ag-primary ml-auto" />
                <span className="text-[9px] text-ag-ink-3 block mt-1.5">Digitally Signed Certificate</span>
                <span className="text-[9px] font-black text-ag-ink">Authorized HR Officer</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-ag-border mt-4">
              <Button
                variant="secondary"
                icon={<FilePdf size={14} />}
                onClick={() => {
                  toast.success('Downloading payslip PDF...');
                }}
              >
                Download PDF
              </Button>
              <Button
                onClick={() => {
                  toast.success(`Payslip notification sent to ${selectedPayslipEmp.fullName}'s registered email.`);
                  setSelectedPayslipEmp(null);
                }}
              >
                Email Payslip
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </PageContainer>
  );
}
