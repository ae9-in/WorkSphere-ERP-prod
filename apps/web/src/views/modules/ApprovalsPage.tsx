import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { approvalsService } from '@/services/api.service';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Check, X, ShieldCheck, Plus, Clock } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatRelative } from '@/lib/formatters';

type ApprovalItem = {
  _id: string;
  employeeId: string;
  fullName: string;
  type: 'Leave Request' | 'Attendance Regularization' | 'Expense Claim';
  details: string;
  status: string;
  dateRange?: string;
  amount?: string;
  requestedAt: string;
};

type TabId = 'pending' | 'approved' | 'rejected';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await approvalsService.list(activeTab);
      setApprovals(data);
    } catch {
      toast.error('Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleApprove = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      await approvalsService.approve(id);
      toast.success(`✔ Approved request from ${name}`);
      fetchApprovals();
    } catch {
      toast.error('Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      await approvalsService.reject(id);
      toast.error(`Rejected request from ${name}`);
      fetchApprovals();
    } catch {
      toast.error('Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: 'pending',  label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const typeBadgeColor: Record<string, string> = {
    'Leave Request':              'bg-ag-primary-light text-ag-primary',
    'Attendance Regularization':  'bg-[#FFF8E6] text-ag-amber',
    'Expense Claim':              'bg-[#E6FAF4] text-ag-mint',
  };

  return (
    <PageContainer
      title="Approvals Center"
      subtitle="Review and resolve leave requests, attendance regularizations, and expense claims."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tab Switch */}
        <div className="flex gap-1 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-ag-primary text-white shadow'
                  : 'text-ag-ink-3 hover:text-ag-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader
            title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Requests`}
            subtitle={isLoading ? 'Fetching from database…' : `${approvals.length} record(s) found`}
          />

          {isLoading ? (
            <div className="p-12 text-center text-ag-ink-3">
              <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading requests…</p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-16 text-ag-ink-3">
              <ShieldCheck size={48} className="mx-auto text-ag-mint mb-3" />
              <p className="font-bold text-ag-ink">Queue Empty</p>
              <p className="text-xs mt-1">No {activeTab} requests in this queue.</p>
            </div>
          ) : (
            <div className="divide-y divide-ag-border/50">
              {approvals.map((app) => (
                <div key={app._id} className="py-5 first:pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <Avatar name={app.fullName} size="md" />
                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="font-bold text-ag-ink text-sm">{app.fullName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadgeColor[app.type] ?? 'bg-ag-surface text-ag-ink-3'}`}>
                          {app.type}
                        </span>
                      </div>
                      <p className="text-xs text-ag-ink-2">{app.details}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {app.dateRange && (
                          <p className="text-[11px] text-ag-ink-3 font-semibold flex items-center gap-1">
                            <Clock size={11} /> {app.dateRange}
                          </p>
                        )}
                        {app.amount && (
                          <p className="text-[11px] text-[#00875A] font-semibold">₹ {app.amount}</p>
                        )}
                        <p className="text-[10px] text-ag-ink-3">
                          Submitted {formatRelative(app.requestedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'pending' && (
                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={processingId === app._id}
                        onClick={() => handleReject(app._id, app.fullName)}
                        icon={<X size={16} />}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        loading={processingId === app._id}
                        onClick={() => handleApprove(app._id, app.fullName)}
                        icon={<Check size={16} />}
                      >
                        Approve
                      </Button>
                    </div>
                  )}

                  {activeTab !== 'pending' && (
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 ${
                      activeTab === 'approved'
                        ? 'bg-[#E6FAF4] text-ag-mint'
                        : 'bg-ag-accent-pink/15 text-ag-accent-pink'
                    }`}>
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}

