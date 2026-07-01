import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, EnvelopeSimple, Sparkle, ArrowLeft, Eye, EyeSlash, ShieldCheck, Users } from '@phosphor-icons/react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api.service';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { toast } from 'sonner';

export default function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your credentials');
      return;
    }

    setLoading(true);
    try {
      const { user, accessToken } = await authService.login(email, password, 'employee');
      setUser(user);
      setAccessToken(accessToken);
      toast.success('Successfully logged in to Employee Portal!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Invalid employee credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-ag-canvas items-center justify-center p-6 relative overflow-hidden">
      {/* Soft Ambient Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-radial-gradient from-ag-accent-mint/5 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-radial-gradient from-ag-primary/5 to-transparent blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ag-ink-3 hover:text-ag-primary transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="w-12 h-12 rounded-2xl bg-ag-accent-mint text-white flex items-center justify-center font-display font-black text-xl shadow-md">
            WS
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-ag-ink mt-3">WorkSphere ERP</h1>
          <p className="text-xs text-ag-ink-3 uppercase font-bold tracking-wider">Employee Portal</p>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-card border border-ag-border bg-white/70 backdrop-blur-xl shadow-lvl3 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<EnvelopeSimple size={18} />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
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

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="bg-ag-accent-mint hover:bg-opacity-95 text-white"
            >
              Sign In to Employee Portal
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs font-bold text-ag-primary hover:underline">
              Are you an HR / Tenant Admin? Login here
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-medium text-ag-ink-3 tracking-wider flex items-center justify-center gap-1.5">
          <CheckCircle size={14} className="text-ag-accent-mint" />
          WorkSphere SaaS Authentication Node v1.0
        </p>

      </div>
    </div>
  );
}
