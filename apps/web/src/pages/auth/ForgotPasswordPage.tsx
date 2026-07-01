import React, { useState } from 'react';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { EnvelopeSimple, ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    toast.success('Password reset instructions sent to your email.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ag-canvas p-6">
      <div className="w-full max-w-md bg-ag-surface rounded-2xl border border-ag-border p-8 shadow-modal space-y-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-ag-primary hover:underline">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div>
          <h2 className="font-display font-bold text-2xl text-ag-ink">Reset your password</h2>
          <p className="text-sm text-ag-ink-3 mt-1">
            Enter your registered work email address and we'll send you recovery instructions.
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<EnvelopeSimple size={18} />}
              required
            />
            <Button type="submit" fullWidth size="lg">
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-[#E6FAF4] text-[#00875A] text-sm font-medium text-center space-y-2">
            <p className="font-bold">Check your inbox!</p>
            <p className="text-xs text-[#00875A]/80">We have dispatched password recovery details to {email}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
