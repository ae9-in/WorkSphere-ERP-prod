import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { payrollService } from '@/services/api.service';
import { PayrollRun } from '@/types/payroll.types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, ArrowsClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function PayrollPage() {
  const [runs, setRuns]           = useState<PayrollRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // KPIs derived entirely from DB payroll runs
  const ytdNetPay     = runs.filter(r => ['paid','approved'].includes(r.status)).reduce((s, r) => s + (r.totalNetPay ?? 0), 0);
  const ytdGross      = runs.filter(r => ['paid','approved'].includes(r.status)).reduce((s, r) => s + (r.totalGross ?? 0), 0);
  const ytdDeductions = runs.filter(r => ['paid','approved'].includes(r.status)).reduce((s, r) => s + (r.totalDeductions ?? 0), 0);
  const lastRun       = runs[0];

  const fetchPayroll = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await payrollService.getRuns();
      setRuns(data);
    } catch {
      toast.error('Failed to load payroll runs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  const handleRunPayroll = () => {
    toast.info('Payroll run creation is a privileged action — please contact your Payroll Admin.');
  };

  const columns: ColumnDef<PayrollRun>[] = [
    {
      accessorKey: 'period',
      header: 'Pay Period',
      cell: ({ row }) => <span className="font-bold text-ag-ink text-sm">{row.original.period}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'totalEmployees',
      header: 'Employees',
      cell: ({ row }) => <span className="font-medium text-ag-ink-2">{row.original.totalEmployees}</span>,
    },
    {
      accessorKey: 'totalGross',
      header: 'Gross Pay',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ag-ink-2">{formatCurrency(row.original.totalGross)}</span>
      ),
    },
    {
      accessorKey: 'totalDeductions',
      header: 'Deductions',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ag-accent-pink">-{formatCurrency(row.original.totalDeductions)}</span>
      ),
    },
    {
      accessorKey: 'totalNetPay',
      header: 'Net Disbursed',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-ag-primary">{formatCurrency(row.original.totalNetPay)}</span>
      ),
    },
    {
      accessorKey: 'processedAt',
      header: 'Processed On',
      cell: ({ row }) => (
        <span className="text-xs text-ag-ink-3">
          {row.original.processedAt ? formatDate(row.original.processedAt) : '—'}
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      title="Payroll Hub"
      subtitle="Real-time payroll financials from MongoDB — run history, compliance obligations and disbursement ledger."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchPayroll} icon={<ArrowsClockwise size={18} />}>
            Refresh
          </Button>
          <Button onClick={handleRunPayroll} icon={<Plus size={18} />}>
            Run Payroll
          </Button>
        </div>
      }
    >
      {/* KPI cards — 100% from DB */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">FY YTD Net Disbursed</p>
            <h3 className="text-2xl font-bold font-display text-ag-ink mt-2">
              {isLoading ? '—' : formatCurrency(ytdNetPay)}
            </h3>
          </div>
          <p className="text-xs text-[#00875A] font-semibold mt-4">
            {isLoading ? '' : `Across ${runs.filter(r => ['paid','approved'].includes(r.status)).length} run(s)`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">YTD Gross Pay</p>
            <h3 className="text-2xl font-bold font-display text-ag-ink mt-2">
              {isLoading ? '—' : formatCurrency(ytdGross)}
            </h3>
          </div>
          <p className="text-xs text-ag-ink-3 mt-4">Before statutory deductions</p>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">YTD Total Deductions</p>
            <h3 className="text-2xl font-bold font-display text-ag-ink mt-2">
              {isLoading ? '—' : formatCurrency(ytdDeductions)}
            </h3>
          </div>
          <p className="text-xs text-ag-ink-3 mt-4">
            {isLoading || !lastRun ? '' : `Last run: ${lastRun.period}`}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Payroll Run History"
          subtitle="Audit trail of all processed and disbursed payroll periods from the database."
        />
        <DataTable
          columns={columns}
          data={runs}
          isLoading={isLoading}
          emptyTitle="No payroll runs found"
          emptySubtitle="Run the seed script or create a new payroll run to get started."
        />
      </Card>
    </PageContainer>
  );
}
