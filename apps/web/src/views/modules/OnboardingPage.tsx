import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useMatch, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Modal } from '@/components/ui/Modal/Modal';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { employeeService, onboardingService, auditService } from '@/services/api.service';
import { EmployeeListItem } from '@/types/employee.types';
import {
  Plus, ArrowsClockwise, CheckCircle, Warning, User, Briefcase, FileText,
  CurrencyInr, Desktop, ShieldCheck, Heartbeat, UsersThree, Calendar, Clock,
  ArrowLeft, Trash, UploadSimple, Chat, Paperclip, Check, X, Sparkle, Info
} from '@phosphor-icons/react';
import { toast } from 'sonner';


export default function OnboardingPage() {
  const navigate = useNavigate();
  const match = useMatch('/onboarding/:id');
  const employeeId = match?.params.id;

  // Global State
  const [candidates, setCandidates] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Workspace Employee Detail States
  const [employee, setEmployee] = useState<any>(null);
  const [wsState, setWsState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'checklist' | 'documents' | 'payroll' | 'assets' | 'access' | 'manager' | 'orientation' | 'workflow' | 'comments'>('checklist');

  // New Comment input
  const [newComment, setNewComment] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);

  // Asset allocation dialog
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({ type: 'laptop', name: 'Dell Latitude 5440', serial: '' });

  // Document preview dialog
  const [previewDoc, setPreviewDoc] = useState<{ type: string; name: string } | null>(null);

  // Fetch candidates/employees list
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await employeeService.list({ limit: 100 });
      // Onboarding Candidates: anyone joined in the last 90 days or status is probation
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const list = res.employees.filter((e: any) => {
        const joined = new Date(e.official.dateOfJoining);
        return (joined >= ninetyDaysAgo && e.official.status === 'active') || e.official.status === 'on_leave' || (e.official.employeeType as string) === 'probation';
      }).map((e: any) => {
        // Retrieve local checklist state to calculate actual completion percentage
        const local = localStorage.getItem(`worksphere_onboarding_${e.employeeId}`);
        let completion = 40; // Default fallback
        if (local) {
          try {
            const parsed = JSON.parse(local);
            const totalItems = Object.keys(parsed.checklist).length;
            const doneItems = Object.values(parsed.checklist).filter(Boolean).length;
            completion = Math.round((doneItems / totalItems) * 100);
          } catch {
            // Ignore
          }
        }
        return { ...e, completion };
      });
      setCandidates(list);

      // Fetch real activities from audit logs
      try {
        const auditData = await auditService.getLogs({ limit: 5 });
        setActivities(auditData.logs ?? []);
      } catch {
        // Ignore fallback
      }

      // If active workspace employeeId is loaded, set details
      if (employeeId) {
        const target = list.find((e: any) => e.employeeId === employeeId);
        if (target) {
          setEmployee(target);
          loadWorkspaceState(target.employeeId);
        } else {
          // Attempt direct fetch
          try {
            const empData = await employeeService.getById(employeeId);
            setEmployee(empData);
            loadWorkspaceState(empData.employeeId);
          } catch {
            toast.error('Onboarding record not found');
            navigate('/onboarding');
          }
        }
      }
    } catch {
      toast.error('Failed to load candidate roster');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, navigate]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Load and merge local onboarding configuration states
  const loadWorkspaceState = (empId: string) => {
    const key = `worksphere_onboarding_${empId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setWsState(JSON.parse(saved));
      } catch {
        initializeWorkspaceState(empId);
      }
    } else {
      initializeWorkspaceState(empId);
    }
  };

  const initializeWorkspaceState = (empId: string) => {
    const defaultState = {
      checklist: {
        'offer_letter': true,
        'employee_profile': true,
        'emergency_contact': false,
        'photo': true,
        'documents_verification': false,
        'bank_details': true,
        'salary_structure': false,
        'tax_info': false,
        'pf_link': false,
        'esic_link': false,
        'laptop_assign': false,
        'monitor_assign': false,
        'email_provision': false,
        'vpn_provision': false,
        'erp_provision': false,
        'buddy_match': true,
        'goal_setting': false,
        'id_card': false,
        'leave_policy_ack': false,
        'nda_sign': false,
      },
      approvals: {
        hr: 'pending',
        finance: 'pending',
        it: 'pending',
        manager: 'pending',
        admin: 'pending',
      },
      systemAccess: {
        m365: 'inactive',
        google: 'inactive',
        slack: 'active',
        jira: 'inactive',
        vpn: 'inactive',
        erp: 'active',
      },
      timeline: [
        { action: 'EMPLOYEE_CREATED', user: 'System Admin', dept: 'HR', date: new Date().toISOString() }
      ],
      comments: [
        { id: '1', user: 'Amit Verma', text: 'Biography records verified. Waiting for candidate bank details verification.', date: new Date(Date.now() - 3600000).toISOString(), dept: 'HR' }
      ]
    };
    localStorage.setItem(`worksphere_onboarding_${empId}`, JSON.stringify(defaultState));
    setWsState(defaultState);
  };

  const saveWorkspaceState = (updated: typeof wsState) => {
    if (!employee) return;
    localStorage.setItem(`worksphere_onboarding_${employee.employeeId}`, JSON.stringify(updated));
    setWsState(updated);
    // Recalculate percentage for target employee in cached list
    setCandidates(prev => prev.map(c => {
      if (c.employeeId === employee.employeeId) {
        const totalItems = Object.keys(updated.checklist).length;
        const doneItems = Object.values(updated.checklist).filter(Boolean).length;
        return { ...c, completion: Math.round((doneItems / totalItems) * 100) };
      }
      return c;
    }));
  };

  // Toggle checklist checkbox
  const toggleChecklistItem = (key: string) => {
    if (!wsState) return;
    const nextChecklist = { ...wsState.checklist, [key]: !wsState.checklist[key] };
    
    // Automatically trigger specific approvals if relevant checklists are cleared
    const nextApprovals = { ...wsState.approvals };
    if (key === 'documents_verification' && nextChecklist[key]) {
      nextApprovals.hr = 'approved';
      toast.success('HR Onboarding checklist approved!');
    }

    const nextTimeline = [
      ...wsState.timeline,
      {
        action: `CHECKLIST_TOGGLED: ${key.toUpperCase().replace('_', ' ')} (${nextChecklist[key] ? 'DONE' : 'PENDING'})`,
        user: 'System Admin',
        dept: 'HR',
        date: new Date().toISOString()
      }
    ];

    saveWorkspaceState({
      ...wsState,
      checklist: nextChecklist,
      approvals: nextApprovals,
      timeline: nextTimeline
    });
  };

  // Document actions
  const setDocumentStatus = (docType: string, status: 'approved' | 'rejected') => {
    if (!employee || !wsState) return;
    const updatedDocs = (employee.documents || []).map((doc: any) => {
      if (doc.documentType === docType) return { ...doc, status };
      return doc;
    });

    // Save in main employee object
    setEmployee((prev: any) => ({ ...prev, documents: updatedDocs }));

    const nextTimeline = [
      ...wsState.timeline,
      {
        action: `DOCUMENT_${status.toUpperCase()}: ${docType.toUpperCase()}`,
        user: 'System Admin',
        dept: 'HR',
        date: new Date().toISOString()
      }
    ];
    saveWorkspaceState({ ...wsState, timeline: nextTimeline });
    toast.success(`Document ${docType.toUpperCase()} marked as ${status}`);
  };

  // Upload document
  const handleUploadDocument = (docType: string, fileName: string) => {
    if (!employee || !wsState) return;
    const nextDocs = [
      ...(employee.documents || []).filter((d: any) => d.documentType !== docType),
      { documentType: docType, fileName, fileSize: 102400, status: 'pending' }
    ];
    setEmployee((prev: any) => ({ ...prev, documents: nextDocs }));

    const nextTimeline = [
      ...wsState.timeline,
      {
        action: `DOCUMENT_UPLOADED: ${docType.toUpperCase()}`,
        user: 'System Admin',
        dept: 'HR',
        date: new Date().toISOString()
      }
    ];
    saveWorkspaceState({ ...wsState, timeline: nextTimeline });
    toast.success(`Document ${docType.toUpperCase()} uploaded.`);
  };

  // Payroll approval
  const approvePayroll = () => {
    if (!wsState) return;
    const nextApprovals = { ...wsState.approvals, finance: 'approved' };
    const nextChecklist = { ...wsState.checklist, bank_details: true, salary_structure: true, tax_info: true };
    const nextTimeline = [
      ...wsState.timeline,
      { action: 'FINANCE_PAYROLL_APPROVED', user: 'Finance Lead', dept: 'Finance', date: new Date().toISOString() }
    ];
    saveWorkspaceState({ ...wsState, approvals: nextApprovals, checklist: nextChecklist, timeline: nextTimeline });
    toast.success('Finance Department has verified and approved the salary details!');
  };

  // IT Asset allocation
  const allocateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !wsState || !newAsset.name.trim()) return;
    const nextAssets = [
      ...(employee.assets || []),
      {
        assetType: newAsset.type,
        assetName: newAsset.name,
        serialNumber: newAsset.serial || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
        assignedDate: new Date().toISOString().split('T')[0]
      }
    ];
    setEmployee((prev: any) => ({ ...prev, assets: nextAssets }));

    const nextChecklist = { ...wsState.checklist };
    if (newAsset.type === 'laptop') nextChecklist.laptop_assign = true;
    if (newAsset.type === 'monitor') nextChecklist.monitor_assign = true;

    // Check if both laptop and access card are assigned, auto-approve IT stage
    const nextApprovals = { ...wsState.approvals };
    if (nextChecklist.laptop_assign) {
      nextApprovals.it = 'approved';
    }

    const nextTimeline = [
      ...wsState.timeline,
      {
        action: `IT_ASSET_ALLOCATED: ${newAsset.name} (${newAsset.serial})`,
        user: 'IT Administrator',
        dept: 'IT',
        date: new Date().toISOString()
      }
    ];

    saveWorkspaceState({
      ...wsState,
      checklist: nextChecklist,
      approvals: nextApprovals,
      timeline: nextTimeline
    });

    setIsAssetModalOpen(false);
    setNewAsset({ type: 'laptop', name: 'Dell Latitude 5440', serial: '' });
    toast.success('Asset allocated successfully!');
  };

  // Toggle SaaS application status
  const toggleSaaS = (appId: string) => {
    if (!wsState) return;
    const nextAccess = {
      ...wsState.systemAccess,
      [appId]: wsState.systemAccess[appId] === 'active' ? 'inactive' : 'active'
    };
    const nextChecklist = { ...wsState.checklist };
    if (appId === 'm365') nextChecklist.email_provision = nextAccess.m365 === 'active';
    if (appId === 'vpn') nextChecklist.vpn_provision = nextAccess.vpn === 'active';
    if (appId === 'erp') nextChecklist.erp_provision = nextAccess.erp === 'active';

    const nextTimeline = [
      ...wsState.timeline,
      {
        action: `SAAS_ACCESS_CHANGED: ${appId.toUpperCase()} (${nextAccess[appId]})`,
        user: 'IT Support',
        dept: 'IT',
        date: new Date().toISOString()
      }
    ];

    saveWorkspaceState({
      ...wsState,
      systemAccess: nextAccess,
      checklist: nextChecklist,
      timeline: nextTimeline
    });
    toast.info(`Provisioning changed for ${appId.toUpperCase()}`);
  };

  // Add workspace comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !wsState) return;
    const nextComments = [
      ...wsState.comments,
      {
        id: Math.random().toString(),
        user: 'System Admin',
        text: newComment,
        date: new Date().toISOString(),
        dept: 'HR',
        attachment: commentFile ? commentFile.name : undefined
      }
    ];
    saveWorkspaceState({ ...wsState, comments: nextComments });
    setNewComment('');
    setCommentFile(null);
    toast.success('Note added to timeline');
  };

  // Orientation acknowledgment
  const toggleOrientationItem = (key: string) => {
    if (!wsState) return;
    const nextChecklist = { ...wsState.checklist, [key]: !wsState.checklist[key] };
    const nextTimeline = [
      ...wsState.timeline,
      {
        action: `ORIENTATION_ACK: ${key.toUpperCase().replace('_', ' ')}`,
        user: 'System Admin',
        dept: 'HR',
        date: new Date().toISOString()
      }
    ];
    saveWorkspaceState({ ...wsState, checklist: nextChecklist, timeline: nextTimeline });
  };

  // Workflow stages approvals
  const setApprovalStageStatus = (stage: string, status: string) => {
    if (!wsState) return;
    const nextApprovals = { ...wsState.approvals, [stage]: status };
    const nextTimeline = [
      ...wsState.timeline,
      {
        action: `WORKFLOW_STAGE_UPDATE: ${stage.toUpperCase()} is ${status.toUpperCase()}`,
        user: 'System Admin',
        dept: 'HR',
        date: new Date().toISOString()
      }
    ];
    saveWorkspaceState({ ...wsState, approvals: nextApprovals, timeline: nextTimeline });
    toast.success(`Stage ${stage.toUpperCase()} marked as ${status}`);
  };

  // Final Onboarding Complete Trigger
  const finalizeOnboarding = () => {
    if (!wsState || !employee) return;
    const nextApprovals = {
      hr: 'approved',
      finance: 'approved',
      it: 'approved',
      manager: 'approved',
      admin: 'approved',
    };
    const nextTimeline = [
      ...wsState.timeline,
      { action: 'ONBOARDING_COMPLETED', user: 'System Admin', dept: 'HR', date: new Date().toISOString() }
    ];
    saveWorkspaceState({ ...wsState, approvals: nextApprovals, timeline: nextTimeline });
    toast.success(`🎉 Onboarding fully completed for ${employee.fullName}!`);
  };

  // Bulk Operations
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return toast.info('No employees selected');
    selectedIds.forEach(id => {
      const key = `worksphere_onboarding_${id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.approvals = {
            hr: 'approved',
            finance: 'approved',
            it: 'approved',
            manager: 'approved',
            admin: 'approved',
          };
          localStorage.setItem(key, JSON.stringify(parsed));
        } catch {
          // Ignore
        }
      }
    });
    toast.success(`Bulk approved ${selectedIds.length} candidate workspaces!`);
    setSelectedIds([]);
    fetchCandidates();
  };

  const handleBulkEmail = () => {
    if (selectedIds.length === 0) return toast.info('No employees selected');
    toast.success(`Sent welcome letters and invitations to ${selectedIds.length} joiners!`);
    setSelectedIds([]);
  };

  // Filters computed candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || c.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !deptFilter || c.job.departmentName === deptFilter;
    const matchesStatus = !statusFilter || (statusFilter === 'completed' ? c.completion === 100 : c.completion < 100);
    return matchesSearch && matchesDept && matchesStatus;
  });

  const activeOnboardingCount = candidates.filter(c => c.completion < 100).length;
  const completedThisMonth = candidates.filter(c => c.completion === 100).length;

  // Render Loading state
  if (isLoading && !employeeId) {
    return (
      <PageContainer title="Onboarding Workspace" subtitle="Loading metrics and candidates...">
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-ag-ink-3">Loading onboarding configurations…</p>
        </div>
      </PageContainer>
    );
  }

  // ==========================================
  // VIEW B: EMPLOYEE ONBOARDING WORKSPACE
  // ==========================================
  if (employeeId && employee && wsState) {
    const totalItems = Object.keys(wsState.checklist).length;
    const doneItems = Object.values(wsState.checklist).filter(Boolean).length;
    const progressPercent = Math.round((doneItems / totalItems) * 100);

    return (
      <PageContainer
        title="Employee Onboarding Workspace"
        subtitle={`Track checklists, documents, provisioning, and readiness for ${employee.fullName}.`}
        actions={
          <Link to="/onboarding">
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
                <span className="text-[10px] text-ag-primary bg-ag-primary-light/45 px-2.5 py-0.5 rounded-full font-bold uppercase mt-2 tracking-wider">
                  {employee.job.departmentName}
                </span>
              </div>

              {/* Completion Progress meter */}
              <div className="py-5 border-b border-ag-border/70 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-ag-ink-2 uppercase tracking-wide">Workspace Readiness</span>
                  <span className="font-black text-ag-primary">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-ag-surface-2 border border-ag-border rounded-full overflow-hidden">
                  <div className="h-full bg-ag-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-ag-ink-3">
                  <span>Joined: {new Date(employee.official.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <span>Est: {progressPercent === 100 ? 'Ready' : '2 days left'}</span>
                </div>
              </div>

              {/* Approval Workflow Stage Tracker */}
              <div className="pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-ag-ink tracking-wider">Approval Stages</h4>
                <div className="space-y-3 pl-1">
                  {[
                    { id: 'hr', label: '1. HR Verification', status: wsState.approvals.hr },
                    { id: 'finance', label: '2. Finance Payroll', status: wsState.approvals.finance },
                    { id: 'it', label: '3. IT Provisioning', status: wsState.approvals.it },
                    { id: 'manager', label: '4. Manager Orientation', status: wsState.approvals.manager },
                    { id: 'admin', label: '5. Admin Signoff', status: wsState.approvals.admin }
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
            
            {/* Tabs Nav */}
            <div className="flex overflow-x-auto gap-1.5 p-1 bg-ag-surface-2 border border-ag-border rounded-xl w-fit shrink-0 scrollbar-none mb-2">
              {[
                { id: 'checklist', label: 'Checklist', icon: <CheckCircle size={15} /> },
                { id: 'documents', label: 'KYC Docs', icon: <FileText size={15} /> },
                { id: 'payroll', label: 'Payroll Setups', icon: <CurrencyInr size={15} /> },
                { id: 'assets', label: 'Hardware Assets', icon: <Desktop size={15} /> },
                { id: 'access', label: 'Access SaaS', icon: <ShieldCheck size={15} /> },
                { id: 'manager', label: 'Line Setup', icon: <UsersThree size={15} /> },
                { id: 'orientation', label: 'Orientation', icon: <Calendar size={15} /> },
                { id: 'workflow', label: 'Workflow', icon: <Clock size={15} /> },
                { id: 'comments', label: 'Discussion', icon: <Chat size={15} /> }
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

            {/* Tab content panel */}
            <Card className="p-6 min-h-[480px]">

              {/* TAB 1: CHECKLIST */}
              {activeTab === 'checklist' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-black text-lg text-ag-ink">Dynamic Onboarding Checklist</h3>
                      <p className="text-xs text-ag-ink-3 mt-0.5">Statutory department checklists configuring this employee's readiness.</p>
                    </div>
                    <span className="text-xs font-bold text-ag-primary bg-ag-primary-light/50 px-2.5 py-1 rounded">
                      {doneItems}/{totalItems} Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* HR Group */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-ag-ink-2 tracking-wider flex items-center gap-1.5">
                        <User size={15} className="text-ag-primary" /> HR Checklist Group
                      </h4>
                      <div className="space-y-1.5">
                        {[
                          { key: 'offer_letter', label: 'Acknowledge Offer Letter' },
                          { key: 'employee_profile', label: 'Create Employee Profile' },
                          { key: 'emergency_contact', label: 'Add Emergency Contacts' },
                          { key: 'photo', label: 'Upload Profile Photo' },
                          { key: 'documents_verification', label: 'Verify Documents & BGV' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-2.5 p-2 hover:bg-ag-surface-2/45 rounded-lg cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!wsState.checklist[item.key]}
                              onChange={() => toggleChecklistItem(item.key)}
                              className="rounded border-ag-border accent-ag-primary"
                            />
                            <span className={wsState.checklist[item.key] ? 'line-through text-ag-ink-3' : 'font-medium text-ag-ink'}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Finance Group */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-ag-ink-2 tracking-wider flex items-center gap-1.5">
                        <CurrencyInr size={15} className="text-ag-mint" /> Finance Checklist Group
                      </h4>
                      <div className="space-y-1.5">
                        {[
                          { key: 'bank_details', label: 'Configure Bank Account' },
                          { key: 'salary_structure', label: 'Approve Salary Structure' },
                          { key: 'tax_info', label: 'Define Tax Regime Slabs' },
                          { key: 'pf_link', label: 'Link Provident Fund (UAN)' },
                          { key: 'esic_link', label: 'ESIC Card Link' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-2.5 p-2 hover:bg-ag-surface-2/45 rounded-lg cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!wsState.checklist[item.key]}
                              onChange={() => toggleChecklistItem(item.key)}
                              className="rounded border-ag-border accent-ag-primary"
                            />
                            <span className={wsState.checklist[item.key] ? 'line-through text-ag-ink-3' : 'font-medium text-ag-ink'}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* IT Group */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-ag-ink-2 tracking-wider flex items-center gap-1.5">
                        <Desktop size={15} className="text-ag-amber" /> IT Checklist Group
                      </h4>
                      <div className="space-y-1.5">
                        {[
                          { key: 'laptop_assign', label: 'Allocate Laptop Device' },
                          { key: 'monitor_assign', label: 'Allocate Monitor Display' },
                          { key: 'email_provision', label: 'Provision Corporate Email' },
                          { key: 'vpn_provision', label: 'Provision VPN Access' },
                          { key: 'erp_provision', label: 'Provision WorkSphere Account' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-2.5 p-2 hover:bg-ag-surface-2/45 rounded-lg cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!wsState.checklist[item.key]}
                              onChange={() => toggleChecklistItem(item.key)}
                              className="rounded border-ag-border accent-ag-primary"
                            />
                            <span className={wsState.checklist[item.key] ? 'line-through text-ag-ink-3' : 'font-medium text-ag-ink'}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Admin / Manager Group */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-ag-ink-2 tracking-wider flex items-center gap-1.5">
                        <UsersThree size={15} className="text-purple-500" /> Manager & Admin Group
                      </h4>
                      <div className="space-y-1.5">
                        {[
                          { key: 'buddy_match', label: 'Assign Mentor Buddy' },
                          { key: 'goal_setting', label: 'Define 30-60-90 Days Goals' },
                          { key: 'id_card', label: 'Print Physical Access ID Card' },
                          { key: 'leave_policy_ack', label: 'Brief Leave & Shift Policies' },
                          { key: 'nda_sign', label: 'Sign NDA Agreement' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-2.5 p-2 hover:bg-ag-surface-2/45 rounded-lg cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!wsState.checklist[item.key]}
                              onChange={() => toggleChecklistItem(item.key)}
                              className="rounded border-ag-border accent-ag-primary"
                            />
                            <span className={wsState.checklist[item.key] ? 'line-through text-ag-ink-3' : 'font-medium text-ag-ink'}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">KYC & Document Attachments</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Upload, preview, verify, or reject candidate identification records.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {['aadhaar', 'pan', 'resume', 'offer_letter', 'passport', 'employment_contract'].map((docType) => {
                      const doc = (employee.documents || []).find((d: any) => d.documentType === docType);
                      return (
                        <div key={docType} className="flex items-center justify-between p-4 border border-ag-border rounded-xl bg-ag-surface-2/15 hover:bg-ag-surface-2/30 transition-all gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-ag-primary-light/50 text-ag-primary shrink-0">
                              <FileText size={18} />
                            </div>
                            <div>
                              <h4 className="text-xs uppercase font-bold text-ag-ink-2 tracking-wider">{docType.replace('_', ' ')}</h4>
                              {doc ? (
                                <p className="text-[10px] text-ag-ink-3 mt-0.5 truncate max-w-[220px]">{doc.fileName}</p>
                              ) : (
                                <p className="text-[10px] text-ag-coral font-semibold mt-0.5">Missing document file</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {doc ? (
                              <>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                  doc.status === 'approved'
                                    ? 'bg-[#E6FAF4] text-ag-mint'
                                    : doc.status === 'rejected'
                                      ? 'bg-ag-coral-light/20 text-ag-coral'
                                      : 'bg-[#FFF8E6] text-ag-amber'
                                }`}>
                                  {doc.status}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setPreviewDoc({ type: docType, name: doc.fileName })}
                                  className="text-xs"
                                >
                                  Preview
                                </Button>
                                <button
                                  onClick={() => setDocumentStatus(docType, 'approved')}
                                  className="p-1 hover:bg-ag-mint/10 text-ag-mint rounded transition-colors"
                                  title="Verify Doc"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => setDocumentStatus(docType, 'rejected')}
                                  className="p-1 hover:bg-ag-coral/10 text-ag-coral rounded transition-colors"
                                  title="Reject Doc"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <div>
                                <input
                                  type="file"
                                  id={`ws-file-${docType}`}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadDocument(docType, file.name);
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  icon={<UploadSimple size={14} />}
                                  onClick={() => document.getElementById(`ws-file-${docType}`)?.click()}
                                  className="text-xs"
                                >
                                  Upload File
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: PAYROLL SETUP */}
              {activeTab === 'payroll' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-black text-lg text-ag-ink">Bank & Compensation Structure</h3>
                      <p className="text-xs text-ag-ink-3 mt-0.5">Salary breakdowns, bank account verification, and tax regimes.</p>
                    </div>
                    {wsState.approvals.finance === 'approved' ? (
                      <span className="text-xs font-bold text-ag-mint bg-[#E6FAF4] px-2.5 py-1 rounded flex items-center gap-1">
                        <CheckCircle size={14} /> Approved by Finance
                      </span>
                    ) : (
                      <Button size="sm" onClick={approvePayroll} className="bg-ag-mint hover:bg-opacity-90 border-transparent text-white">
                        Verify & Approve Structure
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="p-4 border border-ag-border rounded-xl space-y-4">
                      <h4 className="text-xs font-black uppercase text-ag-ink tracking-wider border-b border-ag-border pb-1.5">Salary CTC Breakdown</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-ag-ink-3">Annual Package (CTC):</span>
                          <strong className="text-ag-ink">₹{Number(employee.payroll?.ctc || 600000).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ag-ink-3">Basic Component (40%):</span>
                          <strong className="text-ag-ink">₹{Number((employee.payroll?.ctc || 600000) * 0.4).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ag-ink-3">Special Allowances:</span>
                          <strong className="text-ag-ink">₹{Number((employee.payroll?.ctc || 600000) * 0.5).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ag-ink-3">PF Deduct status:</span>
                          <strong className="text-ag-ink">{employee.payroll?.pfEnabled ? 'Enabled' : 'Disabled'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-ag-border rounded-xl space-y-4">
                      <h4 className="text-xs font-black uppercase text-ag-ink tracking-wider border-b border-ag-border pb-1.5">Bank Registry Details</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-ag-ink-3">Bank Name:</span>
                          <strong className="text-ag-ink">{employee.payroll?.bankName || '—'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ag-ink-3">Account Number:</span>
                          <strong className="text-ag-ink">{employee.payroll?.accountNumber || '—'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ag-ink-3">IFSC Routing Code:</span>
                          <strong className="text-ag-ink">{employee.payroll?.ifsc || '—'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ag-ink-3">Tax Regime Preference:</span>
                          <strong className="text-ag-ink uppercase">{employee.payroll?.taxRegime || 'New Regime'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: IT ASSETS */}
              {activeTab === 'assets' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-black text-lg text-ag-ink">IT Asset Allocations</h3>
                      <p className="text-xs text-ag-ink-3 mt-0.5">Assigned physical inventory, laptops, monitors, and cards.</p>
                    </div>
                    <Button size="sm" onClick={() => setIsAssetModalOpen(true)} icon={<Plus size={14} />}>
                      Allocate Asset
                    </Button>
                  </div>

                  <div className="border border-ag-border rounded-xl overflow-hidden pt-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-ag-surface-2 text-ag-ink-3 font-black uppercase text-[10px] border-b border-ag-border">
                          <th className="p-3">Asset Type</th>
                          <th className="p-3">Model Name</th>
                          <th className="p-3">Serial Number</th>
                          <th className="p-3">Date Assigned</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(employee.assets || []).map((asset: any, idx: number) => (
                          <tr key={idx} className="border-b border-ag-border hover:bg-ag-surface-2/20">
                            <td className="p-3 font-bold text-ag-ink uppercase">{asset.assetType}</td>
                            <td className="p-3 text-ag-ink-2">{asset.assetName}</td>
                            <td className="p-3 font-mono text-ag-ink-3">{asset.serialNumber}</td>
                            <td className="p-3 text-ag-ink-3">{asset.assignedDate}</td>
                            <td className="p-3 text-right">
                              <span className="text-[10px] font-bold text-ag-mint bg-[#E6FAF4] px-2 py-0.5 rounded">
                                Assigned
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(employee.assets || []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-ag-ink-3">
                              No physical hardware assets allocated yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: SYSTEM ACCESS */}
              {activeTab === 'access' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">Software & Systems Accounts</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Provision Active Directory accounts, Google Workspace, Slack, Jira, and VPNs.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {[
                      { id: 'm365', label: 'Microsoft 365 Account', desc: 'Exchange mailbox, SharePoint, Teams.' },
                      { id: 'google', label: 'Google Workspace Profile', desc: 'Gmail, Google Drive and document permissions.' },
                      { id: 'slack', label: 'Slack Workspace Sign-on', desc: 'Direct corporate chat and messaging channels.' },
                      { id: 'jira', label: 'Jira Software & Confluence', desc: 'Sprint board, code documents and task trackers.' },
                      { id: 'vpn', label: 'Corporate Secure VPN', desc: 'Access private staging databases and internal files.' },
                      { id: 'erp', label: 'WorkSphere ERP login', desc: 'Direct access to HRMS portals and workflows.' }
                    ].map((app) => {
                      const isActive = wsState.systemAccess[app.id] === 'active';
                      return (
                        <div key={app.id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between bg-ag-surface-2/15 hover:border-ag-border-strong transition-all gap-4">
                          <div>
                            <h4 className="text-xs font-black text-ag-ink">{app.label}</h4>
                            <p className="text-[10px] text-ag-ink-3 mt-0.5">{app.desc}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${isActive ? 'bg-[#E6FAF4] text-ag-mint' : 'bg-ag-surface-2 text-ag-ink-3'}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => toggleSaaS(app.id)}
                              className="text-xs font-semibold"
                            >
                              {isActive ? 'Revoke' : 'Provision'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: MANAGER SETUP */}
              {activeTab === 'manager' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">Supervision & Reporting Setup</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Define reporting structure hierarchy, assigned buddies, location and probation terms.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Designated Department"
                      value={employee.job.departmentName}
                      disabled
                    />
                    <Input
                      label="Designated Designation"
                      value={employee.job.designationName}
                      disabled
                    />
                    <Input
                      label="Reporting Supervisor"
                      value={employee.org?.reportingManager || 'Priya Sharma (Engineering Lead)'}
                      disabled
                    />
                    <Input
                      label="Onboarding Mentor Buddy"
                      value={employee.org?.buddy || 'Rohan Gupta (Product Engineer)'}
                      disabled
                    />
                    <Input
                      label="Joining Date"
                      value={new Date(employee.official.dateOfJoining).toLocaleDateString('en-IN')}
                      disabled
                    />
                    <Input
                      label="Daily Shift Structure"
                      value={employee.org?.shift || 'General Shift (9:00 AM - 6:00 PM)'}
                      disabled
                    />
                    <Input
                      label="Work Location Office"
                      value={employee.org?.workLocation || 'Bengaluru HQ'}
                      disabled
                    />
                    <Input
                      label="Probation Evaluation Frame"
                      value={`${employee.org?.probationMonths || 6} months`}
                      disabled
                    />
                  </div>
                </div>
              )}

              {/* TAB 7: ORIENTATION */}
              {activeTab === 'orientation' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">Orientation briefings & Company Policies</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Mandatory statutory briefings, policy signing, and onboarding session dates.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { key: 'leave_policy_ack', label: 'Brief Employee Handbook & Leave Policies', desc: 'Introduce company holiday slates and check-in times.' },
                      { key: 'nda_sign', label: 'Sign Non-Disclosure Agreement (NDA)', desc: 'Configure confidentiality parameters and document signs.' }
                    ].map((policy) => {
                      const isChecked = !!wsState.checklist[policy.key];
                      return (
                        <div
                          key={policy.key}
                          onClick={() => toggleOrientationItem(policy.key)}
                          className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isChecked ? 'border-ag-mint bg-[#E6FAF4]/15' : 'border-ag-border hover:bg-ag-surface-2/40'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-black text-ag-ink">{policy.label}</h4>
                            <p className="text-[10px] text-ag-ink-3 mt-0.5">{policy.desc}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-ag-border accent-ag-primary h-4 w-4"
                          />
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
                      <p className="text-xs text-ag-ink-3 mt-0.5">Departmental checklist approval status track.</p>
                    </div>
                    {progressPercent === 100 && (
                      <Button size="sm" onClick={finalizeOnboarding} icon={<Sparkle size={14} />}>
                        Finalize & Complete Onboarding
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { id: 'hr', label: 'HR Verification Stage', desc: 'Validates bio data, KYC, BGV, and contract docs.' },
                      { id: 'finance', label: 'Finance Payroll Stage', desc: 'Validates compensation CTC bands and bank setup.' },
                      { id: 'it', label: 'IT Provisioning Stage', desc: 'Validates hardware asset assignments and credentials.' },
                      { id: 'manager', label: 'Manager Setup Stage', desc: 'Validates reporting managers, buddies, and probation.' },
                      { id: 'admin', label: 'Admin Signoff Stage', desc: 'Final company executive validation and checklist lock.' }
                    ].map((stage) => {
                      const isApproved = wsState.approvals[stage.id] === 'approved';
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

              {/* TAB 9: COMMENTS DISCUSSION */}
              {activeTab === 'comments' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-ag-ink">Discussion & Collaborations</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Leave notes, instructions, handover files, and communicate across departments.</p>
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
                          id="comment-file"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) setCommentFile(file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('comment-file')?.click()}
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
                    {wsState.comments.map((comment: any) => (
                      <div key={comment.id} className="p-4 border border-ag-border rounded-xl bg-ag-surface-2/10 relative">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-xs text-ag-ink">{comment.user} ({comment.dept})</span>
                          <span className="text-[10px] text-ag-ink-3">{new Date(comment.date).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-ag-ink-2 whitespace-pre-wrap">{comment.text}</p>
                        {comment.attachment && (
                          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-ag-primary bg-ag-primary-light/30 w-fit px-2 py-0.5 rounded">
                            <Paperclip size={12} /> {comment.attachment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </Card>
          </div>
        </div>

        {/* Allocate Asset modal */}
        <Modal
          isOpen={isAssetModalOpen}
          onClose={() => setIsAssetModalOpen(false)}
          title="Allocate IT Hardware Asset"
          description="Assign physical equipment models to the employee profile."
        >
          <form onSubmit={allocateAsset} className="space-y-4 pt-2">
            <Select
              label="Asset Category"
              options={[
                { value: 'laptop', label: 'Laptop / PC Computer' },
                { value: 'monitor', label: 'Monitor Display' },
                { value: 'sim', label: 'Jio SIM Card' },
                { value: 'access_card', label: 'Physical Security Key Card' }
              ]}
              value={newAsset.type}
              onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}
              required
            />
            <Input
              label="Asset / Model Name"
              value={newAsset.name}
              onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
              placeholder="e.g. MacBook Pro M3 16"
              required
            />
            <Input
              label="Serial Number (S/N)"
              value={newAsset.serial}
              onChange={e => setNewAsset({ ...newAsset, serial: e.target.value })}
              placeholder="e.g. C02GL404Q05F"
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-ag-border mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsAssetModalOpen(false)}>Cancel</Button>
              <Button type="submit">Allocate Device</Button>
            </div>
          </form>
        </Modal>

        {/* Document Preview Modal */}
        {previewDoc && (
          <Modal
            isOpen={true}
            onClose={() => setPreviewDoc(null)}
            title={`Document Preview: ${previewDoc.type.toUpperCase().replace('_', ' ')}`}
            description="Verified digital verification scanner view."
          >
            <div className="p-8 border border-dashed border-ag-border rounded-xl bg-ag-surface-2/40 text-center flex flex-col items-center justify-center min-h-[300px]">
              <FileText size={48} className="text-ag-primary-strong mb-4" />
              <h4 className="font-bold text-sm text-ag-ink">{previewDoc.name}</h4>
              <p className="text-[11px] text-ag-ink-3 mt-1">Mock uploaded PDF profile verification</p>

              {previewDoc.type === 'pan' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-700 to-teal-600 text-white rounded-xl w-72 text-left font-mono shadow">
                  <span className="text-[9px] uppercase tracking-widest font-black block opacity-85">Income Tax Department (GOVT OF INDIA)</span>
                  <strong className="text-xs tracking-wider block mt-3 uppercase">{employee.fullName}</strong>
                  <span className="text-[10px] block opacity-75 mt-0.5">DOB: {new Date(employee.personal?.dateOfBirth || '1995-01-01').toLocaleDateString()}</span>
                  <strong className="text-sm block mt-4 uppercase tracking-widest">{employee.personal?.pan || 'ABCDE1234F'}</strong>
                </div>
              )}

              {previewDoc.type === 'aadhaar' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-xl w-72 text-left font-mono shadow">
                  <span className="text-[9px] uppercase tracking-widest font-black block opacity-85 font-sans">Unique Identification Authority of India</span>
                  <strong className="text-xs tracking-wider block mt-3 uppercase font-sans">{employee.fullName}</strong>
                  <span className="text-[9px] block opacity-75 mt-0.5">MALE / FEMALE</span>
                  <strong className="text-sm text-center block mt-5 tracking-widest">{employee.personal?.aadhaar || '1234 5678 9012'}</strong>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t border-ag-border mt-6">
              <Button onClick={() => setPreviewDoc(null)}>Close Preview</Button>
            </div>
          </Modal>
        )}

      </PageContainer>
    );
  }

  // ==========================================
  // VIEW A: ONBOARDING EXECUTIVE DASHBOARD
  // ==========================================
  return (
    <PageContainer
      title="Onboarding Dashboard"
      subtitle="Track checklists, approvals, and employee readiness for recent recruits and candidates."
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchCandidates} icon={<ArrowsClockwise size={18} />}>Refresh</Button>
          <Button icon={<Plus size={18} />} onClick={() => navigate('/onboarding/new')}>Initialize Workspace</Button>
        </div>
      }
    >
      {/* Executive KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-4 flex items-center gap-4 border border-ag-border/70 bg-white">
          <div className="p-3 rounded-lg bg-ag-primary-light text-ag-primary shrink-0">
            <ArrowsClockwise size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-black uppercase tracking-wider">Active Workspace</p>
            <p className="text-xl font-black text-ag-ink mt-0.5">{activeOnboardingCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-ag-border/70 bg-white">
          <div className="p-3 rounded-lg bg-[#E6FAF4] text-ag-mint shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-black uppercase tracking-wider">Onboarded Month</p>
            <p className="text-xl font-black text-ag-ink mt-0.5">{completedThisMonth}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-ag-border/70 bg-white">
          <div className="p-3 rounded-lg bg-[#FFF8E6] text-ag-amber shrink-0">
            <Desktop size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-black uppercase tracking-wider">Pending IT Allocation</p>
            <p className="text-xl font-black text-ag-ink mt-0.5">
              {candidates.filter(c => c.completion < 100 && c.job.workMode !== 'remote').length}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-ag-border/70 bg-white">
          <div className="p-3 rounded-lg bg-[#E8F6FF] text-[#0077B6] shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-black uppercase tracking-wider">Statutory Completion</p>
            <p className="text-xl font-black text-ag-ink mt-0.5">
              {candidates.length > 0
                ? `${Math.round(candidates.reduce((acc, c) => acc + c.completion, 0) / candidates.length)}%`
                : '100%'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Candidates Ledger List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Recent Joinee workspaces"
              subtitle={`${filteredCandidates.length} employees found in onboarding workflow stage.`}
            />

            {/* Filter Panel */}
            <div className="px-5 pb-4 border-b border-ag-border flex flex-wrap gap-3">
              <Input
                placeholder="Search candidates..."
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
                  { value: 'onboarding', label: 'Onboarding active' },
                  { value: 'completed', label: 'Completed' }
                ]}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="max-w-[160px] h-9 text-xs"
              />
            </div>

            {/* Bulk Actions Header */}
            {selectedIds.length > 0 && (
              <div className="px-5 py-2.5 bg-ag-primary-light/35 flex items-center justify-between border-b border-ag-border">
                <span className="text-xs text-ag-ink-2 font-bold">{selectedIds.length} candidate(s) selected</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBulkApprove} className="text-xs px-3 py-1 font-bold">Bulk Approve</Button>
                  <Button size="sm" variant="secondary" onClick={handleBulkEmail} className="text-xs px-3 py-1 font-bold">Bulk Welcome Mail</Button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-2.5 p-4 max-h-[500px] overflow-y-auto pr-2">
              {filteredCandidates.map((emp) => {
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
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-ag-primary-light text-ag-primary uppercase">
                        {emp.job.workMode}
                      </span>
                      <Link to={`/onboarding/${emp.employeeId}`}>
                        <Button size="sm" variant="secondary" className="text-xs font-semibold">
                          View Workspace
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {filteredCandidates.length === 0 && (
                <div className="p-12 text-center text-ag-ink-3">
                  <CheckCircle size={40} className="mx-auto text-ag-mint mb-3" />
                  <p className="font-bold text-ag-ink">Roster is empty</p>
                  <p className="text-xs mt-1">No candidate profile fits the filters.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Dashboard Sidebar */}
        <div className="space-y-6">
          
          {/* Global Onboarding Feed */}
          <Card className="p-5">
            <CardHeader title="Live Activity Stream" subtitle="Chronological platform logging events." />
            <div className="space-y-4 mt-4">
              {activities.map((act: any) => (
                <div key={act.id} className="flex gap-3 text-xs">
                  <div className="p-1.5 rounded-lg bg-ag-primary-light text-ag-primary shrink-0 w-7 h-7 flex items-center justify-center font-bold font-mono">
                    {act.action ? act.action[0] : 'S'}
                  </div>
                  <div>
                    <p className="text-ag-ink-2">
                      <strong className="font-bold">{act.email || 'System'}</strong> performed <span className="font-mono text-ag-primary bg-ag-primary-light px-1 py-0.5 rounded text-[10px]">{act.action}</span>
                    </p>
                    <p className="text-ag-ink-3 text-[10px] mt-0.5">{act.details}</p>
                    <span className="text-[9px] text-ag-ink-3 flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {new Date(act.created_at || act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-6 text-ag-ink-3 text-xs">
                  No system events recorded.
                </div>
              )}
            </div>
          </Card>

          {/* Quick instructions widget */}
          <Card className="bg-[#FFF8E6] border border-ag-amber/30 p-5">
            <div className="flex gap-3">
              <Warning size={20} className="text-ag-amber shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-ag-ink text-xs">Statutory Compliance Alert</h4>
                <p className="text-[11px] text-ag-ink-3 mt-1.5">
                  Background Verification (BGV) clearance and document checks are mandatory. Lock HR checklists before setting up active monthly payroll files.
                </p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </PageContainer>
  );
}
