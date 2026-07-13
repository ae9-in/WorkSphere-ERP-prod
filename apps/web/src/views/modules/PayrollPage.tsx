import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { payrollService, employeeService } from '@/services/api.service';
import { PayrollRun } from '@/types/payroll.types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, ArrowsClockwise, Coins, Receipt, Lock, Clock, Calendar, Check, X, FileText } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'assign' | 'reimbursement' | 'loans' | 'ledger'>('overview');

  // Form states
  const [showCreateRun, setShowCreateRun] = useState(false);
  const [newRunMonth, setNewRunMonth] = useState('7');
  const [newRunYear, setNewRunYear] = useState('2026');

  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignStructId, setAssignStructId] = useState('');
  const [assignCtc, setAssignCtc] = useState('800000');
  const [assignDate, setAssignDate] = useState('2026-07-01');

  const [loanEmpId, setLoanEmpId] = useState('');
  const [loanPrincipal, setLoanPrincipal] = useState('60000');
  const [loanEmi, setLoanEmi] = useState('10000');
  const [loanInst, setLoanInst] = useState('6');
  const [loanReason, setLoanReason] = useState('');

  const [reimbCategory, setReimbCategory] = useState('travel');
  const [reimbAmount, setReimbAmount] = useState('1500');
  const [reimbReason, setReimbReason] = useState('');

  // YTD financial summaries
  const ytdNetPay = runs.filter(r => ['paid', 'approved', 'completed'].includes(r.status)).reduce((s, r) => s + (r.totalNetPay ?? 0), 0);
  const ytdGross = runs.filter(r => ['paid', 'approved', 'completed'].includes(r.status)).reduce((s, r) => s + (r.totalGross ?? 0), 0);
  const ytdDeductions = runs.filter(r => ['paid', 'approved', 'completed'].includes(r.status)).reduce((s, r) => s + (r.totalDeductions ?? 0), 0);

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
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Approval request failed.');
    }
  };

  const handleLockRun = async (id: string) => {
    try {
      await payrollService.lockRun(id);
      toast.success('Payroll locked and disbursed. Payslips published and ledgers committed.');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Disbursement lock failed.');
    }
  };

  const handleReopenRun = async (id: string) => {
    try {
      await payrollService.reopenRun(id);
      toast.success('Period unlocked. Run reverted to draft state.');
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
      header: 'Employees',
      cell: ({ row }) => <span className="font-medium text-ag-ink-2">{row.original.totalEmployees}</span>,
    },
    {
      accessorKey: 'totalGross',
      header: 'Gross Pay',
      cell: ({ row }) => <span className="font-mono text-xs text-ag-ink-2">{formatCurrency(row.original.totalGross)}</span>,
    },
    {
      accessorKey: 'totalDeductions',
      header: 'Deductions',
      cell: ({ row }) => <span className="font-mono text-xs text-ag-accent-pink">-{formatCurrency(row.original.totalDeductions)}</span>,
    },
    {
      accessorKey: 'totalNetPay',
      header: 'Net Pay',
      cell: ({ row }) => <span className="font-mono text-sm font-bold text-ag-primary">{formatCurrency(row.original.totalNetPay)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
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
          return <span className="text-xs text-ag-amber font-semibold animate-pulse">Running...</span>;
        }
        if (r.status === 'completed') {
          return (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleProcessRun(r._id, true)}>
                Recalculate
              </Button>
              <Button size="sm" onClick={() => handleApproveRun(r._id)}>
                Approve
              </Button>
            </div>
          );
        }
        if (r.status === 'approved') {
          return (
            <Button size="sm" onClick={() => handleLockRun(r._id)}>
              Lock & Pay
            </Button>
          );
        }
        if (r.status === 'paid') {
          return (
            <Button size="sm" variant="ghost" onClick={() => handleReopenRun(r._id)}>
              Reopen
            </Button>
          );
        }
        return <span className="text-xs text-ag-ink-3 font-semibold">—</span>;
      }
    }
  ];

  return (
    <PageContainer
      title="Payroll Administration"
      subtitle="Configure templates, revision salary packages, approve loans, process monthly cycles, and commit ledgers."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchAllData} icon={<ArrowsClockwise size={18} />}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateRun(!showCreateRun)} icon={<Plus size={18} />}>
            Create Run Cycle
          </Button>
        </div>
      }
    >
      {showCreateRun && (
        <Card className="p-5 max-w-md mb-8">
          <h3 className="font-display font-bold text-base text-ag-ink mb-4 border-b border-ag-border pb-2">
            Create New Monthly Run
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
            <Button type="submit">Create Draft Cycle</Button>
          </form>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Coins size={18} />
          Overview Financials
        </button>
        <button
          onClick={() => setActiveTab('runs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'runs' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Lock size={18} />
          Payroll Runs
        </button>
        <button
          onClick={() => setActiveTab('assign')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'assign' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Calendar size={18} />
          Salary Revisions
        </button>
        <button
          onClick={() => setActiveTab('reimbursement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'reimbursement' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Receipt size={18} />
          Expense Reimbursements
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'loans' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Clock size={18} />
          Employee Loans
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'ledger' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <FileText size={18} />
          Disbursement Ledger
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="p-5">
              <span className="text-xs text-ag-ink-3 uppercase font-semibold">Total Paid Payout (YTD)</span>
              <h3 className="text-3xl font-extrabold text-ag-primary font-display mt-3">
                {isLoading ? '—' : formatCurrency(ytdNetPay)}
              </h3>
              <p className="text-[11px] text-ag-ink-3 mt-4">Calculated across approved locked runs.</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-ag-ink-3 uppercase font-semibold">Total Gross Salaries (YTD)</span>
              <h3 className="text-3xl font-extrabold text-ag-ink font-display mt-3">
                {isLoading ? '—' : formatCurrency(ytdGross)}
              </h3>
              <p className="text-[11px] text-ag-ink-3 mt-4">Before statutory PF/ESI/PT deductions.</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-ag-ink-3 uppercase font-semibold">Statutory Deductions (YTD)</span>
              <h3 className="text-3xl font-extrabold text-ag-accent-pink font-display mt-3">
                {isLoading ? '—' : formatCurrency(ytdDeductions)}
              </h3>
              <p className="text-[11px] text-ag-ink-3 mt-4">Professional tax + PF + ESI contributions.</p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'runs' && (
        <Card>
          <CardHeader title="Historical Run Logs" subtitle="Double check attendance, leaves, and adjustment inputs before locking." />
          <DataTable
            columns={runsColumns}
            data={runs}
            isLoading={isLoading}
            emptyTitle="No monthly runs defined yet"
            emptySubtitle="Click 'Create Run Cycle' above to process salaries."
          />
        </Card>
      )}

      {activeTab === 'assign' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1">
            <h3 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">
              Revision Assignment Form
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
                label="Gross Annualized CTC (INR)"
                type="number"
                value={assignCtc}
                onChange={e => setAssignCtc(e.target.value)}
              />
              <Input
                label="Effective Date"
                type="date"
                value={assignDate}
                onChange={e => setAssignDate(e.target.value)}
              />
              <Button type="submit">Assign & Revision</Button>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Salary Template Library" subtitle="Configured packages available for employee assignments." />
            <div className="p-4 space-y-4">
              {structures.map(ss => (
                <div key={ss._id} className="p-4 border border-ag-border rounded-xl space-y-3 bg-ag-surface-2/40">
                  <h4 className="font-bold text-sm text-ag-ink">{ss.name}</h4>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {ss.components.map((c: any) => (
                      <span key={c.code} className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-ag-surface border border-ag-border text-ag-ink-2">
                        {c.code}: {c.calcType === 'fixed' ? `₹${c.value}` : `${c.value}%`} ({c.type})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'reimbursement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1">
            <h3 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">
              Claim Reimbursement Payout
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
                  { value: 'client_expense', label: 'Client Entertainment' },
                  { value: 'other', label: 'Other Miscellaneous' }
                ]}
              />
              <Input
                label="Claim Amount (INR)"
                type="number"
                value={reimbAmount}
                onChange={e => setReimbAmount(e.target.value)}
              />
              <Input
                label="Reason / Remarks"
                placeholder="Describe expense details"
                value={reimbReason}
                onChange={e => setReimbReason(e.target.value)}
              />
              <Button type="submit">Submit Claim</Button>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="All Claims History" subtitle="Approve pending receipts to include them in the next payroll run." />
            <div className="p-4 space-y-3">
              {reimbursements.length === 0 ? (
                <div className="text-center p-6 text-xs text-ag-ink-3">No claims filed.</div>
              ) : (
                reimbursements.map(r => (
                  <div key={r.id} className="p-3 border border-ag-border rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-ag-ink">{r.employeeName} — {r.category.toUpperCase()}</h4>
                      <p className="text-[10px] text-ag-ink-3 mt-1">Reason: {r.reason} | Filed: {r.claimDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-ag-primary">₹{r.amount}</span>
                      {r.status === 'pending' ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleApproveReimbursement(r.id, 'rejected')} icon={<X size={12} />} />
                          <Button size="sm" onClick={() => handleApproveReimbursement(r.id, 'approved')} icon={<Check size={12} />} />
                        </div>
                      ) : (
                        <StatusBadge status={r.status} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1">
            <h3 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">
              Apply For Personal Loan
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
              />
              <Input
                label="Principal Amount (INR)"
                type="number"
                value={loanPrincipal}
                onChange={e => setLoanPrincipal(e.target.value)}
              />
              <Input
                label="EMI Monthly Installment (INR)"
                type="number"
                value={loanEmi}
                onChange={e => setLoanEmi(e.target.value)}
              />
              <Input
                label="Installment Count (Months)"
                type="number"
                value={loanInst}
                onChange={e => setLoanInst(e.target.value)}
              />
              <Input
                label="Reason"
                value={loanReason}
                onChange={e => setLoanReason(e.target.value)}
              />
              <Button type="submit">Submit Application</Button>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="All Loans & Recoveries" subtitle="Recovery EMI is automatically deducted from payroll runs." />
            <div className="p-4 space-y-3">
              {loans.length === 0 ? (
                <div className="text-center p-6 text-xs text-ag-ink-3">No active loans found.</div>
              ) : (
                loans.map(l => (
                  <div key={l.id} className="p-4 border border-ag-border rounded-xl space-y-3 bg-ag-surface-2/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-xs text-ag-ink">{l.employeeName}</h4>
                        <span className="text-[10px] text-ag-ink-3 mt-1 block">Reason: {l.reason || 'Not specified'}</span>
                      </div>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center pt-2 border-t border-ag-border/50 text-[10px]">
                      <div>
                        <span className="text-ag-ink-3 block">Principal</span>
                        <b className="font-mono text-xs">₹{l.principalAmount}</b>
                      </div>
                      <div>
                        <span className="text-ag-ink-3 block">Monthly EMI</span>
                        <b className="font-mono text-xs">₹{l.emiAmount}</b>
                      </div>
                      <div>
                        <span className="text-ag-ink-3 block">EMI Paid</span>
                        <b className="font-mono text-xs">{l.paidInstallments} / {l.installments} months</b>
                      </div>
                      <div>
                        <span className="text-ag-ink-3 block">Outstanding</span>
                        <b className="font-mono text-xs text-ag-primary">₹{l.outstandingBalance}</b>
                      </div>
                    </div>
                    {l.status === 'pending' && (
                      <div className="flex gap-2 justify-end pt-2">
                        <Button size="sm" variant="ghost" onClick={() => handleApproveLoan(l.id, 'rejected')}>Reject</Button>
                        <Button size="sm" onClick={() => handleApproveLoan(l.id, 'approved')}>Approve & Activate</Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'ledger' && (
        <Card>
          <CardHeader title="Payment Disbursed Ledger" subtitle="Immutable transaction audit log generated on period locking." />
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
                  <tr><td colSpan={5} className="text-center p-8 text-ag-ink-3">Syncing ledger statements…</td></tr>
                ) : ledgers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-8 text-ag-ink-3">No disbursements finalized yet.</td></tr>
                ) : (
                  ledgers.map(l => (
                    <tr key={l.id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-ag-ink">{l.employeeName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-ag-primary">{formatCurrency(l.disbursedAmount)}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize bg-[#E6FAF4] text-ag-mint">
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
    </PageContainer>
  );
}
