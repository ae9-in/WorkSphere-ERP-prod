import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { auditService } from '@/services/api.service';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowsClockwise, ShieldCheck } from '@phosphor-icons/react';
import { toast } from 'sonner';

const eventOptions = [
  { value: '', label: 'All Event Codes' },
  { value: 'SETTINGS_UPDATE', label: 'Settings Updated' },
  { value: 'COMPANY_INITIALIZE', label: 'Company Seeded' },
  { value: 'EMPLOYEE_ONBOARDED', label: 'Employee Onboarded' },
  { value: 'EMPLOYEE_DELETE', label: 'Employee Deleted' },
  { value: 'LEAVE_APPLICATION_APPLIED', label: 'Leave Applied' },
  { value: 'LEAVE_APPROVED', label: 'Leave Approved' },
  { value: 'LEAVE_REJECTED', label: 'Leave Rejected' },
  { value: 'PAYROLL_RUN_CREATED', label: 'Payroll Run Created' },
  { value: 'PAYROLL_RUN_APPROVED', label: 'Payroll Run Approved' },
  { value: 'PAYROLL_RUN_LOCKED', label: 'Payroll Run Locked' },
  { value: 'PAYROLL_RUN_REOPENED', label: 'Payroll Run Reopened' },
  { value: 'ASSET_CREATED', label: 'Asset Created' },
  { value: 'ASSET_ASSIGNED', label: 'Asset Assigned' },
  { value: 'ASSET_RETURNED', label: 'Asset Returned' },
  { value: 'DOCUMENT_UPLOADED', label: 'Document Uploaded' },
  { value: 'DOCUMENT_DELETED', label: 'Document Deleted' },
  { value: 'WORKFLOW_APPROVED', label: 'Workflow Approved' },
  { value: 'WORKFLOW_REJECTED', label: 'Workflow Rejected' },
  { value: 'WORKFLOW_DELEGATED', label: 'Workflow Delegated' },
  { value: 'ITEM_CREATED', label: 'Inventory Item Created' },
  { value: 'PRODUCTION_ORDER_RELEASED', label: 'Manufacturing Order Released' },
  { value: 'WORK_ORDER_COMPLETED', label: 'Manufacturing Work Order Completed' },
  { value: 'MAINTENANCE_WORK_ORDER_COMPLETED', label: 'Maintenance Completed' },
  { value: 'SHIPMENT_DISPATCHED', label: 'Shipment Dispatched' },
  { value: 'SHIPMENT_POD_COMPLETED', label: 'Shipment Delivered (POD)' }
];

export default function AuditPage() {
  const [logs, setLogs]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [emailFilter, setEmailFilter]   = useState('');
  const [actionFilter, setActionFilter]   = useState('');
  const [emailInput, setEmailInput]     = useState('');
  const [actionInput, setActionInput]     = useState('');

  const lastFetchedRef = useRef({ page: 0, email: '', action: '' });

  const fetchLogs = useCallback(async (p: number, email: string, action: string, force = false) => {
    if (!force && lastFetchedRef.current.page === p && lastFetchedRef.current.email === email && lastFetchedRef.current.action === action) {
      return;
    }
    setIsLoading(true);
    try {
      const data = await auditService.getLogs({
        page: p,
        limit: 25,
        email: email || undefined,
        action: action || undefined,
      });
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      lastFetchedRef.current = { page: p, email, action };
    } catch {
      toast.error('Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page, emailFilter, actionFilter);
  }, [page, emailFilter, actionFilter, fetchLogs]);

  const handleApplyFilters = useCallback(() => {
    setEmailFilter(emailInput);
    setActionFilter(actionInput);
    setPage(1);
    fetchLogs(1, emailInput, actionInput);
  }, [emailInput, actionInput, fetchLogs]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  }, [handleApplyFilters]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'action',
      header: 'Event',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-ag-primary bg-ag-primary-light px-2 py-1 rounded">
          {row.original.action}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Actor',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-ag-ink text-sm block">{row.original.email}</span>
          <span className="text-[10px] text-ag-ink-3">ID: {row.original.userId}</span>
        </div>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => (
        <span className="text-xs text-ag-ink-2 line-clamp-2">{row.original.details}</span>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'Source IP',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ag-ink-3">{row.original.ipAddress || '—'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => (
        <span className="text-xs text-ag-ink-3">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      title="Audit Trail"
      subtitle="Immutable log of all privileged actions, data mutations, and administrative operations performed across the platform."
      actions={
        <Button variant="secondary" onClick={() => fetchLogs(page, emailFilter, actionFilter, true)} icon={<ArrowsClockwise size={18} />}>
          Refresh
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Filter by actor email..."
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-xs"
        />
        <Select
          options={eventOptions}
          value={actionInput}
          onChange={(e) => setActionInput(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleApplyFilters} icon={<ShieldCheck size={18} />}>
          Apply Filters
        </Button>
      </div>

      <Card>
        <CardHeader
          title="System Event Log"
          subtitle={`${total} total events recorded. Showing page ${page}.`}
        />
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          emptyTitle="No audit events recorded"
          emptySubtitle="Audit logs are created automatically for every privileged operation."
        />
        {/* Pagination */}
        {total > 25 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-ag-border">
            <span className="text-sm text-ag-ink-3">
              Page {page} of {Math.ceil(total / 25)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= Math.ceil(total / 25)}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

