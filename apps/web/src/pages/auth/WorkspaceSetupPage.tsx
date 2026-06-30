import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { authService } from '@/services/api.service';
import {
  Sparkle, CheckCircle, Plus, Trash, Globe, Briefcase,
  Users, Gear, ArrowRight, ArrowLeft, EnvelopeSimple
} from '@phosphor-icons/react';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { toast } from 'sonner';

export default function WorkspaceSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setAccessToken } = useAuthStore();

  // Onboarding registration state passed from signup page
  const signupData = location.state?.signupData || {
    firstName: 'Priya',
    lastName: 'Sharma',
    companyName: 'Acme Technologies',
    email: 'priya.sharma@worksphere.com',
    phone: '+91 80 4567 8901',
    companySize: '21-99',
    country: 'India'
  };

  const [step, setStep] = useState(1);

  // Step 1: Workspace Name & URL
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');

  // Step 2: Organization details
  const [industry, setIndustry] = useState('');
  const [roleDept, setRoleDept] = useState('');

  // Step 3: Invite Team Members
  const [invites, setInvites] = useState<string[]>(['']);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Auto-generate workspace slug when name changes
  useEffect(() => {
    if (step === 1) {
      const slug = workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
        .replace(/\s+/g, '-')         // replace spaces with hyphens
        .replace(/-+/g, '-')          // collapse multiple hyphens
        .trim();
      setWorkspaceSlug(slug);
    }
  }, [workspaceName, step]);

  // Set default workspace name based on company name
  useEffect(() => {
    if (signupData.companyName && !workspaceName) {
      setWorkspaceName(`${signupData.companyName} HQ`);
    }
  }, [signupData.companyName]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!workspaceName.trim()) {
        toast.error('Please enter a workspace name');
        return;
      }
      if (!workspaceSlug.trim()) {
        toast.error('Please enter a workspace URL');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!industry) {
        toast.error('Please select your organization industry');
        return;
      }
      if (!roleDept) {
        toast.error('Please select your department role');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Filter out empty invite emails and check validation
      const activeEmails = invites.filter(email => email.trim() !== '');
      const invalidEmail = activeEmails.find(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      if (invalidEmail) {
        toast.error(`"${invalidEmail}" is not a valid email address`);
        return;
      }
      
      // Simulate setup configuration compilation
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep(4);
      }, 1500);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAddInvite = () => {
    setInvites([...invites, '']);
  };

  const handleInviteChange = (index: number, val: string) => {
    const updated = [...invites];
    updated[index] = val;
    setInvites(updated);
  };

  const handleRemoveInvite = (index: number) => {
    const updated = invites.filter((_, i) => i !== index);
    setInvites(updated.length > 0 ? updated : ['']);
  };

  const handleFinishSetup = async () => {
    try {
      setLoading(true);
      const signupPayload = {
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        companyName: signupData.companyName,
        email: signupData.email,
        phone: signupData.phone,
        companySize: signupData.companySize,
        country: signupData.country,
        password: signupData.password,
        workspaceSlug: workspaceSlug,
        industry: industry,
        roleDept: roleDept
      };

      const { user, accessToken } = await authService.signup(signupPayload);

      setUser(user);
      setAccessToken(accessToken);
      
      toast.success('Workspace created and initialized successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Workspace setup failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Percent calculation for the progress bar
  const progressPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

  return (
    <div className="min-h-screen w-full flex bg-ag-canvas items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-radial-gradient from-ag-primary/5 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-radial-gradient from-ag-indigo/5 to-transparent blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-xl space-y-6 relative z-10">
        
        {/* Main logo header */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-ag-primary text-white flex items-center justify-center font-display font-black text-xl shadow-md">
            WS
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-ag-ink mt-2">WorkSphere ERP</h1>
          <p className="text-xs text-ag-ink-3 uppercase font-bold tracking-wider">Initialize Workspace</p>
        </div>

        {/* Wizard Card Container */}
        <div className="p-8 sm:p-10 rounded-card border border-ag-border bg-white/70 backdrop-blur-xl shadow-lvl3 space-y-6">
          
          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold text-ag-ink-2">
              <span className="uppercase font-bold tracking-wider text-ag-primary">Step {step} of 4</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <ProgressBar value={progressPercent} />
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Workspace Name & URL */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-lg text-ag-ink">Name your Workspace</h3>
                  <p className="text-xs text-ag-ink-3">A workspace is where your entire organization collaborates. Choose a descriptive name.</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Workspace Name"
                    value={workspaceName}
                    placeholder="Acme Technologies HQ"
                    onChange={e => setWorkspaceName(e.target.value)}
                    required
                  />

                  <div className="w-full flex flex-col gap-1.5">
                    <label className="ag-label ag-label--required">Workspace URL</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-xs font-medium text-ag-ink-3 select-none">
                        worksphere.com/w/
                      </div>
                      <input
                        type="text"
                        value={workspaceSlug}
                        placeholder="acme-technologies-hq"
                        onChange={e => setWorkspaceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        className="ag-input font-mono text-xs"
                        style={{ paddingLeft: '135px' }}
                        required
                      />
                    </div>
                    <span className="text-[10px] text-ag-ink-3">Must be lowercase and contain only alphanumeric characters and hyphens.</span>
                  </div>
                </div>

                <Button fullWidth onClick={handleNextStep} iconRight={<ArrowRight size={16} />}>
                  Next: Organization Details
                </Button>
              </motion.div>
            )}

            {/* Step 2: Organization Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-lg text-ag-ink">Organization Details</h3>
                  <p className="text-xs text-ag-ink-3">Help us customize your workspace configuration rules, statutory defaults, and layout grids.</p>
                </div>

                <div className="space-y-4">
                  {/* Industry Dropdown */}
                  <div className="w-full flex flex-col gap-1.5">
                    <label className="ag-label ag-label--required">Industry Type</label>
                    <div className="relative flex items-center">
                      <select
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                        className="ag-input appearance-none pr-10 cursor-pointer"
                        required
                      >
                        <option value="">Select industry...</option>
                        <option value="tech">Technology & Software</option>
                        <option value="finance">Financial Services</option>
                        <option value="healthcare">Healthcare & Biotech</option>
                        <option value="retail">Retail & E-commerce</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="services">Consulting & Services</option>
                        <option value="other">Others</option>
                      </select>
                      <div className="absolute right-3.5 text-ag-ink-3 pointer-events-none flex items-center justify-center">
                        <Briefcase size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Role / Dept Dropdown */}
                  <div className="w-full flex flex-col gap-1.5">
                    <label className="ag-label ag-label--required">Your Role / Department</label>
                    <div className="relative flex items-center">
                      <select
                        value={roleDept}
                        onChange={e => setRoleDept(e.target.value)}
                        className="ag-input appearance-none pr-10 cursor-pointer"
                        required
                      >
                        <option value="">Select role...</option>
                        <option value="hr">HR & Talent People</option>
                        <option value="engineering">Engineering / Product Developer</option>
                        <option value="operations">Operations & Facilities</option>
                        <option value="executive">Founder / C-Level Executive</option>
                        <option value="finance">Finance & Payroll Manager</option>
                        <option value="other">Others</option>
                      </select>
                      <div className="absolute right-3.5 text-ag-ink-3 pointer-events-none flex items-center justify-center">
                        <Users size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button variant="ghost" onClick={handlePrevStep} icon={<ArrowLeft size={16} />}>
                    Back
                  </Button>
                  <Button className="col-span-2" onClick={handleNextStep} iconRight={<ArrowRight size={16} />}>
                    Next: Invite Members
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Invite Team Members */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-lg text-ag-ink">Invite your Team</h3>
                  <p className="text-xs text-ag-ink-3">Invite colleagues to join your WorkSphere workspace. You can also invite them later from dashboard.</p>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {invites.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        value={email}
                        onChange={e => handleInviteChange(idx, e.target.value)}
                        icon={<EnvelopeSimple size={16} />}
                      />
                      {invites.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInvite(idx)}
                          className="p-3 border border-ag-border hover:bg-ag-rose-bg hover:text-ag-accent-coral rounded-xl transition-colors shrink-0 text-ag-ink-3"
                          title="Remove invitation"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddInvite}
                  className="inline-flex items-center gap-1 text-xs font-bold text-ag-primary hover:text-ag-primary-hover focus:outline-none transition-colors border border-dashed border-ag-border-strong w-full justify-center py-2.5 rounded-xl bg-ag-primary-light/30"
                >
                  <Plus size={14} />
                  Add Team Member
                </button>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Button variant="ghost" onClick={handlePrevStep} icon={<ArrowLeft size={16} />}>
                    Back
                  </Button>
                  <Button className="col-span-2" loading={loading} onClick={handleNextStep} iconRight={<ArrowRight size={16} />}>
                    Complete Workspace Setup
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Setup Complete */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-ag-emerald flex items-center justify-center mx-auto shadow-lvl1">
                  <svg className="w-8 h-8 text-ag-accent-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.1, ease: 'easeInOut' }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-2xl text-ag-ink">Workspace Ready!</h3>
                  <p className="text-xs text-ag-ink-2 max-w-sm mx-auto leading-relaxed">
                    Your environment for <strong>{signupData.companyName || 'Workspace'}</strong> has been initialized. Compliance configurations, statutory ledgers, and directory systems are loaded.
                  </p>
                </div>

                {/* Info summary card */}
                <div className="p-4 rounded-2xl bg-ag-surface-2/45 border border-ag-border text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Workspace Slug:</span>
                    <strong className="text-ag-ink font-mono">/w/{workspaceSlug}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Administrator:</span>
                    <strong className="text-ag-ink">{signupData.firstName} {signupData.lastName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-ink-3">Work Email:</span>
                    <strong className="text-ag-ink font-mono">{signupData.email}</strong>
                  </div>
                </div>

                <Button fullWidth size="lg" onClick={handleFinishSetup} iconRight={<Sparkle size={18} />}>
                  Launch Workspace
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brand footer quote */}
        <p className="text-center text-[10px] font-medium text-ag-ink-3 tracking-wider flex items-center justify-center gap-1.5">
          <CheckCircle size={14} className="text-ag-accent-mint" />
          WorkSphere Handcrafted OS Engine v1.0
        </p>
      </div>
    </div>
  );
}
