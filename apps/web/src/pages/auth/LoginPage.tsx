import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Lock, EnvelopeSimple, GoogleLogo, Sparkle, ShieldCheck, ArrowLeft } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password, 'tenant_admin');
    setLoading(false);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-ag-canvas overflow-hidden">
      {/* Left Panel - 55% */}
      <div className="hidden lg:flex lg:w-[55%] bg-ag-primary p-12 flex-col justify-between relative overflow-hidden text-white">
        {/* Abstract Geometric Overlay Patterns */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-ag-indigo/40 blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <Logo size={40} variant="white" />
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
              <span>Enterprise Release v1.0 • Built for Scale</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl leading-tight text-white">
              Work Without Weight. Enterprise HR & Payroll Unleashed.
            </h1>
            <p className="text-white/80 text-base leading-relaxed">
              Experience lightning-fast employee management, automated Indian payroll compliance, and effortless attendance tracking in one intuitive workspace.
            </p>
          </motion.div>

        </div>

        {/* Footer Quote */}
        <div className="relative z-10 pt-6 border-t border-white/15 text-xs text-white/70 flex items-center justify-between">
          <span>© 2026 WorkSphere Technologies. All rights reserved.</span>
          <span className="flex items-center gap-1"><ShieldCheck size={16} /> OWASP Secured</span>
        </div>
      </div>

      {/* Right Panel - 45% */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 sm:p-12 bg-ag-surface">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ag-ink-3 hover:text-ag-primary transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="space-y-2">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <Logo size={36} />
            </div>
            <h2 className="font-display font-extrabold text-3xl text-ag-ink">Welcome back</h2>
            <p className="text-sm text-ag-ink-3">Sign in to access your WorkSphere ERP dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<EnvelopeSimple size={18} />}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={18} />}
                required
              />
              <div className="flex justify-end">
                <a href="/forgot-password" className="text-xs font-semibold text-ag-primary hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg">
              Sign In to WorkSpace
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ag-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-ag-surface px-3 text-ag-ink-3 font-semibold">Or continue with</span>
            </div>
          </div>

          <Button
            variant="ghost"
            fullWidth
            size="lg"
            onClick={() => alert('Google Single Sign-On is configured via corporate OAuth in settings.')}
            icon={<GoogleLogo size={20} className="text-ag-coral" />}
          >
            Sign in with Google Workspace
          </Button>

          <p className="text-center text-xs text-ag-ink-3">
            Need help accessing your account? Contact your company HR or IT administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
