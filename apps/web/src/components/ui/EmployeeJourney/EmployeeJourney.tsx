import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion';
import {
  Building,
  UserPlus,
  Clock,
  Wallet,
  TrendUp,
  ChartBar,
  CheckCircle,
  Circle,
  CalendarBlank,
  ArrowRight,
  Sparkle,
  ChartLine,
  Receipt,
  Users,
  Star,
  Lightning,
} from '@phosphor-icons/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Checkpoint {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  bullets: string[];
  icon: React.ElementType;
  accent: string;
  accentLight: string;
  accentGlow: string;
  side: 'left' | 'right';
  preview: React.ReactNode;
}

// ─── Miniature ERP Previews ───────────────────────────────────────────────────

function WorkspacePreview() {
  return (
    <div className="rounded-xl bg-white border border-[#E8E4FF] p-3 shadow-sm text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#5B3CF5]/10 flex items-center justify-center">
          <Building size={13} weight="fill" className="text-[#5B3CF5]" />
        </div>
        <div>
          <div className="text-[9px] font-bold text-[#1A1433]">WorkSphere</div>
          <div className="text-[8px] text-[#8E88A8]">Organization Setup</div>
        </div>
        <div className="ml-auto">
          <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold">Active</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {['Company Name', 'Industry', 'Admin Email'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="text-[8px] text-[#8E88A8] w-16 shrink-0">{label}</div>
            <div className="flex-1 h-4 rounded bg-[#F7F5FF] border border-[#E8E4FF]" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-5 rounded-lg bg-[#5B3CF5] flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">Create Workspace</span>
        </div>
      </div>
    </div>
  );
}

function OnboardingPreview() {
  const steps = [
    { label: 'Upload Documents', done: true },
    { label: 'Assign Department', done: true },
    { label: 'Generate Employee ID', done: true },
    { label: 'Create Login Account', done: false },
  ];
  return (
    <div className="rounded-xl bg-white border border-[#E8E4FF] p-3 shadow-sm text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
          <UserPlus size={13} weight="fill" className="text-[#7C3AED]" />
        </div>
        <div>
          <div className="text-[9px] font-bold text-[#1A1433]">Anita Rajan</div>
          <div className="text-[8px] text-[#8E88A8]">Onboarding · Day 1</div>
        </div>
        <div className="ml-auto">
          <div className="text-[8px] font-bold text-[#7C3AED]">75%</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            {s.done
              ? <CheckCircle size={10} weight="fill" className="text-emerald-500 shrink-0" />
              : <Circle size={10} className="text-[#C4BFDF] shrink-0" />
            }
            <span className={`text-[8px] ${s.done ? 'text-[#1A1433]' : 'text-[#C4BFDF]'}`}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 w-full h-1.5 rounded-full bg-[#F7F5FF]">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#5B3CF5]" style={{ width: '75%' }} />
      </div>
    </div>
  );
}

function AttendancePreview() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const status = ['p', 'p', 'p', 'l', 'p', 'w', 'w', 'p', 'p', 'p', 'p', 'h', 'w', 'w', 'p', 'p', 'p', 'p', 'p', 'w', 'w'];
  const colors: Record<string, string> = { p: 'bg-[#2BB5FF]/20 border-[#2BB5FF]/30', l: 'bg-amber-100 border-amber-200', h: 'bg-emerald-100 border-emerald-200', w: 'bg-[#F7F5FF] border-[#E8E4FF]' };
  return (
    <div className="rounded-xl bg-white border border-[#E8E4FF] p-3 shadow-sm text-left">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-[#2BB5FF]/10 flex items-center justify-center">
          <CalendarBlank size={13} weight="fill" className="text-[#2BB5FF]" />
        </div>
        <div>
          <div className="text-[9px] font-bold text-[#1A1433]">Attendance · July</div>
          <div className="text-[8px] text-[#8E88A8]">Engineering Dept.</div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {days.map((d, i) => (
          <div key={i} className="text-center text-[7px] text-[#C4BFDF] font-bold">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {status.map((s, i) => (
          <div key={i} className={`w-full aspect-square rounded border text-[6px] ${colors[s]}`} />
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {[['#2BB5FF', 'Present'], ['bg-amber-', 'Leave'], ['bg-emerald-', 'Holiday']].map((_, i) => (
          i === 0
            ? <span key={i} className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#2BB5FF]/30 border border-[#2BB5FF]/40" /><span className="text-[7px] text-[#8E88A8]">Present</span></span>
            : i === 1
            ? <span key={i} className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-100 border border-amber-200" /><span className="text-[7px] text-[#8E88A8]">Leave</span></span>
            : <span key={i} className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-100 border border-emerald-200" /><span className="text-[7px] text-[#8E88A8]">Holiday</span></span>
        ))}
      </div>
    </div>
  );
}

function PayrollPreview() {
  const items = [
    { label: 'Basic Salary', val: '₹1,50,000', pct: 100, color: 'bg-[#00C48C]' },
    { label: 'HRA', val: '₹75,000', pct: 50, color: 'bg-[#2BB5FF]' },
    { label: 'Tax Deduction', val: '−₹18,500', pct: 12, color: 'bg-rose-400' },
    { label: 'Net Pay', val: '₹2,06,500', pct: 88, color: 'bg-[#5B3CF5]' },
  ];
  return (
    <div className="rounded-xl bg-white border border-[#E8E4FF] p-3 shadow-sm text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#00C48C]/10 flex items-center justify-center">
          <Wallet size={13} weight="fill" className="text-[#00C48C]" />
        </div>
        <div>
          <div className="text-[9px] font-bold text-[#1A1433]">Payslip · June 2025</div>
          <div className="text-[8px] text-[#8E88A8]">Rajan, Anita · EMP-0042</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[8px] text-[#8E88A8]">{item.label}</span>
              <span className="text-[8px] font-bold text-[#1A1433]">{item.val}</span>
            </div>
            <div className="w-full h-1 rounded-full bg-[#F7F5FF]">
              <div className={`h-1 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformancePreview() {
  const goals = [
    { label: 'Q3 Revenue Target', pct: 87, color: '#FFB020' },
    { label: 'Product Launch', pct: 64, color: '#5B3CF5' },
    { label: 'Team Expansion', pct: 100, color: '#00C48C' },
  ];
  return (
    <div className="rounded-xl bg-white border border-[#E8E4FF] p-3 shadow-sm text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#FFB020]/10 flex items-center justify-center">
          <TrendUp size={13} weight="fill" className="text-[#FFB020]" />
        </div>
        <div>
          <div className="text-[9px] font-bold text-[#1A1433]">Performance Review</div>
          <div className="text-[8px] text-[#8E88A8]">Q3 · Engineering Lead</div>
        </div>
        <div className="ml-auto flex">
          {[1,2,3,4,5].map(i => <Star key={i} size={8} weight={i <= 4 ? 'fill' : 'regular'} className={i <= 4 ? 'text-[#FFB020]' : 'text-[#C4BFDF]'} />)}
        </div>
      </div>
      <div className="space-y-2">
        {goals.map((g, i) => (
          <div key={i}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[8px] text-[#8E88A8]">{g.label}</span>
              <span className="text-[8px] font-bold" style={{ color: g.color }}>{g.pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#F7F5FF]">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${g.pct}%`, backgroundColor: g.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsPreview() {
  const bars = [45, 72, 58, 89, 63, 94, 77];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="rounded-xl bg-white border border-[#E8E4FF] p-3 shadow-sm text-left">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-[#3D3BF3]/10 flex items-center justify-center">
          <ChartBar size={13} weight="fill" className="text-[#3D3BF3]" />
        </div>
        <div>
          <div className="text-[9px] font-bold text-[#1A1433]">Analytics Dashboard</div>
          <div className="text-[8px] text-[#8E88A8]">Real-time · AI Insights</div>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-0.5 text-[#3D3BF3]">
            <Lightning size={8} weight="fill" />
            <span className="text-[7px] font-bold">Live</span>
          </div>
        </div>
      </div>
      <div className="flex items-end gap-0.5 h-10">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full rounded-sm"
              style={{
                height: `${h}%`,
                background: i === 5
                  ? 'linear-gradient(to top, #3D3BF3, #7C3AED)'
                  : `rgba(61,59,243,${0.15 + (h / 100) * 0.25})`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 mt-0.5">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[6px] text-[#C4BFDF]">{d}</div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[#3D3BF3]">
        <Sparkle size={8} weight="fill" />
        <span className="text-[7.5px] font-semibold">AI predicts 12% growth next quarter</span>
      </div>
    </div>
  );
}

// ─── Checkpoint Data ──────────────────────────────────────────────────────────

const CHECKPOINTS: Checkpoint[] = [
  {
    id: 'registration',
    step: 1,
    title: 'Company Registration',
    subtitle: 'Create your secure organization workspace in minutes.',
    bullets: [
      'Multi-entity workspace setup',
      'Role-based admin provisioning',
      'Compliance configuration',
      'Department hierarchy builder',
    ],
    icon: Building,
    accent: '#5B3CF5',
    accentLight: '#F3F0FF',
    accentGlow: 'rgba(91,60,245,0.18)',
    side: 'right',
    preview: <WorkspacePreview />,
  },
  {
    id: 'onboarding',
    step: 2,
    title: 'Employee Onboarding',
    subtitle: 'Invite employees and set them up for success from day one.',
    bullets: [
      'Digital document collection',
      'Auto-generated Employee IDs',
      'Department & role assignment',
      'Secure account provisioning',
    ],
    icon: UserPlus,
    accent: '#7C3AED',
    accentLight: '#F5F0FF',
    accentGlow: 'rgba(124,58,237,0.18)',
    side: 'left',
    preview: <OnboardingPreview />,
  },
  {
    id: 'attendance',
    step: 3,
    title: 'Attendance & Leave',
    subtitle: 'Track every work hour and manage leave with ease.',
    bullets: [
      'Biometric & geo-fenced punch',
      'Shift scheduling & swaps',
      'Multi-level leave approvals',
      'Real-time hour monitoring',
    ],
    icon: Clock,
    accent: '#2BB5FF',
    accentLight: '#F0FAFF',
    accentGlow: 'rgba(43,181,255,0.18)',
    side: 'right',
    preview: <AttendancePreview />,
  },
  {
    id: 'payroll',
    step: 4,
    title: 'Payroll Processing',
    subtitle: 'Automated, compliant payroll runs at any scale.',
    bullets: [
      'Automatic salary computation',
      'Statutory deductions & TDS',
      'Digital payslip generation',
      'Bank transfer integration',
    ],
    icon: Wallet,
    accent: '#00C48C',
    accentLight: '#EDFAF5',
    accentGlow: 'rgba(0,196,140,0.18)',
    side: 'left',
    preview: <PayrollPreview />,
  },
  {
    id: 'performance',
    step: 5,
    title: 'Performance & Growth',
    subtitle: 'Build high-performance teams with data-driven reviews.',
    bullets: [
      'OKR & goal tracking',
      'Continuous feedback loops',
      'Training & L&D management',
      'Promotion & career pathing',
    ],
    icon: TrendUp,
    accent: '#FFB020',
    accentLight: '#FFFBF0',
    accentGlow: 'rgba(255,176,32,0.18)',
    side: 'right',
    preview: <PerformancePreview />,
  },
  {
    id: 'reports',
    step: 6,
    title: 'Reports & Analytics',
    subtitle: 'Real-time intelligence that drives smarter decisions.',
    bullets: [
      'Live operational dashboards',
      'Custom report builder',
      'AI-powered HR insights',
      'Export to PDF / Excel / API',
    ],
    icon: ChartBar,
    accent: '#3D3BF3',
    accentLight: '#F0F0FF',
    accentGlow: 'rgba(61,59,243,0.18)',
    side: 'left',
    preview: <ReportsPreview />,
  },
];

// ─── Desktop 3-column row (left card | center node | right card) ─────────────

function DesktopCheckpointRow({ cp, index }: { cp: Checkpoint; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const cardSlide = cp.side === 'right' ? 40 : -40;

  // The card element — shared between sides
  const Card = (
    <motion.div
      initial={{ opacity: 0, x: cardSlide, y: 16 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group cursor-default relative"
    >
      <div
        className="rounded-2xl border bg-white/90 backdrop-blur-sm p-5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_40px_rgba(91,60,245,0.12)]"
        style={{
          borderColor: `${cp.accent}22`,
          boxShadow: `0 4px 24px rgba(91,60,245,0.05), inset 0 0 0 1px ${cp.accent}15`,
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:rotate-12"
            style={{ backgroundColor: cp.accentLight }}
          >
            <cp.icon size={20} weight="fill" style={{ color: cp.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black tracking-widest uppercase block mb-0.5" style={{ color: cp.accent }}>
              Step {String(cp.step).padStart(2, '0')}
            </span>
            <h3 className="text-base font-extrabold text-[#1A1433] leading-tight">{cp.title}</h3>
            <p className="text-xs text-[#8E88A8] mt-0.5 leading-relaxed">{cp.subtitle}</p>
          </div>
        </div>

        {/* Bullets */}
        <ul className="space-y-1.5 mb-4">
          {cp.bullets.map((b, i) => (
            <li key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cp.accent }} />
              <span className="text-xs text-[#5E5A72]">{b}</span>
            </li>
          ))}
        </ul>

        {/* Mini ERP Preview */}
        <div
          className="rounded-xl p-0.5 transition-all duration-300 group-hover:shadow-lg"
          style={{ background: `linear-gradient(135deg, ${cp.accent}18, ${cp.accent}08)` }}
        >
          <div className="scale-[0.96] origin-top">{cp.preview}</div>
        </div>

        {/* Hover border glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1.5px ${cp.accent}40, 0 0 32px ${cp.accentGlow}` }}
        />
      </div>
    </motion.div>
  );

  // Centered node — static, no infinite animation
  const Node = (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.3, type: 'spring', stiffness: 200 }}
      className="relative z-10 flex items-center justify-center"
    >
      {/* Very subtle static glow ring */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ inset: '-3px', backgroundColor: cp.accentGlow, opacity: 0.5 }}
      />
      <div
        className="relative w-11 h-11 rounded-full border-2 flex items-center justify-center bg-white shadow-md"
        style={{ borderColor: cp.accent, boxShadow: `0 0 0 3px ${cp.accentGlow}` }}
      >
        <cp.icon size={17} weight="fill" style={{ color: cp.accent }} />
      </div>
    </motion.div>
  );

  return (
    <div
      ref={ref}
      className="grid items-start"
      style={{ gridTemplateColumns: '1fr 80px 1fr' }}
    >
      {/* Left slot */}
      <div className={`pr-6 ${cp.side === 'left' ? '' : 'invisible pointer-events-none'}`}>
        {cp.side === 'left' ? Card : null}
      </div>

      {/* Center — node, always perfectly centered */}
      <div className="flex flex-col items-center pt-5">
        {Node}
      </div>

      {/* Right slot */}
      <div className={`pl-6 ${cp.side === 'right' ? '' : 'invisible pointer-events-none'}`}>
        {cp.side === 'right' ? Card : null}
      </div>
    </div>
  );
}

// ─── Scroll-linked Timeline Line (scaleY approach — reliable & precise) ────────
// top-[26px]  = pt-5 (20px) + half of node h-11 (22px) ≈ first node center
// bottom-[26px] = same offset so line ends at last node center

function TimelineLine({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 hidden lg:block pointer-events-none z-0 overflow-hidden"
      style={{ top: '46px', bottom: '46px', width: '2px' }}
    >
      {/* Faint full-height track */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #5B3CF5, #2BB5FF, #3D3BF3)',
          opacity: 0.15,
        }}
      />
      {/* Scroll-driven growing stroke */}
      <motion.div
        className="absolute top-0 left-0 right-0 origin-top"
        style={{
          scaleY,
          height: '100%',
          background: 'linear-gradient(to bottom, #5B3CF5, #7C3AED, #2BB5FF, #3D3BF3)',
        }}
      />
    </div>
  );
}

// ─── Mobile Timeline Line ─────────────────────────────────────────────────────

function MobileTimelineLine({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 90%', 'end 10%'],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="absolute left-[5px] top-0 bottom-0 lg:hidden w-0.5 overflow-hidden">
      <div className="w-full h-full bg-[#E8E4FF]" />
      <motion.div
        className="absolute top-0 left-0 right-0 origin-top"
        style={{
          scaleY,
          height: '100%',
          background: 'linear-gradient(to bottom, #5B3CF5, #7C3AED, #2BB5FF, #3D3BF3)',
        }}
      />
    </div>
  );
}

// ─── Main Section Export ──────────────────────────────────────────────────────

export function EmployeeJourney() {
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="journey"
      className="relative z-10 py-24 px-6 md:px-8 bg-white overflow-hidden"
    >
      {/* ── BACKGROUND LAYERS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #5B3CF5, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #2BB5FF, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] rounded-full blur-[90px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)' }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="ej-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#5B3CF5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ej-dots)" />
        </svg>
      </div>

      {/* ── SECTION HEADER ── */}
      <div className="relative z-10 max-w-[1280px] mx-auto mb-20 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-extrabold text-3xl md:text-5xl text-[#1A1433] tracking-tight leading-[1.1] mb-5"
        >
          From Hiring to{' '}
          <span className="text-[#5B3CF5]">Growth</span>
          {' '}—{' '}
          <br className="hidden md:block" />
          One Intelligent Platform
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[#8E88A8] text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
        >
          Every employee interaction is connected through a single intelligent HR ecosystem,
          eliminating manual work and helping organizations scale effortlessly.
        </motion.p>
      </div>

      {/* ── TIMELINE ── */}
      <div className="relative z-10 max-w-[1100px] mx-auto">
        {/* Mobile — left-anchored single column */}
        <div ref={timelineRef} className="relative lg:hidden pl-10">
          <MobileTimelineLine containerRef={timelineRef} />
          <div className="space-y-10">
            {CHECKPOINTS.map((cp, i) => (
              <DesktopCheckpointRow key={cp.id} cp={cp} index={i} />
            ))}
          </div>
        </div>

        {/* Desktop — 3-column grid with centered timeline line */}
        <div ref={timelineRef} className="relative hidden lg:block">
          <TimelineLine containerRef={timelineRef} />

          <div className="flex flex-col gap-16 relative z-10">
            {CHECKPOINTS.map((cp, i) => (
              <DesktopCheckpointRow key={cp.id} cp={cp} index={i} />
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
