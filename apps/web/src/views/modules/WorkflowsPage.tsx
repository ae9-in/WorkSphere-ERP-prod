import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { workflowAutomationService } from '@/services/api.service';
import {
  GitBranch,
  Play,
  Settings,
  Plus,
  Trash,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Database,
  ArrowRight,
  Zap,
  Info,
  Maximize2,
  Minimize2,
  FolderOpen
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'ai' | 'webhook';
  name: string;
  config: Record<string, any>;
  x: number;
  y: number;
}

interface WorkflowConnection {
  id: string;
  fromId: string;
  toId: string;
}

interface WorkflowAutomation {
  _id?: string;
  name: string;
  description: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  isActive: boolean;
}

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder' | 'executions' | 'templates'>('dashboard');
  const [automations, setAutomations] = useState<WorkflowAutomation[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowAutomation | null>(null);
  
  // Builder state
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [workflowName, setWorkflowName] = useState('New Custom Automation');
  const [workflowDesc, setWorkflowDesc] = useState('Automate records sync across ERP modules.');
  const [triggerType, setTriggerType] = useState('employee_created');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node editing state
  const [nodeNameInput, setNodeNameInput] = useState('');
  const [nodeConfigInput, setNodeConfigInput] = useState<Record<string, any>>({});
  
  // Connection state
  const [connFrom, setConnFrom] = useState('');
  const [connTo, setConnTo] = useState('');

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');

  // Executions logs state
  const [executions, setExecutions] = useState<any[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  
  // Stats
  const [stats, setStats] = useState<any>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    pausedWorkflows: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageRuntimeMs: 142,
    usage: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const wfs = await workflowAutomationService.getAutomations();
      setAutomations(wfs);
      const st = await workflowAutomationService.getStats();
      if (st) setStats(st);
      const ex = await workflowAutomationService.getExecutions();
      setExecutions(ex);
    } catch (err) {
      console.error("Error loading workflow data", err);
    }
  };

  const handleSaveWorkflow = async () => {
    try {
      const payload = {
        name: workflowName,
        description: workflowDesc,
        triggerType,
        triggerConfig: {},
        nodes,
        connections,
        isActive: true
      };

      if (selectedWorkflow?._id) {
        await workflowAutomationService.updateAutomation(selectedWorkflow._id, payload);
      } else {
        await workflowAutomationService.createAutomation(payload);
      }
      fetchData();
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Error saving workflow", err);
    }
  };

  const handleSelectWorkflow = (wf: WorkflowAutomation) => {
    setSelectedWorkflow(wf);
    setWorkflowName(wf.name);
    setWorkflowDesc(wf.description);
    setTriggerType(wf.triggerType);
    setNodes(wf.nodes || []);
    setConnections(wf.connections || []);
    setSelectedNode(null);
    setActiveTab('builder');
  };

  const handleCreateNewWorkflow = () => {
    setSelectedWorkflow(null);
    setWorkflowName('Custom ERP Automation Flow');
    setWorkflowDesc('Triggers actions on records update.');
    setTriggerType('employee_created');
    setNodes([
      { id: 'node-trigger', type: 'trigger', name: 'On Employee Created', config: {}, x: 100, y: 150 },
      { id: 'node-action', type: 'action', name: 'Log Onboarding Task', config: { action_type: 'create_record' }, x: 400, y: 150 }
    ]);
    setConnections([
      { id: 'conn-1', fromId: 'node-trigger', toId: 'node-action' }
    ]);
    setSelectedNode(null);
    setActiveTab('builder');
  };

  // Add node onto SVG canvas
  const handleAddNode = (type: 'trigger' | 'condition' | 'action' | 'delay' | 'ai' | 'webhook') => {
    const id = `node-${Date.now()}`;
    let name = 'New Node';
    let config = {};

    switch (type) {
      case 'trigger':
        name = 'New Event Trigger';
        break;
      case 'condition':
        name = 'If/Else Branch';
        config = { field: 'amount', operator: 'greater_than', value: 50000 };
        break;
      case 'action':
        name = 'Send Alert Message';
        config = { action_type: 'send_slack' };
        break;
      case 'delay':
        name = 'Delay Action';
        config = { wait_hours: 24 };
        break;
      case 'ai':
        name = 'AI Predict Delay';
        break;
      case 'webhook':
        name = 'Trigger API Webhook';
        config = { url: 'https://api.external-vendor.com/callback' };
        break;
    }

    const newNode: WorkflowNode = {
      id,
      type,
      name,
      config,
      x: 200 + nodes.length * 30,
      y: 200 + nodes.length * 20
    };

    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    setNodeNameInput(name);
    setNodeConfigInput(config);
  };

  const handleSelectNode = (node: WorkflowNode) => {
    setSelectedNode(node);
    setNodeNameInput(node.name);
    setNodeConfigInput(node.config || {});
  };

  const handleUpdateNodeProperties = () => {
    if (!selectedNode) return;
    setNodes(nodes.map(n => n.id === selectedNode.id ? {
      ...n,
      name: nodeNameInput,
      config: nodeConfigInput
    } : n));
    setSelectedNode(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.fromId !== nodeId && c.toId !== nodeId));
    setSelectedNode(null);
  };

  const handleAddConnection = () => {
    if (!connFrom || !connTo || connFrom === connTo) return;
    const newConn: WorkflowConnection = {
      id: `conn-${Date.now()}`,
      fromId: connFrom,
      toId: connTo
    };
    setConnections([...connections, newConn]);
    setConnFrom('');
    setConnTo('');
  };

  const handleDeleteConnection = (connId: string) => {
    setConnections(connections.filter(c => c.id !== connId));
  };

  // Execution flow simulation
  const handleTriggerRun = async (wfId: string) => {
    try {
      const testVars = { amount: 75000, email: 'finance@worksphere.co', employeeName: 'Aria Bennett' };
      await workflowAutomationService.triggerWorkflow(wfId, testVars);
      fetchData();
      setActiveTab('executions');
    } catch (err) {
      console.error("Error triggering workflow", err);
    }
  };

  const handleViewExecutionLogs = async (exec: any) => {
    setSelectedExecution(exec);
    try {
      const logs = await workflowAutomationService.getExecutionLogs(exec._id);
      setExecutionLogs(logs);
    } catch (err) {
      console.error("Error loading execution logs", err);
    }
  };

  // Natural Language prompt builder simulator
  const handleGenerateAIFlow = () => {
    if (!aiPrompt.trim()) return;

    // Simulate AI parsing rules:
    let parsedNodes: WorkflowNode[] = [
      { id: 'node-trigger', type: 'trigger', name: 'Trigger: On Record Created', config: {}, x: 100, y: 150 }
    ];
    let parsedConns: WorkflowConnection[] = [];
    let currentX = 350;

    if (aiPrompt.toLowerCase().includes('laptop') || aiPrompt.toLowerCase().includes('onboard')) {
      parsedNodes.push({ id: 'node-ai', type: 'ai', name: 'AI Allocate Assets', config: { model: 'gpt-4o' }, x: currentX, y: 150 });
      parsedConns.push({ id: 'conn-1', fromId: 'node-trigger', toId: 'node-ai' });
      currentX += 250;
    }

    if (aiPrompt.toLowerCase().includes('slack') || aiPrompt.toLowerCase().includes('notify')) {
      parsedNodes.push({ id: 'node-action-slack', type: 'action', name: 'Send Slack Notification', config: { channel: '#onboarding' }, x: currentX, y: 150 });
      parsedConns.push({ id: 'conn-2', fromId: parsedNodes[parsedNodes.length - 2].id, toId: 'node-action-slack' });
      currentX += 250;
    }

    if (aiPrompt.toLowerCase().includes('email')) {
      parsedNodes.push({ id: 'node-action-email', type: 'action', name: 'Send Confirmation Email', config: { recipient: 'employee@worksphere.co' }, x: currentX, y: 150 });
      parsedConns.push({ id: 'conn-3', fromId: parsedNodes[parsedNodes.length - 2].id, toId: 'node-action-email' });
    }

    setWorkflowName('AI Generated Automation Flow');
    setWorkflowDesc(`Parsed from prompt: "${aiPrompt}"`);
    setNodes(parsedNodes);
    setConnections(parsedConns);
    setSelectedNode(null);
    setAiPrompt('');
  };

  const handleLoadTemplate = (recipe: string) => {
    if (recipe === 'leave_approval') {
      setWorkflowName('Auto-Approval for Minor Leaves');
      setWorkflowDesc('Automatically approves leave applications under 3 days.');
      setNodes([
        { id: 'node-trigger', type: 'trigger', name: 'When Leave Application Submitted', config: {}, x: 80, y: 150 },
        { id: 'node-cond', type: 'condition', name: 'Check Days Applied', config: { field: 'days', operator: 'less_than', value: 3 }, x: 340, y: 150 },
        { id: 'node-approve', type: 'action', name: 'Auto-Approve Record', config: {}, x: 600, y: 100 },
        { id: 'node-escalate', type: 'action', name: 'Escalate to Manager', config: {}, x: 600, y: 240 }
      ]);
      setConnections([
        { id: 'c1', fromId: 'node-trigger', toId: 'node-cond' },
        { id: 'c2', fromId: 'node-cond', toId: 'node-approve' },
        { id: 'c3', fromId: 'node-cond', toId: 'node-escalate' }
      ]);
    } else if (recipe === 'stock_alert') {
      setWorkflowName('SCM Low Stock Alarm');
      setWorkflowDesc('Fires outgoing webhook call when inventory drops below limits.');
      setNodes([
        { id: 'node-trigger', type: 'trigger', name: 'On Stock Level Updated', config: {}, x: 100, y: 150 },
        { id: 'node-cond', type: 'condition', name: 'Is Level Under 10?', config: { field: 'stock', operator: 'less_than', value: 10 }, x: 360, y: 150 },
        { id: 'node-webhook', type: 'webhook', name: 'Call SCM Vendor Endpoint', config: { url: 'https://vendor-api.com/reorder' }, x: 620, y: 150 }
      ]);
      setConnections([
        { id: 'c1', fromId: 'node-trigger', toId: 'node-cond' },
        { id: 'c2', fromId: 'node-cond', toId: 'node-webhook' }
      ]);
    }
    setSelectedNode(null);
    setActiveTab('builder');
  };

  // Mock charts trends data
  const trendsData = [
    { name: 'Day 1', success: 120, failed: 4 },
    { name: 'Day 2', success: 145, failed: 8 },
    { name: 'Day 3', success: 190, failed: 12 },
    { name: 'Day 4', success: 170, failed: 5 },
    { name: 'Day 5', success: 220, failed: 10 },
    { name: 'Day 6', success: 280, failed: 3 },
    { name: 'Day 7', success: 310, failed: 6 }
  ];

  return (
    <PageContainer
      title="Workflow Automation Center"
      subtitle="Visual designer, BPMN node triggers, scheduled operations executors, and live integrations controller."
      actions={
        <div className="flex gap-2">
          {activeTab === 'dashboard' && (
            <Button onClick={handleCreateNewWorkflow} icon={<Plus size={16} />}>Create Workflow</Button>
          )}
          <Button variant="secondary" onClick={fetchData} icon={<RefreshCw size={18} />}>
            Sync Canvas
          </Button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        {[
          { key: 'dashboard', label: 'Dashboard Overview', icon: <GitBranch size={16} /> },
          { key: 'builder', label: 'BPMN Builder Canvas', icon: <Sparkles size={16} /> },
          { key: 'executions', label: 'Execution Logs & Retries', icon: <Clock size={16} /> },
          { key: 'templates', label: 'Automation Templates', icon: <FolderOpen size={16} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any);
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

      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-ag-primary">
                <GitBranch size={48} />
              </div>
              <span className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider block">Total Automations</span>
              <h3 className="text-3xl font-black mt-1 text-ag-ink">{stats.totalWorkflows}</h3>
            </Card>

            <Card className="p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-green-500">
                <CheckCircle size={48} />
              </div>
              <span className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider block">Active Triggers</span>
              <h3 className="text-3xl font-black mt-1 text-green-600">{stats.activeWorkflows}</h3>
            </Card>

            <Card className="p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-500">
                <Clock size={48} />
              </div>
              <span className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider block">Avg Runtime Speed</span>
              <h3 className="text-3xl font-black mt-1 text-yellow-600">{stats.averageRuntimeMs} ms</h3>
            </Card>

            <Card className="p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-ag-primary">
                <Sparkles size={48} />
              </div>
              <span className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider block">Executions Success</span>
              <h3 className="text-3xl font-black mt-1 text-ag-primary">{stats.successfulExecutions} runs</h3>
            </Card>
          </div>

          {/* Quick AI Trigger */}
          <Card className="p-6 bg-gradient-to-r from-ag-primary/10 via-transparent to-transparent border-ag-primary/20">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-base text-ag-ink flex items-center gap-2">
                  <Sparkles className="text-ag-primary animate-pulse" size={18} />
                  <span>AI Natural Language Workflow Generator</span>
                </h3>
                <p className="text-xs text-ag-ink-2">Type your automation business logic goals in plain English, and our model will construct the nodes and connections instantly.</p>
              </div>
              <div className="w-full md:w-auto flex gap-3 flex-1 max-w-xl">
                <Input
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. On onboarding new staff, assign asset and send slack notification email"
                  className="flex-1 bg-white"
                />
                <Button onClick={handleGenerateAIFlow} icon={<Sparkles size={16} />}>Generate</Button>
              </div>
            </div>
          </Card>

          {/* Trends and lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 lg:col-span-2">
              <CardHeader title="Execution Trends" subtitle="Daily counts of success and failure instances." />
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4DFFF" />
                    <XAxis dataKey="name" stroke="#8E88A8" fontSize={11} />
                    <YAxis stroke="#8E88A8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="success" stroke="#5B3CF5" fill="#5B3CF5" fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" dataKey="failed" stroke="#FF5F57" fill="#FF5F57" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader title="Module Automation Split" subtitle="Active workflows distribution by category." />
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.usage && stats.usage.length ? stats.usage : [{ name: 'HRMS', value: 3 }, { name: 'SCM', value: 2 }, { name: 'FINANCE', value: 4 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4DFFF" />
                    <XAxis dataKey="name" stroke="#8E88A8" fontSize={11} />
                    <YAxis stroke="#8E88A8" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#5B3CF5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Workflows Table */}
          <Card>
            <div className="p-6 border-b border-ag-border flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider">Active Automation Rules</h3>
                <span className="text-[11px] text-ag-ink-3 block">Trigger points and active nodes configuration parameters.</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                    <th className="p-4">Rule Details</th>
                    <th className="p-4">Event Trigger</th>
                    <th className="p-4">Nodes Limit</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {automations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-ag-ink-3">No automations created. Click Create Workflow above or load a template.</td>
                    </tr>
                  ) : (
                    automations.map((w) => (
                      <tr key={w._id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-ag-ink block">{w.name}</span>
                          <span className="text-[10px] text-ag-ink-3">{w.description || 'No description provided.'}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-ag-primary uppercase">{w.triggerType}</td>
                        <td className="p-4 font-semibold">{w.nodes?.length || 0} nodes</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            w.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-ag-surface-3 text-ag-ink-3 border-ag-border'
                          }`}>
                            {w.isActive ? 'Active' : 'Paused'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleSelectWorkflow(w)}>Edit Flow</Button>
                            <Button size="sm" onClick={() => handleTriggerRun(w._id!)} icon={<Play size={12} />}>Test Run</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Builder Canvas */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
          {/* Node Library (Left panel) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Properties</h3>
              <div className="space-y-4">
                <Input
                  label="Automation Name"
                  value={workflowName}
                  onChange={e => setWorkflowName(e.target.value)}
                />
                <Input
                  label="Description"
                  value={workflowDesc}
                  onChange={e => setWorkflowDesc(e.target.value)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">Base trigger module</label>
                  <select
                    className="ag-input"
                    value={triggerType}
                    onChange={e => setTriggerType(e.target.value)}
                  >
                    <option value="employee_created">Employee Created (HRMS)</option>
                    <option value="leave_applied">Leave Application (HRMS)</option>
                    <option value="invoice_created">Invoice Issued (Finance)</option>
                    <option value="stock_alert">SCM Low Stock Level (Inventory)</option>
                    <option value="lead_created">New CRM Customer (Sales)</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Add Step Node</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button size="sm" variant="secondary" onClick={() => handleAddNode('condition')} icon={<GitBranch size={12} />}>If/Else</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddNode('action')} icon={<Zap size={12} />}>Action</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddNode('delay')} icon={<Clock size={12} />}>Delay</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddNode('ai')} icon={<Sparkles size={12} />}>AI Decision</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddNode('webhook')} icon={<Database size={12} />}>Webhook</Button>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Connect Nodes</h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">From Node</label>
                  <select className="ag-input" value={connFrom} onChange={e => setConnFrom(e.target.value)}>
                    <option value="">Select node...</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="ag-label">To Node</label>
                  <select className="ag-input" value={connTo} onChange={e => setConnTo(e.target.value)}>
                    <option value="">Select node...</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <Button onClick={handleAddConnection} className="w-full">Create Wire Connection</Button>
              </div>
            </Card>
          </div>

          {/* Interactive Designer Canvas (Center panel) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-4 bg-ag-canvas border-dashed border-2 border-ag-border relative overflow-hidden h-[550px] select-none">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} icon={<Minimize2 size={12} />} />
                <span className="bg-white border border-ag-border rounded px-2.5 py-1 text-xs font-mono font-bold flex items-center">{Math.round(zoom * 100)}%</span>
                <Button size="sm" variant="secondary" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} icon={<Maximize2 size={12} />} />
              </div>

              {/* Render interactive SVG graph links */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#5B3CF5" />
                  </marker>
                </defs>
                {connections.map((conn) => {
                  const fromNode = nodes.find(n => n.id === conn.fromId);
                  const toNode = nodes.find(n => n.id === conn.toId);
                  if (!fromNode || !toNode) return null;
                  
                  // Connect center coordinate of nodes
                  const x1 = fromNode.x + 85;
                  const y1 = fromNode.y + 40;
                  const x2 = toNode.x + 85;
                  const y2 = toNode.y + 40;
                  
                  // Render a clean curved SVG Bezier path
                  const mx = (x1 + x2) / 2;
                  const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                  
                  return (
                    <path
                      key={conn.id}
                      d={path}
                      fill="none"
                      stroke="#5B3CF5"
                      strokeWidth={2}
                      markerEnd="url(#arrow)"
                      className="cursor-pointer hover:stroke-red-500 transition-colors pointer-events-auto"
                      onClick={() => handleDeleteConnection(conn.id)}
                    />
                  );
                })}
              </svg>

              {/* Render interactive Node block elements */}
              <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    style={{ left: node.x, top: node.y }}
                    className={`absolute w-44 p-4 rounded-xl border bg-white shadow-lg cursor-pointer transition-all ${
                      selectedNode?.id === node.id ? 'ring-2 ring-ag-primary border-ag-primary' : 'border-ag-border hover:shadow-xl'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        node.type === 'trigger' ? 'bg-green-100 text-green-700' :
                        node.type === 'condition' ? 'bg-yellow-100 text-yellow-700' :
                        node.type === 'ai' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {node.type}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }} className="text-red-500 hover:text-red-700">
                        <Trash size={12} />
                      </button>
                    </div>
                    <h4 className="text-xs font-extrabold text-ag-ink truncate">{node.name}</h4>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setActiveTab('dashboard')}>Cancel</Button>
              <Button onClick={handleSaveWorkflow}>Save & Publish Automation</Button>
            </div>
          </div>

          {/* Node Config Inspector (Right panel) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Properties Inspector</h3>
              {selectedNode ? (
                <div className="space-y-4">
                  <Input
                    label="Step Label"
                    value={nodeNameInput}
                    onChange={e => setNodeNameInput(e.target.value)}
                  />
                  {selectedNode.type === 'condition' && (
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-ag-ink-2">Rule Variable Field</label>
                        <Input
                          value={nodeConfigInput.field || 'amount'}
                          onChange={e => setNodeConfigInput({ ...nodeConfigInput, field: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-ag-ink-2">Condition Operator</label>
                        <select
                          className="ag-input"
                          value={nodeConfigInput.operator || 'greater_than'}
                          onChange={e => setNodeConfigInput({ ...nodeConfigInput, operator: e.target.value })}
                        >
                          <option value="greater_than">Greater Than (&gt;)</option>
                          <option value="less_than">Less Than (&lt;)</option>
                          <option value="equals">Equals (==)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-ag-ink-2">Evaluation Value</label>
                        <Input
                          type="number"
                          value={nodeConfigInput.value || 50000}
                          onChange={e => setNodeConfigInput({ ...nodeConfigInput, value: parseInt(e.target.value || '0') })}
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'webhook' && (
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-ag-ink-2">Endpoint URL Target</label>
                        <Input
                          value={nodeConfigInput.url || ''}
                          onChange={e => setNodeConfigInput({ ...nodeConfigInput, url: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <Button onClick={handleUpdateNodeProperties} className="w-full mt-4">Update Configuration</Button>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-ag-ink-3 italic">
                  Select a node on the canvas to inspect and edit its variables.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Executions History */}
      {activeTab === 'executions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Left panel: executions ledger */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Workflow Executions Ledger Log" subtitle="Monitor active events queues, trigger parameters, and status responses." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                      <th className="p-4">Workflow</th>
                      <th className="p-4">Trigger Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-ag-ink-3">No executions logged. Trigger a test run from the dashboard.</td>
                      </tr>
                    ) : (
                      executions.map((e) => (
                        <tr
                          key={e._id}
                          onClick={() => handleViewExecutionLogs(e)}
                          className={`border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors cursor-pointer ${
                            selectedExecution?._id === e._id ? 'bg-ag-primary-light/30' : ''
                          }`}
                        >
                          <td className="p-4">
                            <span className="font-bold text-ag-ink block">{e.workflowName}</span>
                            <span className="text-[10px] text-ag-ink-3">ID: {e._id.substring(0, 8)}...</span>
                          </td>
                          <td className="p-4 font-medium">{e.startedAt ? e.startedAt.replace("T", " ").substring(0, 19) : 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                              e.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                              e.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {e.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <Button size="sm" variant="ghost">View Details</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right panel: execution detail steps */}
          <div>
            <Card className="p-5">
              <h3 className="font-extrabold text-xs text-ag-ink uppercase tracking-wider mb-4 border-b border-ag-border pb-2">Node Traversal Steps</h3>
              {selectedExecution ? (
                <div className="space-y-6">
                  <div className="bg-ag-surface-2 p-3 rounded-lg border border-ag-border text-xs space-y-1">
                    <div><span className="text-ag-ink-3 font-semibold">Execution ID:</span> <span className="font-mono font-bold text-ag-ink">{selectedExecution._id}</span></div>
                    <div><span className="text-ag-ink-3 font-semibold">Status:</span> <span className="font-bold text-ag-primary uppercase">{selectedExecution.status}</span></div>
                  </div>

                  <div className="relative border-l border-ag-border pl-6 space-y-6">
                    {executionLogs.map((log) => (
                      <div key={log._id} className="relative">
                        <span className={`absolute -left-[31px] top-0.5 p-1 rounded-full text-white ${
                          log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {log.status === 'success' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-ag-ink">{log.message}</h4>
                          <span className="text-[9px] font-mono text-ag-ink-3 uppercase block mt-0.5">Node Type: {log.nodeType}</span>
                          <pre className="bg-ag-surface-2 p-2 rounded border border-ag-border font-mono text-[9px] text-ag-ink-2 mt-2 max-w-full overflow-x-auto">
                            {JSON.stringify(log.outputData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                    {executionLogs.length === 0 && (
                      <div className="text-center py-6 text-xs text-ag-ink-3 italic">
                        Loading trace execution data...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-ag-ink-3 italic">
                  Select an execution row from the log table to view traversed steps and inputs.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {[
            {
              key: 'leave_approval',
              title: 'HR: Auto-Approve Leave request',
              desc: 'Automatically approves any incoming leave request that is less than 3 days in duration, escalating larger requests to managers.',
              nodes: '4 nodes',
              complexity: 'Medium'
            },
            {
              key: 'stock_alert',
              title: 'Inventory: SCM Stock webhook alert',
              desc: 'Fires an outgoing webhook call to third-party suppliers when stock level markers drop below emergency thresholds.',
              nodes: '3 nodes',
              complexity: 'Low'
            },
            {
              key: 'payment_reminder',
              title: 'Finance: Invoice Overdue Reminder',
              desc: 'Checks for overdue invoice balances daily, auto-drafting email warnings to customers via Twilio API integrations.',
              nodes: '5 nodes',
              complexity: 'High'
            }
          ].map((tmpl) => (
            <Card key={tmpl.key} className="p-6 flex flex-col justify-between group hover:border-ag-primary/40 transition-colors">
              <div className="space-y-3">
                <span className="text-[9px] font-mono font-bold text-ag-primary border border-ag-primary/20 bg-ag-primary-light px-2.5 py-0.5 rounded-full inline-block uppercase">
                  {tmpl.complexity} Complexity
                </span>
                <h3 className="font-extrabold text-base text-ag-ink leading-snug">{tmpl.title}</h3>
                <p className="text-xs text-ag-ink-2 leading-relaxed">{tmpl.desc}</p>
                <div className="text-[10px] text-ag-ink-3 font-semibold">Nodes: {tmpl.nodes}</div>
              </div>
              <Button className="w-full mt-6" variant="secondary" onClick={() => handleLoadTemplate(tmpl.key)}>
                Load Template Recipe
              </Button>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
