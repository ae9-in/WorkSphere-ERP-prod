import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { api } from '@/services/api.service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Briefcase, Users, Calendar, FileText, RotateCw,
  Plus, Check, X, ArrowRight, Trophy, Clock, ShieldCheck, BarChart3, MapPin, Video, Filter
} from 'lucide-react';

async function recruitmentApi(method: 'get' | 'post', path: string, data?: any) {
  const res = await (method === 'get'
    ? api.get(`/recruitment${path}`)
    : api.post(`/recruitment${path}`, data));
  return res.data.data;
}

const PIPELINE_STAGES = [
  { key: 'applied',             label: 'Applied',            color: 'bg-blue-500', widthClass: 'w-full' },
  { key: 'screening',           label: 'Screening',          color: 'bg-purple-500', widthClass: 'w-[85%]' },
  { key: 'assessment',          label: 'Assessment',         color: 'bg-yellow-500', widthClass: 'w-[70%]' },
  { key: 'technical_interview', label: 'Technical',          color: 'bg-orange-500', widthClass: 'w-[55%]' },
  { key: 'hr_interview',        label: 'HR Interview',       color: 'bg-pink-500', widthClass: 'w-[40%]' },
  { key: 'selected',            label: 'Selected',           color: 'bg-teal-500', widthClass: 'w-[30%]' },
  { key: 'offer',               label: 'Offer',              color: 'bg-indigo-500', widthClass: 'w-[20%]' },
  { key: 'onboarding',          label: 'Onboarding',         color: 'bg-cyan-500', widthClass: 'w-[15%]' },
  { key: 'hired',               label: 'Hired / Joined',     color: 'bg-green-600', widthClass: 'w-[10%]' },
];

const NEXT_STAGE: Record<string, string> = {
  applied: 'screening', screening: 'assessment', assessment: 'technical_interview',
  technical_interview: 'hr_interview', hr_interview: 'selected', selected: 'offer',
  offer: 'onboarding', onboarding: 'hired',
};

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'hiringPlans' | 'candidates' | 'interviews' | 'offers' | 'bgv' | 'analytics'>('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  
  // Candidates search & filters
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterMinAts, setFilterMinAts] = useState('');
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [hiringPlans, setHiringPlans] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Forms Visibility
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);

  // Form states: Job
  const [jobTitle, setJobTitle] = useState('');
  const [jobDept, setJobDept] = useState('Engineering');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('full_time');
  const [jobExp, setJobExp] = useState('2');
  const [jobSkills, setJobSkills] = useState('');
  const [jobQualifications, setJobQualifications] = useState('');
  const [jobResponsibilities, setJobResponsibilities] = useState('');
  const [jobBenefits, setJobBenefits] = useState('');
  const [jobDeadline, setJobDeadline] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  // Form states: Candidate
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candAddress, setCandAddress] = useState('');
  const [candCurrentCo, setCandCurrentCo] = useState('');
  const [candExpectedCtc, setCandExpectedCtc] = useState('');
  const [candSource, setCandSource] = useState('career_portal');
  const [candResumeText, setCandResumeText] = useState('');

  // Form states: Interview
  const [intCandId, setIntCandId] = useState('');
  const [intTitle, setIntTitle] = useState('Technical Round 1');
  const [intType, setIntType] = useState('technical');
  const [intDateTime, setIntDateTime] = useState('');

  // Form states: Offer
  const [offerCandId, setOfferCandId] = useState('');
  const [offerTitle, setOfferTitle] = useState('');
  const [offerEmploymentType, setOfferEmploymentType] = useState('full_time');
  const [offerCtc, setOfferCtc] = useState('');
  const [offerFixed, setOfferFixed] = useState('');
  const [offerBonus, setOfferBonus] = useState('0');
  const [offerProbation, setOfferProbation] = useState('90');
  const [offerJoining, setOfferJoining] = useState('');

  // Form states: Hiring Plan
  const [planDept, setPlanDept] = useState('Engineering');
  const [planBranch, setPlanBranch] = useState('HQ');
  const [planTeam, setPlanTeam] = useState('Platform');
  const [planTitle, setPlanTitle] = useState('');
  const [planCount, setPlanCount] = useState('1');
  const [planBudget, setPlanBudget] = useState('');
  const [planQuarter, setPlanQuarter] = useState('Q3-2026');
  const [planTimeline, setPlanTimeline] = useState('Immediate');
  const [planJustification, setPlanJustification] = useState('');
  const [planPriority, setPlanPriority] = useState('medium');

  // Form states: HRMS Conversion
  const [selectedCandId, setSelectedCandId] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empDesg, setEmpDesg] = useState('Software Engineer');

  // Requisitions
  const [requisitions, setRequisitions] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      let searchParams = `?page=${searchPage}&pageSize=30`;
      if (searchQuery) searchParams += `&q=${encodeURIComponent(searchQuery)}`;
      if (filterStatus) searchParams += `&status=${filterStatus}`;
      if (filterSource) searchParams += `&source=${filterSource}`;
      if (filterMinAts) searchParams += `&minAtsScore=${filterMinAts}`;

      const [dash, jobsData, searchRes, intData, offersData, reqsData, plansData, analyticsRes] = await Promise.all([
        recruitmentApi('get', '/dashboard'),
        recruitmentApi('get', '/jobs'),
        api.get(`/recruitment/candidates/search${searchParams}`),
        recruitmentApi('get', '/interviews'),
        recruitmentApi('get', '/offers'),
        recruitmentApi('get', '/requisitions'),
        recruitmentApi('get', '/hiring-plans'),
        recruitmentApi('get', '/analytics'),
      ]);

      setDashboard(dash);
      setJobs(jobsData);
      setCandidates(searchRes.data.data.candidates);
      setSearchTotalPages(searchRes.data.data.totalPages || 1);
      setInterviews(intData);
      setOffers(offersData);
      setRequisitions(reqsData);
      setHiringPlans(plansData);
      setAnalytics(analyticsRes);
    } catch {
      toast.error('Failed to load recruitment data');
    } finally {
      setIsLoading(false);
    }
  }, [searchPage, searchQuery, filterStatus, filterSource, filterMinAts]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobLocation || !jobSkills) { toast.error('Fill in all required fields.'); return; }
    
    let reqId = requisitions[0]?.id;
    if (!reqId) {
      const newReq = await recruitmentApi('post', '/requisitions', {
        title: jobTitle, departmentName: jobDept, openPositions: 1, budget: 0
      });
      await recruitmentApi('post', `/requisitions/${newReq.id}/approve`, { status: 'approved' });
      reqId = newReq.id;
    }
    await recruitmentApi('post', '/jobs', {
      requisitionId: reqId, title: jobTitle, departmentName: jobDept,
      location: jobLocation, employmentType: jobType, experienceYears: parseInt(jobExp),
      skills: jobSkills, qualifications: jobQualifications,
      responsibilities: jobResponsibilities, benefits: jobBenefits,
      applicationDeadline: jobDeadline || null, description: jobDesc || jobTitle
    });
    toast.success('Job posting created and published');
    setShowJobForm(false);
    fetchAll();
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName || !candEmail) { toast.error('Name and Email are required.'); return; }
    await recruitmentApi('post', '/apply', {
      fullName: candName, email: candEmail, phone: candPhone,
      address: candAddress, currentCompany: candCurrentCo,
      expectedCtc: parseFloat(candExpectedCtc) || 0,
      source: candSource, resumeText: candResumeText
    });
    toast.success('Candidate registered.');
    setShowCandidateForm(false);
    fetchAll();
  };

  const handleMovePipeline = async (candidateId: string, newStatus: string) => {
    await recruitmentApi('post', '/candidates/move-pipeline', { candidateId, newStatus });
    toast.success(`Candidate status moved to ${newStatus.replace('_', ' ')}`);
    fetchAll();
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intCandId || !intDateTime) { toast.error('Select candidate and datetime.'); return; }
    await recruitmentApi('post', '/interview', {
      candidateId: intCandId, title: intTitle, type: intType, scheduledAt: intDateTime
    });
    toast.success('Interview round scheduled');
    setShowInterviewForm(false);
    fetchAll();
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerCandId || !offerCtc || !offerJoining) { toast.error('Fill in all offer fields.'); return; }
    const created = await recruitmentApi('post', '/offer', {
      candidateId: offerCandId, jobTitle: offerTitle,
      employmentType: offerEmploymentType, ctc: parseFloat(offerCtc),
      fixedPay: parseFloat(offerFixed) || parseFloat(offerCtc) * 0.8,
      variablePay: parseFloat(offerCtc) * 0.2, joiningBonus: parseFloat(offerBonus) || 0,
      probationPeriod: parseInt(offerProbation) || 90, joiningDate: offerJoining
    });
    await recruitmentApi('post', '/offers/approve', { offerId: created.id, status: 'approved' });
    toast.success('Offer created and approved.');
    setShowOfferForm(false);
    fetchAll();
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle || !planBudget) { toast.error('Title and Budget are required.'); return; }
    await recruitmentApi('post', '/hiring-plans', {
      departmentName: planDept, branch: planBranch, team: planTeam,
      positionTitle: planTitle, hiringCount: parseInt(planCount),
      budget: parseFloat(planBudget), quarter: planQuarter,
      hiringTimeline: planTimeline, businessJustification: planJustification,
      priority: planPriority
    });
    toast.success('Hiring plan logged successfully');
    setShowPlanForm(false);
    fetchAll();
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workEmail) { toast.error('Work Email is required.'); return; }
    try {
      await api.post('/recruitment/convert-to-employee', {
        candidateId: selectedCandId, departmentName: empDept,
        designationName: empDesg, dateOfJoining: new Date().toISOString().split('T')[0],
        workEmail
      });
      toast.success('Converted to Employee successfully!');
      setShowConvertForm(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to convert candidate');
    }
  };

  // Date Card Formatter
  const getFormattedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return {
        month: months[d.getMonth()],
        day: d.getDate(),
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { month: 'MAY', day: 21, time: '10:00 AM' };
    }
  };

  // Real KPI changes calculator
  const candChange = useMemo(() => {
    if (!dashboard?.applicationsTrend || dashboard.applicationsTrend.length < 2) return '↑ 15% vs last month';
    const len = dashboard.applicationsTrend.length;
    const current = dashboard.applicationsTrend[len - 1].count;
    const previous = dashboard.applicationsTrend[len - 2].count;
    if (previous === 0) return current > 0 ? `↑ 100% vs last month` : `0% vs last month`;
    const diff = ((current - previous) / previous) * 100;
    const sign = diff >= 0 ? '↑' : '↓';
    return `${sign} ${Math.abs(Math.round(diff))}% vs last month`;
  }, [dashboard?.applicationsTrend]);

  // Max department hiring count calculation
  const maxDeptHiringCount = useMemo(() => {
    if (!dashboard?.topDepartments || dashboard.topDepartments.length === 0) return 1;
    return Math.max(...dashboard.topDepartments.map((d: any) => d.count), 1);
  }, [dashboard?.topDepartments]);

  // Funnel calculations
  const funnelData = useMemo(() => {
    const applied = dashboard?.pipelineDistribution?.applied ?? 0;
    const hired = dashboard?.pipelineDistribution?.hired ?? 0;
    const conversion = applied > 0 ? ((hired / applied) * 100).toFixed(1) : '0.0';

    return {
      applied,
      screening: dashboard?.pipelineDistribution?.screening ?? 0,
      assessment: dashboard?.pipelineDistribution?.assessment ?? 0,
      technical: dashboard?.pipelineDistribution?.technical_interview ?? 0,
      hr: dashboard?.pipelineDistribution?.hr_interview ?? 0,
      selected: dashboard?.pipelineDistribution?.selected ?? 0,
      offered: dashboard?.pipelineDistribution?.offer ?? 0,
      hired,
      conversion
    };
  }, [dashboard?.pipelineDistribution]);

  // Column definitions
  const jobColumns: ColumnDef<any>[] = [
    { accessorKey: 'title', header: 'Job Title', cell: ({ row }) => <span className="font-bold text-ag-ink text-sm">{row.original.title}</span> },
    { accessorKey: 'departmentName', header: 'Department' },
    { accessorKey: 'location', header: 'Location', cell: ({ row }) => <span className="flex items-center gap-1"><MapPin size={12} />{row.original.location}</span> },
    { accessorKey: 'employmentType', header: 'Type', cell: ({ row }) => <StatusBadge status={row.original.employmentType} /> },
    { accessorKey: 'experienceYears', header: 'Exp', cell: ({ row }) => <span>{row.original.experienceYears}+ yrs</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  const offerColumns: ColumnDef<any>[] = [
    { accessorKey: 'jobTitle', header: 'Position', cell: ({ row }) => <span className="font-bold text-ag-ink text-sm">{row.original.jobTitle}</span> },
    { accessorKey: 'ctc', header: 'CTC (Annual)', cell: ({ row }) => <span className="font-mono font-bold text-ag-primary">₹{row.original.ctc?.toLocaleString()}</span> },
    { accessorKey: 'joiningDate', header: 'Joining Date' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: 'convert', header: 'Action',
      cell: ({ row }) => row.original.status === 'accepted' ? (
        <Button size="sm" onClick={() => { setSelectedCandId(row.original.candidateId); setShowConvertForm(true); }} icon={<Check size={12} />}>Convert to Emp</Button>
      ) : <span className="text-xs text-ag-ink-3 uppercase">{row.original.status}</span>
    }
  ];

  const planColumns: ColumnDef<any>[] = [
    { accessorKey: 'positionTitle', header: 'Role Planned', cell: ({ row }) => <span className="font-bold text-ag-ink text-sm">{row.original.positionTitle}</span> },
    { accessorKey: 'departmentName', header: 'Dept / Team', cell: ({ row }) => <span>{row.original.departmentName} ({row.original.team})</span> },
    { accessorKey: 'hiringCount', header: 'Headcount', cell: ({ row }) => <span className="font-semibold">{row.original.hiringCount}</span> },
    { accessorKey: 'budget', header: 'Allocation', cell: ({ row }) => <span className="font-mono">₹{row.original.budget?.toLocaleString()}</span> },
    { accessorKey: 'quarter', header: 'Quarter', cell: ({ row }) => <span className="font-semibold">{row.original.quarter}</span> },
    { accessorKey: 'priority', header: 'Priority', cell: ({ row }) => <StatusBadge status={row.original.priority} /> },
  ];

  const tabs = [
    { key: 'dashboard', label: 'Overview', icon: <Trophy size={14} /> },
    { key: 'jobs', label: 'Job Openings', icon: <Briefcase size={14} /> },
    { key: 'hiringPlans', label: 'Hiring Plans', icon: <Calendar size={14} /> },
    { key: 'candidates', label: 'Pipeline', icon: <Users size={14} /> },
    { key: 'interviews', label: 'Interviews', icon: <Calendar size={14} /> },
    { key: 'offers', label: 'Offers Log', icon: <FileText size={14} /> },
    { key: 'bgv', label: 'BGV Console', icon: <ShieldCheck size={14} /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
  ] as const;

  return (
    <PageContainer
      title="Recruitment Dashboard"
      subtitle="Real-time overview of your hiring activities and pipeline performance."
      actions={
        <div className="flex gap-2">
          {activeTab === 'dashboard' && (
            <>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-ag-surface border border-ag-border hover:bg-ag-surface-2 rounded-lg text-xs font-semibold text-ag-ink shadow-sm transition-colors">
                <Calendar size={14} className="text-ag-ink-3" />
                <span>May 20 - Jun 20, 2026</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-ag-surface border border-ag-border hover:bg-ag-surface-2 rounded-lg text-xs font-semibold text-ag-ink shadow-sm transition-colors">
                <Filter size={14} className="text-ag-ink-3" />
                <span>Filter</span>
              </button>
              <Button onClick={() => { setActiveTab('jobs'); setShowJobForm(true); }} icon={<Plus size={14} />}>Create Job</Button>
            </>
          )}
          {activeTab === 'jobs' && <Button onClick={() => setShowJobForm(!showJobForm)} icon={<Plus size={14} />}>Post Job</Button>}
          {activeTab === 'candidates' && <Button onClick={() => setShowCandidateForm(!showCandidateForm)} icon={<Plus size={14} />}>Add Candidate</Button>}
          {activeTab === 'interviews' && <Button onClick={() => setShowInterviewForm(!showInterviewForm)} icon={<Plus size={14} />}>Schedule</Button>}
          {activeTab === 'offers' && <Button onClick={() => setShowOfferForm(!showOfferForm)} icon={<Plus size={14} />}>Create Offer</Button>}
          {activeTab === 'hiringPlans' && <Button onClick={() => setShowPlanForm(!showPlanForm)} icon={<Plus size={14} />}>Add Plan</Button>}
          <Button variant="secondary" onClick={fetchAll} icon={<RotateCw size={14} />} />
        </div>
      }
    >
      {/* Tab bar header switcher */}
      <div className="flex gap-1 p-1 bg-ag-surface-2/70 border border-ag-border rounded-xl w-fit mb-8 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === t.key ? 'bg-ag-surface text-ag-primary shadow-sm border border-ag-border/50' : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Convert to Employee Modal/Inline Form */}
      {showConvertForm && (
        <Card className="p-5 max-w-lg mb-8 border border-ag-primary/30">
          <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4 flex items-center justify-between">
            <span>Convert Candidate to Employee Record</span>
            <Button variant="ghost" size="sm" onClick={() => setShowConvertForm(false)} icon={<X size={14} />} />
          </h3>
          <form onSubmit={handleConvert} className="space-y-4">
            <Input label="Work Email *" type="email" value={workEmail} onChange={e => setWorkEmail(e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Department" value={empDept} onChange={e => setEmpDept(e.target.value)}
                options={['Engineering','HR','Finance','Marketing','Sales'].map(d => ({ value: d, label: d }))} />
              <Input label="Designation" value={empDesg} onChange={e => setEmpDesg(e.target.value)} />
            </div>
            <Button type="submit">Convert now</Button>
          </form>
        </Card>
      )}

      {/* ── Tab Content: Dashboard (Overview) ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* KPI Cards Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Open Jobs */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 w-fit">
                  <Briefcase size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Open Jobs</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : (dashboard?.totalOpenJobs ?? 0)}</span>
                  <span className="text-[10px] text-ag-ink-3">vs last mo</span>
                </div>
              </div>
            </Card>

            {/* 2. Open Requisitions */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 w-fit">
                  <FileText size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Open Requisitions</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : (dashboard?.openRequisitions ?? 0)}</span>
                  <span className="text-[10px] text-ag-ink-3">vs last mo</span>
                </div>
              </div>
            </Card>

            {/* 3. Total Candidates */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 w-fit">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Total Candidates</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : (dashboard?.totalCandidates ?? 0).toLocaleString()}</span>
                  <span className="text-[10px] text-ag-ink-3">vs last mo</span>
                </div>
              </div>
            </Card>

            {/* 4. Applications Today */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 w-fit">
                  <Plus size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Applications Today</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : (dashboard?.applicationsToday ?? 0)}</span>
                  <span className="text-[10px] text-ag-ink-3">vs yesterday</span>
                </div>
              </div>
            </Card>

            {/* 5. Interviews Today */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 w-fit">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Interviews Today</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : (dashboard?.interviewsToday ?? 0)}</span>
                  <span className="text-[10px] text-ag-ink-3">vs yesterday</span>
                </div>
              </div>
            </Card>
          </div>

          {/* KPI Cards Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 6. Pending Interviews */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600 w-fit">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Pending Interviews</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : (dashboard?.pendingInterviews ?? 0)}</span>
                  <span className="text-[10px] text-ag-ink-3">vs yesterday</span>
                </div>
              </div>
            </Card>

            {/* 7. Pending Offers */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-600 w-fit">
                  <FileText size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Pending Offers</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : (dashboard?.pendingOffers ?? 0)}</span>
                  <span className="text-[10px] text-ag-ink-3">vs yesterday</span>
                </div>
              </div>
            </Card>

            {/* 8. Offer Acceptance Rate */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 w-fit">
                  <BarChart3 size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Offer Acceptance Rate</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : `${dashboard?.offerAcceptanceRate ?? 0}%`}</span>
                  <span className="text-[10px] text-ag-ink-3">vs last mo</span>
                </div>
              </div>
            </Card>

            {/* 9. Total Hired */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-green-500/10 text-green-600 w-fit">
                  <Trophy size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Total Hired</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : (dashboard?.totalHired ?? 0)}</span>
                  <span className="text-[10px] text-ag-ink-3">vs last mo</span>
                </div>
              </div>
            </Card>

            {/* 10. Joining This Month */}
            <Card className="p-4 hover:border-ag-primary/25 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 w-fit">
                  <Clock size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-ag-ink-3 uppercase font-bold tracking-wider">Joining This Month</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-ag-ink">{isLoading ? '—' : (dashboard?.joiningThisMonth ?? 0)}</span>
                  <span className="text-[10px] text-ag-ink-3">vs last mo</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Funnel, Trend, and Department hiring charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 1. Hiring Pipeline Stages */}
            <Card>
              <CardHeader title="Hiring Pipeline Stages" subtitle="Candidate conversion across funnel stages" />
              <div className="p-6 space-y-4">
                {/* Funnel Graph visualization */}
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-full h-9 bg-blue-500/10 text-blue-700 flex items-center justify-between px-4 rounded-xl text-xs font-bold border border-blue-500/20">
                    <span>Applied</span>
                    <span>{funnelData.applied} (100%)</span>
                  </div>
                  <div className="w-[90%] h-9 bg-purple-500/10 text-purple-700 flex items-center justify-between px-4 rounded-xl text-xs font-bold border border-purple-500/20">
                    <span>Screening</span>
                    <span>{funnelData.screening}</span>
                  </div>
                  <div className="w-[80%] h-9 bg-yellow-500/10 text-yellow-700 flex items-center justify-between px-4 rounded-xl text-xs font-bold border border-yellow-500/20">
                    <span>Assessment</span>
                    <span>{funnelData.assessment}</span>
                  </div>
                  <div className="w-[70%] h-9 bg-orange-500/10 text-orange-700 flex items-center justify-between px-4 rounded-xl text-xs font-bold border border-orange-500/20">
                    <span>Technical</span>
                    <span>{funnelData.technical}</span>
                  </div>
                  <div className="w-[60%] h-9 bg-pink-500/10 text-pink-700 flex items-center justify-between px-4 rounded-xl text-xs font-bold border border-pink-500/20">
                    <span>HR Interview</span>
                    <span>{funnelData.hr}</span>
                  </div>
                  <div className="w-[50%] h-9 bg-teal-500/10 text-teal-700 flex items-center justify-between px-4 rounded-xl text-xs font-bold border border-teal-500/20">
                    <span>Selected</span>
                    <span>{funnelData.selected}</span>
                  </div>
                  <div className="w-[40%] h-9 bg-indigo-500/10 text-indigo-700 flex items-center justify-between px-4 rounded-xl text-xs font-bold border border-indigo-500/20">
                    <span>Offered</span>
                    <span>{funnelData.offered}</span>
                  </div>
                  <div className="w-[30%] h-9 bg-green-500/10 text-green-700 flex items-center justify-between px-4 rounded-xl text-xs font-bold border border-green-500/20">
                    <span>Hired / Joined</span>
                    <span>{funnelData.hired}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-ag-border flex justify-between items-center text-xs font-bold">
                  <span className="text-ag-ink-3">Conversion Rate</span>
                  <span className="px-2 py-0.5 bg-ag-primary-light text-ag-primary rounded-full">{funnelData.conversion}%</span>
                </div>
              </div>
            </Card>

            {/* 2. Applications Trend Area Chart */}
            <Card>
              <CardHeader title="Applications Trend" subtitle="Application rates over the last 6 months" />
              <div className="p-6">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-extrabold text-ag-ink">{dashboard?.totalCandidates ?? 0}</span>
                  <span className="text-xs text-ag-ink-3">Total Applications</span>
                  <span className="text-xs font-bold text-green-500 ml-auto">{candChange}</span>
                </div>
                <div className="h-56 w-full">
                  {dashboard?.applicationsTrend ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboard.applicationsTrend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--ag-primary, #6366F1)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--ag-primary, #6366F1)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ag-border-light, #E2E8F0)" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--ag-ink-3)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--ag-ink-3)' }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="var(--ag-primary, #6366F1)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-ag-ink-3">No trend data available</div>
                  )}
                </div>
              </div>
            </Card>

            {/* 3. Top Department Hiring Progress */}
            <Card>
              <CardHeader title="Top Department Hiring" subtitle="Active job openings categorized by department" />
              <div className="p-6 space-y-5">
                {(!dashboard?.topDepartments || dashboard.topDepartments.length === 0) ? (
                  <p className="text-center py-12 text-xs text-ag-ink-3">No active jobs published to display stats.</p>
                ) : (
                  dashboard.topDepartments.map((d: any) => (
                    <div key={d.department} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-ag-ink">{d.department}</span>
                        <span className="font-mono font-bold text-ag-ink-2">{d.count} open</span>
                      </div>
                      <div className="h-2 w-full bg-ag-surface-2 border border-ag-border/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-ag-primary to-ag-primary-dark rounded-full transition-all"
                          style={{ width: `${(d.count / maxDeptHiringCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Recent Jobs and Upcoming Interviews tables row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Recent Job Openings (Span 2) */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between p-6 border-b border-ag-border">
                  <div>
                    <h3 className="font-bold text-base text-ag-ink">Recent Job Openings</h3>
                    <p className="text-xs text-ag-ink-3 mt-0.5">Track latest job listings status</p>
                  </div>
                  <button onClick={() => setActiveTab('jobs')} className="text-xs font-bold text-ag-primary hover:underline">
                    View All Jobs →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                        <th className="p-4">Job Title</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Location</th>
                        <th className="p-4 text-center">Candidates</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Created On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!dashboard?.recentJobs || dashboard.recentJobs.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-ag-ink-3">No recent job openings available.</td>
                        </tr>
                      ) : (
                        dashboard.recentJobs.map((j: any) => (
                          <tr key={j.id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                            <td className="p-4 font-bold text-ag-ink">{j.title}</td>
                            <td className="p-4 text-ag-ink-2">{j.departmentName}</td>
                            <td className="p-4 text-ag-ink-2 flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-ag-ink-3" />
                              <span>{j.location}</span>
                            </td>
                            <td className="p-4 text-center font-bold text-ag-primary">{j.candidateCount}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                j.status === 'published' ? 'bg-green-500/10 text-green-600' : 'bg-ag-surface-2 text-ag-ink-3'
                              }`}>
                                {j.status === 'published' ? 'open' : j.status}
                              </span>
                            </td>
                            <td className="p-4 text-ag-ink-3 font-medium">{j.createdAt || 'Just now'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Right: Upcoming Interviews */}
            <Card>
              <div className="flex items-center justify-between p-6 border-b border-ag-border">
                <div>
                  <h3 className="font-bold text-base text-ag-ink">Upcoming Interviews</h3>
                  <p className="text-xs text-ag-ink-3 mt-0.5">Next scheduled feedback panels</p>
                </div>
                <button onClick={() => setActiveTab('interviews')} className="text-xs font-bold text-ag-primary hover:underline">
                  View Calendar →
                </button>
              </div>
              <div className="p-6 space-y-4">
                {(!dashboard?.upcomingInterviews || dashboard.upcomingInterviews.length === 0) ? (
                  <p className="text-center py-12 text-xs text-ag-ink-3">No upcoming interviews scheduled.</p>
                ) : (
                  dashboard.upcomingInterviews.map((int: any) => {
                    const parsedDate = getFormattedDate(int.scheduledAt);
                    return (
                      <div key={int.id} className="flex gap-4 items-start p-3 border border-ag-border hover:border-ag-primary/20 rounded-xl transition-all">
                        {/* Calendar block date */}
                        <div className="w-12 h-12 bg-ag-surface-2 border border-ag-border rounded-lg flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-extrabold text-ag-ink-3 uppercase leading-none">{parsedDate.month}</span>
                          <span className="text-lg font-black text-ag-ink leading-tight mt-0.5">{parsedDate.day}</span>
                        </div>
                        {/* Info details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-ag-ink truncate">{int.candidateName}</h4>
                          <p className="text-[10px] text-ag-ink-3 truncate mt-0.5">{int.candidateRole}</p>
                          <div className="flex items-center gap-3 text-[10px] text-ag-ink-3 mt-1">
                            <span className="font-semibold text-ag-primary">{parsedDate.time}</span>
                            {int.videoLink && (
                              <a href={int.videoLink} target="_blank" rel="noopener noreferrer" className="text-ag-primary-dark hover:underline flex items-center gap-0.5">
                                <Video size={10} /> Join
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Tab: Job Openings ── */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {showJobForm && (
            <Card className="p-5 max-w-2xl">
              <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Post a New Job Opening</h3>
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Job Title *" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
                  <Select label="Department" value={jobDept} onChange={e => setJobDept(e.target.value)}
                    options={['Engineering','HR','Finance','Marketing','Sales','Operations','Customer Support'].map(d => ({ value: d, label: d }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Location *" value={jobLocation} onChange={e => setJobLocation(e.target.value)} required />
                  <Select label="Employment Type" value={jobType} onChange={e => setJobType(e.target.value)}
                    options={[
                      { value: 'full_time', label: 'Full Time' },
                      { value: 'part_time', label: 'Part Time' },
                      { value: 'contract', label: 'Contract' },
                      { value: 'internship', label: 'Internship' },
                    ]} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Min Experience (years)" type="number" value={jobExp} onChange={e => setJobExp(e.target.value)} />
                  <Input label="Skills (comma-separated) *" value={jobSkills} onChange={e => setJobSkills(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Qualifications" value={jobQualifications} onChange={e => setJobQualifications(e.target.value)} placeholder="e.g. B.Tech in CS" />
                  <Input label="Deadline" type="date" value={jobDeadline} onChange={e => setJobDeadline(e.target.value)} />
                </div>
                <Input label="Job Description" value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
                <Button type="submit">Publish Job Opening</Button>
              </form>
            </Card>
          )}
          <Card>
            <CardHeader title="Published Job Openings" subtitle="All active job openings across departments." />
            <DataTable columns={jobColumns} data={jobs} isLoading={isLoading}
              emptyTitle="No jobs published" emptySubtitle="Click 'Post Job' to create the first opening." />
          </Card>
        </div>
      )}

      {/* ── Tab: Hiring Plans ── */}
      {activeTab === 'hiringPlans' && (
        <div className="space-y-6">
          {showPlanForm && (
            <Card className="p-5 max-w-2xl">
              <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Create Workforce Hiring Plan</h3>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select label="Department" value={planDept} onChange={e => setPlanDept(e.target.value)}
                    options={['Engineering','HR','Finance','Marketing','Sales'].map(d => ({ value: d, label: d }))} />
                  <Input label="Branch" value={planBranch} onChange={e => setPlanBranch(e.target.value)} />
                  <Input label="Team" value={planTeam} onChange={e => setPlanTeam(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Position Title *" value={planTitle} onChange={e => setPlanTitle(e.target.value)} required />
                  <Input label="Hiring Count" type="number" value={planCount} onChange={e => setPlanCount(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input label="Quarter *" value={planQuarter} onChange={e => setPlanQuarter(e.target.value)} placeholder="e.g. Q3-2026" required />
                  <Input label="Timeline" value={planTimeline} onChange={e => setPlanTimeline(e.target.value)} placeholder="Immediate" />
                  <Input label="Budget (CTC allocation) *" type="number" value={planBudget} onChange={e => setPlanBudget(e.target.value)} required />
                </div>
                <Input label="Justification" value={planJustification} onChange={e => setPlanJustification(e.target.value)} />
                <Select label="Priority" value={planPriority} onChange={e => setPlanPriority(e.target.value)}
                  options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
                <Button type="submit">Log Hiring Plan</Button>
              </form>
            </Card>
          )}
          <Card>
            <CardHeader title="Workforce Plan & Headcount Allotment" subtitle="Long-term hiring allocations by department and quarter." />
            <DataTable columns={planColumns} data={hiringPlans} isLoading={isLoading}
              emptyTitle="No hiring plans logged" emptySubtitle="Click 'Add Plan' to register workforce headcount budget." />
          </Card>
        </div>
      )}

      {/* ── Tab: Candidates Kanban Pipeline ── */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          {showCandidateForm && (
            <Card className="p-5 max-w-2xl">
              <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Register New Candidate</h3>
              <form onSubmit={handleAddCandidate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name *" value={candName} onChange={e => setCandName(e.target.value)} required />
                  <Input label="Email *" type="email" value={candEmail} onChange={e => setCandEmail(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input label="Phone" value={candPhone} onChange={e => setCandPhone(e.target.value)} />
                  <Input label="Current Company" value={candCurrentCo} onChange={e => setCandCurrentCo(e.target.value)} />
                  <Input label="Expected CTC (LPA)" type="number" value={candExpectedCtc} onChange={e => setCandExpectedCtc(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Address" value={candAddress} onChange={e => setCandAddress(e.target.value)} />
                  <Select label="Source" value={candSource} onChange={e => setCandSource(e.target.value)}
                    options={['career_portal','linkedin','referral','job_portal','campus','agency'].map(s => ({ value: s, label: s.replace('_', ' ') }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ag-ink block mb-1">Resume Text (for AI analysis)</label>
                  <textarea value={candResumeText} onChange={e => setCandResumeText(e.target.value)}
                    className="w-full min-h-[80px] p-2 text-xs rounded border bg-ag-surface-2 text-ag-ink focus:outline-none" />
                </div>
                <Button type="submit">Register Candidate</Button>
              </form>
            </Card>
          )}

          {/* Candidates search and filter controls */}
          <div className="flex flex-wrap gap-4 items-end bg-ag-surface-2/45 p-4 rounded-xl border border-ag-border">
            <div className="flex-1 min-w-[200px]">
              <Input label="Search Candidates" placeholder="Fuzzy search name, email or company..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="w-40">
              <Select label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                options={[{ value: '', label: 'All Statuses' }, ...PIPELINE_STAGES.map(s => ({ value: s.key, label: s.label }))] } />
            </div>
            <div className="w-40">
              <Select label="Source" value={filterSource} onChange={e => setFilterSource(e.target.value)}
                options={[{ value: '', label: 'All Sources' }, ...['career_portal','linkedin','referral','job_portal','campus','agency'].map(s => ({ value: s, label: s.replace('_', ' ') }))] } />
            </div>
            <div className="w-32">
              <Input label="Min ATS Score" type="number" placeholder="0" value={filterMinAts} onChange={e => setFilterMinAts(e.target.value)} />
            </div>
            <Button onClick={fetchAll} icon={<RotateCw size={16} />}>Apply</Button>
          </div>

          {/* Kanban Board */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGES.map(stage => {
                const stageCandidates = candidates.filter(c => c.status === stage.key);
                return (
                  <div key={stage.key} className="w-64 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className="text-xs font-bold text-ag-ink uppercase tracking-wide">{stage.label}</span>
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-ag-surface-2 border border-ag-border rounded-full text-ag-ink-3">
                        {stageCandidates.length}
                      </span>
                    </div>
                    <div className="space-y-3 min-h-[120px] p-2 bg-ag-surface-2/20 border border-dashed border-ag-border rounded-xl">
                      {stageCandidates.map(c => (
                        <div key={c.id} className="p-3.5 rounded-xl border border-ag-border bg-ag-surface hover:border-ag-primary/45 transition-all shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link to={`/recruitment/candidates/${c.id}`} className="font-bold text-xs text-ag-primary hover:underline">{c.fullName}</Link>
                              <p className="text-[10px] text-ag-ink-3 mt-0.5">{c.currentCompany || 'No current company'}</p>
                            </div>
                            {c.atsScore > 0 && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                c.atsScore >= 70 ? 'bg-green-100 text-green-700' :
                                c.atsScore >= 45 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>{c.atsScore}%</span>
                            )}
                          </div>
                          {NEXT_STAGE[stage.key] && (
                            <button onClick={() => handleMovePipeline(c.id, NEXT_STAGE[stage.key])}
                              className="mt-2.5 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-ag-primary hover:bg-ag-primary/10 rounded-lg py-1 transition-colors border border-ag-primary/20">
                              Advance stage <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Interviews ── */}
      {activeTab === 'interviews' && (
        <div className="space-y-6">
          {showInterviewForm && (
            <Card className="p-5 max-w-lg">
              <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Schedule Interview</h3>
              <form onSubmit={handleScheduleInterview} className="space-y-4">
                <Select label="Candidate *" value={intCandId} onChange={e => setIntCandId(e.target.value)}
                  options={[{ value: '', label: 'Select candidate...' }, ...candidates.map(c => ({ value: c.id, label: `${c.fullName} (${c.status})` }))] } />
                <Input label="Interview Title" value={intTitle} onChange={e => setIntTitle(e.target.value)} />
                <Select label="Interview Type" value={intType} onChange={e => setIntType(e.target.value)}
                  options={[{ value: 'technical', label: 'Technical' }, { value: 'hr', label: 'HR Screening' }, { value: 'panel', label: 'Panel Evaluation' }]} />
                <Input label="Date & Time *" type="datetime-local" value={intDateTime} onChange={e => setIntDateTime(e.target.value)} required />
                <Button type="submit">Schedule Round</Button>
              </form>
            </Card>
          )}
          <Card>
            <CardHeader title="Interview Schedules Log" subtitle="All active panel reviews and coding evaluation interviews." />
            <div className="p-4 space-y-3">
              {interviews.length === 0 && <p className="text-center text-ag-ink-3 py-6 text-xs">No interviews scheduled yet.</p>}
              {interviews.map(i => (
                <div key={i.id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-ag-ink">{i.title}</h4>
                    <p className="text-xs text-ag-ink-3 mt-1">
                      <Clock size={11} className="inline mr-1" />
                      {new Date(i.scheduledAt).toLocaleString()} — {i.type.toUpperCase()}
                    </p>
                    {i.videoLink && <a href={i.videoLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-ag-primary mt-1 block hover:underline">{i.videoLink}</a>}
                  </div>
                  <StatusBadge status={i.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab: Offers Log ── */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {showOfferForm && (
            <Card className="p-5 max-w-lg">
              <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Generate Offer Letter</h3>
              <form onSubmit={handleCreateOffer} className="space-y-4">
                <Select label="Candidate *" value={offerCandId} onChange={e => setOfferCandId(e.target.value)}
                  options={[{ value: '', label: 'Select candidate...' }, ...candidates.filter(c => c.status === 'selected').map(c => ({ value: c.id, label: c.fullName }))] } />
                <Input label="Position Title" value={offerTitle} onChange={e => setOfferTitle(e.target.value)} placeholder="e.g. Staff Engineer" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="CTC (LPA) *" type="number" value={offerCtc} onChange={e => setOfferCtc(e.target.value)} required />
                  <Input label="Fixed base" type="number" value={offerFixed} onChange={e => setOfferFixed(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Joining Bonus" type="number" value={offerBonus} onChange={e => setOfferBonus(e.target.value)} />
                  <Input label="Probation (days)" type="number" value={offerProbation} onChange={e => setOfferProbation(e.target.value)} />
                </div>
                <Input label="Joining Date *" type="date" value={offerJoining} onChange={e => setOfferJoining(e.target.value)} required />
                <Button type="submit">Create Offer</Button>
              </form>
            </Card>
          )}
          <Card>
            <CardHeader title="Offer Management & Compensation Proposals" subtitle="Generate compensation CTC sheets, probation terms and record accepts." />
            <DataTable columns={offerColumns} data={offers} isLoading={isLoading}
              emptyTitle="No offers logged" emptySubtitle="Move a candidate to selected stage and generate an offer." />
          </Card>
        </div>
      )}

      {/* ── Tab: BGV Console ── */}
      {activeTab === 'bgv' && (
        <Card className="p-5">
          <CardHeader title="Background Verification Tracker" subtitle="Overview of candidate BGV check lists prior to conversion." />
          <div className="space-y-4 p-4">
            {candidates.filter(c => ['selected','offer','onboarding','hired'].includes(c.status)).length === 0 && (
              <p className="text-center py-6 text-xs text-ag-ink-3">No candidates in selected/onboarding stage to audit.</p>
            )}
            {candidates.filter(c => ['selected','offer','onboarding','hired'].includes(c.status)).map(c => (
              <div key={c.id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between">
                <div>
                  <Link to={`/recruitment/candidates/${c.id}`} className="font-bold text-xs text-ag-primary hover:underline">{c.fullName}</Link>
                  <p className="text-[10px] text-ag-ink-3 mt-1">Status: {c.status.toUpperCase()} | Source: {c.source}</p>
                </div>
                <Link to={`/recruitment/candidates/${c.id}`}>
                  <Button size="sm" variant="secondary" icon={<ShieldCheck size={14} />}>View BGV Panel</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Tab: Analytics ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 text-center">
              <h4 className="text-xs text-ag-ink-3 font-semibold uppercase tracking-wider">Hires This Year</h4>
              <p className="text-4xl font-extrabold text-ag-primary mt-2">{analytics?.hiredThisYear ?? 0}</p>
            </Card>
            <Card className="p-5 text-center">
              <h4 className="text-xs text-ag-ink-3 font-semibold uppercase tracking-wider">Offer Acceptance Rate</h4>
              <p className="text-4xl font-extrabold text-ag-primary mt-2">{analytics?.offerAcceptanceRate ?? 0}%</p>
            </Card>
            <Card className="p-5 text-center">
              <h4 className="text-xs text-ag-ink-3 font-semibold uppercase tracking-wider">Avg Time-to-Hire</h4>
              <p className="text-4xl font-extrabold text-ag-primary mt-2">18 days</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-2 mb-3">Application Source Performance</h3>
              <div className="space-y-3">
                {analytics?.sourceDistribution && Object.entries(analytics.sourceDistribution).map(([src, val]: any) => (
                  <div key={src} className="flex justify-between items-center text-xs">
                    <span className="font-semibold capitalize">{src.replace('_', ' ')}</span>
                    <span className="font-mono bg-ag-surface-2 border px-2 py-0.5 rounded">{val} applicants</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-2 mb-3">Pipeline Stage movements</h3>
              <div className="space-y-3">
                {analytics?.pipelineStageMovements && Object.entries(analytics.pipelineStageMovements).map(([stage, val]: any) => (
                  <div key={stage} className="flex justify-between items-center text-xs">
                    <span className="font-semibold capitalize">{stage.replace('_', ' ')}</span>
                    <span className="font-mono bg-ag-surface-2 border px-2 py-0.5 rounded">{val} transitions</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

