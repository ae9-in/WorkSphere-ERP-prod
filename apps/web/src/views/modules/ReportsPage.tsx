import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { reportService } from '@/services/api.service';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
  ArrowsClockwise, Download, SquaresFour, Sliders,
  ChartBar, ChartPie, Buildings, Users, CurrencyInr,
  CalendarCheck, Clock, TrendUp, Warning
} from '@phosphor-icons/react';
import { toast } from 'sonner';

// ── Colors & constants ────────────────────────────────────────
const CHART_COLORS = ['#5B3CF5', '#00C48C', '#FFBB28', '#FF8042', '#AF19FF', '#00B4D8'];

type DashboardTab = 'executive' | 'hr' | 'payroll' | 'custom';

// ── Small KPI card ────────────────────────────────────────────
function KPICard({ label, value, sub, icon, color = 'text-ag-primary' }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color?: string;
}) {
  return (
    <Card className="p-5 flex gap-4 items-start">
      <div className="w-10 h-10 rounded-xl bg-ag-primary/10 flex items-center justify-center shrink-0 text-ag-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-ag-ink-3 uppercase tracking-wider truncate">{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-[10px] text-ag-ink-3 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ── Chart helpers ─────────────────────────────────────────────
function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-64 flex items-center justify-center text-xs text-ag-ink-3 text-center">
      <div>
        <ChartBar size={36} className="mx-auto mb-2 opacity-20" />
        <p>{label}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('executive');
  const [loading, setLoading] = useState(false);

  // Executive tab state
  const [execSummary, setExecSummary] = useState<any>(null);
  const [workforceGrowth, setWorkforceGrowth] = useState<any[]>([]);

  // HR tab state
  const [hrDashboard, setHrDashboard] = useState<any>(null);
  const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);
  const [diversity, setDiversity] = useState<any[]>([]);

  // Payroll tab state
  const [payrollTrends, setPayrollTrends] = useState<any[]>([]);
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [statutory, setStatutory] = useState<any>(null);

  // Custom report builder state
  const [customEntity, setCustomEntity] = useState('employee');
  const [customColumns, setCustomColumns] = useState<string[]>(['fullName', 'employeeId', 'official.status']);
  const [customResults, setCustomResults] = useState<any[]>([]);
  const [customLoading, setCustomLoading] = useState(false);

  // ── Data fetch ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [exec, growth, hr, attn, div, payTrend, dept, stat] = await Promise.allSettled([
        reportService.getExecutiveSummary(),
        reportService.getWorkforceGrowth(),
        reportService.getHRDashboard(),
        reportService.getAttendanceTrends(),
        reportService.getDiversity(),
        reportService.getPayrollTrends(),
        reportService.getDepartmentStats(),
        reportService.getStatutory(),
      ]);

      if (exec.status === 'fulfilled') setExecSummary(exec.value);
      if (growth.status === 'fulfilled') setWorkforceGrowth(growth.value ?? []);
      if (hr.status === 'fulfilled') setHrDashboard(hr.value);
      if (attn.status === 'fulfilled') setAttendanceTrends(attn.value ?? []);
      if (div.status === 'fulfilled') setDiversity(div.value ?? []);
      if (payTrend.status === 'fulfilled') setPayrollTrends(payTrend.value ?? []);
      if (dept.status === 'fulfilled') setDeptStats(dept.value ?? []);
      if (stat.status === 'fulfilled') setStatutory(stat.value);
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Custom report ──────────────────────────────────────────
  const handleRunCustom = async () => {
    setCustomLoading(true);
    try {
      const data = await reportService.runCustom({ entity: customEntity, columns: customColumns, filters: [] });
      setCustomResults(data);
      toast.success(`Loaded ${data.length} records`);
    } catch {
      toast.error('Failed to run custom report query');
    } finally {
      setCustomLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (customResults.length === 0) return;
    const headers = customColumns.join(',');
    const rows = customResults.map((r: any) =>
      customColumns.map((col) => {
        const parts = col.split('.');
        let val: any = r;
        for (const p of parts) val = val?.[p];
        return `"${val ?? ''}"`;
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `custom_report_${customEntity}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const entitiesList = [
    { value: 'employee', label: 'Employee Profile Registry', fields: ['fullName', 'employeeId', 'official.status', 'official.workEmail', 'official.employeeType'] },
    { value: 'payslip', label: 'Statutory Payroll Payslips', fields: ['employeeId', 'status', 'pay_period', 'gross_salary', 'net_salary'] },
    { value: 'leave', label: 'Leave Applications List', fields: ['employeeId', 'days', 'status', 'from_date', 'to_date', 'reason'] },
    { value: 'attendance', label: 'Daily Attendance Logs', fields: ['employeeId', 'date', 'check_in_time', 'check_out_time', 'status'] }
  ];

  const columns: ColumnDef<any>[] = customColumns.map((col) => ({
    accessorKey: col,
    header: col.replace(/official\.|personal\.|totals\./, '').toUpperCase(),
    cell: ({ row }) => {
      const parts = col.split('.');
      let val: any = row.original;
      for (const p of parts) val = val?.[p];
      return <span className="text-xs text-ag-ink-2">{String(val ?? '—')}</span>;
    }
  }));

  // ── Tabs config ────────────────────────────────────────────
  const TABS: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'executive', label: 'Executive Dashboard', icon: <TrendUp size={16} /> },
    { id: 'hr',        label: 'HR Analytics',        icon: <Users size={16} /> },
    { id: 'payroll',   label: 'Payroll & Compliance', icon: <CurrencyInr size={16} /> },
    { id: 'custom',    label: 'Custom Builder',       icon: <Sliders size={16} /> },
  ];

  // ── Render ─────────────────────────────────────────────────
  return (
    <PageContainer
      title="Reporting & Analytics"
      subtitle="Organization-wide visibility across workforce, attendance, payroll, and compliance metrics."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchAll} icon={<ArrowsClockwise size={18} />} loading={loading}>
            Refresh
          </Button>
        </div>
      }
    >
      {/* Tab Bar */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── EXECUTIVE DASHBOARD ────────────────────────────── */}
      {activeTab === 'executive' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Total Active Employees"
              value={loading ? '—' : (execSummary?.totalEmployees ?? 0)}
              sub={`+${execSummary?.newJoiners30d ?? 0} new this month`}
              icon={<Users size={20} />}
            />
            <KPICard
              label="Monthly Payroll Gross"
              value={loading ? '—' : formatCurrency(execSummary?.monthlyPayrollGross ?? 0)}
              sub={`Net: ${formatCurrency(execSummary?.monthlyPayrollNet ?? 0)}`}
              icon={<CurrencyInr size={20} />}
              color="text-green-600"
            />
            <KPICard
              label="Leave Utilization"
              value={loading ? '—' : `${execSummary?.leaveUtilizationPct ?? 0}%`}
              sub="Approved leaves this month"
              icon={<CalendarCheck size={20} />}
              color="text-yellow-600"
            />
            <KPICard
              label="Pending Approvals"
              value={loading ? '—' : (execSummary?.pendingApprovals ?? 0)}
              sub="Workflow items awaiting action"
              icon={<Clock size={20} />}
              color={execSummary?.pendingApprovals > 5 ? 'text-red-600' : 'text-ag-ink'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workforce Growth */}
            <Card>
              <CardHeader title="Workforce Growth Trend" subtitle="Cumulative headcount over the last 6 months." />
              <div className="h-64 p-4">
                {loading || workforceGrowth.length === 0 ? (
                  <EmptyChart label="No workforce growth data. Add employees to see trends." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={workforceGrowth}>
                      <defs>
                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5B3CF5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#5B3CF5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE8FF" />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                      <YAxis stroke="#6B7280" fontSize={11} />
                      <Tooltip formatter={(v: any) => [v, 'Headcount']} />
                      <Area type="monotone" dataKey="headcount" stroke="#5B3CF5" strokeWidth={2} fill="url(#growthGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Employee Type Breakdown */}
            <Card>
              <CardHeader title="Employment Type Distribution" subtitle="Active workforce by contract type." />
              <div className="h-64 p-4 flex items-center justify-center">
                {loading || !execSummary?.employeeTypeBreakdown?.length ? (
                  <EmptyChart label="No employee type data available." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={execSummary.employeeTypeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="type"
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {execSummary.employeeTypeBreakdown.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── HR ANALYTICS ──────────────────────────────────── */}
      {activeTab === 'hr' && (
        <div className="space-y-8">
          {/* Upcoming Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-bold text-sm text-ag-ink mb-3">🎂 Upcoming Birthdays (7 days)</h3>
              {loading ? <p className="text-xs text-ag-ink-3">Loading...</p> : (
                (hrDashboard?.upcomingBirthdays?.length ?? 0) === 0 ? (
                  <p className="text-xs text-ag-ink-3">No birthdays in the next 7 days.</p>
                ) : (
                  <div className="space-y-2">
                    {hrDashboard?.upcomingBirthdays?.map((b: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-ag-border last:border-0">
                        <div>
                          <p className="font-semibold text-ag-ink">{b.name}</p>
                          <p className="text-ag-ink-3">{b.department}</p>
                        </div>
                        <span className="text-ag-primary font-mono">{b.date?.slice(5, 10)}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-bold text-sm text-ag-ink mb-3">🏆 Work Anniversaries (7 days)</h3>
              {loading ? <p className="text-xs text-ag-ink-3">Loading...</p> : (
                (hrDashboard?.upcomingAnniversaries?.length ?? 0) === 0 ? (
                  <p className="text-xs text-ag-ink-3">No anniversaries in the next 7 days.</p>
                ) : (
                  <div className="space-y-2">
                    {hrDashboard?.upcomingAnniversaries?.map((a: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-ag-border last:border-0">
                        <div>
                          <p className="font-semibold text-ag-ink">{a.name}</p>
                          <p className="text-ag-ink-3">{a.department}</p>
                        </div>
                        <span className="text-ag-primary font-mono">{a.date?.slice(0, 10)}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              label="Exits in Last 30 Days"
              value={loading ? '—' : (hrDashboard?.exits30d ?? 0)}
              sub="Resigned or terminated employees"
              icon={<Warning size={20} />}
              color="text-red-600"
            />
            <KPICard
              label="Pending Leave Approvals"
              value={loading ? '—' : (hrDashboard?.leavePendingApprovals ?? 0)}
              sub="Awaiting manager/HR action"
              icon={<CalendarCheck size={20} />}
              color="text-yellow-600"
            />
            <KPICard
              label="Gender Diversity"
              value={loading ? '—' : `${diversity.length} groups`}
              sub="Across active workforce"
              icon={<Users size={20} />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 6-month Attendance Trends */}
            <Card>
              <CardHeader title="6-Month Attendance Trend" subtitle="Monthly breakdown of attendance statuses." />
              <div className="h-64 p-4">
                {loading || attendanceTrends.length === 0 ? (
                  <EmptyChart label="No attendance records. Submit attendance to see monthly trends." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE8FF" />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#00C48C" name="Present" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="absent"  fill="#FF8042" name="Absent"  radius={[2, 2, 0, 0]} />
                      <Bar dataKey="leave"   fill="#FFBB28" name="Leave"   radius={[2, 2, 0, 0]} />
                      <Bar dataKey="wfh"     fill="#5B3CF5" name="WFH"     radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Gender Diversity */}
            <Card>
              <CardHeader title="Gender Diversity" subtitle="Ratio across the active workforce." />
              <div className="h-64 p-4 flex items-center justify-center">
                {loading || diversity.length === 0 ? (
                  <EmptyChart label="No diversity data. Employee gender info required." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={diversity}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="_id"
                        label={({ _id, percent }: any) => `${_id} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {diversity.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── PAYROLL & COMPLIANCE ──────────────────────────── */}
      {activeTab === 'payroll' && (
        <div className="space-y-8">
          {/* Statutory KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              label="PF Challan Liability"
              value={loading ? '—' : formatCurrency(statutory?.pfChallan ?? 0)}
              sub="Form 12A compliant"
              icon={<Buildings size={20} />}
            />
            <KPICard
              label="ESI Contribution"
              value={loading ? '—' : formatCurrency(statutory?.esiChallan ?? 0)}
              sub="Monthly ESIC ledger"
              icon={<Buildings size={20} />}
              color="text-green-600"
            />
            <KPICard
              label="Total Statutory"
              value={loading ? '—' : formatCurrency(statutory?.totalStatutory ?? 0)}
              sub="All statutory deductors"
              icon={<CurrencyInr size={20} />}
              color="text-ag-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payroll Trend */}
            <Card>
              <CardHeader title="Monthly Payroll Trend" subtitle="Gross payroll disbursement over last 6 payroll cycles." />
              <div className="h-64 p-4">
                {loading || payrollTrends.length === 0 ? (
                  <EmptyChart label="No completed payroll runs found. Run payroll to see trends." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={payrollTrends}>
                      <defs>
                        <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00C48C" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00C48C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE8FF" />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                      <Tooltip formatter={(v: any) => [formatCurrency(v), 'Gross Payroll']} />
                      <Area type="monotone" dataKey="totalGross" stroke="#00C48C" strokeWidth={2} fill="url(#payrollGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Department Stats table */}
            <Card>
              <CardHeader title="Department Statistics" subtitle="Headcount, average CTC, and leave days per department." />
              <div className="overflow-auto max-h-64 p-2">
                {loading || deptStats.length === 0 ? (
                  <EmptyChart label="No department data available." />
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-ag-border">
                        <th className="text-left py-2 px-3 font-bold text-ag-ink-2">Department</th>
                        <th className="text-right py-2 px-3 font-bold text-ag-ink-2">Headcount</th>
                        <th className="text-right py-2 px-3 font-bold text-ag-ink-2">Avg CTC</th>
                        <th className="text-right py-2 px-3 font-bold text-ag-ink-2">Leave Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptStats.map((d: any, i: number) => (
                        <tr key={i} className="border-b border-ag-border/50 hover:bg-ag-surface-2/50 transition-colors">
                          <td className="py-2 px-3 font-semibold text-ag-ink">{d.department}</td>
                          <td className="py-2 px-3 text-right text-ag-ink-2">{d.headcount}</td>
                          <td className="py-2 px-3 text-right font-mono text-ag-ink-2">{formatCurrency(d.avgCTC)}</td>
                          <td className="py-2 px-3 text-right text-ag-ink-2">{d.totalLeaveDays}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── CUSTOM REPORT BUILDER ─────────────────────────── */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Build Custom Report" subtitle="Pick a dataset and column attributes, then export CSV data." />
            <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Dataset Select */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider">Target Dataset</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:border-ag-primary"
                  value={customEntity}
                  onChange={(e) => {
                    setCustomEntity(e.target.value);
                    const entObj = entitiesList.find(ent => ent.value === e.target.value);
                    if (entObj) setCustomColumns(entObj.fields);
                  }}
                >
                  {entitiesList.map((ent) => (
                    <option key={ent.value} value={ent.value}>{ent.label}</option>
                  ))}
                </select>
              </div>

              {/* Column Selection Checkboxes */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider">Include Columns</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-ag-surface-2 rounded-lg border border-ag-border">
                  {entitiesList.find(e => e.value === customEntity)?.fields.map((field) => (
                    <div key={field} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`chk-${field}`}
                        checked={customColumns.includes(field)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomColumns([...customColumns, field]);
                          } else {
                            setCustomColumns(customColumns.filter(c => c !== field));
                          }
                        }}
                        className="rounded border-ag-border text-ag-primary focus:ring-ag-primary"
                      />
                      <label htmlFor={`chk-${field}`} className="text-xs font-semibold text-ag-ink truncate">{field}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-end gap-3">
                <Button className="w-full h-10" onClick={handleRunCustom} loading={customLoading}>
                  Run Report
                </Button>
                {customResults.length > 0 && (
                  <Button variant="secondary" className="h-10" onClick={handleDownloadCSV} icon={<Download size={18} />} />
                )}
              </div>
            </div>
          </Card>

          {customResults.length > 0 && (
            <Card>
              <CardHeader title="Query Results" subtitle={`Found ${customResults.length} records.`} />
              <DataTable
                columns={columns}
                data={customResults}
                isLoading={customLoading}
                emptyTitle="No results found"
                emptySubtitle="Refine your criteria or run a new search."
              />
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}

