import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import CountUp from 'react-countup';
import {
  ArrowRight, Sparkle, CheckCircle, Clock, Calendar, Users, ShieldCheck, Cpu, Receipt,
  Fingerprint, GitBranch, Lock, ArrowUpRight, Quotes, UserPlus, CurrencyDollar, Globe, CaretDown,
  CalendarCheck, TrendUp, Airplane, Package, FileText, ChartBar, Bell, Shield, MagnifyingGlass, Building,
  Wallet, Laptop, ChartPie
} from '@phosphor-icons/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { StatCard } from '@/components/ui/StatCard/StatCard';
import { LogoLoop } from '@/components/ui/LogoLoop/LogoLoop';
import { EmployeeJourney } from '@/components/ui/EmployeeJourney/EmployeeJourney';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/animations';
import { MarketingFooter } from '@/components/layout/MarketingFooter/MarketingFooter';
import { Logo } from '@/components/ui/Logo/Logo';
import heroBg from '@/assets/hero-bg.png';
import statsBg from '@/assets/stats-bg.png';
// --- SEED DATA ---
const retentionData = [
  { month: 'Q1', Engineering: 98, Product: 96, Sales: 92, Operations: 90 },
  { month: 'Q2', Engineering: 97, Product: 95, Sales: 91, Operations: 88 },
  { month: 'Q3', Engineering: 99, Product: 97, Sales: 94, Operations: 91 },
  { month: 'Q4', Engineering: 99, Product: 98, Sales: 95, Operations: 93 },
];

const workflowSteps = [
  { id: 'req', label: 'Leave Request',       desc: 'Applied by Anita R.',               status: 'done' },
  { id: 'mgr', label: 'Manager Approval',    desc: 'Approved by VP Operations',         status: 'done' },
  { id: 'com', label: 'Payroll Clearance',   desc: 'Finance verified ✓',               status: 'done' },
  { id: 'ast', label: 'Asset Return Check',  desc: 'Laptop · Access card ✓',           status: 'active' },
  { id: 'doc', label: 'Document Generation', desc: 'Relieving letter queued',           status: 'active' },
  { id: 'pay', label: 'Final Settlement',    desc: 'Appended to June payout',          status: 'pending' }
];

const successStories = [
  {
    company: 'Acme Conglomerate',
    size: '12,000+ nodes',
    industry: 'Technology & Logistics',
    tag: 'TECHNOLOGY',
    challenge: 'Scattered employee registers and lag in payroll adjustments across multi-region hubs.',
    solution: 'Unified directory nodes mapping directly to real-time compliance ledger hooks.',
    impact: '72% Payroll Speed · 45% Compliance Load ↓'
  },
  {
    company: 'Globex Hubs',
    size: '4,500+ nodes',
    industry: 'Corporate Consultancies',
    tag: 'CONSULTANCY',
    challenge: 'Manual expense auditing and regularizations causing leave inflation.',
    solution: 'Zero-hardware geo-fenced biometric punch mapping and AI shift optimization.',
    impact: '4x Approval Speed · 93% Leave Accuracy ↑'
  },
  {
    company: 'Vertex Industries',
    size: '8 plants',
    industry: 'Manufacturing',
    tag: 'MANUFACTURING',
    challenge: 'Paper-based leave + asset tracking across 8 plants.',
    solution: 'Unified leave calendar, GPS attendance, and QR asset returns.',
    impact: '60% HR Ops Reduction · 100% Asset Accountability'
  }
];

const mockChartData = [
  { month: 'Jan', payroll: 2.1, headcount: 450 },
  { month: 'Feb', payroll: 2.3, headcount: 480 },
  { month: 'Mar', payroll: 2.8, headcount: 520 },
  { month: 'Apr', payroll: 3.2, headcount: 580 },
  { month: 'May', payroll: 3.9, headcount: 640 },
  { month: 'Jun', payroll: 4.2, headcount: 710 },
];

const faqItems = [
  { q: 'Can WorkSphere ERP support multiple entities?', a: 'Yes. WorkSphere is architected with a multi-entity database layout, allowing unified directory structures to separate ledger and tax compliance rules by regional hub.' },
  { q: 'Can compliance and payroll rules be customized?', a: 'Absolutely. The visual builder lets you draw node paths, tax exemption components, and regional HRA policies with zero coding required.' },
  { q: 'Is there a sandbox testing environment available?', a: 'Yes. Sandbox instances can be launched directly from your settings dashboard, pre-populated with secure synthetic data sets to test workflows.' },
  { q: 'How is employee PII data secured?', a: 'All data is encrypted with AES-256 at rest, TLS 1.3 in transit, backed by real-time SOC 2 Type II audit trail logging.' }
];

// --- FEATURE TEXT LOOP DATA ---
const loopFeatures = [
  'Employee Management',
  'Onboarding & Offboarding',
  'Attendance Tracking',
  'Configurable Leave',
  'Automated Payroll',
  'Performance & Goals',
  'Recruitment & Hiring',
  'Reports & Analytics',
  'Workflow Automation',
  'Document Management',
  'Asset Tracking',
  'Role Permissions',
  'AI HR Assistant',
  'Employee Self Service',
  'Organization Structure'
];

// --- WORD SPLIT HEADING COMPONENT ---
function AnimatedHeading({
  text,
  className = '',
  highlightWord = '',
  highlightColor = 'text-ag-primary'
}: {
  text: string;
  className?: string;
  highlightWord?: string;
  highlightColor?: string;
}) {
  const words = text.split(' ');
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 }
    }
  };
  const childVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.h2
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      className={`font-display ${className}`}
    >
      {words.map((word, idx) => {
        const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        const isHighlighted = highlightWord && cleanWord.toLowerCase() === highlightWord.toLowerCase();
        return (
          <span key={idx} className="inline-block mr-[0.25em] overflow-hidden py-1">
            <motion.span variants={childVariants} className={`inline-block ${isHighlighted ? `${highlightColor}` : ''}`}>
              {word}
            </motion.span>
          </span>
        );
      })}
    </motion.h2>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  // States
  const [scrolled, setScrolled] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiIndex, setAiIndex] = useState(0);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [basicSalary, setBasicSalary] = useState(150000);
  const [hraPercentage, setHraPercentage] = useState(50);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Hubs');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [faqIndex, setFaqIndex] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Platform: false,
    'HR Modules': false,
    Resources: false,
    Company: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleHeaderClick = (item: string) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (item === 'Platform') {
      document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (item === 'Modules') {
      document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (item === 'Pricing') {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (item === 'Objections') {
      document.getElementById('objections')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (item === 'AI Console') {
      document.getElementById('ai-console')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (item === 'Analytics') {
      document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  };

  const handleFooterLinkClick = (title: string, item: string) => {
    if (title === 'Platform') {
      const elementId = item === 'Overview' ? 'overview'
                      : item === 'Features' ? 'platform'
                      : item === 'Solutions' ? 'solutions'
                      : 'roadmap';
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (title === 'HR Modules') {
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      const targetPath = item === 'Employee Management' ? '/employees'
                       : item === 'Onboarding' ? '/onboarding'
                       : item === 'Offboarding' ? '/offboarding'
                       : item === 'Attendance' ? '/attendance'
                       : item === 'Leave Management' ? '/leave'
                       : item === 'Payroll' ? '/payroll'
                       : '/reports';
      
      if (isAuthenticated) {
        navigate(targetPath);
      } else {
        navigate('/login');
      }
      return;
    }

    if (title === 'Company') {
      if (item === 'Security') {
        document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (item === 'Contact') {
        document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      toast.info(`${item} information is available to registered enterprise workspace tenants.`);
      navigate('/login');
    }
  };

  // Dynamic Live Database Statistics State
  const [liveStats, setLiveStats] = useState([
    { label: 'Companies',          value: 10,    suffix: '+',  prefix: '', icon: <Building size={20} />, description: 'Active corporate workspaces', colorType: 'violet' as const },
    { label: 'Services provided',  value: 15,    suffix: '+',  prefix: '', icon: <Sparkle  size={20} />, description: 'Operational cloud services', colorType: 'sky' as const },
    { label: 'Platform uptime',    value: 99.99, suffix: '%',  prefix: '', icon: <ShieldCheck size={20} />, description: 'SLA-guaranteed performance', colorType: 'emerald' as const },
    { label: 'HRMS modules live',  value: 28,    suffix: '+',  prefix: '', icon: <Globe size={20} />, description: 'Fully integrated HR tools', colorType: 'indigo' as const }
  ]);

  useEffect(() => {
    async function loadPublicStats() {
      try {
        const res = await api.get('/public/stats');
        if (res.data?.success) {
          const s = res.data.data;
          setLiveStats([
            { label: 'Companies',         value: 10,    suffix: '+',  prefix: '', icon: <Building size={20} />, description: 'Active corporate workspaces', colorType: 'violet' as const },
            { label: 'Services provided', value: 15,    suffix: '+',  prefix: '', icon: <Sparkle  size={20} />, description: 'Operational cloud services', colorType: 'sky' as const },
            { label: 'Platform uptime',   value: s.platformUptime || 99.99, suffix: '%', prefix: '', icon: <ShieldCheck size={20} />, description: 'SLA-guaranteed performance', colorType: 'emerald' as const },
            { label: 'HRMS modules live', value: 28,    suffix: '+',  prefix: '', icon: <Globe size={20} />, description: 'Fully integrated HR tools', colorType: 'indigo' as const }
          ]);
        }
      } catch (err) {
        // Fallback already pre-set
      }
    }
    loadPublicStats();
  }, []);

  const aiPhrases = [
    'Analyze June attendance variance models...',
    'Isolate payroll anomalies for Bangalore hub...',
    'Who has pending approvals in Engineering?',
    'Draft audit trail report for ISO audit...',
  ];

  const getAiResponse = () => {
    const idx = aiIndex % aiPhrases.length;
    if (idx === 0) {
      return "Analyzing 1,420 employee logs... Found 12 variance anomalies in Bangalore. Click to review recommendations.";
    } else if (idx === 1) {
      return "Scanning payroll journals... Isolated 2 payroll anomalies in Engineering (Basic CTC salary component mismatch).";
    } else if (idx === 2) {
      return "Found 3 pending approvals in Engineering: 2 leave requests (Rajesh K.) and 1 asset allocation (Priya S.).";
    } else {
      return "Drafting ISO 27001 audit report... Compiled 30-day immutable activity ledger with SOC 2 cryptosignatures.";
    }
  };

  useEffect(() => {
    let textTimeout: NodeJS.Timeout;
    const phrase = aiPhrases[aiIndex % aiPhrases.length];
    
    if (aiText.length < phrase.length) {
      textTimeout = setTimeout(() => {
        setAiText(phrase.slice(0, aiText.length + 1));
      }, 60);
    } else {
      textTimeout = setTimeout(() => {
        setAiText('');
        setAiIndex((prev) => prev + 1);
      }, 3500);
    }
    return () => clearTimeout(textTimeout);
  }, [aiText, aiIndex]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen text-ag-ink overflow-x-hidden font-body selection:bg-ag-primary/20 bg-white">
      {/* ── HEADER NAVBAR ────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 mx-auto max-w-[1280px] mt-6 transition-all duration-300 rounded-full border ${
          scrolled
            ? 'backdrop-blur-sm bg-white/90 border-[#E4DFFF] shadow-sm py-3 scale-[0.98]'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Logo showText size={32} variant={scrolled ? 'color' : 'white'} />
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Platform', 'Modules', 'AI Console', 'Analytics', 'Pricing', 'Objections'].map((item) => (
            <button
              key={item}
              onClick={() => handleHeaderClick(item)}
              className={`relative text-xs font-semibold tracking-wider uppercase transition-colors py-1 cursor-pointer focus:outline-none ${
                scrolled ? 'text-ag-ink-2 hover:text-[#5B3CF5]' : 'text-white/80 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              scrolled ? 'text-ag-ink-2 hover:text-[#5B3CF5]' : 'text-white/80 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/company/contact')}
            className="px-5 py-2.5 bg-[#5B3CF5] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-opacity-90 shadow-sm transition-all"
          >
            Book Demo
          </button>
        </div>
      </motion.nav>

      {/* ── SECTION 1: HERO (Dark space theme bg) ── */}
      <motion.section
        id="overview"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative min-h-screen bg-[#0D0A1E] flex flex-col justify-center items-center overflow-hidden z-10 pt-20"
      >
        {/* Background Image Layer */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.18]"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0A1E] via-transparent to-[#0D0A1E]" />
        </div>

        {/* Ambient glow layer */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-[10%] left-[50%] -translate-x-1/2 w-[80vw] h-[80vw] rounded-full bg-radial-gradient from-[#5B3CF5]/10 to-transparent blur-[130px]" />
        </div>

        <div className="relative z-20 px-8 max-w-4xl mx-auto text-center space-y-8">
          <motion.h1
            variants={fadeUp}
            className="font-display font-extrabold text-[3.25rem] md:text-[4.75rem] leading-[1.05] tracking-tight text-white"
          >
            The Gravitational<br />Center of Modern<br />
            <span className="text-[#5B3CF5]">Enterprise.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto"
          >
            WorkSphere unifies workforce directories, high-frequency payroll processing, compliance layers, resource planners, and artificial intelligence into a single unified plane. Run your entire global operation without the friction.
          </motion.p>
        </div>

      </motion.section>

      {/* Wave transition: Hero -> Stats */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#0D0A1E" bottomColor="#F7F5FF" direction="down" height={50} />
      </div>

      {/* ── FEATURE MODULE TEXT LOOP ── */}
      <div className="relative z-10 bg-[#F7F5FF] py-3.5 border-b border-[#E4DFFF]/30 overflow-hidden select-none -mt-8">
        <LogoLoop
          items={loopFeatures}
          direction="left"
          speedSeconds={28}
          renderItem={(feature) => (
            <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#8E88A8] mx-5 transition-colors hover:text-[#5B3CF5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B3CF5]" />
              {feature}
            </span>
          )}
        />
      </div>

      {/* ── SECTION 2: STATS / SCALE (lavender bg) ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#F7F5FF] overflow-hidden"
      >
        {/* Background Image Layer */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.8]"
            style={{ backgroundImage: `url(${statsBg})` }}
          />
          {/* Seamless fade-out gradient at the bottom to transition smoothly to the wave divider */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#F7F5FF] via-[#F7F5FF]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto space-y-12 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <AnimatedHeading
              text="Orchestrating Scale for Forward-Thinking Enterprises."
              highlightWord="Enterprises"
              highlightColor="text-[#5B3CF5]"
              className="text-3xl md:text-4xl text-[#1A1433] tracking-tight font-extrabold"
            />
            <p className="text-ag-ink-2 text-base leading-relaxed">
              Trusted by the fastest-growing modern workspace platforms, multi-entity conglomerates, and security-first organizations.
            </p>
          </div>

          {/* Stats grid countup */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 text-left">
            {liveStats.map((stat, idx) => (
              <motion.div key={idx} variants={scaleIn} className="flex flex-col h-full">
                <StatCard
                  label={stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  icon={stat.icon}
                  description={stat.description}
                  colorType={stat.colorType}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Wave transition: Stats -> Employee Journey */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#F7F5FF" bottomColor="#FFFFFF" direction="up" height={60} />
      </div>

      {/* ── SECTION 3: EMPLOYEE JOURNEY TIMELINE ── */}

      <EmployeeJourney />



      {/* ── SECTION 4: ONE ENGINE EVERY CLIENT (white bg) ── */}
      <motion.section
        id="modules"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-white"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <AnimatedHeading
              text="One Engine. Every Client"
              highlightWord="Client"
              highlightColor="text-[#FFB020]"
              className="text-3xl md:text-4xl text-[#1A1433] tracking-tight font-extrabold"
            />
            <p className="text-ag-ink-2 text-sm leading-relaxed">
              Administrators audit on desktop workspaces. Managers approve timecards on tablets. Employees check-in on mobile terminals. All syncing in 100ms.
            </p>
            <div className="space-y-3 pt-4">
              {[
                { label: 'Desktop Workspace (Admin Portal)', idx: 0 },
                { label: 'Tablet Planner (Payroll Run)', idx: 1 },
                { label: 'Mobile Biometrics (Punch Terminal)', idx: 2 }
              ].map((device) => (
                <div
                  key={device.idx}
                  onClick={() => setDeviceIndex(device.idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    deviceIndex === device.idx
                      ? 'border-[#5B3CF5] bg-[#EDE8FF] font-bold text-ag-ink'
                      : 'border-[#E4DFFF] bg-white hover:border-[#C4BBFF]'
                  }`}
                >
                  <span className="text-xs">{device.label}</span>
                  <span className="text-[10px] text-ag-ink-3">View Active</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#F7F5FF] border border-[#E4DFFF] rounded-[20px] p-6 shadow-lvl2 h-[380px] flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {deviceIndex === 0 && (
                <motion.div
                  key="desktop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={scaleIn}
                  className="w-full max-w-[480px] bg-white border border-[#E4DFFF] rounded-xl shadow-lvl3 overflow-hidden text-left"
                >
                  <div className="px-4 py-2.5 border-b border-[#E4DFFF] bg-[#EDE8FF]/50 text-[10px] font-bold text-[#5B3CF5] uppercase">
                    Admin Workspace
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-[#EDE8FF] rounded w-1/3 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-8 bg-[#F7F5FF] rounded w-full border-l-4 border-l-[#5B3CF5]" />
                      <div className="h-8 bg-[#F7F5FF] rounded w-full border-l-4 border-l-[#3D3BF3]" />
                      <div className="h-8 bg-[#F7F5FF] rounded w-full border-l-4 border-l-[#00C48C]" />
                    </div>
                  </div>
                </motion.div>
              )}

              {deviceIndex === 1 && (
                <motion.div
                  key="tablet"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={scaleIn}
                  className="w-[360px] bg-white border border-[#E4DFFF] rounded-xl shadow-lvl3 overflow-hidden text-left"
                >
                  <div className="px-4 py-2.5 border-b border-[#E4DFFF] bg-[#FFF8E6] text-[10px] font-bold text-[#FFB020] uppercase">
                    Approvals Hub
                  </div>
                  <div className="p-5 space-y-4 border-l-4 border-[#FFB020]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A1433]">June Payroll Batch</span>
                      <span className="px-2 py-0.5 bg-[#FFF8E6] text-[#FFB020] text-[9px] font-bold rounded-full">Pending check</span>
                    </div>
                    <div className="h-2 w-full bg-[#EDE8FF] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFB020] w-2/3" />
                    </div>
                  </div>
                </motion.div>
              )}

              {deviceIndex === 2 && (
                <motion.div
                  key="mobile"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={scaleIn}
                  className="w-[220px] bg-white border border-[#E4DFFF] rounded-3xl p-5 shadow-lvl3 text-left flex flex-col gap-4 text-slate-800"
                >
                  <div className="text-[10px] text-[#5B3CF5] font-bold tracking-wider uppercase">Biometric Mobile</div>
                  <div className="h-28 bg-[#E6FAF4] rounded-xl flex flex-col items-center justify-center gap-2 border border-[#00C48C]/20">
                    <Fingerprint size={28} className="text-[#00C48C] animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-700">Clock-in ready</span>
                  </div>
                  <div className="text-xs font-bold text-center text-ag-ink-2">09:32 AM</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {/* Wave transition: One Engine -> Workflow Chains */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#FFFFFF" bottomColor="#EDE8FF" direction="up" height={80} />
      </div>



      {/* ── SECTION 9: WORKFLOW CHAINS (violet bg) ── */}
      <motion.section
        id="roadmap"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#EDE8FF] text-center"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 text-left space-y-4">
            <AnimatedHeading
              text="Workflow Chains. Automated."
              highlightWord="Automated."
              highlightColor="text-[#00C48C]"
              className="text-3xl text-[#1A1433] tracking-tight font-black"
            />
            <p className="text-ag-ink-3 text-sm">
              Set custom visual rules for leaves, payments, and equipment compliance check pipelines.
            </p>
          </div>

          <div className="lg:col-span-8 flex gap-6 text-left relative pl-10">
            {/* Animated left timeline line */}
            <div className="absolute left-4 top-4 bottom-4 w-[2px]">
              <svg className="w-full h-full text-ag-border" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="0" x2="0" y2="100%" stroke="#5B3CF5" strokeWidth="2.5" strokeDasharray="5,5" className="animated-line" />
              </svg>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {workflowSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  variants={scaleIn}
                  className="p-4 rounded-xl border border-[#E4DFFF] bg-white shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      step.status === 'done' ? 'bg-[#00C48C]' : step.status === 'active' ? 'bg-[#5B3CF5]' : 'bg-slate-300'
                    }`} />
                    <div>
                      <h5 className="text-xs font-bold text-ag-ink">{step.label}</h5>
                      <p className="text-[10px] text-ag-ink-2 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    step.status === 'done'
                      ? 'bg-[#E6FAF4] text-[#00875A]'
                      : step.status === 'active'
                        ? 'bg-[#EDE8FF] text-[#5B3CF5] animate-pulse'
                        : 'bg-slate-50 text-slate-400'
                  }`}>
                    {step.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Wave transition: Workflows -> Every Module */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#EDE8FF" bottomColor="#FFFFFF" direction="up" height={80} />
      </div>

      {/* ── SECTION 9.5: EVERY MODULE. ONE PLATFORM. (white bg) ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-white text-center"
      >
        <div className="max-w-[1280px] mx-auto">
          <AnimatedHeading
            text="Every Module. One Platform."
            highlightWord="Platform."
            highlightColor="text-[#5B3CF5]"
            className="text-3xl md:text-4xl text-[#1A1433] tracking-tight font-black text-center"
          />
          <motion.p
            variants={fadeUp}
            className="text-ag-ink-2 text-sm text-center max-w-lg mx-auto mt-3 mb-12"
          >
            From hire to retire — every workflow connected, every record in sync.
          </motion.p>

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {[
              { icon: <UserPlus size={24} />,          label: 'Onboarding',          color: '#5B3CF5' },
              { icon: <ArrowUpRight size={24} />,      label: 'Offboarding',         color: '#FF5F57' },
              { icon: <CurrencyDollar size={24} />,    label: 'Payroll',             color: '#00C48C' },
              { icon: <CalendarCheck size={24} />,     label: 'Attendance',          color: '#2BB5FF' },
              { icon: <Airplane size={24} />,          label: 'Leave Management',    color: '#FFB020' },
              { icon: <Package size={24} />,           label: 'Asset Management',    color: '#FF4C8B' },
              { icon: <FileText size={24} />,          label: 'Documents',           color: '#5B3CF5' },
              { icon: <ChartBar size={24} />,          label: 'Reports & Analytics', color: '#00C48C' },
              { icon: <GitBranch size={24} />,         label: 'Workflow Engine',     color: '#2BB5FF' },
              { icon: <Bell size={24} />,              label: 'Notifications',       color: '#FFB020' },
              { icon: <Shield size={24} />,            label: 'Audit & Security',    color: '#FF5F57' },
              { icon: <MagnifyingGlass size={24} />,   label: 'Global Search',       color: '#FF4C8B' },
            ].map((mod) => (
              <motion.div
                key={mod.label}
                variants={scaleIn}
                whileHover={{ y: -3, boxShadow: '0 8px 32px rgba(91,60,245,0.10)' }}
                style={{
                  background: '#F7F5FF',
                  borderRadius: 16,
                  padding: '24px 20px',
                  textAlign: 'center',
                  border: '1.5px solid #E4DFFF',
                  cursor: 'default',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#ffffff'; (e.currentTarget as HTMLDivElement).style.borderColor = '#C4BBFF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F7F5FF'; (e.currentTarget as HTMLDivElement).style.borderColor = '#E4DFFF'; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${mod.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: mod.color
                }}>
                  {mod.icon}
                </div>
                <p style={{ fontFamily: 'Syne, system-ui', fontWeight: 700, fontSize: 13, color: '#1A1433', margin: 0 }}>
                  {mod.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Wave transition: Every Module (White) -> AI Console (Dark) */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#FFFFFF" bottomColor="#0D0A1E" direction="down" height={100} />
      </div>

      {/* ── SECTION 9.6: AI CONSOLE (Dark cosmic theme) ── */}
      <motion.section
        id="ai-console"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#0D0A1E] text-white"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B3CF5]/10 border border-[#5B3CF5]/20 text-xs font-semibold text-[#5B3CF5]">
              <Cpu size={16} />
              <span>AI AUTOPILOT ENGINE</span>
            </div>
            <AnimatedHeading
              text="Autonomous HR Operations. Run by AI."
              highlightWord="AI."
              highlightColor="text-[#FFB020]"
              className="text-3xl md:text-4xl text-white tracking-tight font-black"
            />
            <p className="text-white/60 text-sm leading-relaxed">
              WorkSphere is powered by a fine-tuned, localized intelligence layer that translates natural business queries into direct system actions. Run automated compliance checks, draft policy structures, and analyze logs using natural language.
            </p>
            <div className="space-y-4 pt-2">
              {[
                { title: 'Natural Language Queries', desc: 'Ask questions like "Who has pending approvals?" or "Isolate payroll anomalies" and receive instantly compiled tables.' },
                { title: 'Predictive Attrition Risk', desc: 'Pre-emptively scan flight risks and attendance changes, flag anomalies, and protect retention targets.' },
                { title: 'Self-Healing Workflows', desc: 'Auto-reroute approvals, escalate SLAs, and generate handover briefs dynamically if personnel change.' }
              ].map((feat, i) => (
                <div key={i} className="flex gap-3 text-left">
                  <div className="w-5 h-5 rounded-full bg-[#FFB020]/20 flex items-center justify-center text-[#FFB020] text-xs mt-0.5 shrink-0">✦</div>
                  <div>
                    <h5 className="font-bold text-xs text-white">{feat.title}</h5>
                    <p className="text-white/50 text-[11px] mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#070512] border border-[#2A2050] rounded-2xl p-6 font-mono text-[11px] text-white/70 space-y-4 shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-between text-left">
            <div className="flex items-center justify-between border-b border-[#2A2050]/50 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFB020]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]" />
              </div>
              <span className="text-[10px] text-white/40 tracking-wider">WORKSphere AI CO-PILOT CONSOLE</span>
            </div>

            <div className="space-y-3 flex-grow pt-4">
              <div className="flex gap-2">
                <span className="text-[#FFB020] shrink-0">&gt;</span>
                <p className="text-white/90 font-mono tracking-wide">
                  {aiText}
                  <span className="animate-pulse text-[#FFB020]">|</span>
                </p>
              </div>

              {aiText === aiPhrases[aiIndex % aiPhrases.length] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-[#5B3CF5]/5 border border-[#5B3CF5]/30 space-y-2 mt-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#5B3CF5] bg-[#5B3CF5]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">🤖 CO-PILOT RESULT</span>
                    <span className="text-[9px] text-[#00C48C] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-ping" /> EXECUTED SUCCESS
                    </span>
                  </div>
                  <p className="text-white/80 leading-relaxed font-mono text-[11px]">
                    {getAiResponse()}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="border-t border-[#2A2050]/30 pt-3 text-[10px] text-white/30 flex justify-between">
              <span>SYSTEM: LOCALIZED LLM v2.3</span>
              <span>LATENCY: 84ms</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Wave transition: AI Console (Dark) -> Analytics (Light) */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#0D0A1E" bottomColor="#F7F5FF" direction="up" height={100} />
      </div>

      {/* ── SECTION 9.7: ANALYTICS (Light lavender bg) ── */}
      <motion.section
        id="analytics"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#F7F5FF] text-ag-ink"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 bg-white border border-[#E4DFFF] rounded-2xl p-6 shadow-lg min-h-[350px] flex flex-col justify-between text-left">
            <div className="flex items-center justify-between border-b border-[#E4DFFF]/50 pb-4 mb-4">
              <div>
                <h4 className="font-display font-black text-sm text-[#1A1433]">WorkSphere BI Analytics Center</h4>
                <p className="text-[10px] text-ag-ink-3">Live payroll CTC (Cr ₹) vs Headcount monitoring</p>
              </div>
              <span className="text-[10px] font-semibold text-[#5B3CF5] bg-[#5B3CF5]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">REAL-TIME TELEMETRY</span>
            </div>

            <div className="h-[260px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B3CF5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#5B3CF5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#8A82A5" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#8A82A5" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#8A82A5" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1A1433', border: 'none', borderRadius: 8, color: '#fff', fontSize: 10 }}
                    labelStyle={{ fontWeight: 'bold', color: '#FFB020' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="payroll" stroke="#5B3CF5" strokeWidth={3} dot={{ fill: '#5B3CF5', r: 4 }} activeDot={{ r: 6 }} name="Payroll (Cr ₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="headcount" stroke="#00C48C" strokeWidth={2} dot={{ fill: '#00C48C', r: 3 }} name="Employees" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-4 border-t border-[#E4DFFF]/50 pt-4 mt-2 justify-center text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B3CF5]" />
                <span className="text-ag-ink-2 font-medium">Payroll Cost (Cr ₹)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]" />
                <span className="text-ag-ink-2 font-medium">Headcount (Active)</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00C48C]/10 border border-[#00C48C]/20 text-xs font-semibold text-[#00C48C]">
              <ChartBar size={16} />
              <span>DECISIONS WITH INSIGHTS</span>
            </div>
            <AnimatedHeading
              text="Enterprise Business Intelligence. Decoupled."
              highlightWord="Intelligence."
              highlightColor="text-[#5B3CF5]"
              className="text-3xl md:text-4xl text-[#1A1433] tracking-tight font-black"
            />
            <p className="text-ag-ink-2 text-sm leading-relaxed">
              Unlock deep cross-module correlation matrices. Query payroll trends, project completion timelines, resource allocation maps, and statutory tax liabilities with real-time accuracy.
            </p>
            <div className="space-y-4 pt-2">
              {[
                { title: 'Ad-hoc Custom Report Builder', desc: 'Drag, drop, pivot, and save complex data schemas. Export instantly to PDF, CSV, or live JSON webhooks.' },
                { title: 'Predictive Cash Flow Modeling', desc: 'Simulate incremental CTC, bonus distribution cycles, and tax bracket hikes to see cost forecasts in real time.' },
                { title: 'Automated Alert Policies', desc: 'Define budget and compliance limit thresholds. Automatically trigger manager alerts if rules are breached.' }
              ].map((feat, i) => (
                <div key={i} className="flex gap-3 text-left">
                  <div className="w-5 h-5 rounded-full bg-[#5B3CF5]/10 flex items-center justify-center text-[#5B3CF5] text-xs mt-0.5 shrink-0">✦</div>
                  <div>
                    <h5 className="font-bold text-xs text-[#1A1433]">{feat.title}</h5>
                    <p className="text-ag-ink-2 text-[11px] mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Wave transition: Analytics (Light) -> Security (Dark) */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#F7F5FF" bottomColor="#1A1433" direction="down" height={100} />
      </div>

      {/* ── SECTION 10: SECURITY (dark bg) ── */}
      <motion.section
        id="security"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#1A1433]"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <AnimatedHeading
              text="Enterprise Cryptographic Guardrails."
              highlightWord="Cryptographic"
              highlightColor="text-[#5B3CF5]"
              className="text-2xl md:text-3xl text-white tracking-tight font-black"
            />
            <p className="text-white/60 text-sm leading-relaxed">
              WorkSphere enforces AES-256 state encryption at rest, TLS 1.3 in transit, automated SOC 2 audit trails, single sign-on corporate directories, and multi-factor biometric checks.
            </p>
            <div className="flex flex-wrap gap-2">
              {['SOC 2 Type II', 'ISO 27001 Ready', 'GDPR Ready'].map((badge) => (
                <span key={badge} className="compliance-badge">
                  {badge.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#0F0B24] border border-[#2A2050] rounded-xl p-6 font-mono text-[11px] text-white/70 space-y-2.5 h-[200px] overflow-hidden text-left shadow-lg">
            <p className="text-[#5B3CF5] font-mono">// SECURE HANDSHAKE COMPLETED</p>
            <p>INITIALIZING DIRECTORY PROTOCOL... OK</p>
            <p>ENCRYPTING WORKSPACE LEDGER (AES-256)... DONE</p>
            <p className="text-[#00C48C] font-mono">// ZERO TRUST AUDIT STACK ACTIVATED</p>
          </div>
        </div>
      </motion.section>


      {/* Wave transition: Security -> Pricing */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#1A1433" bottomColor="#F7F5FF" direction="up" height={100} />
      </div>


      {/* ── SECTION 13: PREMIUM PRICING (lavender bg) ── */}
      <motion.section
        id="pricing"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#F7F5FF] text-center"
      >
        <div className="max-w-[1280px] mx-auto space-y-12">
          <div className="max-w-2xl text-left space-y-4">
            <AnimatedHeading
              text="Fair, transparent, scale-ready pricing."
              highlightWord="pricing."
              highlightColor="text-[#5B3CF5]"
              className="text-3xl md:text-4xl text-[#1A1433] tracking-tight font-black"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-[#EDE8FF] rounded-full mb-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold relative z-10 transition-all ${
                billingPeriod === 'monthly' ? 'text-white bg-[#5B3CF5] shadow' : 'text-ag-ink-2'
              }`}
            >
              Monthly Billed
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold relative z-10 transition-all ${
                billingPeriod === 'annual' ? 'text-white bg-[#5B3CF5] shadow' : 'text-ag-ink-2'
              }`}
            >
              Annual Billed (Save 20%)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            {/* All-in-One Plan (5000 Rs Plan) */}
            <motion.div
              variants={scaleIn}
              className="p-8 rounded-[20px] border-2 border-[#5B3CF5] bg-white shadow-lg flex flex-col justify-between relative"
              style={{ boxShadow: '0 8px 40px rgba(91,60,245,0.15)' }}
            >
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#5B3CF5] text-white text-[9px] font-bold uppercase tracking-wider">
                RECOMMENDED
              </div>
              <div className="space-y-4">
                <h4 className="font-display font-bold text-base text-ag-ink">All-in-One Plan</h4>
                <div className="py-2">
                  <span className="text-2xl font-display font-black text-ag-ink">
                    ₹{billingPeriod === 'annual' ? '4,000' : '5,000'}
                  </span>
                  <span className="text-xs text-ag-ink-3"> / month</span>
                </div>
                <div className="h-px bg-[#E4DFFF]" />
                <p className="text-xs font-semibold text-[#5B3CF5] uppercase tracking-wider">Included Modules:</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-ag-ink-2">
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Onboarding</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Offboarding</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Payroll</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Attendance</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Leave Management</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Asset Management</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Documents</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Reports &amp; Analytics</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Workflow Engine</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Notifications</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Audit &amp; Security</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Global Search</li>
                </ul>
              </div>
              <button onClick={() => navigate('/signup')} className="mt-8 w-full py-2.5 bg-[#5B3CF5] hover:bg-[#3D3BF3] text-white text-xs font-bold uppercase rounded-full text-center transition-all">
                Get Started
              </button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              variants={scaleIn}
              className="p-8 rounded-[20px] border border-[#E4DFFF] bg-white shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <h4 className="font-display font-bold text-base text-ag-ink">Enterprise Plan</h4>
                <div className="py-2">
                  <span className="text-2xl font-display font-black text-ag-ink">Custom</span>
                  <span className="text-xs text-ag-ink-3"> / dedicated tenancy</span>
                </div>
                <div className="h-px bg-[#E4DFFF]" />
                <p className="text-xs font-semibold text-ag-ink uppercase tracking-wider">Enterprise Features:</p>
                <ul className="space-y-2 text-xs text-ag-ink-2">
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Unlimited employees</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Multi-company / Multi-branch</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Custom integrations</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Dedicated cloud tenancy</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> SSO + MFA + Audit Logs</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> 24/7 dedicated support</li>
                </ul>
              </div>
              <button onClick={() => navigate('/signup')} className="mt-8 w-full py-2.5 border border-[#E4DFFF] text-xs font-bold uppercase rounded-full text-center transition-all bg-white hover:bg-slate-50 text-slate-800">
                Contact Sales
              </button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Wave transition: Pricing -> FAQ accordion */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#F7F5FF" bottomColor="#FFFFFF" direction="down" height={80} />
      </div>

      {/* ── SECTION 16: FAQ ACCORDION (Matte White) ── */}
      <section id="objections" className="relative z-10 py-24 px-8 bg-white border-b border-ag-border/30 text-center">
        <div className="max-w-[800px] mx-auto space-y-16">
          <div className="space-y-4">
            <AnimatedHeading
              text="Frequently Asked Objections."
              highlightWord="Objections"
              highlightColor="text-[#5B3CF5]"
              className="text-3xl text-ag-ink tracking-tight font-black"
            />
          </div>

          <div className="space-y-4 text-left">
            {faqItems.map((item, idx) => (
              <div key={idx} className="border border-[#E4DFFF] bg-white rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setFaqIndex(faqIndex === idx ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-left text-xs font-bold text-ag-ink"
                >
                  <span>{item.q}</span>
                  <motion.div
                    animate={{ rotate: faqIndex === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CaretDown size={16} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {faqIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="p-5 pt-0 text-xs text-[#4B4468] border-t border-[#E4DFFF]/30 leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 17: FINAL CONVERSION CTA (dark bg) ── */}
      <section id="cta" className="relative z-10 py-24 px-8 bg-[#0D0A1E] text-center">
        <div className="max-w-[1200px] mx-auto relative py-16 flex flex-col items-center">
          <style>{`
            @keyframes pulse-ring {
              0% { transform: scale(1); opacity: 0.6; }
              100% { transform: scale(1.8); opacity: 0; }
            }
            .pulse-ring {
              animation: pulse-ring 2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
            }
          `}</style>
          
          <div className="relative w-12 h-12 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full bg-[#5B3CF5]/50 pulse-ring" />
            <div className="absolute w-8 h-8 rounded-full bg-[#5B3CF5] flex items-center justify-center text-white">
              <Sparkle size={18} />
            </div>
          </div>

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <AnimatedHeading
              text="Run Your Global Enterprise Without Limits."
              highlightWord="Limits."
              highlightColor="text-[#FFB020]"
              className="text-3xl md:text-5xl text-white tracking-tight font-black"
            />
            <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-md mx-auto">
              Payroll, attendance, leave, assets, documents, and workflows — all connected, all compliant, all in one platform.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/company/contact')}
                className="px-10 py-4 bg-[#5B3CF5] hover:bg-[#3D3BF3] text-white text-sm font-bold uppercase rounded-full shadow-lg transition-all"
              >
                Book Consultation
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* ── FOOTER SECTION ── */}
      <MarketingFooter />
    </div>
  );
}
