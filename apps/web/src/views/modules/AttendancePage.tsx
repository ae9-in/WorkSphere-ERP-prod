import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { attendanceService, employeeService } from '@/services/api.service';
import { useAuthStore } from '@/store/authStore';
import {
  Sparkle, Plus, ArrowsClockwise, Clock, Coffee, MapPin,
  Sliders, Calendar, Lock, ThumbsUp, ThumbsDown, Warning, Check
} from '@phosphor-icons/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

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

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'regularization' | 'admin'>('dashboard');

  // Dashboard states
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trend, setTrend] = useState<WeekDay[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [analytics, setAnalytics] = useState<{ averageWorkingHours: number; totalOvertimeHours: number; punctualityRate: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Operations states
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [workMode, setWorkMode] = useState('onsite');
  const [breakType, setBreakType] = useState('lunch');

  // Regularization list & form states
  const [regularizations, setRegularizations] = useState<Regularization[]>([]);
  const [showRegForm, setShowRegForm] = useState(false);
  const [regDate, setRegDate] = useState('');
  const [regType, setRegType] = useState('missed_punch');
  const [regCheckIn, setRegCheckIn] = useState('09:00:00');
  const [regCheckOut, setRegCheckOut] = useState('18:00:00');
  const [regReason, setRegReason] = useState('');

  // Admin section states
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<{ _id: string; fullName: string; employeeId: string }[]>([]);
  const [showShiftForm, setShowShiftForm] = useState(false);
  
  // New Shift form states
  const [shiftName, setShiftName] = useState('');
  const [shiftCode, setShiftCode] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [shiftGrace, setShiftGrace] = useState('15');
  const [shiftBreak, setShiftBreak] = useState('60');
  const [shiftMinHours, setShiftMinHours] = useState('8.0');

  // Shift assignment state
  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignShiftId, setAssignShiftId] = useState('');
  const [assignEffDate, setAssignEffDate] = useState(new Date().toISOString().split('T')[0]);

  // Lock form state
  const [lockStart, setLockStart] = useState('');
  const [lockEnd, setLockEnd] = useState('');

  const isAdmin = user && ['company_admin', 'hr_head', 'super_admin'].includes(user.role);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [summaryData, trendData, listData, analyticsData, regData] = await Promise.all([
        attendanceService.getSummary(),
        attendanceService.getWeeklyTrend(),
        attendanceService.list({ limit: 20 }),
        attendanceService.getAnalytics(),
        attendanceService.listRegularizations()
      ]);
      setSummary(summaryData);
      setTrend(trendData);
      setRecords(listData.records);
      setAnalytics(analyticsData);
      setRegularizations(regData);

      // Find if current user checked in today
      if (user?.employeeId) {
        const matching = listData.records.find(
          (r: AttendanceRecord) => r.employeeId === user.employeeId && r.date === todayStr
        );
        setTodayRecord(matching || null);
      }
    } catch {
      toast.error('Failed to load attendance logs.');
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
      toast.error('Failed to load admin templates.');
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminData();
    }
  }, [activeTab, fetchAdminData]);

  // Clock Actions
  const handleCheckIn = () => {
    if (!user) return;
    
    const performCheckIn = (lat?: number, lng?: number) => {
      attendanceService.checkIn({
        employeeId: user.employeeId,
        fullName: user.fullName,
        workMode,
        lat,
        lng
      }).then(() => {
        toast.success('Successfully checked in!');
        fetchDashboardData();
      }).catch(err => {
        toast.error(err.response?.data?.detail || 'Failed to check in.');
      });
    };

    if (workMode === 'onsite') {
      toast.loading('Resolving GPS location…', { id: 'gps' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          toast.dismiss('gps');
          performCheckIn(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          toast.dismiss('gps');
          toast.error('GPS coordinates access denied. Proceeding with unknown coordinates.');
          performCheckIn();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      performCheckIn();
    }
  };

  const handleCheckOut = () => {
    if (!todayRecord) return;
    attendanceService.checkOut(todayRecord._id)
      .then(() => {
        toast.success('Successfully checked out!');
        fetchDashboardData();
      })
      .catch(err => {
        toast.error(err.response?.data?.detail || 'Failed to check out.');
      });
  };

  // Breaks Actions
  const handleStartBreak = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    attendanceService.startBreak({
      date: todayStr,
      breakType,
      employeeId: user?.employeeId
    }).then(() => {
      toast.success(`Break ${breakType} started.`);
      fetchDashboardData();
    }).catch(err => {
      toast.error(err.response?.data?.detail || 'Failed to start break.');
    });
  };

  const handleEndBreak = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    attendanceService.endBreak({
      date: todayStr,
      employeeId: user?.employeeId
    }).then(() => {
      toast.success('Break ended. Resumed work.');
      fetchDashboardData();
    }).catch(err => {
      toast.error(err.response?.data?.detail || 'Failed to end break.');
    });
  };

  // Regularization Request
  const handleSubmitRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDate || !regReason) {
      toast.error('Please fill in all required fields.');
      return;
    }
    attendanceService.requestRegularization({
      date: regDate,
      requestType: regType,
      checkIn: regCheckIn,
      checkOut: regCheckOut,
      reason: regReason,
      employeeId: user?.employeeId
    }).then(() => {
      toast.success('Correction request submitted.');
      setShowRegForm(false);
      fetchDashboardData();
    }).catch(err => {
      toast.error(err.response?.data?.detail || 'Failed to submit request.');
    });
  };

  // Admin approvals
  const handleApproveReg = (id: string, status: 'approved' | 'rejected') => {
    attendanceService.approveRegularization(id, {
      status,
      comments: `Processed via admin console.`
    }).then(() => {
      toast.success(`Request ${status} successfully.`);
      fetchDashboardData();
    }).catch(err => {
      toast.error(err.response?.data?.detail || 'Failed to update request.');
    });
  };

  // Create shift
  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    attendanceService.createShift({
      name: shiftName,
      code: shiftCode,
      startTime: shiftStart,
      endTime: shiftEnd,
      gracePeriod: parseInt(shiftGrace) || 15,
      breakDuration: parseInt(shiftBreak) || 60,
      minWorkingHours: parseFloat(shiftMinHours) || 8.0,
      isActive: true
    }).then(() => {
      toast.success('Shift template created.');
      setShiftName('');
      setShiftCode('');
      setShowShiftForm(false);
      fetchAdminData();
    }).catch(err => {
      toast.error(err.response?.data?.detail || 'Failed to create shift template.');
    });
  };

  // Assign shift
  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmpId || !assignShiftId) {
      toast.error('Select employee and shift template.');
      return;
    }
    attendanceService.assignShift({
      employeeId: assignEmpId,
      shiftId: assignShiftId,
      effectiveDate: assignEffDate
    }).then(() => {
      toast.success('Shift assignment successfully applied.');
      setAssignEmpId('');
      setAssignShiftId('');
    }).catch(err => {
      toast.error(err.response?.data?.detail || 'Failed to assign shift.');
    });
  };

  // Lock attendance
  const handleLockPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockStart || !lockEnd) {
      toast.error('Select start and end dates.');
      return;
    }
    attendanceService.lockAttendance({
      startDate: lockStart,
      endDate: lockEnd
    }).then(res => {
      toast.success(`Success! Locked ${res.lockedCount} records.`);
      setLockStart('');
      setLockEnd('');
      fetchDashboardData();
    }).catch(err => {
      toast.error(err.response?.data?.detail || 'Failed to lock records.');
    });
  };

  const statusColor: Record<string, string> = {
    present: 'bg-[#E6FAF4] text-ag-mint',
    wfh: 'bg-ag-primary-light text-ag-primary',
    late: 'bg-[#FFF8E6] text-ag-amber',
    absent: 'bg-ag-accent-pink/15 text-ag-accent-pink',
    half_day: 'bg-ag-surface text-ag-ink-3',
  };

  const activeBreak = todayRecord?.breaks?.find(b => !b.endTime);

  return (
    <PageContainer
      title="Attendance & Scheduling"
      subtitle="Configure shifts, record geofenced hours, break timers, and regularize timesheets."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchDashboardData} icon={<ArrowsClockwise size={18} />}>
            Refresh
          </Button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex border-b border-ag-border mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-ag-primary text-ag-primary'
              : 'border-transparent text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          Dashboard & Live Tracker
        </button>
        <button
          onClick={() => setActiveTab('regularization')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'regularization'
              ? 'border-b-2 border-ag-primary text-ag-primary'
              : 'border-transparent text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          Regularization Requests ({regularizations.length})
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'admin'
                ? 'border-ag-primary text-ag-primary'
                : 'border-transparent text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            Admin Control Center
          </button>
        )}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-xs text-ag-ink-3 uppercase font-semibold">Punctuality Rate</span>
              <h3 className="text-2xl font-bold font-display text-ag-primary mt-2">
                {isLoading ? '—' : `${analytics?.punctualityRate ?? 100}%`}
              </h3>
              <p className="text-[10px] text-ag-ink-3 mt-1">Based on current month data</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <span className="text-xs text-ag-ink-3 uppercase font-semibold">Avg. Working Hours</span>
              <h3 className="text-2xl font-bold font-display text-ag-ink mt-2">
                {isLoading ? '—' : `${analytics?.averageWorkingHours ?? 0} hrs`}
              </h3>
              <p className="text-[10px] text-ag-ink-3 mt-1">Net of break duration deductions</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <span className="text-xs text-ag-ink-3 uppercase font-semibold">Total Overtime</span>
              <h3 className="text-2xl font-bold font-display text-ag-mint mt-2">
                {isLoading ? '—' : `${analytics?.totalOvertimeHours ?? 0} hrs`}
              </h3>
              <p className="text-[10px] text-ag-ink-3 mt-1">Requires manager approval</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <span className="text-xs text-ag-ink-3 uppercase font-semibold">Today's Attendance</span>
              <h3 className="text-2xl font-bold font-display text-ag-ink mt-2">
                {isLoading ? '—' : `${summary?.attendanceRate ?? 0}%`}
              </h3>
              <p className="text-[10px] text-ag-ink-3 mt-1">Present: {summary?.present ?? 0} | WFH: {summary?.wfh ?? 0}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Punches & Breaks */}
            <div className="space-y-6">
              {/* Web Punch controller */}
              <Card className="p-5 border-l-4 border-l-ag-primary">
                <h3 className="font-display font-bold text-base text-ag-ink flex items-center gap-2 mb-3">
                  <Clock size={20} className="text-ag-primary" />
                  Clock Punch Terminal
                </h3>

                {!todayRecord ? (
                  <div className="space-y-4">
                    <div className="flex gap-4 p-3 bg-ag-surface rounded-xl border border-ag-border">
                      <div className="flex-1">
                        <span className="text-[11px] text-ag-ink-3 block font-semibold mb-1">Work Mode</span>
                        <select
                          value={workMode}
                          onChange={e => setWorkMode(e.target.value)}
                          className="w-full bg-transparent text-xs font-semibold text-ag-ink focus:outline-none"
                        >
                          <option value="onsite">Onsite (GPS Checked)</option>
                          <option value="remote">WFH (Remote)</option>
                        </select>
                      </div>
                    </div>

                    <Button className="w-full" onClick={handleCheckIn}>
                      Check-In Today
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-[#E6FAF4] text-ag-mint rounded-xl border border-ag-border/50 text-xs font-semibold flex items-center gap-2">
                      <Check size={16} weight="bold" />
                      <span>Checked-In today at <b className="font-mono">{todayRecord.checkIn}</b></span>
                    </div>

                    {todayRecord.geofenceStatus !== 'unknown' && (
                      <div className="p-2.5 bg-ag-surface border border-ag-border rounded-xl text-[11px] flex items-center justify-between">
                        <span className="text-ag-ink-2 flex items-center gap-1">
                          <MapPin size={14} className="text-ag-primary" />
                          Geofence Check
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          todayRecord.geofenceStatus === 'inside'
                            ? 'bg-[#E6FAF4] text-ag-mint'
                            : 'bg-ag-accent-pink/10 text-ag-accent-pink'
                        }`}>
                          {todayRecord.geofenceStatus.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {!todayRecord.checkOut ? (
                      <Button className="w-full" variant="secondary" onClick={handleCheckOut}>
                        Clock-Out Session
                      </Button>
                    ) : (
                      <div className="p-3 bg-ag-surface text-ag-ink-3 rounded-xl text-center text-xs border border-ag-border">
                        Logged check-out at <b className="font-mono">{todayRecord.checkOut}</b>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Break session manager */}
              {todayRecord && !todayRecord.checkOut && (
                <Card className="p-5 border-l-4 border-l-ag-amber">
                  <h3 className="font-display font-bold text-base text-ag-ink flex items-center gap-2 mb-3">
                    <Coffee size={20} className="text-ag-amber" />
                    Break Tracker
                  </h3>

                  {!activeBreak ? (
                    <div className="space-y-4">
                      <div className="flex gap-4 p-3 bg-ag-surface rounded-xl border border-ag-border">
                        <div className="flex-1">
                          <span className="text-[11px] text-ag-ink-3 block font-semibold mb-1">Break Purpose</span>
                          <select
                            value={breakType}
                            onChange={e => setBreakType(e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-ag-ink focus:outline-none"
                          >
                            <option value="lunch">Lunch Break</option>
                            <option value="tea">Tea / Coffee Break</option>
                            <option value="meeting">Official Meeting</option>
                            <option value="personal">Personal Break</option>
                          </select>
                        </div>
                      </div>

                      <Button className="w-full" variant="secondary" onClick={handleStartBreak}>
                        Start Break Session
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-[#FFF8E6] text-ag-amber rounded-xl border border-ag-border/50 text-xs font-semibold flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <Coffee size={16} weight="fill" />
                          <span>On active break: <b className="capitalize">{activeBreak.breakType}</b></span>
                        </span>
                        <span className="text-[10px] text-ag-ink-3 font-mono">Started: {activeBreak.startTime}</span>
                      </div>

                      <Button className="w-full" onClick={handleEndBreak}>
                        End Break & Resume Work
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Right side: Recharts Weekly trend & records */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader title="Weekly Schedule Overview" subtitle="Punches, check-ins, and statuses." />
                <div className="h-64 w-full pt-4 pr-3">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center text-ag-ink-3 text-sm">Loading charts…</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                        <XAxis dataKey="day" stroke="#8E88A8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#8E88A8" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E8F0', fontSize: 12 }} />
                        <Bar dataKey="present" fill="#5B3CF5" radius={[4, 4, 0, 0]} name="Present" />
                        <Bar dataKey="wfh" fill="#00C48C" radius={[4, 4, 0, 0]} name="WFH" />
                        <Bar dataKey="late" fill="#FFB020" radius={[4, 4, 0, 0]} name="Late" />
                        <Bar dataKey="absent" fill="#FF5F57" radius={[4, 4, 0, 0]} name="Absent" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardHeader title="Timesheets Log" subtitle="Recent check-in activities across the organization." />
            {isLoading ? (
              <div className="p-8 text-center text-ag-ink-3 text-sm">Loading logs…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ag-border text-ag-ink-3 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 text-left font-semibold">Employee</th>
                      <th className="py-3 px-4 text-left font-semibold">Date</th>
                      <th className="py-3 px-4 text-left font-semibold">Check In</th>
                      <th className="py-3 px-4 text-left font-semibold">Check Out</th>
                      <th className="py-3 px-4 text-left font-semibold">Working Hours</th>
                      <th className="py-3 px-4 text-left font-semibold">Overtime</th>
                      <th className="py-3 px-4 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-ag-ink">{r.fullName}</td>
                        <td className="py-3 px-4 text-ag-ink-2 font-mono text-xs">{r.date}</td>
                        <td className="py-3 px-4 text-ag-ink-2 font-mono text-xs">{r.checkIn ?? '—'}</td>
                        <td className="py-3 px-4 text-ag-ink-2 font-mono text-xs">{r.checkOut ?? '—'}</td>
                        <td className="py-3 px-4 text-ag-ink-2 font-mono text-xs">{r.workingHours} hrs</td>
                        <td className="py-3 px-4 text-ag-ink-2 font-mono text-xs text-ag-mint font-semibold">{r.otHours > 0 ? `+${r.otHours} hrs` : '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor[r.status] ?? 'bg-ag-surface text-ag-ink-3'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'regularization' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-ag-ink">Correction Claims</h3>
            <Button icon={<Plus size={16} />} onClick={() => setShowRegForm(!showRegForm)}>
              {showRegForm ? 'Cancel Request' : 'New Correction Request'}
            </Button>
          </div>

          {showRegForm && (
            <Card className="p-5 max-w-xl">
              <h4 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Request Attendance Regularization</h4>
              <form onSubmit={handleSubmitRegularization} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Target Date"
                    type="date"
                    required
                    value={regDate}
                    onChange={e => setRegDate(e.target.value)}
                  />
                  <Select
                    label="Correction Type"
                    value={regType}
                    onChange={e => setRegType(e.target.value)}
                    options={[
                      { value: 'missed_punch', label: 'Missed Check-In / Check-Out' },
                      { value: 'late_regularize', label: 'Late Arrival Correction' },
                      { value: 'other', label: 'Other Exceptions' }
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Requested Check-In (HH:MM:SS)"
                    value={regCheckIn}
                    onChange={e => setRegCheckIn(e.target.value)}
                  />
                  <Input
                    label="Requested Check-Out (HH:MM:SS)"
                    value={regCheckOut}
                    onChange={e => setRegCheckOut(e.target.value)}
                  />
                </div>

                <Input
                  label="Detailed Reason"
                  placeholder="Describe why punch logs are missing or late (e.g. system card error)"
                  required
                  value={regReason}
                  onChange={e => setRegReason(e.target.value)}
                />

                <Button type="submit">Submit Regularization Claim</Button>
              </form>
            </Card>
          )}

          <Card>
            <CardHeader title="Your Regularization Submissions" subtitle="Track progress of historical timesheet corrections." />
            {regularizations.length === 0 ? (
              <div className="p-8 text-center text-ag-ink-3 text-sm">No regularization requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ag-border text-ag-ink-3 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 text-left font-semibold">Employee</th>
                      <th className="py-3 px-4 text-left font-semibold">Date</th>
                      <th className="py-3 px-4 text-left font-semibold">Type</th>
                      <th className="py-3 px-4 text-left font-semibold">Requested Timings</th>
                      <th className="py-3 px-4 text-left font-semibold">Reason</th>
                      <th className="py-3 px-4 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regularizations.map(reg => (
                      <tr key={reg.id} className="border-b border-ag-border/40">
                        <td className="py-3 px-4 font-semibold text-ag-ink">{reg.employeeName}</td>
                        <td className="py-3 px-4 font-mono text-xs">{reg.date}</td>
                        <td className="py-3 px-4 capitalize text-xs">{reg.requestType.replace('_', ' ')}</td>
                        <td className="py-3 px-4 font-mono text-xs">{reg.requestedCheckIn ?? '—'} to {reg.requestedCheckOut ?? '—'}</td>
                        <td className="py-3 px-4 text-xs text-ag-ink-2">{reg.reason}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            reg.status === 'approved'
                              ? 'bg-[#E6FAF4] text-ag-mint'
                              : reg.status === 'rejected'
                              ? 'bg-ag-accent-pink/15 text-ag-accent-pink'
                              : 'bg-[#FFF8E6] text-ag-amber'
                          }`}>
                            {reg.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'admin' && isAdmin && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Pending Approvals list */}
            <Card>
              <CardHeader title="Pending Corrections Approvals" subtitle="Approve/reject employee regularization requests." />
              <div className="p-4 space-y-4">
                {regularizations.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="text-center p-4 text-ag-ink-3 text-xs">No pending approvals remaining.</div>
                ) : (
                  regularizations.filter(r => r.status === 'pending').map(reg => (
                    <div key={reg.id} className="p-3 border border-ag-border rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-ag-ink">{reg.employeeName} ({reg.employeeCode})</h4>
                          <span className="text-[10px] text-ag-ink-3 block">Requested Date: {reg.date}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF8E6] text-ag-amber uppercase">
                          {reg.requestType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-ag-ink-2 bg-ag-surface p-2 rounded border border-ag-border">
                        <b>Reason:</b> {reg.reason}
                        <div className="mt-1 font-mono text-[10px]">
                          Requested: {reg.requestedCheckIn ?? '—'} - {reg.requestedCheckOut ?? '—'}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ThumbsDown size={14} />}
                          onClick={() => handleApproveReg(reg.id, 'rejected')}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          icon={<ThumbsUp size={14} />}
                          onClick={() => handleApproveReg(reg.id, 'approved')}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Right: Lock period form */}
            <Card className="p-5">
              <h3 className="font-display font-bold text-base text-ag-ink flex items-center gap-2 mb-3 border-b border-ag-border pb-3">
                <Lock size={20} className="text-ag-accent-pink" />
                Freeze Timesheets Period
              </h3>
              <p className="text-xs text-ag-ink-3 mb-4">
                Locks all employee attendance records within the selected date range. Locked timesheets cannot be checked-in, checked-out, or regularized.
              </p>
              <form onSubmit={handleLockPeriod} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    required
                    value={lockStart}
                    onChange={e => setLockStart(e.target.value)}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    required
                    value={lockEnd}
                    onChange={e => setLockEnd(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="secondary" icon={<Lock size={16} />}>
                  Lock Date Period
                </Button>
              </form>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shift Assignment form */}
            <Card className="p-5">
              <h3 className="font-display font-bold text-base text-ag-ink flex items-center gap-2 mb-3 border-b border-ag-border pb-3">
                <Sliders size={20} className="text-ag-primary" />
                Assign Work Schedule Shift
              </h3>
              <form onSubmit={handleAssignShift} className="space-y-4">
                <Select
                  label="Select Employee"
                  value={assignEmpId}
                  onChange={e => setAssignEmpId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Employee...' },
                    ...employees.map(e => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }))
                  ]}
                />

                <Select
                  label="Select Shift Template"
                  value={assignShiftId}
                  onChange={e => setAssignShiftId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Template...' },
                    ...shifts.map(s => ({ value: s.id, label: `${s.name} (${s.startTime} - ${s.endTime})` }))
                  ]}
                />

                <Input
                  label="Effective Joining Date"
                  type="date"
                  required
                  value={assignEffDate}
                  onChange={e => setAssignEffDate(e.target.value)}
                />

                <Button type="submit">Apply Shift Assignment</Button>
              </form>
            </Card>

            {/* Shift templates list & creation */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-ag-ink">Shift Profiles Console</h3>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowShiftForm(!showShiftForm)}>
                  {showShiftForm ? 'Close Creator' : 'Create Template'}
                </Button>
              </div>

              {showShiftForm && (
                <Card className="p-5">
                  <h4 className="font-bold text-xs text-ag-ink border-b border-ag-border pb-2 mb-3">New Shift Template</h4>
                  <form onSubmit={handleCreateShift} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Shift Name" required value={shiftName} onChange={e => setShiftName(e.target.value)} />
                      <Input label="Shift Code" required placeholder="e.g. DAY_SHIFT" value={shiftCode} onChange={e => setShiftCode(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Start Time (HH:MM)" placeholder="09:00" required value={shiftStart} onChange={e => setShiftStart(e.target.value)} />
                      <Input label="End Time (HH:MM)" placeholder="18:00" required value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input label="Grace (min)" type="number" required value={shiftGrace} onChange={e => setShiftGrace(e.target.value)} />
                      <Input label="Break (min)" type="number" required value={shiftBreak} onChange={e => setShiftBreak(e.target.value)} />
                      <Input label="Min Hours" type="number" required value={shiftMinHours} onChange={e => setShiftMinHours(e.target.value)} />
                    </div>
                    <Button type="submit" size="sm">Create Template</Button>
                  </form>
                </Card>
              )}

              <Card>
                <div className="divide-y divide-ag-border">
                  {shifts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-ag-ink-3">No custom shift templates defined.</div>
                  ) : (
                    shifts.map(s => (
                      <div key={s.id} className="p-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-ag-ink">{s.name}</span>
                          <span className="font-mono text-ag-ink-3 block mt-0.5">{s.code} | {s.startTime} - {s.endTime}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] block text-ag-ink-2">Grace: {s.gracePeriod}m | Break: {s.breakDuration}m</span>
                          <span className="text-[10px] block text-ag-ink-3">Min Hours: {s.minWorkingHours}h</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
