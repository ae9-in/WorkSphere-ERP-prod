import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretDown,
  Globe,
  Sparkle,
  LinkedinLogo,
  GithubLogo,
  XLogo,
  EnvelopeSimple,
  ArrowRight,
  ArrowUpRight,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Beams } from '../../ui/Beams/Beams';
import { Logo } from '@/components/ui/Logo/Logo';

export function MarketingFooter() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Company: false,
    Platform: false,
    Legal: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLinkClick = (colTitle: string, item: string) => {
    if (colTitle === 'Platform') {
      if (item === 'Features') {
        if (window.location.pathname === '/') {
          document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate('/#platform');
        }
        return;
      }
      if (item === 'Modules') {
        navigate('/company/support');
        return;
      }
      if (item === 'Pricing') {
        toast.info('Pricing plans will be announced soon!');
        return;
      }
      if (item === 'Integrations') {
        toast.info('Integrations page is coming soon!');
        return;
      }
    }

    if (colTitle === 'Company') {
      const slug = item.toLowerCase();
      navigate(`/company/${slug}`);
      return;
    }

    if (colTitle === 'Legal') {
      const slug = item === 'Privacy' ? 'privacy-policy'
                 : item === 'Terms' ? 'terms-of-service'
                 : item === 'Security' ? 'security'
                 : 'support';
      navigate(`/company/${slug}`);
      return;
    }
  };

  const columns = [
    {
      title: 'Company',
      items: ['About', 'Careers', 'Contact'],
    },
    {
      title: 'Platform',
      items: ['Features', 'Modules', 'Pricing', 'Integrations'],
    },
    {
      title: 'Legal',
      items: ['Privacy', 'Terms', 'Security', 'Compliance'],
    },
  ];

  return (
    <footer className="relative w-full border-t border-[#E8E4FF]/60 bg-gradient-to-b from-[#F8F7FF] via-[#F4F2FF] to-white pt-16 pb-12 px-6 sm:px-12 md:px-24 overflow-hidden rounded-t-[40px] md:rounded-t-[60px] shadow-[0_-12px_40px_rgba(91,60,245,0.02)]">
      
      {/* ── BACKGROUND BEAMS WITH BLUR AND TOP MASK ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Beams with 95% opacity and 8px blur to make them clearly visible on bright backgrounds */}
        <div className="absolute inset-0 opacity-[0.95] blur-[8px]">
          <Beams
            lightColor="#5B3CF5"
            beamWidth={4.5}
            beamHeight={24}
            beamNumber={14}
            speed={1.0}
            noiseIntensity={0.8}
            scale={0.16}
            rotation={0}
          />
        </div>
        {/* Top mask gradient to blend into previous section */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#F8F7FF] to-transparent" />
        {/* Soft radial ambient glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full blur-[140px] opacity-[0.06] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #5B3CF5, transparent 65%)' }}
        />
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto space-y-16">

        {/* ── FOOTER NAVIGATION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 pb-4">
          
          {/* Left Column: Logo & Company Name */}
          <div className="space-y-4 text-left lg:col-span-4">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <Logo showText size={32} />
            </div>
            <p className="text-xs text-[#8E88A8] leading-relaxed max-w-[260px]">
              Modern Enterprise HRMS & Workforce Management Platform built for growing businesses.
            </p>
          </div>

          {/* Right Columns: Three Sections with Equal Distancing */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {columns.map((col) => (
              <div key={col.title} className="text-left">
                {/* Desktop Title */}
                <h5 className="hidden lg:block text-xs font-bold uppercase tracking-wider text-[#1A1433] mb-4">
                  {col.title}
                </h5>

                {/* Mobile/Tablet Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(col.title)}
                  className="lg:hidden w-full flex items-center justify-between py-3.5 border-b border-[#E8E4FF]/50 text-left text-xs font-bold uppercase text-[#1A1433]"
                >
                  <span>{col.title}</span>
                  <motion.div
                    animate={{ rotate: openSections[col.title] ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <CaretDown size={14} className="text-[#8E88A8]" />
                  </motion.div>
                </button>

                {/* Links list */}
                <AnimatePresence initial={false}>
                  {(openSections[col.title] || window.innerWidth >= 1024) && (
                    <motion.ul
                      initial={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : undefined}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 mt-3 lg:mt-0 overflow-hidden"
                    >
                      {col.items.map((item) => (
                        <li key={item} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleLinkClick(col.title, item)}
                            className="group relative inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E88A8] hover:text-[#5B3CF5] transition-all py-0.5"
                          >
                            <span className="relative">
                              {item}
                              {/* Link Underline Animation */}
                              <span className="absolute left-0 right-0 bottom-[-2px] h-[1.5px] bg-[#5B3CF5] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-250 ease-out" />
                            </span>
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>

        {/* ── COPYRIGHT BAR ── */}
        <div className="pt-8 border-t border-[#E8E4FF]/60 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-[#8E88A8] font-semibold">
          
          {/* Left copyright */}
          <div className="text-center md:text-left space-y-0.5">
            <p className="text-[#1A1433] font-bold">© 2026 WorkSphere Technologies Pvt. Ltd.</p>
            <p className="text-[10px] text-[#8E88A8]/80">All Rights Reserved.</p>
          </div>

          {/* Center info */}
          <div className="hidden md:block text-[#8E88A8] text-xs font-medium tracking-wide">
            Built for Modern Enterprises
          </div>

          {/* Right System Info / Status */}
          <div className="flex items-center justify-center md:justify-end gap-5">
            {/* Language Selector */}
            <div className="relative flex items-center gap-1 text-[#8E88A8] hover:text-[#5B3CF5] transition-colors cursor-pointer select-none">
              <Globe size={14} />
              <span>English (US)</span>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}
