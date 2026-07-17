import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/Table/DataTable';
import { toast } from 'sonner';
import { api } from '@/services/api.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp, Users, FileText, ShoppingCart, ArrowLeftRight,
  RotateCw, Plus, Check, X, ArrowRight, Search, Download,
  Sparkles, Sliders, ChevronRight, Calendar, Phone, Mail, MapPin, Building
} from 'lucide-react';

async function crmApi(method: 'get' | 'post' | 'patch', path: string, data?: any) {
  const res = await (method === 'get'
    ? api.get(`/crm${path}`)
    : method === 'post'
      ? api.post(`/crm${path}`, data)
      : api.patch(`/crm${path}`, data));
  return res.data.data;
}

export default function CRMPage() {
  const { moduleKey } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(moduleKey || 'leads');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [dashboard, setDashboard] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Sub-navigation state for leads
  const [leadsViewMode, setLeadsViewMode] = useState<'kanban' | 'list'>('kanban');

  // Modal / Form triggers
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Form states: Lead
  const [leadCompany, setLeadCompany] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSource, setLeadSource] = useState('Direct');
  const [leadVal, setLeadVal] = useState('');
  const [leadPriority, setLeadPriority] = useState('medium');
  const [leadExpectedClose, setLeadExpectedClose] = useState('');

  // Form states: Customer
  const [custCompany, setCustCompany] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custGST, setCustGST] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Form states: Quotation
  const [quoteCustId, setQuoteCustId] = useState('');
  const [quoteValidUntil, setQuoteValidUntil] = useState('');
  const [quoteItems, setQuoteItems] = useState<any[]>([
    { productName: '', quantity: 1, unitPrice: 0 }
  ]);

  // Form states: Sales Order
  const [orderCustId, setOrderCustId] = useState('');
  const [orderShipping, setOrderShipping] = useState('');
  const [orderItems, setOrderItems] = useState<any[]>([
    { productName: '', quantity: 1, unitPrice: 0 }
  ]);

  // Form states: Follow Up Task
  const [taskLeadId, setTaskLeadId] = useState('');
  const [taskCustId, setTaskCustId] = useState('');
  const [taskType, setTaskType] = useState('call');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (moduleKey) {
      setActiveTab(moduleKey);
    }
  }, [moduleKey]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dash, lds, custs, qts, ords, tsk] = await Promise.all([
        crmApi('get', '/dashboard'),
        crmApi('get', '/leads'),
        crmApi('get', '/customers'),
        crmApi('get', '/quotations'),
        crmApi('get', '/orders'),
        crmApi('get', '/tasks'),
      ]);

      setDashboard(dash);
      setLeads(lds);
      setCustomers(custs);
      setQuotations(qts);
      setOrders(ords);
      setTasks(tsk);
    } catch {
      toast.error('Failed to load CRM logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // HTML5 Drag and drop handler
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const probMap: Record<string, number> = {
      new: 10,
      contacted: 20,
      qualified: 40,
      proposal: 60,
      negotiation: 80,
      won: 100,
      lost: 0
    };

    try {
      await crmApi('patch', `/leads/${id}/stage`, {
        stage: targetStage,
        probability: probMap[targetStage] ?? 50
      });
      toast.success(`Pipeline Stage updated to ${targetStage.toUpperCase()}`);
      fetchData();
    } catch {
      toast.error('Failed to update stage');
    }
  };

  // Submit Operations
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    await crmApi('post', '/leads', {
      company: leadCompany,
      contactPerson: leadContact,
      phone: leadPhone,
      email: leadEmail,
      leadSource,
      priority: leadPriority,
      estimatedValue: parseFloat(leadVal || '0'),
      expectedClose: leadExpectedClose || null,
      stage: 'new',
      probability: 10.0
    });
    toast.success('CRM Lead log created successfully');
    setShowLeadForm(false);
    fetchData();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    await crmApi('post', '/customers', {
      companyName: custCompany,
      gst: custGST,
      email: custEmail,
      phone: custPhone,
      address: custAddress
    });
    toast.success('Customer account registered');
    setShowCustomerForm(false);
    fetchData();
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    await crmApi('post', '/quotations', {
      customerId: quoteCustId,
      issueDate: new Date().toISOString().split('T')[0],
      validUntil: quoteValidUntil,
      discount: 0.0,
      items: quoteItems.map(item => ({
        productName: item.productName,
        quantity: parseInt(item.quantity || 1),
        unitPrice: parseFloat(item.unitPrice || 0),
        taxRate: 18.0
      }))
    });
    toast.success('CRM Quotation voucher issued');
    setShowQuoteForm(false);
    fetchData();
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    await crmApi('post', '/orders', {
      customerId: orderCustId,
      orderDate: new Date().toISOString().split('T')[0],
      shippingAddress: orderShipping,
      items: orderItems.map(item => ({
        productName: item.productName,
        quantity: parseInt(item.quantity || 1),
        unitPrice: parseFloat(item.unitPrice || 0),
        taxRate: 18.0
      }))
    });
    toast.success('Sales order allocated successfully');
    setShowOrderForm(false);
    fetchData();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await crmApi('post', '/tasks', {
      leadId: taskLeadId || null,
      customerId: taskCustId || null,
      taskType,
      dueDate: taskDueDate,
      notes: taskNotes
    });
    toast.success('CRM Task schedule logged');
    setShowTaskForm(false);
    fetchData();
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    toast.success('Report exported successfully');
  };

  // Kanban Pipeline Stages list
  const pipelineStages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

  // Filtered lists
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    return leads.filter(l => 
      l.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);

  return (
    <PageContainer
      title="Sales & Customer Relationships Workspace"
      subtitle="Track business deals, customer directories, quotation templates, and fulfillment orders."
      actions={
        <div className="flex gap-2">
          {activeTab === 'leads' && (
            <>
              <Button variant="secondary" onClick={() => setLeadsViewMode(leadsViewMode === 'kanban' ? 'list' : 'kanban')}>
                Switch to {leadsViewMode === 'kanban' ? 'List' : 'Pipeline'}
              </Button>
              <Button onClick={() => setShowLeadForm(true)} icon={<Plus size={14} />}>Add Lead</Button>
            </>
          )}
          {activeTab === 'customers' && (
            <Button onClick={() => setShowCustomerForm(true)} icon={<Plus size={14} />}>Add Customer</Button>
          )}
          {activeTab === 'quotations' && (
            <Button onClick={() => setShowQuoteForm(true)} icon={<Plus size={14} />}>New Quote</Button>
          )}
          {activeTab === 'orders' && (
            <Button onClick={() => setShowOrderForm(true)} icon={<Plus size={14} />}>Create Order</Button>
          )}
          {activeTab === 'follow-ups' && (
            <Button onClick={() => setShowTaskForm(true)} icon={<Plus size={14} />}>Schedule Activity</Button>
          )}
          <Button variant="secondary" onClick={fetchData} icon={<RotateCw size={14} />} />
        </div>
      }
    >
      {/* Dynamic Tab Switcher */}
      <div className="flex gap-1.5 p-1 bg-ag-surface-2/70 border border-ag-border rounded-xl w-fit mb-8 overflow-x-auto">
        {[
          { key: 'leads', label: 'Leads & Pipeline', icon: <TrendingUp size={14} /> },
          { key: 'customers', label: 'Customer Directory', icon: <Users size={14} /> },
          { key: 'quotations', label: 'Quotations', icon: <FileText size={14} /> },
          { key: 'orders', label: 'Sales Orders', icon: <ShoppingCart size={14} /> },
          { key: 'follow-ups', label: 'Follow Ups & Activities', icon: <ArrowLeftRight size={14} /> }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key);
              navigate(`/sales/${t.key}`);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === t.key ? 'bg-ag-surface text-ag-primary shadow-sm border border-ag-border/50' : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Sub-Tab Content: LEADS ── */}
      {activeTab === 'leads' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Total Leads</p>
                <h3 className="text-xl font-black mt-1 text-ag-ink">{dashboard?.totalLeads ?? 0}</h3>
              </div>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Pipeline Value</p>
                <h3 className="text-xl font-black mt-1 text-ag-ink">₹{(dashboard?.pipelineValue ?? 0).toLocaleString()}</h3>
              </div>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Win Rate</p>
                <h3 className="text-xl font-black mt-1 text-ag-ink">{(dashboard?.winRate ?? 0).toFixed(1)}%</h3>
              </div>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Converted Won</p>
                <h3 className="text-xl font-black mt-1 text-ag-ink">{dashboard?.wonLeadsCount ?? 0}</h3>
              </div>
            </Card>
          </div>

          {leadsViewMode === 'kanban' ? (
            /* Kanban drag-drop boards */
            <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
              {pipelineStages.map(stage => {
                const stageLeads = leads.filter(l => l.stage === stage);
                return (
                  <div
                    key={stage}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, stage)}
                    className="flex-1 min-w-[260px] max-w-[320px] bg-ag-surface-2/45 p-4 rounded-xl border border-ag-border/50 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center border-b border-ag-border pb-2 mb-1">
                      <span className="text-xs uppercase font-extrabold text-ag-ink">{stage}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ag-surface text-ag-ink-3">
                        {stageLeads.length}
                      </span>
                    </div>

                    <div className="space-y-3 min-h-[300px]">
                      {stageLeads.map(lead => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={e => handleDragStart(e, lead.id)}
                          className="bg-ag-surface p-4 border border-ag-border rounded-xl shadow-sm hover:border-ag-primary/30 transition-all cursor-grab active:cursor-grabbing space-y-3"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-ag-ink-3 block">{lead.leadSource}</span>
                            <h4 className="font-extrabold text-xs text-ag-ink leading-tight">{lead.company}</h4>
                            <p className="text-[10px] text-ag-ink-2 font-medium">{lead.contactPerson}</p>
                          </div>
                          <div className="flex justify-between items-center border-t border-ag-border/50 pt-2 text-[10px]">
                            <span className="font-mono font-bold text-ag-primary">₹{lead.estimatedValue?.toLocaleString()}</span>
                            <span className="uppercase font-bold tracking-wider text-ag-ink-3">{lead.priority}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Directory listing */
            <Card>
              <div className="p-4 border-b border-ag-border flex gap-4 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Search leads company or contact person..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="secondary" onClick={() => exportToCSV(leads, 'CRM_Leads')} icon={<Download size={14} />}>Export CSV</Button>
              </div>
              <div className="p-6">
                <DataTable
                  columns={[
                    { accessorKey: 'company', header: 'Company' },
                    { accessorKey: 'contactPerson', header: 'Contact Person' },
                    { accessorKey: 'email', header: 'Email' },
                    { accessorKey: 'estimatedValue', header: 'Value', cell: ({ row }) => <span className="font-mono">₹{row.original.estimatedValue?.toLocaleString()}</span> },
                    { accessorKey: 'stage', header: 'Stage', cell: ({ row }) => <span className="uppercase text-[10px] font-bold">{row.original.stage}</span> },
                    { accessorKey: 'priority', header: 'Priority', cell: ({ row }) => <StatusBadge status={row.original.priority} /> }
                  ]}
                  data={filteredLeads}
                  isLoading={isLoading}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Sub-Tab Content: CUSTOMERS ── */}
      {activeTab === 'customers' && (
        <Card>
          <CardHeader title="Enterprise Accounts Directory" subtitle="Review core company files, relationships scores, and CLV stats" />
          <div className="p-6">
            <DataTable
              columns={[
                { accessorKey: 'companyName', header: 'Company Name' },
                { accessorKey: 'email', header: 'Account Email' },
                { accessorKey: 'phone', header: 'Contact Phone' },
                { accessorKey: 'gst', header: 'GSTIN' },
                { accessorKey: 'relationshipScore', header: 'Relationship Score', cell: ({ row }) => <span className="font-bold text-green-600">{row.original.relationshipScore}%</span> }
              ]}
              data={customers}
              isLoading={isLoading}
            />
          </div>
        </Card>
      )}

      {/* ── Sub-Tab Content: QUOTATIONS ── */}
      {activeTab === 'quotations' && (
        <Card>
          <CardHeader title="Commercial Quotations Log" subtitle="Manage pricing quotes, validity periods, and discount policies" />
          <div className="p-6">
            <DataTable
              columns={[
                { accessorKey: 'quotationNumber', header: 'Quote Number' },
                { accessorKey: 'customerName', header: 'Customer' },
                { accessorKey: 'issueDate', header: 'Generated' },
                { accessorKey: 'validUntil', header: 'Valid Until' },
                { accessorKey: 'totalAmount', header: 'Total Value', cell: ({ row }) => <span className="font-bold">₹{row.original.totalAmount?.toLocaleString()}</span> },
                { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> }
              ]}
              data={quotations}
              isLoading={isLoading}
            />
          </div>
        </Card>
      )}

      {/* ── Sub-Tab Content: SALES ORDERS ── */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader title="Fulfillment & Order Logs" subtitle="Track inventory reservations, shipping courier updates, and billing" />
          <div className="p-6">
            <DataTable
              columns={[
                { accessorKey: 'orderNumber', header: 'SO ID' },
                { accessorKey: 'customerName', header: 'Customer' },
                { accessorKey: 'orderDate', header: 'Fulfillment Date' },
                { accessorKey: 'totalAmount', header: 'Total Value', cell: ({ row }) => <span className="font-bold">₹{row.original.totalAmount?.toLocaleString()}</span> },
                { accessorKey: 'status', header: 'Fulfillment Stage', cell: ({ row }) => <StatusBadge status={row.original.status} /> }
              ]}
              data={orders}
              isLoading={isLoading}
            />
          </div>
        </Card>
      )}

      {/* ── Sub-Tab Content: FOLLOW UPS ── */}
      {activeTab === 'follow-ups' && (
        <Card>
          <CardHeader title="CRM Tasks & Calendar agenda" subtitle="Follow ups, conference appointments, and follow up calls" />
          <div className="p-6">
            <DataTable
              columns={[
                { accessorKey: 'taskType', header: 'Activity Type', cell: ({ row }) => <span className="uppercase text-xs font-semibold">{row.original.taskType}</span> },
                { accessorKey: 'dueDate', header: 'Due Date' },
                { accessorKey: 'notes', header: 'Agenda / Description' },
                { accessorKey: 'priority', header: 'Priority', cell: ({ row }) => <StatusBadge status={row.original.priority} /> },
                { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> }
              ]}
              data={tasks}
              isLoading={isLoading}
            />
          </div>
        </Card>
      )}

      {/* ── Modal: Add Lead ── */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Log a CRM Lead</span>
              <Button variant="ghost" size="sm" onClick={() => setShowLeadForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateLead} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Input label="Company Name" value={leadCompany} onChange={e => setLeadCompany(e.target.value)} required />
                <Input label="Contact Person" value={leadContact} onChange={e => setLeadContact(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Input label="Contact Email" type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} />
                <Input label="Contact Phone" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <Select
                  label="Lead Source"
                  value={leadSource}
                  onChange={e => setLeadSource(e.target.value)}
                  options={['Direct', 'Organic Search', 'Social Media', 'Partner Referral'].map(s => ({ value: s, label: s }))}
                />
                <Select
                  label="Priority"
                  value={leadPriority}
                  onChange={e => setLeadPriority(e.target.value)}
                  options={['low', 'medium', 'high'].map(p => ({ value: p, label: p.toUpperCase() }))}
                />
                <Input label="Deal Value (INR)" type="number" value={leadVal} onChange={e => setLeadVal(e.target.value)} placeholder="0" />
              </div>
              <Input label="Expected Close Date" type="date" value={leadExpectedClose} onChange={e => setLeadExpectedClose(e.target.value)} />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Create Lead</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Add Customer Account ── */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Register Customer Account</span>
              <Button variant="ghost" size="sm" onClick={() => setShowCustomerForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-6">
              <Input label="Company Name" value={custCompany} onChange={e => setCustCompany(e.target.value)} required />
              <div className="grid grid-cols-2 gap-6">
                <Input label="Primary Email" type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} />
                <Input label="Primary Phone" value={custPhone} onChange={e => setCustPhone(e.target.value)} />
              </div>
              <Input label="GSTIN Code (Taxation)" value={custGST} onChange={e => setCustGST(e.target.value)} placeholder="e.g. 27AAAAA1111A1Z1" />
              <Input label="Billing Address" value={custAddress} onChange={e => setCustAddress(e.target.value)} />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Save Account</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Quotation ── */}
      {showQuoteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Generate Quotation Proposal</span>
              <Button variant="ghost" size="sm" onClick={() => setShowQuoteForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateQuotation} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Select Customer Account"
                  value={quoteCustId}
                  onChange={e => setQuoteCustId(e.target.value)}
                  options={[{ value: '', label: 'Choose customer account...' }, ...customers.map(c => ({ value: c.id, label: c.companyName }))] }
                  required
                />
                <Input label="Proposal Valid Until" type="date" value={quoteValidUntil} onChange={e => setQuoteValidUntil(e.target.value)} required />
              </div>

              <div className="space-y-4 border-t border-ag-border pt-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-ag-ink">Items Calculation Lines</h4>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => setQuoteItems([...quoteItems, { productName: '', quantity: 1, unitPrice: 0 }])}
                  >
                    + Add Row
                  </Button>
                </div>
                {quoteItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-end border-b border-dashed border-ag-border pb-4">
                    <div className="flex-1">
                      <Input
                        label="Product / Service"
                        value={item.productName}
                        onChange={e => {
                          const items = [...quoteItems];
                          items[idx].productName = e.target.value;
                          setQuoteItems(items);
                        }}
                        placeholder="e.g. CRM Cloud setup"
                        required
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        label="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={e => {
                          const items = [...quoteItems];
                          items[idx].quantity = parseInt(e.target.value || 1);
                          setQuoteItems(items);
                        }}
                        required
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        label="Rate (INR)"
                        type="number"
                        value={item.unitPrice}
                        onChange={e => {
                          const items = [...quoteItems];
                          items[idx].unitPrice = parseFloat(e.target.value || 0);
                          setQuoteItems(items);
                        }}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                      className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="submit" className="w-full py-3 text-sm font-bold">Generate Quote</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Sales Order ── */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Log Sales Order</span>
              <Button variant="ghost" size="sm" onClick={() => setShowOrderForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Select Customer Account"
                  value={orderCustId}
                  onChange={e => setOrderCustId(e.target.value)}
                  options={[{ value: '', label: 'Choose customer account...' }, ...customers.map(c => ({ value: c.id, label: c.companyName }))] }
                  required
                />
                <Input label="Shipping Address" value={orderShipping} onChange={e => setOrderShipping(e.target.value)} placeholder="e.g. Warehousing HQ" />
              </div>

              <div className="space-y-4 border-t border-ag-border pt-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-ag-ink">Items Log Lines</h4>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => setOrderItems([...orderItems, { productName: '', quantity: 1, unitPrice: 0 }])}
                  >
                    + Add Row
                  </Button>
                </div>
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-end border-b border-dashed border-ag-border pb-4">
                    <div className="flex-1">
                      <Input
                        label="Product / Item"
                        value={item.productName}
                        onChange={e => {
                          const items = [...orderItems];
                          items[idx].productName = e.target.value;
                          setOrderItems(items);
                        }}
                        required
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        label="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={e => {
                          const items = [...orderItems];
                          items[idx].quantity = parseInt(e.target.value || 1);
                          setOrderItems(items);
                        }}
                        required
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        label="Rate (INR)"
                        type="number"
                        value={item.unitPrice}
                        onChange={e => {
                          const items = [...orderItems];
                          items[idx].unitPrice = parseFloat(e.target.value || 0);
                          setOrderItems(items);
                        }}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                      className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="submit" className="w-full py-3 text-sm font-bold">Create Sales Order</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Schedule Activity ── */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Schedule CRM Follow-up</span>
              <Button variant="ghost" size="sm" onClick={() => setShowTaskForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Select Related Lead"
                  value={taskLeadId}
                  onChange={e => setTaskLeadId(e.target.value)}
                  options={[{ value: '', label: 'None' }, ...leads.map(l => ({ value: l.id, label: l.company }))] }
                />
                <Select
                  label="Select Related Customer"
                  value={taskCustId}
                  onChange={e => setTaskCustId(e.target.value)}
                  options={[{ value: '', label: 'None' }, ...customers.map(c => ({ value: c.id, label: c.companyName }))] }
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Activity Category"
                  value={taskType}
                  onChange={e => setTaskType(e.target.value)}
                  options={[
                    { value: 'call', label: 'Phone Call follow up' },
                    { value: 'meeting', label: 'Meeting / Appointment' },
                    { value: 'email', label: 'Email Sequence' },
                    { value: 'task', label: 'Fulfillment Task' }
                  ]}
                  required
                />
                <Input label="Due Date" type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} required />
              </div>
              <Input label="Agenda / Notes" value={taskNotes} onChange={e => setTaskNotes(e.target.value)} />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Schedule task</Button>
            </form>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
