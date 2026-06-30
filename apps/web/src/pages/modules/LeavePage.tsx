import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { leaveService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Calendar, ArrowsClockwise, FileText } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function LeavePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'balance' | 'apply' | 'history'>('balance');
  const [balances, setBalances] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Apply leave form state
  const [form, setForm] = useState({
    leaveTypeId: '',
    from: '',
    to: '',
    reason: '',
    halfDay: false,
    halfDayType: 'first_half'
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [balData, appData, typeData] = await Promise.all([
        leaveService.getBalance(),
        leaveService.getApplications(),
        leaveService.getTypes()
      ]);
      setBalances(balData);
      setApplications(appData);
      setLeaveTypes(typeData);
    } catch {
      toast.error('Failed to load leave records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveTypeId || !form.from || !form.to || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await leaveService.apply(form);
      toast.success('Leave application submitted successfully!');
      setForm({
        leaveTypeId: '',
        from: '',
        to: '',
        reason: '',
        halfDay: false,
        halfDayType: 'first_half'
      });
      setActiveTab('history');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'leaveTypeId.name',
      header: 'Leave Type',
      cell: ({ row }) => <span className="font-bold text-ag-ink text-sm">{row.original.leaveTypeId?.name || 'Leave'}</span>,
    },
    {
      accessorKey: 'from',
      header: 'From Date',
      cell: ({ row }) => <span className="text-ag-ink-2">{formatDate(row.original.from)}</span>,
    },
    {
      accessorKey: 'to',
      header: 'To Date',
      cell: ({ row }) => <span className="text-ag-ink-2">{formatDate(row.original.to)}</span>,
    },
    {
      accessorKey: 'days',
      header: 'Days',
      cell: ({ row }) => <span className="font-mono text-sm font-semibold text-ag-primary">{row.original.days} day(s)</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => <span className="text-xs text-ag-ink-3 truncate max-w-[200px] block">{row.original.reason}</span>,
    }
  ];

  return (
    <PageContainer
      title="Leave Management"
      subtitle="Manage your leave allocations, apply for time off and check application histories."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
            Refresh
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setActiveTab('apply')}>
            Apply Leave
          </Button>
        </div>
      }
    >
      {/* Tabs Menu */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8">
        <button
          onClick={() => setActiveTab('balance')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'balance' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Calendar size={18} />
          Leave Balances
        </button>
        <button
          onClick={() => setActiveTab('apply')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'apply' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Plus size={18} />
          Apply Leave
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'history' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <FileText size={18} />
          Leave History
        </button>
      </div>

      {activeTab === 'balance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {isLoading ? (
              <p className="text-ag-ink-3">Loading balances...</p>
            ) : balances.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-ag-ink-3">No leave balances allocated yet. Initialize company settings in Settings tab.</p>
              </Card>
            ) : (
              balances.map((bal) => (
                <Card key={bal._id} className="p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-ag-ink uppercase tracking-wider">{bal.leaveTypeId?.name}</h4>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-3xl font-extrabold text-ag-primary font-display">{bal.available}</span>
                      <span className="text-xs text-ag-ink-3">available / {bal.allocated} allocated</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-ag-border text-[11px] text-ag-ink-3">
                    <span>Used: {bal.used} days</span>
                    <span>Pending: {bal.pending} days</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'apply' && (
        <Card className="max-w-xl">
          <CardHeader title="Apply Leave" subtitle="Select leave type, pick dates and submit request for approvals." />
          <form className="p-5 space-y-4" onSubmit={handleApply}>
            <div>
              <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Leave Category</label>
              <select
                className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:border-ag-primary focus:ring-1 focus:ring-ag-primary"
                value={form.leaveTypeId}
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
              >
                <option value="">Choose leave type</option>
                {leaveTypes.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="halfDay"
                checked={form.halfDay}
                onChange={(e) => setForm({ ...form, halfDay: e.target.checked })}
                className="rounded border-ag-border text-ag-primary focus:ring-ag-primary"
              />
              <label htmlFor="halfDay" className="text-sm font-semibold text-ag-ink">Apply as Half Day</label>
            </div>

            {form.halfDay && (
              <div>
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Half Day Slot</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:border-ag-primary"
                  value={form.halfDayType}
                  onChange={(e: any) => setForm({ ...form, halfDayType: e.target.value })}
                >
                  <option value="first_half">First Half (Morning)</option>
                  <option value="second_half">Second Half (Afternoon)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Reason for Leave</label>
              <textarea
                className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none focus:border-ag-primary"
                rows={4}
                placeholder="Brief description of the reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Submit Leave Request</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader title="All Applications" subtitle="Track approval progress and timeline of historical leave applications." />
          <DataTable
            columns={columns}
            data={applications}
            isLoading={isLoading}
            emptyTitle="No leaves filed yet"
            emptySubtitle="Apply for leaves from the Apply Leave tab."
          />
        </Card>
      )}
    </PageContainer>
  );
}
