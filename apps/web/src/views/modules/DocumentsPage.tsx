import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { documentService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/formatters';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Download, Trash, ShieldCheck, ArrowsClockwise, FolderOpen } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'upload' | 'expiring'>('all');
  const [documents, setDocuments] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload Form state
  const [form, setForm] = useState({
    name: '',
    category: 'policy',
    employeeId: '',
    size: 204800, // 200KB default mock size
    mimeType: 'application/pdf',
    expiryDate: '',
    url: ''
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allDocs, expDocs] = await Promise.all([
        documentService.getAll(),
        documentService.getExpiring(30)
      ]);
      setDocuments(allDocs);
      setExpiring(expDocs);
    } catch {
      toast.error('Failed to load documents registry');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.url) {
      toast.error('Please enter document name and simulated URL');
      return;
    }
    try {
      await documentService.upload(form);
      toast.success('Document uploaded successfully!');
      setForm({
        name: '',
        category: 'policy',
        employeeId: '',
        size: 204800,
        mimeType: 'application/pdf',
        expiryDate: '',
        url: ''
      });
      setActiveTab('all');
      fetchData();
    } catch {
      toast.error('Failed to upload document record');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const url = await documentService.download(id);
      window.open(url, '_blank');
      toast.success('Download link opened');
    } catch {
      toast.error('Failed to resolve document URL');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await documentService.verify(id);
      toast.success('Document verified successfully');
      fetchData();
    } catch {
      toast.error('Verification failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentService.delete(id);
      toast.success('Document deleted successfully');
      fetchData();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const isHr = user && ['hr_head', 'company_admin', 'super_admin'].includes(user.role);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Document Name',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-ag-ink text-sm block">{row.original.name}</span>
          <span className="text-[10px] text-ag-ink-3 uppercase tracking-wider">{row.original.category}</span>
        </div>
      ),
    },
    {
      accessorKey: 'mimeType',
      header: 'Format',
      cell: ({ row }) => <span className="font-mono text-xs text-ag-ink-2">{row.original.mimeType}</span>,
    },
    {
      accessorKey: 'uploadedAt',
      header: 'Uploaded On',
      cell: ({ row }) => <span className="text-xs text-ag-ink-2">{formatDate(row.original.uploadedAt)}</span>,
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }) => (
        <span className={`text-xs ${row.original.isExpired ? 'text-ag-accent-pink font-bold' : 'text-ag-ink-3'}`}>
          {row.original.expiryDate ? formatDate(row.original.expiryDate) : 'No Expiry'}
        </span>
      ),
    },
    {
      accessorKey: 'verifiedAt',
      header: 'Verification',
      cell: ({ row }) => (
        <span className={`text-xs font-semibold ${row.original.verifiedAt ? 'text-[#00875A]' : 'text-ag-amber'}`}>
          {row.original.verifiedAt ? '✓ Verified' : 'Pending Verification'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleDownload(row.original._id)} icon={<Download size={14} />} />
          {isHr && !row.original.verifiedAt && (
            <Button size="sm" variant="secondary" onClick={() => handleVerify(row.original._id)} icon={<ShieldCheck size={14} />} />
          )}
          {isHr && (
            <Button size="sm" variant="secondary" className="hover:bg-ag-accent-pink/15 hover:text-ag-accent-pink border-transparent" onClick={() => handleDelete(row.original._id)} icon={<Trash size={14} />} />
          )}
        </div>
      )
    }
  ];

  return (
    <PageContainer
      title="Document Management"
      subtitle="Secure repository of company policies, employee credentials, and verification rosters."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
            Refresh
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setActiveTab('upload')}>
            Upload Document
          </Button>
        </div>
      }
    >
      {/* Tabs Menu */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'all' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <FolderOpen size={18} />
          Active Directory
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'upload' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Plus size={18} />
          Upload Record
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'expiring' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Trash size={18} />
          Compliance Alerts
        </button>
      </div>

      {activeTab === 'all' && (
        <Card>
          <CardHeader title="System File Ledger" subtitle="Search and execute actions on organization or employee documents." />
          <DataTable
            columns={columns}
            data={documents}
            isLoading={isLoading}
            emptyTitle="No documents found"
            emptySubtitle="Upload a new document record to get started."
          />
        </Card>
      )}

      {activeTab === 'upload' && (
        <Card className="max-w-xl">
          <CardHeader title="Simulate Document Record" subtitle="Define metadata and file locator parameters to write to database." />
          <form className="p-5 space-y-4" onSubmit={handleUpload}>
            <Input
              label="Document Name"
              placeholder="e.g. Employee Handbook 2026"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Category</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="policy">Policy / Guidelines</option>
                  <option value="employee">Employee Credentials</option>
                  <option value="company">Corporate Registration</option>
                  <option value="payslip">Statutory Ledger</option>
                  <option value="other">Miscellaneous</option>
                </select>
              </div>
              <Input
                label="Associated Employee ID (Optional)"
                placeholder="EMP001"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Simulated File Size (Bytes)"
                type="number"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: Number(e.target.value) })}
              />
              <Input
                label="Expiry Date (Optional)"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>

            <Input
              label="Locator URL"
              placeholder="https://cloudinary.com/worksphere/example-file.pdf"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />

            <div className="pt-4 flex justify-end">
              <Button type="submit">Upload Record</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'expiring' && (
        <Card>
          <CardHeader title="Critical Documents (Expiring in 30 Days)" subtitle="Roster showing compliance alerts to prevent expired policies or credentials." />
          <DataTable
            columns={columns}
            data={expiring}
            isLoading={isLoading}
            emptyTitle="No expiring documents"
            emptySubtitle="All credentials and handbook updates are fully compliant."
          />
        </Card>
      )}
    </PageContainer>
  );
}
