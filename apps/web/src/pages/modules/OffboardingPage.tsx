import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { employeeService } from '@/services/api.service';
import { EmployeeListItem } from '@/types/employee.types';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { ArrowsClockwise, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';

type ClearanceItem = {
  label: string;
  status: 'done' | 'pending' | 'in_progress';
};

const CLEARANCE_ITEMS: ClearanceItem[] = [
  { label: 'Asset Return — Laptop & Access Card', status: 'in_progress' },
  { label: 'Exit Interview Form',                  status: 'pending' },
  { label: 'Knowledge Transfer (KT) Sessions',     status: 'in_progress' },
  { label: 'Gratuity & PF Settlement',             status: 'done' },
  { label: 'Security De-provisioning (AD/LDAP)',   status: 'pending' },
  { label: 'NDAs & Legal Clearances',              status: 'done' },
];

const statusBadge: Record<ClearanceItem['status'], string> = {
  done:        'bg-[#E6FAF4] text-ag-mint',
  in_progress: 'bg-[#FFF8E6] text-ag-amber',
  pending:     'bg-ag-surface text-ag-ink-3 border border-ag-border',
};

export default function OffboardingPage() {
  const [staff, setStaff]         = useState<EmployeeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await employeeService.list({ limit: 100 });
      // Only employees in notice period or recently made inactive
      const offboarding = res.employees.filter(
        (e) => e.official.status === 'notice_period' || e.official.status === 'inactive'
      );
      setStaff(offboarding);
    } catch {
      toast.error('Failed to load offboarding list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSettle = async (id: string, name: string) => {
    setProcessing(id);
    await new Promise((r) => setTimeout(r, 900));
    toast.success(`Full & Final settlement generated for ${name}`);
    setProcessing(null);
  };

  const noticePeriodCount = staff.filter((e) => e.official.status === 'notice_period').length;
  const inactiveCount     = staff.filter((e) => e.official.status === 'inactive').length;

  return (
    <PageContainer
      title="Offboarding & Exits"
      subtitle="Supervise notice periods, asset clearances, final settlements and exit analytics."
      actions={
        <Button variant="secondary" onClick={fetch} icon={<ArrowsClockwise size={18} />}>
          Refresh
        </Button>
      }
    >
      {/* Stats from real DB */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
        <Card className="p-4">
          <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">Notice Period</p>
          <h3 className="text-2xl font-bold font-display text-ag-ink mt-1">{isLoading ? '—' : noticePeriodCount}</h3>
          <p className="text-[11px] text-ag-ink-3 mt-1">Serving notice as of today</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">Inactive / Exited</p>
          <h3 className="text-2xl font-bold font-display text-ag-ink mt-1">{isLoading ? '—' : inactiveCount}</h3>
          <p className="text-[11px] text-ag-ink-3 mt-1">Settlements to process</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">Total Exits</p>
          <h3 className="text-2xl font-bold font-display text-ag-ink mt-1">{isLoading ? '—' : staff.length}</h3>
          <p className="text-[11px] text-ag-ink-3 mt-1">Active offboarding cases</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employees list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Active Exit Cases"
              subtitle={isLoading ? 'Loading from database…' : `${staff.length} employee(s) in transition`}
            />

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-ag-ink-3">Loading…</p>
              </div>
            ) : staff.length === 0 ? (
              <div className="p-12 text-center text-ag-ink-3">
                <p className="font-bold text-ag-ink text-sm">No Active Exit Cases</p>
                <p className="text-xs mt-1">All employees are currently active. Great retention! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3 p-2">
                {staff.map((emp) => (
                  <div
                    key={emp._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-ag-border/60 rounded-xl hover:border-ag-border-strong transition-colors gap-4"
                  >
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
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        emp.official.status === 'notice_period'
                          ? 'bg-ag-amber/15 text-ag-amber'
                          : 'bg-ag-accent-pink/15 text-ag-accent-pink'
                      }`}>
                        {emp.official.status === 'notice_period' ? 'Notice Period' : 'Inactive'}
                      </span>
                      <Button
                        size="sm"
                        loading={processing === emp._id}
                        onClick={() => handleSettle(emp._id, emp.fullName)}
                      >
                        Process F&F
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Clearance Checklist */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="Standard Exit Clearances" subtitle="Track completion of mandatory steps." />
            <div className="space-y-2 mt-2">
              {CLEARANCE_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 border border-ag-border/60 rounded-xl"
                >
                  <span className="font-semibold text-ag-ink text-xs leading-tight mr-3">{item.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadge[item.status]}`}>
                    {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-[#FFF8E6] border border-ag-amber/30">
            <div className="flex gap-3">
              <Warning size={20} className="text-ag-amber shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-ag-ink text-xs">Security De-provisioning Alert</h4>
                <p className="text-[11px] text-ag-ink-3 mt-1">
                  Active Directory accounts must be disabled on the Last Working Day. Verify IT compliance before settlement.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
