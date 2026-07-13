import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { leaveService, employeeService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Calendar, ArrowsClockwise, FileText, Clock, Lock, Coins, Check, X, TrendUp, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function LeavePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'balance' | 'apply' | 'history' | 'ledger' | 'admin'>('balance');
  
  // Data lists
  const [balances, setBalances] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [encashments, setEncashments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{ averageLeaveDuration: number; totalLopDays: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply form state
  const [form, setForm] = useState({
    leaveTypeId: '',
    from: '',
    to: '',
    reason: '',
    halfDay: false,
    halfDayType: 'first_half'
  });

  // Encashment form state
  const [showEncashForm, setShowEncashForm] = useState(false);
  const [encashTypeId, setEncashTypeId] = useState('');
  const [encashDays, setEncashDays] = useState('1');
  const [encashReason, setEncashReason] = useState('');

  // Admin page forms
  const [accrualEmpId, setAccrualEmpId] = useState('');
  const [accrualTypeId, setAccrualTypeId] = useState('');
  const [cfSource, setCfSource] = useState('2026');
  const [cfTarget, setCfTarget] = useState('2027');

  const isAdmin = user && ['company_admin', 'hr_head', 'super_admin'].includes(user.role);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [balData, appData, typeData, ledgerData, encashData] = await Promise.all([
        leaveService.getBalance(),
        leaveService.getApplications(),
        leaveService.getTypes(),
        leaveService.listLedgers(),
        leaveService.listEncashments()
      ]);
      setBalances(balData);
      setApplications(appData);
      setLeaveTypes(typeData);
      setLedgers(ledgerData);
      setEncashments(encashData);
      
      if (isAdmin) {
        const [empData, analyticsData] = await Promise.all([
          employeeService.list({ limit: 100 }),
          leaveService.getAnalytics()
        ]);
        setEmployees(empData.employees);
        setAnalytics(analyticsData);
      }
    } catch {
      toast.error('Failed to load leave records');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveTypeId || !form.from || !form.to || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await leaveService.apply(form);
      toast.success('Leave application submitted successfully!');
      setForm({
        leaveTypeId: '',
        from: '',
        to: '',
        reason: '',
        halfDay: false,
        halfDayType: 'first_half'
      });
      setActiveTab('history');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit leave request');
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await leaveService.withdraw(id);
      toast.success('Leave request withdrawn successfully.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to withdraw leave.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await leaveService.cancel(id, 'Cancelled by employee');
      toast.success('Approved leave cancelled. Balance refunded.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to cancel leave.');
    }
  };

  const handleApplyEncashment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encashTypeId || !encashDays) {
      toast.error('Please select type and enter number of days.');
      return;
    }
    try {
      await leaveService.requestEncashment({
        leaveTypeId: encashTypeId,
        days: parseFloat(encashDays),
        reason: encashReason,
        employeeId: user?.employeeId
      });
      toast.success('Encashment request submitted.');
      setShowEncashForm(false);
      setEncashTypeId('');
      setEncashDays('1');
      setEncashReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit encashment.');
    }
  };

  const handleApproveEncashment = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await leaveService.approveEncashment(id, { status, comments: 'Processed via admin panel.' });
      toast.success(`Encashment claim ${status}.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to process encashment.');
    }
  };

  const handleTriggerAccrual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await leaveService.runAccrual({
        employeeId: accrualEmpId || undefined,
        leaveTypeId: accrualTypeId || undefined
      });
      toast.success(`Accrual successfully completed. Logged: ${res.accruedCount} entries.`);
      setAccrualEmpId('');
      setAccrualTypeId('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to process accrual.');
    }
  };

  const handleTriggerCarryForward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await leaveService.runCarryForward({
        sourceYear: parseInt(cfSource),
        targetYear: parseInt(cfTarget)
      });
      toast.success(`Carry forward roll over successfully executed. Met: ${res.processedCount} records.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to run carry forward.');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'leaveTypeId.name',
      header: 'Leave Type',
      cell: ({ row }) => <span className="font-bold text-ag-ink text-sm">{row.original.leaveTypeId?.name || 'Leave'}</span>,
    },
    {
      accessorKey: 'from',
      header: 'From Date',
      cell: ({ row }) => <span className="text-ag-ink-2">{formatDate(row.original.from)}</span>,
    },
    {
      accessorKey: 'to',
      header: 'To Date',
      cell: ({ row }) => <span className="text-ag-ink-2">{formatDate(row.original.to)}</span>,
    },
    {
      accessorKey: 'days',
      header: 'Allocated Days',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-mono text-sm font-semibold text-ag-primary">{item.days} paid day(s)</span>
            {item.lopDays > 0 && <span className="text-[10px] text-ag-accent-pink font-semibold">+{item.lopDays} LOP day(s)</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => <span className="text-xs text-ag-ink-3 truncate max-w-[150px] block">{row.original.reason}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const app = row.original;
        if (app.status === 'pending') {
          return (
            <Button size="sm" variant="ghost" onClick={() => handleWithdraw(app.id)}>
              Withdraw
            </Button>
          );
        }
        if (app.status === 'approved') {
          return (
            <Button size="sm" variant="secondary" onClick={() => handleCancel(app.id)}>
              Cancel
            </Button>
          );
        }
        return <span className="text-xs text-ag-ink-3 font-semibold">—</span>;
      }
    }
  ];

  return (
    <PageContainer
      title="Leave Management"
      subtitle="Manage leave balances, apply for time off, withdraw requests, and view double-entry ledgers."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
            Refresh
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setActiveTab('apply')}>
            Apply Leave
          </Button>
        </div>
      }
    >
      {/* Tabs Menu */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('balance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'balance' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Calendar size={18} />
          Leave Balances
        </button>
        <button
          onClick={() => setActiveTab('apply')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'apply' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Plus size={18} />
          Apply Leave
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'history' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <FileText size={18} />
          Request History
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'ledger' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Clock size={18} />
          Ledger Log
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'admin' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            <Lock size={18} />
            Admin Console
          </button>
        )}
      </div>

      {activeTab === 'balance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-ag-ink">Active Leave Balances</h3>
            <Button size="sm" variant="secondary" icon={<Coins size={16} />} onClick={() => setShowEncashForm(!showEncashForm)}>
              {showEncashForm ? 'Cancel Encashment' : 'Request Encashment'}
            </Button>
          </div>

          {showEncashForm && (
            <Card className="p-5 max-w-xl">
              <h4 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4 flex items-center gap-2">
                <Coins size={20} className="text-ag-amber" />
                Submit Encashment Payout Claim
              </h4>
              <form onSubmit={handleApplyEncashment} className="space-y-4">
                <Select
                  label="Select Leave Type"
                  value={encashTypeId}
                  onChange={e => setEncashTypeId(e.target.value)}
                  options={[
                    { value: '', label: 'Select leave type...' },
                    ...balances.map(b => ({ value: b.leaveTypeId?.id, label: `${b.leaveTypeId?.name} (${b.available} available)` }))
                  ]}
                />
                <Input
                  label="Number of Days to Cash Out"
                  type="number"
                  required
                  value={encashDays}
                  onChange={e => setEncashDays(e.target.value)}
                />
                <Input
                  label="Remarks / Reason"
                  placeholder="e.g. Year-end unused leave claim"
                  value={encashReason}
                  onChange={e => setEncashReason(e.target.value)}
                />
                <Button type="submit">Submit Payout Request</Button>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {isLoading ? (
              <p className="text-ag-ink-3">Loading balances...</p>
            ) : balances.length === 0 ? (
              <Card className="p-6 text-center col-span-3">
                <p className="text-ag-ink-3">No leave balances allocated yet.</p>
              </Card>
            ) : (
              balances.map((bal) => (
                <Card key={bal.id} className="p-5 flex flex-col justify-between border-l-4 border-l-ag-primary">
                  <div>
                    <h4 className="text-xs font-extrabold text-ag-ink-2 uppercase tracking-wider">{bal.leaveTypeId?.name}</h4>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-4xl font-extrabold text-ag-primary font-display">{bal.available}</span>
                      <span className="text-xs text-ag-ink-3">days available / {bal.allocated} allocated</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-ag-border text-[11px] text-ag-ink-3">
                    <span>Used: <b>{bal.used} days</b></span>
                    <span>Pending Approval: <b>{bal.pending} days</b></span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'apply' && (
        <Card className="max-w-xl">
          <CardHeader title="Apply Leave" subtitle="Select leave type, pick dates and submit request for approvals." />
          <form className="p-5 space-y-4" onSubmit={handleApply}>
            <div>
              <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Leave Category</label>
              <select
                className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:border-ag-primary"
                value={form.leaveTypeId}
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
              >
                <option key="choose-type" value="">Choose leave type</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="halfDay"
                checked={form.halfDay}
                onChange={(e) => setForm({ ...form, halfDay: e.target.checked })}
                className="rounded border-ag-border text-ag-primary focus:ring-ag-primary"
              />
              <label htmlFor="halfDay" className="text-sm font-semibold text-ag-ink">Apply as Half Day</label>
            </div>

            {form.halfDay && (
              <div>
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Half Day Slot</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:border-ag-primary"
                  value={form.halfDayType}
                  onChange={(e: any) => setForm({ ...form, halfDayType: e.target.value })}
                >
                  <option key="first_half" value="first_half">First Half (Morning)</option>
                  <option key="second_half" value="second_half">Second Half (Afternoon)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Reason for Leave</label>
              <textarea
                className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:border-ag-primary"
                rows={4}
                placeholder="Brief description of the reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Submit Leave Request</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader title="All Applications" subtitle="Track approval progress and timeline of historical leave applications." />
          <DataTable
            columns={columns}
            data={applications}
            isLoading={isLoading}
            emptyTitle="No leaves filed yet"
            emptySubtitle="Apply for leaves from the Apply Leave tab."
          />
        </Card>
      )}

      {activeTab === 'ledger' && (
        <Card>
          <CardHeader title="Employee Leave Ledger Statement" subtitle="Double-entry audit log of all leave allocations, accruals, adjustments, and takens." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ag-border text-ag-ink-3 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 text-left font-semibold">Date</th>
                  <th className="py-3 px-4 text-left font-semibold">Leave Type</th>
                  <th className="py-3 px-4 text-left font-semibold">Transaction Type</th>
                  <th className="py-3 px-4 text-left font-semibold">Change (Days)</th>
                  <th className="py-3 px-4 text-left font-semibold">Previous Balance</th>
                  <th className="py-3 px-4 text-left font-semibold">New Balance</th>
                  <th className="py-3 px-4 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center p-8 text-ag-ink-3">Loading ledger statements…</td></tr>
                ) : ledgers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-8 text-ag-ink-3">No transactions logged in ledger.</td></tr>
                ) : (
                  ledgers.map(entry => (
                    <tr key={entry.id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-ag-ink-2">{entry.transactionDate}</td>
                      <td className="py-3 px-4 font-semibold text-ag-ink">{entry.leaveTypeName}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          ['accrual', 'opening', 'carry_forward'].includes(entry.transactionType)
                            ? 'bg-[#E6FAF4] text-ag-mint'
                            : entry.transactionType === 'leave_taken'
                            ? 'bg-ag-primary-light text-ag-primary'
                            : 'bg-ag-surface text-ag-ink-3'
                        }`}>
                          {entry.transactionType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-ag-primary">
                        {['accrual', 'opening', 'carry_forward'].includes(entry.transactionType) ? `+${entry.days}` : `-${entry.days}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{entry.previousBalance}</td>
                      <td className="py-3 px-4 font-mono text-xs font-bold">{entry.newBalance}</td>
                      <td className="py-3 px-4 text-xs text-ag-ink-3 max-w-[200px] truncate">{entry.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'admin' && isAdmin && (
        <div className="space-y-6">
          {/* Top Analytics row */}
          <div className="grid grid-cols-2 gap-5 max-w-xl">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-ag-ink-3 uppercase font-semibold">Average Leave Duration</span>
                <h3 className="text-2xl font-bold font-display text-ag-primary mt-2">
                  {isLoading ? '—' : `${analytics?.averageLeaveDuration ?? 0} days`}
                </h3>
              </div>
              <TrendUp size={32} className="text-ag-primary/20" />
            </Card>
            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-ag-ink-3 uppercase font-semibold">Total Loss of Pay (LOP)</span>
                <h3 className="text-2xl font-bold font-display text-ag-accent-pink mt-2">
                  {isLoading ? '—' : `${analytics?.totalLopDays ?? 0} days`}
                </h3>
              </div>
              <Warning size={32} className="text-ag-accent-pink/20" />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Payout Encashments */}
            <Card>
              <CardHeader title="Pending Encashments Claims" subtitle="Review and approve employee cash-out requests." />
              <div className="p-4 space-y-4">
                {encashments.filter(e => e.status === 'pending').length === 0 ? (
                  <div className="text-center p-4 text-ag-ink-3 text-xs">No pending payouts remaining.</div>
                ) : (
                  encashments.filter(e => e.status === 'pending').map(enc => (
                    <div key={enc.id} className="p-3 border border-ag-border rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-ag-ink">{enc.employeeName} ({enc.employeeCode})</h4>
                          <span className="text-[10px] text-ag-ink-3 block">Type: {enc.leaveTypeName}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-ag-mint">
                          {enc.days} Days / ₹{enc.amount}
                        </span>
                      </div>
                      <div className="text-xs text-ag-ink-2 bg-ag-surface p-2 rounded border border-ag-border">
                        <b>Reason:</b> {enc.reason || 'No remarks provided'}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<X size={14} />}
                          onClick={() => handleApproveEncashment(enc.id, 'rejected')}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          icon={<Check size={14} />}
                          onClick={() => handleApproveEncashment(enc.id, 'approved')}
                        >
                          Approve Payout
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Run Accruals Form */}
            <Card className="p-5">
              <h3 className="font-display font-bold text-base text-ag-ink flex items-center gap-2 mb-3 border-b border-ag-border pb-3">
                <Calendar size={20} className="text-ag-primary" />
                Trigger Batch Accrual Run
              </h3>
              <form onSubmit={handleTriggerAccrual} className="space-y-4">
                <Select
                  label="Filter by Employee (Optional)"
                  value={accrualEmpId}
                  onChange={e => setAccrualEmpId(e.target.value)}
                  options={[
                    { value: '', label: 'All Employees' },
                    ...employees.map(e => ({ value: e.id, label: `${e.fullName} (${e.employeeId})` }))
                  ]}
                />
                <Select
                  label="Filter by Leave Type (Optional)"
                  value={accrualTypeId}
                  onChange={e => setAccrualTypeId(e.target.value)}
                  options={[
                    { value: '', label: 'All Accrual-Based Leave Types' },
                    ...leaveTypes.filter(t => t.accrual_based).map(t => ({ value: t.id, label: `${t.name} (${t.code})` }))
                  ]}
                />
                <Button type="submit">Process Accruals</Button>
              </form>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Run Year End Carry Forward */}
            <Card className="p-5">
              <h3 className="font-display font-bold text-base text-ag-ink flex items-center gap-2 mb-3 border-b border-ag-border pb-3">
                <Clock size={20} className="text-ag-mint" />
                Trigger Year-End Roll Over
              </h3>
              <p className="text-xs text-ag-ink-3 mb-4">
                Computes expired unused leaves, caps eligible carry forward balances, and transfers them to the target year balances.
              </p>
              <form onSubmit={handleTriggerCarryForward} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Source Year"
                    required
                    value={cfSource}
                    onChange={e => setCfSource(e.target.value)}
                  />
                  <Input
                    label="Target Year"
                    required
                    value={cfTarget}
                    onChange={e => setCfTarget(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="secondary">Execute Carry Forward</Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
