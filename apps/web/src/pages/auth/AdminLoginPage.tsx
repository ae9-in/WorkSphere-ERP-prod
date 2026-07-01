import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, EnvelopeSimple, Sparkle, ArrowLeft, Eye, EyeSlash, ShieldCheck } from '@phosphor-icons/react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api.service';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all credentials');
      return;
    }

    setLoading(true);
    try {
      const { user, accessToken } = await authService.login(email, password, 'super_admin');
      setUser(user);
      setAccessToken(accessToken);
      toast.success('Access authorized. Welcome, Platform Administrator.');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Invalid admin credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0A051D] text-white items-center justify-center p-6 relative overflow-hidden">
      {/* SaaS Cybernetic Neon Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-radial-gradient from-ag-primary/20 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-radial-gradient from-ag-accent-pink/10 to-transparent blur-[120px] pointer-events-none" />
      
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

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ag-primary to-ag-accent-pink text-white flex items-center justify-center font-display font-black text-xl shadow-lg shadow-ag-primary/20">
            WS
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-white mt-3">WorkSphere Platform</h1>
          <p className="text-xs text-ag-ink-3 uppercase font-bold tracking-wider">Super Admin Console</p>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-card border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider block">Administrator Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<EnvelopeSimple size={18} />}
                className="bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-ag-primary focus:ring-ag-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider block">Secure Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock size={18} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/40 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                }
                className="bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-ag-primary focus:ring-ag-primary"
                required
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="bg-gradient-to-r from-ag-primary to-ag-accent-indigo text-white hover:opacity-90 shadow-md shadow-ag-primary/25 border-none mt-2"
            >
              Authorize Session
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/5 text-[10px] text-white/40 flex items-center justify-between font-mono">
          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-ag-accent-mint" /> Platform Node SEC-01</span>
          <span>© 2026 WorkSphere OS</span>
        </div>

      </div>
    </div>
  );
}
