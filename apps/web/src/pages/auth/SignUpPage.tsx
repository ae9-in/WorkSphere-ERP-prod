import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, EnvelopeSimple, GoogleLogo, Sparkle, ShieldCheck,
  ArrowLeft, Eye, EyeSlash, Users, Receipt, Fingerprint, Cpu,
  Phone, Building, Globe, CheckCircle, CaretDown, MagnifyingGlass
} from '@phosphor-icons/react';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';

const COUNTRIES = [
  'Australia', 'Canada', 'France', 'Germany', 'India',
  'Japan', 'Singapore', 'United Arab Emirates', 'United Kingdom', 'United States'
];

export default function SignUpPage() {
  const navigate = useNavigate();

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // UX states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTouched, setIsTouched] = useState<Record<string, boolean>>({});

  // Searchable Country Dropdown states
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  // Close country dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: '', percent: 0, color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: 'Weak', percent: 33, color: 'bg-ag-coral' };
    if (score <= 3) return { label: 'Medium', percent: 66, color: 'bg-ag-amber' };
    return { label: 'Strong', percent: 100, color: 'bg-ag-accent-mint' };
  };

  const passwordStrength = getPasswordStrength();

  // Field real-time validation
  const validateField = (name: string, value: any) => {
    let errorMsg = '';
    switch (name) {
      case 'firstName':
        if (!value.trim()) errorMsg = 'First name is required';
        break;
      case 'lastName':
        if (!value.trim()) errorMsg = 'Last name is required';
        break;
      case 'companyName':
        if (!value.trim()) errorMsg = 'Company name is required';
        break;
      case 'email':
        if (!value.trim()) {
          errorMsg = 'Work email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMsg = 'Please enter a valid work email address';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          errorMsg = 'Phone number is required';
        } else if (!/^\+?[0-9\s\-()]{10,20}$/.test(value)) {
          errorMsg = 'Please enter a valid phone number';
        }
        break;
      case 'companySize':
        if (!value) errorMsg = 'Please select your company size';
        break;
      case 'country':
        if (!value) errorMsg = 'Please select your country';
        break;
      case 'password':
        if (!value) {
          errorMsg = 'Password is required';
        } else if (value.length < 8) {
          errorMsg = 'Password must be at least 8 characters long';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errorMsg = 'Please confirm your password';
        } else if (value !== password) {
          errorMsg = 'Passwords do not match';
        }
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleBlur = (name: string, value: any) => {
    setIsTouched(prev => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleInputChange = (name: string, value: any, setter: (val: any) => void) => {
    setter(value);
    if (isTouched[name]) {
      const errorMsg = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const formFields = {
      firstName, lastName, companyName, email, phone,
      companySize, country, password, confirmPassword
    };

    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    Object.entries(formFields).forEach(([key, val]) => {
      newTouched[key] = true;
      const errorMsg = validateField(key, val);
      if (errorMsg) newErrors[key] = errorMsg;
    });

    if (!acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    setIsTouched(newTouched);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    // Simulate production-grade registration delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setLoading(false);
    setSuccess(true);

    // Wait for success check animation, then redirect to setup flow
    setTimeout(() => {
      navigate('/workspace-setup', {
        state: {
          signupData: {
            firstName,
            lastName,
            companyName,
            email,
            phone,
            companySize,
            country,
            password
          }
        }
      });
    }, 1500);
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full flex bg-ag-canvas overflow-hidden">
      {/* Left Panel - 55% */}
      <div className="hidden lg:flex lg:w-[55%] bg-ag-primary p-12 flex-col justify-between relative overflow-hidden text-white">
        {/* Abstract Geometric Overlay Patterns */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-ag-indigo/40 blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-ag-primary flex items-center justify-center font-display font-bold text-lg shadow-md">
            WS
          </div>
          <span className="font-display font-extrabold text-2xl tracking-tight">WorkSphere ERP</span>
        </div>

        {/* Dynamic Scene Content */}
        <div className="relative z-10 my-auto max-w-lg space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold">
              <Sparkle size={16} className="text-ag-amber" />
              <span>Enterprise Workspace Setup • Scaled for Teams</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl leading-tight text-white">
              A single unified plane for your entire workspace.
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Deploy compliance directories, automated payroll components, and geofenced timesheets in seconds.
            </p>
          </motion.div>

          {/* Benefits Callouts */}
          <div className="space-y-4">
            {[
              { title: "100ms Latency Directory", desc: "Unified workforce records syncing globally in real-time.", icon: <Users size={18} /> },
              { title: "Built-in Payroll Compliance", desc: "Compliance check automation across regional labor laws.", icon: <Receipt size={18} /> },
              { title: "Biometric & GPS Timesheets", desc: "Anti-spoof, zero-hardware clock-ins with visual audit trails.", icon: <Fingerprint size={18} /> },
              { title: "Cognitive AI Copilot", desc: "Ask complex analytical queries in natural conversational language.", icon: <Cpu size={18} /> }
            ].map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm"
              >
                <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                  {b.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{b.title}</h4>
                  <p className="text-xs text-white/70 mt-0.5">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Floating ERP Dashboard Card */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl space-y-3 max-w-sm"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] uppercase font-bold text-white tracking-wider">Live System Sync</span>
              <span className="w-2 h-2 rounded-full bg-ag-accent-mint animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 bg-white/20 rounded w-2/3" />
              <div className="h-6 bg-white/10 rounded w-full border-l-2 border-ag-primary-light" />
              <div className="h-6 bg-white/10 rounded w-full border-l-2 border-ag-accent-amber" />
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 pt-6 border-t border-white/15 text-xs text-white/70 flex items-center justify-between">
          <span>© 2026 WorkSphere Technologies. All rights reserved.</span>
          <span className="flex items-center gap-1"><ShieldCheck size={16} /> OWASP Secured</span>
        </div>
      </div>

      {/* Right Panel - 45% */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 bg-ag-surface overflow-y-auto no-scrollbar">
        <div className="w-full max-w-lg space-y-6 py-6 relative">
          
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ag-ink-3 hover:text-ag-primary transition-colors w-fit"
                  >
                    <ArrowLeft size={16} />
                    Back to Home
                  </Link>

                  <div className="lg:hidden flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-xl bg-ag-primary text-white flex items-center justify-center font-display font-bold text-lg">
                      WS
                    </div>
                    <span className="font-display font-extrabold text-2xl text-ag-ink">WorkSphere</span>
                  </div>

                  <h2 className="font-display font-extrabold text-3xl text-ag-ink mt-2">Create your Workspace</h2>
                  <p className="text-sm text-ag-ink-3">Set up your single unified pane in under 2 minutes.</p>
                </div>

                {/* Signup Card */}
                <div className="p-6 sm:p-8 rounded-card border border-ag-border bg-white/70 backdrop-blur-xl shadow-lvl2 space-y-5">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        value={firstName}
                        onChange={e => handleInputChange('firstName', e.target.value, setFirstName)}
                        onBlur={e => handleBlur('firstName', e.target.value)}
                        error={errors.firstName}
                        required
                      />
                      <Input
                        label="Last Name"
                        value={lastName}
                        onChange={e => handleInputChange('lastName', e.target.value, setLastName)}
                        onBlur={e => handleBlur('lastName', e.target.value)}
                        error={errors.lastName}
                        required
                      />
                    </div>

                    <Input
                      label="Company Legal Name"
                      value={companyName}
                      onChange={e => handleInputChange('companyName', e.target.value, setCompanyName)}
                      onBlur={e => handleBlur('companyName', e.target.value)}
                      error={errors.companyName}
                      icon={<Building size={18} />}
                      required
                    />

                    <Input
                      label="Work Email"
                      type="email"
                      value={email}
                      onChange={e => handleInputChange('email', e.target.value, setEmail)}
                      onBlur={e => handleBlur('email', e.target.value)}
                      error={errors.email}
                      icon={<EnvelopeSimple size={18} />}
                      required
                    />

                    <Input
                      label="Phone Number"
                      type="tel"
                      value={phone}
                      onChange={e => handleInputChange('phone', e.target.value, setPhone)}
                      onBlur={e => handleBlur('phone', e.target.value)}
                      error={errors.phone}
                      icon={<Phone size={18} />}
                      required
                    />

                    {/* Dropdowns row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Company Size */}
                      <div className="w-full flex flex-col gap-1.5">
                        <label className="ag-label ag-label--required">Company Size</label>
                        <div className="relative flex items-center">
                          <select
                            value={companySize}
                            onChange={e => handleInputChange('companySize', e.target.value, setCompanySize)}
                            onBlur={e => handleBlur('companySize', e.target.value)}
                            className={`ag-input appearance-none pr-10 cursor-pointer ${errors.companySize ? 'ag-input--error' : ''}`}
                            required
                          >
                            <option value="">Select size...</option>
                            <option value="1-20">1 - 20 employees</option>
                            <option value="21-99">21 - 99 employees</option>
                            <option value="100-499">100 - 499 employees</option>
                            <option value="500-1999">500 - 1,999 employees</option>
                            <option value="2000+">2,000+ employees</option>
                          </select>
                          <div className="absolute right-3.5 text-ag-ink-3 pointer-events-none flex items-center justify-center">
                            <CaretDown size={16} />
                          </div>
                        </div>
                        {errors.companySize && <span className="ag-helper ag-helper--error">{errors.companySize}</span>}
                      </div>

                      {/* Searchable Country Dropdown */}
                      <div className="w-full flex flex-col gap-1.5" ref={countryRef}>
                        <label className="ag-label ag-label--required">Country</label>
                        <div className="relative">
                          <div
                            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                            className={`ag-input flex items-center justify-between cursor-pointer pr-10 select-none ${errors.country ? 'ag-input--error' : ''}`}
                          >
                            <span className={country ? 'text-ag-ink' : 'text-ag-ink-3'}>
                              {country || 'Select country...'}
                            </span>
                            <div className="flex items-center gap-1.5 text-ag-ink-3">
                              <Globe size={18} />
                              <CaretDown size={16} />
                            </div>
                          </div>

                          <AnimatePresence>
                            {countryDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 right-0 top-12 mt-1 z-30 bg-white border border-ag-border rounded-xl shadow-lvl3 overflow-hidden"
                              >
                                <div className="p-2 border-b border-ag-border flex items-center gap-2 bg-ag-surface-2/45">
                                  <MagnifyingGlass size={16} className="text-ag-ink-3" />
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={countrySearch}
                                    onChange={e => setCountrySearch(e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    className="w-full bg-transparent border-none text-xs outline-none py-1 text-ag-ink"
                                  />
                                </div>
                                <div className="max-h-40 overflow-y-auto no-scrollbar">
                                  {filteredCountries.length > 0 ? (
                                    filteredCountries.map(c => (
                                      <div
                                        key={c}
                                        onClick={() => {
                                          handleInputChange('country', c, setCountry);
                                          setCountryDropdownOpen(false);
                                          setCountrySearch('');
                                        }}
                                        className="px-4 py-2 text-xs text-ag-ink hover:bg-ag-primary-light hover:text-ag-primary cursor-pointer transition-colors"
                                      >
                                        {c}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-xs text-ag-ink-3 text-center">
                                      No countries found
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {errors.country && <span className="ag-helper ag-helper--error">{errors.country}</span>}
                      </div>
                    </div>

                    {/* Password Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Password */}
                      <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => handleInputChange('password', e.target.value, setPassword)}
                        onBlur={e => handleBlur('password', e.target.value)}
                        error={errors.password}
                        icon={<Lock size={18} />}
                        iconRight={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-ag-ink-3 hover:text-ag-primary transition-colors focus:outline-none"
                          >
                            {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                          </button>
                        }
                        required
                      />

                      {/* Confirm Password */}
                      <Input
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => handleInputChange('confirmPassword', e.target.value, setConfirmPassword)}
                        onBlur={e => handleBlur('confirmPassword', e.target.value)}
                        error={errors.confirmPassword}
                        icon={<Lock size={18} />}
                        iconRight={
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="text-ag-ink-3 hover:text-ag-primary transition-colors focus:outline-none"
                          >
                            {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                          </button>
                        }
                        required
                      />
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-ag-ink-3">Password Strength:</span>
                          <span className={
                            passwordStrength.label === 'Weak' ? 'text-ag-coral' :
                            passwordStrength.label === 'Medium' ? 'text-ag-amber' : 'text-ag-accent-mint'
                          }>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength.percent}%` }}
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Accept Terms Checkbox */}
                    <div className="flex flex-col gap-1">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none py-1">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={e => {
                            setAcceptTerms(e.target.checked);
                            if (e.target.checked && errors.acceptTerms) {
                              setErrors(prev => ({ ...prev, acceptTerms: '' }));
                            }
                          }}
                          className="mt-0.5 rounded border-ag-border text-ag-primary focus:ring-ag-primary focus:ring-offset-0 focus:outline-none"
                        />
                        <span className="text-xs text-ag-ink-2 leading-relaxed">
                          I agree to the{' '}
                          <a href="/terms" onClick={e => e.preventDefault()} className="font-semibold text-ag-primary hover:underline">
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="/privacy" onClick={e => e.preventDefault()} className="font-semibold text-ag-primary hover:underline">
                            Privacy Policy
                          </a>.
                        </span>
                      </label>
                      {errors.acceptTerms && (
                        <span className="ag-helper ag-helper--error text-xs">{errors.acceptTerms}</span>
                      )}
                    </div>

                    <Button type="submit" loading={loading} fullWidth size="lg">
                      Create Workspace
                    </Button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-ag-border" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-white px-3 text-ag-ink-3 font-bold tracking-wider">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    fullWidth
                    size="lg"
                    onClick={() => alert('OAuth registration enabled in production environments.')}
                    icon={<GoogleLogo size={20} className="text-ag-accent-coral" />}
                  >
                    Continue with Google
                  </Button>
                </div>

                <p className="text-center text-xs text-ag-ink-3">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold text-ag-primary hover:underline">
                    Sign In
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="signup-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center p-8 text-center space-y-6 bg-white border border-ag-border rounded-card shadow-lvl4 my-auto h-[480px]"
              >
                <div className="w-20 h-20 rounded-full bg-ag-emerald flex items-center justify-center shadow-lvl1">
                  <svg className="w-10 h-10 text-ag-accent-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-2xl text-ag-ink">Account Created!</h3>
                  <p className="text-xs text-ag-ink-3 max-w-xs mx-auto leading-relaxed">
                    WorkSphere workspace account initialized. Redirecting to workspace creation setup...
                  </p>
                </div>
                <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
