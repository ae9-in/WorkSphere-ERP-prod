import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, Globe, Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';

export function MarketingFooter() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Platform: false,
    'HR Modules': false,
    Company: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFooterLinkClick = (title: string, item: string) => {
    if (title === 'Platform') {
      const elementId = item === 'Overview' ? 'overview'
                      : item === 'Features' ? 'platform'
                      : item === 'Solutions' ? 'solutions'
                      : 'roadmap';
      
      // If we are on the landing page, scroll smoothly.
      // Otherwise, navigate back to home with the hash.
      if (window.location.pathname === '/') {
        document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/#${elementId}`);
      }
      return;
    }

    if (title === 'HR Modules') {
      const targetSlug = item === 'Employee Management' ? 'employee-management'
                       : item === 'Onboarding' ? 'onboarding'
                       : item === 'Offboarding' ? 'offboarding'
                       : item === 'Attendance' ? 'attendance'
                       : item === 'Leave Management' ? 'leave-management'
                       : item === 'Payroll' ? 'payroll'
                       : 'reports-analytics';
      navigate(`/modules/${targetSlug}`);
      return;
    }

    if (title === 'Company') {
      const targetSlug = item === 'About' ? 'about'
                       : item === 'Contact' ? 'contact'
                       : item === 'Privacy Policy' ? 'privacy-policy'
                       : item === 'Terms of Service' ? 'terms-of-service'
                       : item === 'Security' ? 'security'
                       : 'support';
      navigate(`/company/${targetSlug}`);
      return;
    }
  };

  return (
    <footer className="relative z-10 bg-white border-t border-[#E4DFFF]/60 py-16 px-6 sm:px-12 md:px-24">
      {/* Style block for animations and premium hover effects */}
      <style>{`
        .footer-link-underline {
          position: relative;
          color: #8E88A8;
          transition: color 0.2s ease, transform 0.2s ease;
          display: inline-block;
        }
        .footer-link-underline:hover {
          color: #5B3CF5;
          transform: translateX(2px);
        }
        .footer-link-underline::after {
          content: '';
          position: absolute;
          width: 100%;
          transform: scaleX(0);
          height: 1.5px;
          bottom: -2px;
          left: 0;
          background-color: #5B3CF5;
          transform-origin: bottom right;
          transition: transform 0.25s ease-out;
        }
        .footer-link-underline:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
      `}</style>

      {/* 1. FOUR-COLUMN LAYOUT */}
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-16">
        
        {/* Column 1: Logo & Brand Info */}
        <div className="space-y-5 text-left md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-[#5B3CF5] text-white flex items-center justify-center font-display font-black text-sm shadow-sm shadow-[#5B3CF5]/20">
              WS
            </div>
            <span className="font-display font-black text-xl tracking-tight text-[#1A1433]">WorkSphere</span>
          </div>
          <p className="text-xs text-ag-ink-3 leading-relaxed max-w-[240px]">
            Modern Enterprise HRMS & Workforce Management Platform built for growing businesses.
          </p>
        </div>

        {/* Section list maps */}
        {[
          {
            title: 'Platform',
            items: ['Overview', 'Features', 'Solutions', 'Roadmap']
          },
          {
            title: 'HR Modules',
            items: [
              'Employee Management',
              'Onboarding',
              'Offboarding',
              'Attendance',
              'Leave Management',
              'Payroll',
              'Reports & Analytics'
            ]
          },
          {
            title: 'Company',
            items: ['About', 'Contact', 'Privacy Policy', 'Terms of Service', 'Security', 'Support']
          }
        ].map((sec) => (
          <div key={sec.title} className="text-left">
            {/* Header for Desktop */}
            <h5 className="hidden lg:block text-xs font-bold uppercase tracking-wider text-[#1A1433] mb-4">
              {sec.title}
            </h5>

            {/* Mobile/Tablet Accordion Header Button */}
            <button
              type="button"
              onClick={() => toggleSection(sec.title)}
              className="lg:hidden w-full flex items-center justify-between py-3 border-b border-[#E4DFFF]/55 text-left text-xs font-bold uppercase text-[#1A1433]"
            >
              <span>{sec.title}</span>
              <motion.div
                animate={{ rotate: openSections[sec.title] ? 180 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <CaretDown size={14} className="text-ag-ink-3" />
              </motion.div>
            </button>

            {/* Link list */}
            <AnimatePresence initial={false}>
              {(openSections[sec.title] || window.innerWidth >= 1024) && (
                <motion.ul
                  initial={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                  animate={window.innerWidth < 1024 ? { height: 'auto', opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : undefined}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5 mt-3 lg:mt-0 overflow-hidden"
                >
                  {sec.items.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        onClick={() => handleFooterLinkClick(sec.title, item)}
                        className="footer-link-underline text-xs font-semibold text-left"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}

      </div>

      {/* 2. BOTTOM BAR */}
      <div className="max-w-[1280px] mx-auto pt-8 border-t border-[#E4DFFF]/55 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-[#8E88A8] font-semibold">
        
        {/* Left copyright */}
        <div className="text-center md:text-left space-y-0.5">
          <p className="text-ag-ink-2 font-bold">© 2026 WorkSphere Technologies Pvt. Ltd.</p>
          <p className="text-[10px] text-ag-ink-3">All Rights Reserved.</p>
        </div>

        {/* Right utilities: Lang */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-5">
          {/* Language Selector */}
          <div className="relative flex items-center gap-1 text-ag-ink-2 hover:text-[#5B3CF5] transition-colors cursor-pointer select-none">
            <Globe size={14} />
            <span>English (US)</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
