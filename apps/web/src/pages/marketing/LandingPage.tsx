import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import CountUp from 'react-countup';
import {
  ArrowRight, Sparkle, CheckCircle, Clock, Calendar, Users, ShieldCheck, Cpu, Receipt,
  Fingerprint, GitBranch, Lock, ArrowUpRight, Quotes, UserPlus, CurrencyDollar, Globe, CaretDown,
  CalendarCheck, TrendUp, Airplane, Package, FileText, ChartBar, Bell, Shield, MagnifyingGlass, Building
} from '@phosphor-icons/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/animations';

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

const faqItems = [
  { q: 'Can WorkSphere ERP support multiple entities?', a: 'Yes. WorkSphere is architected with a multi-entity database layout, allowing unified directory structures to separate ledger and tax compliance rules by regional hub.' },
  { q: 'Can compliance and payroll rules be customized?', a: 'Absolutely. The visual builder lets you draw node paths, tax exemption components, and regional HRA policies with zero coding required.' },
  { q: 'Is there a sandbox testing environment available?', a: 'Yes. Sandbox instances can be launched directly from your settings dashboard, pre-populated with secure synthetic data sets to test workflows.' },
  { q: 'How is employee PII data secured?', a: 'All data is encrypted with AES-256 at rest, TLS 1.3 in transit, backed by real-time SOC 2 Type II audit trail logging.' }
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

  // Dynamic Live Database Statistics State
  const [liveStats, setLiveStats] = useState([
    { label: 'Companies',          value: 10,    suffix: '+',  prefix: '', icon: <Building size={20} /> },
    { label: 'Services provided',  value: 15,    suffix: '+',  prefix: '', icon: <Sparkle  size={20} /> },
    { label: 'Platform uptime',    value: 99.99, suffix: '%',  prefix: '', icon: <ShieldCheck size={20} /> },
    { label: 'HRMS modules live',  value: 28,    suffix: '+',  prefix: '', icon: <Globe size={20} /> }
  ]);

  useEffect(() => {
    async function loadPublicStats() {
      try {
        const res = await api.get('/public/stats');
        if (res.data?.success) {
          const s = res.data.data;
          setLiveStats([
            { label: 'Companies',         value: 10,    suffix: '+',  prefix: '', icon: <Building size={20} /> },
            { label: 'Services provided', value: 15,    suffix: '+',  prefix: '', icon: <Sparkle  size={20} /> },
            { label: 'Platform uptime',   value: s.platformUptime || 99.99, suffix: '%', prefix: '', icon: <ShieldCheck size={20} /> },
            { label: 'HRMS modules live', value: 28,    suffix: '+',  prefix: '', icon: <Globe size={20} /> }
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

  // 30 Particles coordinates mapping
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    top: `${Math.floor(Math.random() * 85) + 5}%`,
    left: `${Math.floor(Math.random() * 90) + 5}%`,
    dur: `${Math.floor(Math.random() * 6) + 6}s`,
    delay: `${Math.floor(Math.random() * 5)}s`
  }));

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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B3CF5] to-[#3D3BF3] text-white flex items-center justify-center font-display font-black text-base shadow-sm">
            WS
          </div>
          <span className={`font-display font-extrabold text-xl tracking-tight ${scrolled ? 'text-ag-ink' : 'text-white'}`}>
            WorkSphere
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Platform', 'Modules', 'AI Console', 'Analytics', 'Pricing', 'Objections'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className={`relative text-xs font-semibold tracking-wider uppercase transition-colors py-1 ${
                scrolled ? 'text-ag-ink-2 hover:text-[#5B3CF5]' : 'text-white/80 hover:text-white'
              }`}
            >
              {item}
            </a>
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
            onClick={() => navigate('/signup')}
            className="px-5 py-2.5 bg-[#5B3CF5] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-opacity-90 shadow-sm transition-all"
          >
            Book Demo
          </button>
        </div>
      </motion.nav>

      {/* ── SECTION 1: HERO (Dark space theme bg) ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative min-h-screen bg-[#0D0A1E] flex flex-col justify-center items-center overflow-hidden z-10 pt-20"
      >
        {/* Particle field layer */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                top: p.top,
                left: p.left,
                '--dur': p.dur,
                '--delay': p.delay
              } as React.CSSProperties}
            />
          ))}
          <div className="absolute -top-[10%] left-[50%] -translate-x-1/2 w-[80vw] h-[80vw] rounded-full bg-radial-gradient from-[#5B3CF5]/10 to-transparent blur-[130px]" />
        </div>

        <div className="relative z-10 px-8 max-w-4xl mx-auto text-center space-y-8">
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
        <WaveDivider topColor="#0D0A1E" bottomColor="#F7F5FF" direction="down" height={100} />
      </div>

      {/* ── SECTION 2: STATS / SCALE (lavender bg) ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#F7F5FF]"
      >
        <div className="max-w-[1280px] mx-auto space-y-12 text-center">
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
              <motion.div
                key={idx}
                variants={scaleIn}
                className="p-6 rounded-2xl border border-[#E4DFFF] bg-white shadow-sm flex flex-col justify-between hover:border-[#5B3CF5]/30 transition-all"
              >
                <div className="p-2 w-fit rounded-lg bg-[#EDE8FF] text-[#5B3CF5]">
                  {stat.icon}
                </div>
                <div className="mt-4">
                  <h4 className="font-display font-extrabold text-2xl text-[#1A1433] tracking-tight">
                    {stat.prefix}
                    <CountUp end={stat.value} duration={2.5} separator="," decimals={stat.value % 1 !== 0 ? 3 : 0} enableScrollSpy scrollSpyOnce />
                    {stat.suffix}
                  </h4>
                  <p className="text-[10px] text-ag-ink-3 mt-1 uppercase font-bold tracking-wider">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Wave transition: Stats -> Core Engine */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#F7F5FF" bottomColor="#EDE8FF" direction="up" height={80} />
      </div>

      {/* ── SECTION 3: CORE ENGINE DIAGRAM (violet bg) ── */}
      <motion.section
        id="platform"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#EDE8FF]"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-left space-y-4">
            <AnimatedHeading
              text="The Connected Workforce Engine."
              highlightWord="Engine"
              highlightColor="text-[#00C48C]"
              className="text-3xl md:text-4xl text-[#1A1433] tracking-tight font-extrabold"
            />
            <p className="text-ag-ink-2 text-sm max-w-xl">
              Every module syncs continuously to the core directory ledger. Goodbye manual data reconciliation.
            </p>
          </div>

          <div className="lg:col-span-7 flex justify-center items-center">
            <svg viewBox="0 0 680 460" width="100%" style={{ display: 'block' }}>

              {/* ── ORBIT RINGS (decorative, no hover) ──────── */}
              <circle cx="340" cy="230" r="96"
                fill="none" stroke="#5B3CF5" strokeWidth="1"
                strokeDasharray="4 6" opacity="0.2" />
              <circle cx="340" cy="230" r="130"
                fill="none" stroke="#5B3CF5" strokeWidth="0.5" opacity="0.1" />

              {/* ── CENTER NODE ─────────────────────────────── */}
              {/* Outer glow ring */}
              <circle cx="340" cy="230" r="72"
                fill="none" stroke="#5B3CF5" strokeWidth="8" opacity="0.12" />
              {/* Main circle */}
              <circle cx="340" cy="230" r="64" fill="#5B3CF5" />
              {/* Inner darker ring for depth */}
              <circle cx="340" cy="230" r="56" fill="#4A2EDB" />
              {/* Icon — CPU chip shape via SVG rect grid */}
              <rect x="326" y="216" width="28" height="28" rx="4"
                fill="none" stroke="white" strokeWidth="1.5" opacity="0.9" />
              <rect x="332" y="222" width="16" height="16" rx="2"
                fill="none" stroke="white" strokeWidth="1" opacity="0.7" />
              {/* Pin lines */}
              {[0,6,12].map(offset => (
                <line key={`t${offset}`} x1={332+offset} y1="216" x2={332+offset} y2="212"
                  stroke="white" strokeWidth="1.5" opacity="0.6" />
              ))}
              {[0,6,12].map(offset => (
                <line key={`b${offset}`} x1={332+offset} y1="244" x2={332+offset} y2="248"
                  stroke="white" strokeWidth="1.5" opacity="0.6" />
              ))}
              <text x="340" y="262" textAnchor="middle"
                fontFamily="'Syne', system-ui, sans-serif"
                fontSize="9" fontWeight="700" fill="white"
                letterSpacing="2" opacity="0.8">CORE ENGINE</text>

              {/* ── CONNECTOR PATHS — no crossing ───────────── */}
              <defs>
                <marker id="m-mint" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M1 2L8 5L1 8" fill="none" stroke="#00C48C" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </marker>
                <marker id="m-sky" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M1 2L8 5L1 8" fill="none" stroke="#2BB5FF" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </marker>
                <marker id="m-amber" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M1 2L8 5L1 8" fill="none" stroke="#FFB020" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </marker>
                <marker id="m-coral" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M1 2L8 5L1 8" fill="none" stroke="#FF5F57" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>

              {/* Top-left: Payroll → center top-left */}
              <path d="M 196 102 C 230 102, 276 150, 285 178"
                fill="none" stroke="#00C48C" strokeWidth="2"
                strokeDasharray="6 4" markerEnd="url(#m-mint)" opacity="0.85"
                className="diagram-connector" />

              {/* Top-right: Biometrics → center top-right */}
              <path d="M 484 102 C 450 102, 404 150, 395 178"
                fill="none" stroke="#2BB5FF" strokeWidth="2"
                strokeDasharray="6 4" markerEnd="url(#m-sky)" opacity="0.85"
                className="diagram-connector" />

              {/* Bottom-left: Workflow → center bottom-left */}
              <path d="M 196 358 C 230 358, 276 310, 285 282"
                fill="none" stroke="#FFB020" strokeWidth="2"
                strokeDasharray="6 4" markerEnd="url(#m-amber)" opacity="0.85"
                className="diagram-connector" />

              {/* Bottom-right: Role Gateway → center bottom-right */}
              <path d="M 484 358 C 450 358, 404 310, 395 282"
                fill="none" stroke="#FF5F57" strokeWidth="2"
                strokeDasharray="6 4" markerEnd="url(#m-coral)" opacity="0.85"
                className="diagram-connector" />

              {/* ── SATELLITE NODES ─────────────────────────── */}
              {/* TOP LEFT — Payroll Auto-sync */}
              <rect x="52" y="72" width="196" height="52" rx="26"
                fill="white" stroke="#C4BBFF" strokeWidth="1.5" />
              <circle cx="80" cy="98" r="13" fill="#E6FAF4" />
              <text x="80" y="103" textAnchor="middle"
                fontFamily="system-ui" fontSize="12" fill="#00C48C" fontWeight="700">₹</text>
              <text x="165" y="102" textAnchor="middle"
                fontFamily="'Syne', system-ui" fontSize="11" fontWeight="700" fill="#1A1433">
                Payroll Auto-sync
              </text>
              <circle cx="228" cy="98" r="5" fill="#00C48C" />
              <circle cx="228" cy="98" r="5" fill="#00C48C" opacity="0.4">
                <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* TOP RIGHT — Biometrics Dispatch */}
              <rect x="432" y="72" width="196" height="52" rx="26"
                fill="white" stroke="#C4BBFF" strokeWidth="1.5" />
              <circle cx="460" cy="98" r="13" fill="#EDE8FF" />
              <text x="460" y="103" textAnchor="middle"
                fontFamily="system-ui" fontSize="12" fill="#5B3CF5" fontWeight="700">◉</text>
              <text x="545" y="102" textAnchor="middle"
                fontFamily="'Syne', system-ui" fontSize="11" fontWeight="700" fill="#1A1433">
                Biometrics Dispatch
              </text>
              <circle cx="610" cy="98" r="5" fill="#2BB5FF" />
              <circle cx="610" cy="98" r="5" fill="#2BB5FF" opacity="0.4">
                <animate attributeName="r" values="5;10;5" dur="2.4s" repeatCount="indefinite" begin="0.6s" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" begin="0.6s" />
              </circle>

              {/* BOTTOM LEFT — Workflow Hook */}
              <rect x="52" y="336" width="196" height="52" rx="26"
                fill="white" stroke="#C4BBFF" strokeWidth="1.5" />
              <circle cx="80" cy="362" r="13" fill="#FFF8E6" />
              <text x="80" y="367" textAnchor="middle"
                fontFamily="system-ui" fontSize="12" fill="#FFB020" fontWeight="700">⚙</text>
              <text x="165" y="366" textAnchor="middle"
                fontFamily="'Syne', system-ui" fontSize="11" fontWeight="700" fill="#1A1433">
                Workflow Hook
              </text>
              <circle cx="228" cy="362" r="5" fill="#FFB020" />
              <circle cx="228" cy="362" r="5" fill="#FFB020" opacity="0.4">
                <animate attributeName="r" values="5;10;5" dur="2.8s" repeatCount="indefinite" begin="1s" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.8s" repeatCount="indefinite" begin="1s" />
              </circle>

              {/* BOTTOM RIGHT — Role Gateway */}
              <rect x="432" y="336" width="196" height="52" rx="26"
                fill="white" stroke="#C4BBFF" strokeWidth="1.5" />
              <circle cx="460" cy="362" r="13" fill="#FFF0EF" />
              <text x="460" y="367" textAnchor="middle"
                fontFamily="system-ui" fontSize="12" fill="#FF5F57" fontWeight="700">⛨</text>
              <text x="545" y="366" textAnchor="middle"
                fontFamily="'Syne', system-ui" fontSize="11" fontWeight="700" fill="#1A1433">
                Role Gateway
              </text>
              <circle cx="610" cy="362" r="5" fill="#FF5F57" />
              <circle cx="610" cy="362" r="5" fill="#FF5F57" opacity="0.4">
                <animate attributeName="r" values="5;10;5" dur="3s" repeatCount="indefinite" begin="1.4s" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" begin="1.4s" />
              </circle>

            </svg>
          </div>
        </div>
      </motion.section>

      {/* Wave transition: Core Engine -> One Engine */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#EDE8FF" bottomColor="#FFFFFF" direction="down" height={80} />
      </div>

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

      {/* Wave transition: One Engine -> Payroll */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#FFFFFF" bottomColor="#E6FAF4" direction="up" height={80} />
      </div>

      {/* ── SECTION 5: PAYROLL INTELLIGENCE (mint bg) ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#E6FAF4]"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left interactive mock */}
          <motion.div
            variants={scaleIn}
            className="bg-white border border-[#9FE1CB] rounded-[20px] p-6 shadow-md space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-ag-border">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-ag-ink-3">Live Payroll Component Simulator</h4>
              <span className="px-3 py-1 rounded bg-[#E6FAF4] text-[#00875A] border border-[#9FE1CB] text-[10px] font-bold uppercase">COMPLIANCE INTACT</span>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-ag-ink-2 mb-1.5 uppercase">Base monthly compensation: ₹{basicSalary.toLocaleString()}</label>
                <input
                  type="range"
                  min="50000"
                  max="300000"
                  step="10000"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#EDE8FF] rounded-lg appearance-none cursor-pointer accent-[#00C48C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B4468] mb-1.5 uppercase">HRA allocation: {hraPercentage}%</label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={hraPercentage}
                  onChange={(e) => setHraPercentage(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#EDE8FF] rounded-lg appearance-none cursor-pointer accent-[#00C48C]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#E6FAF4]/50 space-y-2.5 text-xs text-ag-ink border border-[#9FE1CB]">
                <div className="flex justify-between font-medium">
                  <span>Basic Component (calculated):</span>
                  <span className="font-bold">₹{Math.round(basicSalary * (1 - hraPercentage/100)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>HRA Exemption Limit:</span>
                  <span className="font-bold">₹{Math.round(basicSalary * (hraPercentage/100)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-[#9FE1CB] pt-2 text-[#5B3CF5]">
                  <span>Total Compliance Liability:</span>
                  <span>₹{Math.round(basicSalary * 0.12).toLocaleString()} (Provident Fund)</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6 text-left lg:pl-10">
            <AnimatedHeading
              text="Payroll Intelligence built-in"
              highlightWord="built-in"
              highlightColor="text-[#5B3CF5]"
              className="font-display font-extrabold text-3xl md:text-4xl text-[#1A1433] tracking-tight"
            />
            <p className="text-[#4B4468] text-sm leading-relaxed">
              Every compensation update is instantly evaluated against standard tax structures, statutory provident allocations, and regional labor requirements. No third-party payroll files or processing batches to verify.
            </p>
            {/* Feature pill row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {['PF / ESI / PT Auto-calc', 'TDS Projection', 'Bank File Export', 'Payslip PDF'].map((pill) => (
                <span
                  key={pill}
                  style={{
                    background: '#EDE8FF',
                    color: '#5B3CF5',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '6px 14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Wave transition: Payroll -> Employee Lifecycle */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#E6FAF4" bottomColor="#FFF8E6" direction="down" height={80} />
      </div>

      {/* ── SECTION 6: EMPLOYEE LIFECYCLE (amber bg) ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#FFF8E6]"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 space-y-4 text-left">
            <AnimatedHeading
              text="The Complete Employee Lifecycle."
              highlightWord="Lifecycle."
              highlightColor="text-[#FF4C8B]"
              className="text-3xl text-[#1A1433] tracking-tight font-black"
            />
            <p className="text-ag-ink-2 text-sm">
              From initial application scan to clearance, manage every career milestone in one timeline workspace.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: 'ONBOARD',  title: '1. Application Sync',    desc: 'Secure document collection, system credentials, and equipment assignments.', border: 'border-l-[#5B3CF5]', color: 'text-[#5B3CF5]', icon: <UserPlus size={18} /> },
              { label: 'ALLOCATE', title: '2. Shifts Allocation',   desc: 'Auto-schedule core shifts and resource locations with active calendars.',    border: 'border-l-[#FFB020]', color: 'text-[#FFB020]', icon: <Calendar size={18} /> },
              { label: 'PROCESS',  title: '3. Ledger Processing',   desc: 'Daily work hours compile into payroll databases dynamically.',                border: 'border-l-[#00C48C]', color: 'text-[#00C48C]', icon: <Receipt size={18} /> },
              { label: 'TRANSACT', title: '4. Compliance Transact', desc: 'Tax compliance processed, bank files dispatched, payslips issued.',           border: 'border-l-[#FF5F57]', color: 'text-[#FF5F57]', icon: <CheckCircle size={18} /> },
              { label: 'MANAGE',   title: '5. Leave & Attendance',  desc: 'Apply leave, track attendance, run approvals — all in one timeline.',        border: 'border-l-[#2BB5FF]', color: 'text-[#2BB5FF]', icon: <CalendarCheck size={18} /> },
              { label: 'GROW',     title: '6. Reports & Analytics', desc: 'Custom report builder, scheduled exports, drill-down charts.',               border: 'border-l-[#FF4C8B]', color: 'text-[#FF4C8B]', icon: <TrendUp size={18} /> }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className={`p-6 bg-white border-l-4 ${item.border} rounded-r-2xl rounded-l-md shadow-sm text-left space-y-3 transition-all duration-200`}
              >
                <div className={`p-2 rounded-lg bg-slate-50 w-fit ${item.color}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${item.color}`}>{item.label}</span>
                <h4 className="text-sm font-extrabold text-ag-ink">{item.title}</h4>
                <p className="text-xs text-[#4B4468] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Wave transition: Lifecycle -> AI Console */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#FFF8E6" bottomColor="#0D0A1E" direction="up" height={120} />
      </div>

      {/* ── SECTION 7: AI CONSOLE (dark island bg) ── */}
      <motion.section
        id="ai-console"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#0D0A1E]"
      >
        <div className="max-w-[1280px] mx-auto space-y-16">
          <div className="max-w-2xl text-left space-y-4">
            <AnimatedHeading
              text="Workforce Intelligence in Natural Language."
              highlightWord="Natural"
              highlightColor="text-[#00C48C]"
              className="text-3xl text-white tracking-tight font-black"
            />
            <p className="text-white/60 text-sm">
              Ask complex queries, analyze anomalies, and structure resources using the conversational shell.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left terminal */}
            <div className="lg:col-span-8 bg-[#0F0B24] border border-[#2A2050] rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between text-left h-[320px]">
              <div className="px-5 py-4 border-b border-[#2A2050] flex items-center justify-between bg-black/35">
                <span className="text-[10px] font-mono tracking-wider uppercase text-white/40">Cognitive Shell v1.0</span>
                <span className="px-2 py-0.5 rounded bg-[#00C48C]/20 text-[#00C48C] border border-[#00C48C]/40 text-[9px] font-bold uppercase">AI Active</span>
              </div>
              <div className="p-6 space-y-6 flex-1 font-mono text-xs text-white/90">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[#5B3CF5] font-bold">{'>'}</span>
                  <div className="flex-1 space-y-3">
                    <p className="text-white">
                      {aiText}
                      <span className="inline-block w-1.5 h-3.5 bg-[#00C48C] ml-0.5 blink-cursor" style={{ content: '"|"' }} />
                    </p>
                    {aiText.length === 0 && (
                      <div className="p-4 rounded-xl bg-black/40 border border-[#2A2050] space-y-2 text-[11px] text-white/70">
                        <span className="text-[#FF5F57] font-bold text-[9px] tracking-wider uppercase">June Payroll Anomalies</span>
                        <p className="text-white/60 mt-1">1. Simran S. (Leave mismatch overlapping payroll run)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right terminal menu preset commands */}
            <div className="lg:col-span-4 bg-[#0F0B24] border border-[#2A2050] rounded-2xl p-6 shadow-xl text-left flex flex-col justify-between">
              <div>
                <h5 className="text-xs uppercase font-extrabold tracking-wider text-white/50 mb-4 font-mono">Preset commands</h5>
                <ul className="space-y-3 text-xs text-[#C4BBFF]">
                  <li className="p-3 rounded border border-transparent bg-black/25 hover:border-[#5B3CF5] cursor-pointer transition-all">Analyze shift attendance variance</li>
                  <li className="p-3 rounded border border-transparent bg-black/25 hover:border-[#5B3CF5] cursor-pointer transition-all">Isolate payroll discrepancies</li>
                  <li className="p-3 rounded border border-transparent bg-black/25 hover:border-[#5B3CF5] cursor-pointer transition-all">Draft audit validation logs</li>
                </ul>
              </div>
              <p className="text-[10px] text-white/40 font-mono mt-4">Ctrl + K to trigger globally</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Wave transition: AI Console -> Analytics */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#0D0A1E" bottomColor="#F7F5FF" direction="down" height={100} />
      </div>

      {/* ── SECTION 8: ANALYTICS / DECISION (lavender bg) ── */}
      <motion.section
        id="analytics"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="relative z-10 py-24 px-8 bg-[#F7F5FF]"
      >
        <div className="max-w-[1280px] mx-auto text-center space-y-16">
          <div className="max-w-2xl text-left space-y-4">
            <AnimatedHeading
              text="High-Fidelity Decision Systems."
              highlightWord="Decision"
              highlightColor="text-[#2BB5FF]"
              className="text-3xl text-[#1A1433] tracking-tight font-black"
            />
            <p className="text-ag-ink-3 text-sm">
              Filter multi-dimensional talent records, audit cost allocations, and check retention curves.
            </p>
          </div>

          <div className="flex justify-start gap-3">
            {['All Hubs', 'Engineering (Purple)', 'Product (Blue)', 'Operations (Coral)'].map((dept, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDeptFilter(dept)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selectedDeptFilter === dept
                    ? 'bg-[#5B3CF5] border-[#5B3CF5] text-white shadow-sm'
                    : 'bg-white border-[#E4DFFF] text-ag-ink-2 hover:border-[#C4BBFF]'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Graph visual anchor */}
          <div className="w-full bg-white border border-[#E4DFFF] rounded-2xl p-6 shadow-lvl3 text-left">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-ag-ink-3 mb-6">Retention Curves (Multi-colored)</h4>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData}>
                  <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} stroke="#8E88A8" />
                  <YAxis domain={[80, 100]} fontSize={10} tickLine={false} axisLine={false} stroke="#8E88A8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1.5px solid #E4DFFF',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '12px'
                    }}
                  />
                  {(selectedDeptFilter === 'All Hubs' || selectedDeptFilter.includes('Engineering')) && (
                    <Line type="monotone" dataKey="Engineering" stroke="#5B3CF5" strokeWidth={2.5} name="Engineering (Purple)" isAnimationActive={true} animationDuration={1200} />
                  )}
                  {(selectedDeptFilter === 'All Hubs' || selectedDeptFilter.includes('Product')) && (
                    <Line type="monotone" dataKey="Product" stroke="#2BB5FF" strokeWidth={2.5} name="Product (Sky)" isAnimationActive={true} animationDuration={1200} />
                  )}
                  {(selectedDeptFilter === 'All Hubs' || selectedDeptFilter.includes('Sales')) && (
                    <Line type="monotone" dataKey="Sales" stroke="#FFB020" strokeWidth={2.5} name="Sales (Amber)" isAnimationActive={true} animationDuration={1200} />
                  )}
                  {(selectedDeptFilter === 'All Hubs' || selectedDeptFilter.includes('Operations')) && (
                    <Line type="monotone" dataKey="Operations" stroke="#FF4C8B" strokeWidth={2.5} name="Operations (Pink)" isAnimationActive={true} animationDuration={1200} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Wave transition: Analytics -> Workflows */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#F7F5FF" bottomColor="#EDE8FF" direction="up" height={80} />
      </div>

      {/* ── SECTION 9: WORKFLOW CHAINS (violet bg) ── */}
      <motion.section
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

      {/* Wave transition: Every Module -> Security */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WaveDivider topColor="#FFFFFF" bottomColor="#1A1433" direction="down" height={100} />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              variants={scaleIn}
              className="p-8 rounded-[20px] border border-[#E4DFFF] bg-white shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <h4 className="font-display font-bold text-base text-ag-ink">Starter Plan</h4>
                <div className="py-2">
                  <span className="text-2xl font-display font-black text-ag-ink">
                    ₹{billingPeriod === 'annual' ? '2,400' : '3,000'}
                  </span>
                  <span className="text-xs text-ag-ink-3"> / employee / year</span>
                </div>
                <div className="h-px bg-[#E4DFFF]" />
                <ul className="space-y-2 text-xs text-ag-ink-2">
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Up to 100 employees</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Payroll + Attendance</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Leave Management</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> 10GB document storage</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Email support</li>
                </ul>
              </div>
              <button onClick={() => navigate('/signup')} className="mt-8 w-full py-2.5 border border-[#E4DFFF] text-xs font-bold uppercase rounded-full text-center transition-all bg-white hover:bg-slate-50 text-slate-800">
                Get Started
              </button>
            </motion.div>

            {/* Growth Plan */}
            <motion.div
              variants={scaleIn}
              className="p-8 rounded-[20px] border-2 border-[#5B3CF5] bg-white shadow-lg flex flex-col justify-between relative"
              style={{ boxShadow: '0 8px 40px rgba(91,60,245,0.15)' }}
            >
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#5B3CF5] text-white text-[9px] font-bold uppercase tracking-wider">
                RECOMMENDED
              </div>
              <div className="space-y-4">
                <h4 className="font-display font-bold text-base text-ag-ink">Growth Plan</h4>
                <div className="py-2">
                  <span className="text-2xl font-display font-black text-ag-ink">
                    ₹{billingPeriod === 'annual' ? '4,800' : '6,000'}
                  </span>
                  <span className="text-xs text-ag-ink-3"> / employee / year</span>
                </div>
                <div className="h-px bg-[#E4DFFF]" />
                <ul className="space-y-2 text-xs text-ag-ink-2">
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Up to 1,000 employees</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> All Starter features</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Asset Management</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Custom Workflow Builder</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Reports &amp; Analytics</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> 50GB document storage</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Priority support</li>
                </ul>
              </div>
              <button onClick={() => navigate('/signup')} className="mt-8 w-full py-2.5 bg-[#5B3CF5] hover:bg-[#3D3BF3] text-white text-xs font-bold uppercase rounded-full text-center transition-all">
                Upgrade to Growth
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
                <ul className="space-y-2 text-xs text-ag-ink-2">
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> Unlimited employees</li>
                  <li className="flex items-center gap-2"><span className="text-[#5B3CF5]">✦</span> All Growth features</li>
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
        <WaveDivider topColor="#F7F5FF" bottomColor="#0D0A1E" direction="down" height={120} />
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
      <section className="relative z-10 py-24 px-8 bg-[#0D0A1E] text-center">
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
                onClick={() => navigate('/signup')}
                className="px-10 py-4 bg-[#5B3CF5] hover:bg-[#3D3BF3] text-white text-sm font-bold uppercase rounded-full shadow-lg transition-all"
              >
                Book Consultation
              </button>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div className="max-w-[1280px] mx-auto pt-16 border-t border-white/10 text-[10px] text-white/50 flex justify-between items-center flex-wrap gap-4 mt-12">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B3CF5] text-white flex items-center justify-center font-display font-black text-sm">
              WS
            </div>
            <span className="font-display font-extrabold text-base tracking-tight text-white">WorkSphere</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#platform" className="hover:text-white transition-colors">Directory Core</a>
            <a href="#analytics" className="hover:text-white transition-colors">Fluid Analytics</a>
            <a href="#security" className="hover:text-white transition-colors">Cryptographics</a>
          </div>
          <span>© 2026 WorkSphere Technologies. All rights reserved.</span>
        </div>
      </section>
    </div>
  );
}
