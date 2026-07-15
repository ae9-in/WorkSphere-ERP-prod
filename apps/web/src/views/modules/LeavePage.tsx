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
import {
  Plus, Calendar, ArrowsClockwise, FileText, Clock, Lock, Coins, Check, X,
  TrendUp, Warning, Info, CheckCircle, CalendarBlank, ShieldCheck, DownloadSimple, UserPlus, UsersThree
} from '@phosphor-icons/react';
import { toast } from 'sonner';

// Custom mock long weekends and holiday calendar list
const LONG_WEEKENDS = [
  { id: 'lw1', title: 'Good Friday Weekend', dates: 'April 03 - April 05', days: '3 days off', type: 'national' },
  { id: 'lw2', title: 'Independence Day Stretch', dates: 'August 14 - August 16', days: '3 days off', type: 'national' },
  { id: 'lw3', title: 'Diwali Festival Break', dates: 'November 12 - November 15', days: '4 days off', type: 'festival' }
];

const HOLIDAYS = [
  { date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { date: '2026-03-06', name: 'Holi Festival', type: 'festival' },
  { date: '2026-04-03', name: 'Good Friday', type: 'national' },
  { date: '2026-05-01', name: 'May Day / Labour Day', type: 'gazetted' },
  { date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2026-11-08', name: 'Diwali Celebration', type: 'festival' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'gazetted' }
];

const TEAM_MEMBERS = [
  { id: 'tm1', name: 'Priya Sharma', dept: 'Engineering', status: 'wfh', role: 'Team Lead' },
  { id: 'tm2', name: 'Amit Verma', dept: 'HR', status: 'available', role: 'Recruiter' },
  { id: 'tm3', name: 'Rohan Gupta', dept: 'Engineering', status: 'leave', role: 'Senior Engineer' },
  { id: 'tm4', name: 'Ananya Sen', dept: 'Engineering', status: 'available', role: 'Frontend Engineer' },
  { id: 'tm5', name: 'Vikram Malhotra', dept: 'Finance', status: 'training', role: 'Payroll Expert' }
];

export default function LeavePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'apply' | 'history' | 'calendar' | 'availability' | 'ledger' | 'encashment' | 'policies' | 'admin'>('dashboard');

  // Backend Lists
  const [balances, setBalances] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [encashments, setEncashments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{ averageLeaveDuration: number; totalLopDays: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply Form State
  const [form, setForm] = useState({
    leaveTypeId: '',
    from: '',
    to: '',
    reason: '',
    halfDay: false,
    halfDayType: 'first_half',
    emergencyContact: '',
    delegateId: ''
  });

  // Policy / Overlap Conflict states
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [holidayDetected, setHolidayDetected] = useState<string | null>(null);

  // Encashment State
  const [encashTypeId, setEncashTypeId] = useState('');
  const [encashDays, setEncashDays] = useState('5');
  const [encashReason, setEncashReason] = useState('');

  // Accruals state
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

  // Form check inputs
  useEffect(() => {
    if (!form.from || !form.to) {
      setConflictWarning(null);
      setHolidayDetected(null);
      return;
    }

    const start = new Date(form.from);
    const end = new Date(form.to);

    // Conflict overlapping checks
    const overlap = applications.find(app => {
      if (app.status === 'rejected' || app.status === 'withdrawn') return false;
      const appStart = new Date(app.from);
      const appEnd = new Date(app.to);
      return start <= appEnd && end >= appStart;
    });

    if (overlap) {
      setConflictWarning(`Overlap detected: You have an existing leave request (${overlap.leaveTypeId?.name || 'Leave'}) from ${formatDate(overlap.from)} to ${formatDate(overlap.to)}.`);
    } else {
      setConflictWarning(null);
    }

    // Holiday Check
    const matchedHoliday = HOLIDAYS.find(h => {
      const hDate = new Date(h.date);
      return hDate >= start && hDate <= end;
    });

    if (matchedHoliday) {
      setHolidayDetected(`Note: Contains holiday "${matchedHoliday.name}" on ${matchedHoliday.date}. Unpaid / LOP deductions will adjust accordingly.`);
    } else {
      setHolidayDetected(null);
    }
  }, [form.from, form.to, applications]);

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
        halfDayType: 'first_half',
        emergencyContact: '',
        delegateId: ''
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
      toast.success('Leave encashment payout claim submitted!');
      setEncashTypeId('');
      setEncashReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit encashment.');
    }
  };

  const handleApproveEncashment = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await leaveService.approveEncashment(id, { status, comments: 'Processed via admin dashboard.' });
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
      toast.success(`Accruals completed. Accrued: ${res.accruedCount} records.`);
      setAccrualEmpId('');
      setAccrualTypeId('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to run accruals.');
    }
  };

  const handleTriggerCarryForward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await leaveService.runCarryForward({
        sourceYear: parseInt(cfSource),
        targetYear: parseInt(cfTarget)
      });
      toast.success(`Year-end rollover carry forward completed. Mapped: ${res.processedCount} records.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to execute carry forward.');
    }
  };

  // Define TanStack Table Columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'leaveTypeId.name',
      header: 'Leave Type',
      cell: ({ row }) => <strong className="font-bold text-ag-ink text-xs">{row.original.leaveTypeId?.name || 'Leave'}</strong>,
    },
    {
      accessorKey: 'from',
      header: 'Start Date',
      cell: ({ row }) => <span className="text-ag-ink-3 text-xs">{formatDate(row.original.from)}</span>,
    },
    {
      accessorKey: 'to',
      header: 'End Date',
      cell: ({ row }) => <span className="text-ag-ink-3 text-xs">{formatDate(row.original.to)}</span>,
    },
    {
      accessorKey: 'days',
      header: 'Duration',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col text-xs">
            <span className="font-bold text-ag-primary font-mono">{item.days} Paid Day(s)</span>
            {item.lopDays > 0 && <span className="text-[10px] text-ag-accent-pink font-semibold">+{item.lopDays} LOP Day(s)</span>}
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
      header: 'Reason / Remarks',
      cell: ({ row }) => <span className="text-xs text-ag-ink-3 truncate max-w-[140px] block">{row.original.reason}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const app = row.original;
        if (app.status === 'pending') {
          return (
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleWithdraw(app.id)}>
              Withdraw
            </Button>
          );
        }
        if (app.status === 'approved') {
          return (
            <Button size="sm" variant="secondary" className="text-xs" onClick={() => handleCancel(app.id)}>
              Cancel
            </Button>
          );
        }
        return <span className="text-xs text-ag-ink-3 font-semibold">—</span>;
      }
    }
  ];

  // Helper variables
  const pendingRequests = applications.filter(a => a.status === 'pending');
  const approvedThisMonth = applications.filter(a => a.status === 'approved').length;
  const totalBalanceDays = balances.reduce((sum, b) => sum + (b.available ?? 0), 0);

  return (
    <PageContainer
      title="Leave & Attendance Workspace"
      subtitle="Supervise balances, file time-off requests, check availability, and inspect double-entry ledgers."
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>Refresh</Button>
          <Button icon={<Plus size={18} />} onClick={() => setActiveTab('apply')}>Apply Leave</Button>
        </div>
      }
    >
      {/* Tab bar navigation */}
      <div className="flex gap-1.5 p-1 bg-ag-surface-2 border border-ag-border rounded-xl w-fit shrink-0 scrollbar-none mb-8 overflow-x-auto max-w-full">
        {[
          { id: 'dashboard', label: 'Executive Dashboard', icon: <TrendUp size={15} /> },
          { id: 'apply', label: 'Apply Leave', icon: <Plus size={15} /> },
          { id: 'history', label: 'Request History', icon: <FileText size={15} /> },
          { id: 'calendar', label: 'Holidays Calendar', icon: <CalendarBlank size={15} /> },
          { id: 'availability', label: 'Team Availability', icon: <UsersThree size={15} /> },
          { id: 'ledger', label: 'Leave Ledger Log', icon: <Clock size={15} /> },
          { id: 'encashment', label: 'Leave Encashment', icon: <Coins size={15} /> },
          { id: 'policies', label: 'Company Policies', icon: <Info size={15} /> },
          ...(isAdmin ? [{ id: 'admin', label: 'Admin Console', icon: <Lock size={15} /> }] : [])
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
          TAB 1: EXECUTIVE DASHBOARD
          ========================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Top KPIs Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-4 flex items-center gap-4 bg-white border border-ag-border/60">
              <div className="p-3 bg-ag-primary-light text-ag-primary rounded-xl shrink-0">
                <CalendarBlank size={22} />
              </div>
              <div>
                <span className="text-[10px] text-ag-ink-3 font-black uppercase tracking-wider block">Available Balance</span>
                <span className="text-xl font-black text-ag-ink mt-0.5 block">{totalBalanceDays} Days</span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white border border-ag-border/60">
              <div className="p-3 bg-[#FFF8E6] text-ag-amber rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <span className="text-[10px] text-ag-ink-3 font-black uppercase tracking-wider block">Pending Requests</span>
                <span className="text-xl font-black text-ag-ink mt-0.5 block">{pendingRequests.length} File(s)</span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white border border-ag-border/60">
              <div className="p-3 bg-[#E6FAF4] text-ag-mint rounded-xl shrink-0">
                <CheckCircle size={22} />
              </div>
              <div>
                <span className="text-[10px] text-ag-ink-3 font-black uppercase tracking-wider block">Approved Month</span>
                <span className="text-xl font-black text-ag-ink mt-0.5 block">{approvedThisMonth} Approved</span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white border border-ag-border/60">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <UsersThree size={22} />
              </div>
              <div>
                <span className="text-[10px] text-ag-ink-3 font-black uppercase tracking-wider block">Out Today (Team)</span>
                <span className="text-xl font-black text-ag-ink mt-0.5 block">1 Member</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Balance Progress Rings */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader title="Your Time-Off Balances" subtitle="Track allocated leave quotas and accruals." />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
                  {isLoading ? (
                    <div className="col-span-3 text-center text-xs text-ag-ink-3 py-6">Loading balances...</div>
                  ) : balances.length === 0 ? (
                    <div className="col-span-3 text-center text-xs text-ag-ink-3 py-6">No allocated balances.</div>
                  ) : (
                    balances.map(bal => {
                      const limit = bal.allocated || 1;
                      const percent = Math.min(100, Math.round(((bal.used ?? 0) / limit) * 100));
                      return (
                        <div key={bal.id} className="p-4 border border-ag-border rounded-xl flex flex-col justify-between hover:border-ag-border-strong bg-white">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-black text-ag-ink truncate max-w-[120px]">{bal.leaveTypeId?.name}</h4>
                              <span className="text-[10px] text-ag-ink-3 mt-0.5 block">Used: {bal.used} days</span>
                            </div>
                            <span className="text-xs font-bold text-ag-primary bg-ag-primary-light px-2 py-0.5 rounded">
                              {bal.available} available
                            </span>
                          </div>
                          
                          {/* Progress bar visual */}
                          <div className="mt-4">
                            <div className="h-1.5 w-full bg-ag-surface-2 rounded-full overflow-hidden">
                              <div className="h-full bg-ag-primary" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="flex justify-between items-center mt-1.5 text-[9px] text-ag-ink-3 font-semibold">
                              <span>Allocated: {bal.allocated} days</span>
                              <span>{percent}% Utilization</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Pending Requests summary */}
              <Card>
                <CardHeader title="Recent Leave Actions" subtitle="Latest status update tracks." />
                <div className="space-y-2.5 p-4 max-h-[300px] overflow-y-auto">
                  {applications.slice(0, 3).map((app, idx) => (
                    <div key={idx} className="p-3.5 border border-ag-border rounded-xl flex items-center justify-between hover:border-ag-border-strong bg-white text-xs gap-4">
                      <div>
                        <h4 className="font-bold text-ag-ink">{app.leaveTypeId?.name || 'Leave Request'}</h4>
                        <p className="text-ag-ink-3 text-[11px] mt-0.5">
                          Duration: {formatDate(app.from)} to {formatDate(app.to)} ({app.days} days)
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <div className="text-center py-6 text-xs text-ag-ink-3">No leaves filed.</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Sidebar: Upcoming Holidays, Long Weekends */}
            <div className="space-y-6">
              
              {/* Long weekends alerts */}
              <Card className="p-5">
                <CardHeader title="Long Weekends (2026)" subtitle="Plan your vacations ahead." />
                <div className="space-y-3 mt-4">
                  {LONG_WEEKENDS.map((lw) => (
                    <div key={lw.id} className="p-3 border border-ag-border/70 rounded-xl bg-ag-surface-2/15 hover:border-ag-border-strong transition-all text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-ag-ink">{lw.title}</span>
                        <span className="text-ag-primary">{lw.days}</span>
                      </div>
                      <p className="text-ag-ink-3 mt-1 text-[10px]">{lw.dates}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Holidays highlights */}
              <Card className="p-5 bg-[#FFF8E6] border border-ag-amber/30">
                <div className="flex gap-3">
                  <Warning size={20} className="text-ag-amber shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-ag-ink text-xs">Next Holiday Upcoming</h4>
                    <p className="text-[11px] text-ag-ink-3 mt-1.5">
                      <b>Independence Day</b> is scheduled on Saturday, August 15, 22026. Weekly off policies will apply.
                    </p>
                  </div>
                </div>
              </Card>

            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: APPLY LEAVE FORM
          ========================================== */}
      {activeTab === 'apply' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Apply Leave Request" subtitle="Select dates, specify reason, and submit for approvals." />
              <form className="p-5 space-y-4" onSubmit={handleApply}>
                
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Leave Category</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:border-ag-primary font-bold"
                    value={form.leaveTypeId}
                    onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                    required
                  >
                    <option value="">Choose leave type</option>
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
                    required
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="halfDay"
                    checked={form.halfDay}
                    onChange={(e) => setForm({ ...form, halfDay: e.target.checked })}
                    className="rounded border-ag-border text-ag-primary"
                  />
                  <label htmlFor="halfDay" className="text-sm font-semibold text-ag-ink">Apply as Half Day</label>
                </div>

                {form.halfDay && (
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Half Day Slot</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={form.halfDayType}
                      onChange={(e: any) => setForm({ ...form, halfDayType: e.target.value })}
                    >
                      <option value="first_half">First Half (Morning)</option>
                      <option value="second_half">Second Half (Afternoon)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Emergency Contact Number"
                    placeholder="e.g. +91 999999999"
                    value={form.emergencyContact}
                    onChange={e => setForm({ ...form, emergencyContact: e.target.value })}
                  />
                  <Select
                    label="Delegate Tasks / Work To"
                    value={form.delegateId}
                    onChange={e => setForm({ ...form, delegateId: e.target.value })}
                    options={[
                      { value: '', label: 'Select team buddy...' },
                      { value: 'Ananya Sen', label: 'Ananya Sen (Frontend Lead)' },
                      { value: 'Rahul Tiwari', label: 'Rahul Tiwari (Product manager)' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Reason for Leave</label>
                  <textarea
                    className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:border-ag-primary"
                    rows={3}
                    placeholder="Describe reason for time off request..."
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit">Submit Application</Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Validation & Conflict Check panel */}
          <div className="space-y-6">
            <Card className="p-5">
              <CardHeader title="Policy Conflict Check" subtitle="Validates team logs in real-time." />
              <div className="space-y-4 mt-4 text-xs">
                {conflictWarning ? (
                  <div className="p-3 border border-ag-coral/30 bg-ag-coral-light/20 text-ag-coral rounded-xl flex gap-2">
                    <Warning size={18} className="shrink-0" />
                    <p className="font-semibold leading-relaxed">{conflictWarning}</p>
                  </div>
                ) : (
                  <div className="p-3 border border-ag-mint/30 bg-[#E6FAF4] text-ag-mint rounded-xl flex gap-2">
                    <CheckCircle size={18} className="shrink-0" />
                    <p className="font-semibold">Conflict Check Passed: No overlapping team leaves detected.</p>
                  </div>
                )}

                {holidayDetected && (
                  <div className="p-3 border border-ag-amber/30 bg-[#FFF8E6] text-ag-amber rounded-xl flex gap-2">
                    <Info size={18} className="shrink-0" />
                    <p className="font-semibold leading-relaxed">{holidayDetected}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Approval workflow timeline */}
            <Card className="p-5">
              <CardHeader title="Approval Timeline Flow" subtitle="Sequential workflow approvals path." />
              <div className="space-y-4 mt-4 relative pl-5">
                {[
                  { title: '1. Self Submission', desc: 'Request submitted to system.', status: 'completed' },
                  { title: '2. Manager Approval', desc: 'Priya Sharma (Engineering Lead)', status: 'pending' },
                  { title: '3. HR Validation Check', desc: 'Amit Verma (HR Lead)', status: 'pending' },
                  { title: '4. Payroll Accrual Adjustment', desc: 'Final balance lock & credit slips.', status: 'pending' }
                ].map((step, idx) => (
                  <div key={idx} className="relative pb-4">
                    <div className="absolute -left-5 top-0.5 w-3 h-3 rounded-full bg-ag-primary shrink-0 ring-4 ring-white" />
                    <h5 className="font-bold text-xs text-ag-ink">{step.title}</h5>
                    <p className="text-[10px] text-ag-ink-3 mt-0.5">{step.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 3: REQUEST HISTORY
          ========================================== */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader title="Time-Off Request History" subtitle="Consolidated list of historical request applications." />
          <DataTable
            columns={columns}
            data={applications}
            isLoading={isLoading}
            emptyTitle="History Ledger Empty"
            emptySubtitle="You haven't requested any time off yet."
          />
        </Card>
      )}

      {/* ==========================================
          TAB 4: HOLIDAYS CALENDAR
          ========================================== */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Holidays list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Yearly Public Holidays (2026)" subtitle="National, regional, and restricted calendar dates." />
              <div className="space-y-2.5 p-4">
                {HOLIDAYS.map((h, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-ag-border/75 rounded-xl hover:border-ag-border-strong bg-white text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-ag-primary" />
                      <div>
                        <h4 className="font-black text-ag-ink">{h.name}</h4>
                        <span className="text-[9px] font-black uppercase text-ag-primary bg-ag-primary-light px-2 py-0.5 rounded mt-1 block w-fit">
                          {h.type}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-ag-ink-3">{formatDate(h.date)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Holiday summary details */}
          <div className="space-y-6">
            <Card className="p-5 bg-ag-surface border border-ag-border rounded-xl">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-2">Restricted Holidays Rules</h4>
              <p className="text-[11px] text-ag-ink-3 leading-relaxed">
                Optional Holidays (RH) can be self-declared by filing the "Optional Holiday" category. Employees are eligible for a maximum of 2 optional holidays per calendar year.
              </p>
            </Card>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 5: TEAM AVAILABILITY HEATMAP
          ========================================== */}
      {activeTab === 'availability' && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader title="Team Availability Matrix" subtitle="Real-time check in status roster for today." />
          
          <div className="border border-ag-border rounded-xl overflow-hidden m-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ag-surface-2 text-ag-ink-3 font-black uppercase text-[10px] border-b border-ag-border">
                  <th className="p-3">Team Member</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Designation Role</th>
                  <th className="p-3 text-right">Availability Status</th>
                </tr>
              </thead>
              <tbody>
                {TEAM_MEMBERS.map((member) => {
                  return (
                    <tr key={member.id} className="border-b border-ag-border hover:bg-ag-surface-2/15 bg-white">
                      <td className="p-3 font-bold text-ag-ink">{member.name}</td>
                      <td className="p-3 text-ag-ink-3">{member.dept}</td>
                      <td className="p-3 text-ag-ink-3">{member.role}</td>
                      <td className="p-3 text-right">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          member.status === 'available'
                            ? 'bg-[#E6FAF4] text-ag-mint'
                            : member.status === 'leave'
                              ? 'bg-ag-coral-light/25 text-ag-coral'
                              : member.status === 'wfh'
                                ? 'bg-ag-primary-light text-ag-primary'
                                : 'bg-[#FFF8E6] text-ag-amber'
                        }`}>
                          {member.status === 'available' ? 'Available' : member.status === 'leave' ? 'On Leave' : member.status === 'wfh' ? 'Work From Home' : 'Training'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==========================================
          TAB 6: LEAVE LEDGER LOG
          ========================================== */}
      {activeTab === 'ledger' && (
        <Card>
          <CardHeader title="Double-Entry Leave Ledger Log" subtitle="Comprehensive record statement of leave changes." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ag-border text-ag-ink-3 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 text-left font-semibold">Date</th>
                  <th className="py-3 px-4 text-left font-semibold">Leave Type</th>
                  <th className="py-3 px-4 text-left font-semibold">Transaction Type</th>
                  <th className="py-3 px-4 text-left font-semibold">Credit/Debit</th>
                  <th className="py-3 px-4 text-left font-semibold">Previous Balance</th>
                  <th className="py-3 px-4 text-left font-semibold">New Balance</th>
                  <th className="py-3 px-4 text-left font-semibold">Description / References</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center p-8 text-ag-ink-3">Loading ledger statements…</td></tr>
                ) : ledgers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-8 text-ag-ink-3">No transactions logged in ledger.</td></tr>
                ) : (
                  ledgers.map(entry => {
                    const isCredit = ['accrual', 'opening', 'carry_forward'].includes(entry.transactionType);
                    return (
                      <tr key={entry.id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-ag-ink-3">{entry.transactionDate}</td>
                        <td className="py-3 px-4 font-bold text-ag-ink text-xs">{entry.leaveTypeName}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded capitalize ${
                            isCredit
                              ? 'bg-[#E6FAF4] text-ag-mint'
                              : 'bg-ag-primary-light text-ag-primary'
                          }`}>
                            {entry.transactionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-mono text-xs font-black ${isCredit ? 'text-ag-mint' : 'text-ag-primary'}`}>
                          {isCredit ? `+${entry.days}` : `-${entry.days}`}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-ag-ink-3">{entry.previousBalance}</td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-ag-ink-2">{entry.newBalance}</td>
                        <td className="py-3 px-4 text-xs text-ag-ink-3 max-w-[200px] truncate">{entry.description}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==========================================
          TAB 7: LEAVE ENCASHMENT
          ========================================== */}
      {activeTab === 'encashment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          <div className="lg:col-span-2">
            <Card className="p-5">
              <h4 className="font-display font-black text-base text-ag-ink border-b border-ag-border pb-3 mb-4 flex items-center gap-2">
                <Coins size={20} className="text-ag-primary" /> Submit Encashment Payout Request
              </h4>
              <form onSubmit={handleApplyEncashment} className="space-y-4">
                <Select
                  label="Select Eligible Leave Type"
                  value={encashTypeId}
                  onChange={e => setEncashTypeId(e.target.value)}
                  options={[
                    { value: '', label: 'Select leave type...' },
                    ...balances.map(b => ({ value: b.leaveTypeId?.id, label: `${b.leaveTypeId?.name} (${b.available} available)` }))
                  ]}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Days to Cash Out"
                    type="number"
                    required
                    value={encashDays}
                    onChange={e => setEncashDays(e.target.value)}
                  />
                  <Input
                    label="Estimated Gross Payout (INR)"
                    value={(parseFloat(encashDays || '0') * 2400).toLocaleString('en-IN')}
                    disabled
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">Remarks / Claim Reason</label>
                  <textarea
                    placeholder="e.g. Year-end unused leave cash out"
                    className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-xs focus:outline-none"
                    rows={2}
                    value={encashReason}
                    onChange={e => setEncashReason(e.target.value)}
                  />
                </div>

                <Button type="submit">Submit Claim</Button>
              </form>
            </Card>
          </div>

          {/* Claims History */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Encashment Slips" subtitle="Historical payout claims logs." />
              <div className="p-4 space-y-3">
                {encashments.map((enc) => (
                  <div key={enc.id} className="p-3 border border-ag-border rounded-xl text-xs space-y-1 bg-white">
                    <div className="flex justify-between font-bold">
                      <span className="text-ag-ink">{enc.leaveTypeName || 'Leave Encash'}</span>
                      <span className="text-ag-primary">₹{enc.amount}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-ag-ink-3">
                      <span>Days: {enc.days} days</span>
                      <span className="uppercase font-bold">{enc.status}</span>
                    </div>
                  </div>
                ))}
                {encashments.length === 0 && (
                  <div className="text-center py-6 text-xs text-ag-ink-3">No claims recorded.</div>
                )}
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 8: COMPANY POLICIES
          ========================================== */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 space-y-4">
              <div>
                <h3 className="font-display font-black text-base text-ag-ink">Time-Off Regulations & Policy Handbooks</h3>
                <p className="text-xs text-ag-ink-3 mt-0.5">Summary of rules regarding accrued allocations and leaves rollover limits.</p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 border border-ag-border rounded-xl bg-white space-y-1">
                  <h4 className="font-bold text-ag-ink">1. Annual Leave Carry Forward Cap</h4>
                  <p className="text-ag-ink-3 leading-relaxed">
                    A maximum of 10 Annual Leaves (AL) can be rolled over to the next financial year. Any excess unavailed leaves will automatically lapse on December 31.
                  </p>
                </div>
                <div className="p-3 border border-ag-border rounded-xl bg-white space-y-1">
                  <h4 className="font-bold text-ag-ink">2. Medical / Sick Leave accruals</h4>
                  <p className="text-ag-ink-3 leading-relaxed">
                    Sick Leaves (SL) accrue on the 1st of every month at a rate of 1.0 day/month. Medical certificate uploads are mandatory for sick leaves extending beyond 3 consecutive days.
                  </p>
                </div>
                <div className="p-3 border border-ag-border rounded-xl bg-white space-y-1">
                  <h4 className="font-bold text-ag-ink">3. Optional Restricted Holidays (RH)</h4>
                  <p className="text-ag-ink-3 leading-relaxed">
                    Eligible employees can select up to 2 regional restricted optional festival holidays from the Restricted holidays calendar registry.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5 bg-ag-surface border border-ag-border rounded-xl">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-2">Leave Notice period rule</h4>
              <p className="text-[11px] text-ag-ink-3 leading-relaxed">
                Leaves are generally not allowed to be availed during active resignation notice periods. Any leaves taken during notice period will push out the Last Working Day (LWD) by the corresponding number of days.
              </p>
            </Card>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 9: ADMIN CONSOLE
          ========================================== */}
      {activeTab === 'admin' && isAdmin && (
        <div className="space-y-6">
          
          {/* Top Analytics row */}
          <div className="grid grid-cols-2 gap-5 max-w-xl">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-ag-ink-3 font-black uppercase">Avg Leave Duration</span>
                <h3 className="text-xl font-black text-ag-primary mt-2">
                  {isLoading ? '—' : `${analytics?.averageLeaveDuration ?? 0} Days`}
                </h3>
              </div>
              <TrendUp size={30} className="text-ag-primary/20" />
            </Card>
            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-ag-ink-3 font-black uppercase">Loss of Pay (LOP) Slabs</span>
                <h3 className="text-xl font-black text-ag-accent-pink mt-2">
                  {isLoading ? '—' : `${analytics?.totalLopDays ?? 0} Days`}
                </h3>
              </div>
              <Warning size={30} className="text-ag-accent-pink/20" />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pending Payout Encashments */}
            <Card>
              <CardHeader title="Pending Encashments Claims" subtitle="Approve or reject employee carry forward cash outs." />
              <div className="p-4 space-y-4">
                {encashments.filter(e => e.status === 'pending').length === 0 ? (
                  <div className="text-center p-4 text-ag-ink-3 text-xs">No pending payouts.</div>
                ) : (
                  encashments.filter(e => e.status === 'pending').map(enc => (
                    <div key={enc.id} className="p-3.5 border border-ag-border rounded-xl space-y-3 bg-white text-xs">
                      <div className="flex justify-between items-start font-bold">
                        <div>
                          <h4 className="text-ag-ink">{enc.employeeName} ({enc.employeeCode})</h4>
                          <span className="text-[10px] text-ag-ink-3 font-normal">Type: {enc.leaveTypeName}</span>
                        </div>
                        <span className="font-mono text-ag-mint">
                          {enc.days} Days / ₹{enc.amount}
                        </span>
                      </div>
                      <div className="p-2 border border-ag-border bg-ag-surface rounded-lg text-ag-ink-3">
                        <b>Reason:</b> {enc.reason || 'Not specified'}
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
                          Approve Claim
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Run Accruals Form */}
            <Card className="p-5">
              <h3 className="font-display font-black text-base text-ag-ink flex items-center gap-2 mb-3 border-b border-ag-border pb-3">
                <Calendar size={20} className="text-ag-primary" /> Trigger Batch Accrual Run
              </h3>
              <form onSubmit={handleTriggerAccrual} className="space-y-4">
                <Select
                  label="Accrual Employee Target"
                  value={accrualEmpId}
                  onChange={e => setAccrualEmpId(e.target.value)}
                  options={[
                    { value: '', label: 'All Employees' },
                    ...employees.map(e => ({ value: e.id, label: `${e.fullName} (${e.employeeId})` }))
                  ]}
                />
                <Select
                  label="Accrual Leave Type"
                  value={accrualTypeId}
                  onChange={e => setAccrualTypeId(e.target.value)}
                  options={[
                    { value: '', label: 'All Accrual-Based Leave Types' },
                    ...leaveTypes.filter(t => t.accrual_based).map(t => ({ value: t.id, label: `${t.name} (${t.code})` }))
                  ]}
                />
                <Button type="submit">Run Accruals</Button>
              </form>
            </Card>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Run Year End Carry Forward */}
            <Card className="p-5">
              <h3 className="font-display font-black text-base text-ag-ink flex items-center gap-2 mb-3 border-b border-ag-border pb-3">
                <Clock size={20} className="text-ag-mint" /> Execute Year-End Carry Forward
              </h3>
              <p className="text-xs text-ag-ink-3 mb-4 leading-relaxed">
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
                <Button type="submit" variant="secondary">Execute Carry Forward Roll Over</Button>
              </form>
            </Card>

          </div>

        </div>
      )}

    </PageContainer>
  );
}
