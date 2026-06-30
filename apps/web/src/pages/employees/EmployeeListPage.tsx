import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { EmployeeListItem } from '@/types/employee.types';
import { employeeService } from '@/services/api.service';
import { StatusBadge, WorkModeBadge } from '@/components/ui/Badge/Badge';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import { Plus, MagnifyingGlass, DownloadSimple, Funnel } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/formatters';

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchEmployees() {
      setIsLoading(true);
      const res = await employeeService.list({ page, limit: 10, search, status });
      setEmployees(res.employees);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setIsLoading(false);
    }
    fetchEmployees();
  }, [page, search, status]);

  const columns: ColumnDef<EmployeeListItem>[] = [
    {
      accessorKey: 'fullName',
      header: 'Employee',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.original.fullName} src={row.original.personal.photo} size="md" />
          <div>
            <p className="font-bold text-ag-ink text-sm hover:text-ag-primary transition-colors">
              {row.original.fullName}
            </p>
            <p className="text-xs text-ag-ink-3">{row.original.official.workEmail}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'employeeId',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-ag-ink-2 bg-ag-surface-2 px-2 py-1 rounded-md">
          {row.original.employeeId}
        </span>
      ),
    },
    {
      accessorKey: 'job.departmentName',
      header: 'Department',
      cell: ({ row }) => (
        <span className="font-medium text-ag-ink-2">{row.original.job.departmentName || '—'}</span>
      ),
    },
    {
      accessorKey: 'job.designationName',
      header: 'Designation',
      cell: ({ row }) => (
        <span className="text-ag-ink">{row.original.job.designationName || '—'}</span>
      ),
    },
    {
      accessorKey: 'job.locationName',
      header: 'Location',
      cell: ({ row }) => (
        <span className="text-xs text-ag-ink-2">{row.original.job.locationName || '—'}</span>
      ),
    },
    {
      accessorKey: 'job.workMode',
      header: 'Mode',
      cell: ({ row }) => <WorkModeBadge mode={row.original.job.workMode} />,
    },
    {
      accessorKey: 'official.status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.official.status} />,
    },
  ];

  return (
    <PageContainer
      title="Employee Master Directory"
      subtitle="Manage, search, and audit all corporate staff records."
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => alert('Exporting employee records to Excel/CSV...')}
            icon={<DownloadSimple size={18} />}
          >
            Export CSV
          </Button>
          <Button
            onClick={() => navigate('/employees/new')}
            icon={<Plus size={18} />}
          >
            Add New Employee
          </Button>
        </div>
      }
    >
      {/* Filters Bar */}
      <div className="bg-ag-surface p-4 rounded-xl border border-ag-border shadow-card mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name, ID, email, or dept..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={<MagnifyingGlass size={18} />}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-48">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'on_leave', label: 'On Leave' },
                { value: 'notice_period', label: 'Notice Period' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Employee Data Table */}
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        onRowClick={(emp) => navigate(`/employees/${emp._id}`)}
        emptyTitle="No employees found"
        emptySubtitle="Try adjusting your search filters or add a new employee."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={10}
        onPageChange={setPage}
      />
    </PageContainer>
  );
}
