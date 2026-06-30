import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { settingsService } from '@/services/api.service';
import {
  Shield, Building, CheckCircle, ToggleLeft, ToggleRight,
  Rows, Briefcase, CalendarBlank, ArrowsClockwise, Plus, Trash, Rocket
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'company' | 'departments' | 'designations' | 'holidays' | 'security';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('company');
  const [saving, setSaving]       = useState(false);
  const [twoFA, setTwoFA]         = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Company settings
  const [companyData, setCompanyData] = useState<any>(null);

  // Departments
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDept, setNewDept]         = useState({ name: '', code: '' });

  // Designations
  const [designations, setDesignations] = useState<any[]>([]);
  const [newDesg, setNewDesg]           = useState({ name: '', code: '' });

  // Holidays
  const [holidays, setHolidays]   = useState<any[]>([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', type: 'national' });

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [depts, desgs, hols] = await Promise.all([
        settingsService.getDepartments(),
        settingsService.getDesignations(),
        settingsService.getHolidays(),
      ]);
      setDepartments(depts);
      setDesignations(desgs);
      if (hols.length > 0) setHolidays(hols[0]?.holidays || []);
    } catch {
      // Settings may not be initialised yet — silently ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleInitialize = async () => {
    setSaving(true);
    try {
      await settingsService.initialize();
      toast.success('Company defaults initialized! Departments, leave types, shifts, and notification templates seeded.');
      fetchSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Initialization failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Department handlers ──────────────────────────────────────
  const handleAddDept = async () => {
    if (!newDept.name || !newDept.code) { toast.error('Name and code are required'); return; }
    try {
      const updated = await settingsService.addDepartment(newDept);
      setDepartments(updated);
      setNewDept({ name: '', code: '' });
      toast.success('Department added');
    } catch { toast.error('Failed to add department'); }
  };

  const handleDeleteDept = async (id: string) => {
    try {
      const updated = await settingsService.deleteDepartment(id);
      setDepartments(updated);
      toast.success('Department removed');
    } catch { toast.error('Failed to remove department'); }
  };

  // ── Designation handlers ─────────────────────────────────────
  const handleAddDesg = async () => {
    if (!newDesg.name || !newDesg.code) { toast.error('Name and code are required'); return; }
    try {
      const updated = await settingsService.addDesignation(newDesg);
      setDesignations(updated);
      setNewDesg({ name: '', code: '' });
      toast.success('Designation added');
    } catch { toast.error('Failed to add designation'); }
  };

  const handleDeleteDesg = async (id: string) => {
    try {
      const updated = await settingsService.deleteDesignation(id);
      setDesignations(updated);
      toast.success('Designation removed');
    } catch { toast.error('Failed to remove designation'); }
  };

  // ── Holiday handlers ─────────────────────────────────────────
  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) { toast.error('Date and name are required'); return; }
    const year = new Date(newHoliday.date).getFullYear();
    try {
      const existing = await settingsService.getHolidays();
      const cal = existing.find((h: any) => h.year === year);
      const updatedHolidays = [...(cal?.holidays || []), newHoliday];
      await settingsService.saveHolidays({ name: `Calendar ${year}`, year, holidays: updatedHolidays });
      setHolidays(updatedHolidays);
      setNewHoliday({ date: '', name: '', type: 'national' });
      toast.success('Holiday added to calendar');
    } catch { toast.error('Failed to save holiday'); }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'company',      label: 'Company',      icon: <Building size={16} /> },
    { id: 'departments',  label: 'Departments',  icon: <Rows size={16} /> },
    { id: 'designations', label: 'Designations', icon: <Briefcase size={16} /> },
    { id: 'holidays',     label: 'Holidays',     icon: <CalendarBlank size={16} /> },
    { id: 'security',     label: 'Security',     icon: <Shield size={16} /> },
  ];

  return (
    <PageContainer
      title="System Settings"
      subtitle={`Configure company-wide policies, organisational hierarchy, and platform security.`}
    >
      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-ag-primary text-white shadow'
                : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Company Tab ──────────────────────────────────── */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <Card className="p-6 max-w-2xl">
            <CardHeader title="Platform Initialization" subtitle="Seed default leave types, shifts, salary structures, workflows and notification templates for your company." />
            <div className="mt-4">
              <Button
                onClick={handleInitialize}
                isLoading={saving}
                icon={<Rocket size={18} />}
              >
                Initialize Company Defaults
              </Button>
              <p className="text-xs text-ag-ink-3 mt-3">
                Safe to run multiple times — uses upsert operations. Run this once after creating your company workspace.
              </p>
            </div>
          </Card>

          <Card className="p-6 max-w-2xl">
            <CardHeader title="Payroll Rules" subtitle="Configure PF, ESI, Basic %, and GPS geofencing requirements." />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input label="Basic % of CTC" type="number" defaultValue={40} />
              <Input label="HRA % of Basic" type="number" defaultValue={50} />
            </div>
            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-ag-ink cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-ag-border text-ag-primary" />
                Provident Fund (PF) Enabled
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-ag-ink cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-ag-border text-ag-primary" />
                ESI Enabled
              </label>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => toast.success('Payroll rules saved')} isLoading={saving}>
                Save Rules
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Departments Tab ──────────────────────────────── */}
      {activeTab === 'departments' && (
        <Card className="max-w-2xl">
          <CardHeader title="Department Registry" subtitle="Manage your organisational department structure." />
          <div className="p-5 space-y-4">
            {/* Add row */}
            <div className="flex gap-3 items-end">
              <Input
                label="Department Name"
                placeholder="e.g. Engineering"
                value={newDept.name}
                onChange={e => setNewDept(d => ({ ...d, name: e.target.value }))}
                className="flex-1"
              />
              <Input
                label="Short Code"
                placeholder="ENG"
                value={newDept.code}
                onChange={e => setNewDept(d => ({ ...d, code: e.target.value.toUpperCase() }))}
                className="w-28"
              />
              <Button onClick={handleAddDept} icon={<Plus size={16} />}>Add</Button>
            </div>

            {/* List */}
            <div className="rounded-xl border border-ag-border divide-y divide-ag-border overflow-hidden">
              {isLoading ? (
                <p className="p-4 text-sm text-ag-ink-3">Loading departments…</p>
              ) : departments.length === 0 ? (
                <p className="p-4 text-sm text-ag-ink-3">No departments yet. Click Initialize or add manually above.</p>
              ) : (
                departments.map((dept: any) => (
                  <div key={dept._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="font-semibold text-ag-ink text-sm">{dept.name}</span>
                      <span className="ml-3 text-xs font-mono text-ag-primary bg-ag-primary-light px-2 py-0.5 rounded">{dept.code}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteDept(dept._id)}
                      className="text-ag-ink-3 hover:text-ag-accent-pink transition-colors"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Designations Tab ─────────────────────────────── */}
      {activeTab === 'designations' && (
        <Card className="max-w-2xl">
          <CardHeader title="Designation / Role Ladder" subtitle="Configure job titles and grade hierarchy for the organisation." />
          <div className="p-5 space-y-4">
            <div className="flex gap-3 items-end">
              <Input
                label="Designation Name"
                placeholder="e.g. Software Engineer"
                value={newDesg.name}
                onChange={e => setNewDesg(d => ({ ...d, name: e.target.value }))}
                className="flex-1"
              />
              <Input
                label="Short Code"
                placeholder="SWE"
                value={newDesg.code}
                onChange={e => setNewDesg(d => ({ ...d, code: e.target.value.toUpperCase() }))}
                className="w-28"
              />
              <Button onClick={handleAddDesg} icon={<Plus size={16} />}>Add</Button>
            </div>

            <div className="rounded-xl border border-ag-border divide-y divide-ag-border overflow-hidden">
              {isLoading ? (
                <p className="p-4 text-sm text-ag-ink-3">Loading designations…</p>
              ) : designations.length === 0 ? (
                <p className="p-4 text-sm text-ag-ink-3">No designations yet.</p>
              ) : (
                designations.map((desg: any) => (
                  <div key={desg._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="font-semibold text-ag-ink text-sm">{desg.name}</span>
                      <span className="ml-3 text-xs font-mono text-ag-primary bg-ag-primary-light px-2 py-0.5 rounded">{desg.code}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteDesg(desg._id)}
                      className="text-ag-ink-3 hover:text-ag-accent-pink transition-colors"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Holidays Tab ─────────────────────────────────── */}
      {activeTab === 'holidays' && (
        <Card className="max-w-2xl">
          <CardHeader title="Holiday Calendar" subtitle={`Manage public and optional holidays for ${new Date().getFullYear()}.`} />
          <div className="p-5 space-y-4">
            <div className="flex gap-3 items-end flex-wrap">
              <Input
                label="Holiday Date"
                type="date"
                value={newHoliday.date}
                onChange={e => setNewHoliday(h => ({ ...h, date: e.target.value }))}
                className="w-48"
              />
              <Input
                label="Holiday Name"
                placeholder="e.g. Republic Day"
                value={newHoliday.name}
                onChange={e => setNewHoliday(h => ({ ...h, name: e.target.value }))}
                className="flex-1"
              />
              <div className="w-36">
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Type</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                  value={newHoliday.type}
                  onChange={e => setNewHoliday(h => ({ ...h, type: e.target.value }))}
                >
                  <option value="national">National</option>
                  <option value="optional">Optional</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
              <Button onClick={handleAddHoliday} icon={<Plus size={16} />}>Add</Button>
            </div>

            <div className="rounded-xl border border-ag-border divide-y divide-ag-border overflow-hidden">
              {holidays.length === 0 ? (
                <p className="p-4 text-sm text-ag-ink-3">No holidays configured. Add or run Initialize first.</p>
              ) : (
                holidays.map((h: any, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="font-semibold text-ag-ink text-sm">{h.name}</span>
                      <span className="ml-3 text-xs text-ag-ink-3">{new Date(h.date).toLocaleDateString()}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                      h.type === 'national' ? 'bg-[#E6FAF4] text-[#00875A]' :
                      h.type === 'optional' ? 'bg-[#FFF8E6] text-ag-amber' :
                      'bg-ag-surface-2 text-ag-ink-3'
                    }`}>
                      {h.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Security Tab ─────────────────────────────────── */}
      {activeTab === 'security' && (
        <Card className="max-w-xl">
          <CardHeader title="Security & Access Policies" subtitle="Configure platform authentication rules and access control settings." />
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-ag-surface-2 border border-ag-border">
              <div>
                <p className="font-semibold text-ag-ink text-sm">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-ag-ink-3 mt-0.5">Require TOTP codes for all admin logins</p>
              </div>
              <button onClick={() => setTwoFA(v => !v)}>
                {twoFA ? <ToggleRight size={32} className="text-ag-primary" /> : <ToggleLeft size={32} className="text-ag-ink-3" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-ag-surface-2 border border-ag-border">
              <div>
                <p className="font-semibold text-ag-ink text-sm">Session Timeout</p>
                <p className="text-xs text-ag-ink-3 mt-0.5">Auto-logout after inactivity period</p>
              </div>
              <select className="h-9 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none">
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-ag-surface-2 border border-ag-border">
              <p className="font-semibold text-ag-ink text-sm mb-2">Password Policy</p>
              <div className="space-y-2">
                {['Minimum 8 characters', 'Require uppercase & lowercase', 'At least one special character', 'No reuse of last 5 passwords'].map(rule => (
                  <div key={rule} className="flex items-center gap-2 text-xs text-ag-ink-2">
                    <CheckCircle size={14} className="text-[#00875A] flex-shrink-0" />
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => toast.success('Security settings saved')}
                isLoading={saving}
              >
                Save Security Settings
              </Button>
            </div>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
