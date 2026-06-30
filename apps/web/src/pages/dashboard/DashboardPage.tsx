import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { KPICard } from '@/components/ui/KPICard/KPICard';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { dashboardService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/formatters';
import {
  Users, UserPlus, CurrencyInr, CheckSquare, Cake, TrendUp,
  Briefcase, Calendar, Plus, FileArrowDown
} from '@phosphor-icons/react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [deptDist, setDeptDist] = useState<any[]>([]);
  const [headcountTrend, setHeadcountTrend] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      const [kRes, dRes, hRes, aRes, bRes] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getDeptDistribution(),
        dashboardService.getHeadcountTrend(),
        dashboardService.getActivities(),
        dashboardService.getBirthdays(),
      ]);
      setKpis(kRes);
      setDeptDist(dRes);
      setHeadcountTrend(hRes);
      setActivities(aRes);
      setBirthdays(bRes);
      setIsLoading(false);
    }
    loadDashboard();
  }, []);

  return (
    <PageContainer
      title={`Welcome back, ${user?.fullName?.split(' ')[0]} 👋`}
      subtitle="Here's what's happening across WorkSphere enterprise today."
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/payroll')}
            icon={<CurrencyInr size={18} />}
          >
            Payroll Hub
          </Button>
          <Button
            onClick={() => navigate('/employees/new')}
            icon={<Plus size={18} />}
          >
            Add Employee
          </Button>
        </div>
      }
    >
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KPICard
          title="Total Employees"
          value={kpis?.totalEmployees || 0}
          subtext="Active database records"
          icon={<Users size={24} />}
          iconBg="bg-ag-primary-light text-ag-primary"
        />
        <KPICard
          title="Active Onboardings"
          value={kpis?.newJoinees || 0}
          subtext={kpis ? `${kpis.newJoinees} joinees this month` : 'Loading...'}
          icon={<UserPlus size={24} />}
          iconBg="bg-[#E6FAF4] text-ag-mint"
        />
        <KPICard
          title={`${kpis?.latestPayrollPeriod || 'Current'} Payroll`}
          value={kpis?.latestPayrollAmount || 0}
          formatter={(val) => formatCurrency(val, 'INR', true)}
          subtext={kpis?.latestPayrollAmount ? 'Latest period run' : 'No payroll runs setup'}
          icon={<CurrencyInr size={24} />}
          iconBg="bg-[#FFF8E6] text-ag-amber"
        />
        <KPICard
          title="Pending Approvals"
          value={kpis?.pendingApprovals || 0}
          subtext="Awaiting review"
          icon={<CheckSquare size={24} />}
          iconBg="bg-[#E8F6FF] text-[#0077B6]"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Headcount Growth Chart */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader
            title="Headcount Trend & Hiring Growth"
            subtitle="12-month workforce expansion metrics across departments."
          />
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={headcountTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B3CF5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5B3CF5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#8E88A8" fontSize={12} tickLine={false} />
                <YAxis stroke="#8E88A8" fontSize={12} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1433',
                    borderColor: '#1A1433',
                    borderRadius: '10px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#5B3CF5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Distribution Donut Chart */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Department Breakdown"
            subtitle="Workforce distribution by business unit."
          />
          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {deptDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display font-extrabold text-2xl text-ag-ink">{kpis?.totalEmployees}</span>
              <span className="text-[11px] text-ag-ink-3 font-semibold uppercase">Employees</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-ag-border/60">
            {deptDist.slice(0, 4).map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-ag-ink-2 truncate flex-1">{d.name}</span>
                <span className="font-bold text-ag-ink">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Activity & Birthdays Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Enterprise Activity Feed"
            subtitle="Real-time audit log stream from HR and managers."
          />
          <div className="space-y-4 pt-2">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-ag-surface-2/60 transition-colors">
                <span className="text-xl p-2 rounded-xl bg-ag-surface-2 shadow-2xs">{act.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ag-ink">
                    <span className="text-ag-primary">{act.actor}</span> {act.action}
                  </p>
                  <p className="text-xs text-ag-ink-3 mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Celebrations */}
        <Card>
          <CardHeader
            title="Celebrations & Birthdays 🎂"
            subtitle="Upcoming birthdays in the next 7 days."
          />
          <div className="space-y-3 pt-2">
            {birthdays.map((b) => (
              <div
                key={b.employeeId}
                onClick={() => navigate(`/employees/${b.employeeId}`)}
                className="flex items-center gap-3 p-3 rounded-xl border border-ag-border/60 hover:border-ag-border-strong hover:bg-ag-primary-light/30 transition-all cursor-pointer"
              >
                <Avatar name={b.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ag-ink truncate">{b.name}</p>
                  <p className="text-xs text-ag-ink-3 truncate">{b.dept}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-ag-accent-pink/15 text-ag-accent-pink">
                  {b.date}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
