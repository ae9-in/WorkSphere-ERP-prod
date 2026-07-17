import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { ShieldCheck, ArrowLeft } from '@phosphor-icons/react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function MFAPage() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      toast.success('MFA Verification Successful');
      navigate('/');
    } else {
      toast.error('Enter a valid 6-digit code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ag-canvas p-6">
      <div className="w-full max-w-md bg-ag-surface rounded-2xl border border-ag-border p-8 shadow-modal space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ag-primary-light text-ag-primary flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck size={32} />
        </div>

        <div>
          <h2 className="font-display font-bold text-2xl text-ag-ink">Two-Factor Authentication</h2>
          <p className="text-sm text-ag-ink-3 mt-1">
            Enter the 6-digit verification code from your authenticator app (Google Authenticator / Authy).
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center font-mono text-3xl tracking-widest h-14 border-2 border-ag-border rounded-xl focus:border-ag-primary focus:outline-none bg-ag-surface-2/40 text-ag-ink font-bold"
          />

          <Button type="submit" fullWidth size="lg" disabled={code.length !== 6}>
            Verify & Continue
          </Button>
        </form>

        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-ag-ink-3 hover:text-ag-ink">
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}

