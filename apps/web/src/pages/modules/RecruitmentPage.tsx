import React, { useEffect, useState, useCallback } from 'react';
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
import {
  Briefcase, Users, CalendarBlank, FileText, ArrowsClockwise,
  Plus, Check, X, ArrowRight, Trophy, Clock, ShieldCheck, ChartBar, MapPin
} from '@phosphor-icons/react';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function recruitmentApi(method: 'get' | 'post', path: string, data?: any) {
  const res = await (method === 'get'
    ? api.get(`/recruitment${path}`)
    : api.post(`/recruitment${path}`, data));
  return res.data.data;
}

const PIPELINE_STAGES = [
  { key: 'applied',             label: 'Applied',            color: 'bg-blue-500' },
  { key: 'screening',           label: 'Screening',          color: 'bg-purple-500' },
  { key: 'assessment',          label: 'Assessment',         color: 'bg-yellow-500' },
  { key: 'technical_interview', label: 'Technical',          color: 'bg-orange-500' },
  { key: 'hr_interview',        label: 'HR Interview',       color: 'bg-pink-500' },
  { key: 'selected',            label: 'Selected',           color: 'bg-teal-500' },
  { key: 'offer',               label: 'Offer',              color: 'bg-indigo-500' },
  { key: 'onboarding',          label: 'Onboarding',         color: 'bg-cyan-500' },
  { key: 'hired',               label: 'Hired ✓',            color: 'bg-green-600' },
];

const NEXT_STAGE: Record<string, string> = {
  applied: 'screening', screening: 'assessment', assessment: 'technical_interview',
  technical_interview: 'hr_interview', hr_interview: 'selected', selected: 'offer',
  offer: 'onboarding', onboarding: 'hired',
};

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'interviews' | 'offers' | 'hiringPlans' | 'bgv' | 'analytics'>('dashboard');
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

  // Requisitions (needed for job posting)
  const [requisitions, setRequisitions] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build paginated search query string
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
    toast.success('Candidate registered. Run ATS scoring from candidate detail view.');
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

  // ── Column Definitions ─────────────────────────────────────────────────────

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
    { key: 'dashboard', label: 'Dashboard', icon: <Trophy size={16} /> },
    { key: 'jobs', label: 'Job Openings', icon: <Briefcase size={16} /> },
    { key: 'hiringPlans', label: 'Hiring Plans', icon: <CalendarBlank size={16} /> },
    { key: 'candidates', label: 'Pipeline', icon: <Users size={16} /> },
    { key: 'interviews', label: 'Interviews', icon: <CalendarBlank size={16} /> },
    { key: 'offers', label: 'Offers Log', icon: <FileText size={16} /> },
    { key: 'bgv', label: 'BGV Console', icon: <ShieldCheck size={16} /> },
    { key: 'analytics', label: 'Analytics', icon: <ChartBar size={16} /> },
  ] as const;

  return (
    <PageContainer
      title="Recruitment & Applicant Tracking (ATS)"
      subtitle="Complete candidate lifecycle: requisitions, pipeline progression, background check & conversion."
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchAll} icon={<ArrowsClockwise size={18} />}>Refresh</Button>
          {activeTab === 'jobs' && <Button onClick={() => setShowJobForm(!showJobForm)} icon={<Plus size={18} />}>Post Job</Button>}
          {activeTab === 'candidates' && <Button onClick={() => setShowCandidateForm(!showCandidateForm)} icon={<Plus size={18} />}>Add Candidate</Button>}
          {activeTab === 'interviews' && <Button onClick={() => setShowInterviewForm(!showInterviewForm)} icon={<Plus size={18} />}>Schedule</Button>}
          {activeTab === 'offers' && <Button onClick={() => setShowOfferForm(!showOfferForm)} icon={<Plus size={18} />}>Create Offer</Button>}
          {activeTab === 'hiringPlans' && <Button onClick={() => setShowPlanForm(!showPlanForm)} icon={<Plus size={18} />}>Add Plan</Button>}
        </div>
      }
    >
      {/* Tabs navigation */}
      <div className="flex gap-1.5 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeTab === t.key ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            {t.icon}{t.label}
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
            <div className="grid grid-cols-2 gap-4">
              <Select label="Department" value={empDept} onChange={e => setEmpDept(e.target.value)}
                options={['Engineering','HR','Finance','Marketing','Sales'].map(d => ({ value: d, label: d }))} />
              <Input label="Designation" value={empDesg} onChange={e => setEmpDesg(e.target.value)} />
            </div>
            <Button type="submit">Convert now</Button>
          </form>
        </Card>
      )}

      {/* ── Tab: Dashboard ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Open Jobs', value: dashboard?.totalOpenJobs ?? '—', icon: <Briefcase size={20} />, color: 'text-ag-primary' },
              { label: 'Open Requisitions', value: dashboard?.openRequisitions ?? '—', icon: <FileText size={20} />, color: 'text-indigo-500' },
              { label: 'Total Candidates', value: dashboard?.totalCandidates ?? '—', icon: <Users size={20} />, color: 'text-purple-500' },
              { label: 'Applications Today', value: dashboard?.applicationsToday ?? '—', icon: <Plus size={20} />, color: 'text-teal-500' },
              { label: 'Interviews Today', value: dashboard?.interviewsToday ?? '—', icon: <CalendarBlank size={20} />, color: 'text-orange-500' },
            ].map(kpi => (
              <Card key={kpi.label} className="p-5">
                <div className={`mb-3 ${kpi.color}`}>{kpi.icon}</div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wide">{kpi.label}</p>
                <h3 className="text-3xl font-extrabold font-display text-ag-ink mt-2">
                  {isLoading ? '—' : kpi.value}
                </h3>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Pending Interviews', value: dashboard?.pendingInterviews ?? '—', icon: <CalendarBlank size={20} />, color: 'text-yellow-500' },
              { label: 'Pending Offers', value: dashboard?.pendingOffers ?? '—', icon: <FileText size={20} />, color: 'text-pink-500' },
              { label: 'Offer Acceptance Rate', value: `${dashboard?.offerAcceptanceRate ?? 0}%`, icon: <ChartBar size={20} />, color: 'text-cyan-500' },
              { label: 'Total Hired', value: dashboard?.totalHired ?? '—', icon: <Trophy size={20} />, color: 'text-green-500' },
              { label: 'Joining This Month', value: dashboard?.joiningThisMonth ?? '—', icon: <Clock size={20} />, color: 'text-teal-600' },
            ].map(kpi => (
              <Card key={kpi.label} className="p-5">
                <div className={`mb-3 ${kpi.color}`}>{kpi.icon}</div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wide">{kpi.label}</p>
                <h3 className="text-3xl font-extrabold font-display text-ag-ink mt-2">
                  {isLoading ? '—' : kpi.value}
                </h3>
              </Card>
            ))}
          </div>

          {/* Pipeline Distribution Grid */}
          <Card>
            <CardHeader title="Hiring Pipeline Stages Snapshot" subtitle="Live overview of candidate distribution in the active pipeline (§48)" />
            <div className="p-4 grid grid-cols-3 md:grid-cols-9 gap-3">
              {PIPELINE_STAGES.map(stage => (
                <div key={stage.key} className="p-3 rounded-xl border border-ag-border bg-ag-surface-2/45 text-center">
                  <div className={`w-2 h-2 rounded-full ${stage.color} mx-auto mb-2`} />
                  <p className="text-[10px] text-ag-ink-3 font-semibold uppercase">{stage.label}</p>
                  <p className="text-2xl font-bold text-ag-ink mt-1">
                    {dashboard?.pipelineDistribution?.[stage.key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab: Job Openings ── */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {showJobForm && (
            <Card className="p-5 max-w-2xl">
              <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Post a New Job Opening</h3>
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Job Title *" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
                  <Select label="Department" value={jobDept} onChange={e => setJobDept(e.target.value)}
                    options={['Engineering','HR','Finance','Marketing','Sales','Operations','Customer Support','Internship'].map(d => ({ value: d, label: d }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Location *" value={jobLocation} onChange={e => setJobLocation(e.target.value)} required />
                  <Select label="Employment Type" value={jobType} onChange={e => setJobType(e.target.value)}
                    options={[
                      { value: 'full_time', label: 'Full Time' },
                      { value: 'part_time', label: 'Part Time' },
                      { value: 'contract', label: 'Contract' },
                      { value: 'internship', label: 'Internship' },
                    ]} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Min Experience (years)" type="number" value={jobExp} onChange={e => setJobExp(e.target.value)} />
                  <Input label="Skills (comma-separated) *" value={jobSkills} onChange={e => setJobSkills(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-3 gap-4">
                  <Select label="Department" value={planDept} onChange={e => setPlanDept(e.target.value)}
                    options={['Engineering','HR','Finance','Marketing','Sales'].map(d => ({ value: d, label: d }))} />
                  <Input label="Branch" value={planBranch} onChange={e => setPlanBranch(e.target.value)} />
                  <Input label="Team" value={planTeam} onChange={e => setPlanTeam(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Position Title *" value={planTitle} onChange={e => setPlanTitle(e.target.value)} required />
                  <Input label="Hiring Count" type="number" value={planCount} onChange={e => setPlanCount(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name *" value={candName} onChange={e => setCandName(e.target.value)} required />
                  <Input label="Email *" type="email" value={candEmail} onChange={e => setCandEmail(e.target.value)} required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Phone" value={candPhone} onChange={e => setCandPhone(e.target.value)} />
                  <Input label="Current Company" value={candCurrentCo} onChange={e => setCandCurrentCo(e.target.value)} />
                  <Input label="Expected CTC (LPA)" type="number" value={candExpectedCtc} onChange={e => setCandExpectedCtc(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
            <Button onClick={fetchAll} icon={<ArrowsClockwise size={16} />}>Apply</Button>
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
                <div className="grid grid-cols-2 gap-4">
                  <Input label="CTC (LPA) *" type="number" value={offerCtc} onChange={e => setOfferCtc(e.target.value)} required />
                  <Input label="Fixed base" type="number" value={offerFixed} onChange={e => setOfferFixed(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
