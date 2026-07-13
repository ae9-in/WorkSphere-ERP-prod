import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { auditService } from '@/services/api.service';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowsClockwise, ShieldCheck } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function AuditPage() {
  const [logs, setLogs]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [emailFilter, setEmailFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getLogs({
        page,
        limit: 25,
        email:  emailFilter || undefined,
        action: actionFilter || undefined,
      });
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  }, [page, emailFilter, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

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
        <Button variant="secondary" onClick={fetchLogs} icon={<ArrowsClockwise size={18} />}>
          Refresh
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Filter by actor email..."
          value={emailFilter}
          onChange={(e) => { setEmailFilter(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by event code (e.g. LEAVE_APPROVED)..."
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Button onClick={fetchLogs} icon={<ShieldCheck size={18} />}>
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
