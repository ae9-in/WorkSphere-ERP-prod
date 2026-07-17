import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { auditService, settingsService } from '@/services/api.service';
import {
  Users, Shield, Building, CheckSquare, Bell, History, Settings, Share2, Lock,
  Cpu, Database, Key, Server, Plus, Trash, ShieldAlert, Sparkles, RefreshCw,
  Search, Power, RefreshCw as RotateCcw, AlertTriangle, Cloud, Eye, FileText, CheckCircle, Check, X, LogOut, Download, Upload, Info
} from 'lucide-react';
import { toast } from 'sonner';

type AdminTab =
  | 'users'
  | 'permissions'
  | 'company-settings'
  | 'approvals'
  | 'notifications'
  | 'audit-logs'
  | 'settings'
  | 'integrations'
  | 'security'
  | 'sessions'
  | 'backup'
  | 'api-keys';

interface TabItem {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
}

export default function AdminCenterPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Read active tab from URL path, default to 'users'
  const activeTab = (location.pathname.split('/').pop() || 'users') as AdminTab;

  const handleTabChange = (tabId: AdminTab) => {
    navigate(`/admin/${tabId}`);
  };

  // Mock State Managers
  // 1. Users State
  const [users, setUsers] = useState<any[]>([
    { id: '1', name: 'Marcus Vance', empId: 'EMP-00001', email: 'admin@worksphere.com', phone: '+91 98765 43210', dept: 'Engineering', designation: 'Principal Architect', branch: 'Bangalore HQ', role: 'Super Admin', manager: 'None', status: 'active', lastLogin: '2026-07-17 11:20', device: 'Chrome on macOS', mfa: 'Enabled' },
    { id: '2', name: 'Aria Bennett', empId: 'EMP-00002', email: 'aria.b@worksphere.com', phone: '+91 98765 43211', dept: 'HR', designation: 'HR Director', branch: 'Bangalore HQ', role: 'HR Admin', manager: 'Marcus Vance', status: 'active', lastLogin: '2026-07-17 10:15', device: 'Firefox on Windows', mfa: 'Enabled' },
    { id: '3', name: 'Devin Karp', empId: 'EMP-00003', email: 'devin.k@worksphere.com', phone: '+91 98765 43212', dept: 'Sales', designation: 'Sales Manager', branch: 'San Francisco', role: 'Sales Manager', manager: 'Marcus Vance', status: 'active', lastLogin: '2026-07-16 18:40', device: 'Safari on iPhone', mfa: 'Disabled' },
    { id: '4', name: 'Sarah Connor', empId: 'EMP-00004', email: 'sarah.c@worksphere.com', phone: '+91 98765 43213', dept: 'Finance', designation: 'Accountant', branch: 'London Office', role: 'Accountant', manager: 'Marcus Vance', status: 'suspended', lastLogin: '2026-07-10 09:00', device: 'Edge on Windows', mfa: 'Enabled' },
    { id: '5', name: 'John Doe', empId: 'EMP-00005', email: 'john.d@worksphere.com', phone: '+91 98765 43214', dept: 'Operations', designation: 'Inventory Executive', branch: 'Bangalore HQ', role: 'Employee', manager: 'Marcus Vance', status: 'deactivated', lastLogin: '2026-06-30 14:10', device: 'Chrome on Linux', mfa: 'Disabled' }
  ]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Employee');
  const [userSearch, setUserSearch] = useState('');
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);

  // 2. Roles & Permissions State
  const [selectedRole, setSelectedRole] = useState('Super Admin');
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, Record<string, boolean>>>({
    'Super Admin': { 'Dashboard.Read': true, 'Employees.Create': true, 'Employees.Read': true, 'Employees.Update': true, 'Employees.Delete': true, 'Payroll.Manage': true, 'Settings.Configure': true, 'API.Access': true },
    'HR Admin': { 'Dashboard.Read': true, 'Employees.Create': true, 'Employees.Read': true, 'Employees.Update': true, 'Employees.Delete': false, 'Payroll.Manage': false, 'Settings.Configure': false, 'API.Access': false },
    'Employee': { 'Dashboard.Read': true, 'Employees.Create': false, 'Employees.Read': false, 'Employees.Update': false, 'Employees.Delete': false, 'Payroll.Manage': false, 'Settings.Configure': false, 'API.Access': false }
  });

  // 3. Approval Workflows State
  const [workflows, setWorkflows] = useState<any[]>([
    { id: 'wf1', name: 'Leave Auto-Approval', module: 'Leave', condition: 'Days <= 3', type: 'Sequential', levels: ['Manager'], sla: '48h' },
    { id: 'wf2', name: 'High Value Expenses', module: 'Expenses', condition: 'Amount > 50,000', type: 'Parallel', levels: ['Manager', 'Finance VP'], sla: '24h' }
  ]);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', module: 'Leave', condition: '', type: 'Sequential', levels: '', sla: '48h' });

  // 4. Notifications Hub
  const [notificationsConfig, setNotificationsConfig] = useState({
    email: true, sms: false, push: true, whatsapp: false, slack: true
  });
  const [activeTemplate, setActiveTemplate] = useState('leave_approved');
  const [templateContent, setTemplateContent] = useState('Dear {employee_name}, your leave request for {leave_days} days has been approved.');

  // 5. Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModule, setAuditModule] = useState('All');

  // 6. Security state
  const [mfaEnforcement, setMfaEnforcement] = useState('Admins Only');
  const [lockoutThreshold, setLockoutThreshold] = useState(5);
  const [ipWhitelist, setIpWhitelist] = useState<string[]>(['192.168.1.1', '10.0.0.12']);
  const [newIp, setNewIp] = useState('');

  // 7. Active Sessions
  const [sessions, setSessions] = useState<any[]>([
    { id: 's1', user: 'admin@worksphere.com', device: 'Chrome on macOS', ip: '103.45.21.11', location: 'India, Bangalore', lastActive: 'Just Now', isCurrent: true },
    { id: 's2', user: 'admin@worksphere.com', device: 'Safari on iPad', ip: '103.45.21.11', location: 'India, Bangalore', lastActive: '12 mins ago', isCurrent: false },
    { id: 's3', user: 'aria.b@worksphere.com', device: 'Firefox on Windows', ip: '122.164.12.87', location: 'India, Chennai', lastActive: '2 mins ago', isCurrent: false }
  ]);

  // 8. Backups
  const [backups, setBackups] = useState<any[]>([
    { id: 'b1', filename: 'worksphere_prod_2026-07-17.sql.gz', size: '142 MB', created: '2026-07-17 01:00', status: 'completed' },
    { id: 'b2', filename: 'worksphere_prod_2026-07-16.sql.gz', size: '141 MB', created: '2026-07-16 01:00', status: 'completed' }
  ]);
  const [backupSchedule, setBackupSchedule] = useState('daily');

  // 9. API Keys
  const [apiKeys, setApiKeys] = useState<any[]>([
    { id: 'k1', name: 'QuickBooks Sync Service', scopes: 'finance:read, finance:write', created: '2026-05-10', key: 'ws_live_••••••••••••34ef' },
    { id: 'k2', name: 'Slack Notifications Hub', scopes: 'notifications:write', created: '2026-06-01', key: 'ws_live_••••••••••••9c82' }
  ]);

  // Fetch real audit logs if available
  useEffect(() => {
    async function loadAudit() {
      try {
        const data = await auditService.getLogs({ page: 1, limit: 20 });
        if (data && data.logs) {
          setAuditLogs(data.logs);
        }
      } catch {
        // use mock
        setAuditLogs([
          { id: 'a1', action: 'SETTINGS_UPDATE', email: 'admin@worksphere.com', details: 'Updated general organization rules config', ipAddress: '127.0.0.1', createdAt: new Date().toISOString() },
          { id: 'a2', action: 'USER_INVITED', email: 'admin@worksphere.com', details: 'Invited aria.b@worksphere.com to tenant workspace', ipAddress: '127.0.0.1', createdAt: new Date().toISOString() }
        ]);
      }
    }
    loadAudit();
  }, []);

  // 1. User Handlers
  const handleUserStatus = (userId: string, newStatus: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    toast.success(`User status updated to ${newStatus}`);
  };

  const handleResetPassword = (email: string) => {
    toast.success(`Password reset link dispatched to ${email}`);
  };

  const handleToggleMfa = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, mfa: u.mfa === 'Enabled' ? 'Disabled' : 'Enabled' } : u));
    toast.success(`MFA policy toggled for user`);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const newUser = {
      id: String(users.length + 1),
      name: inviteEmail.split('@')[0],
      empId: `EMP-0000${users.length + 1}`,
      email: inviteEmail,
      phone: '+91 98765 00000',
      dept: 'Engineering',
      designation: 'Staff Associate',
      branch: 'Bangalore HQ',
      role: inviteRole,
      manager: 'Marcus Vance',
      status: 'active',
      lastLogin: 'Never',
      device: '—',
      mfa: 'Disabled'
    };
    setUsers([...users, newUser]);
    setInviteEmail('');
    setShowInviteModal(false);
    toast.success(`Invitation dispatched to ${inviteEmail}`);
  };

  // Bulk selections
  const handleSelectAllUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setBulkSelection(users.map(u => u.id));
    } else {
      setBulkSelection([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setBulkSelection([...bulkSelection, userId]);
    } else {
      setBulkSelection(bulkSelection.filter(id => id !== userId));
    }
  };

  // 2. Roles & Permissions Handlers
  const handleTogglePermission = (role: string, perm: string) => {
    setPermissionsMatrix(prev => {
      const rolePermissions = prev[role] || {};
      return {
        ...prev,
        [role]: {
          ...rolePermissions,
          [perm]: !rolePermissions[perm]
        }
      };
    });
  };

  // 3. Approval Workflow Handlers
  const handleAddWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflow.name) return;
    const levelsArr = newWorkflow.levels.split(',').map(s => s.trim());
    setWorkflows([...workflows, { ...newWorkflow, id: `wf${Date.now()}`, levels: levelsArr }]);
    setNewWorkflow({ name: '', module: 'Leave', condition: '', type: 'Sequential', levels: '', sla: '48h' });
    toast.success('Approval routing workflow registered');
  };

  // 4. Session Revocation
  const handleTerminateSession = (sessId: string) => {
    setSessions(sessions.filter(s => s.id !== sessId));
    toast.success('User session terminated successfully');
  };

  const handleTerminateAllSessions = () => {
    setSessions(sessions.filter(s => s.isCurrent));
    toast.success('All other user sessions revoked');
  };

  // 5. Backup Handlers
  const handleTriggerBackup = () => {
    const newB = {
      id: `b${Date.now()}`,
      filename: `worksphere_prod_${new Date().toISOString().substring(0, 10)}.sql.gz`,
      size: '143 MB',
      created: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed'
    };
    setBackups([newB, ...backups]);
    toast.success('Production database backup snapshot initiated');
  };

  // 6. Whitelist IP
  const handleAddIp = () => {
    if (!newIp) return;
    setIpWhitelist([...ipWhitelist, newIp]);
    setNewIp('');
    toast.success('IP Address successfully whitelisted');
  };

  const TABS: TabItem[] = [
    { id: 'users', label: 'User Directory', icon: <Users size={16} /> },
    { id: 'permissions', label: 'Roles & RBAC', icon: <Shield size={16} /> },
    { id: 'company-settings', label: 'Company Settings', icon: <Building size={16} /> },
    { id: 'approvals', label: 'Approval Routes', icon: <CheckSquare size={16} /> },
    { id: 'notifications', label: 'Notification Hub', icon: <Bell size={16} /> },
    { id: 'audit-logs', label: 'Audit Explorer', icon: <History size={16} /> },
    { id: 'settings', label: 'System Settings', icon: <Settings size={16} /> },
    { id: 'integrations', label: 'API Connectors', icon: <Share2 size={16} /> },
    { id: 'security', label: 'Security Center', icon: <Lock size={16} /> },
    { id: 'sessions', label: 'Active Sessions', icon: <Server size={16} /> },
    { id: 'backup', label: 'Backup & Restore', icon: <Database size={16} /> },
    { id: 'api-keys', label: 'Developer API Keys', icon: <Key size={16} /> }
  ];

  return (
    <PageContainer
      title="Enterprise Administration Center"
      subtitle="Configure legal subsidiaries, user directories, role permissions (RBAC), multi-stage approval policies, system integrations, and compliance tools."
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Side Navigation Menu */}
        <div className="lg:col-span-1 space-y-2">
          <Card className="p-2 border border-ag-border bg-ag-surface">
            <span className="text-[10px] text-ag-ink-3 font-extrabold uppercase tracking-wider px-3 py-2 block">System Administration</span>
            <div className="flex flex-col gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-ag-primary text-white shadow-md'
                      : 'text-ag-ink-2 hover:bg-ag-surface-2 hover:text-ag-ink'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side Content Panel */}
        <div className="lg:col-span-4 space-y-6">

          {/* 1. USER DIRECTORY TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2 max-w-sm w-full relative">
                  <Search className="absolute left-3 top-3 text-ag-ink-3" size={16} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 h-10 bg-ag-surface border border-ag-border rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowInviteModal(true)} icon={<Plus size={16} />}>Invite New User</Button>
                  <Button variant="secondary" onClick={() => toast.success('CSV export completed')} icon={<Download size={16} />}>Export Users</Button>
                </div>
              </div>

              {/* Bulk operations bar */}
              {bulkSelection.length > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-ag-primary-light border border-ag-primary/20 rounded-xl">
                  <span className="text-xs font-bold text-ag-primary">{bulkSelection.length} users selected</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" onClick={() => { setUsers(users.filter(u => !bulkSelection.includes(u.id))); setBulkSelection([]); toast.success('Selected users deactivated'); }}>Deactivate Selected</Button>
                    <Button size="sm" variant="ghost" onClick={() => setBulkSelection([])}>Clear Selection</Button>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader title="Platform User Accounts" subtitle="Manage account lockouts, passwords, and security enforcement parameters." />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                        <th className="p-4 w-10">
                          <input type="checkbox" onChange={handleSelectAllUsers} checked={bulkSelection.length === users.length} />
                        </th>
                        <th className="p-4">User Details</th>
                        <th className="p-4">Org details</th>
                        <th className="p-4">RBAC Role</th>
                        <th className="p-4">Security</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                        <tr key={u.id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                          <td className="p-4">
                            <input type="checkbox" checked={bulkSelection.includes(u.id)} onChange={(e) => handleSelectUser(u.id, e.target.checked)} />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-ag-primary-light flex items-center justify-center font-bold text-ag-primary">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-ag-ink block cursor-pointer hover:underline" onClick={() => setSelectedUser(u)}>{u.name}</span>
                                <span className="text-[10px] text-ag-ink-3 block">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold block">{u.dept} ({u.designation})</span>
                            <span className="text-[10px] text-ag-ink-3 block">{u.branch}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-ag-primary">{u.role}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${u.mfa === 'Enabled' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              MFA: {u.mfa}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              u.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                              u.status === 'suspended' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => setSelectedUser(u)}>Profile</Button>
                              <select
                                className="h-8 bg-ag-surface border border-ag-border rounded-lg text-xs font-semibold px-2 focus:outline-none"
                                onChange={(e) => {
                                  const act = e.target.value;
                                  if (act === 'suspend') handleUserStatus(u.id, 'suspended');
                                  else if (act === 'activate') handleUserStatus(u.id, 'active');
                                  else if (act === 'deactivate') handleUserStatus(u.id, 'deactivated');
                                  else if (act === 'reset_pwd') handleResetPassword(u.email);
                                  else if (act === 'toggle_mfa') handleToggleMfa(u.id);
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>Modify</option>
                                <option value="activate">Activate</option>
                                <option value="suspend">Suspend</option>
                                <option value="deactivate">Deactivate</option>
                                <option value="reset_pwd">Reset Password</option>
                                <option value="toggle_mfa">Toggle MFA</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 2. ROLES & RBAC TAB */}
          {activeTab === 'permissions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Left Role List */}
                <div className="md:col-span-1 space-y-2">
                  <Card className="p-2 border border-ag-border bg-ag-surface">
                    <span className="text-[10px] text-ag-ink-3 font-extrabold uppercase tracking-wider px-3 py-2 block">Available Roles</span>
                    {Object.keys(permissionsMatrix).map(r => (
                      <button
                        key={r}
                        onClick={() => setSelectedRole(r)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                          selectedRole === r ? 'bg-ag-primary-light text-ag-primary font-bold' : 'text-ag-ink-2 hover:bg-ag-surface-2'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const newName = prompt('Enter role name:');
                        if (newName) {
                          setPermissionsMatrix({
                            ...permissionsMatrix,
                            [newName]: { 'Dashboard.Read': true }
                          });
                          setSelectedRole(newName);
                          toast.success('Custom Role created successfully');
                        }
                      }}
                      className="w-full text-left px-3 py-2 mt-2 rounded-lg text-xs font-bold text-ag-primary border border-dashed border-ag-primary/40 hover:bg-ag-primary/5 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} /> Add Role
                    </button>
                  </Card>
                </div>

                {/* Right Permission Grid */}
                <div className="md:col-span-3">
                  <Card>
                    <CardHeader title={`Permission Scopes: ${selectedRole}`} subtitle="Modify fine-grained read/write capabilities across APIs and modules." />
                    <div className="p-6 space-y-4">
                      {['Dashboard.Read', 'Employees.Create', 'Employees.Read', 'Employees.Update', 'Employees.Delete', 'Payroll.Manage', 'Settings.Configure', 'API.Access'].map(perm => (
                        <div key={perm} className="flex justify-between items-center py-2.5 border-b border-ag-border last:border-b-0">
                          <div>
                            <span className="font-semibold text-xs text-ag-ink block">{perm.split('.')[0]}</span>
                            <span className="text-[10px] text-ag-ink-3 block">Operation: {perm.split('.')[1]}</span>
                          </div>
                          <button
                            onClick={() => handleTogglePermission(selectedRole, perm)}
                            className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                              permissionsMatrix[selectedRole]?.[perm] ? 'bg-ag-primary' : 'bg-ag-border-strong'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              permissionsMatrix[selectedRole]?.[perm] ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 3. COMPANY SETTINGS TAB */}
          {activeTab === 'company-settings' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="p-6">
                <CardHeader title="Corporate Entity Profile" subtitle="Verify registered credentials, address, and localized rules configurations." />
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6" onSubmit={(e) => { e.preventDefault(); toast.success('Company settings updated'); }}>
                  <Input label="Company Name" defaultValue="WorkSphere Technologies" />
                  <Input label="Legal Registration Name" defaultValue="WorkSphere Technologies Private Limited" />
                  <Input label="Company Registration Number (CIN)" defaultValue="U72200KA2026PTC099120" />
                  <Input label="GST Number / Tax ID" defaultValue="29AAAAA0000A1Z5" />
                  <Input label="Currency" defaultValue="INR (₹)" />
                  <Input label="Language & Locale" defaultValue="English (India)" />
                  <Input label="Primary Support Email" defaultValue="ops@worksphere.co" />
                  <Input label="HQ Phone Line" defaultValue="+91 80 4390 0000" />
                  <div className="md:col-span-2 flex justify-end gap-2 pt-4">
                    <Button type="submit">Save Profile Settings</Button>
                  </div>
                </form>
              </Card>

              {/* Subsidiary tree chart structure */}
              <Card className="p-6">
                <CardHeader title="Organizational Hierarchy View" subtitle="Dynamic structural chart of company subsidiaries, offices, and divisions." />
                <div className="mt-6 border border-ag-border rounded-xl p-6 bg-ag-surface-2">
                  <div className="flex flex-col items-center gap-4">
                    <div className="px-4 py-2 bg-ag-primary text-white rounded-lg text-xs font-bold shadow">
                      WorkSphere Technologies (HQ)
                    </div>
                    <div className="h-4 w-[2px] bg-ag-border-strong" />
                    <div className="grid grid-cols-2 gap-12 relative w-full max-w-md">
                      <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-ag-border-strong" />
                      <div className="flex flex-col items-center gap-2">
                        <div className="px-3 py-1.5 bg-ag-primary-light text-ag-primary rounded-lg text-xs font-bold border border-ag-primary/20">
                          SF Operations Office
                        </div>
                        <div className="text-[10px] text-ag-ink-3 font-semibold">Subsidiary (USA)</div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="px-3 py-1.5 bg-ag-primary-light text-ag-primary rounded-lg text-xs font-bold border border-ag-primary/20">
                          London Sales Hub
                        </div>
                        <div className="text-[10px] text-ag-ink-3 font-semibold">Branch Office (UK)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* 4. APPROVAL CENTER TAB */}
          {activeTab === 'approvals' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="p-6">
                <CardHeader title="Register Custom Approval Routing Policy" subtitle="Construct sequential or parallel multi-stage triggers." />
                <form onSubmit={handleAddWorkflow} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Input
                    label="Workflow Rule Name"
                    value={newWorkflow.name}
                    onChange={e => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    placeholder="e.g. Finance Claims Routing"
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="ag-label">Base Module</label>
                    <select
                      className="ag-input"
                      value={newWorkflow.module}
                      onChange={e => setNewWorkflow({ ...newWorkflow, module: e.target.value })}
                    >
                      <option>Leave</option>
                      <option>Expenses</option>
                      <option>Purchase Orders</option>
                      <option>Payroll</option>
                    </select>
                  </div>
                  <Input
                    label="Trigger Condition Rule"
                    value={newWorkflow.condition}
                    onChange={e => setNewWorkflow({ ...newWorkflow, condition: e.target.value })}
                    placeholder="e.g. Amount > 20000"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="ag-label">Evaluation Engine</label>
                    <select
                      className="ag-input"
                      value={newWorkflow.type}
                      onChange={e => setNewWorkflow({ ...newWorkflow, type: e.target.value })}
                    >
                      <option>Sequential</option>
                      <option>Parallel</option>
                    </select>
                  </div>
                  <Input
                    label="Approver Levels (Comma separated)"
                    value={newWorkflow.levels}
                    onChange={e => setNewWorkflow({ ...newWorkflow, levels: e.target.value })}
                    placeholder="e.g. Reporting Manager, Finance Director"
                    required
                  />
                  <Input
                    label="Escalation SLA Hours"
                    value={newWorkflow.sla}
                    onChange={e => setNewWorkflow({ ...newWorkflow, sla: e.target.value })}
                    placeholder="e.g. 48h"
                  />
                  <div className="md:col-span-2 flex justify-end mt-2">
                    <Button type="submit">Deploy Routing Rule</Button>
                  </div>
                </form>
              </Card>

              <Card>
                <CardHeader title="Configured Routing Procedures" subtitle="List of live active approval workflows evaluating records dispatches." />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                        <th className="p-4">Rule Name</th>
                        <th className="p-4">Module</th>
                        <th className="p-4">Evaluation Condition</th>
                        <th className="p-4">Approvers Ladder</th>
                        <th className="p-4">SLA</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workflows.map(wf => (
                        <tr key={wf.id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                          <td className="p-4 font-bold text-ag-ink">{wf.name}</td>
                          <td className="p-4 font-mono font-bold text-ag-primary">{wf.module}</td>
                          <td className="p-4 font-mono">{wf.condition || 'Always True'}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              {Array.isArray(wf.levels) ? wf.levels.map((l: string, idx: number) => (
                                <React.Fragment key={idx}>
                                  <span className="px-2 py-0.5 bg-ag-surface-3 rounded text-[10px] font-semibold border border-ag-border">{l}</span>
                                  {idx < wf.levels.length - 1 && <span className="text-ag-ink-3">→</span>}
                                </React.Fragment>
                              )) : <span className="px-2 py-0.5 bg-ag-surface-3 rounded text-[10px] font-semibold border border-ag-border">{wf.levels}</span>}
                            </div>
                          </td>
                          <td className="p-4 font-mono">{wf.sla}</td>
                          <td className="p-4">
                            <button
                              onClick={() => { setWorkflows(workflows.filter(w => w.id !== wf.id)); toast.success('Workflow rule removed'); }}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 5. NOTIFICATION HUB TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Channel enable toggles */}
                <Card className="p-6">
                  <CardHeader title="Outbound Channels" subtitle="Turn channels on/off globally." />
                  <div className="space-y-4 mt-6">
                    {Object.entries(notificationsConfig).map(([ch, val]) => (
                      <div key={ch} className="flex justify-between items-center py-2 border-b border-ag-border-light last:border-0">
                        <span className="text-xs font-bold text-ag-ink uppercase tracking-wider">{ch} dispatch</span>
                        <button
                          onClick={() => setNotificationsConfig({ ...notificationsConfig, [ch]: !val })}
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${val ? 'bg-ag-primary' : 'bg-ag-border-strong'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${val ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Templates modifier */}
                <Card className="p-6 md:col-span-2">
                  <CardHeader title="System Dispatch Templates" subtitle="Configure variable maps and localization copies." />
                  <div className="space-y-4 mt-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-ag-ink-2">Select Template</label>
                      <select
                        className="ag-input"
                        value={activeTemplate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActiveTemplate(val);
                          if (val === 'leave_approved') setTemplateContent('Dear {employee_name}, your leave request for {leave_days} days has been approved.');
                          else if (val === 'payroll_generated') setTemplateContent('Hello {employee_name}, your payslip for {month} has been published and is ready for download.');
                          else setTemplateContent('Warning: A login from new device/IP address was detected on your account at {timestamp}.');
                        }}
                      >
                        <option value="leave_approved">Leave Request Approved</option>
                        <option value="payroll_generated">Payslip Generated</option>
                        <option value="security_alert">Critical Security Warning</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-ag-ink-2">Template Content</label>
                      <textarea
                        className="w-full min-h-[100px] p-3 text-xs bg-ag-surface border border-ag-border rounded-lg text-ag-ink focus:outline-none font-mono"
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                      />
                      <span className="text-[10px] text-ag-ink-3 font-semibold mt-1">Available variables: {`{employee_name}`}, {`{leave_days}`}, {`{month}`}, {`{timestamp}`}</span>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={() => toast.success('Template content updated')}>Save Template</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 6. SYSTEM AUDIT LOGS TAB */}
          {activeTab === 'audit-logs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex gap-2 max-w-sm w-full relative">
                  <Search className="absolute left-3 top-3 text-ag-ink-3" size={16} />
                  <input
                    type="text"
                    placeholder="Search logs by actor..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-10 h-10 bg-ag-surface border border-ag-border rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <select className="h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-xs font-semibold focus:outline-none" value={auditModule} onChange={e => setAuditModule(e.target.value)}>
                  <option>All Modules</option>
                  <option>SETTINGS</option>
                  <option>USER_AUTH</option>
                  <option>EMPLOYEE</option>
                  <option>PAYROLL</option>
                </select>
                <Button variant="secondary" onClick={() => toast.success('JSON audit dump generated')} icon={<Download size={16} />}>Export Logs</Button>
              </div>

              <Card>
                <CardHeader title="Immutable Platform Log Explorer" subtitle="Secure system tracking records all database updates, credentials changes, and integration hooks." />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                        <th className="p-4">Action</th>
                        <th className="p-4">Actor Email</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">Source IP</th>
                        <th className="p-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.filter(log => log.email.toLowerCase().includes(auditSearch.toLowerCase())).map((log, idx) => (
                        <tr key={log.id || idx} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-ag-primary">{log.action}</td>
                          <td className="p-4 font-semibold">{log.email}</td>
                          <td className="p-4 text-ag-ink-2">{log.details}</td>
                          <td className="p-4 font-mono">{log.ipAddress || '127.0.0.1'}</td>
                          <td className="p-4 text-ag-ink-3">{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 7. SYSTEM SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* General config */}
                <Card className="p-6">
                  <CardHeader title="Global Platform Attributes" subtitle="Configure platform runtime tags." />
                  <form onSubmit={(e) => { e.preventDefault(); toast.success('Global variables saved'); }} className="space-y-4 mt-6">
                    <Input label="ERP System Custom Name" defaultValue="WorkSphere ERP Suite" />
                    <Input label="Active Version" defaultValue="v1.4.2" disabled />
                    <div className="flex items-center justify-between p-4 rounded-xl bg-ag-surface-2 border border-ag-border">
                      <div>
                        <p className="font-semibold text-ag-ink text-sm">System Maintenance Mode</p>
                        <p className="text-[10px] text-ag-ink-3 mt-0.5">Locks non-admin logins for DB migrations</p>
                      </div>
                      <button type="button" className="w-10 h-5 bg-ag-border-strong rounded-full p-0.5">
                        <div className="w-4 h-4 bg-white rounded-full translate-x-0" />
                      </button>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit">Save General System Settings</Button>
                    </div>
                  </form>
                </Card>

                {/* Valkey/Redis cache & Queue monitor */}
                <Card className="p-6">
                  <CardHeader title="Cache Engine & Queues Monitor" subtitle="Verify active key values memory allocation." />
                  <div className="space-y-4 mt-6 text-xs font-semibold">
                    <div className="flex justify-between border-b border-ag-border pb-2.5">
                      <span className="text-ag-ink-3">Valkey Cache Port</span>
                      <span className="text-ag-ink">6379 (Active)</span>
                    </div>
                    <div className="flex justify-between border-b border-ag-border pb-2.5">
                      <span className="text-ag-ink-3">Cache Store Health</span>
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} /> Normal (Local fallback ready)
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-ag-border pb-2.5">
                      <span className="text-ag-ink-3">Celery Tasks Queue</span>
                      <span className="text-ag-primary">4 active background workers</span>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button variant="secondary" className="flex-1" size="sm" onClick={() => toast.success('Valkey cache stores flushed')}>Flush Cache Stores</Button>
                      <Button variant="secondary" className="flex-1" size="sm" onClick={() => toast.success('Celery workers pinged successfully')}>Ping Background Workers</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 8. API CONNECTORS (INTEGRATIONS) TAB */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Stripe Payments', category: 'Payment gateway', status: 'Connected', desc: 'Process customer accounting & billing invoices.', keys: ['Publishable Key', 'Secret Key'] },
                  { name: 'QuickBooks Ledger', category: 'Financial accounting', status: 'Disconnected', desc: 'Sync chart of accounts journal entries.', keys: ['OAuth ID', 'Client Secret'] },
                  { name: 'SendGrid Emailer', category: 'SMTP Deliveries', status: 'Connected', desc: 'Dispatches legal documents & notifications.', keys: ['API Key', 'Sender Verified'] },
                  { name: 'Slack Messaging', category: 'Communications', status: 'Connected', desc: 'Publish instant approval alerts notifications.', keys: ['Webhook URL'] },
                  { name: 'Amazon Web Services S3', category: 'Cloud Storage', status: 'Connected', desc: 'Host employee documents, payroll, and logs.', keys: ['Bucket Name', 'Access Key', 'Secret Token'] }
                ].map((integ, idx) => (
                  <Card key={idx} className="p-5 border border-ag-border flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-ag-primary font-bold uppercase tracking-wider">{integ.category}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${integ.status === 'Connected' ? 'bg-green-50 text-green-700' : 'bg-ag-surface-3 text-ag-ink-3'}`}>
                          {integ.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-ag-ink mt-1.5">{integ.name}</h4>
                      <p className="text-[11px] text-ag-ink-3 mt-1 font-medium">{integ.desc}</p>
                    </div>
                    <div className="pt-4 flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => toast.success(`Configuration opened for ${integ.name}`)}>Configure</Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.info('Integration disabled')}>Disable</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 9. SECURITY CENTER TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* MFA & Lockout policies */}
                <Card className="p-6">
                  <CardHeader title="Security Controls & MFA Lock" subtitle="Configure system security thresholds." />
                  <div className="space-y-4 mt-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="ag-label">Force MFA Enforcement Level</label>
                      <select className="ag-input" value={mfaEnforcement} onChange={e => setMfaEnforcement(e.target.value)}>
                        <option>None (Optional)</option>
                        <option>Admins Only</option>
                        <option>All System Users</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="ag-label">Max Failed Attempts (Lockout)</label>
                      <input
                        type="number"
                        className="ag-input"
                        value={lockoutThreshold}
                        onChange={e => setLockoutThreshold(parseInt(e.target.value || '5'))}
                      />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button onClick={() => toast.success('Security enforcement rules saved')}>Save Enforcement Rules</Button>
                    </div>
                  </div>
                </Card>

                {/* IP Whitelisting */}
                <Card className="p-6">
                  <CardHeader title="IP Address Access Whitelist" subtitle="Restrict admin console requests to trusted subnets." />
                  <div className="space-y-4 mt-6">
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. 192.168.1.100"
                        value={newIp}
                        onChange={e => setNewIp(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleAddIp} icon={<Plus size={16} />} size="md">Add IP</Button>
                    </div>
                    <div className="rounded-xl border border-ag-border divide-y divide-ag-border overflow-hidden">
                      {ipWhitelist.map((ip, idx) => (
                        <div key={idx} className="flex justify-between items-center px-4 py-3 bg-white">
                          <span className="font-mono text-xs text-ag-ink font-semibold">{ip}</span>
                          <button
                            onClick={() => { setIpWhitelist(ipWhitelist.filter(i => i !== ip)); toast.success('IP Address removed'); }}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 10. ACTIVE SESSIONS TAB */}
          {activeTab === 'sessions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xs text-ag-ink uppercase tracking-wider">Session Management Portal</h3>
                  <span className="text-[11px] text-ag-ink-3">Terminate active devices/browsers connected to your companies database.</span>
                </div>
                <Button variant="danger" size="sm" onClick={handleTerminateAllSessions}>Terminate All Other Sessions</Button>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                        <th className="p-4">User Account</th>
                        <th className="p-4">Device & OS</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Last Activity</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(s => (
                        <tr key={s.id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                          <td className="p-4 font-semibold text-ag-ink">
                            {s.user}
                            {s.isCurrent && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] bg-ag-primary-light text-ag-primary font-extrabold uppercase border border-ag-primary/20">Current</span>}
                          </td>
                          <td className="p-4">{s.device}</td>
                          <td className="p-4 font-mono">{s.ip}</td>
                          <td className="p-4">{s.location}</td>
                          <td className="p-4 font-medium text-ag-ink-3">{s.lastActive}</td>
                          <td className="p-4">
                            {!s.isCurrent && (
                              <Button size="sm" variant="ghost" onClick={() => handleTerminateSession(s.id)}>Revoke</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 11. BACKUP & RESTORE TAB */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Config backup schedule */}
                <Card className="p-6">
                  <CardHeader title="Backup Scheduling" subtitle="Configure automated cron tasks." />
                  <div className="space-y-4 mt-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="ag-label">Snapshot Frequency</label>
                      <select className="ag-input" value={backupSchedule} onChange={e => setBackupSchedule(e.target.value)}>
                        <option value="hourly">Hourly Snapshots</option>
                        <option value="daily">Daily Cron Task (1:00 AM)</option>
                        <option value="weekly">Weekly Cron Task (Sunday)</option>
                      </select>
                    </div>
                    <div className="pt-2">
                      <Button onClick={handleTriggerBackup} className="w-full" icon={<Cloud size={16} />}>Trigger Manual Backup</Button>
                    </div>
                  </div>
                </Card>

                {/* Backups List */}
                <Card className="p-6 md:col-span-2">
                  <CardHeader title="Existing Storage Backups" subtitle="Secure snapshots of the PostgreSQL schemas." />
                  <div className="rounded-xl border border-ag-border divide-y divide-ag-border overflow-hidden mt-6">
                    {backups.map(b => (
                      <div key={b.id} className="flex justify-between items-center px-4 py-3 bg-white">
                        <div>
                          <span className="font-mono text-xs text-ag-ink font-bold block">{b.filename}</span>
                          <span className="text-[10px] text-ag-ink-3">Size: {b.size} | Created: {b.created}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => toast.success('Database restore completed successfully')}>Restore</Button>
                          <Button variant="ghost" size="sm" onClick={() => toast.success('Backup file downloading')} icon={<Download size={14} />} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 12. DEVELOPER API KEYS TAB */}
          {activeTab === 'api-keys' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xs text-ag-ink uppercase tracking-wider">Developer Client Credentials</h3>
                  <span className="text-[11px] text-ag-ink-3">Register external secure OAuth access keys with custom permissions scoping.</span>
                </div>
                <Button onClick={() => {
                  const newName = prompt('Enter API key description name:');
                  if (newName) {
                    const newK = {
                      id: `k${Date.now()}`,
                      name: newName,
                      scopes: 'finance:read, employee:read',
                      created: new Date().toISOString().substring(0, 10),
                      key: `ws_live_••••••••••••${Math.random().toString(16).substring(2, 6)}`
                    };
                    setApiKeys([...apiKeys, newK]);
                    toast.success('Access Token generated successfully');
                  }
                }} icon={<Plus size={16} />}>Generate API Token</Button>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                        <th className="p-4">Key Descriptor</th>
                        <th className="p-4">Client Access Token</th>
                        <th className="p-4">Scopes Granted</th>
                        <th className="p-4">Created Date</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.map(k => (
                        <tr key={k.id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                          <td className="p-4 font-bold text-ag-ink">{k.name}</td>
                          <td className="p-4 font-mono font-bold text-ag-primary">{k.key}</td>
                          <td className="p-4 font-mono">{k.scopes}</td>
                          <td className="p-4 text-ag-ink-3">{k.created}</td>
                          <td className="p-4">
                            <button
                              onClick={() => { setApiKeys(apiKeys.filter(key => key.id !== k.id)); toast.success('API Key revoked'); }}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* ── DETAIL MODAL FOR USER PROFILE ── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-ag-border shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-ag-border bg-ag-surface-2 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-ag-primary text-white font-black text-lg flex items-center justify-center">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-ag-ink">{selectedUser.name}</h3>
                  <span className="text-xs font-mono font-bold text-ag-primary block mt-0.5">{selectedUser.role}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-ag-ink-3 hover:text-ag-ink">
                <X size={20} />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-ag-ink-2 custom-scrollbar">
              
              {/* Personal details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-extrabold text-[10px] text-ag-ink-3 uppercase block mb-1">Employee ID</span>
                  <span className="font-bold text-ag-ink">{selectedUser.empId}</span>
                </div>
                <div>
                  <span className="font-extrabold text-[10px] text-ag-ink-3 uppercase block mb-1">Email Address</span>
                  <span className="font-bold text-ag-ink">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="font-extrabold text-[10px] text-ag-ink-3 uppercase block mb-1">Phone Number</span>
                  <span className="font-bold text-ag-ink">{selectedUser.phone}</span>
                </div>
                <div>
                  <span className="font-extrabold text-[10px] text-ag-ink-3 uppercase block mb-1">Office Location</span>
                  <span className="font-bold text-ag-ink">{selectedUser.branch}</span>
                </div>
                <div>
                  <span className="font-extrabold text-[10px] text-ag-ink-3 uppercase block mb-1">Department Scope</span>
                  <span className="font-bold text-ag-ink">{selectedUser.dept}</span>
                </div>
                <div>
                  <span className="font-extrabold text-[10px] text-ag-ink-3 uppercase block mb-1">Reporting Manager</span>
                  <span className="font-bold text-ag-ink">{selectedUser.manager}</span>
                </div>
              </div>

              <hr className="border-t border-ag-border" />

              {/* Mock employment tabs */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-[10px] text-ag-ink uppercase tracking-wider">Assigned Inventory Assets</h4>
                <div className="rounded-lg border border-ag-border divide-y divide-ag-border overflow-hidden">
                  <div className="flex justify-between px-3 py-2 bg-ag-surface-2 text-ag-ink-3 font-semibold">
                    <span>Asset Item</span>
                    <span>Serial Code</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 bg-white">
                    <span>MacBook Pro 16" (M3 Max)</span>
                    <span className="font-mono">C02FX901Q05D</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 bg-white">
                    <span>YubiKey 5 NFC Hardware Lock</span>
                    <span className="font-mono">YUBI-8742-0921</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-extrabold text-[10px] text-ag-ink uppercase tracking-wider">Active Device Logs</h4>
                <div className="space-y-2 text-[11px] font-medium text-ag-ink-3">
                  <div className="flex justify-between">
                    <span>Browser Agent</span>
                    <span className="text-ag-ink">{selectedUser.device}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Sign-In Timestamp</span>
                    <span className="text-ag-ink">{selectedUser.lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-ag-border bg-ag-surface-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>Close Profile</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── INVITE USER MODAL ── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-ag-border shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-ag-border bg-ag-surface-2 flex justify-between items-center">
              <h3 className="text-sm font-black text-ag-ink">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-ag-ink-3 hover:text-ag-ink">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
              <Input
                label="Work Email Address"
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="e.g. employee@worksphere.co"
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="ag-label">Security Role Assignment</label>
                <select className="ag-input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="Employee">Employee</option>
                  <option value="HR Admin">HR Admin</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                <Button type="submit">Send Invitation</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageContainer>
  );
}
