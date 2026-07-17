import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Modal } from '@/components/ui/Modal/Modal';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Badge } from '@/components/ui/Badge/Badge';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/formatters';
import {
  ChartBar, Target, Users, ShieldCheck, ArrowsClockwise,
  Plus, Warning, Trophy, TrendUp, UserCheck, Star, Calendar,
  Chats, ChatsCircle, Handshake, Gift, Notebook, Flag, MagnifyingGlass,
  ArrowRight, CheckCircle, WarningOctagon, Info, ListBullets, DotsThreeVertical,
  CaretRight, Rocket, Sparkle, SealCheck, GridFour, XCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import api from '@/services/api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

type Goal = {
  _id: string;
  title: string;
  description: string;
  type: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: string;
  startDate?: string;
  endDate?: string;
  weightage?: number;
  priority?: 'high' | 'medium' | 'low';
};

type ActiveTab =
  | 'dashboard'
  | 'goals'
  | 'employees'
  | 'checkins'
  | 'reviews'
  | 'calibration'
  | 'talent_matrix'
  | 'succession'
  | 'promotion'
  | 'rewards';

// ─────────────────────────────────────────────────────────────────────────────
// Hardcoded Configs & Colors
// ─────────────────────────────────────────────────────────────────────────────

const RATING_COLORS = ['#FF5F57', '#FFB020', '#E4DFFF', '#5B3CF5', '#00C48C'];
const RATING_LABELS = ['1 - Needs Improvement', '2 - Meets Some', '3 - Meets Expectations', '4 - Exceeds', '5 - Outstanding'];
const GOAL_TYPES = [
  { value: 'individual', label: 'Individual Goal' },
  { value: 'team',       label: 'Team Goal' },
  { value: 'department', label: 'Department Goal' },
  { value: 'company',    label: 'Company OKR' },
  { value: 'stretch',    label: 'Stretch Goal' },
];

const COMPENDENCY_LIST = [
  { key: 'tech',    label: 'Technical Skills' },
  { key: 'comm',    label: 'Communication' },
  { key: 'lead',    label: 'Leadership' },
  { key: 'owner',   label: 'Ownership & Accountability' },
  { key: 'innov',   label: 'Innovation & Problem Solving' },
];

const NINE_BOX_CELLS = [
  { row: 3, col: 1, label: 'Enigma (High Pot / Low Perf)',        color: 'bg-ag-surface-2 text-ag-ink-2' },
  { row: 3, col: 2, label: 'High Potential Growth',               color: 'bg-ag-primary-light text-ag-primary' },
  { row: 3, col: 3, label: 'Star / High Performer & Potential',   color: 'bg-[#E6FAF4] text-ag-mint font-bold' },
  { row: 2, col: 1, label: 'Dilemma (Med Pot / Low Perf)',        color: 'bg-ag-surface-2 text-ag-ink-2' },
  { row: 2, col: 2, label: 'Core / Consistent Contributor',       color: 'bg-ag-surface-3 text-ag-ink' },
  { row: 2, col: 3, label: 'High Performer / Medium Potential',   color: 'bg-ag-primary-light text-ag-primary' },
  { row: 1, col: 1, label: 'Underperformer (Low Pot & Perf)',     color: 'bg-[#FFF0EF] text-ag-coral' },
  { row: 1, col: 2, label: 'Solid Citizen (Low Pot / Med Perf)',  color: 'bg-ag-surface-2 text-ag-ink-2' },
  { row: 1, col: 3, label: 'High Performer / Low Potential',      color: 'bg-ag-surface-2 text-ag-ink-2' },
];

// Mock Continuous check-ins
const MOCK_CHECKINS = [
  { id: '1', emp: 'Rahul Mehta', manager: 'Sanjay Kumar', type: 'Weekly 1:1', mood: '😀 Positive', rating: 4, date: '2026-07-14', topics: 'Sprint planning and feedback on presentation' },
  { id: '2', emp: 'Priya Singh', manager: 'Sanjay Kumar', type: 'Monthly Review', mood: '😐 Neutral', rating: 3.5, date: '2026-07-12', topics: 'Discussing project bottlenecks and timelines' },
  { id: '3', emp: 'John D.', manager: 'Sanjay Kumar', type: 'Quarterly OKR alignment', mood: '🤩 Excited', rating: 5, date: '2026-07-10', topics: 'Future roadmap and promotion case preparation' },
];

// Mock Rewards & Recognition
const MOCK_RECOGNITION = [
  { id: '1', emp: 'Rahul Mehta', award: 'Star Performer', icon: <Trophy size={14} />, msg: 'Delivering the complex warehouse module ahead of timeline.' },
  { id: '2', emp: 'Priya Singh', award: 'Innovation Award', icon: <Rocket size={14} />, msg: 'Rearchitecting the offline sync cache engine.' },
  { id: '3', emp: 'Aisha Bose', award: 'Team Player', icon: <Handshake size={14} />, msg: 'Excellent onboarding coordination support.' },
];

// Mock Succession critical list
const CRITICAL_POSITIONS = [
  { id: '1', title: 'VP of Engineering', risk: 'High', bench: 2, successor: 'Rahul Mehta (Ready in 1 year)' },
  { id: '2', title: 'Director of HR', risk: 'Medium', bench: 1, successor: 'Priya Singh (Ready now)' },
  { id: '3', title: 'Chief Architect', risk: 'High', bench: 0, successor: 'None nominated' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [successions, setSuccessions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Split view details for Goals
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Employee Profile Tab Workspace
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [empFilterDept, setEmpFilterDept] = useState('all');

  // Goals tab filters
  const [goalSearch, setGoalSearch] = useState('');
  const [goalFilterType, setGoalFilterType] = useState('all');

  // Forms
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'individual',
    targetValue: 100,
    unit: 'percentage',
    weightage: 20,
    priority: 'medium' as 'high' | 'medium' | 'low',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0]
  });

  const [newSuccession, setNewSuccession] = useState({
    positionName: 'Director of Engineering',
    successorId: '',
    readiness: 'ready_now',
    performanceRating: 4.0,
    potentialRating: 4.5,
    developmentNeeds: 'Leadership training'
  });

  // 1:1 meeting addition form
  const [checkinForm, setCheckinForm] = useState({
    employeeId: '',
    type: 'Weekly 1:1',
    mood: '😀 Positive',
    rating: 4,
    date: new Date().toISOString().split('T')[0],
    topics: '',
  });

  // HR Review Calibration override modal
  const [isCalibrateModalOpen, setIsCalibrateModalOpen] = useState(false);
  const [calibrateEmpId, setCalibrateEmpId] = useState('');
  const [calibrateRating, setCalibrateRating] = useState(4.0);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true);
    try {
      const [perfRes, succRes, empRes] = await Promise.all([
        api.get('/performance'),
        api.get('/performance/succession'),
        api.get('/employees', { params: { limit: 100 } })
      ]);
      setGoals(perfRes.data.data?.goals || []);
      setCycles(perfRes.data.data?.cycles || []);
      setSuccessions(succRes.data.data || []);
      setEmployees(empRes.data.data?.employees || []);
    } catch {
      toast.error('Failed to load performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return toast.error('Goal title is required');

    try {
      const meRes = await api.get('/auth/me');
      const employeeId = meRes.data.data?.employeeId;
      if (!employeeId) return toast.error('No associated employee ID found');

      const payload = {
        ...newGoal,
        employeeId,
        cycleId: cycles[0]?._id || null,
        keyResults: []
      };

      await api.post('/performance/goals', payload);
      toast.success('Performance goal created successfully!');
      setNewGoal({
        title: '', description: '', type: 'individual', targetValue: 100, unit: 'percentage',
        weightage: 20, priority: 'medium',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0]
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create goal');
    }
  };

  const handleUpdateProgress = async (goalId: string, currentValue: number) => {
    try {
      await api.patch(`/performance/goals/${goalId}/progress`, { currentValue });
      toast.success('Goal progress updated!');
      fetchData();
    } catch {
      toast.error('Failed to update progress');
    }
  };

  const handleCreateSuccession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuccession.successorId) return toast.error('Please select a potential successor');

    try {
      await api.post('/performance/succession', newSuccession);
      toast.success('Succession candidate added successfully!');
      setNewSuccession({
        positionName: 'Director of Engineering', successorId: '', readiness: 'ready_now',
        performanceRating: 4.0, potentialRating: 4.5, developmentNeeds: 'Leadership training'
      });
      fetchData();
    } catch {
      toast.error('Failed to create succession plan');
    }
  };

  const handleAddCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinForm.employeeId || !checkinForm.topics) {
      toast.error('Please select employee and provide agenda/notes.');
      return;
    }
    toast.success('1-on-1 meeting logged successfully!');
    setCheckinForm({
      employeeId: '', type: 'Weekly 1:1', mood: '😀 Positive', rating: 4,
      date: new Date().toISOString().split('T')[0], topics: ''
    });
  };

  const handleCalibrateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Employee performance rating calibrated successfully!');
    setIsCalibrateModalOpen(false);
  };

  // ── Derived Data ───────────────────────────────────────────────────────────

  const goalsAchieved = goals.filter(g => g.status === 'achieved').length;
  const goalsInProgress = goals.filter(g => g.status !== 'achieved').length;
  const avgRating = 4.2;

  const filteredGoals = goals.filter(g => {
    const matchSearch = !goalSearch || g.title.toLowerCase().includes(goalSearch.toLowerCase());
    const matchType = goalFilterType === 'all' || g.type === goalFilterType;
    return matchSearch && matchType;
  });

  const depts = Array.from(new Set(employees.map(e => e.job?.departmentName).filter(Boolean))) as string[];

  const filteredEmployees = employees.filter(e => {
    const matchSearch = !empSearch || e.fullName.toLowerCase().includes(empSearch.toLowerCase()) || e.employeeId.toLowerCase().includes(empSearch.toLowerCase());
    const matchDept = empFilterDept === 'all' || (e.job?.departmentName ?? '') === empFilterDept;
    return matchSearch && matchDept;
  });

  // Recharts Data
  const deptPerformanceData = depts.slice(0, 5).map(d => ({
    name: d.split(' ')[0],
    rating: Number((3.8 + Math.random() * 1.0).toFixed(1)),
    okrCompletion: Math.round(70 + Math.random() * 25)
  }));

  const goalProgressData = [
    { name: 'Week 1', progress: 20 },
    { name: 'Week 2', progress: 35 },
    { name: 'Week 3', progress: 48 },
    { name: 'Week 4', progress: 68 },
    { name: 'Week 5', progress: 85 },
  ];

  // ── Tabs Config ────────────────────────────────────────────────────────────

  const tabConfig: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard',          label: 'Overview Dashboard', icon: <ChartBar size={14} /> },
    { id: 'goals',              label: 'Goals & OKRs',       icon: <Target size={14} />, badge: goalsInProgress || undefined },
    { id: 'employees',          label: 'Employee Profiles',  icon: <Users size={14} /> },
    { id: 'checkins',           label: '1-on-1 Check-ins',   icon: <ChatsCircle size={14} /> },
    { id: 'reviews',            label: 'Review Portals',     icon: <Star size={14} />, badge: cycles.length || undefined },
    { id: 'calibration',        label: 'Talent Calibration', icon: <UserCheck size={14} /> },
    { id: 'talent_matrix',      label: 'Talent 9-Box Grid',  icon: <GridFour size={14} /> },
    { id: 'succession',         label: 'Succession bench',   icon: <Notebook size={14} /> },
    { id: 'promotion',          label: 'Promotion Readiness',icon: <Rocket size={14} />, badge: 3 },
    { id: 'rewards',            label: 'Rewards Wall',       icon: <Gift size={14} /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <PageContainer
      title="Continuous Performance & Goal Calibration"
      subtitle="Define company OKRs, track continuous 1-on-1 progress, perform reviewer calibration, manage succession planning, and evaluate promotion readiness."
      actions={
        <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={16} />}>Refresh</Button>
      }
    >
      {/* ── Tabs Navigation ── */}
      <div className="flex gap-1 p-1 bg-ag-surface-2 border border-ag-border rounded-xl w-fit mb-8 overflow-x-auto max-w-full shrink-0 scrollbar-none">
        {tabConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-ag-primary text-white shadow-sm'
                : 'text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface'
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

      {loading ? (
        <div className="p-12 text-center text-xs text-ag-ink-3">
          <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading workspace...
        </div>
      ) : (
        <div className="space-y-6">

          {/* ═══════════════════════════════════════════════════════
              TAB 1: PERFORMANCE DASHBOARD
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Executive Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-3">
                {[
                  { title: 'Reviewed',          value: '84%',               icon: <Star size={20} />,        bg: 'bg-ag-primary-light text-ag-primary' },
                  { title: 'Goals Achieved',    value: goalsAchieved,       icon: <CheckCircle size={20} />, bg: 'bg-[#E6FAF4] text-ag-mint' },
                  { title: 'Goals In Progress', value: goalsInProgress,     icon: <Target size={20} />,      bg: 'bg-[#E8F6FF] text-ag-sky' },
                  { title: 'High Performers',   value: '18%',               icon: <Trophy size={20} />,      bg: 'bg-[#FFF8E6] text-ag-amber' },
                  { title: 'PIP / Needs Imp',   value: '3%',                icon: <WarningOctagon size={20} />, bg: 'bg-[#FFF0EF] text-ag-coral' },
                  { title: 'Promotion Ready',   value: '5 Employees',       icon: <Rocket size={20} />,      bg: 'bg-[#E8F6FF] text-ag-sky' },
                  { title: 'Cycle Progress',    value: '92%',               icon: <Calendar size={20} />,    bg: 'bg-ag-surface-2 text-ag-ink-2' },
                  { title: 'Average Rating',    value: `${avgRating} / 5.0`, icon: <Star size={20} />,        bg: 'bg-[#FFF8E6] text-ag-amber' },
                  { title: 'Employee Mood',     value: '4.2/5.0',           icon: <Chats size={20} />,       bg: 'bg-[#E6FAF4] text-ag-mint' },
                  { title: 'Retention Risk',    value: 'Low',               icon: <ShieldCheck size={20} />, bg: 'bg-[#E6FAF4] text-ag-mint' },
                ].map(k => (
                  <Card key={k.title} className="p-3 flex flex-col justify-between border border-ag-border/60 hover:border-ag-border-strong transition-all">
                    <div className={`p-2 rounded-lg shrink-0 w-fit ${k.bg}`}>{k.icon}</div>
                    <div className="mt-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-ag-ink-3 block">{k.title}</span>
                      <span className="font-display font-black text-sm text-ag-ink">{k.value}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Analytical Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual statistics */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-5">
                    <CardHeader title="Goal Completion Timeline" subtitle="Organizational progress trend for OKRs over the active quarter." />
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={goalProgressData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                          <XAxis dataKey="name" stroke="#8E88A8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#8E88A8" fontSize={10} tickLine={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="progress" stroke="#5B3CF5" fill="#E4DFFF" name="Goal Completion %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <CardHeader title="Rating Calibration Grid" subtitle="Average performance metrics scored across departments." />
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptPerformanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                          <XAxis dataKey="name" stroke="#8E88A8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#8E88A8" fontSize={10} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="rating" fill="#00C48C" radius={[4, 4, 0, 0]} name="Avg Rating" />
                          <Bar dataKey="okrCompletion" fill="#FFB020" radius={[4, 4, 0, 0]} name="OKR Completion %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Bell Curve representation */}
                  <Card className="p-5 md:col-span-2">
                    <CardHeader title="Rating Bell Curve Distribution" subtitle="Actual compared to target distribution metrics." />
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { name: 'Rating 1', Actual: 2, Target: 5 },
                          { name: 'Rating 2', Actual: 8, Target: 10 },
                          { name: 'Rating 3', Actual: 54, Target: 50 },
                          { name: 'Rating 4', Actual: 26, Target: 25 },
                          { name: 'Rating 5', Actual: 10, Target: 10 },
                        ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                          <XAxis dataKey="name" stroke="#8E88A8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#8E88A8" fontSize={10} tickLine={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="Actual" stroke="#5B3CF5" strokeWidth={2} name="Actual %" />
                          <Line type="monotone" dataKey="Target" stroke="#8E88A8" strokeDasharray="4 4" name="Target Guideline %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                {/* Right: feed and activity */}
                <div className="lg:col-span-4 space-y-6">
                  <Card className="p-5">
                    <h4 className="font-bold text-[10px] uppercase text-ag-ink-3 tracking-wider mb-4">Latest Recognition Feed</h4>
                    <div className="space-y-3.5">
                      {MOCK_RECOGNITION.map(r => (
                        <div key={r.id} className="text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-ag-primary flex items-center gap-1">{r.icon} {r.award}</span>
                            <span className="text-ag-ink font-bold">{r.emp}</span>
                          </div>
                          <p className="text-ag-ink-3 leading-relaxed text-[11px] bg-ag-surface rounded-lg p-2">"{r.msg}"</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h4 className="font-bold text-[10px] uppercase text-ag-ink-3 tracking-wider mb-4">Active Cycles</h4>
                    <div className="space-y-3">
                      {cycles.map((c, i) => (
                        <div key={i} className="flex justify-between items-center p-2.5 border border-ag-border rounded-xl text-xs bg-white">
                          <div>
                            <p className="font-bold text-ag-ink">{c.name}</p>
                            <p className="text-[10px] text-ag-ink-3 mt-0.5">Due: {new Date(c.endDate).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 2: GOALS & OKRs WORKSPACE
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'goals' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ag-ink-3" />
                  <input
                    type="text"
                    value={goalSearch}
                    onChange={e => setGoalSearch(e.target.value)}
                    placeholder="Search OKRs and target goals..."
                    className="w-full h-9 pl-9 pr-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none focus:border-ag-primary"
                  />
                </div>
                <select
                  value={goalFilterType}
                  onChange={e => setGoalFilterType(e.target.value)}
                  className="h-9 px-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                  <option value="department">Department</option>
                  <option value="company">Company</option>
                </select>
              </div>

              <div className={`grid gap-6 ${selectedGoal ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
                {/* List Container */}
                <div className={selectedGoal ? 'lg:col-span-7' : 'col-span-1'}>
                  <Card>
                    <div className="divide-y divide-ag-border/40">
                      {filteredGoals.length === 0 ? (
                        <p className="p-8 text-center text-xs text-ag-ink-3">No active goals found.</p>
                      ) : (
                        filteredGoals.map(g => (
                          <div
                            key={g._id}
                            onClick={() => setSelectedGoal(g)}
                            className="p-4 cursor-pointer hover:bg-ag-surface-2/30 transition-colors flex items-center justify-between"
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs text-ag-ink">{g.title}</h4>
                              <p className="text-[10px] text-ag-ink-3 leading-relaxed truncate max-w-sm">{g.description}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-ag-primary uppercase tracking-wider">{g.type}</span>
                                <span className="text-[9px] font-bold text-ag-ink-3">Weightage: {g.weightage || 20}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-xs font-bold text-ag-primary">{Math.round((g.currentValue / g.targetValue) * 100)}%</span>
                                <div className="w-20 h-1 bg-ag-border rounded-full overflow-hidden mt-1">
                                  <div className="h-full bg-ag-primary" style={{ width: `${Math.round((g.currentValue / g.targetValue) * 100)}%` }} />
                                </div>
                              </div>
                              <CaretRight size={14} className="text-ag-ink-3" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>

                {/* Detail panel */}
                {selectedGoal && (
                  <div className="lg:col-span-5">
                    <Card className="p-5 space-y-5 flex flex-col justify-between min-h-[400px]">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start border-b border-ag-border pb-3">
                          <div>
                            <span className="text-[9px] font-black uppercase text-ag-primary tracking-wider">{selectedGoal.type}</span>
                            <h3 className="font-display font-black text-sm text-ag-ink">{selectedGoal.title}</h3>
                          </div>
                          <button onClick={() => setSelectedGoal(null)} className="p-1 text-ag-ink-3 hover:text-ag-ink"><XCircle size={16} /></button>
                        </div>
                        <p className="text-xs text-ag-ink-2 leading-relaxed">{selectedGoal.description || 'No additional details provided.'}</p>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-ag-ink-3 tracking-wider block">Adjust Progress Value</label>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Current: {selectedGoal.currentValue} / {selectedGoal.targetValue} {selectedGoal.unit}</span>
                            <strong className="text-ag-primary font-black">{Math.round((selectedGoal.currentValue / selectedGoal.targetValue) * 100)}%</strong>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={selectedGoal.targetValue}
                            value={selectedGoal.currentValue}
                            onChange={e => handleUpdateProgress(selectedGoal._id, Number(e.target.value))}
                            className="w-full h-1.5 bg-ag-border rounded-lg appearance-none cursor-pointer accent-ag-primary"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-ag-border">
                        <Button className="flex-1" size="sm" onClick={() => handleUpdateProgress(selectedGoal._id, selectedGoal.targetValue)} icon={<CheckCircle size={13} />}>Mark Complete</Button>
                        <Button variant="secondary" size="sm" icon={<Calendar size={13} />}>Extend Target</Button>
                      </div>
                    </Card>
                  </div>
                )}
              </div>

              {/* Goal creation Form */}
              <Card>
                <CardHeader title="Assign Corporate Performance target" subtitle="Introduce custom organizational objectives & key results." />
                <form onSubmit={handleCreateGoal} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Input label="Goal Objective / Title *" placeholder="e.g. Expand API response health to 99.9%" required value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} />
                    <Input label="Scope / Target Description" placeholder="Explain objective KPI definitions..." value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Select
                        label="Goal Level *"
                        value={newGoal.type}
                        onChange={e => setNewGoal({ ...newGoal, type: e.target.value })}
                        options={GOAL_TYPES}
                      />
                      <Select
                        label="Goal Priority"
                        value={newGoal.priority}
                        onChange={e => setNewGoal({ ...newGoal, priority: e.target.value as any })}
                        options={[
                          { value: 'high',   label: 'High Priority' },
                          { value: 'medium', label: 'Medium Priority' },
                          { value: 'low',    label: 'Low Priority' }
                        ]}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Target Value Limit" type="number" value={newGoal.targetValue} onChange={e => setNewGoal({ ...newGoal, targetValue: Number(e.target.value) })} />
                      <Input label="Objective Weightage (%)" type="number" value={newGoal.weightage} onChange={e => setNewGoal({ ...newGoal, weightage: Number(e.target.value) })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Assessment Start" type="date" value={newGoal.startDate} onChange={e => setNewGoal({ ...newGoal, startDate: e.target.value })} />
                      <Input label="Assessment Target" type="date" value={newGoal.endDate} onChange={e => setNewGoal({ ...newGoal, endDate: e.target.value })} />
                    </div>
                    <div className="pt-5 flex justify-end">
                      <Button type="submit" icon={<Plus size={14} />}>Publish Goal Objective</Button>
                    </div>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 3: EMPLOYEE PERFORMANCE PROFILES
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'employees' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ag-ink-3" />
                  <input
                    type="text"
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    placeholder="Search employees for performance tracking..."
                    className="w-full h-9 pl-9 pr-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <select
                  value={empFilterDept}
                  onChange={e => setEmpFilterDept(e.target.value)}
                  className="h-9 px-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none"
                >
                  <option value="all">All Departments</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Employee list panel */}
                <div className="lg:col-span-4 space-y-3">
                  <Card className="max-h-[500px] overflow-y-auto">
                    <div className="p-3 border-b border-ag-border">
                      <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider">Employee Directory</h4>
                    </div>
                    <div className="divide-y divide-ag-border/40">
                      {filteredEmployees.map(emp => (
                        <div
                          key={emp._id}
                          onClick={() => setSelectedEmp(emp)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                            selectedEmp?._id === emp._id ? 'bg-ag-primary-light' : 'hover:bg-ag-surface-2/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={emp.fullName} size="xs" src={emp.personal?.photo} />
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-ag-ink truncate">{emp.fullName}</p>
                              <p className="text-[10px] text-ag-ink-3">{emp.job?.departmentName}</p>
                            </div>
                          </div>
                          <Badge variant="primary" size="sm">Score: 4.2</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Performance profile workspace */}
                <div className="lg:col-span-8">
                  {selectedEmp ? (
                    <Card className="p-5 space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-ag-border">
                        <div className="flex items-center gap-3">
                          <Avatar name={selectedEmp.fullName} size="lg" src={selectedEmp.personal?.photo} />
                          <div>
                            <h3 className="font-display font-black text-lg text-ag-ink">{selectedEmp.fullName}</h3>
                            <p className="text-xs text-ag-ink-3">{selectedEmp.job?.designationName} · {selectedEmp.job?.departmentName}</p>
                            <p className="text-[10px] text-ag-ink-3 mt-1">Manager: {selectedEmp.job?.reportingManagerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-ag-ink-3 tracking-wider block">Talent Score</span>
                          <span className="text-xl font-display font-black text-ag-mint">4.5 / 5.0</span>
                        </div>
                      </div>

                      {/* 9-box parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { label: 'Potential Score', val: 'High Potential', color: 'text-ag-primary' },
                          { label: 'Promotion Readiness', val: 'Ready Now (12m)', color: 'text-ag-mint' },
                          { label: 'Retention Risk', val: 'Low Risk', color: 'text-ag-mint' },
                        ].map(m => (
                          <div key={m.label} className="bg-ag-surface p-3 rounded-xl border border-ag-border/55">
                            <span className="text-[9px] font-black uppercase text-ag-ink-3 block mb-1">{m.label}</span>
                            <span className={`text-xs font-bold ${m.color}`}>{m.val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Competencies */}
                      <div>
                        <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-3">Key Competency Scores</h4>
                        <div className="space-y-3">
                          {COMPENDENCY_LIST.map(c => {
                            const val = Math.round(75 + Math.random() * 20);
                            return (
                              <div key={c.key} className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-ag-ink-2 font-semibold">{c.label}</span>
                                  <span className="text-ag-primary font-bold">{val}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-ag-border rounded-full overflow-hidden">
                                  <div className="h-full bg-ag-primary" style={{ width: `${val}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div className="border-2 border-dashed border-ag-border rounded-xl p-12 text-center">
                      <Users size={36} className="mx-auto mb-2 text-ag-border-strong" />
                      <p className="font-bold text-ag-ink text-sm">Select an employee to view profile</p>
                      <p className="text-xs text-ag-ink-3 mt-1">Select any active employee in the directory list to examine their comprehensive evaluation sheet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 4: 1-on-1 MEETING CHECKINS
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'checkins' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Meeting History Logs */}
              <div className="lg:col-span-8 space-y-5">
                <Card>
                  <CardHeader title="Manager Check-in History" subtitle="Continuous notes logged during manager weekly/monthly 1-on-1s." />
                  <div className="divide-y divide-ag-border/40">
                    {MOCK_CHECKINS.map(c => (
                      <div key={c.id} className="p-4 space-y-2 hover:bg-ag-surface-2/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-ag-ink">{c.emp}</span>
                            <span className="text-[10px] text-ag-ink-3 ml-2">with {c.manager}</span>
                          </div>
                          <span className="text-[10px] text-ag-ink-3 font-mono">{formatDate(c.date)}</span>
                        </div>
                        <p className="text-xs text-ag-ink-2 bg-ag-surface p-2.5 rounded-lg">"{c.topics}"</p>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-ag-ink-3 font-semibold">Mood indicator: {c.mood}</span>
                          <span className="text-ag-ink-3 font-semibold">Rating: {c.rating} / 5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Log meeting panel */}
              <div className="lg:col-span-4">
                <Card className="p-5">
                  <h4 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-2 mb-4">Log 1-on-1 Check-in</h4>
                  <form onSubmit={handleAddCheckin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ag-ink-2 uppercase block">Employee</label>
                      <select
                        value={checkinForm.employeeId}
                        onChange={e => setCheckinForm({ ...checkinForm, employeeId: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:outline-none"
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Select
                        label="Meeting Format"
                        value={checkinForm.type}
                        onChange={e => setCheckinForm({ ...checkinForm, type: e.target.value })}
                        options={[
                          { value: 'Weekly 1:1', label: 'Weekly 1:1' },
                          { value: 'Monthly Review', label: 'Monthly' },
                          { value: 'Quarterly OKR', label: 'Quarterly' }
                        ]}
                      />
                      <Select
                        label="Employee Mood"
                        value={checkinForm.mood}
                        onChange={e => setCheckinForm({ ...checkinForm, mood: e.target.value })}
                        options={[
                          { value: '😀 Positive', label: '😀 Positive' },
                          { value: '😐 Neutral',  label: '😐 Neutral' },
                          { value: '☹️ Discouraged', label: '☹️ Struggling' }
                        ]}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="ag-label">Agenda & Feedback notes</label>
                      <textarea
                        rows={3}
                        value={checkinForm.topics}
                        onChange={e => setCheckinForm({ ...checkinForm, topics: e.target.value })}
                        placeholder="Topics discussed, blockages, future actions..."
                        className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-xs text-ag-ink focus:outline-none"
                      />
                    </div>

                    <Button type="submit" className="w-full" icon={<Plus size={16} />}>Log Check-in</Button>
                  </form>
                </Card>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 5: REVIEWS WORKFLOW
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader title="Performance Reviews & 360 Feedback" subtitle="Complete structured assessment cycles with self, manager, and peer scores." />
                  <div className="p-5 space-y-4">
                    <div className="p-4 border border-ag-border rounded-xl bg-white space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-ag-ink">Cycle Name: Q3 2026 Evaluation</h4>
                          <p className="text-xs text-ag-ink-3">Due: Oct 15, 2026</p>
                        </div>
                        <Badge variant="primary">Self review open</Badge>
                      </div>

                      <div className="space-y-4 pt-2">
                        {COMPENDENCY_LIST.map(c => (
                          <div key={c.key} className="grid grid-cols-3 items-center gap-4">
                            <span className="text-xs font-semibold text-ag-ink-2 col-span-2">{c.label}</span>
                            <select className="h-9 px-2.5 bg-ag-surface border border-ag-border rounded-lg text-xs focus:outline-none">
                              {RATING_LABELS.map((r, i) => <option key={i} value={i+1}>{r}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4 border-t border-ag-border">
                        <Button onClick={() => toast.success('Self evaluation saved successfully!')}>Save Assessment Draft</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <Card className="p-4 bg-ag-primary-light border-ag-primary/20">
                  <h4 className="font-bold text-xs text-ag-primary uppercase tracking-wider mb-2 flex items-center gap-1.5"><Info size={14} />Review Stages</h4>
                  <div className="space-y-3 text-xs text-ag-ink-3">
                    <p className="font-semibold text-ag-primary">1. Self Review (Open)</p>
                    <p>2. Manager Calibration (Pending)</p>
                    <p>3. Peer Assessment (Pending)</p>
                    <p>4. Calibration Review (Pending)</p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 6: CALIBRATION CONSOLE
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'calibration' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="HR Performance Calibration Console" subtitle="Acknowledge manager feedback reviews and calibrate final talent scores." />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2/40">
                        {['Employee', 'Department', 'Manager Rating', 'Calibrated Rating', 'Override status', 'Action'].map(h => (
                          <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.slice(0, 5).map(emp => (
                        <tr key={emp._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Avatar name={emp.fullName} size="xs" src={emp.personal?.photo} />
                              <span className="text-xs font-semibold text-ag-ink">{emp.fullName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-ag-ink-3">{emp.job?.departmentName}</td>
                          <td className="py-3 px-4 font-bold text-xs">4.0</td>
                          <td className="py-3 px-4 font-bold text-xs text-ag-primary">4.2</td>
                          <td className="py-3 px-4"><Badge variant="success">Auto calibrated</Badge></td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => { setCalibrateEmpId(emp._id); setIsCalibrateModalOpen(true); }}
                              icon={<UserCheck size={12} />}
                            >
                              Override
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Calibration Modal */}
              <Modal
                isOpen={isCalibrateModalOpen}
                onClose={() => setIsCalibrateModalOpen(false)}
                title="Override Calibrated Rating"
                description="Manually adjust final rating metrics to align with department score policies."
              >
                <form onSubmit={handleCalibrateSubmit} className="space-y-4 pt-2">
                  <Input
                    label="Adjust final score (1.0 - 5.0)"
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={calibrateRating}
                    onChange={e => setCalibrateRating(Number(e.target.value))}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="ag-label">Reason for Adjustment</label>
                    <textarea
                      rows={3}
                      placeholder="Calibration justification notes..."
                      className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-ag-border mt-6">
                    <Button type="button" variant="ghost" onClick={() => setIsCalibrateModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Submit Overrides</Button>
                  </div>
                </form>
              </Modal>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 7: TALENT 9-BOX MATRIX
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'talent_matrix' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Organizational 9-Box Matrix Grid" subtitle="Evaluating employees based on performance score against potential metrics." />
                <div className="p-5 grid grid-cols-3 gap-4 text-center">
                  {NINE_BOX_CELLS.map((cell, idx) => (
                    <div key={idx} className={`p-4 border border-ag-border rounded-xl text-xs flex flex-col justify-center min-h-[100px] ${cell.color}`}>
                      <span className="font-bold text-xs">{cell.label}</span>
                      <div className="mt-2 flex justify-center gap-1">
                        {idx === 2 && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded">Rahul Mehta</span>}
                        {idx === 4 && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded">Priya Singh</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 8: SUCCESSION PLANNING
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'succession' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <Card>
                  <CardHeader title="Critical Leadership Vacancies & Benches" subtitle="Tracking succession benches for key executive positions." />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ag-border bg-ag-surface-2/40">
                          {['Position', 'Vacancy Risk', 'Bench Strength', 'Primary successor'].map(h => (
                            <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {CRITICAL_POSITIONS.map(p => (
                          <tr key={p.id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                            <td className="py-3 px-4 font-bold text-xs text-ag-ink">{p.title}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                p.risk === 'High' ? 'bg-[#FFF0EF] text-ag-coral' : 'bg-[#FFF8E6] text-ag-amber'
                              }`}>{p.risk}</span>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold text-ag-ink-2">{p.bench} Candidates</td>
                            <td className="py-3 px-4 text-xs text-ag-primary font-bold">{p.successor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Candidates Nomination list */}
                <Card>
                  <CardHeader title="Nominated Succession Candidates" subtitle="Overview of potential successors nominated by managers." />
                  <div className="p-4 space-y-3">
                    {successions.map(s => {
                      const successor = employees.find(e => e._id === s.successorId);
                      return (
                        <div key={s._id} className="p-3 border border-ag-border rounded-xl flex items-center justify-between bg-white">
                          <div className="flex items-center gap-2">
                            <Avatar name={successor?.fullName || 'Candidate'} src={successor?.personal?.photo} size="xs" />
                            <div>
                              <p className="font-bold text-xs text-ag-ink">{successor?.fullName} nominated successor</p>
                              <p className="text-[10px] text-ag-ink-3">{s.positionName} · Potential Rating: {s.potentialRating}</p>
                            </div>
                          </div>
                          <Badge variant="primary">{s.readiness.replace(/_/g, ' ')}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Nomination Side Form */}
              <div className="lg:col-span-4">
                <Card className="p-5">
                  <h4 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-2 mb-4">Nominate Successor</h4>
                  <form onSubmit={handleCreateSuccession} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ag-ink-2 uppercase block">Target Position</label>
                      <input
                        value={newSuccession.positionName}
                        onChange={e => setNewSuccession(prev => ({ ...prev, positionName: e.target.value }))}
                        className="w-full h-10 px-3 rounded-lg border border-ag-border text-sm focus:outline-none"
                        placeholder="e.g. VP of Product"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ag-ink-2 uppercase block">Successor Candidate *</label>
                      <select
                        value={newSuccession.successorId}
                        onChange={e => setNewSuccession(prev => ({ ...prev, successorId: e.target.value }))}
                        className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:outline-none"
                      >
                        <option value="">Select Candidate</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ag-ink-2 uppercase block">Readiness level</label>
                      <select
                        value={newSuccession.readiness}
                        onChange={e => setNewSuccession(prev => ({ ...prev, readiness: e.target.value }))}
                        className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:outline-none"
                      >
                        <option value="ready_now">Ready Now</option>
                        <option value="ready_1_2_years">1-2 Years</option>
                        <option value="ready_3_5_years">3-5 Years</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full" icon={<Plus size={16} />}>Nominate Candidate</Button>
                  </form>
                </Card>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 9: PROMOTION READINESS
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'promotion' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Promotion Eligibility Matrix" subtitle="Calculated rating indicators recommending employees ready for grade promotions." />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2/40">
                        {['Employee', 'Current Designation', 'Recommended Role', 'Performance Trend', 'Promotion Score', 'Recommendation'].map(h => (
                          <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Rahul Mehta', current: 'Senior Engineer', target: 'Lead Architect', score: '96%', trend: 'Consistently Exceeds' },
                        { name: 'Priya Singh', current: 'HR Lead', target: 'VP of HR', score: '92%', trend: 'Outstanding' },
                        { name: 'Aisha Bose', current: 'Sales Lead', target: 'VP of Sales', score: '88%', trend: 'Meets/Exceeds' }
                      ].map((item, i) => (
                        <tr key={i} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                          <td className="py-3 px-4 font-bold text-xs text-ag-ink">{item.name}</td>
                          <td className="py-3 px-4 text-xs text-ag-ink-2">{item.current}</td>
                          <td className="py-3 px-4 text-xs text-ag-primary font-semibold">{item.target}</td>
                          <td className="py-3 px-4"><Badge variant="primary">{item.trend}</Badge></td>
                          <td className="py-3 px-4 font-mono font-bold text-xs text-ag-mint">{item.score}</td>
                          <td className="py-3 px-4">
                            <Button size="sm" icon={<SealCheck size={12} />}>Approve Promotion</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 10: REWARDS & RECOGNITION WALL
              ═══════════════════════════════════════════════════════ */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <Card className="p-6">
                <CardHeader title="Recognize Team Contributions" subtitle="Reward points, badges, and company achievement medals." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3">
                  {[
                    { title: 'Star Performer', desc: 'Sourced for outstanding execution and metrics delivery.', color: 'border-ag-mint bg-[#E6FAF4]/30', badge: <Trophy size={20} className="text-ag-mint" /> },
                    { title: 'Innovation Award', desc: 'Sourced for implementation of out of the box technology solutions.', color: 'border-ag-primary bg-ag-primary-light/30', badge: <Rocket size={20} className="text-ag-primary" /> },
                    { title: 'Team Player', desc: 'Outstanding cooperation and team communication support.', color: 'border-ag-sky bg-[#E8F6FF]/30', badge: <Handshake size={20} className="text-ag-sky" /> }
                  ].map(item => (
                    <div key={item.title} className={`p-4 border rounded-xl space-y-3 ${item.color}`}>
                      <div className="flex justify-between items-start">
                        {item.badge}
                        <span className="text-[10px] font-black uppercase text-ag-ink-3">Badge</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-ag-ink">{item.title}</h4>
                        <p className="text-[10px] text-ag-ink-3 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                      <Button size="sm" className="w-full text-[10px] h-8" variant="secondary" icon={<Plus size={10} />}>Grant Badge</Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

        </div>
      )}
    </PageContainer>
  );
}

