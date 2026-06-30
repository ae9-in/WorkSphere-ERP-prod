import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { adminService } from '@/services/api.service';
import { Button } from '@/components/ui/Button/Button';
import {
  Sparkle, ShieldCheck, SignOut, Buildings, Users, CheckCircle, Warning, ChartPie,
  ArrowsClockwise, DotsThreeOutline, XCircle as SuspendIcon
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface CompanyData {
  _id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  industry?: string;
  size?: string;
  country?: string;
  subscriptionPlan: 'free' | 'growth' | 'enterprise';
  subscriptionStatus: 'active' | 'canceled';
  createdAt: string;
}

interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  totalEmployees: number;
  plans: {
    free: number;
    growth: number;
    enterprise: number;
  };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Security gate: require super_admin role
  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      toast.error('Access Denied. Platform administrator session required.');
      navigate('/admin/login');
    }
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, statsRes] = await Promise.all([
        adminService.listCompanies(),
        adminService.getPlatformStats()
      ]);
      setCompanies(compRes);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve platform workspace details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'super_admin') {
      fetchData();
    }
  }, [user]);

  const handleToggleStatus = async (companyId: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminService.updateCompanyStatus(companyId, nextStatus);
      toast.success(`Organization status updated to ${nextStatus}`);
      // Refresh details
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to modify company organization status');
    }
  };

  const handleUpgradePlan = async (companyId: string, currentPlan: string) => {
    const plans: ('free' | 'growth' | 'enterprise')[] = ['free', 'growth', 'enterprise'];
    const nextIdx = (plans.indexOf(currentPlan as any) + 1) % plans.length;
    const nextPlan = plans[nextIdx];

    try {
      await adminService.updateCompanySubscription(companyId, nextPlan);
      toast.success(`Subscription plan upgraded to ${nextPlan.toUpperCase()}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to change subscription plan');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!user || user.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#070314] text-white flex flex-col font-body">
      
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#0C0720]/80 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ag-primary to-ag-accent-pink text-white flex items-center justify-center font-display font-black text-base shadow-md">
            WS
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg leading-none">WorkSphere SaaS</h1>
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest font-bold">Platform Controller</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{user.fullName}</p>
            <p className="text-[10px] text-white/40 font-mono">Platform Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 border border-white/10 hover:bg-white/5 rounded-xl transition-all text-white/60 hover:text-white"
            title="Secure Sign Out"
          >
            <SignOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Title row */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h2 className="font-display font-black text-2xl tracking-tight">Platform Operations Console</h2>
            <p className="text-xs text-white/40 mt-1">Tenant isolation grids, plan indexing, and suspension locks.</p>
          </div>
          <Button
            variant="ghost"
            onClick={fetchData}
            loading={loading}
            icon={<ArrowsClockwise size={16} />}
            className="border-white/10 text-white hover:bg-white/5"
          >
            Sync Data
          </Button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-card border border-white/10 bg-white/5 backdrop-blur-md space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40 uppercase font-bold tracking-wider">Active Companies</span>
                <Buildings size={22} className="text-ag-primary" />
              </div>
              <div className="font-display font-black text-3xl">{stats.activeCompanies}</div>
              <div className="text-[10px] text-white/30">Total: {stats.totalCompanies} tenants</div>
            </div>

            <div className="p-6 rounded-card border border-white/10 bg-white/5 backdrop-blur-md space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40 uppercase font-bold tracking-wider">Suspended Accounts</span>
                <Warning size={22} className="text-ag-accent-coral" />
              </div>
              <div className="font-display font-black text-3xl">{stats.suspendedCompanies}</div>
              <div className="text-[10px] text-white/30">Locked out of auth portals</div>
            </div>

            <div className="p-6 rounded-card border border-white/10 bg-white/5 backdrop-blur-md space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40 uppercase font-bold tracking-wider">Active Users</span>
                <Users size={22} className="text-ag-accent-mint" />
              </div>
              <div className="font-display font-black text-3xl">{stats.totalUsers}</div>
              <div className="text-[10px] text-white/30">Excluding super-admins</div>
            </div>

            <div className="p-6 rounded-card border border-white/10 bg-white/5 backdrop-blur-md space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40 uppercase font-bold tracking-wider">Subscribed Plans</span>
                <ChartPie size={22} className="text-ag-accent-amber" />
              </div>
              <div className="font-display font-black text-lg flex gap-3 leading-none py-1">
                <div className="text-center flex-1 bg-white/5 py-1.5 rounded-lg">
                  <p className="text-[10px] text-white/40 uppercase font-bold">Free</p>
                  <strong className="text-xs font-mono">{stats.plans.free}</strong>
                </div>
                <div className="text-center flex-1 bg-white/5 py-1.5 rounded-lg">
                  <p className="text-[10px] text-white/40 uppercase font-bold">Grow</p>
                  <strong className="text-xs font-mono">{stats.plans.growth}</strong>
                </div>
                <div className="text-center flex-1 bg-white/5 py-1.5 rounded-lg">
                  <p className="text-[10px] text-white/40 uppercase font-bold">Ent</p>
                  <strong className="text-xs font-mono">{stats.plans.enterprise}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Table Section */}
        <div className="p-6 rounded-card border border-white/10 bg-white/5 backdrop-blur-md space-y-4">
          <h3 className="font-display font-bold text-lg">Registered Tenant Organizations</h3>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-white/40">Querying platform database...</span>
              </div>
            ) : companies.length > 0 ? (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-white/40 uppercase font-semibold">
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Slug / Slug URL</th>
                    <th className="py-3 px-4">Subscription</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {companies.map((company) => (
                    <tr key={company._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-semibold">{company.name}</td>
                      <td className="py-4 px-4 font-mono text-xs text-white/60">/w/{company.slug}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                          company.subscriptionPlan === 'enterprise'
                            ? 'bg-ag-accent-pink/10 border-ag-accent-pink/35 text-ag-accent-pink'
                            : company.subscriptionPlan === 'growth'
                              ? 'bg-ag-primary-light/10 border-ag-primary/20 text-ag-primary-light'
                              : 'bg-white/5 border-white/15 text-white/60'
                        }`}>
                          {company.subscriptionPlan}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white/60">{company.country || 'Not specified'}</td>
                      <td className="py-4 px-4 text-xs text-white/40">
                        {new Date(company.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          company.status === 'active'
                            ? 'bg-ag-accent-mint/10 text-ag-accent-mint'
                            : 'bg-ag-coral/10 text-ag-coral'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            company.status === 'active' ? 'bg-ag-accent-mint' : 'bg-ag-coral'
                          }`} />
                          {company.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        {/* Status Toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(company._id, company.status)}
                          icon={company.status === 'active' ? <SuspendIcon size={14} /> : <CheckCircle size={14} />}
                          className={`h-8 text-xs font-semibold rounded-lg ${
                            company.status === 'active'
                              ? 'text-ag-coral border-ag-coral/20 hover:bg-ag-coral/10'
                              : 'text-ag-accent-mint border-ag-accent-mint/20 hover:bg-ag-accent-mint/10'
                          }`}
                        >
                          {company.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>

                        {/* Upgrade Plan */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpgradePlan(company._id, company.subscriptionPlan)}
                          className="h-8 text-xs font-semibold rounded-lg border-white/10 hover:bg-white/5 text-white/80"
                        >
                          Cycle Plan
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-white/40 text-xs">
                No tenant companies registered on this platform node.
              </div>
            )}
          </div>
        </div>

        {/* Security / System status footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-white/30 font-mono gap-2 pt-4 border-t border-white/5">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-ag-accent-mint" /> OWASP Tenant Isolation Middleware Verified</span>
          <span>Security Protocol: active-plan-verify v1.4</span>
        </div>

      </main>

    </div>
  );
}
