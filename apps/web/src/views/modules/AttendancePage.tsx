import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { attendanceService, employeeService } from '@/services/api.service';
import { useAuthStore } from '@/store/authStore';
import {
  Clock, Coffee, MapPin, Sliders, Calendar, Lock, ThumbsUp, ThumbsDown,
  Warning, Check, ArrowsClockwise, Plus, Buildings, ChartBar, Users,
  Fingerprint, Timer, CaretRight, TrendUp, WifiHigh, WifiX,
  CheckCircle, XCircle, Hourglass, ArrowRight, Shield, Bell, X,
  IdentificationCard, Sun, Moon, CloudMoon, Lightning
} from '@phosphor-icons/react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Summary = {
  today: string;
  present: number;
  wfh: number;
  late: number;
  absent: number;
  total: number;
  attendanceRate: number;
};

type WeekDay = {
  day: string;
  date: string;
  present: number;
  wfh: number;
  absent: number;
  late: number;
};

type AttendanceBreak = {
  id: string;
  breakType: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
};

type AttendanceRecord = {
  _id: string;
  employeeId: string;
  fullName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  workMode: string;
  geofenceStatus: string;
  isLocked: boolean;
  workingHours: number;
  otHours: number;
  breaks?: AttendanceBreak[];
};

type Regularization = {
  id: string;
  recordId: string;
  employeeName: string;
  employeeCode: string;
  date: string;
  requestType: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
};

type Shift = {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  gracePeriod: number;
  minWorkingHours: number;
  isActive: boolean;
};

type ActiveTab = 'dashboard' | 'my_attendance' | 'regularization' | 'team' | 'shifts' | 'overtime' | 'analytics' | 'admin';

// ─────────────────────────────────────────────────────────────────────────────
// Status color helper
// ─────────────────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  present:  'bg-[#E6FAF4] text-ag-mint',
  wfh:      'bg-ag-primary-light text-ag-primary',
  late:     'bg-[#FFF8E6] text-ag-amber',
  absent:   'bg-ag-accent-pink/15 text-ag-accent-pink',
  half_day: 'bg-ag-surface-2 text-ag-ink-3',
  holiday:  'bg-[#F0EDFF] text-ag-primary',
  leave:    'bg-[#FFF0EF] text-ag-coral',
  weekend:  'bg-ag-surface-2 text-ag-ink-3',
};

const statusIcon: Record<string, React.ReactNode> = {
  present:  <CheckCircle size={12} weight="fill" />,
  wfh:      <Buildings size={12} weight="fill" />,
  late:     <Warning size={12} weight="fill" />,
  absent:   <XCircle size={12} weight="fill" />,
  leave:    <Calendar size={12} weight="fill" />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Live Clock Hook
// ─────────────────────────────────────────────────────────────────────────────

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shift Progress Ring Component
// ─────────────────────────────────────────────────────────────────────────────

function ShiftRing({ checkInTime, shiftEnd = '18:00', size = 96 }: { checkInTime?: string; shiftEnd?: string; size?: number }) {
  const now = useLiveClock();
  const pct = React.useMemo(() => {
    if (!checkInTime) return 0;
    const [ciH, ciM] = checkInTime.split(':').map(Number);
    const [seH, seM] = shiftEnd.split(':').map(Number);
    const startMin = ciH * 60 + ciM;
    const endMin = seH * 60 + seM;
    const curMin = now.getHours() * 60 + now.getMinutes();
    const elapsed = curMin - startMin;
    const total = endMin - startMin;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }, [checkInTime, shiftEnd, now]);

  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4DFFF" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#5B3CF5" strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-lg font-black text-ag-primary font-display">{pct}%</span>
        <span className="block text-[9px] text-ag-ink-3 font-semibold">Shift</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card Component
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color = 'primary', loading = false }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: 'primary' | 'mint' | 'amber' | 'coral' | 'sky';
  loading?: boolean;
}) {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    primary: { bg: 'bg-ag-primary-light', text: 'text-ag-primary', ring: 'ring-ag-primary/20' },
    mint:    { bg: 'bg-[#E6FAF4]', text: 'text-ag-mint', ring: 'ring-ag-mint/20' },
    amber:   { bg: 'bg-[#FFF8E6]', text: 'text-ag-amber', ring: 'ring-ag-amber/20' },
    coral:   { bg: 'bg-[#FFF0EF]', text: 'text-ag-coral', ring: 'ring-ag-coral/20' },
    sky:     { bg: 'bg-[#E8F6FF]', text: 'text-ag-sky', ring: 'ring-ag-sky/20' },
  };
  const c = colorMap[color];

  return (
    <Card className="p-4 flex items-center gap-4 bg-white border border-ag-border/60 hover:border-ag-border-strong transition-all group">
      <div className={`p-3 ${c.bg} ${c.text} rounded-xl shrink-0 ring-4 ${c.ring} transition-all`}>
        {icon}
      </div>
      <div className="min-w-0">
        <span className="text-[10px] text-ag-ink-3 font-black uppercase tracking-wider block">{label}</span>
        {loading ? (
          <div className="h-6 w-16 bg-ag-border rounded mt-1 animate-pulse" />
        ) : (
          <span className="text-xl font-black text-ag-ink mt-0.5 block font-display">{value}</span>
        )}
        {sub && <span className="text-[10px] text-ag-ink-3">{sub}</span>}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { user } = useAuthStore();
  const now = useLiveClock();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Data states
  const [summary, setSummary]           = useState<Summary | null>(null);
  const [trend, setTrend]               = useState<WeekDay[]>([]);
  const [records, setRecords]           = useState<AttendanceRecord[]>([]);
  const [analytics, setAnalytics]       = useState<{ averageWorkingHours: number; totalOvertimeHours: number; punctualityRate: number } | null>(null);
  const [regularizations, setRegularizations] = useState<Regularization[]>([]);
  const [shifts, setShifts]             = useState<Shift[]>([]);
  const [employees, setEmployees]       = useState<{ _id: string; fullName: string; employeeId: string }[]>([]);
  const [isLoading, setIsLoading]       = useState(true);

  // Punch terminal states
  const [todayRecord, setTodayRecord]   = useState<AttendanceRecord | null>(null);
  const [workMode, setWorkMode]         = useState('onsite');
  const [breakType, setBreakType]       = useState('lunch');

  // Regularization form states
  const [regDate, setRegDate]           = useState('');
  const [regType, setRegType]           = useState('missed_punch');
  const [regCheckIn, setRegCheckIn]     = useState('09:00:00');
  const [regCheckOut, setRegCheckOut]   = useState('18:00:00');
  const [regReason, setRegReason]       = useState('');
  const [regFilter, setRegFilter]       = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Shift form states
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftName, setShiftName]       = useState('');
  const [shiftCode, setShiftCode]       = useState('');
  const [shiftStart, setShiftStart]     = useState('09:00');
  const [shiftEnd, setShiftEnd]         = useState('18:00');
  const [shiftGrace, setShiftGrace]     = useState('15');
  const [shiftBreak, setShiftBreak]     = useState('60');
  const [shiftMinHours, setShiftMinHours] = useState('8.0');
  const [assignEmpId, setAssignEmpId]   = useState('');
  const [assignShiftId, setAssignShiftId] = useState('');
  const [assignEffDate, setAssignEffDate] = useState(new Date().toISOString().split('T')[0]);

  // Period lock states
  const [lockStart, setLockStart]       = useState('');
  const [lockEnd, setLockEnd]           = useState('');

  const isAdmin = user && ['company_admin', 'hr_head', 'super_admin'].includes(user.role);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [summaryData, trendData, listData, analyticsData, regData] = await Promise.all([
        attendanceService.getSummary(),
        attendanceService.getWeeklyTrend(),
        attendanceService.list({ limit: 25 }),
        attendanceService.getAnalytics(),
        attendanceService.listRegularizations()
      ]);
      setSummary(summaryData);
      setTrend(trendData);
      setRecords(listData.records);
      setAnalytics(analyticsData);
      setRegularizations(regData);

      if (user?.employeeId) {
        const matching = listData.records.find(
          (r: AttendanceRecord) => r.employeeId === user.employeeId && r.date === todayStr
        );
        setTodayRecord(matching || null);
      }
    } catch {
      toast.error('Failed to load attendance data.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [shiftList, empList] = await Promise.all([
        attendanceService.listShifts(),
        employeeService.list({ limit: 100 })
      ]);
      setShifts(shiftList);
      setEmployees(empList.employees.map(e => ({ _id: e._id, fullName: e.fullName, employeeId: e.employeeId })));
    } catch {
      toast.error('Failed to load admin data.');
    }
  }, [isAdmin]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    if (activeTab === 'shifts' || activeTab === 'admin') fetchAdminData();
  }, [activeTab, fetchAdminData]);

  // ── Punch Actions ──────────────────────────────────────────────────────────

  const handleCheckIn = () => {
    if (!user) return;
    const performCheckIn = (lat?: number, lng?: number) => {
      attendanceService.checkIn({ employeeId: user.employeeId, fullName: user.fullName, workMode, lat, lng })
        .then(() => { toast.success('Checked in successfully!'); fetchDashboardData(); })
        .catch(err => toast.error(err.response?.data?.detail || 'Check-in failed.'));
    };
    if (workMode === 'onsite') {
      toast.loading('Resolving GPS…', { id: 'gps' });
      navigator.geolocation.getCurrentPosition(
        pos => { toast.dismiss('gps'); performCheckIn(pos.coords.latitude, pos.coords.longitude); },
        () => { toast.dismiss('gps'); toast.error('GPS denied. Proceeding.'); performCheckIn(); },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else performCheckIn();
  };

  const handleCheckOut = () => {
    if (!todayRecord) return;
    attendanceService.checkOut(todayRecord._id)
      .then(() => { toast.success('Checked out successfully!'); fetchDashboardData(); })
      .catch(err => toast.error(err.response?.data?.detail || 'Check-out failed.'));
  };

  const handleStartBreak = () => {
    attendanceService.startBreak({ date: new Date().toISOString().split('T')[0], breakType, employeeId: user?.employeeId })
      .then(() => { toast.success(`${breakType} break started.`); fetchDashboardData(); })
      .catch(err => toast.error(err.response?.data?.detail || 'Break start failed.'));
  };

  const handleEndBreak = () => {
    attendanceService.endBreak({ date: new Date().toISOString().split('T')[0], employeeId: user?.employeeId })
      .then(() => { toast.success('Break ended. Resuming work.'); fetchDashboardData(); })
      .catch(err => toast.error(err.response?.data?.detail || 'Break end failed.'));
  };

  const handleSubmitRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDate || !regReason) { toast.error('Fill all required fields.'); return; }
    attendanceService.requestRegularization({ date: regDate, requestType: regType, checkIn: regCheckIn, checkOut: regCheckOut, reason: regReason, employeeId: user?.employeeId })
      .then(() => { toast.success('Regularization request submitted.'); setRegDate(''); setRegReason(''); fetchDashboardData(); })
      .catch(err => toast.error(err.response?.data?.detail || 'Submission failed.'));
  };

  const handleApproveReg = (id: string, status: 'approved' | 'rejected') => {
    attendanceService.approveRegularization(id, { status, comments: 'Processed via admin console.' })
      .then(() => { toast.success(`Request ${status}.`); fetchDashboardData(); })
      .catch(err => toast.error(err.response?.data?.detail || 'Update failed.'));
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    attendanceService.createShift({ name: shiftName, code: shiftCode, startTime: shiftStart, endTime: shiftEnd, gracePeriod: parseInt(shiftGrace) || 15, breakDuration: parseInt(shiftBreak) || 60, minWorkingHours: parseFloat(shiftMinHours) || 8, isActive: true })
      .then(() => { toast.success('Shift created.'); setShiftName(''); setShiftCode(''); setShowShiftForm(false); fetchAdminData(); })
      .catch(err => toast.error(err.response?.data?.detail || 'Shift creation failed.'));
  };

  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmpId || !assignShiftId) { toast.error('Select employee and shift.'); return; }
    attendanceService.assignShift({ employeeId: assignEmpId, shiftId: assignShiftId, effectiveDate: assignEffDate })
      .then(() => { toast.success('Shift assigned.'); setAssignEmpId(''); setAssignShiftId(''); })
      .catch(err => toast.error(err.response?.data?.detail || 'Assignment failed.'));
  };

  const handleLockPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockStart || !lockEnd) { toast.error('Select date range.'); return; }
    attendanceService.lockAttendance({ startDate: lockStart, endDate: lockEnd })
      .then(res => { toast.success(`Locked ${res.lockedCount} records.`); setLockStart(''); setLockEnd(''); fetchDashboardData(); })
      .catch(err => toast.error(err.response?.data?.detail || 'Lock failed.'));
  };

  // ── Derived Data ───────────────────────────────────────────────────────────

  const activeBreak    = todayRecord?.breaks?.find(b => !b.endTime);
  const filteredRegs   = regularizations.filter(r => regFilter === 'all' || r.status === regFilter);
  const pendingRegs    = regularizations.filter(r => r.status === 'pending').length;

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const shiftLabel = (s: Shift) => `${s.name} (${s.startTime}–${s.endTime})`;

  // Analytics mock for dept comparison chart
  const deptChartData = [
    { dept: 'Engineering', rate: 92, avg: 8.2 },
    { dept: 'Marketing', rate: 88, avg: 7.8 },
    { dept: 'Finance', rate: 95, avg: 8.5 },
    { dept: 'HR', rate: 90, avg: 8.0 },
    { dept: 'Operations', rate: 85, avg: 7.5 },
  ];

  const pieData = [
    { name: 'Present', value: summary?.present ?? 0, color: '#00C48C' },
    { name: 'WFH', value: summary?.wfh ?? 0, color: '#5B3CF5' },
    { name: 'Late', value: summary?.late ?? 0, color: '#FFB020' },
    { name: 'Absent', value: summary?.absent ?? 0, color: '#FF5F57' },
  ];

  // Weekly calendar mock
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const myWeekStatuses = trend.map((d, i) => {
    const selfRecord = records.find(r => r.employeeId === user?.employeeId && r.date === d.date);
    if (!selfRecord) return weekDays[i] ? (i >= 5 ? 'weekend' : 'absent') : 'weekend';
    return selfRecord.status;
  });

  // ── Tabs config ────────────────────────────────────────────────────────────

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; adminOnly?: boolean; badge?: number }[] = [
    { id: 'dashboard',    label: 'Executive Dashboard',  icon: <ChartBar size={15} /> },
    { id: 'my_attendance',label: 'My Workspace',          icon: <Fingerprint size={15} /> },
    { id: 'regularization', label: 'Regularization',      icon: <Calendar size={15} />, badge: pendingRegs },
    { id: 'team',         label: 'Team Attendance',       icon: <Users size={15} /> },
    { id: 'shifts',       label: 'Shift Management',      icon: <Sliders size={15} />, adminOnly: true },
    { id: 'overtime',     label: 'Overtime',              icon: <Timer size={15} /> },
    { id: 'analytics',    label: 'Analytics',             icon: <TrendUp size={15} />, adminOnly: true },
    { id: 'admin',        label: 'Admin Console',         icon: <Shield size={15} />, adminOnly: true },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <PageContainer
      title="Workforce Time Management"
      subtitle="Manage attendance, shifts, breaks, overtime, and workforce analytics across the organization."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fetchDashboardData} icon={<ArrowsClockwise size={18} />}>Refresh</Button>
        </div>
      }
    >

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 p-1 bg-ag-surface-2 border border-ag-border rounded-xl w-fit shrink-0 scrollbar-none mb-8 overflow-x-auto max-w-full">
        {tabs.filter(t => !t.adminOnly || isAdmin).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-ag-primary text-white shadow-sm'
                : 'text-ag-ink-3 hover:text-ag-ink-2 hover:bg-ag-surface'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-ag-coral text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: EXECUTIVE DASHBOARD
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard label="Present Today"    value={summary?.present ?? '—'}        icon={<CheckCircle size={20} />} color="mint"    loading={isLoading} sub={`of ${summary?.total ?? 0} total`} />
            <KpiCard label="Absent Today"     value={summary?.absent ?? '—'}         icon={<XCircle size={20} />}     color="coral"   loading={isLoading} />
            <KpiCard label="Late Arrivals"    value={summary?.late ?? '—'}           icon={<Warning size={20} />}     color="amber"   loading={isLoading} />
            <KpiCard label="Work From Home"   value={summary?.wfh ?? '—'}            icon={<Buildings size={20} />}   color="primary" loading={isLoading} />
            <KpiCard label="Attendance Rate"  value={`${summary?.attendanceRate ?? 0}%`} icon={<TrendUp size={20} />} color="mint"   loading={isLoading} />
            <KpiCard label="Avg. Working Hrs" value={`${analytics?.averageWorkingHours ?? 0}h`} icon={<Clock size={20} />} color="sky" loading={isLoading} />
          </div>

          {/* Charts + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Trend Bar Chart */}
            <Card className="lg:col-span-2 p-5">
              <CardHeader title="Weekly Attendance Trend" subtitle="Present, WFH, Late, and Absent breakdown for the current week." />
              <div className="h-56">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-ag-ink-3 text-xs">Loading…</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                      <XAxis dataKey="day" stroke="#8E88A8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8E88A8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E8F0', fontSize: 12 }} />
                      <Bar dataKey="present" fill="#00C48C" radius={[4,4,0,0]} name="Present" />
                      <Bar dataKey="wfh"     fill="#5B3CF5" radius={[4,4,0,0]} name="WFH" />
                      <Bar dataKey="late"    fill="#FFB020" radius={[4,4,0,0]} name="Late" />
                      <Bar dataKey="absent"  fill="#FF5F57" radius={[4,4,0,0]} name="Absent" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Today's Distribution Donut */}
            <Card className="p-5">
              <CardHeader title="Today's Distribution" subtitle="Attendance status split." />
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} employees`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map(p => (
                  <div key={p.name} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-ag-ink-3">{p.name}:</span>
                    <strong className="text-ag-ink">{p.value}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Full Timesheets Table */}
          <Card>
            <CardHeader
              title="Today's Attendance Timesheets"
              subtitle="Live check-in logs across the organization."
              actions={
                <span className="text-xs text-ag-ink-3">
                  {records.length} records loaded
                </span>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2/40">
                    {['Employee', 'Date', 'Mode', 'Check In', 'Check Out', 'Working Hrs', 'OT Hrs', 'Geofence', 'Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={9} className="text-center p-8 text-ag-ink-3 text-xs">Loading records…</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={9} className="text-center p-8 text-ag-ink-3 text-xs">No attendance records for today.</td></tr>
                  ) : records.map(r => (
                    <tr key={r._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-ag-ink text-xs">{r.fullName}</td>
                      <td className="py-3 px-4 text-ag-ink-3 font-mono text-[11px]">{r.date}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${r.workMode === 'wfh' ? 'bg-ag-primary-light text-ag-primary' : 'bg-ag-surface-2 text-ag-ink-2'}`}>
                          {r.workMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-ag-ink-2 font-mono text-[11px]">{r.checkIn ?? '—'}</td>
                      <td className="py-3 px-4 text-ag-ink-2 font-mono text-[11px]">{r.checkOut ?? '—'}</td>
                      <td className="py-3 px-4 text-ag-ink-2 font-mono text-[11px]">{r.workingHours} hrs</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-ag-mint font-semibold">{r.otHours > 0 ? `+${r.otHours}h` : '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${r.geofenceStatus === 'inside' ? 'bg-[#E6FAF4] text-ag-mint' : r.geofenceStatus === 'outside' ? 'bg-[#FFF0EF] text-ag-coral' : 'bg-ag-surface-2 text-ag-ink-3'}`}>
                          {r.geofenceStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex items-center gap-1 w-fit ${statusColor[r.status] ?? 'bg-ag-surface text-ag-ink-3'}`}>
                          {statusIcon[r.status]}
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: MY ATTENDANCE WORKSPACE (THREE-PANEL)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'my_attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── LEFT PANEL: Punch Terminal (35%) ── */}
          <div className="lg:col-span-4 space-y-5">

            {/* Digital Clock */}
            <Card className="p-5 bg-ag-ink text-white border-0">
              <div className="text-center space-y-1">
                <div className="text-3xl font-black font-display tracking-tight">{timeStr}</div>
                <div className="text-xs text-white/50">{dateStr}</div>
              </div>

              {/* Shift Ring */}
              <div className="flex justify-center mt-4 mb-3">
                <ShiftRing checkInTime={todayRecord?.checkIn} size={100} />
              </div>

              {/* Status Chips Row */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold ${
                  todayRecord ? 'bg-[#00C48C]/20 text-[#00C48C]' : 'bg-white/10 text-white/50'
                }`}>
                  <WifiHigh size={12} />
                  {todayRecord ? 'Checked In' : 'Not Checked In'}
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold ${
                  activeBreak ? 'bg-[#FFB020]/20 text-[#FFB020]' : 'bg-white/10 text-white/50'
                }`}>
                  <Coffee size={12} />
                  {activeBreak ? 'On Break' : 'Working'}
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold col-span-2 ${
                  todayRecord?.geofenceStatus === 'inside' ? 'bg-[#5B3CF5]/30 text-[#B9ADFF]' :
                  todayRecord?.geofenceStatus === 'outside' ? 'bg-[#FF5F57]/20 text-[#FF8A84]' : 'bg-white/10 text-white/50'
                }`}>
                  <MapPin size={12} />
                  Geofence: {todayRecord?.geofenceStatus ?? 'Unknown'}
                </div>
              </div>
            </Card>

            {/* Punch Actions */}
            <Card className="p-5 space-y-4">
              <h3 className="font-display font-black text-sm text-ag-ink border-b border-ag-border pb-2">
                Attendance Terminal
              </h3>

              {!todayRecord ? (
                <div className="space-y-3">
                  <Select
                    label="Work Mode"
                    value={workMode}
                    onChange={e => setWorkMode(e.target.value)}
                    options={[
                      { value: 'onsite', label: '🏢 Onsite (GPS Verified)' },
                      { value: 'wfh', label: '🏠 Work From Home (Remote)' },
                    ]}
                  />
                  <Button className="w-full" onClick={handleCheckIn} icon={<Fingerprint size={18} />}>
                    Punch In — Start Shift
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-[#E6FAF4] text-ag-mint rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check size={14} weight="bold" />
                    Checked in at <span className="font-mono ml-1">{todayRecord.checkIn}</span>
                  </div>

                  {!todayRecord.checkOut ? (
                    <>
                      {!activeBreak ? (
                        <div className="space-y-2">
                          <Select
                            label="Break Type"
                            value={breakType}
                            onChange={e => setBreakType(e.target.value)}
                            options={[
                              { value: 'lunch', label: '🍽️ Lunch Break' },
                              { value: 'tea', label: '☕ Tea / Coffee Break' },
                              { value: 'meeting', label: '📋 Official Meeting' },
                              { value: 'personal', label: '🚶 Personal Break' },
                            ]}
                          />
                          <Button variant="secondary" className="w-full" onClick={handleStartBreak} icon={<Coffee size={16} />}>
                            Start Break Session
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-3 bg-[#FFF8E6] text-ag-amber rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                            <Coffee size={14} weight="fill" />
                            On {activeBreak.breakType} break since {activeBreak.startTime}
                          </div>
                          <Button className="w-full" onClick={handleEndBreak}>
                            End Break & Resume Work
                          </Button>
                        </div>
                      )}

                      <Button variant="secondary" className="w-full" onClick={handleCheckOut} icon={<Lock size={16} />}>
                        Punch Out — End Shift
                      </Button>
                    </>
                  ) : (
                    <div className="p-3 bg-ag-surface-2 text-ag-ink-3 rounded-xl text-center text-xs border border-ag-border">
                      Checked out at <b className="font-mono text-ag-ink">{todayRecord.checkOut}</b>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* ── CENTER PANEL: Timeline + Weekly Calendar (40%) ── */}
          <div className="lg:col-span-5 space-y-5">

            {/* Today's Punch Timeline */}
            <Card className="p-5">
              <CardHeader title="Today's Attendance Timeline" subtitle="Chronological log of all punches and breaks." />

              {!todayRecord ? (
                <div className="text-center py-8 text-xs text-ag-ink-3">
                  <Clock size={36} className="mx-auto mb-2 text-ag-border-strong" />
                  No punch activity recorded for today. Start your shift to see the timeline.
                </div>
              ) : (
                <div className="relative pl-6 space-y-0">
                  {/* Check-In */}
                  <div className="relative pb-4">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-ag-mint flex items-center justify-center">
                      <Check size={8} weight="bold" className="text-white" />
                    </div>
                    <div className="absolute left-[7px] top-5 bottom-0 w-[2px] bg-ag-border" />
                    <div className="pl-4">
                      <span className="font-black text-xs text-ag-ink">Check In</span>
                      <span className="font-mono text-xs text-ag-ink-3 ml-2">{todayRecord.checkIn}</span>
                      <div className="text-[10px] text-ag-ink-3 mt-0.5">
                        Mode: {todayRecord.workMode} · Geofence: {todayRecord.geofenceStatus}
                      </div>
                    </div>
                  </div>

                  {/* Breaks */}
                  {(todayRecord.breaks ?? []).map((b, i) => (
                    <React.Fragment key={b.id}>
                      <div className="relative pb-4">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-ag-amber flex items-center justify-center">
                          <Coffee size={8} weight="bold" className="text-white" />
                        </div>
                        {(i < (todayRecord.breaks?.length ?? 0) - 1 || todayRecord.checkOut) && (
                          <div className="absolute left-[7px] top-5 bottom-0 w-[2px] bg-ag-border" />
                        )}
                        <div className="pl-4">
                          <span className="font-black text-xs text-ag-ink capitalize">Break — {b.breakType}</span>
                          <span className="font-mono text-xs text-ag-ink-3 ml-2">{b.startTime}</span>
                          {b.endTime && (
                            <>
                              <span className="text-[10px] text-ag-ink-3 block mt-0.5">
                                Ended: {b.endTime} · Duration: {b.durationMinutes ?? '?'} min
                              </span>
                            </>
                          )}
                          {!b.endTime && (
                            <span className="text-[10px] text-ag-amber font-bold animate-pulse block mt-0.5">On break…</span>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}

                  {/* Check-Out */}
                  {todayRecord.checkOut && (
                    <div className="relative">
                      <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-ag-coral flex items-center justify-center">
                        <Lock size={8} weight="bold" className="text-white" />
                      </div>
                      <div className="pl-4">
                        <span className="font-black text-xs text-ag-ink">Check Out</span>
                        <span className="font-mono text-xs text-ag-ink-3 ml-2">{todayRecord.checkOut}</span>
                        <div className="text-[10px] text-ag-ink-3 mt-0.5">
                          Total: {todayRecord.workingHours}h worked · OT: {todayRecord.otHours}h
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Weekly Calendar Grid */}
            <Card className="p-5">
              <CardHeader title="This Week's Attendance" subtitle="Color-coded status per day." />
              <div className="grid grid-cols-7 gap-2 text-center text-[10px]">
                {trend.map((d, i) => {
                  const st = myWeekStatuses[i] ?? 'absent';
                  const isToday = d.date === new Date().toISOString().split('T')[0];
                  return (
                    <div key={i} className={`rounded-xl p-2 border transition-all ${
                      isToday ? 'border-ag-primary' : 'border-transparent'
                    } ${statusColor[st] ?? 'bg-ag-surface-2 text-ag-ink-3'}`}>
                      <div className="font-black">{d.day}</div>
                      <div className="font-mono text-[9px] mt-0.5 opacity-70">{d.date.slice(5)}</div>
                      <div className="mt-1 capitalize font-bold text-[9px]">{st}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── RIGHT PANEL: Context Sidebar (25%) ── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Employee Summary */}
            <Card className="p-5 space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar name={user?.fullName ?? 'User'} size="lg" />
                <h4 className="font-display font-black text-sm text-ag-ink mt-2">{user?.fullName}</h4>
                <span className="text-[10px] text-ag-ink-3">{user?.role?.replace('_', ' ')}</span>
              </div>
              <div className="space-y-2 text-[10px] pt-2 border-t border-ag-border">
                <div className="flex justify-between">
                  <span className="text-ag-ink-3">Today's Hours:</span>
                  <strong className="text-ag-ink font-mono">{todayRecord?.workingHours ?? 0}h</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ag-ink-3">Break Time:</span>
                  <strong className="text-ag-ink font-mono">
                    {(todayRecord?.breaks ?? []).filter(b => b.endTime).reduce((s, b) => s + (b.durationMinutes ?? 0), 0)} min
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ag-ink-3">Overtime:</span>
                  <strong className="text-ag-mint font-mono">+{todayRecord?.otHours ?? 0}h</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ag-ink-3">Work Mode:</span>
                  <strong className="text-ag-ink capitalize">{todayRecord?.workMode ?? workMode}</strong>
                </div>
              </div>
            </Card>

            {/* Monthly Summary Ring */}
            <Card className="p-5">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-3">Monthly Attendance</h4>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E4DFFF" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#5B3CF5" strokeWidth="3"
                      strokeDasharray={`${analytics?.punctualityRate ?? 90} ${100 - (analytics?.punctualityRate ?? 90)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black text-ag-primary">{analytics?.punctualityRate ?? 90}%</span>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div><span className="text-ag-ink-3">Punctuality Rate</span></div>
                  <div><span className="text-ag-ink-3">Avg Hours:</span> <strong className="text-ag-ink">{analytics?.averageWorkingHours ?? 0}h</strong></div>
                  <div><span className="text-ag-ink-3">OT Total:</span> <strong className="text-ag-mint">{analytics?.totalOvertimeHours ?? 0}h</strong></div>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-5">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-3">Quick Actions</h4>
              <div className="space-y-2">
                {[
                  { label: 'Apply Regularization', tab: 'regularization' as ActiveTab },
                  { label: 'View Team Attendance', tab: 'team' as ActiveTab },
                  { label: 'Overtime Tracker', tab: 'overtime' as ActiveTab },
                ].map(link => (
                  <button
                    key={link.label}
                    onClick={() => setActiveTab(link.tab)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-ag-surface-2 hover:bg-ag-primary-light hover:text-ag-primary transition-all text-xs font-semibold text-ag-ink-2 group"
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: REGULARIZATION (THREE-PANEL)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'regularization' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Panel: Form (35%) */}
          <div className="lg:col-span-4 space-y-5">
            <Card className="p-5">
              <h3 className="font-display font-black text-sm text-ag-ink border-b border-ag-border pb-3 mb-4">
                Attendance Correction Request
              </h3>
              <form onSubmit={handleSubmitRegularization} className="space-y-4">
                <Input label="Target Date" type="date" required value={regDate} onChange={e => setRegDate(e.target.value)} />
                <Select
                  label="Request Type"
                  value={regType}
                  onChange={e => setRegType(e.target.value)}
                  options={[
                    { value: 'missed_punch',   label: 'Missed Punch / Forgot to Clock' },
                    { value: 'late_regularize', label: 'Late Arrival Correction' },
                    { value: 'wfh',            label: 'Work From Home Declaration' },
                    { value: 'client_visit',   label: 'Client Site Visit' },
                    { value: 'business_travel', label: 'Official Business Travel' },
                    { value: 'system_failure', label: 'Biometric / System Failure' },
                    { value: 'early_exit',     label: 'Early Exit Request' },
                    { value: 'other',          label: 'Other Exception' },
                  ]}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Requested Check-In" value={regCheckIn} onChange={e => setRegCheckIn(e.target.value)} placeholder="09:00:00" />
                  <Input label="Requested Check-Out" value={regCheckOut} onChange={e => setRegCheckOut(e.target.value)} placeholder="18:00:00" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">Detailed Reason</label>
                  <textarea
                    required
                    value={regReason}
                    onChange={e => setRegReason(e.target.value)}
                    placeholder="Describe the exception in detail…"
                    className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-xs focus:outline-none focus:border-ag-primary resize-none"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">Submit Correction Request</Button>
              </form>
            </Card>
          </div>

          {/* Center Panel: History Workspace (40%) */}
          <div className="lg:col-span-5 space-y-5">
            <Card>
              <div className="p-5 border-b border-ag-border flex items-center justify-between">
                <CardHeader title="Regularization Requests" subtitle="Track and manage correction history." className="mb-0" />
                <div className="flex gap-1">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setRegFilter(f)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg capitalize transition-all ${
                        regFilter === f ? 'bg-ag-primary text-white' : 'bg-ag-surface-2 text-ag-ink-3 hover:text-ag-ink'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {filteredRegs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-ag-ink-3">No requests found.</div>
                ) : filteredRegs.map(reg => (
                  <div key={reg.id} className="p-4 border border-ag-border rounded-xl space-y-2 hover:border-ag-border-strong transition-all bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-xs text-ag-ink">{reg.employeeName} ({reg.employeeCode})</h4>
                        <p className="text-[10px] text-ag-ink-3 mt-0.5">{reg.date} · {reg.requestType.replace('_', ' ')}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded capitalize ${
                        reg.status === 'approved' ? 'bg-[#E6FAF4] text-ag-mint' :
                        reg.status === 'rejected' ? 'bg-[#FFF0EF] text-ag-coral' : 'bg-[#FFF8E6] text-ag-amber'
                      }`}>{reg.status}</span>
                    </div>
                    <p className="text-[10px] text-ag-ink-2 bg-ag-surface-2/50 p-2 rounded border border-ag-border/50">
                      <span className="font-semibold">Reason:</span> {reg.reason}
                    </p>
                    <p className="text-[10px] font-mono text-ag-ink-3">
                      Requested: {reg.requestedCheckIn ?? '—'} → {reg.requestedCheckOut ?? '—'}
                    </p>
                    {reg.status === 'pending' && isAdmin && (
                      <div className="flex gap-2 justify-end pt-1">
                        <Button size="sm" variant="ghost" icon={<ThumbsDown size={12} />} onClick={() => handleApproveReg(reg.id, 'rejected')}>Reject</Button>
                        <Button size="sm" icon={<ThumbsUp size={12} />} onClick={() => handleApproveReg(reg.id, 'approved')}>Approve</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Panel: Context (25%) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Approval Workflow */}
            <Card className="p-5">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-3">Approval Workflow</h4>
              <div className="space-y-3">
                {[
                  { label: 'Submitted', done: true },
                  { label: 'Manager Review', done: false },
                  { label: 'HR Verification', done: false },
                  { label: 'Final Approval', done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      step.done ? 'bg-ag-mint text-white' : 'bg-ag-surface-2 text-ag-ink-3 border border-ag-border'
                    }`}>
                      {step.done ? <Check size={10} weight="bold" /> : i + 1}
                    </div>
                    <span className={`text-xs ${step.done ? 'text-ag-mint font-bold' : 'text-ag-ink-3'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Policy Card */}
            <Card className="p-5 bg-ag-primary-light border-ag-primary/20">
              <h4 className="font-bold text-xs text-ag-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield size={14} /> Attendance Policy
              </h4>
              <ul className="space-y-1.5 text-[10px] text-ag-ink-3 leading-relaxed">
                <li>• Requests must be submitted within <strong>7 days</strong> of the attendance date.</li>
                <li>• WFH declarations must include manager pre-approval.</li>
                <li>• System failures require IT support ticket reference.</li>
                <li>• All approvals are logged and audited monthly.</li>
              </ul>
            </Card>

            {/* Stats */}
            <Card className="p-5">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-3">Request Summary</h4>
              <div className="space-y-2 text-[10px]">
                {[
                  { label: 'Total Submitted', val: regularizations.length, color: 'text-ag-ink' },
                  { label: 'Pending', val: regularizations.filter(r => r.status === 'pending').length, color: 'text-ag-amber' },
                  { label: 'Approved', val: regularizations.filter(r => r.status === 'approved').length, color: 'text-ag-mint' },
                  { label: 'Rejected', val: regularizations.filter(r => r.status === 'rejected').length, color: 'text-ag-coral' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between">
                    <span className="text-ag-ink-3">{s.label}:</span>
                    <strong className={s.color}>{s.val}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: TEAM ATTENDANCE
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Team KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard label="Present"     value={summary?.present ?? '—'} icon={<CheckCircle size={18} />} color="mint"    loading={isLoading} />
            <KpiCard label="Absent"      value={summary?.absent ?? '—'}  icon={<XCircle size={18} />}     color="coral"   loading={isLoading} />
            <KpiCard label="Work Remote" value={summary?.wfh ?? '—'}     icon={<Buildings size={18} />}   color="primary" loading={isLoading} />
            <KpiCard label="Late Today"  value={summary?.late ?? '—'}    icon={<Warning size={18} />}      color="amber"   loading={isLoading} />
            <KpiCard label="Attendance %" value={`${summary?.attendanceRate ?? 0}%`} icon={<TrendUp size={18} />} color="mint" loading={isLoading} />
          </div>

          {/* Team Roster Table */}
          <Card>
            <CardHeader title="Team Attendance Status" subtitle="Real-time view of all employees for today." />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2/40">
                    {['Employee', 'Department', 'Check In', 'Working Hrs', 'Work Mode', 'Geofence', 'Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-xs text-ag-ink-3">Loading team data…</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-xs text-ag-ink-3">No attendance records found.</td></tr>
                  ) : records.map(r => (
                    <tr key={r._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={r.fullName} size="sm" />
                          <span className="font-semibold text-ag-ink text-xs">{r.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-ag-ink-3 text-xs">—</td>
                      <td className="py-3 px-4 font-mono text-xs text-ag-ink-2">{r.checkIn ?? '—'}</td>
                      <td className="py-3 px-4 font-mono text-xs text-ag-ink-2">{r.workingHours}h</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${r.workMode === 'wfh' ? 'bg-ag-primary-light text-ag-primary' : 'bg-ag-surface-2 text-ag-ink-2'}`}>
                          {r.workMode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.geofenceStatus === 'inside' ? 'bg-[#E6FAF4] text-ag-mint' :
                          r.geofenceStatus === 'outside' ? 'bg-[#FFF0EF] text-ag-coral' : 'bg-ag-surface-2 text-ag-ink-3'
                        }`}>{r.geofenceStatus}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex items-center gap-1 w-fit ${statusColor[r.status] ?? 'bg-ag-surface text-ag-ink-3'}`}>
                          {statusIcon[r.status]}{r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Weekly Heatmap */}
          <Card className="p-5">
            <CardHeader title="Team Attendance Heatmap" subtitle="Attendance trends across this week per employee." />
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr>
                    <th className="text-left pb-3 pr-4 text-ag-ink-3 font-semibold">Employee</th>
                    {trend.map(d => <th key={d.day} className="pb-3 px-2 text-ag-ink-3 font-semibold">{d.day}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 8).map(r => (
                    <tr key={r._id} className="border-t border-ag-border/40">
                      <td className="py-2 pr-4 font-semibold text-ag-ink">{r.fullName}</td>
                      {trend.map((d, i) => (
                        <td key={i} className="py-2 px-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold mx-auto ${
                            i % 7 >= 5 ? 'bg-ag-surface-2 text-ag-ink-3' :
                            r.status === 'present' ? 'bg-[#E6FAF4] text-ag-mint' :
                            r.status === 'wfh' ? 'bg-ag-primary-light text-ag-primary' :
                            r.status === 'late' ? 'bg-[#FFF8E6] text-ag-amber' :
                            'bg-[#FFF0EF] text-ag-coral'
                          }`}>
                            {i % 7 >= 5 ? 'WE' : r.status === 'present' ? 'P' : r.status === 'wfh' ? 'W' : r.status === 'late' ? 'L' : 'A'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-ag-ink-3">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#E6FAF4] inline-block" />Present</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-ag-primary-light inline-block" />WFH</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#FFF8E6] inline-block" />Late</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#FFF0EF] inline-block" />Absent</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: SHIFT MANAGEMENT (ADMIN)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'shifts' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Forms */}
          <div className="lg:col-span-5 space-y-5">
            {/* Shift Assignment */}
            <Card className="p-5">
              <h3 className="font-display font-black text-sm text-ag-ink border-b border-ag-border pb-3 mb-4">
                Assign Work Shift
              </h3>
              <form onSubmit={handleAssignShift} className="space-y-4">
                <Select
                  label="Employee"
                  value={assignEmpId}
                  onChange={e => setAssignEmpId(e.target.value)}
                  options={[{ value: '', label: 'Select Employee…' }, ...employees.map(e => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }))]}
                />
                <Select
                  label="Shift Template"
                  value={assignShiftId}
                  onChange={e => setAssignShiftId(e.target.value)}
                  options={[{ value: '', label: 'Select Shift…' }, ...shifts.map(s => ({ value: s.id, label: shiftLabel(s) }))]}
                />
                <Input label="Effective Date" type="date" required value={assignEffDate} onChange={e => setAssignEffDate(e.target.value)} />
                <Button type="submit" className="w-full">Apply Shift Assignment</Button>
              </form>
            </Card>

            {/* Create Shift */}
            <Card className="p-5">
              <div className="flex items-center justify-between border-b border-ag-border pb-3 mb-4">
                <h3 className="font-display font-black text-sm text-ag-ink">Create Shift Template</h3>
                <Button size="sm" variant="secondary" onClick={() => setShowShiftForm(!showShiftForm)}>
                  {showShiftForm ? 'Collapse' : 'Expand'}
                </Button>
              </div>
              {showShiftForm && (
                <form onSubmit={handleCreateShift} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Shift Name" required value={shiftName} onChange={e => setShiftName(e.target.value)} placeholder="Morning Shift" />
                    <Input label="Shift Code" required value={shiftCode} onChange={e => setShiftCode(e.target.value)} placeholder="MORN_9" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Start Time" value={shiftStart} onChange={e => setShiftStart(e.target.value)} />
                    <Input label="End Time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Grace (min)" type="number" value={shiftGrace} onChange={e => setShiftGrace(e.target.value)} />
                    <Input label="Break (min)" type="number" value={shiftBreak} onChange={e => setShiftBreak(e.target.value)} />
                    <Input label="Min Hours" type="number" value={shiftMinHours} onChange={e => setShiftMinHours(e.target.value)} />
                  </div>
                  <Button type="submit">Create Template</Button>
                </form>
              )}
            </Card>
          </div>

          {/* Right: Shift Templates Registry */}
          <div className="lg:col-span-7">
            <Card>
              <CardHeader title="Shift Templates Registry" subtitle="Active shift configurations across the organization." />
              <div className="p-4 space-y-3">
                {shifts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-ag-ink-3">
                    <Sun size={32} className="mx-auto mb-2 text-ag-border-strong" />
                    No shift templates defined yet. Create your first shift above.
                  </div>
                ) : shifts.map(s => (
                  <div key={s.id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between hover:border-ag-border-strong transition-all bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${s.startTime < '12:00' ? 'bg-[#FFF8E6] text-ag-amber' : s.startTime < '18:00' ? 'bg-ag-primary-light text-ag-primary' : 'bg-ag-ink text-white'}`}>
                        {s.startTime < '12:00' ? <Sun size={18} /> : s.startTime < '18:00' ? <CloudMoon size={18} /> : <Moon size={18} />}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-ag-ink">{s.name}</h4>
                        <span className="text-[10px] text-ag-ink-3 font-mono">{s.code}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      <div className="font-bold text-ag-ink">{s.startTime} → {s.endTime}</div>
                      <div className="text-ag-ink-3 text-[10px]">Grace: {s.gracePeriod}m · Break: {s.breakDuration}m · Min: {s.minWorkingHours}h</div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${s.isActive ? 'bg-[#E6FAF4] text-ag-mint' : 'bg-ag-surface-2 text-ag-ink-3'}`}>
                        {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: OVERTIME MANAGEMENT
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overtime' && (
        <div className="space-y-6">
          {/* OT KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Total OT This Month"  value={`${analytics?.totalOvertimeHours ?? 0}h`} icon={<Timer size={20} />}     color="primary" loading={isLoading} />
            <KpiCard label="Pending OT Approvals" value={0}                                          icon={<Hourglass size={20} />}  color="amber"   loading={isLoading} />
            <KpiCard label="Approved OT Hours"    value={`${analytics?.totalOvertimeHours ?? 0}h`} icon={<CheckCircle size={20} />} color="mint"    loading={isLoading} />
            <KpiCard label="Comp-Off Balance"     value="2.5 days"                                  icon={<Calendar size={20} />}   color="sky"     loading={isLoading} />
          </div>

          {/* OT Records Table */}
          <Card>
            <CardHeader title="Overtime Records" subtitle="Employee overtime hours pending approval and history." />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2/40">
                    {['Employee', 'Date', 'OT Hours', 'Shift End', 'Actual End', 'OT Reason', 'Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.filter(r => r.otHours > 0).length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-xs text-ag-ink-3">No overtime records found.</td></tr>
                  ) : records.filter(r => r.otHours > 0).map(r => (
                    <tr key={r._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                      <td className="py-3 px-4 font-semibold text-ag-ink text-xs">{r.fullName}</td>
                      <td className="py-3 px-4 font-mono text-xs text-ag-ink-3">{r.date}</td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-ag-mint">+{r.otHours}h</td>
                      <td className="py-3 px-4 font-mono text-xs text-ag-ink-3">18:00</td>
                      <td className="py-3 px-4 font-mono text-xs text-ag-ink-2">{r.checkOut ?? '—'}</td>
                      <td className="py-3 px-4 text-xs text-ag-ink-3">Project deadline / work continuation</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF8E6] text-ag-amber">PENDING</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 7: ANALYTICS (ADMIN)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && isAdmin && (
        <div className="space-y-6">
          {/* Analytics KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Monthly Avg Attendance" value={`${summary?.attendanceRate ?? 0}%`}          icon={<TrendUp size={20} />}    color="mint"    loading={isLoading} />
            <KpiCard label="Avg Working Hours"       value={`${analytics?.averageWorkingHours ?? 0}h`}  icon={<Clock size={20} />}       color="primary" loading={isLoading} />
            <KpiCard label="Total OT Hours (Month)"  value={`${analytics?.totalOvertimeHours ?? 0}h`}   icon={<Timer size={20} />}       color="amber"   loading={isLoading} />
            <KpiCard label="Punctuality Rate"        value={`${analytics?.punctualityRate ?? 0}%`}      icon={<CheckCircle size={20} />} color="mint"    loading={isLoading} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Attendance Trend */}
            <Card className="p-5">
              <CardHeader title="Weekly Attendance Trend" subtitle="Present / Absent / WFH / Late distribution." />
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                    <XAxis dataKey="day" stroke="#8E88A8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#8E88A8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E8F0', fontSize: 12 }} />
                    <Bar dataKey="present" fill="#00C48C" radius={[4,4,0,0]} name="Present" />
                    <Bar dataKey="wfh"     fill="#5B3CF5" radius={[4,4,0,0]} name="WFH" />
                    <Bar dataKey="absent"  fill="#FF5F57" radius={[4,4,0,0]} name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Department Comparison */}
            <Card className="p-5">
              <CardHeader title="Department Attendance Comparison" subtitle="Attendance rate by department." />
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" horizontal={false} />
                    <XAxis type="number" stroke="#8E88A8" fontSize={11} tickLine={false} unit="%" />
                    <YAxis type="category" dataKey="dept" stroke="#8E88A8" fontSize={10} tickLine={false} width={80} />
                    <Tooltip formatter={(val) => [`${val}%`, 'Attendance Rate']} />
                    <Bar dataKey="rate" fill="#5B3CF5" radius={[0,4,4,0]} name="Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Department Stats Table */}
          <Card>
            <CardHeader title="Department Attendance Statistics" subtitle="Summary of all departments this month." />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2/40">
                    {['Department', 'Attendance Rate', 'Avg Working Hours', 'Late Arrivals', 'WFH %', 'Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deptChartData.map((d, i) => (
                    <tr key={i} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                      <td className="py-3 px-4 font-bold text-ag-ink">{d.dept}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-ag-border rounded-full overflow-hidden">
                            <div className="h-full bg-ag-primary rounded-full" style={{ width: `${d.rate}%` }} />
                          </div>
                          <span className="font-mono text-ag-ink">{d.rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-ag-ink-2">{d.avg}h</td>
                      <td className="py-3 px-4 font-mono text-ag-amber">{Math.round((100 - d.rate) / 3)}</td>
                      <td className="py-3 px-4 font-mono text-ag-primary">{Math.round(d.rate * 0.15)}%</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.rate >= 90 ? 'bg-[#E6FAF4] text-ag-mint' : d.rate >= 80 ? 'bg-[#FFF8E6] text-ag-amber' : 'bg-[#FFF0EF] text-ag-coral'}`}>
                          {d.rate >= 90 ? 'Excellent' : d.rate >= 80 ? 'Good' : 'Needs Attention'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 8: ADMIN CONSOLE
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'admin' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Period Lock */}
          <Card className="p-5">
            <h3 className="font-display font-black text-base text-ag-ink flex items-center gap-2 border-b border-ag-border pb-3 mb-4">
              <Lock size={20} className="text-ag-coral" />
              Freeze Attendance Period
            </h3>
            <p className="text-xs text-ag-ink-3 mb-4">
              Locking a date range will prevent all further check-ins, check-outs, and regularizations for those records. This action is used before payroll processing.
            </p>
            <form onSubmit={handleLockPeriod} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Start Date" type="date" required value={lockStart} onChange={e => setLockStart(e.target.value)} />
                <Input label="End Date"   type="date" required value={lockEnd}   onChange={e => setLockEnd(e.target.value)} />
              </div>
              <div className="p-3 bg-[#FFF0EF] border border-ag-coral/30 rounded-xl text-xs text-ag-coral flex items-start gap-2">
                <Warning size={14} className="shrink-0 mt-0.5" />
                <span>This action is irreversible. Locked records cannot be edited. Ensure all regularizations are approved before locking.</span>
              </div>
              <Button type="submit" variant="secondary" icon={<Lock size={16} />}>Lock Period Records</Button>
            </form>
          </Card>

          {/* Pending Regularization Approvals */}
          <Card>
            <CardHeader
              title="Pending Regularization Approvals"
              subtitle="Approve or reject employee attendance correction requests."
            />
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {regularizations.filter(r => r.status === 'pending').length === 0 ? (
                <div className="text-center py-6 text-xs text-ag-ink-3">
                  <CheckCircle size={28} className="mx-auto mb-2 text-ag-mint" />
                  No pending approvals. All caught up!
                </div>
              ) : regularizations.filter(r => r.status === 'pending').map(reg => (
                <div key={reg.id} className="p-3.5 border border-ag-border rounded-xl space-y-2 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-ag-ink">{reg.employeeName} <span className="text-ag-ink-3">({reg.employeeCode})</span></h4>
                      <p className="text-[10px] text-ag-ink-3">{reg.date} · <span className="capitalize">{reg.requestType.replace('_', ' ')}</span></p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-[#FFF8E6] text-ag-amber">PENDING</span>
                  </div>
                  <p className="text-[10px] bg-ag-surface-2/50 p-2 rounded text-ag-ink-2">{reg.reason}</p>
                  <p className="text-[10px] font-mono text-ag-ink-3">
                    Requested: {reg.requestedCheckIn ?? '—'} → {reg.requestedCheckOut ?? '—'}
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" icon={<ThumbsDown size={12} />} onClick={() => handleApproveReg(reg.id, 'rejected')}>Reject</Button>
                    <Button size="sm" icon={<ThumbsUp size={12} />} onClick={() => handleApproveReg(reg.id, 'approved')}>Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Future Ready Card */}
          <Card className="lg:col-span-2 p-5 bg-ag-ink border-0 text-white">
            <h3 className="font-display font-black text-base mb-4 flex items-center gap-2">
              <Lightning size={20} className="text-ag-amber" />
              Future Workforce Management Integrations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Biometric Devices', icon: <Fingerprint size={20} />, desc: 'Fingerprint scanner integration via API', status: 'Planned' },
                { label: 'Face Recognition', icon: <IdentificationCard size={20} />, desc: 'AI-based facial punch verification', status: 'Roadmap' },
                { label: 'QR Check-In', icon: <Shield size={20} />, desc: 'Dynamic QR codes per shift period', status: 'Roadmap' },
                { label: 'GPS Geofencing', icon: <MapPin size={20} />, desc: 'Automated location-based punch rules', status: 'Coming Soon' },
              ].map(item => (
                <div key={item.label} className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="text-ag-primary-light">{item.icon}</div>
                  <h5 className="font-bold text-xs text-white">{item.label}</h5>
                  <p className="text-[10px] text-white/50">{item.desc}</p>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/10 text-white/60">{item.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

    </PageContainer>
  );
}
