import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { assetService, employeeService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, ArrowsClockwise, CheckSquare, Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function AssetPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'register' | 'assign'>('all');
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [registerForm, setRegisterForm] = useState({
    category: 'laptop',
    name: '',
    assetTag: '',
    serialNumber: '',
    brand: '',
    modelName: '',
    purchasePrice: 65000,
    condition: 'new'
  });

  const [assignForm, setAssignForm] = useState({
    assetId: '',
    employeeId: '',
    condition: 'good',
    remarks: ''
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assetList, empList] = await Promise.all([
        assetService.getAll(),
        employeeService.list({ limit: 100 })
      ]);
      setAssets(assetList);
      setEmployees(empList.employees || []);
    } catch {
      toast.error('Failed to load asset configurations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.assetTag || !registerForm.serialNumber) {
      toast.error('Please enter name, tag, and serial number');
      return;
    }
    try {
      await assetService.create(registerForm);
      toast.success('Asset registered successfully!');
      setRegisterForm({
        category: 'laptop',
        name: '',
        assetTag: '',
        serialNumber: '',
        brand: '',
        modelName: '',
        purchasePrice: 65000,
        condition: 'new'
      });
      setActiveTab('all');
      fetchData();
    } catch {
      toast.error('Asset tag or serial already exists');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.assetId || !assignForm.employeeId) {
      toast.error('Please choose asset and assignee');
      return;
    }
    try {
      await assetService.assign(assignForm.assetId, {
        employeeId: assignForm.employeeId,
        condition: assignForm.condition,
        remarks: assignForm.remarks
      });
      toast.success('Asset assigned successfully!');
      setAssignForm({
        assetId: '',
        employeeId: '',
        condition: 'good',
        remarks: ''
      });
      setActiveTab('all');
      fetchData();
    } catch {
      toast.error('Assignment request failed');
    }
  };

  const handleReturn = async (id: string) => {
    const condition = prompt('Enter return condition (new / good / fair / damaged):', 'good');
    if (!condition) return;
    const remarks = prompt('Enter return comments:') || '';
    try {
      await assetService.return(id, { condition, remarks });
      toast.success('Asset returned and restored to registry');
      fetchData();
    } catch {
      toast.error('Failed to return asset');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'assetTag',
      header: 'Asset Tag',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-ag-ink text-sm block">{row.original.assetTag}</span>
          <span className="text-[10px] text-ag-ink-3 uppercase tracking-wider">{row.original.category}</span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Model Details',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-ag-ink-2 block text-sm">{row.original.brand} — {row.original.modelName}</span>
          <span className="text-[10px] text-ag-ink-3">S/N: {row.original.serialNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: 'condition',
      header: 'Condition',
      cell: ({ row }) => <span className="text-xs text-ag-ink-2 capitalize">{row.original.condition}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'currentEmployeeId',
      header: 'Assignee',
      cell: ({ row }) => (
        <span className="text-xs text-ag-primary font-semibold">
          {row.original.currentEmployeeId ? `Assigned (${row.original.currentEmployeeId})` : 'Unassigned'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status === 'available' ? (
            <Button
              size="sm"
              onClick={() => {
                setAssignForm((prev) => ({ ...prev, assetId: row.original._id }));
                setActiveTab('assign');
              }}
              icon={<CheckSquare size={14} />}
            >
              Assign
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleReturn(row.original._id)}
              icon={<Sparkle size={14} />}
            >
              Return
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <PageContainer
      title="Asset & Inventory Registry"
      subtitle="Track corporate property allocations, serial registers, and checkout statuses."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
            Refresh
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setActiveTab('register')}>
            Register Asset
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
          Active Assets
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'register' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          Register Asset
        </button>
        <button
          onClick={() => setActiveTab('assign')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'assign' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          Checkout Panel
        </button>
      </div>

      {activeTab === 'all' && (
        <Card>
          <CardHeader title="Organization Asset Ledger" subtitle="Roster containing laptops, phones, licenses and card keys." />
          <DataTable
            columns={columns}
            data={assets}
            isLoading={isLoading}
            emptyTitle="No assets registered yet"
            emptySubtitle="Add your organization's physical or digital assets from the Register Asset tab."
          />
        </Card>
      )}

      {activeTab === 'register' && (
        <Card className="max-w-xl">
          <CardHeader title="Register Corporate Property" subtitle="Define manufacturer specs, asset identifiers and procurement data." />
          <form className="p-5 space-y-4" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Category</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                  value={registerForm.category}
                  onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                >
                  <option value="laptop">Laptop / Notebook</option>
                  <option value="desktop">Desktop PC</option>
                  <option value="phone">Mobile Device</option>
                  <option value="sim">SIM Card</option>
                  <option value="access_card">Security Entry Key</option>
                  <option value="software">Software License</option>
                  <option value="other">Other Asset</option>
                </select>
              </div>
              <Input
                label="Asset Name / Description"
                placeholder="e.g. MacBook Pro 16"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Asset Tag ID"
                placeholder="TAG-2026-001"
                value={registerForm.assetTag}
                onChange={(e) => setRegisterForm({ ...registerForm, assetTag: e.target.value })}
              />
              <Input
                label="Manufacturer Serial Number"
                placeholder="S/N: C02F812XMD6M"
                value={registerForm.serialNumber}
                onChange={(e) => setRegisterForm({ ...registerForm, serialNumber: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Brand"
                placeholder="Apple"
                value={registerForm.brand}
                onChange={(e) => setRegisterForm({ ...registerForm, brand: e.target.value })}
              />
              <Input
                label="Model Name"
                placeholder="A2485"
                value={registerForm.modelName}
                onChange={(e) => setRegisterForm({ ...registerForm, modelName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Procurement Value (INR)"
                type="number"
                value={registerForm.purchasePrice}
                onChange={(e) => setRegisterForm({ ...registerForm, purchasePrice: Number(e.target.value) })}
              />
              <div>
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Initial Condition</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                  value={registerForm.condition}
                  onChange={(e) => setRegisterForm({ ...registerForm, condition: e.target.value })}
                >
                  <option value="new">Brand New</option>
                  <option value="good">Good Condition</option>
                  <option value="fair">Fair / Used</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Register Asset</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'assign' && (
        <Card className="max-w-xl">
          <CardHeader title="Asset Checkout Panel" subtitle="Delegate physical inventory or software licenses directly to employee profiles." />
          <form className="p-5 space-y-4" onSubmit={handleAssign}>
            <div>
              <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Choose Asset</label>
              <select
                className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                value={assignForm.assetId}
                onChange={(e) => setAssignForm({ ...assignForm, assetId: e.target.value })}
              >
                <option value="">Select available asset</option>
                {assets.filter(a => a.status === 'available').map((a) => (
                  <option key={a._id} value={a._id}>{a.assetTag} — {a.name} ({a.brand})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Assignee Employee</label>
              <select
                className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                value={assignForm.employeeId}
                onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
              >
                <option value="">Select active employee</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>{emp.fullName} ({emp.employeeId})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Checkout Condition</label>
              <select
                className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                value={assignForm.condition}
                onChange={(e) => setAssignForm({ ...assignForm, condition: e.target.value })}
              >
                <option value="new">Brand New</option>
                <option value="good">Good Condition</option>
                <option value="fair">Fair / Used</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Handover Notes</label>
              <textarea
                className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                rows={3}
                placeholder="Include charger status, accessories, serial number overrides..."
                value={assignForm.remarks}
                onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Assign Property</Button>
            </div>
          </form>
        </Card>
      )}
    </PageContainer>
  );
}
