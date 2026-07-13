import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MarketingFooter } from '@/components/layout/MarketingFooter/MarketingFooter';
import {
  Sparkle, ArrowLeft, CheckCircle, Info, ShieldCheck, EnvelopeSimple,
  Globe, Clock, HardDrive, Phone, MapPin
} from '@phosphor-icons/react';

// Company detailed content mapping
const SECTIONS_DETAIL: Record<string, {
  title: string;
  tagline: string;
  description: string;
  content: React.ReactNode;
}> = {
  about: {
    title: 'About Us',
    tagline: 'Pioneering workforce infrastructure for global enterprises.',
    description: 'WorkSphere is built by system architects and HR veterans who believe employee directories should not be scattered across legacy registries. Our mission is to unify operations under a single, highly secure compliance plane.',
    content: (
      <div className="space-y-6 text-left">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Our Core Principles</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-2">
            <span className="font-bold text-[#5B3CF5] block">1. Absolute Data Custody</span>
            <p>Every employee record is shielded with AES-256 cryptographic keys. We respect workforce privacy boundaries above all.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-2">
            <span className="font-bold text-[#5B3CF5] block">2. Ledger-grade Audits</span>
            <p>All shifts logs, compensation revisions, and access gateway punches are tracked on a secure temporal ledger.</p>
          </div>
        </div>
      </div>
    )
  },
  contact: {
    title: 'Contact Us',
    tagline: 'Connect with our enterprise solutions desk.',
    description: 'Our system specialists and enterprise support leads are available to assist you with dedicated deployments, SLA setups, and custom data migration templates.',
    content: (
      <div className="space-y-6 text-left">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Enterprise Contact Numbers</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-2 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#5B3CF5]/10 text-[#5B3CF5]">
              <Phone size={20} />
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Primary Support Line</span>
              <span className="text-slate-800 font-bold block text-sm font-mono">+91 9353674689</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-2 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#5B3CF5]/10 text-[#5B3CF5]">
              <Phone size={20} />
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Secondary Support Line</span>
              <span className="text-slate-800 font-bold block text-sm font-mono">+91 8431119696</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    tagline: 'Biographical data security is a fundamental right.',
    description: 'We enforce strict GDPR and CCPA boundaries for all biometric registers, personal identifiers, and payroll compensation records stored within WorkSphere clusters.',
    content: (
      <div className="space-y-4 text-xs text-slate-600 leading-relaxed text-left">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Data Handling Protocols</h4>
        <p>
          WorkSphere acts as a data processor for employee records on behalf of corporate workspace tenants. We do not sell biographical identifiers, track biometric punches beyond the geo-fenced boundaries set by your workspace admin, or persist data in unencrypted storage blocks.
        </p>
        <p>
          All biometric details are stored as mathematical hashes rather than raw fingerprint or face images. You can request record corrections or profile deletion triggers via your organization's HR administrator.
        </p>
      </div>
    )
  },
  'terms-of-service': {
    title: 'Terms of Service',
    tagline: 'Granular legal agreements for active workspace tenancies.',
    description: 'These agreements outline your workspace tenancy bounds, payment terms, and operational obligations when running WorkSphere platform tools.',
    content: (
      <div className="space-y-4 text-xs text-slate-600 leading-relaxed text-left">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Tenancy Agreements</h4>
        <p>
          Each registered company is granted a dedicated, sandboxed workspace instance. You are responsible for ensuring that all employee data, shift records, and payroll calculations comply with regional tax codes and local labor guidelines.
        </p>
        <p>
          Our platform maintains a guaranteed uptime SLA of 99.99%. Service suspensions may occur for unpaid ledger bills or violation of secure directory access protocols.
        </p>
      </div>
    )
  },
  security: {
    title: 'Security',
    tagline: 'SOC 2 Type II compliant zero-trust guardrails.',
    description: 'WorkSphere is built with advanced cryptographic boundaries to guarantee workforce data isolation and biographical record safety.',
    content: (
      <div className="space-y-6 text-left">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Cryptographic Safeguards</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm text-center space-y-2">
            <span className="text-2xl block">🔒</span>
            <span className="font-bold text-slate-800 block text-xs">AES-256 Encryption</span>
            <p className="text-[10px] text-slate-400">All data blocks are encrypted at rest with custom hardware-backed keys.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm text-center space-y-2">
            <span className="text-2xl block">⛨</span>
            <span className="font-bold text-slate-800 block text-xs">Biometric Hashing</span>
            <p className="text-[10px] text-slate-400">Punches use secure irreversible hashing algorithms rather than raw image data.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm text-center space-y-2">
            <span className="text-2xl block">📄</span>
            <span className="font-bold text-slate-800 block text-xs">SOC 2 Trails</span>
            <p className="text-[10px] text-slate-400">Continuous system event auditing logs all administrative adjustments.</p>
          </div>
        </div>
      </div>
    )
  },
  support: {
    title: 'Support',
    tagline: 'Guaranteed SLAs for continuous platform operations.',
    description: 'Our technical help desks provide prompt troubleshooting logs, API integrations assistance, and onboarding wizard support for global enterprises.',
    content: (
      <div className="space-y-4 text-xs text-slate-600 leading-relaxed text-left">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">SLA Escalation Matrix</h4>
        <p>
          Our support tiers ensure high-priority resolution for payroll calculations discrepancies or database accessibility events:
        </p>
        <ul className="space-y-2 font-medium">
          <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Tier 1 (Critical Outage): Resolution within 1 hour</li>
          <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Tier 2 (Payroll calculations check): Resolution within 4 hours</li>
          <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Tier 3 (Biometric configuration assistance): Resolution within 12 hours</li>
        </ul>
      </div>
    )
  }
};

const SECTIONS_LIST = [
  { key: 'about', label: 'About Us' },
  { key: 'contact', label: 'Contact Us' },
  { key: 'privacy-policy', label: 'Privacy Policy' },
  { key: 'terms-of-service', label: 'Terms of Service' },
  { key: 'security', label: 'Security' },
  { key: 'support', label: 'Support' }
];

export default function CompanyPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();

  // Redirect to first section if id not found or invalid
  const activeKey = sectionId && SECTIONS_DETAIL[sectionId] ? sectionId : 'about';
  const detail = SECTIONS_DETAIL[activeKey];

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
            Company Resources
          </h4>
          <div className="space-y-1">
            {SECTIONS_LIST.map((item) => {
              const isActive = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(`/company/${item.key}`)}
                  className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-[#5B3CF5] shadow-sm border border-[#E4DFFF] pl-5'
                      : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center/Right Module Info Area */}
        <div className="lg:col-span-9 space-y-12 text-left">
          
          {/* Main overview */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Information Summary</span>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
              {detail.description}
            </p>
          </div>

          <hr className="border-slate-200" />

          {/* Section specific content */}
          <div>
            {detail.content}
          </div>

          {/* Bottom Call to Action block */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[#5B3CF5]/10 to-[#2BB5FF]/10 border border-[#C4BBFF]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-800">Interested in running WorkSphere ERP?</h4>
              <p className="text-xs text-slate-500">Contact our enterprise consulting desk for more details.</p>
            </div>
            <div>
              <button
                onClick={() => navigate('/company/contact')}
                className="px-6 py-2.5 bg-[#5B3CF5] text-white text-xs font-bold uppercase rounded-full hover:bg-[#3D3BF3] transition-colors shadow-md shadow-[#5B3CF5]/10"
              >
                Contact Sales
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER SECTION ── */}
      <MarketingFooter />

    </div>
  );
}
