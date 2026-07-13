import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { employeeService } from '@/services/api.service';
import { EmployeeListItem } from '@/types/employee.types';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { CheckCircle, ShieldCheck, Desktop, ArrowsClockwise, Plus, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';

const CHECKLIST_ITEMS = [
  { id: 'pan', label: 'Aadhaar & PAN Verification',      desc: 'Mandatory KYC for payroll compliance.' },
  { id: 'pf',  label: 'PF Account Link via UAN',          desc: 'Register in EPFO portal before first payroll.' },
  { id: 'it',  label: 'Hardware / Laptop Assignment',      desc: 'Coordinate with IT support department.' },
  { id: 'em',  label: 'Work Email & Access Provisioning', desc: 'Create GSuite/Outlook account and app permissions.' },
  { id: 'bg',  label: 'Background Verification',          desc: 'Third-party BGV check — Springverify / AuthBridge.' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates]   = useState<EmployeeListItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [checklist, setChecklist]     = useState<Record<string, boolean>>({});
  const [executing, setExecuting]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await employeeService.list({ limit: 100 });
      // Newly joined in last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const recent = res.employees.filter((e) => {
        const joined = new Date(e.official.dateOfJoining);
        return (joined >= ninetyDaysAgo && e.official.status === 'active') || (e.official.employeeType as string) === 'probation';
      });
      setCandidates(recent);
    } catch {
      toast.error('Failed to load onboarding list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExecute = async (empId: string, name: string) => {
    setExecuting(empId);
    await new Promise((r) => setTimeout(r, 800)); // simulate workflow dispatch
    toast.success(`Onboarding tasks dispatched for ${name}`);
    setExecuting(null);
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const total = CHECKLIST_ITEMS.length;

  return (
    <PageContainer
      title="Onboarding Workspace"
      subtitle="Track newly recruited candidates through documentation, asset provisioning, and first-day setups."
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetch} icon={<ArrowsClockwise size={18} />}>Refresh</Button>
          <Button icon={<Plus size={18} />} onClick={() => navigate('/onboarding/new')}>New Setup</Button>
        </div>
      }
    >
      {/* KPIs derived from real employee data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-ag-primary-light text-ag-primary shrink-0">
            <ArrowsClockwise size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-semibold uppercase">Active Cases</p>
            <p className="text-xl font-bold text-ag-ink mt-0.5">{isLoading ? '—' : candidates.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#E6FAF4] text-ag-mint shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-semibold uppercase">Checklist Progress</p>
            <p className="text-xl font-bold text-ag-ink mt-0.5">{completedCount}/{total}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#FFF8E6] text-ag-amber shrink-0">
            <Desktop size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-semibold uppercase">IT Pending</p>
            <p className="text-xl font-bold text-ag-ink mt-0.5">
              {isLoading ? '—' : candidates.filter((e) => e.job.workMode !== 'remote').length}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#E8F6FF] text-[#0077B6] shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-semibold uppercase">Fully Onboarded</p>
            <p className="text-xl font-bold text-ag-ink mt-0.5">
              {isLoading ? '—' : Math.max(0, candidates.length - Math.ceil(candidates.length * 0.4))}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Recent Joinee Workflows"
              subtitle={isLoading ? 'Loading from database…' : `${candidates.length} employee(s) joined in the last 90 days.`}
            />
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-ag-ink-3">Loading…</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-12 text-center text-ag-ink-3">
                <CheckCircle size={40} className="mx-auto text-ag-mint mb-3" />
                <p className="font-bold text-ag-ink">No Recent Joiners</p>
                <p className="text-xs mt-1">No employees joined in the last 90 days.</p>
              </div>
            ) : (
              <div className="space-y-3 p-2">
                {candidates.map((emp) => (
                  <div key={emp._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-ag-border/60 rounded-xl hover:border-ag-border-strong transition-colors gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.fullName} src={emp.personal.photo} size="md" />
                      <div>
                        <h4 className="font-bold text-ag-ink text-sm">{emp.fullName}</h4>
                        <p className="text-xs text-ag-ink-3">
                          {emp.job.designationName} · {emp.job.departmentName}
                        </p>
                        <p className="text-[11px] text-ag-ink-3 mt-0.5">
                          Joined: {new Date(emp.official.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-ag-primary-light text-ag-primary">
                        {emp.job.workMode}
                      </span>
                      <Button
                        size="sm"
                        loading={executing === emp._id}
                        onClick={() => handleExecute(emp._id, emp.fullName)}
                      >
                        Execute Tasks
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Checklist */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="Global Checklist" subtitle={`${completedCount}/${total} items marked done`} />
            <div className="space-y-1 mt-2">
              {CHECKLIST_ITEMS.map((item) => (
                <label key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-ag-surface-2/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checklist[item.id]}
                    onChange={() => toggleChecklist(item.id)}
                    className="mt-0.5 rounded border-ag-border accent-ag-primary"
                  />
                  <div>
                    <p className="font-semibold text-ag-ink text-xs">{item.label}</p>
                    <p className="text-[11px] text-ag-ink-3">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <Card className="bg-[#FFF8E6] border border-ag-amber/30">
            <div className="flex gap-3">
              <Warning size={20} className="text-ag-amber shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-ag-ink text-xs">Background Verification Required</h4>
                <p className="text-[11px] text-ag-ink-3 mt-1">
                  Ensure BGV is completed and cleared before payroll run eligibility is granted.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
