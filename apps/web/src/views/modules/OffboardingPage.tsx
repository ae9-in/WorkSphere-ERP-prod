import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useMatch, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Modal } from '@/components/ui/Modal/Modal';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { employeeService, auditService } from '@/services/api.service';
import { EmployeeListItem } from '@/types/employee.types';
import {
  ArrowsClockwise, Warning, User, Briefcase, FileText, CurrencyInr, Desktop,
  ShieldCheck, Heartbeat, UsersThree, Calendar, Clock, ArrowLeft, Trash,
  UploadSimple, Chat, Paperclip, Check, X, Sparkle, Info, Archive, FileArrowDown,
  CheckCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';

// Custom mock reasons for exit breakdown
const EXIT_REASONS = [
  { reason: 'Career Growth / Higher Salary', count: 12 },
  { reason: 'Higher Education', count: 4 },
  { reason: 'Personal / Family Commitments', count: 5 },
  { reason: 'Health / Medical Grounds', count: 2 },
  { reason: 'Involuntary / Restructuring', count: 1 }
];

export default function OffboardingPage() {
  const navigate = useNavigate();
  const match = useMatch('/offboarding/:id');
  const employeeId = match?.params.id;

  // Global State
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Workspace Employee Details
  const [employee, setEmployee] = useState<any>(null);
  const [exitState, setExitState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'clearances' | 'kt' | 'assets' | 'revocation' | 'settlement' | 'interview' | 'documents' | 'workflow' | 'timeline'>('clearances');

  // Comment input
  const [newComment, setNewComment] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);

  // Exit Interview form input
  const [interviewForm, setInterviewForm] = useState({
    reason: 'Career Growth',
    feedback: 'Great work culture and learning environment.',
    rating: '5',
    recommend: 'yes',
    rejoin: 'yes',
    notes: ''
  });

  // F&F Settlement form input
  const [settlementForm, setSettlementForm] = useState({
    basicSalary: 60000,
    pendingSalary: 52000,
    leaveEncashment: 18500,
    bonus: 10000,
    deductions: 3500,
    recoveries: 1200,
    gratuity: 45000,
    pf: 15400,
    paymentDate: '',
    paymentStatus: 'pending'
  });

  // Fetch exiting candidates
  const fetchExits = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await employeeService.list({ limit: 100 });
      // Offboarding cases: Notice Period or Inactive
      const list = res.employees.filter((e: any) =>
        e.official.status === 'notice_period' || e.official.status === 'inactive'
      ).map((e: any) => {
        // Calculate progress percentage based on clearances checklist
        const local = localStorage.getItem(`worksphere_offboarding_${e.employeeId}`);
        let completion = 20; // Default fallback
        if (local) {
          try {
            const parsed = JSON.parse(local);
            const totalItems = Object.keys(parsed.clearances).length;
            const doneItems = Object.values(parsed.clearances).filter(Boolean).length;
            completion = Math.round((doneItems / totalItems) * 100);
          } catch {
            // Ignore
          }
        }
        return { ...e, completion };
      });
      setStaff(list);

      // Set workspace details if match is found
      if (employeeId) {
        const target = list.find((e: any) => e.employeeId === employeeId);
        if (target) {
          setEmployee(target);
          loadExitState(target.employeeId);
        } else {
          // Direct fetch
          try {
            const empData = await employeeService.getById(employeeId);
            setEmployee(empData);
            loadExitState(empData.employeeId);
          } catch {
            toast.error('Exit profile not found');
            navigate('/offboarding');
          }
        }
      }
    } catch {
      toast.error('Failed to load transition roster');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, navigate]);

  useEffect(() => {
    fetchExits();
  }, [fetchExits]);

  // Load and cache workspace configurations
  const loadExitState = (empId: string) => {
    const key = `worksphere_offboarding_${empId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setExitState(parsed);
        // Sync inputs if saved
        if (parsed.interview) setInterviewForm(parsed.interview);
        if (parsed.settlement) setSettlementForm(parsed.settlement);
      } catch {
        initializeExitState(empId);
      }
    } else {
      initializeExitState(empId);
    }
  };

  const initializeExitState = (empId: string) => {
    const defaultState = {
      clearances: {
        'hr_exit_interview': false,
        'hr_experience_letter': false,
        'hr_relieving_letter': false,
        'hr_docs_verify': true,
        'fin_salary_clear': false,
        'fin_leave_encash': false,
        'fin_gratuity_settle': false,
        'fin_pf_transfer': false,
        'it_laptop_return': false,
        'it_monitor_return': false,
        'it_vpn_revoke': false,
        'it_email_revoke': false,
        'it_saas_revoke': false,
        'admin_office_keys': false,
        'admin_locker_clear': false,
        'manager_kt_complete': false,
        'manager_handover': false,
        'manager_replacement': false
      },
      ktProgress: {
        ktCompletePercent: 20,
        replacementAssigned: 'Ananya Sen',
        ktNotes: 'KT sessions started on project documentation.'
      },
      accessStatus: {
        erp: 'active',
        google: 'active',
        slack: 'active',
        jira: 'active',
        vpn: 'active'
      },
      approvals: {
        manager: 'pending',
        hr: 'pending',
        finance: 'pending',
        it: 'pending',
        admin: 'pending'
      },
      workflowStage: 'notice_period', // resignation_submitted -> manager_approval -> hr_approval -> notice_period -> kt -> clearances -> interview -> settlement -> archived
      timeline: [
        { action: 'RESIGNATION_SUBMITTED', user: 'System Admin', dept: 'HR', date: new Date(Date.now() - 86400000 * 5).toISOString() },
        { action: 'MANAGER_APPROVED', user: 'Priya Sharma', dept: 'Manager', date: new Date(Date.now() - 86400000 * 4).toISOString() }
      ],
      comments: [
        { id: '1', user: 'Priya Sharma', text: 'Resignation accepted. Last working day set. Initiating KT with replacement buddy Ananya.', date: new Date(Date.now() - 86400000 * 3).toISOString(), dept: 'Manager' }
      ]
    };
    localStorage.setItem(`worksphere_offboarding_${empId}`, JSON.stringify(defaultState));
    setExitState(defaultState);
  };

  const saveExitState = (updated: typeof exitState) => {
    if (!employee) return;
    localStorage.setItem(`worksphere_offboarding_${employee.employeeId}`, JSON.stringify(updated));
    setExitState(updated);
    // Sync candidates listing completion
    setStaff(prev => prev.map(c => {
      if (c.employeeId === employee.employeeId) {
        const totalItems = Object.keys(updated.clearances).length;
        const doneItems = Object.values(updated.clearances).filter(Boolean).length;
        return { ...c, completion: Math.round((doneItems / totalItems) * 100) };
      }
      return c;
    }));
  };

  // Toggle clearance item
  const toggleClearance = (key: string) => {
    if (!exitState) return;
    const nextClearances = { ...exitState.clearances, [key]: !exitState.clearances[key] };

    // Auto update approvals based on department subsets
    const nextApprovals = { ...exitState.approvals };
    if (key.startsWith('hr_') && nextClearances.hr_exit_interview && nextClearances.hr_experience_letter) {
      nextApprovals.hr = 'approved';
    }
    if (key.startsWith('fin_') && nextClearances.fin_salary_clear && nextClearances.fin_leave_encash) {
      nextApprovals.finance = 'approved';
    }
    if (key.startsWith('it_') && nextClearances.it_laptop_return && nextClearances.it_email_revoke) {
      nextApprovals.it = 'approved';
    }
    if (key.startsWith('admin_') && nextClearances.admin_office_keys) {
      nextApprovals.admin = 'approved';
    }
    if (key.startsWith('manager_') && nextClearances.manager_kt_complete) {
      nextApprovals.manager = 'approved';
    }

    const nextTimeline = [
      ...exitState.timeline,
      {
        action: `CLEARANCE_TOGGLED: ${key.toUpperCase().replace('_', ' ')} (${nextClearances[key] ? 'DONE' : 'PENDING'})`,
        user: 'System Admin',
        dept: 'HR',
        date: new Date().toISOString()
      }
    ];

    saveExitState({
      ...exitState,
      clearances: nextClearances,
      approvals: nextApprovals,
      timeline: nextTimeline
    });
    toast.success('Clearance checklist updated');
  };

  const setApprovalStageStatus = (stage: string, status: string) => {
    if (!exitState) return;
    const nextApprovals = { ...exitState.approvals, [stage]: status };
    const nextTimeline = [
      ...exitState.timeline,
      {
        action: `WORKFLOW_STAGE_UPDATE: ${stage.toUpperCase()} is ${status.toUpperCase()}`,
        user: 'System Admin',
        dept: 'HR',
        date: new Date().toISOString()
      }
    ];
    saveExitState({ ...exitState, approvals: nextApprovals, timeline: nextTimeline });
    toast.success(`Stage ${stage.toUpperCase()} marked as ${status}`);
  };

  const approveSettlement = () => {
    if (!exitState) return;
    const nextApprovals = { ...exitState.approvals, finance: 'approved' };
    const nextClearances = {
      ...exitState.clearances,
      fin_salary_clear: true,
      fin_leave_encash: true,
      fin_gratuity_settle: true
    };
    const nextTimeline = [
      ...exitState.timeline,
      { action: 'FINANCE_SETTLEMENT_APPROVED', user: 'Finance Lead', dept: 'Finance', date: new Date().toISOString() }
    ];
    saveExitState({
      ...exitState,
      approvals: nextApprovals,
      clearances: nextClearances,
      settlement: { ...settlementForm, paymentStatus: 'completed' },
      timeline: nextTimeline
    });
    setSettlementForm(prev => ({ ...prev, paymentStatus: 'completed' }));
    toast.success('Finance Department has verified and approved the salary details!');
  };

  // KT Module updates
  const handleUpdateKT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitState) return;
    const nextClearances = { ...exitState.clearances };
    if (exitState.ktProgress.ktCompletePercent >= 80) {
      nextClearances.manager_kt_complete = true;
    }
    
    const nextTimeline = [
      ...exitState.timeline,
      {
        action: `KT_PROGRESS_UPDATED: ${exitState.ktProgress.ktCompletePercent}%`,
        user: 'System Admin',
        dept: 'Manager',
        date: new Date().toISOString()
      }
    ];

    saveExitState({
      ...exitState,
      clearances: nextClearances,
      timeline: nextTimeline
    });
    toast.success('Knowledge Transfer metrics updated successfully!');
  };

  // Revoke SaaS Access
  const revokeAccess = (appId: string) => {
    if (!exitState) return;
    const nextAccess = {
      ...exitState.accessStatus,
      [appId]: exitState.accessStatus[appId] === 'disabled' ? 'active' : 'disabled'
    };
    const nextClearances = { ...exitState.clearances };
    if (appId === 'vpn') nextClearances.it_vpn_revoke = nextAccess.vpn === 'disabled';
    if (appId === 'google') nextClearances.it_email_revoke = nextAccess.google === 'disabled';

    const nextTimeline = [
      ...exitState.timeline,
      {
        action: `SaaS_ACCESS_REVOKED: ${appId.toUpperCase()}`,
        user: 'IT Administrator',
        dept: 'IT',
        date: new Date().toISOString()
      }
    ];

    saveExitState({
      ...exitState,
      accessStatus: nextAccess,
      clearances: nextClearances,
      timeline: nextTimeline
    });
    toast.success(`Access credentials revoked for ${appId.toUpperCase()}`);
  };

  // Save Interview
  const handleSaveInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitState) return;
    const nextClearances = { ...exitState.clearances, hr_exit_interview: true };
    const nextTimeline = [
      ...exitState.timeline,
      { action: 'EXIT_INTERVIEW_COMPLETED', user: 'System Admin', dept: 'HR', date: new Date().toISOString() }
    ];
    saveExitState({
      ...exitState,
      clearances: nextClearances,
      interview: interviewForm,
      timeline: nextTimeline
    });
    toast.success('Exit Interview feedback captured and verified!');
  };

  // Save Settlement
  const handleSaveSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitState) return;
    const nextApprovals = { ...exitState.approvals, finance: 'approved' };
    const nextClearances = {
      ...exitState.clearances,
      fin_salary_clear: true,
      fin_leave_encash: true,
      fin_gratuity_settle: true
    };
    const nextTimeline = [
      ...exitState.timeline,
      { action: 'FINANCE_SETTLEMENT_APPROVED', user: 'Finance Lead', dept: 'Finance', date: new Date().toISOString() }
    ];
    saveExitState({
      ...exitState,
      approvals: nextApprovals,
      clearances: nextClearances,
      settlement: { ...settlementForm, paymentStatus: 'completed' },
      timeline: nextTimeline
    });
    toast.success('Full & Final Settlement sheet locked and approved!');
  };

  // Add discussion note
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !exitState) return;
    const nextComments = [
      ...exitState.comments,
      {
        id: Math.random().toString(),
        user: 'System Admin',
        text: newComment,
        date: new Date().toISOString(),
        dept: 'HR',
        attachment: commentFile ? commentFile.name : undefined
      }
    ];
    saveExitState({ ...exitState, comments: nextComments });
    setNewComment('');
    setCommentFile(null);
    toast.success('Exit note submitted successfully!');
  };

  // Final Archiving workflow trigger
  const finalizeArchiveExit = () => {
    if (!exitState || !employee) return;
    const nextApprovals = {
      manager: 'approved',
      hr: 'approved',
      finance: 'approved',
      it: 'approved',
      admin: 'approved',
    };
    const nextTimeline = [
      ...exitState.timeline,
      { action: 'EMPLOYEE_ARCHIVED', user: 'System Admin', dept: 'HR', date: new Date().toISOString() }
    ];

    saveExitState({
      ...exitState,
      approvals: nextApprovals,
      workflowStage: 'archived',
      timeline: nextTimeline
    });

    toast.success(`🎉 ${employee.fullName} offboarding completed. Profile archived.`);
  };

  // Bulk Operations
  const handleBulkArchive = () => {
    if (selectedIds.length === 0) return toast.info('No exit profiles selected');
    selectedIds.forEach(id => {
      const key = `worksphere_offboarding_${id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.workflowStage = 'archived';
          localStorage.setItem(key, JSON.stringify(parsed));
        } catch {
          // Ignore
        }
      }
    });
    toast.success(`Bulk archived ${selectedIds.length} exit workspaces!`);
    setSelectedIds([]);
    fetchExits();
  };

  // Filters computed candidates
  const filteredStaff = staff.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || c.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !deptFilter || c.job.departmentName === deptFilter;
    const matchesStatus = !statusFilter || (statusFilter === 'archived' ? c.completion === 100 : c.completion < 100);
    return matchesSearch && matchesDept && matchesStatus;
  });

  const activeNoticeCount = staff.filter(c => c.completion < 100).length;
  const completedThisMonth = staff.filter(c => c.completion === 100).length;

  if (isLoading && !employeeId) {
    return (
      <PageContainer title="Offboarding Workspace" subtitle="Loading exits and clearance metrics...">
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-ag-ink-3">Loading exit transition profiles…</p>
        </div>
      </PageContainer>
    );
  }

  // ==========================================
  // VIEW B: EMPLOYEE EXIT WORKSPACE
  // ==========================================
  if (employeeId && employee && exitState) {
    const totalItems = Object.keys(exitState.clearances).length;
    const doneItems = Object.values(exitState.clearances).filter(Boolean).length;
    const progressPercent = Math.round((doneItems / totalItems) * 100);

    // Compute final settlement net payout
    const netPayout =
      Number(settlementForm.basicSalary) +
      Number(settlementForm.pendingSalary) +
      Number(settlementForm.leaveEncashment) +
      Number(settlementForm.bonus) +
      Number(settlementForm.gratuity) +
      Number(settlementForm.pf) -
      Number(settlementForm.deductions) -
      Number(settlementForm.recoveries);

    return (
      <PageContainer
        title="Employee Exit Workspace"
        subtitle={`Track clearances, KT notes, and final settlements for ${employee.fullName}.`}
        actions={
          <Link to="/offboarding">
            <Button variant="ghost" icon={<ArrowLeft size={16} />}>Back to Dashboard</Button>
          </Link>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          
          {/* Left Column Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border border-ag-border/80 sticky top-6">
              <div className="flex flex-col items-center text-center pb-5 border-b border-ag-border/70">
                <Avatar name={employee.fullName} src={employee.personal.photo} size="xl" />
                <h3 className="font-display font-black text-lg text-ag-ink mt-3">{employee.fullName}</h3>
                <span className="text-xs text-ag-ink-3 mt-1 font-semibold">{employee.job.designationName}</span>
                <span className="text-[10px] text-ag-accent-pink bg-ag-accent-pink-light/45 px-2.5 py-0.5 rounded-full font-bold uppercase mt-2 tracking-wider">
                  {employee.job.departmentName}
                </span>
              </div>

              {/* Exit Metadata */}
              <div className="py-5 border-b border-ag-border/70 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ag-ink-3">Exit Reason:</span>
                  <strong className="text-ag-ink">{interviewForm.reason}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ag-ink-3">Last Working Day:</span>
                  <strong className="text-ag-coral">{new Date(employee.official.dateOfJoining).toLocaleDateString('en-IN')}</strong>
                </div>
              </div>

              {/* Exit Completion Progress */}
              <div className="py-5 border-b border-ag-border/70 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-ag-ink-2 uppercase tracking-wide">Clearance Readiness</span>
                  <span className="font-black text-ag-primary">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-ag-surface-2 border border-ag-border rounded-full overflow-hidden">
                  <div className="h-full bg-ag-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {/* Approval Stages Tracker */}
              <div className="pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-ag-ink tracking-wider">Clearance Statuses</h4>
                <div className="space-y-3 pl-1">
                  {[
                    { id: 'manager', label: '1. Manager KT Check', status: exitState.approvals.manager },
                    { id: 'hr', label: '2. HR Exit Interview', status: exitState.approvals.hr },
                    { id: 'finance', label: '3. Finance Settlement', status: exitState.approvals.finance },
                    { id: 'it', label: '4. IT Access Revoke', status: exitState.approvals.it },
                    { id: 'admin', label: '5. Admin Keys Clear', status: exitState.approvals.admin }
                  ].map((stage) => {
                    const isApproved = stage.status === 'approved';
                    const isPending = stage.status === 'pending';
                    return (
                      <div key={stage.id} className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${isApproved ? 'text-ag-mint' : isPending ? 'text-ag-amber font-bold' : 'text-ag-ink-3'}`}>
                          {stage.label}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          isApproved
                            ? 'bg-[#E6FAF4] text-ag-mint'
                            : isPending
                              ? 'bg-[#FFF8E6] text-ag-amber'
                              : 'bg-ag-surface-2 text-ag-ink-3'
                        }`}>
                          {stage.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column Workspace Tabs */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto gap-1.5 p-1 bg-ag-surface-2 border border-ag-border rounded-xl w-fit shrink-0 scrollbar-none mb-2">
              {[
                { id: 'clearances', label: 'Clearance Center', icon: <ShieldCheck size={15} /> },
                { id: 'kt', label: 'Knowledge Transfer', icon: <Briefcase size={15} /> },
                { id: 'assets', label: 'Asset Return', icon: <Desktop size={15} /> },
                { id: 'revocation', label: 'Access Revoke', icon: <X size={15} /> },
                { id: 'settlement', label: 'F&F Settlement', icon: <CurrencyInr size={15} /> },
                { id: 'interview', label: 'Exit Interview', icon: <Chat size={15} /> },
                { id: 'documents', label: 'Exit Docs', icon: <FileText size={15} /> },
                { id: 'workflow', label: 'Workflow', icon: <Clock size={15} /> },
                { id: 'timeline', label: 'Timeline & Feed', icon: <Clock size={15} /> }
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

            {/* Tab panel Card */}
            <Card className="p-6 min-h-[480px]">

              {/* TAB 1: CLEARANCES */}
              {activeTab === 'clearances' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-black text-lg text-ag-ink">Department Clearances Checklist</h3>
                      <p className="text-xs text-ag-ink-3 mt-0.5">Mandatory statutory checklist before archiving exiting candidate profile.</p>
                    </div>
                    <span className="text-xs font-bold text-ag-primary bg-ag-primary-light/50 px-2.5 py-1 rounded">
                      {doneItems}/{totalItems} Cleared
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* HR clearances */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-ag-ink-2 tracking-wider flex items-center gap-1.5">
                        <User size={15} className="text-ag-primary" /> HR Clearances
                      </h4>
                      <div className="space-y-1.5">
                        {[
                          { key: 'hr_exit_interview', label: 'Conduct Exit Interview Feedback' },
                          { key: 'hr_experience_letter', label: 'Generate Experience Certificate' },
                          { key: 'hr_relieving_letter', label: 'Generate Relieving Letter' },
                          { key: 'hr_docs_verify', label: 'Acknowledge KYC Record Locks' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-2.5 p-2 hover:bg-ag-surface-2/45 rounded-lg cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!exitState.clearances[item.key]}
                              onChange={() => toggleClearance(item.key)}
                              className="rounded border-ag-border accent-ag-primary"
                            />
                            <span className={exitState.clearances[item.key] ? 'line-through text-ag-ink-3' : 'font-medium text-ag-ink'}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Finance Clearances */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-ag-ink-2 tracking-wider flex items-center gap-1.5">
                        <CurrencyInr size={15} className="text-ag-mint" /> Finance Clearances
                      </h4>
                      <div className="space-y-1.5">
                        {[
                          { key: 'fin_salary_clear', label: 'Clear Pending Monthly Salaries' },
                          { key: 'fin_leave_encash', label: 'Approve Earned Leave Encashment' },
                          { key: 'fin_gratuity_settle', label: 'Calculate Statutory Gratuity' },
                          { key: 'fin_pf_transfer', label: 'Verify Provident Fund UAN link' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-2.5 p-2 hover:bg-ag-surface-2/45 rounded-lg cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!exitState.clearances[item.key]}
                              onChange={() => toggleClearance(item.key)}
                              className="rounded border-ag-border accent-ag-primary"
                            />
                            <span className={exitState.clearances[item.key] ? 'line-through text-ag-ink-3' : 'font-medium text-ag-ink'}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* IT Clearances */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-ag-ink-2 tracking-wider flex items-center gap-1.5">
                        <Desktop size={15} className="text-ag-amber" /> IT Clearances
                      </h4>
                      <div className="space-y-1.5">
                        {[
                          { key: 'it_laptop_return', label: 'Verify Laptop Return' },
                          { key: 'it_monitor_return', label: 'Verify Monitor Display Return' },
                          { key: 'it_vpn_revoke', label: 'Revoke Corporate VPN keys' },
                          { key: 'it_email_revoke', label: 'Disable Google/M365 email access' },
                          { key: 'it_saas_revoke', label: 'Revoke GitHub/Slack permissions' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-2.5 p-2 hover:bg-ag-surface-2/45 rounded-lg cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!exitState.clearances[item.key]}
                              onChange={() => toggleClearance(item.key)}
                              className="rounded border-ag-border accent-ag-primary"
                            />
                            <span className={exitState.clearances[item.key] ? 'line-through text-ag-ink-3' : 'font-medium text-ag-ink'}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Admin / Manager Clearances */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-ag-ink-2 tracking-wider flex items-center gap-1.5">
                        <UsersThree size={15} className="text-purple-500" /> Manager & Admin Clearances
                      </h4>
                      <div className="space-y-1.5">
                        {[
                          { key: 'admin_office_keys', label: 'Return Physical Office Cabin Keys' },
                          { key: 'admin_locker_clear', label: 'Empty Corporate Locker & Parking pass' },
                          { key: 'manager_kt_complete', label: 'Acknowledge KT Process Completion' },
                          { key: 'manager_handover', label: 'Deliver client/project handovers' },
                          { key: 'manager_replacement', label: 'Train replacement assigned resource' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-2.5 p-2 hover:bg-ag-surface-2/45 rounded-lg cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!exitState.clearances[item.key]}
                              onChange={() => toggleClearance(item.key)}
                              className="rounded border-ag-border accent-ag-primary"
                            />
                            <span className={exitState.clearances[item.key] ? 'line-through text-ag-ink-3' : 'font-medium text-ag-ink'}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KNOWLEDGE TRANSFER */}
              {activeTab === 'kt' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">Knowledge Transfer (KT) Progress</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Verify project documentation, repository handovers, and replacement training.</p>
                  </div>

                  <form onSubmit={handleUpdateKT} className="space-y-4 pt-2">
                    <Select
                      label="Assigned Replacement Buddy"
                      options={[
                        { value: 'Ananya Sen', label: 'Ananya Sen (Software Engineer)' },
                        { value: 'Rahul Tiwari', label: 'Rahul Tiwari (Product Manager)' },
                        { value: 'Shikhar Srivastava', label: 'Shikhar Srivastava (Lead)' }
                      ]}
                      value={exitState.ktProgress.replacementAssigned}
                      onChange={e => setExitState({
                        ...exitState,
                        ktProgress: { ...exitState.ktProgress, replacementAssigned: e.target.value }
                      })}
                    />

                    <div>
                      <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block mb-1.5">KT Completion Rate</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          className="w-full h-1.5 bg-ag-surface-2 rounded-full accent-ag-primary outline-none"
                          value={exitState.ktProgress.ktCompletePercent}
                          onChange={e => setExitState({
                            ...exitState,
                            ktProgress: { ...exitState.ktProgress, ktCompletePercent: Number(e.target.value) }
                          })}
                        />
                        <span className="text-xs font-bold text-ag-primary shrink-0 w-8">{exitState.ktProgress.ktCompletePercent}%</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="ag-label">Knowledge Handover Notes</label>
                      <textarea
                        className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:ring-1 focus:ring-ag-primary"
                        rows={3}
                        value={exitState.ktProgress.ktNotes}
                        onChange={e => setExitState({
                          ...exitState,
                          ktProgress: { ...exitState.ktProgress, ktNotes: e.target.value }
                        })}
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button type="submit">Update KT Progress</Button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: ASSET RETURN */}
              {activeTab === 'assets' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">Asset Return Center</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Verify and confirm return details of allocated corporate physical hardware.</p>
                  </div>

                  <div className="border border-ag-border rounded-xl overflow-hidden pt-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-ag-surface-2 text-ag-ink-3 font-black uppercase text-[10px] border-b border-ag-border">
                          <th className="p-3">Asset</th>
                          <th className="p-3">Serial Number</th>
                          <th className="p-3">Returned Status</th>
                          <th className="p-3">Returned Date</th>
                          <th className="p-3 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: 'it_laptop_return', type: 'Laptop', model: 'MacBook Pro M3 Max 16"', serial: 'SN-784013' },
                          { key: 'it_monitor_return', type: 'Monitor', model: 'Dell UltraSharp 27"', serial: 'SN-402941' },
                          { key: 'admin_office_keys', type: 'Office Key', model: 'Cabin NFC Access Card', serial: 'KEY-002' }
                        ].map((item) => {
                          const isReturned = !!exitState.clearances[item.key];
                          return (
                            <tr key={item.key} className="border-b border-ag-border hover:bg-ag-surface-2/20">
                              <td className="p-3">
                                <span className="font-bold text-ag-ink block">{item.type}</span>
                                <span className="text-[10px] text-ag-ink-3">{item.model}</span>
                              </td>
                              <td className="p-3 font-mono text-ag-ink-3">{item.serial}</td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isReturned ? 'bg-[#E6FAF4] text-ag-mint' : 'bg-[#FFF8E6] text-ag-amber'}`}>
                                  {isReturned ? 'Returned' : 'Pending'}
                                </span>
                              </td>
                              <td className="p-3 text-ag-ink-3">{isReturned ? new Date().toLocaleDateString() : '—'}</td>
                              <td className="p-3 text-right">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => toggleClearance(item.key)}
                                  className="text-xs"
                                >
                                  {isReturned ? 'Revert' : 'Mark Returned'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: ACCESS REVOCATION */}
              {activeTab === 'revocation' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">SaaS Access Revocations</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Revoke directory logins, database accesses, and communication channels.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {[
                      { id: 'erp', label: 'WorkSphere ERP access', desc: 'HRMS profile and administrative dashboard login.' },
                      { id: 'google', label: 'Google Workspace / M365 Mailbox', desc: 'Disable mailbox, calendars, and file accesses.' },
                      { id: 'slack', label: 'Slack Workspace Profile', desc: 'Revoke corporate Slack chat logins.' },
                      { id: 'jira', label: 'Jira Software & repositories', desc: 'Remove from GitHub organization and sprint boards.' },
                      { id: 'vpn', label: 'Corporate Secure VPN Key', desc: 'Block staging networks and local database access.' }
                    ].map((app) => {
                      const isDisabled = exitState.accessStatus[app.id] === 'disabled';
                      return (
                        <div key={app.id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between bg-ag-surface-2/15 hover:border-ag-border-strong transition-all gap-4">
                          <div>
                            <h4 className="text-xs font-black text-ag-ink">{app.label}</h4>
                            <p className="text-[10px] text-ag-ink-3 mt-0.5">{app.desc}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${isDisabled ? 'bg-ag-coral-light/20 text-ag-coral' : 'bg-[#E6FAF4] text-ag-mint'}`}>
                              {isDisabled ? 'Disabled' : 'Active'}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => revokeAccess(app.id)}
                              className="text-xs font-semibold"
                            >
                              {isDisabled ? 'Restore' : 'Revoke'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: FINAL SETTLEMENT */}
              {activeTab === 'settlement' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-black text-lg text-ag-ink">Full & Final (F&F) Settlement</h3>
                      <p className="text-xs text-ag-ink-3 mt-0.5">Statutory payment settlement configurations and payroll balances.</p>
                    </div>
                    {settlementForm.paymentStatus === 'completed' ? (
                      <span className="text-xs font-bold text-ag-mint bg-[#E6FAF4] px-2.5 py-1 rounded flex items-center gap-1">
                        <CheckCircle size={14} /> Settlement Payout Disbursed
                      </span>
                    ) : (
                      <Button size="sm" onClick={approveSettlement} className="bg-ag-mint hover:bg-opacity-95 text-white border-transparent">
                        Approve & Pay Settlement
                      </Button>
                    )}
                  </div>

                  <form onSubmit={handleSaveSettlement} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Input
                        label="Monthly Basic Salary (INR)"
                        type="number"
                        value={settlementForm.basicSalary}
                        onChange={e => setSettlementForm({ ...settlementForm, basicSalary: Number(e.target.value) })}
                      />
                      <Input
                        label="Pending Salary payout (INR)"
                        type="number"
                        value={settlementForm.pendingSalary}
                        onChange={e => setSettlementForm({ ...settlementForm, pendingSalary: Number(e.target.value) })}
                      />
                      <Input
                        label="Earned Leave Encashment (INR)"
                        type="number"
                        value={settlementForm.leaveEncashment}
                        onChange={e => setSettlementForm({ ...settlementForm, leaveEncashment: Number(e.target.value) })}
                      />
                      <Input
                        label="Bonus / Incentives (INR)"
                        type="number"
                        value={settlementForm.bonus}
                        onChange={e => setSettlementForm({ ...settlementForm, bonus: Number(e.target.value) })}
                      />
                      <Input
                        label="Calculated Gratuity (INR)"
                        type="number"
                        value={settlementForm.gratuity}
                        onChange={e => setSettlementForm({ ...settlementForm, gratuity: Number(e.target.value) })}
                      />
                      <Input
                        label="PF Settlement Transfer (INR)"
                        type="number"
                        value={settlementForm.pf}
                        onChange={e => setSettlementForm({ ...settlementForm, pf: Number(e.target.value) })}
                      />
                      <Input
                        label="Deductions / Damage Slabs (INR)"
                        type="number"
                        value={settlementForm.deductions}
                        onChange={e => setSettlementForm({ ...settlementForm, deductions: Number(e.target.value) })}
                      />
                      <Input
                        label="Notice Recovery Slabs (INR)"
                        type="number"
                        value={settlementForm.recoveries}
                        onChange={e => setSettlementForm({ ...settlementForm, recoveries: Number(e.target.value) })}
                      />
                    </div>

                    <div className="p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl flex justify-between items-center text-xs mt-4">
                      <div>
                        <span className="text-ag-ink-3 uppercase font-black block tracking-wider">Total Net Settlement Payout</span>
                        <span className="text-ag-ink-3 mt-1 block">Formula: Sum(Earnings) - Sum(Deductions)</span>
                      </div>
                      <strong className="text-xl font-display font-black text-ag-primary">
                        ₹{netPayout.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button type="submit">Lock Calculations</Button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 6: EXIT INTERVIEW */}
              {activeTab === 'interview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">Exit Interview Feedback</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Capture reasons for leaving, candidate suggestions, and HR interview summaries.</p>
                  </div>

                  <form onSubmit={handleSaveInterview} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Primary Reason for Leaving"
                        options={[
                          { value: 'Career Growth', label: 'Better Career Opportunity / CTC Growth' },
                          { value: 'Higher Education', label: 'Pursuing Higher Studies' },
                          { value: 'Personal Commitments', label: 'Personal / Family commitments' },
                          { value: 'Work Stress', label: 'Health concerns / Work-life balance' }
                        ]}
                        value={interviewForm.reason}
                        onChange={e => setInterviewForm({ ...interviewForm, reason: e.target.value })}
                      />
                      <Select
                        label="Company Recommendation"
                        options={[
                          { value: 'yes', label: 'Yes, would recommend to friends' },
                          { value: 'no', label: 'No, would not recommend' }
                        ]}
                        value={interviewForm.recommend}
                        onChange={e => setInterviewForm({ ...interviewForm, recommend: e.target.value })}
                      />
                      <Select
                        label="Rejoin company in future?"
                        options={[
                          { value: 'yes', label: 'Yes, would rejoin' },
                          { value: 'no', label: 'No, would not prefer rejoining' }
                        ]}
                        value={interviewForm.rejoin}
                        onChange={e => setInterviewForm({ ...interviewForm, rejoin: e.target.value })}
                      />
                      <Select
                        label="Company Rating (1-5)"
                        options={[
                          { value: '5', label: '5 Stars (Excellent)' },
                          { value: '4', label: '4 Stars (Good)' },
                          { value: '3', label: '3 Stars (Average)' },
                          { value: '2', label: '2 Stars (Poor)' }
                        ]}
                        value={interviewForm.rating}
                        onChange={e => setInterviewForm({ ...interviewForm, rating: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="ag-label">Employee Feedback & Suggestions</label>
                      <textarea
                        className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:ring-1 focus:ring-ag-primary"
                        rows={3}
                        value={interviewForm.feedback}
                        onChange={e => setInterviewForm({ ...interviewForm, feedback: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="ag-label">HR Representative Notes (Private)</label>
                      <textarea
                        className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:ring-1 focus:ring-ag-primary"
                        rows={3}
                        placeholder="Private HR audit comments..."
                        value={interviewForm.notes}
                        onChange={e => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button type="submit">Submit Feedback Form</Button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 7: EXIT DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">Generated Exit Documents</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Download or regenerate standard exit documents for the employee file.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {[
                      { id: 'relieving', label: 'Relieving Letter', desc: 'Official document confirming relief from company services.' },
                      { id: 'experience', label: 'Experience Certificate', desc: 'Details tenure history, designation and performance remarks.' },
                      { id: 'settlement', label: 'F&F Settlement Slip', desc: 'Consolidated spreadsheet payout document signed by Finance.' },
                      { id: 'clearance', label: 'Clearance Certificate', desc: 'Confirms zero outstanding balances across all departments.' }
                    ].map((doc) => {
                      return (
                        <div key={doc.id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between bg-ag-surface-2/15 hover:border-ag-border-strong transition-all gap-4">
                          <div>
                            <h4 className="text-xs font-black text-ag-ink">{doc.label}</h4>
                            <p className="text-[10px] text-ag-ink-3 mt-0.5">{doc.desc}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<FileArrowDown size={15} />}
                            onClick={() => {
                              toast.success(`Downloading ${doc.label}...`);
                            }}
                            className="text-xs shrink-0"
                          >
                            Download
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 8: WORKFLOW */}
              {activeTab === 'workflow' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-black text-lg text-ag-ink">Approval Workflow Matrix</h3>
                      <p className="text-xs text-ag-ink-3 mt-0.5">Exiting clearances approvals track across departments.</p>
                    </div>
                    {progressPercent === 100 && exitState.workflowStage !== 'archived' && (
                      <Button size="sm" onClick={finalizeArchiveExit} icon={<Archive size={14} />}>
                        Finalize & Archive Profile
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { id: 'manager', label: 'Reporting Manager Approval', desc: 'Accepts KT process and project handovers.' },
                      { id: 'hr', label: 'HR Clearance Stage', desc: 'Validates exit interview, BGV checks, and relieving slips.' },
                      { id: 'finance', label: 'Finance Settlement Stage', desc: 'Verifies F&F calculations and statutory payout transfers.' },
                      { id: 'it', label: 'IT Deprovisioning Stage', desc: 'Confirms returned hardware devices and revoked logins.' },
                      { id: 'admin', label: 'Admin Key Clearance Stage', desc: 'Validates returned lockers and cabin access card keys.' }
                    ].map((stage) => {
                      const isApproved = exitState.approvals[stage.id] === 'approved';
                      return (
                        <div key={stage.id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between bg-ag-surface-2/15 hover:border-ag-border-strong transition-all gap-4">
                          <div>
                            <h4 className="text-xs font-black text-ag-ink">{stage.label}</h4>
                            <p className="text-[10px] text-ag-ink-3 mt-0.5">{stage.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isApproved ? (
                              <span className="text-[10px] font-bold text-ag-mint bg-[#E6FAF4] px-2.5 py-1 rounded flex items-center gap-1">
                                <CheckCircle size={14} /> Approved
                              </span>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => setApprovalStageStatus(stage.id, 'approved')}
                                  className="bg-ag-mint hover:bg-opacity-95 text-white border-transparent text-[11px]"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setApprovalStageStatus(stage.id, 'rejected')}
                                  className="text-[11px]"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 9: TIMELINE & CHAT */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">Timeline & Discussions</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Chronological platform logging events and inter-department chat threads.</p>
                  </div>

                  <form onSubmit={handleAddComment} className="flex flex-col gap-3 pt-2">
                    <textarea
                      placeholder="Add an internal note or handoff comment..."
                      className="w-full p-3 border border-ag-border bg-ag-surface text-sm text-ag-ink rounded-xl focus:outline-none focus:ring-1 focus:ring-ag-primary"
                      rows={3}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      required
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="exit-file"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) setCommentFile(file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('exit-file')?.click()}
                          className="flex items-center gap-1.5 text-xs text-ag-primary font-bold hover:underline"
                        >
                          <Paperclip size={15} /> {commentFile ? commentFile.name : 'Attach File'}
                        </button>
                      </div>
                      <Button type="submit" size="sm">
                        Submit Note
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-4 pt-4 border-t border-ag-border mt-4">
                    {/* Combine timeline and comments sorted by date */}
                    {[
                      ...exitState.timeline.map((t: any) => ({ ...t, isTimeline: true })),
                      ...exitState.comments.map((c: any) => ({ ...c, isComment: true }))
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item: any, idx: number) => {
                      if (item.isTimeline) {
                        return (
                          <div key={idx} className="flex items-center gap-3 text-xs pl-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-ag-primary shrink-0" />
                            <div>
                              <span className="font-mono text-[10px] text-ag-primary bg-ag-primary-light px-1 py-0.5 rounded mr-2">{item.action}</span>
                              <span className="text-ag-ink-3">by {item.user} ({item.dept}) at {new Date(item.date).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="p-4 border border-ag-border rounded-xl bg-ag-surface-2/10 relative">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-xs text-ag-ink">{item.user} ({item.dept})</span>
                            <span className="text-[10px] text-ag-ink-3">{new Date(item.date).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-ag-ink-2 whitespace-pre-wrap">{item.text}</p>
                          {item.attachment && (
                            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-ag-primary bg-ag-primary-light/30 w-fit px-2 py-0.5 rounded">
                              <Paperclip size={12} /> {item.attachment}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </Card>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ==========================================
  // VIEW A: OFFBOARDING EXECUTIVE DASHBOARD
  // ==========================================
  return (
    <PageContainer
      title="Exit & Offboarding Workspace"
      subtitle="Supervise notice periods, asset clearances, final settlements and exit analytics."
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchExits} icon={<ArrowsClockwise size={18} />}>Refresh</Button>
        </div>
      }
    >
      {/* Executive KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-4 flex items-center gap-4 border border-ag-border/70 bg-white">
          <div className="p-3 rounded-lg bg-ag-accent-pink-light text-ag-accent-pink shrink-0">
            <Warning size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-black uppercase tracking-wider">Notice Period</p>
            <p className="text-xl font-black text-ag-ink mt-0.5">{activeNoticeCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-ag-border/70 bg-white">
          <div className="p-3 rounded-lg bg-[#E6FAF4] text-ag-mint shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-black uppercase tracking-wider">Settled Month</p>
            <p className="text-xl font-black text-ag-ink mt-0.5">{completedThisMonth}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-ag-border/70 bg-white">
          <div className="p-3 rounded-lg bg-[#FFF8E6] text-ag-amber shrink-0">
            <Desktop size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-black uppercase tracking-wider">Pending IT returns</p>
            <p className="text-xl font-black text-ag-ink mt-0.5">
              {staff.filter(c => c.completion < 100).length * 2}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-ag-border/70 bg-white">
          <div className="p-3 rounded-lg bg-[#E8F6FF] text-[#0077B6] shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-black uppercase tracking-wider">Attrition Rate</p>
            <p className="text-xl font-black text-ag-ink mt-0.5">1.8%</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Candidates Ledger List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Active Exit Cases"
              subtitle={`${filteredStaff.length} employees currently in transition notice periods.`}
            />

            {/* Filter Panel */}
            <div className="px-5 pb-4 border-b border-ag-border flex flex-wrap gap-3">
              <Input
                placeholder="Search exiting staff..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="max-w-xs h-9 text-xs"
              />
              <Select
                options={[
                  { value: '', label: 'All Departments' },
                  { value: 'Engineering', label: 'Engineering' },
                  { value: 'HR', label: 'HR' },
                  { value: 'Finance', label: 'Finance' }
                ]}
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="max-w-[160px] h-9 text-xs"
              />
              <Select
                options={[
                  { value: '', label: 'All Stages' },
                  { value: 'active', label: 'Clearance Active' },
                  { value: 'archived', label: 'Archived / Settled' }
                ]}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="max-w-[160px] h-9 text-xs"
              />
            </div>

            {/* Bulk Actions Header */}
            {selectedIds.length > 0 && (
              <div className="px-5 py-2.5 bg-ag-accent-pink-light/35 flex items-center justify-between border-b border-ag-border">
                <span className="text-xs text-ag-ink-2 font-bold">{selectedIds.length} exit profile(s) selected</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBulkArchive} className="text-xs px-3 py-1 font-bold">Bulk Archive</Button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-2.5 p-4 max-h-[500px] overflow-y-auto pr-2">
              {filteredStaff.map((emp) => {
                const isChecked = selectedIds.includes(emp.employeeId);
                return (
                  <div key={emp.employeeId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-ag-border/60 rounded-xl hover:border-ag-border-strong transition-all gap-4 bg-white relative">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedIds(prev =>
                            isChecked ? prev.filter(id => id !== emp.employeeId) : [...prev, emp.employeeId]
                          );
                        }}
                        className="rounded border-ag-border accent-ag-primary h-4 w-4"
                      />
                      <Avatar name={emp.fullName} src={emp.personal.photo} size="md" />
                      <div>
                        <h4 className="font-black text-ag-ink text-sm flex items-center gap-2">
                          {emp.fullName}
                          {emp.completion === 100 && (
                            <CheckCircle size={14} className="text-ag-mint fill-current" />
                          )}
                        </h4>
                        <p className="text-xs text-ag-ink-3">
                          {emp.job.designationName} · {emp.job.departmentName}
                        </p>
                        
                        {/* Inline progress bar */}
                        <div className="flex items-center gap-2 mt-2 w-48">
                          <div className="h-1.5 w-full bg-ag-surface-2 border border-ag-border rounded-full overflow-hidden">
                            <div className="h-full bg-ag-primary transition-all duration-300" style={{ width: `${emp.completion}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-ag-ink-3">{emp.completion}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-ag-accent-pink-light text-ag-accent-pink uppercase">
                        {emp.official.status === 'notice_period' ? 'Notice Period' : 'Inactive'}
                      </span>
                      <Link to={`/offboarding/${emp.employeeId}`}>
                        <Button size="sm" variant="secondary" className="text-xs font-semibold">
                          Open Workspace
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {filteredStaff.length === 0 && (
                <div className="p-12 text-center text-ag-ink-3">
                  <CheckCircle size={40} className="mx-auto text-ag-mint mb-3" />
                  <p className="font-bold text-ag-ink">Roster is empty</p>
                  <p className="text-xs mt-1">No active exit cases match selected criteria.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Dashboard Sidebar */}
        <div className="space-y-6">
          
          {/* Exit reasons analytics */}
          <Card className="p-5">
            <CardHeader title="Exit Slabs Distribution" subtitle="Distribution chart by leaving reason." />
            <div className="space-y-3 mt-4">
              {EXIT_REASONS.map((reason, idx) => {
                const total = EXIT_REASONS.reduce((acc, r) => acc + r.count, 0);
                const percent = Math.round((reason.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-ag-ink-2 text-[11px] truncate max-w-[190px]">{reason.reason}</span>
                      <span className="text-ag-ink-3 shrink-0">{reason.count} ({percent}%)</span>
                    </div>
                    <div className="h-1 w-full bg-ag-surface-2 rounded-full overflow-hidden">
                      <div className="h-full bg-ag-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* IT revoke checklist reminder */}
          <Card className="bg-[#FFF8E6] border border-ag-amber/30 p-5">
            <div className="flex gap-3">
              <Warning size={20} className="text-ag-amber shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-ag-ink text-xs">Security Revocation Warning</h4>
                <p className="text-[11px] text-ag-ink-3 mt-1.5">
                  Disable corporate emails, Active Directory logins, Slack Workspace and staging VPN profiles on the Last Working Day (LWD) to prevent leakage.
                </p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </PageContainer>
  );
}

