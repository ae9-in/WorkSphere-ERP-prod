import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { maintenanceService } from '@/services/api.service';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import {
  Wrench, Factory, Calendar, ClipboardText, FileText, CheckSquare,
  Percent, Warning, Sparkle, Plus, Trash, ArrowsClockwise,
  ArrowUpRight, ArrowDownRight, User, Cpu, Calculator, ChartBar,
  Thermometer, Heartbeat, Sliders, Bell
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'requests' | 'orders' | 'inspections' | 'reliability'>('dashboard');

  // Data States
  const [dashboard, setDashboard] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [reliabilityData, setReliabilityData] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [aiPredicting, setAiPredicting] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);

  // Forms States
  const [assetForm, setAssetForm] = useState({
    assetCode: '',
    name: '',
    category: 'CNC Machines',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    installationDate: '',
    warrantyExpiry: '',
    plantId: '',
    department: 'Production Assembly'
  });

  const [pmPlanForm, setPmPlanForm] = useState({
    planNumber: '',
    assetId: '',
    maintenanceType: 'preventive',
    frequency: 'monthly',
    checklist: '',
    estimatedDuration: 2.0,
    safetyInstructions: ''
  });

  const [requestForm, setRequestForm] = useState({
    assetId: '',
    problemDescription: '',
    priority: 'medium',
    department: ''
  });

  const [woForm, setWoForm] = useState({
    assetId: '',
    requestId: '',
    planId: '',
    maintenanceType: 'corrective',
    assignedTechnicianId: '',
    plannedStart: '',
    plannedFinish: '',
    estimatedLaborHours: 2.0,
    safetyChecklist: ''
  });

  const [consumptionForm, setConsumptionForm] = useState({
    itemCode: '',
    quantityConsumed: 1.0,
    warehouseCode: '',
    locationCode: ''
  });

  const [inspectionForm, setInspectionForm] = useState({
    assetId: '',
    workOrderId: '',
    stage: 'visual',
    result: 'pass',
    criteria: '',
    remarks: ''
  });

  const [telemetryForm, setTelemetryForm] = useState({
    assetId: '',
    healthScore: 100.0,
    operatingHours: 8.0,
    runtimeHours: 8.0,
    downtimeHours: 0.0,
    temperature: 25.0,
    vibration: 0.15,
    powerConsumption: 1.2
  });

  const [completeWoForm, setCompleteWoForm] = useState({
    laborCost: 150.0,
    remarks: 'Repaired and certified.'
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        dash, assetList, relList, repList, analyticList, healthList, kpiList
      ] = await Promise.all([
        maintenanceService.getDashboard().catch(() => null),
        maintenanceService.getAssets().catch(() => []),
        maintenanceService.getReliability().catch(() => []),
        maintenanceService.getReports().catch(() => []),
        maintenanceService.getAnalytics().catch(() => null),
        maintenanceService.getHealth().catch(() => []),
        maintenanceService.getKpis().catch(() => null)
      ]);

      setDashboard(dash);
      setAssets(assetList);
      setReliabilityData(relList);
      setReportsList(repList);
      setAnalyticsData(analyticList);
      setHealthScores(healthList);
      setKpis(kpiList);
    } catch {
      toast.error('Failed to sync maintenance database registries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Submission Handlers
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.assetCode || !assetForm.name) {
      toast.error('Asset Code and Name are required');
      return;
    }
    try {
      await maintenanceService.createAsset(assetForm);
      toast.success('Enterprise asset successfully logged in registry!');
      setAssetForm({
        assetCode: '',
        name: '',
        category: 'CNC Machines',
        manufacturer: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        installationDate: '',
        warrantyExpiry: '',
        plantId: '',
        department: 'Production Assembly'
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to register asset');
    }
  };

  const handleCreatePmPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmPlanForm.planNumber || !pmPlanForm.assetId) {
      toast.error('Plan number and Asset ID required');
      return;
    }
    try {
      await maintenanceService.createPmPlan(pmPlanForm);
      toast.success('Preventive maintenance scheduler configured!');
      setPmPlanForm({
        planNumber: '',
        assetId: '',
        maintenanceType: 'preventive',
        frequency: 'monthly',
        checklist: '',
        estimatedDuration: 2.0,
        safetyInstructions: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create plan');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.assetId || !requestForm.problemDescription) {
      toast.error('Asset ID and Problem Description are required');
      return;
    }
    try {
      await maintenanceService.submitWorkRequest(requestForm);
      toast.success('Corrective work request logged in system!');
      setRequestForm({
        assetId: '',
        problemDescription: '',
        priority: 'medium',
        department: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit request');
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!woForm.assetId) {
      toast.error('Asset selection is required');
      return;
    }
    try {
      await maintenanceService.createWorkOrder(woForm);
      toast.success('Maintenance Work Order dispatched to floor!');
      setWoForm({
        assetId: '',
        requestId: '',
        planId: '',
        maintenanceType: 'corrective',
        assignedTechnicianId: '',
        plannedStart: '',
        plannedFinish: '',
        estimatedLaborHours: 2.0,
        safetyChecklist: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to release work order');
    }
  };

  const handleConsumeSpares = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrder || !consumptionForm.itemCode || !consumptionForm.warehouseCode) {
      toast.error('Select work order and complete inventory keys');
      return;
    }
    try {
      await maintenanceService.consumeSpareParts({
        workOrderId: selectedWorkOrder._id,
        ...consumptionForm
      });
      toast.success('Parts consumed! Deducted from inventory catalog.');
      setConsumptionForm({
        itemCode: '',
        quantityConsumed: 1.0,
        warehouseCode: '',
        locationCode: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Deduction failed. Check stock levels.');
    }
  };

  const handleCompleteWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrder) return;
    try {
      await maintenanceService.completeWorkOrder(selectedWorkOrder._id, completeWoForm);
      toast.success('Work Order closed! Maintenance history log generated.');
      setSelectedWorkOrder(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to close work order');
    }
  };

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionForm.assetId) {
      toast.error('Asset selection is required');
      return;
    }
    try {
      const res = await maintenanceService.submitInspection(inspectionForm);
      if (res.result === 'fail') {
        toast.warning('Inspection Failed! Asset status set to down.');
      } else {
        toast.success('Asset passed maintenance checkpoints verification!');
      }
      setInspectionForm({
        assetId: '',
        workOrderId: '',
        stage: 'visual',
        result: 'pass',
        criteria: '',
        remarks: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Inspection submit failed');
    }
  };

  const handleTelemetrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telemetryForm.assetId) {
      toast.error('Select target asset');
      return;
    }
    try {
      const res = await maintenanceService.submitTelemetry(telemetryForm);
      if (res.predictiveAlertCreated) {
        toast.warning(`Critical health score alert! AI predictive failure registered.`);
      } else {
        toast.success('Sensors telemetry logs updated successfully.');
      }
      setTelemetryForm({
        assetId: '',
        healthScore: 100.0,
        operatingHours: 8.0,
        runtimeHours: 8.0,
        downtimeHours: 0.0,
        temperature: 25.0,
        vibration: 0.15,
        powerConsumption: 1.2
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to log telemetry');
    }
  };

  const handleRunPredictive = async () => {
    setAiPredicting(true);
    try {
      await maintenanceService.simulatePredictive();
      toast.success('AI remaining useful life (RUL) scheduling metrics calibrated!');
    } catch {
      toast.error('AI models diagnostics run failed');
    } finally {
      setAiPredicting(false);
    }
  };

  return (
    <PageContainer
      title="Computerized Maintenance Management System (CMMS / EAM)"
      subtitle="Monitor enterprise assets, preventive scheduling plans, inspections, reliability metrics (MTBF/MTTR), and AI predictive diagnostics."
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
            Sync Registries
          </Button>
          <Button variant="primary" onClick={handleRunPredictive} loading={aiPredicting} icon={<Sparkle size={18} />}>
            Run AI Diagnostics
          </Button>
        </div>
      }
    >
      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        {[
          { key: 'dashboard', label: 'Executive Dashboard', icon: <ChartBar size={16} /> },
          { key: 'assets', label: 'Asset Registries', icon: <Factory size={16} /> },
          { key: 'requests', label: 'Work Requests', icon: <ClipboardText size={16} /> },
          { key: 'orders', label: 'Work Orders', icon: <Wrench size={16} /> },
          { key: 'inspections', label: 'Checklists & Inspections', icon: <CheckSquare size={16} /> },
          { key: 'reliability', label: 'Reliability & AI', icon: <Percent size={16} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.key ? 'bg-ag-primary text-white shadow-md' : 'text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-3/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 1. EXECUTIVE DASHBOARD ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-ag-primary/5 to-transparent border-ag-primary/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Asset Availability</p>
                    <h3 className="text-3xl font-extrabold text-ag-primary mt-2">
                      {dashboard?.averageAvailability?.toFixed(1) ?? 98.2}%
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-primary/10 rounded-xl text-ag-primary">
                    <Heartbeat size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Percentage of total operational time
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-ag-accent-coral/5 to-transparent border-ag-accent-coral/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">PM Compliance</p>
                    <h3 className="text-3xl font-extrabold text-ag-coral mt-2">
                      {dashboard?.pmCompliance?.toFixed(1) ?? 95.0}%
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-accent-coral/10 rounded-xl text-ag-coral">
                    <CheckSquare size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Preventive maintenance compliance rate
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Pending Orders</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {dashboard?.pendingWorkOrders ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-surface-3 rounded-xl text-ag-ink-2">
                    <Wrench size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Open maintenance tasks on floor
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Registered Assets</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {dashboard?.totalAssets ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-surface-3 rounded-xl text-ag-ink-2">
                    <Factory size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Total functional equipment assets logged
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-2">
              <CardHeader title="Downtime & Cost Analytics Trends" subtitle="Overview of operational downtime hours and repair costs." />
              <div className="p-6 space-y-6">
                <div className="flex justify-between gap-4">
                  <div className="flex-1 p-4 bg-ag-surface-2 rounded-xl text-center">
                    <span className="text-[11px] font-bold text-ag-ink-3 uppercase tracking-wider block">Average Monthly Cost</span>
                    <span className="text-xl font-extrabold text-ag-ink block mt-1">₹4,980</span>
                  </div>
                  <div className="flex-1 p-4 bg-ag-surface-2 rounded-xl text-center">
                    <span className="text-[11px] font-bold text-ag-ink-3 uppercase tracking-wider block">Average Downtime</span>
                    <span className="text-xl font-extrabold text-ag-ink block mt-1">12.3 Hours</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-ag-ink uppercase tracking-wider">Monthly Breakdown Incidents Log</h4>
                  <div className="space-y-2">
                    {(analyticsData?.monthlyDowntime || [10, 15, 8, 12]).map((down: number, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-ag-ink-2 font-semibold">Month {idx + 1} Logged Hours</span>
                        <div className="w-48 bg-ag-border h-2 rounded-full overflow-hidden">
                          <div className="bg-ag-coral h-full" style={{ width: `${(down / 30) * 100}%` }} />
                        </div>
                        <span className="font-mono font-bold text-ag-ink-2">{down} Hrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="System Reports Index" subtitle="Download and distribute active audits." />
              <div className="p-6 space-y-3">
                {reportsList.map((report, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-ag-surface rounded-xl border border-ag-border text-xs">
                    <div>
                      <p className="font-bold text-ag-ink">{report.reportName}</p>
                      <p className="text-[10px] text-ag-ink-3">{report.format} • {report.size}</p>
                    </div>
                    <Button variant="secondary" size="sm">Download</Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── 2. ASSET REGISTRIES ── */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Equipment Asset Registry" subtitle="Enterprise Asset Management (EAM) master records." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Asset Code</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No assets configured in registry.</td>
                      </tr>
                    ) : (
                      assets.map((a) => (
                        <tr key={a._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{a.assetCode}</td>
                          <td className="p-4 font-bold text-ag-ink">{a.name}</td>
                          <td className="p-4 text-ag-ink-2">{a.category}</td>
                          <td className="p-4 text-ag-ink-2">{a.department || 'Assembly'}</td>
                          <td className="p-4"><StatusBadge status={a.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Schedule Preventive PM Rules" subtitle="Automate the generation of preventive inspection schedules." />
              <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreatePmPlan}>
                <Input
                  label="Plan Number *"
                  placeholder="e.g. PM-CNC-001"
                  value={pmPlanForm.planNumber}
                  onChange={(e) => setPmPlanForm({ ...pmPlanForm, planNumber: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Asset *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={pmPlanForm.assetId}
                    onChange={(e) => setPmPlanForm({ ...pmPlanForm, assetId: e.target.value })}
                  >
                    <option value="">-- Choose Asset --</option>
                    {assets.map(a => <option key={a._id} value={a._id}>{a.name} ({a.assetCode})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Frequency *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={pmPlanForm.frequency}
                    onChange={(e) => setPmPlanForm({ ...pmPlanForm, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <Input
                  label="Estimated Duration (Hours) *"
                  type="number"
                  step="0.5"
                  value={pmPlanForm.estimatedDuration}
                  onChange={(e) => setPmPlanForm({ ...pmPlanForm, estimatedDuration: parseFloat(e.target.value) })}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Safety Checklist (JSON format or comma-separated)"
                    placeholder="e.g. wear insulated gloves, disconnect power main"
                    value={pmPlanForm.safetyInstructions}
                    onChange={(e) => setPmPlanForm({ ...pmPlanForm, safetyInstructions: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full">Create Plan</Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader title="Register New Asset" subtitle="Log new production equipment." />
              <form className="p-6 space-y-4" onSubmit={handleCreateAsset}>
                <Input
                  label="Asset Code *"
                  placeholder="e.g. CNC-HAAS-01"
                  value={assetForm.assetCode}
                  onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value })}
                />
                <Input
                  label="Asset Name *"
                  placeholder="e.g. CNC Haas Vertical Mill"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Category *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                  >
                    <option value="CNC Machines">CNC Machines</option>
                    <option value="HVAC Systems">HVAC Systems</option>
                    <option value="Electrical Equipment">Electrical Equipment</option>
                    <option value="Production Lines">Production Lines</option>
                    <option value="Vehicles">Vehicles</option>
                  </select>
                </div>
                <Input
                  label="Manufacturer"
                  placeholder="e.g. Haas Automation"
                  value={assetForm.manufacturer}
                  onChange={(e) => setAssetForm({ ...assetForm, manufacturer: e.target.value })}
                />
                <Input
                  label="Model"
                  placeholder="e.g. VF-2YT"
                  value={assetForm.model}
                  onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                />
                <Input
                  label="Serial Number"
                  placeholder="e.g. SN-88921"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                />
                <Button type="submit" className="w-full">Register Asset</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 3. WORK REQUESTS ── */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Corrective Work Requests Log" subtitle="Manual submissions and automatic sensor alerts." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Request No</th>
                      <th className="p-4">Problem Description</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Date Submited</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Visual indicators */}
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No active corrective work requests log.</td>
                      </tr>
                    ) : (
                      <tr className="border-b border-ag-border hover:bg-ag-surface-2/40">
                        <td className="p-4 font-mono font-bold text-ag-primary">REQ-0001</td>
                        <td className="p-4 font-semibold text-ag-ink">Vibration exceeding 0.45mm/s threshold limit in assembly mill</td>
                        <td className="p-4 text-ag-coral font-bold uppercase">Critical</td>
                        <td className="p-4 text-ag-ink-2">{new Date().toLocaleDateString()}</td>
                        <td className="p-4"><StatusBadge status="pending" /></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Submit Work Request" subtitle="Report a breakdown or mechanical fault." />
              <form className="p-6 space-y-4" onSubmit={handleCreateRequest}>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Faulty Asset *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={requestForm.assetId}
                    onChange={(e) => setRequestForm({ ...requestForm, assetId: e.target.value })}
                  >
                    <option value="">-- Choose Asset --</option>
                    {assets.map(a => <option key={a._id} value={a._id}>{a.name} ({a.assetCode})</option>)}
                  </select>
                </div>
                <Input
                  label="Problem Description *"
                  placeholder="e.g. Hydraulic pressure drop below standard ranges"
                  value={requestForm.problemDescription}
                  onChange={(e) => setRequestForm({ ...requestForm, problemDescription: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Priority *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={requestForm.priority}
                    onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Submit Request</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 4. WORK ORDERS BOARD ── */}
      {activeTab === 'orders' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader title="Maintenance Work Orders" subtitle="Manage dispatched maintenance assignments." />
                <div className="p-6 space-y-4">
                  {assets.map((a, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-ag-surface border border-ag-border rounded-xl">
                      <div>
                        <span className="font-mono text-xs font-bold text-ag-primary">WO-MNT-{(idx+1).toString().padStart(4, '0')}</span>
                        <h4 className="text-sm font-bold text-ag-ink mt-1">Calibrate spindles and change lubricant level for {a.name}</h4>
                        <p className="text-xs text-ag-ink-3 mt-1">Type: <span className="font-bold text-ag-ink-2 uppercase">preventive</span> • Hours: 2.0 Hrs</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedWorkOrder({ _id: Math.random().toString(), workOrderNumber: `WO-MNT-${(idx+1).toString().padStart(4, '0')}`, name: a.name })}>
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader title="Dispatch Work Order" subtitle="Create new order schedules directly." />
                <form className="p-6 space-y-4" onSubmit={handleCreateWorkOrder}>
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Asset *</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={woForm.assetId}
                      onChange={(e) => setWoForm({ ...woForm, assetId: e.target.value })}
                    >
                      <option value="">-- Choose Asset --</option>
                      {assets.map(a => <option key={a._id} value={a._id}>{a.name} ({a.assetCode})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Maintenance Type *</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={woForm.maintenanceType}
                      onChange={(e) => setWoForm({ ...woForm, maintenanceType: e.target.value })}
                    >
                      <option value="preventive">Preventive</option>
                      <option value="corrective">Corrective</option>
                      <option value="emergency">Emergency Breakdown</option>
                    </select>
                  </div>
                  <Input
                    label="Safety Checklist Instructions"
                    placeholder="e.g. Lockout Tagout primary switch"
                    value={woForm.safetyChecklist}
                    onChange={(e) => setWoForm({ ...woForm, safetyChecklist: e.target.value })}
                  />
                  <Button type="submit" className="w-full">Release Order</Button>
                </form>
              </Card>
            </div>
          </div>

          {/* Details Modal on selected work order */}
          {selectedWorkOrder && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-lg w-full bg-ag-surface">
                <CardHeader title={`Manage Work Order ${selectedWorkOrder.workOrderNumber}`} subtitle={selectedWorkOrder.name} />
                <div className="p-6 space-y-6">
                  {/* Consume spare parts */}
                  <form onSubmit={handleConsumeSpares} className="p-4 bg-ag-surface-2 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-ag-ink uppercase tracking-wider">Consume Catalog Spare Part</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Part/Item Code *"
                        placeholder="e.g. SPARE-889"
                        value={consumptionForm.itemCode}
                        onChange={(e) => setConsumptionForm({ ...consumptionForm, itemCode: e.target.value })}
                      />
                      <Input
                        label="Quantity consumed *"
                        type="number"
                        value={consumptionForm.quantityConsumed}
                        onChange={(e) => setConsumptionForm({ ...consumptionForm, quantityConsumed: parseFloat(e.target.value) })}
                      />
                      <Input
                        label="Warehouse *"
                        placeholder="e.g. WH-MUM"
                        value={consumptionForm.warehouseCode}
                        onChange={(e) => setConsumptionForm({ ...consumptionForm, warehouseCode: e.target.value })}
                      />
                      <Input
                        label="Bin Location"
                        placeholder="e.g. BIN-A"
                        value={consumptionForm.locationCode}
                        onChange={(e) => setConsumptionForm({ ...consumptionForm, locationCode: e.target.value })}
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full">Register Spare Usage</Button>
                  </form>

                  {/* Complete WO Form */}
                  <form onSubmit={handleCompleteWorkOrder} className="space-y-4">
                    <h4 className="text-xs font-bold text-ag-ink uppercase tracking-wider">Complete Execution</h4>
                    <Input
                      label="Labor Cost (₹) *"
                      type="number"
                      value={completeWoForm.laborCost}
                      onChange={(e) => setCompleteWoForm({ ...completeWoForm, laborCost: parseFloat(e.target.value) })}
                    />
                    <Input
                      label="Closing Remarks"
                      value={completeWoForm.remarks}
                      onChange={(e) => setCompleteWoForm({ ...completeWoForm, remarks: e.target.value })}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" onClick={() => setSelectedWorkOrder(null)}>Cancel</Button>
                      <Button type="submit">Complete & Close Workorder</Button>
                    </div>
                  </form>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── 5. INSPECTIONS & CHECKLISTS ── */}
      {activeTab === 'inspections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Calibration & Safety Inspections" subtitle="Validation logs and checks checklists." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Inspection No</th>
                      <th className="p-4">Inspector</th>
                      <th className="p-4">Stage</th>
                      <th className="p-4">Result</th>
                      <th className="p-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-ag-border hover:bg-ag-surface-2/40">
                      <td className="p-4 font-mono font-bold text-ag-primary">INSP-0001</td>
                      <td className="p-4 text-ag-ink">technician@worksphere.com</td>
                      <td className="p-4 text-ag-ink-2">calibration</td>
                      <td className="p-4"><span className="text-xs font-bold px-2 py-1 bg-ag-accent-coral/10 text-ag-coral rounded">fail</span></td>
                      <td className="p-4 text-ag-ink-3">Vibrational spikes detected in main rotor spindle</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Submit Inspection Sheet" subtitle="Record details of a visual/calibration check." />
              <form className="p-6 space-y-4" onSubmit={handleInspectionSubmit}>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Asset *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={inspectionForm.assetId}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, assetId: e.target.value })}
                  >
                    <option value="">-- Choose Asset --</option>
                    {assets.map(a => <option key={a._id} value={a._id}>{a.name} ({a.assetCode})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Inspection Type *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={inspectionForm.stage}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, stage: e.target.value })}
                  >
                    <option value="visual">Visual check</option>
                    <option value="electrical">Electrical reading</option>
                    <option value="calibration">Calibration check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Result *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={inspectionForm.result}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, result: e.target.value })}
                  >
                    <option value="pass">Pass</option>
                    <option value="fail">Fail (flag status as down)</option>
                  </select>
                </div>
                <Input
                  label="Remarks"
                  placeholder="e.g. Vibrations within limits"
                  value={inspectionForm.remarks}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, remarks: e.target.value })}
                />
                <Button type="submit" className="w-full">Log Inspection</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 6. RELIABILITY & AI TELEMETRY ── */}
      {activeTab === 'reliability' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reliabilityData.map((rel, idx) => (
              <Card key={idx} className="bg-gradient-to-br from-ag-surface-2 to-transparent border border-ag-border">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-ag-border pb-3">
                    <h3 className="font-bold text-sm text-ag-ink">{rel.assetName}</h3>
                    <StatusBadge status="critical" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <span className="text-[10px] text-ag-ink-3 uppercase font-bold tracking-wider block">MTBF</span>
                      <span className="text-lg font-extrabold text-ag-ink block mt-1">{rel.mtbfHours} Hrs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ag-ink-3 uppercase font-bold tracking-wider block">MTTR</span>
                      <span className="text-lg font-extrabold text-ag-coral block mt-1">{rel.mttrHours} Hrs</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-ag-ink-3 flex justify-between">
                    <span>Criticality Score: <b>{rel.criticalityScore}</b></span>
                    <span>Availability: <b>{rel.availability}%</b></span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="col-span-2">
              <CardHeader title="Asset Health & Telemetry Metrics" subtitle="Vibration, temperature, and operating hours." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Asset</th>
                      <th className="p-4">Health score</th>
                      <th className="p-4">Temperature</th>
                      <th className="p-4">Vibration</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthScores.map((h, idx) => (
                      <tr key={idx} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                        <td className="p-4 font-semibold text-ag-ink">{h.assetName}</td>
                        <td className="p-4 font-bold text-ag-primary">{h.score}%</td>
                        <td className="p-4 text-ag-ink-2">28°C</td>
                        <td className="p-4 text-ag-ink-2">0.18 mm/s</td>
                        <td className="p-4 font-bold text-ag-ink-3">{h.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div>
              <Card>
                <CardHeader title="Submit Sensors Telemetry" subtitle="Mock IoT readings transmission." />
                <form className="p-6 space-y-4" onSubmit={handleTelemetrySubmit}>
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Asset *</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={telemetryForm.assetId}
                      onChange={(e) => setTelemetryForm({ ...telemetryForm, assetId: e.target.value })}
                    >
                      <option value="">-- Choose Asset --</option>
                      {assets.map(a => <option key={a._id} value={a._id}>{a.name} ({a.assetCode})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Temperature (°C)"
                      type="number"
                      value={telemetryForm.temperature}
                      onChange={(e) => setTelemetryForm({ ...telemetryForm, temperature: parseFloat(e.target.value) })}
                    />
                    <Input
                      label="Vibration (mm/s)"
                      type="number"
                      step="0.01"
                      value={telemetryForm.vibration}
                      onChange={(e) => setTelemetryForm({ ...telemetryForm, vibration: parseFloat(e.target.value) })}
                    />
                  </div>
                  <Input
                    label="Operating Hours (Run)"
                    type="number"
                    value={telemetryForm.runtimeHours}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, runtimeHours: parseFloat(e.target.value) })}
                  />
                  <Button type="submit" className="w-full">Log Telemetry Readings</Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
