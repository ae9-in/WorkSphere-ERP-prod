import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MarketingFooter } from '@/components/layout/MarketingFooter/MarketingFooter';
import {
  Sparkle, ArrowLeft, CheckCircle, Users, UserPlus, ArrowRight,
  CalendarCheck, Clock, Receipt, ChartBar, ShieldCheck, HardDrive
} from '@phosphor-icons/react';

// Modules detailed content mapping
const MODULES_DETAIL: Record<string, {
  title: string;
  icon: React.ReactNode;
  themeColor: string;
  description: string;
  tagline: string;
  benefits: string[];
  features: { name: string; desc: string }[];
  visualMock: React.ReactNode;
}> = {
  'employee-management': {
    title: 'Employee Management',
    icon: <Users size={28} />,
    themeColor: '#5B3CF5',
    tagline: 'The unified directory plane for modern workforce records.',
    description: 'Centralize your global workforce register in a single source of truth. Manage multi-entity profiles, reporting relationships, statutory requirements, and secure biographical logs with customizable metadata schemas.',
    benefits: [
      'Single source of truth for global teams',
      'Custom metadata field schemas',
      'Advanced zero-trust biographical encryption',
      'Dynamic reporting org-chart builders'
    ],
    features: [
      { name: 'Unified Profile Hub', desc: 'Secure repository for direct personal identifiers, contracts, official records, and contact vectors.' },
      { name: 'Custom Schemas', desc: 'Extend biographical records with custom fields, multi-entity tax profiles, and compliance rules.' },
      { name: 'Visual Org Chart', desc: 'Generate real-time hierarchical reporting curves dynamically from employee profile nodes.' },
      { name: 'Statutory Data Sync', desc: 'Auto-compile profile modifications into statutory payroll allocations and biometric gateways.' }
    ],
    visualMock: (
      <div className="p-6 rounded-2xl bg-white border border-[#E4DFFF] shadow-md space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-[#5B3CF5]/10 text-[#5B3CF5] flex items-center justify-center font-bold">JD</div>
          <div className="text-left">
            <h5 className="text-sm font-bold text-slate-800">John Doe</h5>
            <p className="text-[10px] text-slate-400">VP Product · Remote (India)</p>
          </div>
          <span className="ml-auto px-2 py-0.5 rounded bg-emerald-50 text-[#00875A] text-[9px] font-bold">ACTIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-left text-[11px] text-slate-500">
          <div>
            <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-400">Department</span>
            <span className="text-slate-700">Product Management</span>
          </div>
          <div>
            <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-400">Employee ID</span>
            <span className="text-slate-700">EMP-291</span>
          </div>
          <div>
            <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-400">Work Mode</span>
            <span className="text-slate-700">Fully Remote</span>
          </div>
          <div>
            <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-400">Reporting Manager</span>
            <span className="text-slate-700">VP Operations</span>
          </div>
        </div>
      </div>
    )
  },
  'onboarding': {
    title: 'Onboarding',
    icon: <UserPlus size={28} />,
    themeColor: '#00C48C',
    tagline: 'Clean equipment provisioning and document clearance.',
    description: 'Transform manual document collection and access credential handshakes into an interactive visual journey. Coordinate checklist triggers across HR, IT, and Finance teams from a single wizard canvas.',
    benefits: [
      'Eliminate document chasing via portal uploads',
      'Automate IT credentials & hardware checks',
      'Coordinate visual welcome wizard templates',
      'Statutory compliance collection at source'
    ],
    features: [
      { name: 'Visual Setup Wizard', desc: 'Walk candidates through credential creations, equipment selections, and contract signing steps.' },
      { name: 'Multi-Dept Workflows', desc: 'Trigger parallel task groups for IT workspace setups, HR verification checks, and Finance payouts.' },
      { name: 'PII Document Uploads', desc: 'Provide encrypted upload nodes for identities, degree archives, and tax declarations.' },
      { name: 'Hardware Dispatch Logs', desc: 'Link hardware assets, device serial numbers, and equipment checks directly to profiles.' }
    ],
    visualMock: (
      <div className="p-6 rounded-2xl bg-white border border-[#E6FAF4] shadow-md space-y-4">
        <div className="text-left space-y-1">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Progress</h5>
          <h4 className="text-sm font-bold text-slate-800">Sarah Jenkins · Software Dev</h4>
        </div>
        <div className="space-y-2 text-[11px] text-left">
          <div className="flex items-center justify-between p-2 rounded bg-slate-50">
            <span className="text-slate-700 font-semibold">1. Secure PII Uploads</span>
            <span className="text-[#00C48C] font-bold font-mono">✓ DONE</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[#E6FAF4]">
            <span className="text-slate-700 font-semibold">2. Signing Contract</span>
            <span className="text-[#00C48C] font-bold animate-pulse">PENDING SIGN</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-slate-50">
            <span className="text-slate-400">3. Equipment Allocation</span>
            <span className="text-slate-400">QUEUED</span>
          </div>
        </div>
      </div>
    )
  },
  'offboarding': {
    title: 'Offboarding',
    icon: <ArrowRight size={28} />,
    themeColor: '#FF5F57',
    tagline: 'Interactive clearance chains and F&F calculations.',
    description: 'Structure candidate separations with zero friction. Coordinate clearance checklist assignments across departments, track hardware returns, and automate full & final compensation calculations.',
    benefits: [
      'Interactive multi-department approval matrices',
      'Accurate statutory full & final (F&F) payouts',
      'Integrated hardware/asset recovery tracking',
      'Relieving documents auto-generation templates'
    ],
    features: [
      { name: 'Interactive Clearance Node', desc: 'Monitor real-time approval status from IT, Finance, Security, and Admin branches.' },
      { name: 'Settlement Engine', desc: 'Compute exit calculations including leave encashments, unpaid salary, and notice deductions.' },
      { name: 'QR Asset Clearance', desc: 'Scan returns of equipment, access cards, and devices, updating inventory stores automatically.' },
      { name: 'Document Archives', desc: 'Auto-draft and issue official experience letters, relieving documents, and tax forms.' }
    ],
    visualMock: (
      <div className="p-6 rounded-2xl bg-white border border-[#FFF0EF] shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-800">Exit Case: EMP-103</span>
          <span className="px-2 py-0.5 bg-[#FFF0EF] text-[#FF5F57] text-[9px] font-bold rounded">IN PROGRESS</span>
        </div>
        <div className="space-y-2.5 text-[11px] text-left text-slate-600">
          <div className="flex justify-between items-center">
            <span>IT Equipment Clearance:</span>
            <span className="text-emerald-600 font-bold">Cleared</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Library & Security check:</span>
            <span className="text-amber-500 font-bold">In-Progress</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-2 font-bold text-[#FF5F57]">
            <span>Net F&F Settlement:</span>
            <span>₹86,500</span>
          </div>
        </div>
      </div>
    )
  },
  'attendance': {
    title: 'Attendance',
    icon: <Clock size={28} />,
    themeColor: '#2BB5FF',
    tagline: 'Biometric tracking, shift gates, and geo-fencing logs.',
    description: 'Ensure accurate workforce records with built-in location and biometric gateways. Track work schedules, geofence field locations, and resolve attendance regularizations with zero overhead.',
    benefits: [
      'Eliminate time theft via biometric integrations',
      'Manage geofenced shifts planning controls',
      'Resolve regularizations and leave exceptions',
      'Live dashboard mapping global headcount status'
    ],
    features: [
      { name: 'Biometric Sync Gates', desc: 'Hook regional biometric registers, card scanners, or facial gateways to unified ledgers.' },
      { name: 'Geofenced Mobile Punch', desc: 'Enable location-restricted check-ins with IP restriction and GPS checks for field teams.' },
      { name: 'Shift Layout Manager', desc: 'Draw custom shift templates, schedule rotations, and set grace limits.' },
      { name: 'Regularization Hub', desc: 'Coordinate visual approval steps for missed punches, overtime approvals, and schedules.' }
    ],
    visualMock: (
      <div className="p-6 rounded-2xl bg-white border border-[#EAF8FF] shadow-md space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-left">
          <div>
            <h5 className="text-[10px] text-slate-400 uppercase font-bold">Live Status</h5>
            <span className="text-xs font-bold text-slate-800">Office Check-in</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded-full">IN SITE</span>
        </div>
        <div className="space-y-2 text-[11px] text-left font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Punch In:</span>
            <span className="text-slate-800 font-bold">09:12 AM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Punch Out:</span>
            <span className="text-slate-400 font-bold">--:--</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-[#2BB5FF] font-bold">
            <span className="font-sans">Shift Hours:</span>
            <span>8.0h Target</span>
          </div>
        </div>
      </div>
    )
  },
  'leave-management': {
    title: 'Leave Management',
    icon: <CalendarCheck size={28} />,
    themeColor: '#FFB020',
    tagline: 'Visual balance tracker, policy accruals, and approvals.',
    description: 'Empower employees with clear leave balances and visual request forms. Draft granular company policies, configure automatic holiday calculators, and map multi-tier manager approval routes.',
    benefits: [
      'Interactive visual balance tracking cards',
      'Granular leave policy rule configurations',
      'Custom manager approval chain structures',
      'Real-time team leave calendars'
    ],
    features: [
      { name: 'Accrual Engine', desc: 'Define accrual multipliers, rollover policies, encashment thresholds, and leave categories.' },
      { name: 'Interactive Request Forms', desc: 'Apply for leaves, select categories, attach sick certificates, and trace approval paths.' },
      { name: 'Unified Leave Grid', desc: 'Visualize upcoming team leaves to ensure resource planning checks are complete.' },
      { name: 'Statutory Payroll Hooks', desc: 'Sync unpaid leave counts (LWP) directly into monthly payroll calculators.' }
    ],
    visualMock: (
      <div className="p-6 rounded-2xl bg-white border border-[#FFF8E6] shadow-md space-y-4">
        <h5 className="text-xs font-bold text-slate-800 text-left">Leave Balances</h5>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded bg-slate-50 text-center">
            <span className="block text-[14px] font-bold text-slate-800">12</span>
            <span className="text-[8px] text-slate-400 uppercase font-bold">Casual</span>
          </div>
          <div className="p-2 rounded bg-slate-50 text-center">
            <span className="block text-[14px] font-bold text-slate-800">8</span>
            <span className="text-[8px] text-slate-400 uppercase font-bold">Medical</span>
          </div>
          <div className="p-2 rounded bg-[#FFF8E6] text-center border border-[#FFB020]/20">
            <span className="block text-[14px] font-bold text-[#FFB020]">15</span>
            <span className="text-[8px] text-amber-700 uppercase font-bold">Earned</span>
          </div>
        </div>
      </div>
    )
  },
  'payroll': {
    title: 'Payroll',
    icon: <Receipt size={28} />,
    themeColor: '#00C48C',
    tagline: 'Built-in statutory compliance, tax projections, and payouts.',
    description: 'Process global employee compensation profiles with compliance structures built-in. Project income taxes, calculate statutory deductions (PF, ESI, Professional Tax), and generate instant bank payout files.',
    benefits: [
      'SOC-2 secure compensation calculations',
      'Automatic statutory tax slabs and HRA rules',
      'Instant bank settlement file configurations',
      'Clean interactive payslip templates'
    ],
    features: [
      { name: 'Deductions Math', desc: 'Calculate statutory Provident Fund, Employee State Insurance, and Professional Tax allocations.' },
      { name: 'Dynamic Slabs', desc: 'Enforce old vs new tax slab limits, process tax investment submissions, and calculate TDS projections.' },
      { name: 'Bank Ledger Exports', desc: 'Generate bank-compatible payout text/CSV records for one-click payment processing.' },
      { name: 'Self-Service Payslips', desc: 'Publish interactive payslip pdfs with component breakdown and tax summaries.' }
    ],
    visualMock: (
      <div className="p-6 rounded-2xl bg-white border border-[#E6FAF4] shadow-md space-y-4">
        <div className="flex justify-between items-center text-left">
          <h5 className="text-xs font-bold text-slate-800">June Compensation</h5>
          <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">CALCULATED</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-left text-slate-600">
          <div className="flex justify-between">
            <span>Basic monthly base:</span>
            <span className="font-mono font-semibold">₹1,00,000</span>
          </div>
          <div className="flex justify-between">
            <span>House Rent Allowance (HRA):</span>
            <span className="font-mono font-semibold">₹50,000</span>
          </div>
          <div className="flex justify-between text-red-500">
            <span>Provident Fund (12%):</span>
            <span className="font-mono font-semibold">-₹12,000</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-[#00C48C]">
            <span>Net Take-home payout:</span>
            <span className="font-mono">₹1,38,000</span>
          </div>
        </div>
      </div>
    )
  },
  'reports-analytics': {
    title: 'Reports & Analytics',
    icon: <ChartBar size={28} />,
    themeColor: '#FF4C8B',
    tagline: 'Multi-dimensional queries and visual retention curves.',
    description: 'Transform records data into interactive insights. Audit cost structures, track multi-entity retention matrices, check gender balance spreads, and schedule compliance exports directly to administrative inboxes.',
    benefits: [
      'Drag-and-drop custom builder layouts',
      'High-fidelity retention & headcount lines',
      'Scheduled spreadsheet reports inboxes',
      'Segment by hub, entity, and role layers'
    ],
    features: [
      { name: 'Custom Reports Builder', desc: 'Choose metrics, apply conditions, group columns, and export custom CSV sheets.' },
      { name: 'Headcount Timelines', desc: 'Visualize active counts, joining metrics, and departure statistics over custom ranges.' },
      { name: 'Audit History Logs', desc: 'Track employee record changes, authorization actions, and payout runs.' },
      { name: 'Scheduled Emails', desc: 'Set up weekly or monthly reports dispatch to security-cleared admin mailboxes.' }
    ],
    visualMock: (
      <div className="p-6 rounded-2xl bg-white border border-[#FFE6F0] shadow-md space-y-4">
        <h5 className="text-xs font-bold text-slate-800 text-left">Retention Rate</h5>
        <div className="h-16 flex items-end gap-1.5">
          <div className="h-10 w-full bg-pink-100 rounded-sm" />
          <div className="h-12 w-full bg-pink-200 rounded-sm" />
          <div className="h-14 w-full bg-pink-300 rounded-sm" />
          <div className="h-16 w-full bg-[#FF4C8B] rounded-sm flex items-center justify-center text-[8px] font-bold text-white">98%</div>
        </div>
        <span className="text-[10px] text-slate-400 block text-left">Engineering Retention Target: 95%</span>
      </div>
    )
  }
};

export default function HRModulesPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  // Redirect to first module if id not found or invalid
  const activeKey = moduleId && MODULES_DETAIL[moduleId] ? moduleId : 'employee-management';
  const detail = MODULES_DETAIL[activeKey];

  useEffect(() => {
    // Scroll to top on page load/switch
    window.scrollTo(0, 0);
  }, [activeKey]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* ── HEADER NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-[#5B3CF5] text-white flex items-center justify-center font-display font-black text-sm shadow-sm shadow-[#5B3CF5]/20">
            WS
          </div>
          <span className="font-display font-black text-xl tracking-tight text-[#1A1433]">WorkSphere</span>
        </div>

        <nav className="flex items-center gap-5">
          <Link to="/" className="text-xs font-bold text-slate-500 hover:text-[#5B3CF5] transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <button
            onClick={() => navigate('/login')}
            className="hidden sm:inline-block px-4 py-2 border border-slate-200 text-xs font-bold uppercase rounded-full hover:bg-slate-50 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-5 py-2 bg-[#5B3CF5] text-white text-xs font-bold uppercase rounded-full hover:bg-[#3D3BF3] transition-colors shadow-sm shadow-[#5B3CF5]/10"
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="bg-gradient-to-br from-[#0D0A1E] to-[#1A1433] py-20 px-6 sm:px-12 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-[#5B3CF5]/10 to-transparent blur-[130px] opacity-70" />
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-[1.1] text-white">
            {detail.title}
          </h1>
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed">
            {detail.tagline}
          </p>
        </div>
      </section>

      {/* ── CORE DETAILS GRID ── */}
      <main className="max-w-[1280px] mx-auto py-16 px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1">
        
        {/* Left Side Navigation (Desktop Selector) */}
        <aside className="lg:col-span-3 space-y-2 lg:sticky lg:top-24 h-fit">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-left pl-3 mb-4">
            Browse All Modules
          </h4>
          <div className="space-y-1">
            {Object.entries(MODULES_DETAIL).map(([key, item]) => {
              const isActive = key === activeKey;
              return (
                <button
                  key={key}
                  onClick={() => navigate(`/modules/${key}`)}
                  className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-white text-[#5B3CF5] shadow-sm border border-[#E4DFFF]'
                      : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 border border-transparent'
                  }`}
                >
                  <span className={`p-1.5 rounded-lg ${isActive ? 'bg-[#5B3CF5]/10 text-[#5B3CF5]' : 'bg-slate-100 text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center/Right Module Info Area */}
        <div className="lg:col-span-9 space-y-12 text-left">
          
          {/* Main overview and mockup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Module Overview</span>
                <h2 className="text-2xl font-bold text-slate-800">Designed for modern HR pipelines.</h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {detail.description}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Key Advantages</span>
                <ul className="space-y-2">
                  {detail.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-semibold">
                      <CheckCircle size={16} className="text-[#00C48C] shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Interactive/static visual preview card */}
            <div className="p-8 rounded-[24px] bg-gradient-to-br from-slate-100 to-slate-200/50 border border-slate-200/70 flex flex-col justify-center items-stretch h-80 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Visual Preview</div>
              {detail.visualMock}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Deep dive features list */}
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">Deep Dive</span>
              <h3 className="text-xl font-bold text-slate-800">Granular Feature Checklist</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {detail.features.map((feature, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#5B3CF5]/20 transition-all space-y-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5B3CF5] block" />
                  <h5 className="text-xs font-bold text-slate-800">{feature.name}</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Call to Action block */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[#5B3CF5]/10 to-[#2BB5FF]/10 border border-[#C4BBFF]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-800">Ready to orchestrate your enterprise operations?</h4>
              <p className="text-xs text-slate-500">Contact our enterprise solutions team to learn more.</p>
            </div>
            <button
              onClick={() => navigate('/company/contact')}
              className="px-6 py-3 bg-[#5B3CF5] text-white text-xs font-bold uppercase rounded-full hover:bg-[#3D3BF3] transition-colors shadow-md shadow-[#5B3CF5]/10"
            >
              Contact Us
            </button>
          </div>

        </div>
      </main>

      {/* ── FOOTER SECTION ── */}
      <MarketingFooter />

    </div>
  );
}
