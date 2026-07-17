import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { toast } from 'sonner';
import { api } from '@/services/api.service';
import {
  User, Briefcase, FileText, CalendarBlank, ShieldCheck,
  Chats, Clock, Trophy, ArrowLeft, Check, X, DotsThreeOutline, Plus
} from '@phosphor-icons/react';

// ── Types ────────────────────────────────────────────────────────────────────
interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  currentCompany?: string;
  currentCtc: number;
  expectedCtc: number;
  noticePeriod: number;
  preferredLocation?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  source: string;
  applicationSource?: string;
  status: string;
  atsScore: number;
  resumeUrl?: string;
  resumeText?: string;
  skills: string[];
  experience: { company: string; designation: string; startDate?: string; endDate?: string }[];
  education: { institution: string; degree: string; fieldOfStudy?: string; graduationYear?: number }[];
  references: { id: string; name: string; company: string; status: string }[];
}

interface Interview {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  timezone: string;
  videoLink?: string;
  status: string;
  feedback?: { recommendation: string; technicalRating: number }[];
}

interface Offer {
  id: string;
  jobTitle: string;
  employmentType: string;
  departmentName?: string;
  reportingManager?: string;
  ctc: number;
  fixedPay: number;
  variablePay: number;
  joiningBonus: number;
  probationPeriod: number;
  joiningDate: string;
  status: string;
  version: number;
}

interface Bgv {
  id?: string;
  identityStatus: string;
  educationStatus: string;
  employmentStatus: string;
  addressStatus: string;
  criminalStatus: string;
  referenceStatus: string;
  overallStatus: string;
  vendorName?: string;
}

export default function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'ai' | 'assessments' | 'ai_interviews' | 'interviews' | 'documents' | 'communications' | 'timeline' | 'offer'>('overview');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [bgv, setBgv] = useState<Bgv | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI Interview Session states
  const [aiSession, setAiSession] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Assessment Engine states
  const [assessmentAttempts, setAssessmentAttempts] = useState<any[]>([]);
  const [assessmentTemplates, setAssessmentTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // Reference checks
  const [references, setReferences] = useState<any[]>([]);
  const [showAddRefForm, setShowAddRefForm] = useState(false);
  const [newRefName, setNewRefName] = useState('');
  const [newRefCompany, setNewRefCompany] = useState('');
  const [newRefRelation, setNewRefRelation] = useState('manager');
  const [newRefEmail, setNewRefEmail] = useState('');
  const [newRefPhone, setNewRefPhone] = useState('');

  // Forms
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [intTitle, setIntTitle] = useState('Technical Interview');
  const [intType, setIntType] = useState('technical');
  const [intDateTime, setIntDateTime] = useState('');
  
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedIntId, setSelectedIntId] = useState('');
  const [ratingTech, setRatingTech] = useState('4');
  const [ratingComm, setRatingComm] = useState('4');
  const [ratingProb, setRatingProb] = useState('4');
  const [ratingFit, setRatingFit] = useState('4');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRec, setFeedbackRec] = useState('hire');

  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerCtc, setOfferCtc] = useState('');
  const [offerFixed, setOfferFixed] = useState('');
  const [offerJoining, setOfferJoining] = useState('');

  const [showConvertForm, setShowConvertForm] = useState(false);
  const [workEmail, setWorkEmail] = useState('');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empDesg, setEmpDesg] = useState('Software Engineer');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [candRes, intRes, timelineRes, offersRes, bgvRes, refRes] = await Promise.all([
        api.get(`/recruitment/candidates/${id}`),
        api.get(`/recruitment/interviews?candidate_id=${id}`),
        api.get(`/recruitment/candidates/${id}/timeline`),
        api.get(`/recruitment/offers`),
        api.get(`/recruitment/background-check/${id}`),
        api.get(`/recruitment/candidates/${id}/references`),
      ]);

      setCandidate(candRes.data.data);
      setInterviews(intRes.data.data);
      setTimeline(timelineRes.data.data);
      setBgv(bgvRes.data.data);
      setReferences(refRes.data.data);

      const matchingOffer = offersRes.data.data.find((o: any) => o.candidateId === id);
      if (matchingOffer) {
        setOffer(matchingOffer);
      } else {
        setOffer(null);
      }
    } catch {
      toast.error('Failed to load candidate details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    
    // Fetch AI Interview Session if exists
    const fetchAiSession = async () => {
      if (!id) return;
      try {
        const storedId = localStorage.getItem(`ai_sess_${id}`);
        if (storedId) {
          const res = await api.get(`/ai-interviews/${storedId}`);
          setAiSession(res.data.data);
        }
      } catch {
        setAiSession(null);
      }
    };

    // Fetch Assessment details
    const fetchAssessments = async () => {
      if (!id) return;
      try {
        const [tplsRes, attemptsRes] = await Promise.all([
          api.get('/assessment-engine/templates'),
          api.get(`/assessment-engine/candidate/${id}/attempts`)
        ]);
        setAssessmentTemplates(tplsRes.data.data || []);
        setAssessmentAttempts(attemptsRes.data.data || []);
      } catch {
        // Seed standard template if missing
        try {
          const seedTpl = await api.post('/assessment-engine/templates', {
            title: 'FastAPI Coding Challenge',
            description: 'Evaluate basic knowledge of routing and dependency injections.',
            category: 'coding',
            durationMinutes: 30,
            passingScore: 50.0,
            questionsJson: [
              {
                id: 1,
                questionText: 'What does Depends() accomplish in FastAPI?',
                options: ['Dependency Injection', 'Database Connection', 'Background Task'],
                correctAnswer: 'Dependency Injection'
              },
              {
                id: 2,
                questionText: 'FastAPI stands on top of Starlette and which other library?',
                options: ['Django', 'Pydantic', 'Flask'],
                correctAnswer: 'Pydantic'
              }
            ]
          });
          setAssessmentTemplates([seedTpl.data.data]);
        } catch {}
      }
    };

    fetchAiSession();
    fetchAssessments();
  }, [fetchData, id]);

  const handleStartAssessment = async () => {
    if (!id || !selectedTemplateId) return toast.error('Please select an assessment template');
    setLoadingAssessments(true);
    try {
      await api.post('/assessment-engine/attempts', {
        templateId: selectedTemplateId,
        candidateId: id
      });
      toast.success('Assessment assigned and started!');
      // refresh attempts
      const attemptsRes = await api.get(`/assessment-engine/candidate/${id}/attempts`);
      setAssessmentAttempts(attemptsRes.data.data || []);
    } catch {
      toast.error('Failed to start assessment');
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleGradeAssessment = async (attemptId: string) => {
    setLoadingAssessments(true);
    try {
      await api.post(`/assessment-engine/attempts/${attemptId}/submit`, {
        answersJson: {
          '1': 'Dependency Injection',
          '2': 'Pydantic'
        }
      });
      toast.success('Assessment graded! Score: 100%. Candidate advanced.');
      // refresh candidate and attempts
      fetchData();
      const attemptsRes = await api.get(`/assessment-engine/candidate/${id}/attempts`);
      setAssessmentAttempts(attemptsRes.data.data || []);
    } catch {
      toast.error('Failed to grade assessment');
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleTriggerAiInterview = async () => {
    if (!id || !candidate) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai-interviews', {
        candidateId: id,
        jobPostingId: interviews[0]?.id || id
      });
      const sess = res.data.data;
      localStorage.setItem(`ai_sess_${id}`, sess._id);
      setAiSession(sess);
      setActiveQuestionIdx(0);
      toast.success('AI Automated screening session initiated!');
    } catch {
      // Mock job posting fallback if database has no job posting
      try {
        const dummyReq = await api.post('/recruitment/requisitions', {
          title: 'Role Requisition', departmentName: 'Engineering', budget: 100000
        });
        await api.post(`/recruitment/requisitions/${dummyReq.data.data.id}/approve`, { status: 'approved' });
        const dummyJob = await api.post('/recruitment/jobs', {
          requisitionId: dummyReq.data.data.id,
          title: 'Role Position', departmentName: 'Engineering', location: 'Remote',
          employmentType: 'full_time', experienceYears: 2, skills: 'Python, SQL, React',
          description: 'Position details...'
        });
        const res = await api.post('/ai-interviews', {
          candidateId: id,
          jobPostingId: dummyJob.data.data.id
        });
        const sess = res.data.data;
        localStorage.setItem(`ai_sess_${id}`, sess._id);
        setAiSession(sess);
        setActiveQuestionIdx(0);
        toast.success('AI Automated screening session initiated!');
      } catch {
        toast.error('Failed to trigger AI interview session');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSession || !answerText.trim()) return;
    setSubmittingAnswer(true);
    try {
      const q = aiSession.questions[activeQuestionIdx];
      await api.post(`/ai-interviews/${aiSession._id}/respond`, {
        questionId: q._id,
        responseText: answerText,
        durationTaken: 45
      });
      toast.success('Answer submitted to AI Evaluator!');
      setAnswerText('');
      
      if (activeQuestionIdx < aiSession.questions.length - 1) {
        setActiveQuestionIdx(prev => prev + 1);
        // refresh session data
        const res = await api.get(`/ai-interviews/${aiSession._id}`);
        setAiSession(res.data.data);
      } else {
        // complete session
        const compRes = await api.post(`/ai-interviews/${aiSession._id}/complete`);
        setAiSession(compRes.data.data);
        toast.success('AI Screening completed and scored!');
      }
    } catch {
      toast.error('Failed to submit answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefName) { toast.error('Name is required'); return; }
    try {
      await api.post(`/recruitment/candidates/${id}/references`, {
        candidateId: id,
        referenceName: newRefName,
        referenceCompany: newRefCompany,
        relationshipType: newRefRelation,
        referenceEmail: newRefEmail,
        referencePhone: newRefPhone,
      });
      toast.success('Reference contact added');
      setShowAddRefForm(false);
      setNewRefName('');
      setNewRefCompany('');
      fetchData();
    } catch {
      toast.error('Failed to add reference');
    }
  };

  const handleVerifyReference = async (refId: string, outcome: 'positive' | 'negative') => {
    try {
      await api.post(`/recruitment/references/verify`, {
        referenceId: refId,
        outcome,
        notes: `Checked by recruiter. Outcome: ${outcome}`,
        verifiedBy: 'system',
      });
      toast.success(`Reference verified as ${outcome}`);
      fetchData();
    } catch {
      toast.error('Failed to verify reference');
    }
  };

  const handleUpdateBgv = async (field: keyof Bgv, val: string) => {
    if (!bgv) return;
    const nextBgv = {
      candidateId: id!,
      identityStatus: bgv.identityStatus,
      educationStatus: bgv.educationStatus,
      employmentStatus: bgv.employmentStatus,
      addressStatus: bgv.addressStatus,
      criminalStatus: bgv.criminalStatus,
      referenceStatus: bgv.referenceStatus,
      [field]: val,
    };
    try {
      await api.post(`/recruitment/background-check`, nextBgv);
      toast.success('Background check status updated');
      fetchData();
    } catch {
      toast.error('Failed to update background verification');
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intDateTime) { toast.error('Please select date and time'); return; }
    try {
      await api.post('/recruitment/interview', {
        candidateId: id,
        title: intTitle,
        type: intType,
        scheduledAt: intDateTime,
      });
      toast.success('Interview scheduled');
      setShowScheduleForm(false);
      fetchData();
    } catch {
      toast.error('Failed to schedule interview');
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntId) { toast.error('Select an interview'); return; }
    try {
      await api.post('/recruitment/interview/feedback', {
        interviewId: selectedIntId,
        interviewerName: 'Lead Evaluator',
        technicalRating: parseInt(ratingTech),
        communicationRating: parseInt(ratingComm),
        problemSolvingRating: parseInt(ratingProb),
        culturalFitRating: parseInt(ratingFit),
        comments: feedbackComment,
        recommendation: feedbackRec,
      });
      toast.success('Interview feedback submitted');
      setShowFeedbackForm(false);
      setFeedbackComment('');
      fetchData();
    } catch {
      toast.error('Failed to submit feedback');
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerCtc || !offerJoining) { toast.error('CTC and Joining Date are required'); return; }
    try {
      const created = await api.post('/recruitment/offer', {
        candidateId: id,
        jobTitle: offerTitle || candidate?.fullName,
        ctc: parseFloat(offerCtc),
        fixedPay: parseFloat(offerFixed) || parseFloat(offerCtc) * 0.8,
        variablePay: parseFloat(offerCtc) * 0.2,
        joiningDate: offerJoining,
      });
      // Auto-approve offer
      await api.post('/recruitment/offers/approve', {
        offerId: created.data.data.id,
        status: 'approved',
      });
      toast.success('Offer letter generated and approved');
      setShowOfferForm(false);
      fetchData();
    } catch {
      toast.error('Failed to create offer');
    }
  };

  const handleAcceptOffer = async () => {
    if (!offer) return;
    try {
      await api.post(`/recruitment/offers/${offer.id}/respond`, { response: 'accepted' });
      toast.success('Offer accepted by candidate');
      fetchData();
    } catch {
      toast.error('Failed to update offer response');
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workEmail) { toast.error('Work Email is required'); return; }
    try {
      await api.post('/recruitment/convert-to-employee', {
        candidateId: id,
        departmentName: empDept,
        designationName: empDesg,
        dateOfJoining: offer?.joiningDate || new Date().toISOString().split('T')[0],
        workEmail,
      });
      toast.success('Converted to Employee successfully!');
      setShowConvertForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to convert candidate to employee');
    }
  };

  const handleRunAtsScoring = async () => {
    if (!candidate || !interviews) return;
    try {
      await api.post('/recruitment/ats-score', {
        candidateId: id,
        jobPostingId: interviews[0]?.id || id, // fallback
      });
      toast.success('ATS score recalculated');
      fetchData();
    } catch {
      // Create a mockup job if no posting exists to score against
      try {
        const dummyReq = await api.post('/recruitment/requisitions', {
          title: 'Role Requisition', departmentName: 'Engineering', budget: 100000
        });
        await api.post(`/recruitment/requisitions/${dummyReq.data.data.id}/approve`, { status: 'approved' });
        const dummyJob = await api.post('/recruitment/jobs', {
          requisitionId: dummyReq.data.data.id,
          title: 'Role Position', departmentName: 'Engineering', location: 'Remote',
          employmentType: 'full_time', experienceYears: 2, skills: 'Python, SQL, React',
          description: 'Position details...'
        });
        await api.post('/recruitment/ats-score', {
          candidateId: id,
          jobPostingId: dummyJob.data.data.id,
        });
        toast.success('ATS score calculated against dynamic job matching');
        fetchData();
      } catch {
        toast.error('Failed to calculate ATS score');
      }
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Candidate Profile">
        <p className="text-center py-20 text-ag-ink-3">Loading candidate profile...</p>
      </PageContainer>
    );
  }

  if (!candidate) {
    return (
      <PageContainer title="Candidate Profile">
        <p className="text-center py-20 text-ag-ink-3">Candidate not found.</p>
      </PageContainer>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <User size={16} /> },
    { key: 'resume', label: 'Resume', icon: <FileText size={16} /> },
    { key: 'ai', label: 'AI Analysis', icon: <Trophy size={16} /> },
    { key: 'assessments', label: 'Assessments', icon: <DotsThreeOutline size={16} /> },
    { key: 'ai_interviews', label: 'AI Interviews', icon: <Chats size={16} /> },
    { key: 'interviews', label: 'Interviews', icon: <CalendarBlank size={16} /> },
    { key: 'documents', label: 'BGV Checks', icon: <ShieldCheck size={16} /> },
    { key: 'communications', label: 'Emails', icon: <Chats size={16} /> },
    { key: 'timeline', label: 'Timeline', icon: <Clock size={16} /> },
    { key: 'offer', label: 'Offer Letter', icon: <FileText size={16} /> },
  ] as const;

  return (
    <PageContainer
      title={candidate.fullName}
      subtitle={`ATS Score: ${candidate.atsScore}% | Notice Period: ${candidate.noticePeriod} days`}
      actions={
        <div className="flex gap-3">
          <Link to="/recruitment">
            <Button variant="secondary" icon={<ArrowLeft size={18} />}>Back to Pipeline</Button>
          </Link>
          <Button onClick={handleRunAtsScoring} variant="secondary">Recalculate ATS</Button>
          {candidate.status === 'onboarding' && (
            <Button onClick={() => setShowConvertForm(true)} icon={<Check size={18} />}>Convert to Employee</Button>
          )}
        </div>
      }
    >
      {/* ── Tabs Navigation ── */}
      <div className="flex gap-1.5 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeTab === t.key ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Convert to Employee Modal/Form ── */}
      {showConvertForm && (
        <Card className="p-5 max-w-lg mb-8 border-2 border-ag-primary/40">
          <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4 flex items-center justify-between">
            <span>Convert Accepted Candidate to Employee</span>
            <Button variant="ghost" size="sm" onClick={() => setShowConvertForm(false)} icon={<X size={14} />} />
          </h3>
          <form onSubmit={handleConvert} className="space-y-4">
            <Input label="Work Email *" type="email" value={workEmail} onChange={e => setWorkEmail(e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Department"
                value={empDept}
                onChange={e => setEmpDept(e.target.value)}
                options={['Engineering', 'HR', 'Finance', 'Marketing', 'Sales'].map(d => ({ value: d, label: d }))}
              />
              <Input label="Designation" value={empDesg} onChange={e => setEmpDesg(e.target.value)} />
            </div>
            <Button type="submit">Convert to Employee Record</Button>
          </form>
        </Card>
      )}

      {/* ── Tab Content: Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-5 space-y-6">
            <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-2">Candidate Profile details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-ag-ink-3 text-xs uppercase font-bold">Email</p>
                <p className="text-ag-ink font-semibold mt-1">{candidate.email}</p>
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs uppercase font-bold">Phone</p>
                <p className="text-ag-ink font-semibold mt-1">{candidate.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs uppercase font-bold">Address</p>
                <p className="text-ag-ink font-semibold mt-1">{candidate.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs uppercase font-bold">Current Company</p>
                <p className="text-ag-ink font-semibold mt-1">{candidate.currentCompany || 'N/A'}</p>
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs uppercase font-bold">Current CTC (LPA)</p>
                <p className="text-ag-ink font-semibold mt-1">₹{candidate.currentCtc?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs uppercase font-bold">Expected CTC (LPA)</p>
                <p className="text-ag-ink font-semibold mt-1">₹{candidate.expectedCtc?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs uppercase font-bold">Preferred Location</p>
                <p className="text-ag-ink font-semibold mt-1">{candidate.preferredLocation || 'N/A'}</p>
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs uppercase font-bold">Pipeline Stage</p>
                <div className="mt-1"><StatusBadge status={candidate.status} /></div>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-2">Links & Source</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-ag-ink-3 text-xs font-bold uppercase">Candidate Source</p>
                <span className="inline-block mt-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-ag-surface-2 border border-ag-border text-ag-ink capitalize">
                  {candidate.source.replace('_', ' ')}
                </span>
                {candidate.applicationSource && <p className="text-xs text-ag-ink-3 mt-1">Detail: {candidate.applicationSource}</p>}
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs font-bold uppercase">LinkedIn</p>
                {candidate.linkedinUrl ? (
                  <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-ag-primary hover:underline block mt-1 truncate">{candidate.linkedinUrl}</a>
                ) : 'N/A'}
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs font-bold uppercase">GitHub</p>
                {candidate.githubUrl ? (
                  <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="text-ag-primary hover:underline block mt-1 truncate">{candidate.githubUrl}</a>
                ) : 'N/A'}
              </div>
              <div>
                <p className="text-ag-ink-3 text-xs font-bold uppercase">Portfolio</p>
                {candidate.portfolioUrl ? (
                  <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-ag-primary hover:underline block mt-1 truncate">{candidate.portfolioUrl}</a>
                ) : 'N/A'}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab Content: Resume ── */}
      {activeTab === 'resume' && (
        <Card className="p-5">
          <div className="flex items-center justify-between border-b border-ag-border pb-3 mb-4">
            <h3 className="font-bold text-base text-ag-ink">Candidate Resume Document</h3>
            {candidate.resumeUrl && (
              <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">Download PDF</Button>
              </a>
            )}
          </div>
          {candidate.resumeText ? (
            <pre className="bg-ag-surface-2/65 p-4 rounded-xl border border-ag-border text-xs text-ag-ink font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
              {candidate.resumeText}
            </pre>
          ) : (
            <p className="text-center py-10 text-ag-ink-3">No resume text content extracted. Copy & paste resume details on apply to parse.</p>
          )}
        </Card>
      )}

      {/* ── Tab Content: AI Analysis ── */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 md:col-span-2 space-y-4">
            <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-2">Skills Extracted</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map(s => (
                <span key={s} className="px-3 py-1.5 rounded-lg bg-ag-primary/10 text-ag-primary font-bold text-xs uppercase tracking-wide">
                  {s}
                </span>
              ))}
              {candidate.skills.length === 0 && <p className="text-xs text-ag-ink-3">No skills extracted from resume.</p>}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-2">Hiring Recommendation</h3>
            <div className="text-center py-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-xl font-black mb-3 ${
                candidate.atsScore >= 70 ? 'bg-green-100 text-green-700' :
                candidate.atsScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {candidate.atsScore}%
              </div>
              <p className="font-bold text-sm text-ag-ink capitalize">ATS Rating: {candidate.atsScore >= 60 ? 'Shortlist' : 'Review'}</p>
              <p className="text-xs text-ag-ink-3 mt-1.5 leading-relaxed">AI screening recommends proceeding to a technical coding assessment round based on standard resume key matches.</p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab Content: Assessments ── */}
      {activeTab === 'assessments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 md:col-span-2 space-y-6">
            <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Domain Assessments Console</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-end bg-ag-surface-2/45 p-4 rounded-xl border border-ag-border">
                <div className="flex-1">
                  <Select
                    label="Select Assessment Test Template"
                    value={selectedTemplateId}
                    onChange={e => setSelectedTemplateId(e.target.value)}
                    options={[
                      { value: '', label: 'Select template...' },
                      ...assessmentTemplates.map(t => ({ value: t._id, label: t.title }))
                    ]}
                  />
                </div>
                <Button onClick={handleStartAssessment} loading={loadingAssessments} icon={<Plus size={16} />}>
                  Assign Test
                </Button>
              </div>

              {/* Attempts list */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-ag-ink-2">Candidate Attempts Log</h4>
                {assessmentAttempts.length === 0 ? (
                  <p className="text-xs text-ag-ink-3">No attempts logged for this candidate.</p>
                ) : (
                  assessmentAttempts.map((att: any) => (
                    <div key={att._id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-ag-ink">
                          {assessmentTemplates.find(t => t._id === att.templateId)?.title || 'FastAPI Coding Challenge'}
                        </h4>
                        <p className="text-xs text-ag-ink-3 mt-1">
                          Started: {att.startedAt ? new Date(att.startedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          att.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {att.status} {att.score !== null ? `(${att.score}%)` : ''}
                        </span>
                        {att.status === 'started' && (
                          <Button size="sm" onClick={() => handleGradeAssessment(att._id)} loading={loadingAssessments}>
                            Mock Candidate Submission
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card className="p-5 h-fit space-y-4">
            <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-2">Hiring Rules & Metrics</h3>
            <div className="space-y-3 text-xs text-ag-ink-3">
              <p>🎯 <strong>Passing Score Threshold:</strong> Candidates passing with score ≥ template target (e.g. 50%) automatically advance to the technical interview pipeline stage.</p>
              <p>⚡ <strong>ATS Sync:</strong> Test score recalculates the candidate's core ATS match ratio automatically.</p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab Content: AI Interviews ── */}
      {activeTab === 'ai_interviews' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 md:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-ag-border pb-3">
              <h3 className="font-bold text-base text-ag-ink">Automated AI Interview Session</h3>
              {!aiSession && (
                <Button onClick={handleTriggerAiInterview} loading={aiLoading} icon={<Plus size={16} />}>
                  Trigger AI Interview
                </Button>
              )}
            </div>

            {!aiSession ? (
              <div className="text-center py-12 text-ag-ink-3">
                <p className="text-sm font-semibold">No AI interview session active for this candidate.</p>
                <p className="text-xs max-w-sm mx-auto mt-1">Initiate an automated voice/text interview to evaluate technical depth, behavior, and scenario handling.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 border border-ag-border rounded-xl bg-ag-surface-2/50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-ag-ink">Session Status: {aiSession.status.toUpperCase()}</h4>
                    {aiSession.overallScore !== null && aiSession.overallScore !== undefined && (
                      <p className="text-xs text-ag-ink-3 mt-1">Overall Core Assessment Score: {aiSession.overallScore} / 10</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    aiSession.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {aiSession.status}
                  </span>
                </div>

                {aiSession.status === 'in_progress' && aiSession.questions?.length > 0 && (
                  <div className="p-4 border border-ag-primary/20 bg-ag-primary/5 rounded-xl space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ag-primary">Question {activeQuestionIdx + 1} of {aiSession.questions.length}</span>
                      <h4 className="font-bold text-sm text-ag-ink mt-1">
                        {aiSession.questions[activeQuestionIdx]?.questionText}
                      </h4>
                    </div>
                    <form onSubmit={handleSubmitAnswer} className="space-y-3">
                      <textarea
                        value={answerText}
                        onChange={e => setAnswerText(e.target.value)}
                        placeholder="Type candidate's verbal response here..."
                        className="w-full min-h-[100px] p-3 text-xs border rounded bg-white text-ag-ink focus:border-ag-primary focus:outline-none"
                      />
                      <Button type="submit" loading={submittingAnswer}>
                        {activeQuestionIdx < aiSession.questions.length - 1 ? 'Submit & Next Question' : 'Submit & Complete Evaluation'}
                      </Button>
                    </form>
                  </div>
                )}

                {/* Submissions & Analysis */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-ag-ink-2">Evaluation Transcript & AI Analysis</h4>
                  {(!aiSession.responses || aiSession.responses.length === 0) ? (
                    <p className="text-xs text-ag-ink-3">No responses recorded yet.</p>
                  ) : (
                    aiSession.responses.map((resp: any, idx: number) => {
                      const qText = aiSession.questions?.find((q: any) => q._id === resp.questionId)?.questionText || 'Question';
                      return (
                        <div key={idx} className="p-4 border border-ag-border rounded-xl space-y-2.5">
                          <p className="text-xs font-semibold text-ag-ink-2">Q: {qText}</p>
                          <p className="text-xs text-ag-ink font-mono bg-ag-surface-2/60 p-2 rounded">A: "{resp.responseText}"</p>
                          <div className="flex gap-4 text-[10px] text-ag-ink-3 font-semibold mt-1">
                            <span className="text-ag-primary">Correctness: {resp.correctnessScore}/10</span>
                            <span className="text-ag-mint font-bold">Confidence: {Math.round(resp.confidenceScore * 100)}%</span>
                            <span className="text-ag-amber font-bold">Sentiment: {Math.round(resp.sentimentScore * 100)}%</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 h-fit space-y-4">
            <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-2">AI Interview Parameters</h3>
            <div className="space-y-3 text-xs text-ag-ink-3">
              <p>🤖 <strong>Auto-seeding Engine:</strong> Spawns behavioral, technical, and situational prompts based on job posting definitions.</p>
              <p>📊 <strong>Keywords analysis:</strong> Checks context richness, vocabulary length, and technical confidence ratios.</p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab Content: Interviews ── */}
      {activeTab === 'interviews' && (
        <div className="space-y-6">
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowScheduleForm(!showScheduleForm)}>Schedule Interview</Button>
            <Button onClick={() => setShowFeedbackForm(!showFeedbackForm)}>Add Evaluation</Button>
          </div>

          {showScheduleForm && (
            <Card className="p-5 max-w-md border border-ag-primary/20 bg-ag-surface-2/40">
              <h4 className="font-bold text-sm text-ag-ink mb-3">Schedule Round</h4>
              <form onSubmit={handleSchedule} className="space-y-4">
                <Input label="Title" value={intTitle} onChange={e => setIntTitle(e.target.value)} />
                <Select label="Type" value={intType} onChange={e => setIntType(e.target.value)}
                  options={[
                    { value: 'technical', label: 'Technical' },
                    { value: 'hr', label: 'HR Screening' },
                    { value: 'panel', label: 'Panel Evaluation' }
                  ]} />
                <Input label="Datetime" type="datetime-local" value={intDateTime} onChange={e => setIntDateTime(e.target.value)} />
                <Button type="submit">Schedule Round</Button>
              </form>
            </Card>
          )}

          {showFeedbackForm && (
            <Card className="p-5 max-w-md border border-ag-primary/20 bg-ag-surface-2/40">
              <h4 className="font-bold text-sm text-ag-ink mb-3">Record Interview Evaluation Feedback</h4>
              <form onSubmit={handleFeedback} className="space-y-4">
                <Select label="Round" value={selectedIntId} onChange={e => setSelectedIntId(e.target.value)}
                  options={[{ value: '', label: 'Select round...' }, ...interviews.map(i => ({ value: i.id, label: i.title }))]} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Tech (1-5)" type="number" value={ratingTech} onChange={e => setRatingTech(e.target.value)} />
                  <Input label="Comm (1-5)" type="number" value={ratingComm} onChange={e => setRatingComm(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Problem Solving (1-5)" type="number" value={ratingProb} onChange={e => setRatingProb(e.target.value)} />
                  <Input label="Culture Fit (1-5)" type="number" value={ratingFit} onChange={e => setRatingFit(e.target.value)} />
                </div>
                <Select label="Recommendation" value={feedbackRec} onChange={e => setFeedbackRec(e.target.value)}
                  options={[{ value: 'hire', label: 'Recommend Hire' }, { value: 'no_hire', label: 'No Hire' }, { value: 'hold', label: 'On Hold' }]} />
                <div>
                  <label className="text-xs font-semibold block mb-1">Evaluator Comments</label>
                  <textarea value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} className="w-full text-sm border p-2 rounded bg-ag-surface-2 text-ag-ink" />
                </div>
                <Button type="submit">Save Evaluation</Button>
              </form>
            </Card>
          )}

          <Card>
            <CardHeader title="Interviews History" subtitle="Scheduled and completed evaluator reviews" />
            <div className="p-4 space-y-3">
              {interviews.length === 0 && <p className="text-center py-6 text-ag-ink-3 text-xs">No interviews scheduled yet.</p>}
              {interviews.map(i => (
                <div key={i.id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-ag-ink">{i.title}</h4>
                    <p className="text-xs text-ag-ink-3 mt-0.5">{new Date(i.scheduledAt).toLocaleString()} ({i.timezone})</p>
                    {i.videoLink && <a href={i.videoLink} target="_blank" rel="noopener noreferrer" className="text-xs text-ag-primary hover:underline mt-1 block">{i.videoLink}</a>}
                  </div>
                  <div className="text-right">
                    <StatusBadge status={i.status} />
                    {i.feedback && i.feedback.map((f, idx) => (
                      <p key={idx} className="text-xs text-ag-ink font-semibold mt-1 uppercase text-ag-primary">{f.recommendation}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab Content: Documents / BGV ── */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Background Verification Checks" subtitle="Multi-check BGV screening status dashboard (§43)" />
            <div className="p-4 grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: 'Identity', field: 'identityStatus' as const, status: bgv?.identityStatus || 'pending' },
                { label: 'Education', field: 'educationStatus' as const, status: bgv?.educationStatus || 'pending' },
                { label: 'Employment', field: 'employmentStatus' as const, status: bgv?.employmentStatus || 'pending' },
                { label: 'Address', field: 'addressStatus' as const, status: bgv?.addressStatus || 'pending' },
                { label: 'Criminal Record', field: 'criminalStatus' as const, status: bgv?.criminalStatus || 'pending' },
                { label: 'Reference check', field: 'referenceStatus' as const, status: bgv?.referenceStatus || 'pending' },
              ].map(check => (
                <div key={check.label} className="p-3 border border-ag-border rounded-xl bg-ag-surface-2/40 text-center">
                  <p className="text-[10px] text-ag-ink-3 uppercase font-bold tracking-wide">{check.label}</p>
                  <div className="mt-2"><StatusBadge status={check.status} /></div>
                  <div className="mt-3 flex gap-1 justify-center">
                    <button onClick={() => handleUpdateBgv(check.field, 'passed')} className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-700 text-[10px] font-bold">Pass</button>
                    <button onClick={() => handleUpdateBgv(check.field, 'failed')} className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold">Fail</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* References */}
          <Card className="p-5">
            <div className="flex items-center justify-between border-b border-ag-border pb-3 mb-4">
              <h3 className="font-bold text-base text-ag-ink">Professional References</h3>
              <Button size="sm" onClick={() => setShowAddRefForm(!showAddRefForm)} icon={<Plus size={16} />}>Add Reference</Button>
            </div>

            {showAddRefForm && (
              <form onSubmit={handleAddReference} className="space-y-4 max-w-md border p-4 rounded-xl bg-ag-surface-2/50 mb-4">
                <Input label="Name *" value={newRefName} onChange={e => setNewRefName(e.target.value)} required />
                <Input label="Company" value={newRefCompany} onChange={e => setNewRefCompany(e.target.value)} />
                <Select label="Relationship" value={newRefRelation} onChange={e => setNewRefRelation(e.target.value)}
                  options={[{ value: 'manager', label: 'Former Manager' }, { value: 'colleague', label: 'Former Colleague' }]} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Email" type="email" value={newRefEmail} onChange={e => setNewRefEmail(e.target.value)} />
                  <Input label="Phone" value={newRefPhone} onChange={e => setNewRefPhone(e.target.value)} />
                </div>
                <Button type="submit">Save Contact</Button>
              </form>
            )}

            <div className="space-y-3">
              {references.length === 0 && <p className="text-xs text-ag-ink-3 py-4 text-center">No references registered.</p>}
              {references.map(r => (
                <div key={r.id} className="p-3 border border-ag-border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-ag-ink">{r.referenceName}</p>
                    <p className="text-[10px] text-ag-ink-3 mt-0.5">{r.company || 'N/A'} — {r.relationship}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    <button onClick={() => handleVerifyReference(r.id, 'positive')} className="text-[10px] px-2 py-1 rounded bg-ag-primary text-white font-bold">Pass</button>
                    <button onClick={() => handleVerifyReference(r.id, 'negative')} className="text-[10px] px-2 py-1 rounded bg-ag-surface-2 hover:bg-ag-surface-3 text-ag-ink-2 font-bold">Fail</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab Content: Communications ── */}
      {activeTab === 'communications' && (
        <Card className="p-5">
          <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Emails Center</h3>
          <div className="space-y-4">
            <div className="p-4 border border-ag-border rounded-xl bg-ag-surface-2/30">
              <span className="text-[10px] bg-ag-primary/10 text-ag-primary font-bold px-2 py-0.5 rounded">SENT</span>
              <h4 className="font-bold text-sm text-ag-ink mt-2">Application Received Acknowledgement</h4>
              <p className="text-xs text-ag-ink-3 mt-1">To: {candidate.email} — Sent automatically on apply</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Tab Content: Timeline ── */}
      {activeTab === 'timeline' && (
        <Card className="p-5">
          <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Immutable Audit Trail</h3>
          <div className="relative border-l-2 border-ag-border ml-3 pl-6 space-y-6">
            {timeline.map((event, idx) => (
              <div key={event.id || idx} className="relative">
                <div className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-ag-primary" />
                <p className="text-xs font-bold text-ag-primary tracking-wide">{event.action}</p>
                {event.details && <p className="text-xs text-ag-ink mt-0.5">{event.details}</p>}
                <p className="text-[10px] text-ag-ink-3 mt-1">Performed by {event.performedBy} — {new Date(event.at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Tab Content: Offer ── */}
      {activeTab === 'offer' && (
        <div className="space-y-6">
          {!offer ? (
            <Card className="p-5 max-w-lg">
              <h3 className="font-bold text-base text-ag-ink border-b border-ag-border pb-3 mb-4">Generate Offer Letter</h3>
              <form onSubmit={handleCreateOffer} className="space-y-4">
                <Input label="Offer Position Title" value={offerTitle} onChange={e => setOfferTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="CTC (LPA) *" type="number" value={offerCtc} onChange={e => setOfferCtc(e.target.value)} required />
                  <Input label="Fixed Pay" type="number" value={offerFixed} onChange={e => setOfferFixed(e.target.value)} />
                </div>
                <Input label="Joining Date *" type="date" value={offerJoining} onChange={e => setOfferJoining(e.target.value)} required />
                <Button type="submit">Generate & Approve Offer</Button>
              </form>
            </Card>
          ) : (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-ag-border pb-3">
                <div>
                  <h3 className="font-bold text-lg text-ag-ink">{offer.jobTitle}</h3>
                  <p className="text-xs text-ag-ink-3 mt-0.5">Offer letter ver {offer.version} — <StatusBadge status={offer.status} /></p>
                </div>
                {offer.status === 'approved' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAcceptOffer} icon={<Check size={14} />}>Accept Offer</Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-ag-ink-3 uppercase font-bold">CTC (LPA)</p>
                  <p className="text-ag-ink font-bold mt-1 text-sm">₹{offer.ctc?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-ag-ink-3 uppercase font-bold">Fixed Base</p>
                  <p className="text-ag-ink font-bold mt-1 text-sm">₹{offer.fixedPay?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-ag-ink-3 uppercase font-bold">Joining Date</p>
                  <p className="text-ag-ink font-bold mt-1 text-sm">{offer.joiningDate}</p>
                </div>
                <div>
                  <p className="text-ag-ink-3 uppercase font-bold">Probation Period</p>
                  <p className="text-ag-ink font-bold mt-1 text-sm">{offer.probationPeriod} days</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}

