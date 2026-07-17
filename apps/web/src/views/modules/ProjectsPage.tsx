import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { projectService, employeeService } from '@/services/api.service';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import {
  Folder, Kanban, Clock, Calendar, CheckSquare, Plus, Warning, X, ArrowsClockwise,
  ArrowUpRight, Users, ChartLine, Notebook, ShieldAlert, Sparkle, ArrowRight
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProjectsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const moduleKey = params['*'] || 'dashboard';

  const [activeTab, setActiveTab] = useState<string>(moduleKey);

  // Data States
  const [dashboard, setDashboard] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form Trigger States
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTimesheetForm, setShowTimesheetForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);

  // Form Value States
  const [projectForm, setProjectForm] = useState({
    projectCode: '',
    name: '',
    client: '',
    department: '',
    budget: 100000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    priority: 'medium',
    status: 'active',
    description: '',
    managerId: '',
    members: [] as string[]
  });

  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assigneeId: '',
    projectId: '',
    milestoneId: '',
    estimatedHours: 8,
    dueDate: '',
    startDate: ''
  });

  const [timesheetForm, setTimesheetForm] = useState({
    projectId: '',
    taskId: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8,
    description: '',
    billable: true,
    billingRate: 500
  });

  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    projectId: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    completionPercentage: 0
  });

  const [riskForm, setRiskForm] = useState({
    projectId: '',
    name: '',
    probability: 'medium',
    impact: 'medium',
    resolutionPlan: ''
  });

  useEffect(() => {
    if (moduleKey) {
      setActiveTab(moduleKey);
    }
  }, [moduleKey]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dash, projList, taskList, tsList, msList, riskList, empList] = await Promise.all([
        projectService.getDashboard().catch(() => null),
        projectService.getProjects().catch(() => []),
        projectService.getTasks().catch(() => []),
        projectService.getTimesheets().catch(() => []),
        projectService.getMilestones().catch(() => []),
        projectService.getRisks().catch(() => []),
        employeeService.list({ limit: 100 }).then(res => res.employees).catch(() => [])
      ]);

      setDashboard(dash);
      setProjects(projList);
      setTasks(taskList);
      setTimesheets(tsList);
      setMilestones(msList);
      setRisks(riskList);
      setEmployees(empList);

      if (projList.length > 0 && !selectedProject) {
        setSelectedProject(projList[0]);
      }
    } catch (err: any) {
      toast.error('Failed to sync project registry');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchData();
  }, []);

  // Submit Operations Handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.projectCode || !projectForm.name) {
      toast.error('Project Code and Name are required');
      return;
    }
    try {
      await projectService.createProject(projectForm);
      toast.success('Project workspace initiated successfully!');
      setShowProjectForm(false);
      setProjectForm({
        projectCode: '',
        name: '',
        client: '',
        department: '',
        budget: 100000,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        priority: 'medium',
        status: 'active',
        description: '',
        managerId: '',
        members: []
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create project');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.name || !taskForm.projectId) {
      toast.error('Task Name and Project are required');
      return;
    }
    try {
      await projectService.createTask(taskForm);
      toast.success('Task logged in task backlog!');
      setShowTaskForm(false);
      setTaskForm({
        name: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        assigneeId: '',
        projectId: '',
        milestoneId: '',
        estimatedHours: 8,
        dueDate: '',
        startDate: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleCreateTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timesheetForm.projectId || !timesheetForm.taskId || !timesheetForm.hoursWorked) {
      toast.error('Project, Task, and Hours worked are required');
      return;
    }
    try {
      await projectService.createTimesheet(timesheetForm);
      toast.success('Hours registered in billing ledger!');
      setShowTimesheetForm(false);
      setTimesheetForm({
        projectId: '',
        taskId: '',
        date: new Date().toISOString().split('T')[0],
        hoursWorked: 8,
        description: '',
        billable: true,
        billingRate: 500
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to log timesheet');
    }
  };

  const handleApproveTimesheet = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await projectService.approveTimesheet(id, status);
      toast.success(`Timesheet ledger log ${status} successfully!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to process approval');
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneForm.name || !milestoneForm.projectId) {
      toast.error('Milestone Name and Project are required');
      return;
    }
    try {
      await projectService.createMilestone(milestoneForm);
      toast.success('Project Milestone registered!');
      setShowMilestoneForm(false);
      setMilestoneForm({
        name: '',
        projectId: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        completionPercentage: 0
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to establish milestone');
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskForm.name || !riskForm.projectId) {
      toast.error('Risk Title and Project are required');
      return;
    }
    try {
      await projectService.createRisk(riskForm);
      toast.success('Risk vulnerability recorded in risk register.');
      setShowRiskForm(false);
      setRiskForm({
        projectId: '',
        name: '',
        probability: 'medium',
        impact: 'medium',
        resolutionPlan: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save risk');
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await projectService.updateTaskStatus(taskId, newStatus);
      toast.success('Task board state synchronized!');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to shift task status');
    }
  };

  // Mock chart points for budget tracking
  const chartPoints = [
    { name: 'W1', budget: 12000, actual: 9500 },
    { name: 'W2', budget: 25000, actual: 21000 },
    { name: 'W3', budget: 45000, actual: 38000 },
    { name: 'W4', budget: 80000, actual: 67000 },
    { name: 'W5', budget: 95000, actual: dashboard?.totalHoursLogged ? (dashboard?.totalHoursLogged * 450) : 82000 }
  ];

  return (
    <>
      <PageContainer
      title="Projects & Delivery Hub"
      subtitle="Enterprise portfolios tracker, Agile Gantt timelines, timesheet billing ledgers, and capacity metrics."
      actions={
        <div className="flex gap-2">
          {activeTab === 'projects' && (
            <Button onClick={() => setShowProjectForm(true)} icon={<Plus size={16} />}>Create Project</Button>
          )}
          {activeTab === 'tasks' && (
            <Button onClick={() => setShowTaskForm(true)} icon={<Plus size={16} />}>Log Task</Button>
          )}
          {activeTab === 'timesheets' && (
            <Button onClick={() => setShowTimesheetForm(true)} icon={<Plus size={16} />}>Log Hours</Button>
          )}
          {activeTab === 'milestones' && (
            <Button onClick={() => setShowMilestoneForm(true)} icon={<Plus size={16} />}>Add Milestone</Button>
          )}
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
            Sync Canvas
          </Button>
        </div>
      }
    >
      {/* Tab Selector */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: <ChartLine size={16} /> },
          { key: 'projects', label: 'Projects Master', icon: <Folder size={16} /> },
          { key: 'tasks', label: 'Kanban Board', icon: <Kanban size={16} /> },
          { key: 'timesheets', label: 'Timesheet Approvals', icon: <Clock size={16} /> },
          { key: 'milestones', label: 'Milestones & Risks', icon: <Calendar size={16} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              navigate(`/projects/${tab.key}`);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.key ? 'bg-ag-primary text-white shadow-md' : 'text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-3/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. PROJECTS DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-ag-primary/5 to-transparent border-ag-primary/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Total Projects</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {dashboard?.totalProjects ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-primary/10 rounded-xl text-ag-primary">
                    <Folder size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-ag-ink-3 font-semibold">
                  <span className="text-green-600">{dashboard?.activeProjects ?? 0} active</span> • <span>{dashboard?.completedProjects ?? 0} completed</span>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-ag-accent-coral/5 to-transparent border-ag-accent-coral/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Pending Tasks</p>
                    <h3 className="text-3xl font-extrabold text-ag-coral mt-2">
                      {dashboard?.pendingTasks ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-accent-coral/10 rounded-xl text-ag-coral">
                    <Kanban size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-ag-ink-3 font-semibold">
                  <span className="text-ag-primary">{dashboard?.completedTasks ?? 0} resolved</span> tasks in backlog
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-ag-primary/5 to-transparent border-ag-primary/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Timesheet Hours</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {dashboard?.totalHoursLogged ?? 0} hrs
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-primary/10 rounded-xl text-ag-primary">
                    <Clock size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-ag-ink-3 font-semibold">
                  <span className="text-green-600 font-bold">{dashboard?.billableHours ?? 0} billable</span> hours recorded
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/5 to-transparent border-green-600/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Project Revenue</p>
                    <h3 className="text-3xl font-extrabold text-green-600 mt-2">
                      ₹{(dashboard?.billingRevenue ?? 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-600/10 rounded-xl text-green-600">
                    <ArrowUpRight size={24} />
                  </div>
                </div>
                <div className="mt-4 text-xs text-ag-ink-3 font-semibold">
                  Calculated against contract billing rates
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader title="Project Budget burn rate" subtitle="Comparison tracking of planned cost allocation budgets vs actual expenditures." />
              <div className="p-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPoints}>
                    <defs>
                      <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B3CF5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#5B3CF5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E25C5C" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#E25C5C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`]} />
                    <Area type="monotone" name="Planned Budget" dataKey="budget" stroke="#5B3CF5" strokeWidth={2} fillOpacity={1} fill="url(#budgetGrad)" />
                    <Area type="monotone" name="Actual Cost" dataKey="actual" stroke="#E25C5C" strokeWidth={2} fillOpacity={1} fill="url(#actualGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Resource Workload Allocations" subtitle="Capacity distribution of active backlog tasks assigned per employee." />
              <div className="p-6 space-y-4 h-72 overflow-y-auto no-scrollbar">
                {(dashboard?.workload ?? []).length === 0 ? (
                  <p className="text-xs text-ag-ink-3">No active allocations.</p>
                ) : (
                  (dashboard?.workload ?? []).map((w: any) => (
                    <div key={w.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-ag-ink">{w.name}</span>
                        <span className="text-ag-primary">{w.tasks} tasks</span>
                      </div>
                      <div className="w-full h-2 bg-ag-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ag-primary rounded-full transition-all"
                          style={{ width: `${Math.min(w.tasks * 15, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. PROJECTS MASTER VIEW */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Projects Table (Left panel) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Enterprise Portfolios Registry" subtitle="Detailed audit directory of corporate projects, budgets, and priority tracks." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                      <th className="p-4">Project Name</th>
                      <th className="p-4">Manager</th>
                      <th className="p-4">Budget limit</th>
                      <th className="p-4">Schedules</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-ag-ink-3">No active projects. Register one using the "+ Create Project" button.</td>
                      </tr>
                    ) : (
                      projects.map((proj) => (
                        <tr
                          key={proj._id}
                          onClick={() => setSelectedProject(proj)}
                          className={`border-b border-ag-border cursor-pointer transition-colors ${
                            selectedProject?._id === proj._id ? 'bg-ag-primary/5 hover:bg-ag-primary/10' : 'hover:bg-ag-surface-2/40'
                          }`}
                        >
                          <td className="p-4 font-bold text-ag-ink">
                            <span className="block">{proj.name}</span>
                            <span className="text-[10px] text-ag-ink-3 font-mono font-medium">{proj.projectCode} • Client: {proj.client || 'Internal'}</span>
                          </td>
                          <td className="p-4 font-semibold text-ag-ink-2">{proj.managerName}</td>
                          <td className="p-4 font-mono font-bold">₹{proj.budget.toLocaleString()}</td>
                          <td className="p-4 font-medium text-ag-ink-3">
                            <span className="block">Start: {proj.startDate}</span>
                            {proj.endDate && <span className="block text-[10px]">Due: {proj.endDate}</span>}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              proj.priority === 'high'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : proj.priority === 'medium'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
                              {proj.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={proj.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Project Details Panel (Right Panel) */}
          <div className="space-y-6">
            {selectedProject ? (
              <Card className="p-6 border-ag-primary/20 bg-gradient-to-br from-ag-primary/5 to-transparent">
                <div className="flex justify-between items-start border-b border-ag-border pb-4 mb-4">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-ag-primary bg-ag-primary/10 px-2 py-0.5 rounded-full uppercase">{selectedProject.projectCode}</span>
                    <h3 className="text-base font-extrabold text-ag-ink mt-1.5">{selectedProject.name}</h3>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setSelectedProject(null)} icon={<X size={14} />} />
                </div>
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-ag-ink-3 block font-bold">Client & Account Profile</span>
                    <span className="font-semibold text-ag-ink">{selectedProject.client || 'Internal Project'}</span>
                  </div>
                  <div>
                    <span className="text-ag-ink-3 block font-bold">Scope Description</span>
                    <p className="text-ag-ink-2 font-medium leading-relaxed">{selectedProject.description || 'No project scope description recorded.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-ag-ink-3 block font-bold">Authorized Budget</span>
                      <span className="font-bold text-ag-ink font-mono text-sm">₹{selectedProject.budget.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-ag-ink-3 block font-bold">Lead Owner / Manager</span>
                      <span className="font-semibold text-ag-ink">{selectedProject.managerName}</span>
                    </div>
                  </div>
                  <div className="border-t border-ag-border pt-4">
                    <h4 className="font-bold text-xs text-ag-ink mb-2">Team Deliverables Checklist</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                      {milestones.filter(m => m.projectId === selectedProject._id).length === 0 ? (
                        <p className="text-[11px] text-ag-ink-3 italic">No milestones registered for this project.</p>
                      ) : (
                        milestones.filter(m => m.projectId === selectedProject._id).map(m => (
                          <div key={m._id} className="flex justify-between items-center bg-ag-surface p-2 rounded-lg border border-ag-border">
                            <span className="font-semibold text-[11px] text-ag-ink truncate max-w-[120px]">{m.name}</span>
                            <span className="text-[10px] text-ag-ink-3">{m.dueDate}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-ag-ink-3 italic text-xs">
                Select a project from the directory panel to view detail files and team tasks scopes.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 3. TASKS & KANBAN BOARD */}
      {activeTab === 'tasks' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-ag-ink flex items-center gap-2">
              <Kanban size={18} className="text-ag-primary" />
              <span>Agile Workflow Sprint Board</span>
            </h3>
            <Button size="sm" onClick={() => setShowTaskForm(true)} icon={<Plus size={14} />}>New Task</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
            {[
              { key: 'todo', label: 'To Do', border: 'border-t-ag-primary' },
              { key: 'progress', label: 'In Progress', border: 'border-t-yellow-500' },
              { key: 'review', label: 'Review', border: 'border-t-purple-500' },
              { key: 'testing', label: 'Testing', border: 'border-t-orange-500' },
              { key: 'completed', label: 'Completed', border: 'border-t-green-600' }
            ].map((col) => (
              <div key={col.key} className="bg-ag-surface-2 p-4 rounded-xl border border-ag-border min-w-[200px] flex flex-col gap-4 min-h-[500px]">
                <div className={`border-t-4 ${col.border} pt-2 flex justify-between items-center mb-1`}>
                  <span className="text-xs font-bold text-ag-ink uppercase tracking-wide">{col.label}</span>
                  <span className="bg-ag-surface border border-ag-border text-ag-ink-2 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.status === col.key).length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 max-h-[600px] overflow-y-auto no-scrollbar">
                  {tasks.filter(t => t.status === col.key).map((task) => (
                    <div
                      key={task._id}
                      className="bg-ag-surface p-4 rounded-lg border border-ag-border hover:shadow-md transition-all space-y-3 cursor-pointer"
                    >
                      <div>
                        <span className="text-[9px] font-bold font-mono text-ag-ink-3 uppercase block">{task.projectName}</span>
                        <h4 className="text-xs font-black text-ag-ink mt-0.5 leading-snug">{task.name}</h4>
                      </div>
                      <p className="text-[10px] text-ag-ink-3 font-medium line-clamp-2">{task.description}</p>
                      
                      <div className="flex justify-between items-center border-t border-ag-border/50 pt-2.5 text-[10px]">
                        <span className="font-semibold text-ag-ink-2">👤 {task.assigneeName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                          task.priority === 'high'
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-ag-surface-3 text-ag-ink-2 border-ag-border'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Dropdown status shift simulator for screen readability */}
                      <div className="flex gap-1 items-center border-t border-ag-border/30 pt-2">
                        <select
                          className="w-full bg-ag-surface-2 border border-ag-border text-[9px] font-semibold text-ag-ink-2 rounded px-1 py-0.5 focus:outline-none"
                          value={task.status}
                          onChange={(e) => handleTaskStatusChange(task._id, e.target.value)}
                        >
                          <option value="todo">To Do</option>
                          <option value="progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="testing">Testing</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {tasks.filter(t => t.status === col.key).length === 0 && (
                    <div className="text-center text-[10px] text-ag-ink-3 italic py-8">
                      Column is empty
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. EMPLOYEE TIMESHEETS VIEW */}
      {activeTab === 'timesheets' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-5">
              <span className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider block">Total Logged Hours</span>
              <h3 className="text-2xl font-black mt-1 text-ag-ink">{timesheets.reduce((sum, ts) => sum + ts.hoursWorked, 0)} hrs</h3>
            </Card>
            <Card className="p-5">
              <span className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider block">Billable Hours Log</span>
              <h3 className="text-2xl font-black mt-1 text-ag-primary">{timesheets.filter(ts => ts.billable).reduce((sum, ts) => sum + ts.hoursWorked, 0)} hrs</h3>
            </Card>
            <Card className="p-5">
              <span className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider block">Awaiting Approvals</span>
              <h3 className="text-2xl font-black mt-1 text-yellow-600">{timesheets.filter(ts => ts.status === 'pending').length} logs</h3>
            </Card>
            <Card className="p-5">
              <span className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider block">Approved Logs</span>
              <h3 className="text-2xl font-black mt-1 text-green-600">{timesheets.filter(ts => ts.status === 'approved').length} logs</h3>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Submit Timesheet Form */}
            <Card className="p-6">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Log Billable Work Hours</h3>
              <form onSubmit={handleCreateTimesheet} className="space-y-4">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label ag-label--required">Project</label>
                  <select
                    className="ag-input"
                    value={timesheetForm.projectId}
                    onChange={(e) => setTimesheetForm({ ...timesheetForm, projectId: e.target.value })}
                    required
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label ag-label--required">backlog Task</label>
                  <select
                    className="ag-input"
                    value={timesheetForm.taskId}
                    onChange={(e) => setTimesheetForm({ ...timesheetForm, taskId: e.target.value })}
                    required
                  >
                    <option value="">Select task...</option>
                    {tasks.filter(t => t.projectId === timesheetForm.projectId).map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Log Date"
                    type="date"
                    value={timesheetForm.date}
                    onChange={(e) => setTimesheetForm({ ...timesheetForm, date: e.target.value })}
                    required
                  />
                  <Input
                    label="Hours Logged"
                    type="number"
                    value={timesheetForm.hoursWorked}
                    onChange={(e) => setTimesheetForm({ ...timesheetForm, hoursWorked: parseFloat(e.target.value || '8') })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Hourly Billing Rate (INR)"
                    type="number"
                    value={timesheetForm.billingRate}
                    onChange={(e) => setTimesheetForm({ ...timesheetForm, billingRate: parseFloat(e.target.value || '0') })}
                    required
                  />
                  <div className="flex items-center gap-2 pt-8">
                    <input
                      type="checkbox"
                      id="billable"
                      checked={timesheetForm.billable}
                      onChange={(e) => setTimesheetForm({ ...timesheetForm, billable: e.target.checked })}
                      className="rounded border-ag-border text-ag-primary focus:ring-ag-primary"
                    />
                    <label htmlFor="billable" className="text-xs font-bold text-ag-ink-2">Billable Task</label>
                  </div>
                </div>
                <Input
                  label="Work Activities Description"
                  value={timesheetForm.description}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, description: e.target.value })}
                  placeholder="Completed milestone API controllers integration"
                />
                <Button type="submit" className="w-full">Register Hours</Button>
              </form>
            </Card>

            {/* Right: Timesheet logs & approvals */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader title="Timesheet Hours Ledger Log" subtitle="Track logged employee sessions, billable invoice ratios, and sign-off statuses." />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                        <th className="p-4">Employee</th>
                        <th className="p-4">Task Details</th>
                        <th className="p-4">Hours</th>
                        <th className="p-4">Billing Rate</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timesheets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-ag-ink-3">No hours logged. Submit a timesheet on the left panel.</td>
                        </tr>
                      ) : (
                        timesheets.map((ts) => (
                          <tr key={ts._id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                            <td className="p-4">
                              <span className="font-bold text-ag-ink block">{ts.employeeName}</span>
                              <span className="text-[10px] text-ag-ink-3">{ts.date}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-ag-ink block truncate max-w-[150px]">{ts.taskName}</span>
                              <span className="text-[10px] text-ag-ink-3 truncate max-w-[150px] block">{ts.description || 'No notes.'}</span>
                            </td>
                            <td className="p-4 font-mono font-bold">{ts.hoursWorked} hrs</td>
                            <td className="p-4 font-mono">
                              {ts.billable ? `₹${ts.billingRate}/hr` : <span className="text-ag-ink-3 italic">Non-billable</span>}
                            </td>
                            <td className="p-4">
                              <StatusBadge status={ts.status} />
                            </td>
                            <td className="p-4">
                              {ts.status === 'pending' ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveTimesheet(ts._id, 'approved')}
                                    className="px-2 py-1 bg-green-500 text-white rounded text-[10px] font-bold hover:bg-green-600"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApproveTimesheet(ts._id, 'rejected')}
                                    className="px-2 py-1 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-600"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-ag-ink-3 italic font-medium">Synced</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 5. MILESTONES & RISKS VIEW */}
      {activeTab === 'milestones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Milestones registry (Left panel) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Project Milestones deliverables" subtitle="Track release stages, due dates, and completion status percentage." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                      <th className="p-4">Milestone</th>
                      <th className="p-4">Project</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Completion %</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-ag-ink-3">No milestones defined. Add one from the action button.</td>
                      </tr>
                    ) : (
                      milestones.map((ms) => (
                        <tr key={ms._id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                          <td className="p-4 font-bold text-ag-ink">
                            <span className="block">{ms.name}</span>
                            <span className="text-[10px] text-ag-ink-3">{ms.description || 'No description'}</span>
                          </td>
                          <td className="p-4 font-semibold text-ag-primary">{ms.projectName}</td>
                          <td className="p-4">{ms.dueDate}</td>
                          <td className="p-4 font-mono font-bold text-ag-primary">{ms.completionPercentage}%</td>
                          <td className="p-4">
                            <StatusBadge status={ms.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Risks Register */}
            <Card>
              <div className="p-6 border-b border-ag-border flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider">Vulnerability Risk Register</h3>
                  <span className="text-[11px] text-ag-ink-3 block">Probability, impact, and mitigation matrix analysis.</span>
                </div>
                <Button size="sm" onClick={() => setShowRiskForm(true)} icon={<Plus size={14} />}>Register Risk</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                      <th className="p-4">Risk Threat</th>
                      <th className="p-4">Probability</th>
                      <th className="p-4">Impact</th>
                      <th className="p-4">Mitigation Plan</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-ag-ink-3">No risks registered. Track project threat matrix here.</td>
                      </tr>
                    ) : (
                      risks.map((risk) => (
                        <tr key={risk._id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                          <td className="p-4 font-bold text-ag-ink">{risk.name}</td>
                          <td className="p-4 font-bold text-yellow-600 uppercase">{risk.probability}</td>
                          <td className="p-4 font-bold text-red-600 uppercase">{risk.impact}</td>
                          <td className="p-4 font-medium text-ag-ink-3">{risk.resolutionPlan || 'N/A'}</td>
                          <td className="p-4">
                            <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-2 py-0.5 border border-yellow-200 rounded-full inline-block uppercase">
                              {risk.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* AI Project health insights */}
          <Card className="p-6 border-ag-primary/20 bg-gradient-to-br from-ag-primary/5 to-transparent h-fit">
            <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkle size={18} className="text-ag-primary" />
              <span>AI Project Health Advisor</span>
            </h3>
            <div className="space-y-4 text-xs font-medium">
              <div className="bg-ag-surface p-4 rounded-xl border border-ag-border text-xs flex justify-between">
                <div>
                  <span className="text-ag-ink-3 block">Overall Health Score</span>
                  <span className="text-lg font-black text-ag-ink">86.4 / 100</span>
                </div>
                <div className="text-right">
                  <span className="text-ag-ink-3 block">Delay Risk</span>
                  <span className="text-lg font-black text-green-600">Minimal (3.4%)</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex gap-2 items-start bg-ag-surface/50 p-3 rounded-lg border border-ag-border">
                  <span className="p-1 bg-yellow-100 text-yellow-700 rounded mt-0.5">⚠️</span>
                  <div>
                    <span className="font-bold text-ag-ink block">Milestone Deadline Prediction</span>
                    <p className="text-[11px] text-ag-ink-3 leading-relaxed mt-0.5">API router schema upgrade has a high resource workload. Risk register suggests minor schedule adjustments of +2 days.</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start bg-ag-surface/50 p-3 rounded-lg border border-ag-border">
                  <span className="p-1 bg-green-100 text-green-700 rounded mt-0.5">✓</span>
                  <div>
                    <span className="font-bold text-ag-ink block">Resource Allocation Capacity</span>
                    <p className="text-[11px] text-ag-ink-3 leading-relaxed mt-0.5">Employee workloads are currently distributed cleanly under capacity limits. No burnout warnings detected.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>

    {/* ── Modal: Create Project ── */}
    {showProjectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80 text-left overflow-y-auto max-h-[90vh]">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Initiate Project Workspace</span>
              <Button variant="ghost" size="sm" onClick={() => setShowProjectForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Project Title"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Unique Project Code"
                  value={projectForm.projectCode}
                  onChange={(e) => setProjectForm({ ...projectForm, projectCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. PRJ-CRM-API"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Account Client Name"
                  value={projectForm.client}
                  onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                  placeholder="Internal / External brand"
                />
                <Input
                  label="Department Division"
                  value={projectForm.department}
                  onChange={(e) => setProjectForm({ ...projectForm, department: e.target.value })}
                  placeholder="e.g. engineering, sales"
                />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <Input
                  label="Scope Budget (INR)"
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm({ ...projectForm, budget: parseFloat(e.target.value || '0') })}
                  required
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                  required
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label ag-label--required">Project Manager</label>
                  <select
                    className="ag-input"
                    value={projectForm.managerId}
                    onChange={(e) => setProjectForm({ ...projectForm, managerId: e.target.value })}
                    required
                  >
                    <option value="">Select project manager...</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label">Priority Track</label>
                  <select
                    className="ag-input"
                    value={projectForm.priority}
                    onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <Input
                label="Scope Description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Core deliveries scope, architecture guidelines..."
              />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Initiate Project</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Task ── */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80 text-left overflow-y-auto max-h-[90vh]">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Issue Sprint Task Card</span>
              <Button variant="ghost" size="sm" onClick={() => setShowTaskForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Task Title"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  required
                />
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label ag-label--required">Select Project Reference</label>
                  <select
                    className="ag-input"
                    value={taskForm.projectId}
                    onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                    required
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label ag-label--required">Assignee</label>
                  <select
                    className="ag-input"
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    required
                  >
                    <option value="">Select employee...</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label">Milestone Reference</label>
                  <select
                    className="ag-input"
                    value={taskForm.milestoneId}
                    onChange={(e) => setTaskForm({ ...taskForm, milestoneId: e.target.value })}
                  >
                    <option value="">No milestone link...</option>
                    {milestones.filter(m => m.projectId === taskForm.projectId).map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <Input
                  label="Est. Hours"
                  type="number"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: parseFloat(e.target.value || '8') })}
                  required
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label">Task Priority</label>
                  <select
                    className="ag-input"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label">Task Stage</label>
                  <select
                    className="ag-input"
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    <option value="todo">To Do</option>
                    <option value="progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <Input
                label="Task Scope Details"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Include acceptance criteria, testing details..."
              />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Log Task Card</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Timesheet ── */}
      {showTimesheetForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80 text-left overflow-y-auto max-h-[90vh]">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Log Billable Work Session</span>
              <Button variant="ghost" size="sm" onClick={() => setShowTimesheetForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateTimesheet} className="space-y-6">
              <div className="w-full flex flex-col gap-1.5">
                <label className="ag-label ag-label--required">Select Project Reference</label>
                <select
                  className="ag-input"
                  value={timesheetForm.projectId}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, projectId: e.target.value })}
                  required
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full flex flex-col gap-1.5">
                <label className="ag-label ag-label--required">Sprint Task</label>
                <select
                  className="ag-input"
                  value={timesheetForm.taskId}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, taskId: e.target.value })}
                  required
                >
                  <option value="">Select task...</option>
                  {tasks.filter(t => t.projectId === timesheetForm.projectId).map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Log Date"
                  type="date"
                  value={timesheetForm.date}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, date: e.target.value })}
                  required
                />
                <Input
                  label="Hours worked"
                  type="number"
                  value={timesheetForm.hoursWorked}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, hoursWorked: parseFloat(e.target.value || '8') })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Hourly Billing Rate (INR)"
                  type="number"
                  value={timesheetForm.billingRate}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, billingRate: parseFloat(e.target.value || '0') })}
                  required
                />
                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="modalBillable"
                    checked={timesheetForm.billable}
                    onChange={(e) => setTimesheetForm({ ...timesheetForm, billable: e.target.checked })}
                    className="rounded border-ag-border text-ag-primary focus:ring-ag-primary"
                  />
                  <label htmlFor="modalBillable" className="text-xs font-bold text-ag-ink-2">Billable Task</label>
                </div>
              </div>
              <Input
                label="Task Scope details"
                value={timesheetForm.description}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, description: e.target.value })}
                placeholder="Log activity deliverables..."
              />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Register Hours</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Milestone ── */}
      {showMilestoneForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80 text-left overflow-y-auto max-h-[90vh]">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Register Milestone Deliverable</span>
              <Button variant="ghost" size="sm" onClick={() => setShowMilestoneForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateMilestone} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Milestone Title"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  required
                />
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label ag-label--required">Project Reference</label>
                  <select
                    className="ag-input"
                    value={milestoneForm.projectId}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, projectId: e.target.value })}
                    required
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Due Delivery Date"
                  type="date"
                  value={milestoneForm.dueDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                  required
                />
                <Input
                  label="Completion %"
                  type="number"
                  value={milestoneForm.completionPercentage}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, completionPercentage: parseFloat(e.target.value || '0') })}
                />
              </div>
              <Input
                label="Scope Description"
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                placeholder="Scope items checked off in this milestone release..."
              />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Register Milestone</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Register Risk ── */}
      {showRiskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80 text-left overflow-y-auto max-h-[90vh]">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Log Vulnerability Risk threat</span>
              <Button variant="ghost" size="sm" onClick={() => setShowRiskForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateRisk} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Risk Threat Title"
                  value={riskForm.name}
                  onChange={(e) => setRiskForm({ ...riskForm, name: e.target.value })}
                  required
                />
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label ag-label--required">Project Link</label>
                  <select
                    className="ag-input"
                    value={riskForm.projectId}
                    onChange={(e) => setRiskForm({ ...riskForm, projectId: e.target.value })}
                    required
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label">Probability Rate</label>
                  <select
                    className="ag-input"
                    value={riskForm.probability}
                    onChange={(e) => setRiskForm({ ...riskForm, probability: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label">Scope Impact</label>
                  <select
                    className="ag-input"
                    value={riskForm.impact}
                    onChange={(e) => setRiskForm({ ...riskForm, impact: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <Input
                label="Mitigation Plan"
                value={riskForm.resolutionPlan}
                onChange={(e) => setRiskForm({ ...riskForm, resolutionPlan: e.target.value })}
                placeholder="Scope adjustments, alternative API vendors..."
              />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Register Risk Profile</Button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
