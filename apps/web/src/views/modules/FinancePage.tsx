import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { api } from '@/services/api.service';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  CreditCard, Receipt, FileText, PieChart, ShieldAlert,
  RotateCw, Plus, Check, X, ArrowRight, DollarSign,
  Search, Download, Sparkles, Sliders, ChevronRight,
  TrendingUp, Users, Calendar
} from 'lucide-react';

async function financeApi(method: 'get' | 'post', path: string, data?: any) {
  const res = await (method === 'get'
    ? api.get(`/finance${path}`)
    : api.post(`/finance${path}`, data));
  return res.data.data;
}

export default function FinancePage() {
  const { moduleKey } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(moduleKey || 'accounting');
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [dashboard, setDashboard] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);

  // Sub-navigation inside accounting
  const [accSubTab, setAccSubTab] = useState<'coa' | 'journals' | 'ledger' | 'statements'>('coa');

  // Modals & Forms visibility
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Selected entities
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  // Form states: Account
  const [accCode, setAccCode] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('asset');
  const [accParentId, setAccParentId] = useState('');
  const [accDesc, setAccDesc] = useState('');

  // Form states: Journal Entry
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalNarration, setJournalNarration] = useState('');
  const [journalRef, setJournalRef] = useState('');
  const [journalBranch, setJournalBranch] = useState('HQ');
  const [journalItems, setJournalItems] = useState<any[]>([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' }
  ]);

  // Form states: Invoice
  const [invCustomer, setInvCustomer] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invIssueDate, setInvIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [invDueDate, setInvDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [invTaxRate, setInvTaxRate] = useState('18');
  const [invItems, setInvItems] = useState<any[]>([
    { productName: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }
  ]);

  // Form states: Invoice Payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form states: Expense claim
  const [expNotes, setExpNotes] = useState('');
  const [expLines, setExpLines] = useState<any[]>([
    { category: 'travel', date: new Date().toISOString().split('T')[0], description: '', amount: 0, taxAmount: 0, merchant: '' }
  ]);

  // Form states: Budget
  const [budgetDept, setBudgetDept] = useState('Engineering');
  const [budgetYear, setBudgetYear] = useState('2026');
  const [budgetAmt, setBudgetAmt] = useState('');
  const [budgetQuarter, setBudgetQuarter] = useState('Q3');

  // Form states: Tax filing
  const [taxType, setTaxType] = useState('GST');
  const [taxPeriod, setTaxPeriod] = useState('June 2026');
  const [taxDueDate, setTaxDueDate] = useState(dateOffset(15));
  const [taxAmt, setTaxAmt] = useState('');
  const [taxForm, setTaxForm] = useState('GSTR-3B');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  function dateOffset(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  useEffect(() => {
    if (moduleKey) {
      setActiveTab(moduleKey);
    }
  }, [moduleKey]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dash, accs, jrnls, invs, exps, bdgts, txs] = await Promise.all([
        financeApi('get', '/dashboard'),
        financeApi('get', '/accounts'),
        financeApi('get', '/journals'),
        financeApi('get', '/invoices'),
        financeApi('get', '/expenses'),
        financeApi('get', '/budgets'),
        financeApi('get', '/taxes'),
      ]);

      setDashboard(dash);
      setAccounts(accs);
      setJournals(jrnls);
      setInvoices(invs);
      setExpenses(exps);
      setBudgets(bdgts);
      setTaxes(txs);
    } catch {
      toast.error('Failed to load finance ledger records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CSV Exporter Helper
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
    toast.success('Report data exported successfully');
  };

  // Double entry validator before submitting journals
  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const debits = journalItems.reduce((sum, item) => sum + parseFloat(item.debit || 0), 0);
    const credits = journalItems.reduce((sum, item) => sum + parseFloat(item.credit || 0), 0);

    if (Math.abs(debits - credits) > 0.01) {
      toast.error(`Unbalanced Entry: Total Debits (₹${debits}) must equal Total Credits (₹${credits}).`);
      return;
    }

    try {
      await financeApi('post', '/journals', {
        date: journalDate,
        narration: journalNarration,
        reference: journalRef,
        branch: journalBranch,
        items: journalItems.map(item => ({
          accountId: item.accountId,
          debit: parseFloat(item.debit || 0),
          credit: parseFloat(item.credit || 0),
          description: item.description
        }))
      });
      toast.success('Journal entry posted successfully');
      setShowJournalForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to post entry');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accCode || !accName) return;
    await financeApi('post', '/accounts', {
      code: accCode,
      name: accName,
      type: accType,
      parent_id: accParentId || null,
      description: accDesc
    });
    toast.success('Chart of Account node created');
    setShowAccountForm(false);
    fetchData();
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    await financeApi('post', '/invoices', {
      customerName: invCustomer,
      customerEmail: invEmail,
      issueDate: invIssueDate,
      dueDate: invDueDate,
      items: invItems.map(item => ({
        productName: item.productName,
        quantity: parseInt(item.quantity || 1),
        unitPrice: parseFloat(item.unitPrice || 0),
        discount: parseFloat(item.discount || 0),
        taxRate: parseFloat(invTaxRate)
      }))
    });
    toast.success('Customer Invoice invoice logged');
    setShowInvoiceForm(false);
    fetchData();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await financeApi('post', `/invoices/${selectedInvoiceId}/payments`, {
      paymentDate: new Date().toISOString().split('T')[0],
      amount: parseFloat(paymentAmount),
      paymentMethod,
      referenceNo: paymentRef,
      notes: paymentNotes
    });
    toast.success('Collection recorded successfully');
    setShowPaymentForm(false);
    fetchData();
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await financeApi('post', '/expenses', {
      date: new Date().toISOString().split('T')[0],
      notes: expNotes,
      lines: expLines.map(line => ({
        category: line.category,
        date: line.date,
        description: line.description,
        amount: parseFloat(line.amount || 0),
        taxAmount: parseFloat(line.amount || 0) * 0.18,
        merchant: line.merchant
      }))
    });
    toast.success('Corporate expense claim submitted');
    setShowExpenseForm(false);
    fetchData();
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    await financeApi('post', '/budgets', {
      departmentName: budgetDept,
      fiscalYear: parseInt(budgetYear),
      quarter: budgetQuarter,
      allocatedAmount: parseFloat(budgetAmt)
    });
    toast.success('Department budget locked');
    setShowBudgetForm(false);
    fetchData();
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    await financeApi('post', '/taxes', {
      taxType,
      filingPeriod: taxPeriod,
      dueDate: taxDueDate,
      amountDue: parseFloat(taxAmt),
      returnForm: taxForm
    });
    toast.success('Compliance calendar record added');
    setShowTaxForm(false);
    fetchData();
  };

  // Helper lists
  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return accounts;
    return accounts.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.code.includes(searchQuery)
    );
  }, [accounts, searchQuery]);

  return (
    <PageContainer
      title="Financial System Workspace"
      subtitle="Complete accounting ledger, invoicing builder, expense controls, and budgeting."
      actions={
        <div className="flex gap-2">
          {activeTab === 'accounting' && accSubTab === 'coa' && (
            <Button onClick={() => setShowAccountForm(true)} icon={<Plus size={14} />}>Add Account</Button>
          )}
          {activeTab === 'accounting' && accSubTab === 'journals' && (
            <Button onClick={() => setShowJournalForm(true)} icon={<Plus size={14} />}>New Voucher</Button>
          )}
          {activeTab === 'invoicing' && (
            <Button onClick={() => setShowInvoiceForm(true)} icon={<Plus size={14} />}>Create Invoice</Button>
          )}
          {activeTab === 'expenses' && (
            <Button onClick={() => setShowExpenseForm(true)} icon={<Plus size={14} />}>File Claim</Button>
          )}
          {activeTab === 'budgeting' && (
            <Button onClick={() => setShowBudgetForm(true)} icon={<Plus size={14} />}>New Budget</Button>
          )}
          {activeTab === 'tax' && (
            <Button onClick={() => setShowTaxForm(true)} icon={<Plus size={14} />}>Add Filing</Button>
          )}
          <Button variant="secondary" onClick={fetchData} icon={<RotateCw size={14} />} />
        </div>
      }
    >
      {/* Dynamic Tab Switcher */}
      <div className="flex gap-1.5 p-1 bg-ag-surface-2/70 border border-ag-border rounded-xl w-fit mb-8 overflow-x-auto">
        {[
          { key: 'accounting', label: 'Accounting', icon: <CreditCard size={14} /> },
          { key: 'expenses', label: 'Expense Management', icon: <Receipt size={14} /> },
          { key: 'invoicing', label: 'Billing & Invoicing', icon: <FileText size={14} /> },
          { key: 'budgeting', label: 'Budgeting & Forecasts', icon: <PieChart size={14} /> },
          { key: 'tax', label: 'Tax Management', icon: <ShieldAlert size={14} /> }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key);
              navigate(`/finance/${t.key}`);
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

      {/* ── Sub-Tab Content: ACCOUNTING ── */}
      {activeTab === 'accounting' && (
        <div className="space-y-8">
          {/* Accounting Sub-navigation */}
          <div className="flex gap-2 border-b border-ag-border pb-px">
            {[
              { key: 'coa', label: 'Chart of Accounts' },
              { key: 'journals', label: 'Journal Entries' },
              { key: 'ledger', label: 'General Ledger' },
              { key: 'statements', label: 'Financial Statements' }
            ].map(sub => (
              <button
                key={sub.key}
                onClick={() => setAccSubTab(sub.key as any)}
                className={`pb-3 px-1 text-xs font-bold transition-all relative ${
                  accSubTab === sub.key ? 'text-ag-primary border-b-2 border-ag-primary' : 'text-ag-ink-3 hover:text-ag-ink'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* COA Tree View */}
          {accSubTab === 'coa' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-ag-surface-2/45 p-4 rounded-xl border border-ag-border">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search accounts code or name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    icon={<Search size={14} />}
                  />
                </div>
                <Button variant="secondary" onClick={() => exportToCSV(accounts, 'Chart_of_Accounts')} icon={<Download size={14} />}>Export COA</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-6">
                  <h3 className="font-bold text-sm text-ag-ink mb-4">Chart of Accounts Hierarchy</h3>
                  <div className="space-y-2">
                    {filteredAccounts.map(acc => (
                      <div
                        key={acc.id}
                        className={`p-3 border border-ag-border/50 rounded-xl hover:border-ag-primary/20 transition-all flex justify-between items-center ${
                          acc.parent_id ? 'ml-6 bg-ag-surface-2/30' : 'bg-ag-surface font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-ag-ink-3">{acc.code}</span>
                          <span className="text-xs text-ag-ink">{acc.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-ag-surface-2 text-ag-ink-3">
                            {acc.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Quick actions panel */}
                <Card className="p-6 h-fit space-y-4">
                  <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3">Accounting Operations</h3>
                  <div className="space-y-2 text-xs">
                    <p className="text-ag-ink-3">Quickly add entries, reconcile bank listings, or download financial summaries.</p>
                    <div className="pt-2 space-y-2">
                      <Button className="w-full" onClick={() => setAccSubTab('journals')} variant="secondary">Go to Journals</Button>
                      <Button className="w-full" onClick={() => setAccSubTab('ledger')} variant="secondary">Go to Ledger</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Journal Voucher log */}
          {accSubTab === 'journals' && (
            <Card>
              <CardHeader title="Journal Entries Book" subtitle="Debit/Credit double entry voucher audits" />
              <div className="p-6">
                <DataTable
                  columns={[
                    { accessorKey: 'entryNumber', header: 'Voucher No.' },
                    { accessorKey: 'date', header: 'Date' },
                    { accessorKey: 'narration', header: 'Narration' },
                    { accessorKey: 'branch', header: 'Branch' },
                    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> }
                  ]}
                  data={journals}
                  isLoading={isLoading}
                />
              </div>
            </Card>
          )}

          {/* General Ledger view */}
          {accSubTab === 'ledger' && (
            <Card className="p-6">
              <h3 className="font-bold text-sm text-ag-ink mb-4">General Ledger Search</h3>
              <div className="space-y-4">
                <DataTable
                  columns={[
                    { accessorKey: 'entryNumber', header: 'Voucher' },
                    { accessorKey: 'date', header: 'Date' },
                    { accessorKey: 'narration', header: 'Description' },
                    { accessorKey: 'status', header: 'Status' }
                  ]}
                  data={journals}
                  isLoading={isLoading}
                />
              </div>
            </Card>
          )}

          {/* Statements Profit Loss & Balance Sheet */}
          {accSubTab === 'statements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profit & Loss statement */}
              <Card className="p-6">
                <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3 mb-4">Profit & Loss Statement</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between font-bold text-ag-ink">
                    <span>Revenue (Product & Services Sales)</span>
                    <span className="text-ag-primary">₹{(dashboard?.monthlyRevenue ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ag-ink-2 pl-4">
                    <span>Product Sales</span>
                    <span>₹{(dashboard?.monthlyRevenue ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ag-ink border-t border-dashed border-ag-border pt-2 font-bold">
                    <span>Total Cost of Sales</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between text-ag-ink-2 pl-4">
                    <span>Operating Expenses (Claims & AMC)</span>
                    <span>₹{(dashboard?.budgetUsed ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ag-ink border-t border-ag-border pt-3 font-extrabold text-sm">
                    <span>Net Operating Profit</span>
                    <span className="text-green-600">₹{(dashboard?.netProfit ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              {/* Balance Sheet statement */}
              <Card className="p-6">
                <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3 mb-4">Balance Sheet Statement</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between font-bold text-ag-ink">
                    <span>Current Assets</span>
                    <span>₹{(dashboard?.totalAssets ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ag-ink-2 pl-4">
                    <span>HDFC Bank Account</span>
                    <span>₹{(dashboard?.totalAssets ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ag-ink border-t border-dashed border-ag-border pt-2 font-bold">
                    <span>Liabilities</span>
                    <span>₹{(dashboard?.totalLiabilities ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ag-ink-2 pl-4">
                    <span>Accounts Payable</span>
                    <span>₹{(dashboard?.totalLiabilities ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ag-ink border-t border-ag-border pt-3 font-extrabold text-sm">
                    <span>Total Shareholder Equity</span>
                    <span>₹{((dashboard?.totalAssets ?? 0) - (dashboard?.totalLiabilities ?? 0)).toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── Sub-Tab Content: EXPENSES ── */}
      {activeTab === 'expenses' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wide">Pending Claims</p>
                <h3 className="text-2xl font-black text-ag-ink tracking-tight mt-1">₹{(dashboard?.outstandingPayables ?? 0).toLocaleString()}</h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wide">Approved claims</p>
                <h3 className="text-2xl font-black text-ag-ink tracking-tight mt-1">₹{(dashboard?.budgetUsed ?? 0).toLocaleString()}</h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wide">Corporate AMC Policy Limits</p>
                <h3 className="text-2xl font-black text-ag-ink tracking-tight mt-1">₹1,50,000</h3>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Employee Reimbursement Claims Log" subtitle="Track category claims, receipt OCR files, and approvals" />
            <div className="p-6">
              <DataTable
                columns={[
                  { accessorKey: 'claimNumber', header: 'Claim ID' },
                  { accessorKey: 'employeeName', header: 'Employee' },
                  { accessorKey: 'date', header: 'Submitted Date' },
                  { accessorKey: 'notes', header: 'Narration / Project' },
                  { accessorKey: 'totalAmount', header: 'Total Value', cell: ({ row }) => <span className="font-bold text-ag-primary">₹{row.original.totalAmount?.toLocaleString()}</span> },
                  { accessorKey: 'status', header: 'Workflow Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> }
                ]}
                data={expenses}
                isLoading={isLoading}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Sub-Tab Content: INVOICING ── */}
      {activeTab === 'invoicing' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wide">Paid Collections</p>
                <h3 className="text-2xl font-black text-ag-ink tracking-tight mt-1">₹{(dashboard?.monthlyRevenue ?? 0).toLocaleString()}</h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wide">Outstanding Receivables</p>
                <h3 className="text-2xl font-black text-ag-ink tracking-tight mt-1">₹{(dashboard?.outstandingReceivables ?? 0).toLocaleString()}</h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wide">Average Invoice Value</p>
                <h3 className="text-2xl font-black text-ag-ink tracking-tight mt-1">₹65,000</h3>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Accounts Receivable Ledger" subtitle="Manage client invoices and payment collection actions" />
            <div className="p-6">
              <DataTable
                columns={[
                  { accessorKey: 'invoiceNumber', header: 'Invoice Code' },
                  { accessorKey: 'customerName', header: 'Customer' },
                  { accessorKey: 'issueDate', header: 'Date Generated' },
                  { accessorKey: 'dueDate', header: 'Due Date' },
                  { accessorKey: 'totalAmount', header: 'Amount Due', cell: ({ row }) => <span className="font-bold">₹{row.original.totalAmount?.toLocaleString()}</span> },
                  { accessorKey: 'status', header: 'Filing Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
                  {
                    id: 'actions', header: 'Action',
                    cell: ({ row }) => row.original.status !== 'paid' ? (
                      <Button size="sm" onClick={() => { setSelectedInvoiceId(row.original.id); setShowPaymentForm(true); }}>Record Pay</Button>
                    ) : <span className="text-xs text-green-600 font-bold">Paid ✓</span>
                  }
                ]}
                data={invoices}
                isLoading={isLoading}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Sub-Tab Content: BUDGETING ── */}
      {activeTab === 'budgeting' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <h4 className="text-xs text-ag-ink-3 font-semibold uppercase tracking-wider">Allocated Headcount Budget (2026)</h4>
              <p className="text-3xl font-extrabold text-ag-primary mt-2">₹{(dashboard?.budgetAllocated ?? 0).toLocaleString()}</p>
            </Card>
            <Card className="p-5">
              <h4 className="text-xs text-ag-ink-3 font-semibold uppercase tracking-wider">Spent Cost Allocation</h4>
              <p className="text-3xl font-extrabold text-ag-primary mt-2">₹{(dashboard?.budgetUsed ?? 0).toLocaleString()}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader title="Department Variance Analysis" subtitle="Review spend vs quarter projections" />
              <div className="p-6">
                <DataTable
                  columns={[
                    { accessorKey: 'departmentName', header: 'Department' },
                    { accessorKey: 'fiscalYear', header: 'Fiscal Year' },
                    { accessorKey: 'quarter', header: 'Quarter' },
                    { accessorKey: 'allocatedAmount', header: 'Budget Allocated', cell: ({ row }) => <span>₹{row.original.allocatedAmount?.toLocaleString()}</span> },
                    { accessorKey: 'spentAmount', header: 'Spent Amount', cell: ({ row }) => <span>₹{row.original.spentAmount?.toLocaleString()}</span> },
                    { accessorKey: 'status', header: 'Approval status', cell: ({ row }) => <StatusBadge status={row.original.status} /> }
                  ]}
                  data={budgets}
                  isLoading={isLoading}
                />
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-sm text-ag-ink flex items-center gap-1.5 border-b border-ag-border pb-3">
                <Sparkles size={16} className="text-yellow-500" />
                <span>AI Budget Recommendations</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="font-bold text-yellow-700">Q3 Marketing Cap Warning</p>
                  <p className="text-ag-ink-3 mt-1">Marketing spend is growing at +14% month-on-month. Request dynamic cap overrides early.</p>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="font-bold text-green-700">Engineering Resource Surplus</p>
                  <p className="text-ag-ink-3 mt-1">Allocated headcount has a surplus ₹3,50,000. Reallocate to R&D AWS nodes.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Sub-Tab Content: TAX MANAGEMENT ── */}
      {activeTab === 'tax' && (
        <div className="space-y-8">
          <Card>
            <CardHeader title="Tax Filings & Compliance Calendar" subtitle="GST returns, input credits, and vendor TDS filing logs" />
            <div className="p-6">
              <DataTable
                columns={[
                  { accessorKey: 'taxType', header: 'Tax Category' },
                  { accessorKey: 'filingPeriod', header: 'Period' },
                  { accessorKey: 'dueDate', header: 'Filing Deadline' },
                  { accessorKey: 'amountDue', header: 'Liability Due', cell: ({ row }) => <span className="font-bold">₹{row.original.amountDue?.toLocaleString()}</span> },
                  { accessorKey: 'returnForm', header: 'Filing Form' },
                  { accessorKey: 'status', header: 'Compliance status', cell: ({ row }) => <StatusBadge status={row.original.status} /> }
                ]}
                data={taxes}
                isLoading={isLoading}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Modal: Add Account ── */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="p-6 max-w-md w-full">
            <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3 mb-4 flex justify-between items-center">
              <span>Create Chart of Account Node</span>
              <Button variant="ghost" size="sm" onClick={() => setShowAccountForm(false)} icon={<X size={14} />} />
            </h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Account Code *" value={accCode} onChange={e => setAccCode(e.target.value)} placeholder="e.g. 1202" required />
                <Input label="Account Name *" value={accName} onChange={e => setAccName(e.target.value)} placeholder="e.g. ICICI Corporate" required />
              </div>
              <Select
                label="Account Category *"
                value={accType}
                onChange={e => setAccType(e.target.value)}
                options={['asset', 'liability', 'equity', 'income', 'expense'].map(t => ({ value: t, label: t.toUpperCase() }))}
              />
              <Select
                label="Parent Account Node"
                value={accParentId}
                onChange={e => setAccParentId(e.target.value)}
                options={[{ value: '', label: 'Root level (No parent)' }, ...accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))] }
              />
              <Input label="Description" value={accDesc} onChange={e => setAccDesc(e.target.value)} />
              <Button type="submit" className="w-full">Create Account</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Record Payment ── */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="p-6 max-w-md w-full">
            <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3 mb-4 flex justify-between items-center">
              <span>Record Client Payment Receipt</span>
              <Button variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)} icon={<X size={14} />} />
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <Input label="Payment Amount (INR) *" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="e.g. 5000" required />
              <Select
                label="Payment Method *"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'bank_transfer', label: 'NEFT / RTGS' },
                  { value: 'stripe', label: 'Stripe Online' },
                  { value: 'razorpay', label: 'Razorpay Payment Gateway' },
                  { value: 'cash', label: 'Cash Receipt' },
                  { value: 'cheque', label: 'Cheque' }
                ]}
              />
              <Input label="Reference Number" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="e.g. TXN-998877" />
              <Input label="Memo Notes" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} />
              <Button type="submit" className="w-full">Record Receipt</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Journal Entry ── */}
      {showJournalForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="p-6 max-w-2xl w-full my-8">
            <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3 mb-4 flex justify-between items-center">
              <span>Add General Journal Entry Voucher</span>
              <Button variant="ghost" size="sm" onClick={() => setShowJournalForm(false)} icon={<X size={14} />} />
            </h3>
            <form onSubmit={handleCreateJournal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Voucher Date *" type="date" value={journalDate} onChange={e => setJournalDate(e.target.value)} required />
                <Input label="Reference/Voucher Code" value={journalRef} onChange={e => setJournalRef(e.target.value)} placeholder="e.g. CHQ-8877" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Narration Description" value={journalNarration} onChange={e => setJournalNarration(e.target.value)} placeholder="e.g. Seed operational capital" />
                <Input label="Cost Center / Project" value={journalBranch} onChange={e => setJournalBranch(e.target.value)} />
              </div>
              
              <div className="space-y-2 border-t border-ag-border pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-ag-ink">Double Entry Items</h4>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => setJournalItems([...journalItems, { accountId: '', debit: 0, credit: 0, description: '' }])}
                  >
                    + Add Row
                  </Button>
                </div>
                {journalItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end border-b border-dashed border-ag-border pb-2">
                    <div className="flex-1">
                      <Select
                        label={`Debit/Credit Account #${idx+1}`}
                        value={item.accountId}
                        onChange={e => {
                          const items = [...journalItems];
                          items[idx].accountId = e.target.value;
                          setJournalItems(items);
                        }}
                        options={[{ value: '', label: 'Select ledger Account...' }, ...accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))] }
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        label="Debit Amount"
                        type="number"
                        value={item.debit}
                        onChange={e => {
                          const items = [...journalItems];
                          items[idx].debit = parseFloat(e.target.value || 0);
                          setJournalItems(items);
                        }}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        label="Credit Amount"
                        type="number"
                        value={item.credit}
                        onChange={e => {
                          const items = [...journalItems];
                          items[idx].credit = parseFloat(e.target.value || 0);
                          setJournalItems(items);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setJournalItems(journalItems.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <Button type="submit" className="w-full">Post Voucher</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Invoice ── */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="p-6 max-w-2xl w-full my-8">
            <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3 mb-4 flex justify-between items-center">
              <span>Generate Customer Invoice</span>
              <Button variant="ghost" size="sm" onClick={() => setShowInvoiceForm(false)} icon={<X size={14} />} />
            </h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Customer Name *" value={invCustomer} onChange={e => setInvCustomer(e.target.value)} placeholder="e.g. Google India" required />
                <Input label="Customer Email" type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} placeholder="e.g. invoice@google.com" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Issue Date *" type="date" value={invIssueDate} onChange={e => setInvIssueDate(e.target.value)} required />
                <Input label="Due Date *" type="date" value={invDueDate} onChange={e => setInvDueDate(e.target.value)} required />
                <Select
                  label="GST Output Rate"
                  value={invTaxRate}
                  onChange={e => setInvTaxRate(e.target.value)}
                  options={[
                    { value: '18', label: '18% Standard GST' },
                    { value: '12', label: '12% Reduced GST' },
                    { value: '5', label: '5% Minimum GST' },
                    { value: '0', label: 'Exempt / Zero Rated' }
                  ]}
                />
              </div>

              <div className="space-y-2 border-t border-ag-border pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-ag-ink">Invoice Line Items</h4>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => setInvItems([...invItems, { productName: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }])}
                  >
                    + Add Line
                  </Button>
                </div>
                {invItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end border-b border-dashed border-ag-border pb-2">
                    <div className="flex-1">
                      <Input
                        label="Product / Service *"
                        value={item.productName}
                        onChange={e => {
                          const items = [...invItems];
                          items[idx].productName = e.target.value;
                          setInvItems(items);
                        }}
                        placeholder="e.g. Software engineering services"
                        required
                      />
                    </div>
                    <div className="w-16">
                      <Input
                        label="Qty *"
                        type="number"
                        value={item.quantity}
                        onChange={e => {
                          const items = [...invItems];
                          items[idx].quantity = parseInt(e.target.value || 1);
                          setInvItems(items);
                        }}
                        required
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        label="Rate (INR) *"
                        type="number"
                        value={item.unitPrice}
                        onChange={e => {
                          const items = [...invItems];
                          items[idx].unitPrice = parseFloat(e.target.value || 0);
                          setInvItems(items);
                        }}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setInvItems(invItems.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full">Issue Invoice</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Submit Expense claim ── */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="p-6 max-w-2xl w-full my-8">
            <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3 mb-4 flex justify-between items-center">
              <span>File Corporate Expense Reimbursement</span>
              <Button variant="ghost" size="sm" onClick={() => setShowExpenseForm(false)} icon={<X size={14} />} />
            </h3>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <Input label="Business Justification Narration *" value={expNotes} onChange={e => setExpNotes(e.target.value)} placeholder="e.g. Travel to client HQ for project review" required />
              
              <div className="space-y-2 border-t border-ag-border pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-ag-ink">Claim Lines</h4>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => setExpLines([...expLines, { category: 'travel', date: new Date().toISOString().split('T')[0], description: '', amount: 0, taxAmount: 0, merchant: '' }])}
                  >
                    + Add Claim
                  </Button>
                </div>
                {expLines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-end border-b border-dashed border-ag-border pb-2">
                    <div className="w-32">
                      <Select
                        label="Category"
                        value={line.category}
                        onChange={e => {
                          const lines = [...expLines];
                          lines[idx].category = e.target.value;
                          setExpLines(lines);
                        }}
                        options={[
                          { value: 'travel', label: 'Travel & Cab' },
                          { value: 'food', label: 'Meals & Food' },
                          { value: 'hotel', label: 'Hotel stay' },
                          { value: 'office_supplies', label: 'Office Supplies' },
                          { value: 'medical', label: 'Medical reimbursement' }
                        ]}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label="Description"
                        value={line.description}
                        onChange={e => {
                          const lines = [...expLines];
                          lines[idx].description = e.target.value;
                          setExpLines(lines);
                        }}
                        placeholder="e.g. Uber ride from airport"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        label="Amount (INR) *"
                        type="number"
                        value={line.amount}
                        onChange={e => {
                          const lines = [...expLines];
                          lines[idx].amount = parseFloat(e.target.value || 0);
                          setExpLines(lines);
                        }}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpLines(expLines.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full">Submit Claim</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Budget ── */}
      {showBudgetForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="p-6 max-w-md w-full">
            <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3 mb-4 flex justify-between items-center">
              <span>Allocate Department Budget Cap</span>
              <Button variant="ghost" size="sm" onClick={() => setShowBudgetForm(false)} icon={<X size={14} />} />
            </h3>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <Select
                label="Cost Center Department *"
                value={budgetDept}
                onChange={e => setBudgetDept(e.target.value)}
                options={['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'].map(d => ({ value: d, label: d }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Fiscal Year *" type="number" value={budgetYear} onChange={e => setBudgetYear(e.target.value)} required />
                <Select
                  label="Period Quarter"
                  value={budgetQuarter}
                  onChange={e => setBudgetQuarter(e.target.value)}
                  options={['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({ value: q, label: q }))}
                />
              </div>
              <Input label="Allocated Limit (INR) *" value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)} placeholder="e.g. 500000" required />
              <Button type="submit" className="w-full">Lock Budget</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Tax Filing ── */}
      {showTaxForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="p-6 max-w-md w-full">
            <h3 className="font-bold text-sm text-ag-ink border-b border-ag-border pb-3 mb-4 flex justify-between items-center">
              <span>Register Compliance Filing Obligation</span>
              <Button variant="ghost" size="sm" onClick={() => setShowTaxForm(false)} icon={<X size={14} />} />
            </h3>
            <form onSubmit={handleCreateTax} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tax Type *"
                  value={taxType}
                  onChange={e => setTaxType(e.target.value)}
                  options={['GST', 'TDS', 'CorporateTax'].map(t => ({ value: t, label: t }))}
                />
                <Input label="Return Form / Section" value={taxForm} onChange={e => setTaxForm(e.target.value)} placeholder="e.g. GSTR-3B" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Filing Period *" value={taxPeriod} onChange={e => setTaxPeriod(e.target.value)} placeholder="e.g. June 2026" required />
                <Input label="Due Date *" type="date" value={taxDueDate} onChange={e => setTaxDueDate(e.target.value)} required />
              </div>
              <Input label="Tax Liability Due (INR) *" value={taxAmt} onChange={e => setTaxAmt(e.target.value)} placeholder="e.g. 15000" required />
              <Button type="submit" className="w-full">Add Compliance Task</Button>
            </form>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
