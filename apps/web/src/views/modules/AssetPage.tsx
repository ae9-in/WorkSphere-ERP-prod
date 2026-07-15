import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Modal } from '@/components/ui/Modal/Modal';
import { Badge, StatusBadge } from '@/components/ui/Badge/Badge';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { KPICard } from '@/components/ui/KPICard/KPICard';
import { assetService, employeeService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatCurrency } from '@/lib/formatters';
import {
  Plus, ArrowsClockwise, CheckSquare, Sparkle, User, Calendar,
  Wrench, ShieldCheck, ArrowsLeftRight, Trash, FileText, MagnifyingGlass,
  GridFour, ListBullets, Download, Upload, Info, Warning, ArrowRight,
  Database, ChartLineUp, ShieldWarning, Clock, QrCode, FilePdf, FileImage,
  Signature, CheckCircle, XCircle, FileXls, ArrowUpRight, ArrowDownLeft
} from '@phosphor-icons/react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, AreaChart, Area
} from 'recharts';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Asset = {
  _id: string;
  category: string;
  name: string;
  assetTag: string;
  serialNumber: string;
  brand: string;
  modelName: string;
  purchasePrice: number;
  condition: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired' | 'lost';
  currentEmployeeId?: string;
  assignedDate?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  location?: string;
  depreciationRate?: number;
  residualValue?: number;
  usefulLife?: number;
};

type ActiveTab =
  | 'dashboard'
  | 'directory'
  | 'employee_workspace'
  | 'assignment_center'
  | 'register'
  | 'maintenance'
  | 'warranty'
  | 'transfers'
  | 'depreciation'
  | 'audit';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Config
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'laptop',      label: 'Laptop / Notebook',  icon: <Database size={16} /> },
  { id: 'desktop',     label: 'Desktop PC',         icon: <Database size={16} /> },
  { id: 'phone',       label: 'Mobile Device',      icon: <User size={16} /> },
  { id: 'sim',         label: 'SIM Card',           icon: <User size={16} /> },
  { id: 'access_card', label: 'Security Key',       icon: <ShieldCheck size={16} /> },
  { id: 'software',    label: 'Software License',   icon: <FileText size={16} /> },
  { id: 'other',       label: 'Other Equipment',    icon: <GridFour size={16} /> },
];

const CONDITION_COLORS: Record<string, string> = {
  new: 'bg-[#E6FAF4] text-[#00875A]',
  good: 'bg-[#E8F6FF] text-[#0077B6]',
  fair: 'bg-[#FFF8E6] text-[#946000]',
  damaged: 'bg-[#FFF0EF] text-[#D93025]',
  retired: 'bg-ag-surface-2 text-ag-ink-3',
};

const STATS_PIE_COLORS = ['#5B3CF5', '#00C48C', '#FFB020', '#FF5F57', '#8E88A8'];

// Mock Maintenance Schedules
const MAINTENANCE_SCHEDULES = [
  { id: '1', asset: 'TAG-2026-001', vendor: 'AppleCare Prime', date: '2026-08-15', cost: 12000, type: 'Annual AMC service Checkup' },
  { id: '2', asset: 'TAG-2026-003', vendor: 'Dell Hardware Labs', date: '2026-09-02', cost: 8500, type: 'RAM & Battery Health Diagnostics' },
  { id: '3', asset: 'TAG-2026-004', vendor: 'SysInfo Corp', date: '2026-07-28', cost: 3500, type: 'General hardware cleanup' },
];

// Mock Warranty items
const WARRANTY_ALERTS = [
  { id: '1', name: 'MacBook Pro 16', tag: 'TAG-2026-001', daysLeft: 12, status: 'Expiring Soon' },
  { id: '2', name: 'Dell Latitude 5430', tag: 'TAG-2026-003', daysLeft: -5, status: 'Expired' },
  { id: '3', name: 'iPhone 15 Pro', tag: 'TAG-2026-005', daysLeft: 45, status: 'Active' },
];

// Mock Transfers
const TRANSFERS_LOG = [
  { id: '1', tag: 'TAG-2026-001', from: 'EMP002 (HR)', to: 'EMP005 (Finance)', date: '2026-07-10', approvedBy: 'Admin Team' },
  { id: '2', tag: 'TAG-2026-004', from: 'EMP009 (IT)', to: 'EMP001 (Sales)', date: '2026-07-02', approvedBy: 'IT Lead' },
];

// Mock repairs
const REPAIRS_LIST = [
  { id: '1', tag: 'TAG-2026-003', issue: 'Broken screen replacement', cost: 18000, status: 'In Progress', center: 'Dell Authorized Service' },
  { id: '2', tag: 'TAG-2026-006', issue: 'Battery bulging replacement', cost: 6500, status: 'Completed', center: 'Apple Repair Hub' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AssetPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Split view details
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Employee workspace state
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [empFilterDept, setEmpFilterDept] = useState('all');

  // Directory Search/Filters
  const [dirSearch, setDirSearch] = useState('');
  const [dirCat, setDirCat] = useState('all');
  const [dirStatus, setDirStatus] = useState('all');
  const [dirView, setDirView] = useState<'grid' | 'table'>('table');

  // Register Form
  const [registerForm, setRegisterForm] = useState({
    category: 'laptop',
    name: '',
    assetTag: '',
    serialNumber: '',
    brand: '',
    modelName: '',
    purchasePrice: 65000,
    condition: 'new',
    warrantyStart: '',
    warrantyEnd: '',
    location: 'Headquarters',
    depreciationRate: 15,
    residualValue: 5000,
    usefulLife: 5,
  });

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    assetId: '',
    employeeId: '',
    condition: 'good',
    remarks: '',
    expectedReturn: '',
  });

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnAssetId, setReturnAssetId] = useState('');
  const [returnForm, setReturnForm] = useState({
    condition: 'good',
    remarks: '',
    missingAccessories: false,
  });

  const isHr = !!(user && ['hr_head', 'company_admin', 'super_admin'].includes(user.role));

  // ── Fetch ──────────────────────────────────────────────────────────────────

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

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.assetTag || !registerForm.serialNumber) {
      toast.error('Asset description, tag, and serial number are required.');
      return;
    }
    try {
      await assetService.create(registerForm);
      toast.success('Asset registered successfully!');
      setRegisterForm({
        category: 'laptop', name: '', assetTag: '', serialNumber: '', brand: '', modelName: '',
        purchasePrice: 65000, condition: 'new', warrantyStart: '', warrantyEnd: '', location: 'Headquarters',
        depreciationRate: 15, residualValue: 5000, usefulLife: 5
      });
      setActiveTab('directory');
      fetchData();
    } catch {
      toast.error('Asset tag or serial already exists');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.assetId || !assignForm.employeeId) {
      toast.error('Please select both the asset and the employee');
      return;
    }
    try {
      await assetService.assign(assignForm.assetId, {
        employeeId: assignForm.employeeId,
        condition: assignForm.condition,
        remarks: assignForm.remarks
      });
      toast.success('Asset assigned successfully!');
      setAssignForm({ assetId: '', employeeId: '', condition: 'good', remarks: '', expectedReturn: '' });
      setActiveTab('directory');
      fetchData();
    } catch {
      toast.error('Assignment request failed');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnAssetId) return;
    try {
      await assetService.return(returnAssetId, {
        condition: returnForm.condition,
        remarks: returnForm.remarks
      });
      toast.success('Asset returned and returned to available stock.');
      setIsReturnModalOpen(false);
      fetchData();
    } catch {
      toast.error('Return check-in failed.');
    }
  };

  const openReturnModal = (id: string) => {
    setReturnAssetId(id);
    setReturnForm({ condition: 'good', remarks: '', missingAccessories: false });
    setIsReturnModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await assetService.return(id, { condition: 'retired', remarks: 'Disposed/deleted' });
      toast.success('Asset deleted successfully!');
      fetchData();
    } catch {
      toast.error('Failed to delete asset');
    }
  };

  // ── Derived Metrics ────────────────────────────────────────────────────────

  const totalAssetsValue = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
  const availableCount   = assets.filter(a => a.status === 'available').length;
  const assignedCount    = assets.filter(a => a.status === 'assigned').length;
  const maintenanceCount = assets.filter(a => a.status === 'maintenance').length;
  const retiredCount     = assets.filter(a => a.status === 'retired').length;
  const lostCount        = assets.filter(a => a.status === 'lost').length;

  const filteredAssets = assets.filter(a => {
    const matchSearch = !dirSearch || a.name.toLowerCase().includes(dirSearch.toLowerCase()) || a.assetTag.toLowerCase().includes(dirSearch.toLowerCase()) || a.serialNumber.toLowerCase().includes(dirSearch.toLowerCase());
    const matchCat = dirCat === 'all' || a.category === dirCat;
    const matchStatus = dirStatus === 'all' || a.status === dirStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const filteredEmployees = employees.filter(e => {
    const matchSearch = !empSearch || e.fullName.toLowerCase().includes(empSearch.toLowerCase()) || e.employeeId.toLowerCase().includes(empSearch.toLowerCase());
    const matchDept = empFilterDept === 'all' || (e.job?.departmentName ?? '') === empFilterDept;
    return matchSearch && matchDept;
  });

  const depts = Array.from(new Set(employees.map(e => e.job?.departmentName).filter(Boolean))) as string[];

  // Charts
  const categoryChartData = CATEGORIES.map(c => ({
    name: c.label.split(' ')[0],
    value: assets.filter(a => a.category === c.id).length
  })).filter(d => d.value > 0);

  const statusChartData = [
    { name: 'Available', value: availableCount },
    { name: 'Assigned',  value: assignedCount },
    { name: 'Repair/Maintenance', value: maintenanceCount },
    { name: 'Retired',   value: retiredCount },
  ];

  const deptChartData = depts.slice(0, 5).map(dept => ({
    name: dept.split(' ')[0],
    value: assets.filter(a => {
      if (a.status !== 'assigned') return false;
      const emp = employees.find(e => e.employeeId === a.currentEmployeeId || e._id === a.currentEmployeeId);
      return emp?.job?.departmentName === dept;
    }).length
  })).filter(d => d.value > 0);

  // ── Tab Config ─────────────────────────────────────────────────────────────

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard',          label: 'Dashboard',         icon: <GridFour size={14} /> },
    { id: 'directory',          label: 'Asset Directory',   icon: <ListBullets size={14} /> },
    { id: 'employee_workspace', label: 'Employee Workspace',icon: <User size={14} /> },
    { id: 'assignment_center',  label: 'Assignment Center', icon: <CheckSquare size={14} /> },
    { id: 'register',           label: 'Register Asset',    icon: <Plus size={14} /> },
    { id: 'maintenance',        label: 'Maintenance',       icon: <Wrench size={14} />, badge: maintenanceCount || undefined },
    { id: 'warranty',           label: 'Warranty Expiring', icon: <ShieldWarning size={14} />, badge: WARRANTY_ALERTS.filter(a => a.daysLeft <= 30).length },
    { id: 'transfers',          label: 'Asset Transfers',   icon: <ArrowsLeftRight size={14} /> },
    { id: 'depreciation',       label: 'Depreciation Ledger',icon: <ChartLineUp size={14} /> },
    { id: 'audit',              label: 'Audit Trail',       icon: <Clock size={14} /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <PageContainer
      title="Enterprise Asset & Inventory Lifecycle"
      subtitle="Complete hardware registry, assignment rosters, check-in, check-out validation, maintenance schedules, and asset depreciation."
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={16} />}>Refresh</Button>
          <Button icon={<Plus size={16} />} onClick={() => setActiveTab('register')}>Register Asset</Button>
        </div>
      }
    >
      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 p-1 bg-ag-surface-2 border border-ag-border rounded-xl w-fit mb-8 overflow-x-auto max-w-full shrink-0 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-ag-primary text-white shadow-sm'
                : 'text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-ag-coral text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB 1: EXECUTIVE DASHBOARD
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-3">
            {[
              { title: 'Total Assets',      value: assets.length,       icon: <Database size={20} />,    bg: 'bg-ag-primary-light text-ag-primary' },
              { title: 'Available',         value: availableCount,      icon: <CheckCircle size={20} />, bg: 'bg-[#E6FAF4] text-[#00875A]' },
              { title: 'Assigned',          value: assignedCount,       icon: <User size={20} />,        bg: 'bg-[#E8F6FF] text-ag-sky' },
              { title: 'In Maintenance',    value: maintenanceCount,    icon: <Wrench size={20} />,      bg: 'bg-[#FFF8E6] text-ag-amber' },
              { title: 'Returned Today',    value: retiredCount,        icon: <Plus size={20} />,        bg: 'bg-ag-surface-2 text-ag-ink-2' },
              { title: 'Lost Assets',       value: lostCount,           icon: <XCircle size={20} />,     bg: 'bg-[#FFF0EF] text-ag-coral' },
              { title: 'Expired Warranty',  value: WARRANTY_ALERTS.filter(a => a.daysLeft <= 0).length, icon: <Warning size={20} />, bg: 'bg-[#FFF0EF] text-ag-coral' },
              { title: 'Total Value',       value: formatCurrency(totalAssetsValue), icon: <Database size={20} />, bg: 'bg-[#E6FAF4] text-ag-mint' },
              { title: 'Depreciation (Yr)', value: formatCurrency(totalAssetsValue * 0.15), icon: <ChartLineUp size={20} />, bg: 'bg-[#FFF8E6] text-ag-amber' },
              { title: 'Storage Capacity',  value: '94%',               icon: <Database size={20} />,    bg: 'bg-[#E8F6FF] text-ag-sky' },
            ].map(k => (
              <Card key={k.title} className="p-3.5 flex flex-col justify-between border border-ag-border/60 hover:border-ag-border-strong transition-all">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg shrink-0 ${k.bg}`}>{k.icon}</div>
                </div>
                <div className="mt-3">
                  <span className="text-[9px] font-black uppercase tracking-wider text-ag-ink-3 block">{k.title}</span>
                  {isLoading ? (
                    <div className="h-5 w-10 bg-ag-border rounded animate-pulse mt-0.5" />
                  ) : (
                    <span className="font-display font-black text-sm text-ag-ink line-clamp-1">{k.value}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Charts & Timeline layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Pie & Status Bar */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5">
                <CardHeader title="Asset Category Breakdown" subtitle="Distribution of company assets by type." />
                <div className="h-52 flex items-center justify-center">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {categoryChartData.map((e, i) => <Cell key={i} fill={STATS_PIE_COLORS[i % STATS_PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} assets`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <span className="text-xs text-ag-ink-3">No assets to analyze</span>}
                </div>
              </Card>

              <Card className="p-5">
                <CardHeader title="Asset Availability & Health" subtitle="Roster counts by asset status." />
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                      <XAxis dataKey="name" stroke="#8E88A8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#8E88A8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#5B3CF5" radius={[4, 4, 0, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Department breakdown & Trend */}
              <Card className="p-5 md:col-span-2">
                <CardHeader title="Asset Assignment by Department" subtitle="Active asset inventory allocated per business unit." />
                <div className="h-44">
                  {deptChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={deptChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                        <XAxis type="number" stroke="#8E88A8" fontSize={10} tickLine={false} />
                        <YAxis type="category" dataKey="name" stroke="#8E88A8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#00C48C" radius={[0, 4, 4, 0]} name="Assigned Assets" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <span className="text-xs text-ag-ink-3">No assets assigned to departments yet.</span>}
                </div>
              </Card>
            </div>

            {/* Right: Activity timeline */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-5">
                <h4 className="font-bold text-[10px] uppercase text-ag-ink-3 tracking-wider mb-4">Latest Warranty Claims</h4>
                <div className="space-y-3">
                  {WARRANTY_ALERTS.map(w => (
                    <div key={w.id} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-ag-ink">{w.name}</p>
                        <p className="text-[10px] text-ag-ink-3">{w.tag}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        w.daysLeft <= 0 ? 'bg-[#FFF0EF] text-ag-coral' : w.daysLeft <= 15 ? 'bg-[#FFF8E6] text-ag-amber' : 'bg-[#E6FAF4] text-ag-mint'
                      }`}>
                        {w.daysLeft <= 0 ? 'Expired' : `${w.daysLeft} days`}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="font-bold text-[10px] uppercase text-ag-ink-3 tracking-wider mb-4">Upcoming Maintenance</h4>
                <div className="space-y-3">
                  {MAINTENANCE_SCHEDULES.map(m => (
                    <div key={m.id} className="text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-ag-ink">{m.asset}</span>
                        <span className="text-ag-primary">{formatCurrency(m.cost)}</span>
                      </div>
                      <p className="text-ag-ink-3 text-[10px]">{m.type}</p>
                      <p className="text-[9px] text-ag-ink-3 mt-1">Due: {formatDate(m.date)} · Partner: {m.vendor}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 2: ASSET DIRECTORY
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'directory' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-56">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ag-ink-3" />
              <input
                type="text"
                value={dirSearch}
                onChange={e => setDirSearch(e.target.value)}
                placeholder="Search assets by tag, serial number, brand, model..."
                className="w-full h-9 pl-9 pr-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none focus:border-ag-primary"
              />
            </div>
            <select
              value={dirCat}
              onChange={e => setDirCat(e.target.value)}
              className="h-9 px-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select
              value={dirStatus}
              onChange={e => setDirStatus(e.target.value)}
              className="h-9 px-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
              <option value="lost">Lost</option>
            </select>
            <div className="flex gap-1 p-0.5 bg-ag-surface-2 rounded-lg border border-ag-border">
              <button onClick={() => setDirView('table')} className={`p-1.5 rounded-md ${dirView === 'table' ? 'bg-white shadow text-ag-primary' : 'text-ag-ink-3'}`}><ListBullets size={15} /></button>
              <button onClick={() => setDirView('grid')} className={`p-1.5 rounded-md ${dirView === 'grid' ? 'bg-white shadow text-ag-primary' : 'text-ag-ink-3'}`}><GridFour size={15} /></button>
            </div>
          </div>

          <div className={`grid gap-6 ${selectedAsset ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
            {/* Table / Grid list */}
            <div className={selectedAsset ? 'lg:col-span-7' : 'col-span-1'}>
              {dirView === 'table' ? (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ag-border bg-ag-surface-2/40">
                          {['Asset Tag', 'Details', 'Condition', 'Status', 'Current Assignee', 'Procured Value', 'Actions'].map(h => (
                            <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr><td colSpan={7} className="p-8 text-center text-xs text-ag-ink-3">Loading inventory…</td></tr>
                        ) : filteredAssets.length === 0 ? (
                          <tr><td colSpan={7} className="p-8 text-center text-xs text-ag-ink-3">No assets match the search.</td></tr>
                        ) : filteredAssets.map(a => {
                          const emp = employees.find(e => e.employeeId === a.currentEmployeeId || e._id === a.currentEmployeeId);
                          return (
                            <tr key={a._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30 cursor-pointer transition-colors" onClick={() => setSelectedAsset(a)}>
                              <td className="py-3 px-4">
                                <span className="font-bold text-xs text-ag-ink block">{a.assetTag}</span>
                                <span className="text-[9px] font-bold text-ag-primary capitalize">{a.category}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-xs text-ag-ink-2 block">{a.brand} {a.modelName}</span>
                                <span className="text-[9px] font-mono text-ag-ink-3">S/N: {a.serialNumber}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full capitalize ${CONDITION_COLORS[a.condition] || 'bg-ag-surface-2'}`}>{a.condition}</span>
                              </td>
                              <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                              <td className="py-3 px-4">
                                {a.status === 'assigned' && emp ? (
                                  <div className="flex items-center gap-1.5">
                                    <Avatar name={emp.fullName} size="xs" src={emp.personal?.photo} />
                                    <span className="text-xs font-semibold text-ag-primary">{emp.fullName}</span>
                                  </div>
                                ) : <span className="text-xs text-ag-ink-3">—</span>}
                              </td>
                              <td className="py-3 px-4 font-mono text-xs font-semibold text-ag-ink-2">{formatCurrency(a.purchasePrice)}</td>
                              <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                                {a.status === 'available' ? (
                                  <Button size="sm" onClick={() => { setAssignForm(p => ({ ...p, assetId: a._id })); setActiveTab('assignment_center'); }} icon={<CheckSquare size={12} />}>Assign</Button>
                                ) : (
                                  <Button size="sm" variant="secondary" onClick={() => openReturnModal(a._id)} icon={<Sparkle size={12} />}>Return</Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredAssets.map(a => (
                    <Card key={a._id} className="p-4 hover:border-ag-border-strong cursor-pointer transition-all space-y-3" onClick={() => setSelectedAsset(a)}>
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-ag-surface-2 rounded-lg"><Database size={18} /></div>
                        <StatusBadge status={a.status} />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-ag-ink">{a.assetTag}</span>
                        <p className="font-semibold text-xs text-ag-ink-2 line-clamp-1">{a.brand} {a.modelName}</p>
                        <p className="text-[10px] text-ag-ink-3">S/N: {a.serialNumber}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-ag-border/40">
                        <span className="font-mono text-xs font-bold">{formatCurrency(a.purchasePrice)}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded capitalize ${CONDITION_COLORS[a.condition] || 'bg-ag-surface-2'}`}>{a.condition}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Split View Profile Detail Panel */}
            {selectedAsset && (
              <div className="lg:col-span-5">
                <Card className="p-5 space-y-5 flex flex-col h-full justify-between min-h-[60vh]">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start border-b border-ag-border pb-3">
                      <div>
                        <span className="text-[9px] font-black uppercase text-ag-ink-3 tracking-wider">{selectedAsset.category}</span>
                        <h3 className="font-display font-black text-base text-ag-ink">{selectedAsset.brand} {selectedAsset.modelName}</h3>
                        <p className="text-xs text-ag-ink-3 font-mono mt-0.5">{selectedAsset.assetTag}</p>
                      </div>
                      <button onClick={() => setSelectedAsset(null)} className="p-1.5 rounded hover:bg-ag-surface-2 text-ag-ink-3"><XCircle size={16} /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-ag-ink-3 block">Serial Number:</span>
                        <span className="font-bold font-mono text-ag-ink-2">{selectedAsset.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-ag-ink-3 block">Condition:</span>
                        <span className={`font-bold capitalize px-1.5 py-0.5 rounded ${CONDITION_COLORS[selectedAsset.condition] || 'bg-ag-surface-2'}`}>{selectedAsset.condition}</span>
                      </div>
                      <div>
                        <span className="text-ag-ink-3 block">Purchase Price:</span>
                        <span className="font-bold font-mono text-ag-ink-2">{formatCurrency(selectedAsset.purchasePrice)}</span>
                      </div>
                      <div>
                        <span className="text-ag-ink-3 block">Warranty Start:</span>
                        <span className="font-bold text-ag-ink-2">{formatDate(selectedAsset.warrantyStart) || 'Not Configured'}</span>
                      </div>
                    </div>

                    {/* QR Code section */}
                    <div className="p-4 bg-ag-surface rounded-xl flex items-center justify-between border border-ag-border/50">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-ag-ink uppercase tracking-wider flex items-center gap-1"><QrCode size={13} /> Asset Label QR Code</span>
                        <p className="text-[9px] text-ag-ink-3">Print this label to stick on hardware for physical checks</p>
                      </div>
                      <div className="p-2.5 bg-white border border-ag-border rounded-lg shadow-sm shrink-0">
                        <QrCode size={40} className="text-ag-ink" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-ag-border">
                    {selectedAsset.status === 'available' ? (
                      <Button className="flex-1" icon={<CheckSquare size={14} />} onClick={() => { setAssignForm(p => ({ ...p, assetId: selectedAsset._id })); setActiveTab('assignment_center'); }}>Assign to Employee</Button>
                    ) : (
                      <Button className="flex-1" variant="secondary" icon={<Sparkle size={14} />} onClick={() => openReturnModal(selectedAsset._id)}>Return to Inventory</Button>
                    )}
                    <Button variant="secondary" icon={<Trash size={14} />} className="hover:text-ag-coral hover:bg-ag-coral/10 hover:border-ag-coral/30" onClick={() => handleDelete(selectedAsset._id)} />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 3: EMPLOYEE ASSETS WORKSPACE
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'employee_workspace' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-56">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ag-ink-3" />
              <input
                type="text"
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                placeholder="Search employee by name or ID…"
                className="w-full h-9 pl-9 pr-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none focus:border-ag-primary"
              />
            </div>
            <select
              value={empFilterDept}
              onChange={e => setEmpFilterDept(e.target.value)}
              className="h-9 px-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none"
            >
              <option value="all">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Employee List Left (4 Column) */}
            <div className="lg:col-span-4 space-y-3">
              <Card className="max-h-[500px] overflow-y-auto">
                <div className="p-3 border-b border-ag-border">
                  <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider">Employee Directory</h4>
                </div>
                <div className="divide-y divide-ag-border/40">
                  {filteredEmployees.map(emp => {
                    const empAssets = assets.filter(a => a.currentEmployeeId === emp.employeeId || a.currentEmployeeId === emp._id);
                    return (
                      <div
                        key={emp._id}
                        onClick={() => setSelectedEmp(emp)}
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          selectedEmp?._id === emp._id ? 'bg-ag-primary-light' : 'hover:bg-ag-surface-2/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={emp.fullName} size="xs" src={emp.personal?.photo} />
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-ag-ink truncate">{emp.fullName}</p>
                            <p className="text-[10px] text-ag-ink-3">{emp.job?.departmentName ?? '—'}</p>
                          </div>
                        </div>
                        <Badge variant={empAssets.length > 0 ? 'primary' : 'muted'} size="sm">
                          {empAssets.length} Assets
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Selected Employee Asset Profile (8 Column) */}
            <div className="lg:col-span-8">
              {selectedEmp ? (
                <Card className="p-5 space-y-6">
                  {/* Header info */}
                  <div className="flex items-center gap-4 pb-4 border-b border-ag-border">
                    <Avatar name={selectedEmp.fullName} size="lg" src={selectedEmp.personal?.photo} />
                    <div>
                      <h3 className="font-display font-black text-lg text-ag-ink">{selectedEmp.fullName}</h3>
                      <p className="text-xs text-ag-ink-3">{selectedEmp.job?.designationName} · {selectedEmp.job?.departmentName}</p>
                      <p className="text-[10px] text-ag-ink-3 mt-1">Joined: {formatDate(selectedEmp.official?.dateOfJoining)} · Manager: {selectedEmp.job?.reportingManagerName || 'None'}</p>
                    </div>
                  </div>

                  {/* Allocated Assets List */}
                  <div>
                    <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-3">Currently Assigned Assets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assets.filter(a => a.currentEmployeeId === selectedEmp.employeeId || a.currentEmployeeId === selectedEmp._id).map(a => (
                        <div key={a._id} className="p-4 border border-ag-border rounded-xl space-y-3 bg-white hover:border-ag-border-strong transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Database size={16} className="text-ag-primary" />
                              <div>
                                <span className="font-bold text-xs text-ag-ink">{a.brand} {a.modelName}</span>
                                <p className="text-[9px] font-mono text-ag-ink-3">{a.assetTag} · S/N: {a.serialNumber}</p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded capitalize ${CONDITION_COLORS[a.condition] || 'bg-ag-surface-2'}`}>{a.condition}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] pt-2 border-t border-ag-border/30">
                            <span className="text-ag-ink-3">Value: {formatCurrency(a.purchasePrice)}</span>
                            <Button size="sm" variant="secondary" className="h-7 text-[10px]" icon={<Sparkle size={10} />} onClick={() => openReturnModal(a._id)}>Return</Button>
                          </div>
                        </div>
                      ))}
                      {assets.filter(a => a.currentEmployeeId === selectedEmp.employeeId || a.currentEmployeeId === selectedEmp._id).length === 0 && (
                        <p className="text-xs text-ag-ink-3 col-span-2 text-center py-4">No assets currently allocated to this employee.</p>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="border-2 border-dashed border-ag-border rounded-xl p-12 text-center">
                  <User size={36} className="mx-auto mb-2 text-ag-border-strong" />
                  <p className="font-bold text-ag-ink text-sm">Select an employee from directory</p>
                  <p className="text-xs text-ag-ink-3 mt-1">Select an employee in the list to view or check-out assets to their profile.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 4: ASSIGNMENT CENTER
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'assignment_center' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Checkout Panel Left Form */}
          <div className="lg:col-span-8">
            <Card className="p-5">
              <CardHeader title="Asset Checkout Allocation" subtitle="Assign assets directly to active employee profiles." />
              <form className="space-y-4 pt-2" onSubmit={handleAssign}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Asset *</label>
                    <select
                      value={assignForm.assetId}
                      onChange={e => setAssignForm({ ...assignForm, assetId: e.target.value })}
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    >
                      <option value="">Select available asset</option>
                      {assets.filter(a => a.status === 'available').map(a => (
                        <option key={a._id} value={a._id}>{a.assetTag} — {a.brand} {a.modelName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Assignee Employee *</label>
                    <select
                      value={assignForm.employeeId}
                      onChange={e => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    >
                      <option value="">Select active employee</option>
                      {employees.map(e => (
                        <option key={e.employeeId} value={e.employeeId}>{e.fullName} ({e.employeeId})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Checkout Condition"
                    options={[
                      { value: 'new', label: 'Brand New' },
                      { value: 'good', label: 'Good' },
                      { value: 'fair', label: 'Fair' }
                    ]}
                    value={assignForm.condition}
                    onChange={e => setAssignForm({ ...assignForm, condition: e.target.value })}
                  />
                  <Input
                    label="Expected Return Date (Optional)"
                    type="date"
                    value={assignForm.expectedReturn}
                    onChange={e => setAssignForm({ ...assignForm, expectedReturn: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">Checkout / Handover Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Include details about initial charger status, condition check, etc."
                    value={assignForm.remarks}
                    onChange={e => setAssignForm({ ...assignForm, remarks: e.target.value })}
                    className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" icon={<CheckSquare size={16} />}>Confirm Assignment</Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Panel Summary Checklist */}
          <div className="lg:col-span-4 space-y-5">
            <Card className="p-5">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-3">Checkout Verification</h4>
              <div className="space-y-3 text-xs text-ag-ink-3">
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" />
                  <span>Hardware serial number matches the chassis.</span>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" />
                  <span>All secondary power bricks and chargers included.</span>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" />
                  <span>Employee has signed the physical receipt.</span>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-ag-primary-light border-ag-primary/20">
              <h4 className="font-bold text-xs text-ag-primary uppercase tracking-wider mb-2 flex items-center gap-1.5"><Info size={14} />Assignment Guideline</h4>
              <ul className="space-y-1 text-[10px] text-ag-ink-3">
                <li>• All high-value hardware checkout requires HR signature verification.</li>
                <li>• Software licenses automatically trigger audit updates.</li>
                <li>• Assigned status auto-syncs to the employee dashboard profile.</li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 5: REGISTER ASSET
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <Card>
          <CardHeader title="Register Corporate Property" subtitle="Define manufacturer specs, asset identifiers, and procurement data." />
          <form className="p-6 space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Basic Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase text-ag-primary tracking-wider border-b border-ag-border pb-1">Basic Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Category *"
                    value={registerForm.category}
                    onChange={e => setRegisterForm({ ...registerForm, category: e.target.value })}
                    options={[
                      { value: 'laptop',      label: 'Laptop / Notebook' },
                      { value: 'desktop',     label: 'Desktop PC' },
                      { value: 'phone',       label: 'Mobile Phone' },
                      { value: 'sim',         label: 'SIM Card' },
                      { value: 'access_card', label: 'Access Card' },
                      { value: 'software',    label: 'Software License' },
                      { value: 'other',       label: 'Other Asset' }
                    ]}
                  />
                  <Input label="Asset Brand *" placeholder="Apple" required value={registerForm.brand} onChange={e => setRegisterForm({ ...registerForm, brand: e.target.value })} />
                </div>
                <Input label="Model Details *" placeholder="MacBook Pro 16" required value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Asset Tag ID *" placeholder="TAG-2026-001" required value={registerForm.assetTag} onChange={e => setRegisterForm({ ...registerForm, assetTag: e.target.value })} />
                  <Input label="Serial Number *" placeholder="C02F812XMD6M" required value={registerForm.serialNumber} onChange={e => setRegisterForm({ ...registerForm, serialNumber: e.target.value })} />
                </div>
              </div>

              {/* Right Column: Financial & Warranty */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase text-ag-primary tracking-wider border-b border-ag-border pb-1">Financial & Warranty</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Procurement Value (INR) *" type="number" required value={registerForm.purchasePrice} onChange={e => setRegisterForm({ ...registerForm, purchasePrice: Number(e.target.value) })} />
                  <Select
                    label="Condition"
                    value={registerForm.condition}
                    onChange={e => setRegisterForm({ ...registerForm, condition: e.target.value })}
                    options={[
                      { value: 'new',     label: 'Brand New' },
                      { value: 'good',    label: 'Good Condition' },
                      { value: 'fair',    label: 'Fair / Used' },
                      { value: 'damaged', label: 'Damaged' }
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Warranty Start Date" type="date" value={registerForm.warrantyStart} onChange={e => setRegisterForm({ ...registerForm, warrantyStart: e.target.value })} />
                  <Input label="Warranty End Date" type="date" value={registerForm.warrantyEnd} onChange={e => setRegisterForm({ ...registerForm, warrantyEnd: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Depreciation Rate (%)" type="number" value={registerForm.depreciationRate} onChange={e => setRegisterForm({ ...registerForm, depreciationRate: Number(e.target.value) })} />
                  <Input label="Residual / Scrap Value (INR)" type="number" value={registerForm.residualValue} onChange={e => setRegisterForm({ ...registerForm, residualValue: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-ag-border">
              <Button type="submit" icon={<Plus size={16} />}>Register & Add Asset</Button>
            </div>
          </form>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 6: MAINTENANCE
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'maintenance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card>
              <CardHeader title="Asset Repair & Service Logs" subtitle="Tracking active hardware repairs, AMC claims, and scheduled services." />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2/40">
                      {['Asset Tag', 'Repair details', 'Vendor Service Center', 'Est Cost', 'Status'].map(h => (
                        <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REPAIRS_LIST.map(r => (
                      <tr key={r.id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                        <td className="py-3 px-4 font-bold text-xs text-ag-ink">{r.tag}</td>
                        <td className="py-3 px-4 text-xs text-ag-ink-2">{r.issue}</td>
                        <td className="py-3 px-4 text-xs text-ag-ink-3">{r.center}</td>
                        <td className="py-3 px-4 font-mono text-xs text-ag-ink-2">{formatCurrency(r.cost)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            r.status === 'Completed' ? 'bg-[#E6FAF4] text-[#00875A]' : 'bg-[#FFF8E6] text-[#946000]'
                          }`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="p-5">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-4">Upcoming Routine Checks</h4>
              <div className="space-y-4">
                {MAINTENANCE_SCHEDULES.map(item => (
                  <div key={item.id} className="border-l-2 border-ag-primary pl-3 text-xs">
                    <p className="font-bold text-ag-ink">{item.asset} · {item.type}</p>
                    <p className="text-[10px] text-ag-ink-3">Partner: {item.vendor}</p>
                    <p className="text-[9px] text-ag-ink-3 mt-1">Date: {formatDate(item.date)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 7: WARRANTY & TRANSFERS
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'warranty' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Warranty Claim alerts" subtitle="Alerts on devices nearing warranty expiration in 30, 60, or 90 days." />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2/40">
                    {['Asset Name', 'Tag', 'Remaining Days', 'Status'].map(h => (
                      <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WARRANTY_ALERTS.map(w => (
                    <tr key={w.id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                      <td className="py-3 px-4 text-xs font-semibold text-ag-ink">{w.name}</td>
                      <td className="py-3 px-4 text-xs font-mono text-ag-ink-3">{w.tag}</td>
                      <td className="py-3 px-4">
                        {w.daysLeft <= 0 ? (
                          <span className="font-black text-xs text-ag-coral">Expired ({Math.abs(w.daysLeft)} days ago)</span>
                        ) : (
                          <span className="font-semibold text-xs text-ag-ink-2">{w.daysLeft} days remaining</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          w.daysLeft <= 0 ? 'bg-[#FFF0EF] text-ag-coral' : w.daysLeft <= 30 ? 'bg-[#FFF8E6] text-ag-amber' : 'bg-[#E6FAF4] text-ag-mint'
                        }`}>{w.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 8: TRANSFERS
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Inter-Department & Employee Transfers" subtitle="Chronological history of assets transferred between profiles and branches." />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2/40">
                    {['Asset Tag', 'Transferred From', 'Transferred To', 'Date', 'Approved By'].map(h => (
                      <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRANSFERS_LOG.map(t => (
                    <tr key={t.id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                      <td className="py-3 px-4 font-bold text-xs text-ag-ink">{t.tag}</td>
                      <td className="py-3 px-4 text-xs text-ag-ink-2">{t.from}</td>
                      <td className="py-3 px-4 text-xs text-ag-ink-2">{t.to}</td>
                      <td className="py-3 px-4 text-xs text-ag-ink-3">{formatDate(t.date)}</td>
                      <td className="py-3 px-4 text-xs text-ag-ink-3 font-semibold">{t.approvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 9: DEPRECIATION LEDGER
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'depreciation' && (
        <div className="space-y-6">
          {/* Depreciation Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <CardHeader title="Asset Depreciation Schedule" subtitle="Annual straight-line depreciation projection matrix." />
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { year: 'Year 0', value: totalAssetsValue },
                    { year: 'Year 1', value: totalAssetsValue * 0.85 },
                    { year: 'Year 2', value: totalAssetsValue * 0.70 },
                    { year: 'Year 3', value: totalAssetsValue * 0.55 },
                    { year: 'Year 4', value: totalAssetsValue * 0.40 },
                    { year: 'Year 5', value: totalAssetsValue * 0.25 },
                  ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                    <XAxis dataKey="year" stroke="#8E88A8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#8E88A8" fontSize={10} tickLine={false} />
                    <Tooltip formatter={(v) => [formatCurrency(v as number), 'Asset Book Value']} />
                    <Area type="monotone" dataKey="value" stroke="#5B3CF5" fill="#E4DFFF" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader title="Financial Asset Valuation" subtitle="Summarized book value metrics for finance records." />
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Initial Asset Value', val: formatCurrency(totalAssetsValue), color: 'text-ag-ink' },
                  { label: 'Calculated Depreciation (Year 1)', val: formatCurrency(totalAssetsValue * 0.15), color: 'text-ag-coral' },
                  { label: 'Expected Book Value (End of Year)', val: formatCurrency(totalAssetsValue * 0.85), color: 'text-ag-mint font-bold' },
                  { label: 'Calculated Scrap Residual Limit', val: formatCurrency(totalAssetsValue * 0.10), color: 'text-ag-ink-3' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-2 border-b border-ag-border/40">
                    <span className="text-ag-ink-3">{s.label}</span>
                    <strong className={s.color}>{s.val}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 10: AUDIT TRAIL
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Enterprise Asset Audit Timeline" subtitle="Chronological ledger of asset creation, assignment, checkout, check-in, repair, and disposal." />
            <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
              {[
                { action: 'Asset Checkout Assigned', tag: 'TAG-2026-001', detail: 'Assigned to EMP005 (Finance Team)', time: '10 min ago' },
                { action: 'Repair Created', tag: 'TAG-2026-003', detail: 'Dispatched to service center for screen correction', time: '1 hr ago' },
                { action: 'Return Checked In', tag: 'TAG-2026-004', detail: 'Restored and checked-in as available hardware', time: '2 hrs ago' },
                { action: 'Asset Created', tag: 'TAG-2026-007', detail: 'Initialized Dell Latitude 5430 in database', time: 'Yesterday' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 items-start text-xs border-l-2 border-ag-primary pl-4 relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-ag-primary absolute -left-[6px] top-1" />
                  <div className="flex-1">
                    <p className="font-bold text-ag-ink">{log.action} · <span className="font-mono text-ag-primary">{log.tag}</span></p>
                    <p className="text-ag-ink-3 text-[10px]">{log.detail}</p>
                  </div>
                  <span className="text-[10px] text-ag-ink-3 shrink-0 font-mono">{log.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Handover check-in return confirmation modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Check-In Returned Corporate Asset"
        description="Acknowledge returned hardware and audit its current condition prior to restoring it to stock."
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4 pt-2">
          <Select
            label="Verified Return Condition"
            options={[
              { value: 'new', label: 'Brand New' },
              { value: 'good', label: 'Good / Used' },
              { value: 'fair', label: 'Fair' },
              { value: 'damaged', label: 'Damaged' }
            ]}
            value={returnForm.condition}
            onChange={e => setReturnForm({ ...returnForm, condition: e.target.value })}
          />

          <div className="flex items-center gap-2 text-xs py-1">
            <input
              type="checkbox"
              id="missing"
              checked={returnForm.missingAccessories}
              onChange={e => setReturnForm({ ...returnForm, missingAccessories: e.target.checked })}
            />
            <label htmlFor="missing" className="font-semibold text-ag-ink-2 select-none">Missing auxiliary accessories (power brick, mouse, etc.)</label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="ag-label">Auditor Comments</label>
            <textarea
              rows={3}
              placeholder="Include details about wear, missing cables, screen status, etc."
              value={returnForm.remarks}
              onChange={e => setReturnForm({ ...returnForm, remarks: e.target.value })}
              className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-xs text-ag-ink focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-ag-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
            <Button type="submit">Verify & Check-In</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
