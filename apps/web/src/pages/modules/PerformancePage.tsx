import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import {
  ChartBar, Target, Users, ShieldCheck, ArrowsClockwise,
  Plus, Warning, Trophy, TrendUp, UserCheck, Star
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import api from '@/services/api';

const GOAL_CATEGORIES = ['individual', 'team', 'department', 'company'];
const RATING_LABELS = ['1 - Needs Improvement', '2 - Meets Some', '3 - Meets Expectations', '4 - Exceeds', '5 - Outstanding'];

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'reviews' | 'calibration' | 'succession'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [successions, setSuccessions] = useState<any[]>([]);

  // Form states
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'individual',
    targetValue: 100,
    unit: 'percentage',
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

  const [employees, setEmployees] = useState<any[]>([]);

  // Fetch performance items from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Performance Summary
      const res = await api.get('/performance');
      setGoals(res.data.data?.goals || []);
      setCycles(res.data.data?.cycles || []);

      // 2. Fetch Succession Plans
      const succRes = await api.get('/performance/succession');
      setSuccessions(succRes.data.data || []);

      // 3. Fetch Employees for dropdowns
      const empRes = await api.get('/employees', { params: { limit: 100 } });
      setEmployees(empRes.data.data?.employees || []);
    } catch (err) {
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return toast.error('Goal title is required');

    try {
      // Get current logged-in employee ID or default to first employee
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
        title: '',
        description: '',
        type: 'individual',
        targetValue: 100,
        unit: 'percentage',
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
    } catch (err) {
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
        positionName: 'Director of Engineering',
        successorId: '',
        readiness: 'ready_now',
        performanceRating: 4.0,
        potentialRating: 4.5,
        developmentNeeds: 'Leadership training'
      });
      fetchData();
    } catch (err) {
      toast.error('Failed to create succession plan');
    }
  };

  return (
    <PageContainer
      title="Performance Management"
      subtitle="Supervise organizational OKRs, continuous check-ins, multi-reviewer calibrations, and succession pipelines."
      actions={
        <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
          Refresh
        </Button>
      }
    >
      {/* Navigation tabs */}
      <div className="flex border-b border-ag-border gap-4 mb-6">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <ChartBar size={18} /> },
          { id: 'goals', label: 'Goals & OKRs', icon: <Target size={18} /> },
          { id: 'reviews', label: 'Reviews & Feedback', icon: <Star size={18} /> },
          { id: 'calibration', label: 'Calibration', icon: <UserCheck size={18} /> },
          { id: 'succession', label: 'Succession Planning', icon: <Users size={18} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3 font-semibold text-sm transition-all focus:outline-none ${
              activeTab === tab.id
                ? 'border-b-2 border-ag-primary text-ag-primary'
                : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-ag-ink-3">Loading performance space…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="p-4 flex items-center gap-4 bg-gradient-to-r from-ag-primary/5 to-transparent">
                  <div className="p-3 rounded-lg bg-ag-primary-light text-ag-primary shrink-0">
                    <Target size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-ag-ink-3 font-semibold uppercase">Total Goals</p>
                    <p className="text-2xl font-bold text-ag-ink mt-0.5">{goals.length}</p>
                  </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#E6FAF4] text-ag-mint shrink-0">
                    <Trophy size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-ag-ink-3 font-semibold uppercase">High Performers</p>
                    <p className="text-2xl font-bold text-ag-ink mt-0.5">
                      {goals.filter(g => g.status === 'achieved').length}
                    </p>
                  </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#FFF8E6] text-ag-amber shrink-0">
                    <TrendUp size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-ag-ink-3 font-semibold uppercase">Succession Targets</p>
                    <p className="text-2xl font-bold text-ag-ink mt-0.5">{successions.length}</p>
                  </div>
                </Card>
              </div>

              {/* Active Cycle and PIP summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader title="Active Review Cycles" subtitle="Performance evaluation schedules running in your organization." />
                    <div className="p-4 space-y-4">
                      {cycles.length === 0 ? (
                        <div className="text-center py-6 text-ag-ink-3 text-xs">No active performance cycles scheduled.</div>
                      ) : (
                        cycles.map(c => (
                          <div key={c._id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-ag-ink">{c.name}</h4>
                              <p className="text-xs text-ag-ink-3 mt-1">
                                Duration: {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-ag-mint/10 text-ag-mint capitalize">
                              {c.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="bg-[#FFF8E6] border border-ag-amber/30 p-4 flex gap-3">
                    <Warning size={20} className="text-ag-amber shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-ag-ink text-xs">Continuous Check-ins Alert</h4>
                      <p className="text-[11px] text-ag-ink-3 mt-1">
                        Encourage team managers to check-in on employee goal progress regularly.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Goals & OKRs */}
          {activeTab === 'goals' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Goal List */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader title="Assigned Goals" subtitle="Current performance target indicators for employees." />
                  <div className="p-4 space-y-4">
                    {goals.length === 0 ? (
                      <div className="text-center py-8 text-ag-ink-3 text-xs">No goals assigned yet. Create one on the right panel.</div>
                    ) : (
                      goals.map(g => (
                        <div key={g._id} className="p-4 border border-ag-border rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-ag-ink">{g.title}</h4>
                              <p className="text-xs text-ag-ink-3 mt-0.5">{g.description}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              g.status === 'achieved'
                                ? 'bg-ag-mint/10 text-ag-mint'
                                : 'bg-ag-primary-light text-ag-primary'
                            }`}>
                              {g.status}
                            </span>
                          </div>
                          
                          {/* Progress slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-ag-ink-3">Progress: {g.currentValue} / {g.targetValue} {g.unit}</span>
                              <span className="font-bold text-ag-primary">
                                {Math.round((g.currentValue / g.targetValue) * 100)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="0"
                                max={g.targetValue}
                                value={g.currentValue}
                                onChange={(e) => handleUpdateProgress(g._id, Number(e.target.value))}
                                className="w-full h-1.5 bg-ag-border rounded-lg appearance-none cursor-pointer accent-ag-primary"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Create Goal Form */}
              <Card className="p-5">
                <h4 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-2 mb-4">Assign New Goal</h4>
                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <Input
                    label="Goal Title *"
                    value={newGoal.title}
                    onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Drive 10% Revenue Increase"
                    required
                  />
                  <Input
                    label="Description"
                    value={newGoal.description}
                    onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide measurable goals context..."
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ag-ink-2 uppercase block">Goal Type</label>
                    <select
                      value={newGoal.type}
                      onChange={e => setNewGoal(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:border-ag-primary"
                    >
                      {GOAL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      type="date"
                      value={newGoal.startDate}
                      onChange={e => setNewGoal(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={newGoal.endDate}
                      onChange={e => setNewGoal(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full" icon={<Plus size={16} />}>Assign Goal</Button>
                </form>
              </Card>
            </div>
          )}

          {/* TAB 3: Reviews */}
          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader title="Performance Reviews Portal" subtitle="Self evaluations and manager feedback reviews." />
                  <div className="p-4 space-y-4">
                    <p className="text-xs text-ag-ink-3">Complete your self-assessment sheets below. Confirm criteria with reporting managers.</p>
                    
                    <div className="p-4 border border-ag-border rounded-xl bg-ag-surface-2/40 space-y-4">
                      <div>
                        <h4 className="font-bold text-sm text-ag-ink">Active Evaluation Cycle: {cycles[0]?.name || 'Q3 2026 Cycle'}</h4>
                        <p className="text-xs text-ag-ink-3 mt-0.5">Please submit your self evaluation sheet before deadlines.</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-ag-ink-2 block">Self Rating Score</label>
                          <select className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:border-ag-primary">
                            {RATING_LABELS.map((label, idx) => (
                              <option key={idx} value={idx + 1}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <Input
                          label="Self Evaluation Comments"
                          placeholder="Document your key contributions and successes here..."
                        />
                        <Button onClick={() => toast.success('Self-assessment submitted successfully!')}>
                          Submit Assessment
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <Card className="p-4 bg-[#FFF8E6] border border-ag-amber/30">
                  <div className="flex gap-3">
                    <Warning size={20} className="text-ag-amber shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-ag-ink text-xs">Calibration Schedule Pending</h4>
                      <p className="text-[11px] text-ag-ink-3 mt-1">
                        Calibrate rating updates occur after self and manager review sessions wrap up.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 4: Calibration */}
          {activeTab === 'calibration' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Talent Calibration Console" subtitle="Balance employee evaluations to achieve uniform rating parameters." />
                <div className="p-4 space-y-4">
                  <div className="p-8 text-center border-2 border-dashed border-ag-border rounded-xl">
                    <ChartBar size={48} className="mx-auto text-ag-ink-3 mb-3" />
                    <h4 className="font-bold text-ag-ink text-sm">Rating Bell Curve Distribution</h4>
                    <p className="text-xs text-ag-ink-3 max-w-sm mx-auto mt-1">
                      Calibrate rating records to align with company performance targets. Bell curve analysis shows meets/exceeds trends.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: Succession Planning */}
          {activeTab === 'succession' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Succession Candidates */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader title="Critical Position Successors" subtitle="Leadership planning candidates and readiness statuses." />
                  <div className="p-4 space-y-4">
                    {successions.length === 0 ? (
                      <div className="text-center py-8 text-ag-ink-3 text-xs">No successor candidates nominated yet. Add one on the right.</div>
                    ) : (
                      successions.map(s => {
                        const successor = employees.find(e => e._id === s.successorId);
                        return (
                          <div key={s._id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar name={successor?.fullName || 'Candidate'} src={successor?.personal?.photo} size="sm" />
                              <div>
                                <h4 className="font-bold text-sm text-ag-ink">{s.positionName} successor</h4>
                                <p className="text-xs text-ag-ink-3 mt-0.5">
                                  Nominee: {successor?.fullName || 'Employee'} · Performance Rating: {s.performanceRating || '—'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-ag-primary-light text-ag-primary capitalize">
                              {s.readiness.replace(/_/g, ' ')}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                {/* Talent 9-Box Grid Visual Matrix */}
                <Card>
                  <CardHeader title="Talent Grid (9-Box Matrix)" subtitle="Visual grid displaying employee potential against performance rating." />
                  <div className="p-4 grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'High Potential / Low Perf', bg: 'bg-ag-surface-2' },
                      { label: 'High Potential / Med Perf', bg: 'bg-ag-primary-light/20 text-ag-primary' },
                      { label: 'Star / High Perf & Pot', bg: 'bg-ag-mint/10 text-ag-mint font-bold' },
                      { label: 'Med Potential / Low Perf', bg: 'bg-ag-surface-2' },
                      { label: 'Core / Med Perf & Pot', bg: 'bg-ag-surface-2 font-bold' },
                      { label: 'High Perf / Med Pot', bg: 'bg-ag-primary-light/20 text-ag-primary' },
                      { label: 'Low Potential / Low Perf', bg: 'bg-ag-coral/10 text-ag-coral' },
                      { label: 'Solid / Low Pot & Med Perf', bg: 'bg-ag-surface-2' },
                      { label: 'High Perf / Low Pot', bg: 'bg-ag-surface-2' }
                    ].map((box, idx) => (
                      <div key={idx} className={`p-4 border border-ag-border rounded-xl text-xs flex items-center justify-center min-h-[80px] ${box.bg}`}>
                        {box.label}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Nominate Successor Form */}
              <Card className="p-5 h-fit">
                <h4 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-2 mb-4">Nominate Successor</h4>
                <form onSubmit={handleCreateSuccession} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ag-ink-2 uppercase block">Target Position</label>
                    <input
                      value={newSuccession.positionName}
                      onChange={e => setNewSuccession(prev => ({ ...prev, positionName: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-ag-border text-sm focus:border-ag-primary focus:outline-none"
                      placeholder="e.g. Director of Engineering"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ag-ink-2 uppercase block">Successor Candidate *</label>
                    <select
                      value={newSuccession.successorId}
                      onChange={e => setNewSuccession(prev => ({ ...prev, successorId: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:border-ag-primary focus:outline-none"
                    >
                      <option value="">Select Candidate</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ag-ink-2 uppercase block">Readiness Status</label>
                    <select
                      value={newSuccession.readiness}
                      onChange={e => setNewSuccession(prev => ({ ...prev, readiness: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:border-ag-primary"
                    >
                      <option value="ready_now">Ready Now</option>
                      <option value="ready_1_2_years">Ready in 1-2 Years</option>
                      <option value="ready_3_5_years">Ready in 3-5 Years</option>
                    </select>
                  </div>

                  <Button type="submit" className="w-full" icon={<Plus size={16} />}>Nominate Successor</Button>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
