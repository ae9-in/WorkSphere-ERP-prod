import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { analyticsService } from '@/services/api.service';
import {
  LineChart as LineChartIcon,
  Plus,
  Trash,
  Settings,
  Sparkles,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Layers,
  Database,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Play,
  FileSpreadsheet,
  Download,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface KPIAlertRule {
  _id?: string;
  name: string;
  kpiName: string;
  conditionOperator: string;
  thresholdValue: number;
  channel: string;
  recipient: string;
  isActive: boolean;
}

interface BIWidget {
  id: string;
  title: string;
  type: 'kpi' | 'bar' | 'line' | 'pie' | 'table';
  size_x: number;
  size_y: number;
  pos_x: number;
  pos_y: number;
}

interface BIDashboard {
  _id?: string;
  name: string;
  description: string;
  category: string;
  widgets: BIWidget[];
}

export default function AnalyticsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = (() => {
    const path = location.pathname;
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/builder')) return 'builder';
    if (path.includes('/alerts')) return 'alerts';
    if (path.includes('/ai')) return 'ai';
    if (path.includes('/forecast')) return 'forecast';
    if (path.includes('/sql')) return 'sql';
    return 'dashboard';
  })();
  const [stats, setStats] = useState<any>({
    totalEmployees: 0,
    activeEmployees: 0,
    monthlyPayroll: 0,
    revenue: 0,
    expenses: 0,
    profit: 0,
    salesThisMonth: 0,
    openLeads: 0,
    openProjects: 0,
    tasksDue: 0,
    inventoryValue: 0,
    stockAlerts: 0,
    pendingApprovals: 0
  });

  // Dashboards state
  const [dashboards, setDashboards] = useState<BIDashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<BIDashboard | null>(null);
  const [dashboardWidgets, setDashboardWidgets] = useState<BIWidget[]>([]);

  // Report Builder state
  const [selectedTable, setSelectedTable] = useState('invoice');
  const [selectedFields, setSelectedFields] = useState<string[]>(['month', 'invoiced', 'collected']);
  const [aggregateFunc, setAggregateFunc] = useState('sum');
  const [reportResult, setReportResult] = useState<any[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // Alert rules state
  const [alertRules, setAlertRules] = useState<KPIAlertRule[]>([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleKPI, setNewRuleKPI] = useState('stock_level');
  const [newRuleOperator, setNewRuleOperator] = useState('less_than');
  const [newRuleThreshold, setNewRuleThreshold] = useState(10);
  const [newRuleRecipient, setNewRuleRecipient] = useState('alerts@worksphere.co');

  // AI Prompt Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<any | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // ML forecasting state
  const [forecastKPI, setForecastKPI] = useState('revenue');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [forecastMetrics, setForecastMetrics] = useState<any>({});

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM employees WHERE status = \'active\' LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<any[]>([]);
  const [sqlExecutionTime, setSqlExecutionTime] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchDashboards();
    fetchAlertRules();
    fetchForecastData();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await analyticsService.getStats();
      if (data) setStats(data);
    } catch (err) {
      console.error("Error loading analytical metrics", err);
    }
  };

  const fetchDashboards = async () => {
    try {
      const data = await analyticsService.getDashboards();
      setDashboards(data);
      if (data && data.length > 0) {
        setSelectedDashboard(data[0]);
        setDashboardWidgets(data[0].widgets || []);
      }
    } catch (err) {
      console.error("Error loading BI dashboard models", err);
    }
  };

  const fetchAlertRules = async () => {
    try {
      const data = await analyticsService.getAlertRules();
      setAlertRules(data);
    } catch (err) {
      console.error("Error loading threshold alerts rules", err);
    }
  };

  const fetchForecastData = async () => {
    try {
      const res = await analyticsService.runForecast(forecastKPI);
      if (res) {
        setHistoricalData(res.historical || []);
        setForecastData(res.forecast || []);
        setForecastMetrics({
          riskScore: res.riskScore,
          seasonalityPeak: res.seasonalityPeak,
          modelUsed: res.modelUsed
        });
      }
    } catch (err) {
      console.error("Error loading predictive forecasts", err);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, [forecastKPI]);

  // Execute report builder query
  const handleExecuteReport = async () => {
    setIsReportLoading(true);
    try {
      const payload = {
        table: selectedTable,
        fields: selectedFields,
        aggregations: [],
        filters: [],
        groupBy: []
      };
      const res = await analyticsService.runReportBuilder(payload);
      setReportResult(res || []);
    } catch (err) {
      console.error("Error generating custom report", err);
    } finally {
      setIsReportLoading(false);
    }
  };

  // Trigger AI assistant
  const handleAskAIAssistant = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await analyticsService.runAIQuery(aiPrompt);
      setAiResponse(res || null);
    } catch (err) {
      console.error("Error asking AI assistant", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Add Alert Rule
  const handleCreateAlertRule = async () => {
    if (!newRuleName) return;
    try {
      const payload = {
        name: newRuleName,
        kpiName: newRuleKPI,
        conditionOperator: newRuleOperator,
        thresholdValue: newRuleThreshold,
        channel: 'email',
        recipient: newRuleRecipient,
        isActive: true
      };
      await analyticsService.createAlertRule(payload);
      setNewRuleName('');
      fetchAlertRules();
    } catch (err) {
      console.error("Error saving alert rule", err);
    }
  };

  // SQL Console Simulator
  const handleRunSQLQuery = () => {
    const start = performance.now();
    let result = [];
    if (sqlQuery.toLowerCase().includes('employee')) {
      result = [
        {"id": "EMP-001", "first_name": "Marcus", "last_name": "Vance", "department": "Engineering", "ctc": 1850000},
        {"id": "EMP-002", "first_name": "Aria", "last_name": "Bennett", "department": "HR", "ctc": 980000},
        {"id": "EMP-003", "first_name": "Devin", "last_name": "Karp", "department": "Sales", "ctc": 1150000}
      ];
    } else if (sqlQuery.toLowerCase().includes('invoice')) {
      result = [
        {"invoice_number": "INV-2026-001", "client": "Zenith Corp", "amount": 450000, "status": "paid"},
        {"invoice_number": "INV-2026-002", "client": "Apex Labs", "amount": 1200000, "status": "overdue"}
      ];
    } else {
      result = [
        {"execution_status": "success", "rows_returned": 14, "query_plan": "Seq Scan on bi_dashboards"}
      ];
    }
    const end = performance.now();
    setSqlResult(result);
    setSqlExecutionTime(Math.round(end - start));
  };

  // Drag and Drop Grid widget controls simulator
  const handleAddWidget = (type: 'kpi' | 'bar' | 'line' | 'pie') => {
    const newWidget: BIWidget = {
      id: `w-${Date.now()}`,
      title: `Custom ${type.toUpperCase()} Card`,
      type,
      size_x: type === 'kpi' ? 1 : 2,
      size_y: 1,
      pos_x: 0,
      pos_y: dashboardWidgets.length
    };
    setDashboardWidgets([...dashboardWidgets, newWidget]);
  };

  const handleDeleteWidget = (id: string) => {
    setDashboardWidgets(dashboardWidgets.filter(w => w.id !== id));
  };

  const handleSaveDashboardLayout = async () => {
    if (!selectedDashboard?._id) return;
    try {
      const payload = {
        name: selectedDashboard.name,
        description: selectedDashboard.description,
        widgets: dashboardWidgets
      };
      await analyticsService.updateDashboard(selectedDashboard._id, payload);
      fetchDashboards();
      navigate('/analytics/dashboard');
    } catch (err) {
      console.error("Error saving layout", err);
    }
  };

  // Static chart data formats
  const revenueChartData = [
    { month: 'Jan', revenue: 8400000, profit: 5400000 },
    { month: 'Feb', revenue: 9800000, profit: 6100000 },
    { month: 'Mar', revenue: 11000000, profit: 7300000 },
    { month: 'Apr', revenue: 10500000, profit: 6800000 },
    { month: 'May', revenue: 12400000, profit: 9000000 }
  ];

  const COLORS = ['#5B3CF5', '#00C48C', '#FFB020', '#FF5F57', '#2BB5FF'];

  return (
    <PageContainer
      title="Enterprise Analytics Center"
      subtitle="Executive dashboards, dynamic reports builders, custom alerts triggers, and predictive forecasting engines."
      actions={
        <div className="flex gap-2">
          {activeTab === 'dashboard' && (
            <Button onClick={fetchStats} icon={<RefreshCw size={16} />}>Sync Metrics</Button>
          )}
          {activeTab === 'builder' && (
            <Button onClick={handleSaveDashboardLayout} icon={<Settings size={16} />}>Save Layout</Button>
          )}
        </div>
      }
    >
      {/* Tabs selectors */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        {[
          { key: 'dashboard', label: 'Executive Dashboard', icon: <LineChartIcon size={16} /> },
          { key: 'builder', label: 'Layout Builder', icon: <Sliders size={16} /> },
          { key: 'reports', label: 'No-Code Report Center', icon: <FileSpreadsheet size={16} /> },
          { key: 'forecast', label: 'ML Demand Forecasting', icon: <TrendingUp size={16} /> },
          { key: 'alerts', label: 'KPI Threshold Alerts', icon: <ShieldAlert size={16} /> },
          { key: 'ai', label: 'AI Smart Explorer', icon: <Sparkles size={16} /> },
          { key: 'sql', label: 'SQL Query Console', icon: <Database size={16} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              navigate(`/analytics/${tab.key}`);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-ag-primary text-white shadow-md'
                : 'text-ag-ink-2 hover:bg-ag-surface/50 hover:text-ag-ink'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. EXECUTIVE DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          {/* KPI High Density Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'Revenue Valuation', value: `₹${(stats.revenue / 100000).toFixed(0)}L`, delta: '+12.4% YoY', color: 'text-ag-primary' },
              { label: 'Payroll Outflow', value: `₹${(stats.monthlyPayroll / 100000).toFixed(0)}L`, delta: 'Stable', color: 'text-ag-ink' },
              { label: 'Operational Cost', value: `₹${(stats.expenses / 100000).toFixed(0)}L`, delta: '-2.1% MoM', color: 'text-red-500' },
              { label: 'Active Workforce', value: stats.activeEmployees, delta: '+3 new joiners', color: 'text-green-600' },
              { label: 'Sales Quotations', value: `₹${(stats.salesThisMonth / 100000).toFixed(0)}L`, delta: '+4.8% pipeline', color: 'text-ag-primary' },
              { label: 'Pending Approvals', value: stats.pendingApprovals, delta: 'High priority', color: 'text-yellow-600' }
            ].map((k, idx) => (
              <Card key={idx} className="p-4">
                <span className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider block">{k.label}</span>
                <h3 className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</h3>
                <span className="text-[9px] text-ag-ink-3 font-semibold mt-0.5 block">{k.delta}</span>
              </Card>
            ))}
          </div>

          {/* Dynamic dashboard graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 lg:col-span-2">
              <CardHeader title="Revenue Wave & Profit Index" subtitle="Historical records track of monthly revenue waves against general profit margins." />
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4DFFF" />
                    <XAxis dataKey="month" stroke="#8E88A8" fontSize={11} />
                    <YAxis stroke="#8E88A8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#5B3CF5" fill="#5B3CF5" fillOpacity={0.1} strokeWidth={2.5} name="Total Gross Revenue" />
                    <Area type="monotone" dataKey="profit" stroke="#00C48C" fill="#00C48C" fillOpacity={0.05} strokeWidth={2} name="Net Profit Margin" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader title="Fulfillment Spend Breakdown" subtitle="Distribution of department expenditures." />
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Engineering', value: 45 },
                        { name: 'Sales & Marketing', value: 25 },
                        { name: 'Operations', value: 18 },
                        { name: 'Administration', value: 12 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {revenueChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconSize={10} fontSize={11} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. DASHBOARD LAYOUT BUILDER */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
          {/* Widgets library toolbox */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Add Analytics Widget</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button size="sm" variant="secondary" onClick={() => handleAddWidget('kpi')} icon={<Plus size={12} />}>KPI Block</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddWidget('line')} icon={<Plus size={12} />}>Line Chart</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddWidget('bar')} icon={<Plus size={12} />}>Bar Chart</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddWidget('pie')} icon={<Plus size={12} />}>Pie Chart</Button>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Dashboard Details</h3>
              <div className="space-y-1">
                <span className="text-[10px] text-ag-ink-3 uppercase block font-semibold">Active Profile:</span>
                <span className="text-xs font-bold text-ag-ink block">{selectedDashboard?.name || 'Executive Strategy'}</span>
                <p className="text-[11px] text-ag-ink-3 mt-1">{selectedDashboard?.description || 'Corporate KPIs tracking.'}</p>
              </div>
            </Card>
          </div>

          {/* Interactive Layout grid (Center Panel) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 bg-ag-surface-2 border-2 border-dashed border-ag-border min-h-[500px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardWidgets.map((w) => (
                  <Card key={w.id} className="p-4 bg-white shadow hover:shadow-lg transition-all relative group">
                    <button
                      onClick={() => handleDeleteWidget(w.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash size={14} />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-ag-primary uppercase">{w.type}</span>
                    <h4 className="text-xs font-black text-ag-ink mt-1">{w.title}</h4>
                    
                    {/* Simulated Widget Content Preview */}
                    <div className="h-28 flex items-center justify-center bg-ag-surface-2 rounded-lg border border-ag-border mt-3 text-[10px] text-ag-ink-3 italic">
                      {w.type === 'kpi' ? '₹75,40,000' : 'Visual Graph Preview'}
                    </div>
                  </Card>
                ))}
                {dashboardWidgets.length === 0 && (
                  <div className="col-span-3 text-center py-24 text-xs text-ag-ink-3 italic">
                    Grid canvas is empty. Drag or select a widget from the left panel to populate layout.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 3. NO-CODE REPORT BUILDER */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
          {/* Query sidebar builder */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Custom Query Configuration</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleExecuteReport(); }} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">Select DB Table</label>
                  <select
                    className="ag-input"
                    value={selectedTable}
                    onChange={(e) => {
                      const t = e.target.value;
                      setSelectedTable(t);
                      if (t === 'employee') setSelectedFields(['department_name', 'headcount', 'avg_ctc']);
                      else if (t === 'invoice') setSelectedFields(['month', 'invoiced', 'collected']);
                      else setSelectedFields(['source', 'leads_count', 'won']);
                    }}
                  >
                    <option value="employee">Employees Schema (HRMS)</option>
                    <option value="invoice">Invoices Ledger (Finance)</option>
                    <option value="lead">Leads pipeline (CRM)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">Aggregations</label>
                  <select className="ag-input" value={aggregateFunc} onChange={e => setAggregateFunc(e.target.value)}>
                    <option value="sum">SUM Columns</option>
                    <option value="avg">AVERAGE Column CTCs</option>
                    <option value="count">COUNT Rows Grouped</option>
                  </select>
                </div>

                <Button type="submit" className="w-full mt-4" icon={<Play size={14} />} disabled={isReportLoading}>
                  {isReportLoading ? 'Processing Query...' : 'Run Query Builder'}
                </Button>
              </form>
            </Card>

            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Export Document</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button size="sm" variant="secondary" icon={<Download size={12} />}>Export PDF</Button>
                <Button size="sm" variant="secondary" icon={<Download size={12} />}>Export CSV</Button>
              </div>
            </Card>
          </div>

          {/* Report output canvas */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader title="Analytical Query Results" subtitle="Tabular aggregated rows processed from the selected transactional database tables." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                      {selectedFields.map((f) => (
                        <th key={f} className="p-4">{f.replace('_', ' ').toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportResult.length === 0 ? (
                      <tr>
                        <td colSpan={selectedFields.length} className="p-8 text-center text-ag-ink-3">
                          Select database parameters on the left and run query solver.
                        </td>
                      </tr>
                    ) : (
                      reportResult.map((row, idx) => (
                        <tr key={idx} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                          {selectedFields.map((f) => (
                            <td key={f} className="p-4 font-mono font-bold">
                              {typeof row[f] === 'number' ? `₹${row[f].toLocaleString()}` : row[f]}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 4. ML DEMAND FORECASTING TAB */}
      {activeTab === 'forecast' && (
        <div className="space-y-8 animate-fade-in">
          {/* Select KPI */}
          <Card className="p-5 flex justify-between items-center bg-gradient-to-r from-ag-primary/5 to-transparent border-ag-primary/20">
            <div className="space-y-1">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider">ML Seasonal Wave Forecasting</h3>
              <span className="text-[11px] text-ag-ink-3">Plots historical trends and computes 6-month projections using regression analysis models.</span>
            </div>
            <select
              className="ag-input w-48"
              value={forecastKPI}
              onChange={e => setForecastKPI(e.target.value)}
            >
              <option value="revenue">Gross Revenue</option>
              <option value="expenses">Expenses Claims</option>
              <option value="inventory_demand">Inventory Consumptions</option>
            </select>
          </Card>

          {/* Plot charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 lg:col-span-2">
              <CardHeader title="6-Month Historical vs 6-Month Projected Trend" subtitle="Solid line maps past data, dashed line indicates ARIMA projection values." />
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...historicalData, ...forecastData]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4DFFF" />
                    <XAxis dataKey="date" stroke="#8E88A8" fontSize={11} />
                    <YAxis stroke="#8E88A8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#5B3CF5" fill="#5B3CF5" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Model variables analysis */}
            <Card className="p-6 space-y-4">
              <CardHeader title="Model Integrity Metrics" subtitle="Mathematical parameters computed by ARIMA trend models." />
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-ag-border pb-2">
                  <span className="text-ag-ink-3">Confidence Level</span>
                  <span className="font-bold text-green-600">94.2% R2 Index</span>
                </div>
                <div className="flex justify-between border-b border-ag-border pb-2">
                  <span className="text-ag-ink-3">Anomaly Detection Score</span>
                  <span className="font-bold text-ag-ink">{forecastMetrics.riskScore || 'Low'}</span>
                </div>
                <div className="flex justify-between border-b border-ag-border pb-2">
                  <span className="text-ag-ink-3">Peak Seasonality Period</span>
                  <span className="font-bold text-ag-primary">{forecastMetrics.seasonalityPeak || 'Nov - Dec'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ag-ink-3">Algorithm Used</span>
                  <span className="font-bold text-ag-ink-2 font-mono">{forecastMetrics.modelUsed || 'ARIMA'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 5. KPI THRESHOLD ALERTS */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Rules definitions form */}
          <div className="lg:col-span-1">
            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Define Alert Condition</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateAlertRule(); }} className="space-y-4">
                <Input
                  label="Alert Rule Label"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  placeholder="e.g. Stock Level Alert"
                  required
                />
                
                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">Select KPI variable</label>
                  <select className="ag-input" value={newRuleKPI} onChange={e => setNewRuleKPI(e.target.value)}>
                    <option value="stock_level">SCM Stock Quantity (Inventory)</option>
                    <option value="monthly_payroll">Monthly Net Payroll Cost (HRMS)</option>
                    <option value="overdue_invoices">Total Overdue Invoices Amount (Finance)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="ag-label">Operator</label>
                    <select className="ag-input" value={newRuleOperator} onChange={e => setNewRuleOperator(e.target.value)}>
                      <option value="less_than">Less Than (&lt;)</option>
                      <option value="greater_than">Greater Than (&gt;)</option>
                    </select>
                  </div>
                  <Input
                    label="Threshold"
                    type="number"
                    value={newRuleThreshold}
                    onChange={e => setNewRuleThreshold(parseFloat(e.target.value || '0'))}
                    required
                  />
                </div>

                <Input
                  label="Notification Target Email"
                  type="email"
                  value={newRuleRecipient}
                  onChange={e => setNewRuleRecipient(e.target.value)}
                  required
                />

                <Button type="submit" className="w-full mt-2">Publish Alert Rule</Button>
              </form>
            </Card>
          </div>

          {/* Active Rules & Logs */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Threshold Alert Rules" subtitle="Published triggers evaluating live transactional balances." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                      <th className="p-4">Rule Name</th>
                      <th className="p-4">Condition</th>
                      <th className="p-4">Channel</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertRules.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-ag-ink-3">No custom alert rules configured. Create one on the left.</td>
                      </tr>
                    ) : (
                      alertRules.map((rule) => (
                        <tr key={rule._id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                          <td className="p-4 font-bold text-ag-ink">{rule.name}</td>
                          <td className="p-4 font-mono">
                            {rule.kpiName} {rule.conditionOperator === 'less_than' ? '<' : '>'} {rule.thresholdValue}
                          </td>
                          <td className="p-4 font-medium text-ag-ink-3">{rule.recipient}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-green-50 text-green-700 border border-green-200">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 6. AI SMART SEARCH ASSISTANT */}
      {activeTab === 'ai' && (
        <div className="space-y-8 animate-fade-in">
          <Card className="p-6 bg-gradient-to-br from-ag-primary/10 via-transparent to-transparent border-ag-primary/20">
            <div className="flex gap-4">
              <Input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Ask WorkSphere BI: 'Show payroll cost for last six months' or 'Show quarterly revenue summaries'"
                className="flex-1 bg-white"
              />
              <Button onClick={handleAskAIAssistant} icon={<Sparkles size={16} />} disabled={isAiLoading}>
                {isAiLoading ? 'Analyzing...' : 'Ask Assistant'}
              </Button>
            </div>
          </Card>

          {aiResponse && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Output summaries */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="p-5">
                  <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2 flex items-center gap-2">
                    <Sparkles className="text-ag-primary" size={16} />
                    <span>AI Executive Insights</span>
                  </h3>
                  <p className="text-xs text-ag-ink-2 leading-relaxed">{aiResponse.summary}</p>
                </Card>

                <Card className="p-5">
                  <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Business Actions Recommendations</h3>
                  <ul className="space-y-3 text-xs font-medium">
                    {aiResponse.recommendations?.map((rec: string, idx: number) => (
                      <li key={idx} className="flex gap-2 items-start text-ag-ink-2">
                        <span className="text-ag-primary">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Output Chart visualization */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <CardHeader title="AI Visual Chart Generator" subtitle="Auto-generated graph representation modeled from text instructions." />
                  <div className="h-72 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      {aiResponse.chartType === 'area' ? (
                        <AreaChart data={aiResponse.tableData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4DFFF" />
                          <XAxis dataKey="label" stroke="#8E88A8" fontSize={11} />
                          <YAxis stroke="#8E88A8" fontSize={11} />
                          <Tooltip />
                          <Area type="monotone" dataKey="value" stroke="#5B3CF5" fill="#5B3CF5" fillOpacity={0.1} strokeWidth={2.5} />
                        </AreaChart>
                      ) : (
                        <BarChart data={aiResponse.tableData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4DFFF" />
                          <XAxis dataKey="label" stroke="#8E88A8" fontSize={11} />
                          <YAxis stroke="#8E88A8" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#5B3CF5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. SQL QUERY CONSOLE */}
      {activeTab === 'sql' && (
        <div className="space-y-6 animate-fade-in">
          <Card className="p-5 bg-slate-900 border-slate-800 text-slate-100 font-mono text-sm relative">
            <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database size={14} className="text-ag-primary" />
              <span>Advanced Read-Only Console CLI</span>
            </h3>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 text-green-400 rounded-lg p-4 font-mono text-xs focus:outline-none focus:border-green-500 h-32 leading-relaxed"
              value={sqlQuery}
              onChange={e => setSqlQuery(e.target.value)}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] text-slate-400">Execution plan optimized via read-only SQL views.</span>
              <Button onClick={handleRunSQLQuery} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-xs">
                Run SQL Query
              </Button>
            </div>
          </Card>

          {sqlResult.length > 0 && (
            <Card className="p-5">
              <div className="flex justify-between items-center mb-4 border-b border-ag-border pb-2">
                <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider">Console Outputs</h3>
                <span className="text-[10px] font-mono text-ag-ink-3">Executed in {sqlExecutionTime} ms</span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-green-400 font-mono text-xs max-h-60 overflow-y-auto max-w-full overflow-x-auto leading-relaxed">
                {JSON.stringify(sqlResult, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}

