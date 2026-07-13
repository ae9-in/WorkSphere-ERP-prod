import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { manufacturingService } from '@/services/api.service';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import {
  Factory, Calendar, ClipboardText, FileText, CheckSquare, Wrench,
  Percent, Warning, Sparkle, Plus, Trash, ArrowsClockwise,
  ArrowUpRight, ArrowDownRight, User, Cpu, Calculator, ChartBar
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ManufacturingPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registry' | 'specifications' | 'orders' | 'quality' | 'oee'>('dashboard');

  // Data States
  const [dashboard, setDashboard] = useState<any>(null);
  const [plants, setPlants] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [routings, setRoutings] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [ncrs, setNcrs] = useState<any[]>([]);
  const [scraps, setScraps] = useState<any[]>([]);
  const [oeeMetrics, setOeeMetrics] = useState<any[]>([]);
  const [capacityPlanning, setCapacityPlanning] = useState<any[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<any[]>([]);
  const [mrpProposals, setMrpProposals] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Sub-Tab selections
  const [mrpRunning, setMrpRunning] = useState(false);
  const [aiPredicting, setAiPredicting] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  const [selectedNcr, setSelectedNcr] = useState<any>(null);

  // Forms States
  const [plantForm, setPlantForm] = useState({
    code: '',
    name: '',
    address: '',
    managerId: ''
  });

  const [calendarForm, setCalendarForm] = useState({
    plantId: '',
    name: '',
    workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
    shifts: 'Morning,Evening',
    holidays: '',
    status: 'active'
  });

  const [bomForm, setBomForm] = useState<{
    bomNumber: string;
    productItemCode: string;
    version: string;
    components: { itemCode: string; quantity: number; uom: string }[];
  }>({
    bomNumber: '',
    productItemCode: '',
    version: '1.0.0',
    components: [{ itemCode: '', quantity: 1.0, uom: 'piece' }]
  });

  const [workCenterForm, setWorkCenterForm] = useState({
    code: '',
    name: '',
    department: '',
    capacity: 100.0,
    shiftSchedule: 'Morning,Evening'
  });

  const [machineForm, setMachineForm] = useState({
    machineCode: '',
    name: '',
    equipmentType: '',
    manufacturer: '',
    installationDate: '',
    maintenanceSchedule: '',
    calibrationStatus: 'calibrated',
    status: 'active'
  });

  const [routingForm, setRoutingForm] = useState<{
    code: string;
    name: string;
    productItemCode: string;
    version: string;
    operations: {
      sequence: number;
      workCenterCode: string;
      machineCode: string;
      standardTime: number;
      setupTime: number;
      laborTime: number;
      isInspectionPoint: boolean;
      outputQuantity: number;
    }[];
  }>({
    code: '',
    name: '',
    productItemCode: '',
    version: '1.0.0',
    operations: [{
      sequence: 10,
      workCenterCode: '',
      machineCode: '',
      standardTime: 1.0,
      setupTime: 0.1,
      laborTime: 1.0,
      isInspectionPoint: false,
      outputQuantity: 1.0
    }]
  });

  const [poForm, setPoForm] = useState({
    orderNumber: '',
    itemCode: '',
    bomNumber: '',
    routingCode: '',
    quantity: 10.0,
    plannedStart: '',
    plannedFinish: '',
    plantCode: ''
  });

  const [woForm, setWoForm] = useState({
    productionOrderId: '',
    workCenterCode: '',
    machineCode: '',
    operatorId: '',
    plannedQuantity: 10.0
  });

  const [completionForm, setCompletionForm] = useState<{
    producedQuantity: number;
    scrapQuantity: number;
    rejectedQuantity: number;
    locationCode: string;
    remarks: string;
    consumptions: { itemCode: string; batchNumber: string; serialNumber: string; quantityConsumed: number; wasteQuantity: number }[];
  }>({
    producedQuantity: 10.0,
    scrapQuantity: 0.0,
    rejectedQuantity: 0.0,
    locationCode: '',
    remarks: '',
    consumptions: [{ itemCode: '', batchNumber: '', serialNumber: '', quantityConsumed: 1.0, wasteQuantity: 0.0 }]
  });

  const [qiForm, setQiForm] = useState({
    workOrderNumber: '',
    itemCode: '',
    stage: 'final',
    result: 'pass',
    criteria: '',
    remarks: ''
  });

  const [capaForm, setCapaForm] = useState({
    defectDetails: '',
    rootCause: '',
    correctiveAction: '',
    status: 'open'
  });

  const [scrapForm, setScrapForm] = useState({
    workOrderNumber: '',
    itemCode: '',
    scrapCategory: 'material',
    quantity: 1.0,
    cost: 0.0,
    reason: ''
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        dash, plantList, bomList, wcList, macList, routeList, poList, woList, qiList, ncrList, scrapList, oeeList, capList, maintList
      ] = await Promise.all([
        manufacturingService.getDashboard().catch(() => null),
        manufacturingService.getPlants().catch(() => []),
        manufacturingService.getBoms().catch(() => []),
        manufacturingService.getWorkCenters().catch(() => []),
        manufacturingService.getMachines().catch(() => []),
        manufacturingService.getRoutings().catch(() => []),
        manufacturingService.getProductionOrders().catch(() => []),
        manufacturingService.getWorkOrders().catch(() => []),
        manufacturingService.getQualityInspections().catch(() => []),
        manufacturingService.getNcrs().catch(() => []),
        manufacturingService.getScraps().catch(() => []),
        manufacturingService.getOee().catch(() => []),
        manufacturingService.getCapacity().catch(() => []),
        manufacturingService.getMaintenance().catch(() => [])
      ]);

      setDashboard(dash);
      setPlants(plantList);
      setBoms(bomList);
      setWorkCenters(wcList);
      setMachines(macList);
      setRoutings(routeList);
      setProductionOrders(poList);
      setWorkOrders(woList);
      setInspections(qiList);
      setNcrs(ncrList);
      setScraps(scrapList);
      setOeeMetrics(oeeList);
      setCapacityPlanning(capList);
      setMaintenanceAlerts(maintList);
    } catch {
      toast.error('Failed to sync manufacturing database registries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Handlers
  const handleCreatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantForm.code || !plantForm.name) {
      toast.error('Plant Code and Name are required');
      return;
    }
    try {
      await manufacturingService.createPlant(plantForm);
      toast.success('Manufacturing Plant layout configured!');
      setPlantForm({ code: '', name: '', address: '', managerId: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to register plant');
    }
  };

  const handleCreateCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarForm.plantId || !calendarForm.name) {
      toast.error('Plant selection and name required');
      return;
    }
    try {
      await manufacturingService.createCalendar(calendarForm);
      toast.success('Production calendar registered!');
      setCalendarForm({ plantId: '', name: '', workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday', shifts: 'Morning,Evening', holidays: '', status: 'active' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create calendar');
    }
  };

  const handleAddBOMComponent = () => {
    setBomForm(prev => ({
      ...prev,
      components: [...prev.components, { itemCode: '', quantity: 1.0, uom: 'piece' }]
    }));
  };

  const handleRemoveBOMComponent = (index: number) => {
    setBomForm(prev => ({
      ...prev,
      components: prev.components.filter((_, idx) => idx !== index)
    }));
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomForm.bomNumber || !bomForm.productItemCode) {
      toast.error('BOM Number and Product Code required');
      return;
    }
    try {
      await manufacturingService.createBom(bomForm);
      toast.success('Product BOM bill of materials registered!');
      setBomForm({ bomNumber: '', productItemCode: '', version: '1.0.0', components: [{ itemCode: '', quantity: 1.0, uom: 'piece' }] });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create BOM');
    }
  };

  const handleCreateWorkCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workCenterForm.code || !workCenterForm.name) {
      toast.error('Work center code and name required');
      return;
    }
    try {
      await manufacturingService.createWorkCenter(workCenterForm);
      toast.success('Work Center registered!');
      setWorkCenterForm({ code: '', name: '', department: '', capacity: 100.0, shiftSchedule: 'Morning,Evening' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create Work Center');
    }
  };

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineForm.machineCode || !machineForm.name) {
      toast.error('Machine code and name required');
      return;
    }
    try {
      await manufacturingService.createMachine(machineForm);
      toast.success('Equipment asset logged in machine registry!');
      setMachineForm({ machineCode: '', name: '', equipmentType: '', manufacturer: '', installationDate: '', maintenanceSchedule: '', calibrationStatus: 'calibrated', status: 'active' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to register machine');
    }
  };

  const handleAddOperation = () => {
    setRoutingForm(prev => ({
      ...prev,
      operations: [...prev.operations, {
        sequence: (prev.operations.length + 1) * 10,
        workCenterCode: '',
        machineCode: '',
        standardTime: 1.0,
        setupTime: 0.1,
        laborTime: 1.0,
        isInspectionPoint: false,
        outputQuantity: 1.0
      }]
    }));
  };

  const handleRemoveOperation = (index: number) => {
    setRoutingForm(prev => ({
      ...prev,
      operations: prev.operations.filter((_, idx) => idx !== index)
    }));
  };

  const handleCreateRouting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routingForm.code || !routingForm.productItemCode) {
      toast.error('Routing Code and Product Item required');
      return;
    }
    try {
      await manufacturingService.createRouting(routingForm);
      toast.success('Operations Routing Master registered!');
      setRoutingForm({ code: '', name: '', productItemCode: '', version: '1.0.0', operations: [{ sequence: 10, workCenterCode: '', machineCode: '', standardTime: 1.0, setupTime: 0.1, laborTime: 1.0, isInspectionPoint: false, outputQuantity: 1.0 }] });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create routing');
    }
  };

  const handleCreateProductionOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.orderNumber || !poForm.itemCode || !poForm.bomNumber || !poForm.routingCode || !poForm.plantCode) {
      toast.error('Complete all mandatory fields');
      return;
    }
    try {
      const res = await manufacturingService.createProductionOrder(poForm);
      if (res.warning) {
        toast.warning(res.warning);
      } else {
        toast.success('Production Order released to factory floor!');
      }
      setPoForm({ orderNumber: '', itemCode: '', bomNumber: '', routingCode: '', quantity: 10.0, plannedStart: '', plannedFinish: '', plantCode: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Verification error, check BOM/Routing registry compatibility');
    }
  };

  const handleReleaseWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!woForm.productionOrderId || !woForm.workCenterCode) {
      toast.error('Production order and work center selection required');
      return;
    }
    try {
      await manufacturingService.releaseWorkOrder(woForm);
      toast.success('Work Order generated & operators dispatched!');
      setWoForm({ productionOrderId: '', workCenterCode: '', machineCode: '', operatorId: '', plannedQuantity: 10.0 });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to release work order');
    }
  };

  const handleAddCompletionConsumption = () => {
    setCompletionForm(prev => ({
      ...prev,
      consumptions: [...prev.consumptions, { itemCode: '', batchNumber: '', serialNumber: '', quantityConsumed: 1.0, wasteQuantity: 0.0 }]
    }));
  };

  const handleRemoveCompletionConsumption = (index: number) => {
    setCompletionForm(prev => ({
      ...prev,
      consumptions: prev.consumptions.filter((_, idx) => idx !== index)
    }));
  };

  const handleCompleteWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrder) return;
    try {
      await manufacturingService.completeWorkOrder(selectedWorkOrder._id, completionForm);
      toast.success('Work Order completed! Costing and Warehouse inventory updated.');
      setSelectedWorkOrder(null);
      setCompletionForm({ producedQuantity: 10.0, scrapQuantity: 0.0, rejectedQuantity: 0.0, locationCode: '', remarks: '', consumptions: [{ itemCode: '', batchNumber: '', serialNumber: '', quantityConsumed: 1.0, wasteQuantity: 0.0 }] });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Completion execution failed');
    }
  };

  const handleRunMRP = async () => {
    setMrpRunning(true);
    try {
      const res = await manufacturingService.runMrp();
      setMrpProposals(res);
      toast.success('MRP calculation complete. Procurement actions proposed!');
    } catch {
      toast.error('Failed to run Material Requirements Planning');
    } finally {
      setMrpRunning(false);
    }
  };

  const handleQualitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qiForm.itemCode) {
      toast.error('Item code selection required');
      return;
    }
    try {
      const res = await manufacturingService.submitQualityInspection(qiForm);
      if (res.ncrId) {
        toast.warning(`Quality worksheet failed! Non-Conformance Report ${res.ncrId} logged.`);
      } else {
        toast.success('Quality sheet verified successfully!');
      }
      setQiForm({ workOrderNumber: '', itemCode: '', stage: 'final', result: 'pass', criteria: '', remarks: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Quality inspection failed');
    }
  };

  const handleCapaUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNcr) return;
    try {
      await manufacturingService.updateCapa(selectedNcr._id, capaForm);
      toast.success('CAPA details logged and NCR status updated!');
      setSelectedNcr(null);
      setCapaForm({ defectDetails: '', rootCause: '', correctiveAction: '', status: 'open' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'CAPA update failed');
    }
  };

  const handleScrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapForm.itemCode) {
      toast.error('Item selection required');
      return;
    }
    try {
      await manufacturingService.submitScrap(scrapForm);
      toast.success('Scrap disposal record logged!');
      setScrapForm({ workOrderNumber: '', itemCode: '', scrapCategory: 'material', quantity: 1.0, cost: 0.0, reason: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Scrap log failed');
    }
  };

  return (
    <PageContainer
      title="Manufacturing & Production Planning Workspace"
      subtitle="BOM specifications, MRP planners, operations routings, quality worksheets, NCR & OEE tracking."
      actions={
        <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
          Sync Database
        </Button>
      }
    >
      {/* Navigation sub tabs */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        {[
          { key: 'dashboard', label: 'Manufacturing Dashboard', icon: <Factory size={16} /> },
          { key: 'registry', label: 'Plants & Centers', icon: <Calendar size={16} /> },
          { key: 'specifications', label: 'BOM & Routings', icon: <ClipboardText size={16} /> },
          { key: 'orders', label: 'Shop Floor Orders', icon: <FileText size={16} /> },
          { key: 'quality', label: 'Quality & Scrap', icon: <CheckSquare size={16} /> },
          { key: 'oee', label: 'OEE & Analytics', icon: <Percent size={16} /> }
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

      {/* ── 1. DASHBOARD OVERVIEW ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-ag-primary/5 to-transparent border-ag-primary/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Average OEE Index</p>
                    <h3 className="text-3xl font-extrabold text-ag-primary mt-2">
                      {dashboard?.averageOEE ?? 82.5}%
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-primary/10 rounded-xl text-ag-primary">
                    <Percent size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Overall availability × performance × quality factors
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-ag-accent-coral/5 to-transparent border-ag-accent-coral/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Scrap Value Loss</p>
                    <h3 className="text-3xl font-extrabold text-ag-coral mt-2">
                      ₹{(dashboard?.scrapCostTotal ?? 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-accent-coral/10 rounded-xl text-ag-coral">
                    <Warning size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Wasted raw materials cost across operations
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Running Work Orders</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {dashboard?.runningWorkOrdersCount ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-surface-3 rounded-xl text-ag-ink-2">
                    <Wrench size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Active job sheets on the shop floor
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Active Plants</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {dashboard?.totalPlants ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-surface-3 rounded-xl text-ag-ink-2">
                    <Factory size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Functional manufacturing facilities configured
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-2">
              <CardHeader title="Current Production Orders Status" subtitle="Overview of PO status records in the database." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                      <th className="p-4">PO Number</th>
                      <th className="p-4">Finished Product</th>
                      <th className="p-4">Target Quantity</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.activeOrders ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-ag-ink-3">No active production runs currently.</td>
                      </tr>
                    ) : (
                      (dashboard?.activeOrders ?? []).map((o: any) => (
                        <tr key={o.orderNumber} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{o.orderNumber}</td>
                          <td className="p-4 text-ag-ink font-semibold">{o.productName}</td>
                          <td className="p-4 text-ag-ink-2">{o.quantity} units</td>
                          <td className="p-4"><StatusBadge status={o.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="AI Assistant Alerts" subtitle="Diagnostic maintenance and planning forecasts." />
              <div className="p-6 space-y-4">
                {maintenanceAlerts.filter(a => a.failureProbability > 50).map((alert, idx) => (
                  <div key={idx} className="p-4 bg-ag-accent-coral/5 border border-ag-accent-coral/20 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-ag-coral">
                      <span className="flex items-center gap-1"><Cpu size={16} /> Failure Warning</span>
                      <span>{alert.failureProbability}% Probability</span>
                    </div>
                    <p className="text-xs font-bold text-ag-ink">{alert.machineName} ({alert.machineCode})</p>
                    <p className="text-[11px] text-ag-ink-3">Priority: <span className="uppercase text-ag-coral font-bold">{alert.maintenancePriority}</span> • Recommended: {alert.recommendedWindow}</p>
                  </div>
                ))}
                {maintenanceAlerts.filter(a => a.failureProbability > 50).length === 0 && (
                  <div className="p-4 bg-ag-primary/5 border border-ag-primary/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-1 text-xs font-bold text-ag-primary"><Sparkle size={16} /> All Systems Nominal</div>
                    <p className="text-xs text-ag-ink-3">No predictive maintenance warnings generated by AI health score analyzer.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── 2. PLANTS & CENTERS REGISTRIES ── */}
      {activeTab === 'registry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Manufacturing Plants List" subtitle="Setup properties of registered factory setups." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Plant Code</th>
                      <th className="p-4">Plant Name</th>
                      <th className="p-4">Address</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-ag-ink-3">No manufacturing plants configured.</td>
                      </tr>
                    ) : (
                      plants.map((p) => (
                        <tr key={p._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{p.code}</td>
                          <td className="p-4 font-bold text-ag-ink">{p.name}</td>
                          <td className="p-4 text-ag-ink-2">{p.address || 'N/A'}</td>
                          <td className="p-4"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Factory Work Centers" subtitle="Operational work centers tracking throughput capacities." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Center Code</th>
                      <th className="p-4">Center Name</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Daily capacity limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workCenters.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-ag-ink-3">No work centers configured.</td>
                      </tr>
                    ) : (
                      workCenters.map((wc) => (
                        <tr key={wc._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{wc.code}</td>
                          <td className="p-4 font-bold text-ag-ink">{wc.name}</td>
                          <td className="p-4 text-ag-ink-2">{wc.department || 'N/A'}</td>
                          <td className="p-4 text-ag-ink-2">{wc.capacity} units/day</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Equipment & Machine Assets" subtitle="Calibration and status registers of mechanical units." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Machine Code</th>
                      <th className="p-4">Machine Name</th>
                      <th className="p-4">Equipment Type</th>
                      <th className="p-4">Calibration Status</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No machines registered.</td>
                      </tr>
                    ) : (
                      machines.map((m) => (
                        <tr key={m._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{m.machineCode}</td>
                          <td className="p-4 font-bold text-ag-ink">{m.name}</td>
                          <td className="p-4 text-ag-ink-2">{m.equipmentType || 'N/A'}</td>
                          <td className="p-4 text-ag-ink-2">{m.calibrationStatus}</td>
                          <td className="p-4"><StatusBadge status={m.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader title="Register Plant" subtitle="Add new manufacturing workspace layout." />
              <form className="p-6 space-y-4" onSubmit={handleCreatePlant}>
                <Input
                  label="Plant Code *"
                  placeholder="e.g. PLANT-IND"
                  value={plantForm.code}
                  onChange={(e) => setPlantForm({ ...plantForm, code: e.target.value })}
                />
                <Input
                  label="Plant Name *"
                  placeholder="e.g. Industrial Plant India"
                  value={plantForm.name}
                  onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                />
                <Input
                  label="Address"
                  placeholder="e.g. Phase 2 Industrial Area"
                  value={plantForm.address}
                  onChange={(e) => setPlantForm({ ...plantForm, address: e.target.value })}
                />
                <Button type="submit" className="w-full">Create Plant</Button>
              </form>
            </Card>

            <Card>
              <CardHeader title="Create Shift Calendar" subtitle="Configure working parameters for shifts." />
              <form className="p-6 space-y-4" onSubmit={handleCreateCalendar}>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Target Plant *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={calendarForm.plantId}
                    onChange={(e) => setCalendarForm({ ...calendarForm, plantId: e.target.value })}
                  >
                    <option value="">Select Plant</option>
                    {plants.map((p) => (
                      <option key={p._id} value={p.code}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Calendar Name *"
                  placeholder="e.g. General Standard Calendar"
                  value={calendarForm.name}
                  onChange={(e) => setCalendarForm({ ...calendarForm, name: e.target.value })}
                />
                <Input
                  label="Working Days"
                  placeholder="e.g. Monday,Tuesday,Wednesday"
                  value={calendarForm.workingDays}
                  onChange={(e) => setCalendarForm({ ...calendarForm, workingDays: e.target.value })}
                />
                <Button type="submit" className="w-full">Create Calendar</Button>
              </form>
            </Card>

            <Card>
              <CardHeader title="Register Work Center" subtitle="Add workshop production capacity units." />
              <form className="p-6 space-y-4" onSubmit={handleCreateWorkCenter}>
                <Input
                  label="Center Code *"
                  placeholder="e.g. WC-ASM"
                  value={workCenterForm.code}
                  onChange={(e) => setWorkCenterForm({ ...workCenterForm, code: e.target.value })}
                />
                <Input
                  label="Center Name *"
                  placeholder="e.g. Assembly Station 1"
                  value={workCenterForm.name}
                  onChange={(e) => setWorkCenterForm({ ...workCenterForm, name: e.target.value })}
                />
                <Input
                  label="Department"
                  placeholder="e.g. Production Assembly"
                  value={workCenterForm.department}
                  onChange={(e) => setWorkCenterForm({ ...workCenterForm, department: e.target.value })}
                />
                <Input
                  label="Daily Capacity *"
                  type="number"
                  value={workCenterForm.capacity}
                  onChange={(e) => setWorkCenterForm({ ...workCenterForm, capacity: Number(e.target.value) })}
                />
                <Button type="submit" className="w-full">Create Work Center</Button>
              </form>
            </Card>

            <Card>
              <CardHeader title="Register Machine" subtitle="Record new production asset details." />
              <form className="p-6 space-y-4" onSubmit={handleCreateMachine}>
                <Input
                  label="Machine Code *"
                  placeholder="e.g. MAC-CNC"
                  value={machineForm.machineCode}
                  onChange={(e) => setMachineForm({ ...machineForm, machineCode: e.target.value })}
                />
                <Input
                  label="Machine Name *"
                  placeholder="e.g. CNC Cutting Unit 5"
                  value={machineForm.name}
                  onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                />
                <Input
                  label="Equipment Type"
                  placeholder="e.g. Heavy Duty CNC Machine"
                  value={machineForm.equipmentType}
                  onChange={(e) => setMachineForm({ ...machineForm, equipmentType: e.target.value })}
                />
                <Input
                  label="Manufacturer"
                  placeholder="e.g. Haas Automation"
                  value={machineForm.manufacturer}
                  onChange={(e) => setMachineForm({ ...machineForm, manufacturer: e.target.value })}
                />
                <Button type="submit" className="w-full">Register Machine</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 3. BOM & ROUTINGS SPECIFICATIONS ── */}
      {activeTab === 'specifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Product Bills of Materials (BOM)" subtitle="Product composition structures defined in master databases." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">BOM Number</th>
                      <th className="p-4">Target Product</th>
                      <th className="p-4">Version</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boms.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-ag-ink-3">No BOM records created yet.</td>
                      </tr>
                    ) : (
                      boms.map((b) => (
                        <tr key={b._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{b.bomNumber}</td>
                          <td className="p-4 font-bold text-ag-ink">{b.productName} ({b.productCode})</td>
                          <td className="p-4 text-ag-ink-2">V{b.version}</td>
                          <td className="p-4"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Operations Routing Masters" subtitle="Step-by-step processing paths registered for finished items." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Routing Code</th>
                      <th className="p-4">Routing Name</th>
                      <th className="p-4">Finished Product</th>
                      <th className="p-4">Version</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-ag-ink-3">No routing paths configured.</td>
                      </tr>
                    ) : (
                      routings.map((r) => (
                        <tr key={r._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{r.code}</td>
                          <td className="p-4 font-bold text-ag-ink">{r.name}</td>
                          <td className="p-4 text-ag-ink-2">{r.productName} ({r.productCode})</td>
                          <td className="p-4 text-ag-ink-2">V{r.version}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader title="Create Product BOM" subtitle="Design single or multi-level raw material dependencies." />
              <form className="p-6 space-y-4" onSubmit={handleCreateBOM}>
                <Input
                  label="BOM Number *"
                  placeholder="e.g. BOM-PROD-A"
                  value={bomForm.bomNumber}
                  onChange={(e) => setBomForm({ ...bomForm, bomNumber: e.target.value })}
                />
                <Input
                  label="Product Item Code *"
                  placeholder="e.g. FG-CABLE-01"
                  value={bomForm.productItemCode}
                  onChange={(e) => setBomForm({ ...bomForm, productItemCode: e.target.value })}
                />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider">Components List</label>
                    <Button type="button" variant="secondary" className="h-8 text-[11px]" onClick={handleAddBOMComponent} icon={<Plus size={12} />}>
                      Add Component
                    </Button>
                  </div>
                  {bomForm.components.map((comp, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        placeholder="Item Code"
                        value={comp.itemCode}
                        onChange={(e) => {
                          const updated = [...bomForm.components];
                          updated[idx].itemCode = e.target.value;
                          setBomForm({ ...bomForm, components: updated });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={comp.quantity}
                        onChange={(e) => {
                          const updated = [...bomForm.components];
                          updated[idx].quantity = Number(e.target.value);
                          setBomForm({ ...bomForm, components: updated });
                        }}
                      />
                      {bomForm.components.length > 1 && (
                        <button type="button" className="text-ag-coral p-2 hover:bg-ag-surface-3 rounded-lg" onClick={() => handleRemoveBOMComponent(idx)}>
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full">Register BOM</Button>
              </form>
            </Card>

            <Card>
              <CardHeader title="Configure Routing Steps" subtitle="Assign sequential machine and center runtime operations." />
              <form className="p-6 space-y-4" onSubmit={handleCreateRouting}>
                <Input
                  label="Routing Code *"
                  placeholder="e.g. ROUTE-FG-01"
                  value={routingForm.code}
                  onChange={(e) => setRoutingForm({ ...routingForm, code: e.target.value })}
                />
                <Input
                  label="Routing Name *"
                  placeholder="e.g. Cable Processing Sequence"
                  value={routingForm.name}
                  onChange={(e) => setRoutingForm({ ...routingForm, name: e.target.value })}
                />
                <Input
                  label="Product Item Code *"
                  placeholder="e.g. FG-CABLE-01"
                  value={routingForm.productItemCode}
                  onChange={(e) => setRoutingForm({ ...routingForm, productItemCode: e.target.value })}
                />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider">Operations Steps</label>
                    <Button type="button" variant="secondary" className="h-8 text-[11px]" onClick={handleAddOperation} icon={<Plus size={12} />}>
                      Add Step
                    </Button>
                  </div>
                  {routingForm.operations.map((op, idx) => (
                    <div key={idx} className="p-3 bg-ag-surface-2 border border-ag-border rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>Seq #{op.sequence}</span>
                        {routingForm.operations.length > 1 && (
                          <button type="button" className="text-ag-coral" onClick={() => handleRemoveOperation(idx)}>
                            Remove
                          </button>
                        )}
                      </div>
                      <Input
                        placeholder="Work Center Code"
                        value={op.workCenterCode}
                        onChange={(e) => {
                          const updated = [...routingForm.operations];
                          updated[idx].workCenterCode = e.target.value;
                          setRoutingForm({ ...routingForm, operations: updated });
                        }}
                      />
                      <Input
                        placeholder="Machine Code (Optional)"
                        value={op.machineCode}
                        onChange={(e) => {
                          const updated = [...routingForm.operations];
                          updated[idx].machineCode = e.target.value;
                          setRoutingForm({ ...routingForm, operations: updated });
                        }}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Setup Hrs"
                          type="number"
                          value={op.setupTime}
                          onChange={(e) => {
                            const updated = [...routingForm.operations];
                            updated[idx].setupTime = Number(e.target.value);
                            setRoutingForm({ ...routingForm, operations: updated });
                          }}
                        />
                        <Input
                          placeholder="Standard Hrs"
                          type="number"
                          value={op.standardTime}
                          onChange={(e) => {
                            const updated = [...routingForm.operations];
                            updated[idx].standardTime = Number(e.target.value);
                            setRoutingForm({ ...routingForm, operations: updated });
                          }}
                        />
                        <Input
                          placeholder="Labor Hrs"
                          type="number"
                          value={op.laborTime}
                          onChange={(e) => {
                            const updated = [...routingForm.operations];
                            updated[idx].laborTime = Number(e.target.value);
                            setRoutingForm({ ...routingForm, operations: updated });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full">Create Routing</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 4. SHOP FLOOR ORDERS & EXECUTION ── */}
      {activeTab === 'orders' && (
        <div className="space-y-8">
          <div className="flex gap-4 items-center">
            <Button onClick={handleRunMRP} disabled={mrpRunning} icon={<Calculator size={18} />}>
              {mrpRunning ? 'Calculating MRP...' : 'Regenerate Material Requirements (MRP)'}
            </Button>
          </div>

          {mrpProposals.length > 0 && (
            <Card className="border-ag-primary/30 bg-ag-primary/5">
              <CardHeader title="MRP Procurement and Shortage Proposals" subtitle="Identified shortages and purchase recommendations based on active orders." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Item Catalog</th>
                      <th className="p-4">Required Quantity</th>
                      <th className="p-4">On Hand Stock</th>
                      <th className="p-4">Shortage Quantity</th>
                      <th className="p-4">Action Proposal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mrpProposals.map((prop, idx) => (
                      <tr key={idx} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                        <td className="p-4">
                          <span className="font-bold text-ag-ink block">{prop.itemName}</span>
                          <span className="text-[10px] text-ag-ink-3">Code: {prop.itemCode}</span>
                        </td>
                        <td className="p-4 text-ag-ink-2">{prop.requiredQuantity} units</td>
                        <td className="p-4 text-ag-ink-2">{prop.onHandQuantity} units</td>
                        <td className="p-4 text-ag-coral font-bold">{prop.shortageQuantity} units</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            prop.shortageQuantity > 0 ? 'bg-ag-accent-coral/10 text-ag-coral' : 'bg-ag-primary/10 text-ag-primary'
                          }`}>
                            {prop.actionRecommended}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader title="Released Production Orders Ledger" subtitle="Released master production run requests." />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                        <th className="p-4">Order Details</th>
                        <th className="p-4">Parameters</th>
                        <th className="p-4">Timeline</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionOrders.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-ag-ink-3">No production orders launched.</td>
                        </tr>
                      ) : (
                        productionOrders.map((po) => (
                          <tr key={po._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                            <td className="p-4">
                              <span className="font-mono font-bold text-ag-primary block">{po.orderNumber}</span>
                              <span className="text-[10px] text-ag-ink font-semibold">{po.productName} ({po.productCode})</span>
                            </td>
                            <td className="p-4">
                              <span className="text-ag-ink block">Qty: {po.quantity} units</span>
                              <span className="text-[10px] text-ag-ink-3">Plant: {po.plantCode}</span>
                            </td>
                            <td className="p-4 text-ag-ink-3 text-[10px]">
                              <span>Start: {po.plannedStart || 'N/A'}</span>
                              <span className="block">Finish: {po.plannedFinish || 'N/A'}</span>
                            </td>
                            <td className="p-4"><StatusBadge status={po.status} /></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <CardHeader title="Work Orders Sheets" subtitle="Individual job worksheets distributed to machines." />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                        <th className="p-4">WO Code</th>
                        <th className="p-4">Parent PO</th>
                        <th className="p-4">Allocations</th>
                        <th className="p-4">Quantities</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-ag-ink-3">No work orders running on floor machines.</td>
                        </tr>
                      ) : (
                        workOrders.map((wo) => (
                          <tr key={wo._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                            <td className="p-4">
                              <span className="font-mono font-bold text-ag-primary block">{wo.workOrderNumber}</span>
                              <span className="text-[10px] text-ag-ink font-semibold">{wo.productName}</span>
                            </td>
                            <td className="p-4 font-mono font-bold text-ag-ink-2">{wo.productionOrderNumber}</td>
                            <td className="p-4">
                              <span className="text-ag-ink block">Center: {wo.workCenterCode}</span>
                              {wo.machineCode && <span className="text-[10px] text-ag-ink-3">Machine: {wo.machineCode}</span>}
                            </td>
                            <td className="p-4">
                              <span className="text-ag-ink block">Planned: {wo.plannedQuantity}</span>
                              <span className="text-[10px] text-ag-ink-3">Produced: {wo.producedQuantity} / Scrap: {wo.scrapQuantity}</span>
                            </td>
                            <td className="p-4">
                              {wo.status === 'running' ? (
                                <Button
                                  variant="secondary"
                                  className="h-8 text-[11px]"
                                  onClick={() => {
                                    setSelectedWorkOrder(wo);
                                    setCompletionForm({
                                      producedQuantity: wo.plannedQuantity,
                                      scrapQuantity: 0.0,
                                      rejectedQuantity: 0.0,
                                      locationCode: '',
                                      remarks: '',
                                      consumptions: [{ itemCode: '', batchNumber: '', serialNumber: '', quantityConsumed: 1.0, wasteQuantity: 0.0 }]
                                    });
                                  }}
                                >
                                  Complete WO
                                </Button>
                              ) : (
                                <StatusBadge status={wo.status} />
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader title="Release Production Order" subtitle="Initiate dynamic factory production run schedules." />
                <form className="p-6 space-y-4" onSubmit={handleCreateProductionOrder}>
                  <Input
                    label="PO Order Number *"
                    placeholder="e.g. PO-001"
                    value={poForm.orderNumber}
                    onChange={(e) => setPoForm({ ...poForm, orderNumber: e.target.value })}
                  />
                  <Input
                    label="Product Item Code *"
                    placeholder="e.g. FG-CABLE-01"
                    value={poForm.itemCode}
                    onChange={(e) => setPoForm({ ...poForm, itemCode: e.target.value })}
                  />
                  <Input
                    label="BOM Number *"
                    placeholder="e.g. BOM-PROD-A"
                    value={poForm.bomNumber}
                    onChange={(e) => setPoForm({ ...poForm, bomNumber: e.target.value })}
                  />
                  <Input
                    label="Routing Code *"
                    placeholder="e.g. ROUTE-FG-01"
                    value={poForm.routingCode}
                    onChange={(e) => setPoForm({ ...poForm, routingCode: e.target.value })}
                  />
                  <Input
                    label="Quantity *"
                    type="number"
                    value={poForm.quantity}
                    onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
                  />
                  <Input
                    label="Target Plant Code *"
                    placeholder="e.g. PLANT-IND"
                    value={poForm.plantCode}
                    onChange={(e) => setPoForm({ ...poForm, plantCode: e.target.value })}
                  />
                  <Button type="submit" className="w-full">Release Order</Button>
                </form>
              </Card>

              <Card>
                <CardHeader title="Dispatch Work Order" subtitle="Deploy PO quantities directly onto machine queues." />
                <form className="p-6 space-y-4" onSubmit={handleReleaseWorkOrder}>
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Production Order *</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={woForm.productionOrderId}
                      onChange={(e) => setWoForm({ ...woForm, productionOrderId: e.target.value })}
                    >
                      <option value="">Select PO</option>
                      {productionOrders.filter(p => p.status === 'released').map((p) => (
                        <option key={p._id} value={p._id}>{p.orderNumber} - {p.productName}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Work Center Code *"
                    placeholder="e.g. WC-ASM"
                    value={woForm.workCenterCode}
                    onChange={(e) => setWoForm({ ...woForm, workCenterCode: e.target.value })}
                  />
                  <Input
                    label="Machine Code (Optional)"
                    placeholder="e.g. MAC-CNC"
                    value={woForm.machineCode}
                    onChange={(e) => setWoForm({ ...woForm, machineCode: e.target.value })}
                  />
                  <Input
                    label="Planned Dispatch Quantity *"
                    type="number"
                    value={woForm.plannedQuantity}
                    onChange={(e) => setWoForm({ ...woForm, plannedQuantity: Number(e.target.value) })}
                  />
                  <Button type="submit" className="w-full">Dispatch Job</Button>
                </form>
              </Card>
            </div>
          </div>

          {/* Complete Work Order Modal */}
          {selectedWorkOrder && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <Card className="max-w-2xl w-full bg-ag-surface-1 max-h-[90vh] overflow-y-auto">
                <CardHeader title={`Complete Job: ${selectedWorkOrder.workOrderNumber}`} subtitle={`Register material consumptions and good outputs for finished items.`} />
                <form className="p-6 space-y-4" onSubmit={handleCompleteWorkOrder}>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Produced Qty *"
                      type="number"
                      value={completionForm.producedQuantity}
                      onChange={(e) => setCompletionForm({ ...completionForm, producedQuantity: Number(e.target.value) })}
                    />
                    <Input
                      label="Scrap Qty"
                      type="number"
                      value={completionForm.scrapQuantity}
                      onChange={(e) => setCompletionForm({ ...completionForm, scrapQuantity: Number(e.target.value) })}
                    />
                    <Input
                      label="Rejected Qty"
                      type="number"
                      value={completionForm.rejectedQuantity}
                      onChange={(e) => setCompletionForm({ ...completionForm, rejectedQuantity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider">Raw Material Batches Consumed</label>
                      <Button type="button" variant="secondary" className="h-8 text-[11px]" onClick={handleAddCompletionConsumption} icon={<Plus size={12} />}>
                        Add Material
                      </Button>
                    </div>
                    {completionForm.consumptions.map((cons, idx) => (
                      <div key={idx} className="p-3 bg-ag-surface-2 border border-ag-border rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span>Material #{idx + 1}</span>
                          {completionForm.consumptions.length > 1 && (
                            <button type="button" className="text-ag-coral" onClick={() => handleRemoveCompletionConsumption(idx)}>
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Item Code *"
                            value={cons.itemCode}
                            onChange={(e) => {
                              const updated = [...completionForm.consumptions];
                              updated[idx].itemCode = e.target.value;
                              setCompletionForm({ ...completionForm, consumptions: updated });
                            }}
                          />
                          <Input
                            placeholder="Batch Number"
                            value={cons.batchNumber}
                            onChange={(e) => {
                              const updated = [...completionForm.consumptions];
                              updated[idx].batchNumber = e.target.value;
                              setCompletionForm({ ...completionForm, consumptions: updated });
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Qty Consumed *"
                            type="number"
                            value={cons.quantityConsumed}
                            onChange={(e) => {
                              const updated = [...completionForm.consumptions];
                              updated[idx].quantityConsumed = Number(e.target.value);
                              setCompletionForm({ ...completionForm, consumptions: updated });
                            }}
                          />
                          <Input
                            placeholder="Waste Qty"
                            type="number"
                            value={cons.wasteQuantity}
                            onChange={(e) => {
                              const updated = [...completionForm.consumptions];
                              updated[idx].wasteQuantity = Number(e.target.value);
                              setCompletionForm({ ...completionForm, consumptions: updated });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Input
                    label="Remarks / Notes"
                    placeholder="e.g. standard shift completion without downtime events."
                    value={completionForm.remarks}
                    onChange={(e) => setCompletionForm({ ...completionForm, remarks: e.target.value })}
                  />

                  <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={() => setSelectedWorkOrder(null)}>Cancel</Button>
                    <Button type="submit">Complete & Record Journal</Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── 5. QUALITY & SCRAP LOGS ── */}
      {activeTab === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Quality Inspections Registry" subtitle="Completed quality check worksheets cataloged." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">QI Number</th>
                      <th className="p-4">Job / Item</th>
                      <th className="p-4">Stage</th>
                      <th className="p-4">Inspector</th>
                      <th className="p-4">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No inspections recorded.</td>
                      </tr>
                    ) : (
                      inspections.map((qi) => (
                        <tr key={qi._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{qi.inspectionNumber}</td>
                          <td className="p-4">
                            <span className="font-bold text-ag-ink block">{qi.productName}</span>
                            {qi.workOrderNumber && <span className="text-[10px] font-mono text-ag-ink-3">WO: {qi.workOrderNumber}</span>}
                          </td>
                          <td className="p-4 capitalize">{qi.stage}</td>
                          <td className="p-4 text-ag-ink-2">{qi.inspectorEmail}</td>
                          <td className="p-4"><StatusBadge status={qi.result} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Non-Conformance Reports (NCR) & CAPA" subtitle="Discovered defects and corrective preventive actions logging." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">NCR Number</th>
                      <th className="p-4">Defect Details</th>
                      <th className="p-4">Action CAPA</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ncrs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No Non-Conformance Reports registered.</td>
                      </tr>
                    ) : (
                      ncrs.map((n) => (
                        <tr key={n._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{n.ncrNumber}</td>
                          <td className="p-4 text-ag-ink font-semibold">{n.defectDetails}</td>
                          <td className="p-4 text-ag-ink-2">{n.correctiveAction || 'No Action Mapped'}</td>
                          <td className="p-4"><StatusBadge status={n.status} /></td>
                          <td className="p-4">
                            {n.status === 'open' ? (
                              <Button
                                variant="secondary"
                                className="h-8 text-[11px]"
                                onClick={() => {
                                  setSelectedNcr(n);
                                  setCapaForm({
                                    defectDetails: n.defectDetails,
                                    rootCause: n.rootCause || '',
                                    correctiveAction: n.correctiveAction || '',
                                    status: n.status
                                  });
                                }}
                              >
                                CAPA Update
                              </Button>
                            ) : (
                              <span>Closed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Scrap Management Logs" subtitle="Disposed scrap and waste values logged." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Scrap Code</th>
                      <th className="p-4">Item Details</th>
                      <th className="p-4">Quantity / Cost</th>
                      <th className="p-4">Reason / Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scraps.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-ag-ink-3">No scrap transactions registered.</td>
                      </tr>
                    ) : (
                      scraps.map((s) => (
                        <tr key={s._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{s.scrapNumber}</td>
                          <td className="p-4 font-bold text-ag-ink">{s.productName}</td>
                          <td className="p-4">
                            <span className="block text-ag-ink-2">{s.quantity} units</span>
                            <span className="text-[10px] text-ag-coral font-bold">₹{s.cost.toLocaleString()}</span>
                          </td>
                          <td className="p-4">
                            <span className="capitalize block">{s.scrapCategory}</span>
                            <span className="text-[10px] text-ag-ink-3">{s.reason}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader title="Submit Quality Inspection" subtitle="Record details of quality checks worksheets." />
              <form className="p-6 space-y-4" onSubmit={handleQualitySubmit}>
                <Input
                  label="Work Order Number"
                  placeholder="e.g. WO-0001 (Optional)"
                  value={qiForm.workOrderNumber}
                  onChange={(e) => setQiForm({ ...qiForm, workOrderNumber: e.target.value })}
                />
                <Input
                  label="Item Catalog Code *"
                  placeholder="e.g. FG-CABLE-01"
                  value={qiForm.itemCode}
                  onChange={(e) => setQiForm({ ...qiForm, itemCode: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">QI Stage *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={qiForm.stage}
                    onChange={(e) => setQiForm({ ...qiForm, stage: e.target.value })}
                  >
                    <option value="incoming">Incoming Raw Check</option>
                    <option value="in_process">In-Process Check</option>
                    <option value="final">Final Goods Check</option>
                    <option value="batch">Batch Audit Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">QI Result *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={qiForm.result}
                    onChange={(e) => setQiForm({ ...qiForm, result: e.target.value })}
                  >
                    <option value="pass">Pass</option>
                    <option value="conditional_pass">Conditional Pass</option>
                    <option value="rework">Needs Rework</option>
                    <option value="reject">Reject & Quarantine</option>
                  </select>
                </div>
                <Input
                  label="Inspection Remarks"
                  placeholder="Failed metrics: outer insulation thickness below limit."
                  value={qiForm.remarks}
                  onChange={(e) => setQiForm({ ...qiForm, remarks: e.target.value })}
                />
                <Button type="submit" className="w-full">Submit QI Sheet</Button>
              </form>
            </Card>

            <Card>
              <CardHeader title="Report Scrap Material" subtitle="Post scrap counts to waste valuation accounts." />
              <form className="p-6 space-y-4" onSubmit={handleScrapSubmit}>
                <Input
                  label="Work Order Number"
                  placeholder="e.g. WO-0001 (Optional)"
                  value={scrapForm.workOrderNumber}
                  onChange={(e) => setScrapForm({ ...scrapForm, workOrderNumber: e.target.value })}
                />
                <Input
                  label="Item Catalog Code *"
                  placeholder="e.g. RAW-COPPER-01"
                  value={scrapForm.itemCode}
                  onChange={(e) => setScrapForm({ ...scrapForm, itemCode: e.target.value })}
                />
                <Input
                  label="Scrapped Quantity *"
                  type="number"
                  value={scrapForm.quantity}
                  onChange={(e) => setScrapForm({ ...scrapForm, quantity: Number(e.target.value) })}
                />
                <Input
                  label="Reason for Scrap"
                  placeholder="e.g. machine setup calibration scrap"
                  value={scrapForm.reason}
                  onChange={(e) => setScrapForm({ ...scrapForm, reason: e.target.value })}
                />
                <Button type="submit" className="w-full">Submit Scrap Log</Button>
              </form>
            </Card>
          </div>

          {/* CAPA Update Modal */}
          {selectedNcr && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <Card className="max-w-md w-full bg-ag-surface-1">
                <CardHeader title={`CAPA Action Plan: ${selectedNcr.ncrNumber}`} subtitle="Log root cause diagnostics and corrective plans." />
                <form className="p-6 space-y-4" onSubmit={handleCapaUpdate}>
                  <Input
                    label="Defect Details"
                    disabled
                    value={capaForm.defectDetails}
                  />
                  <Input
                    label="Root Cause Diagnosis *"
                    placeholder="e.g. worn out extrusion tool head nozzle."
                    value={capaForm.rootCause}
                    onChange={(e) => setCapaForm({ ...capaForm, rootCause: e.target.value })}
                  />
                  <Input
                    label="Corrective / Preventive Action (CAPA) *"
                    placeholder="e.g. replaced tool head nozzle, scheduled monthly checks."
                    value={capaForm.correctiveAction}
                    onChange={(e) => setCapaForm({ ...capaForm, correctiveAction: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">NCR Status *</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={capaForm.status}
                      onChange={(e) => setCapaForm({ ...capaForm, status: e.target.value })}
                    >
                      <option value="open">Open (Under CAPA Formulation)</option>
                      <option value="under_review">Under QA Review</option>
                      <option value="closed">Closed (CAPA Resolved)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={() => setSelectedNcr(null)}>Cancel</Button>
                    <Button type="submit">Update CAPA & Close NCR</Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── 6. OEE METRICS & CAPACITY SIMULATION ── */}
      {activeTab === 'oee' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Equipment Uptime & OEE Indices" subtitle="Machine availability, performance, and quality logs." />
              <div className="p-6 space-y-5">
                {oeeMetrics.length === 0 ? (
                  <p className="text-xs text-ag-ink-3">No machine OEE logs registered.</p>
                ) : (
                  oeeMetrics.map((oee, idx) => (
                    <div key={idx} className="p-4 bg-ag-surface-2 border border-ag-border rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-ag-ink">{oee.machineName} ({oee.machineCode})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          oee.oee >= 85 ? 'bg-ag-primary/10 text-ag-primary' : 'bg-ag-accent-coral/10 text-ag-coral'
                        }`}>OEE Index: {oee.oee}%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-[10px] text-ag-ink-2">
                        <div className="space-y-1">
                          <span>Availability Rate</span>
                          <div className="w-full h-1.5 bg-ag-surface-3 rounded-full overflow-hidden">
                            <div className="h-full bg-ag-primary rounded-full" style={{ width: `${oee.availability}%` }} />
                          </div>
                          <span className="block font-bold">{oee.availability}%</span>
                        </div>
                        <div className="space-y-1">
                          <span>Performance Rate</span>
                          <div className="w-full h-1.5 bg-ag-surface-3 rounded-full overflow-hidden">
                            <div className="h-full bg-ag-primary rounded-full" style={{ width: `${oee.performance}%` }} />
                          </div>
                          <span className="block font-bold">{oee.performance}%</span>
                        </div>
                        <div className="space-y-1">
                          <span>Quality Output Rate</span>
                          <div className="w-full h-1.5 bg-ag-surface-3 rounded-full overflow-hidden">
                            <div className="h-full bg-ag-primary rounded-full" style={{ width: `${oee.quality}%` }} />
                          </div>
                          <span className="block font-bold">{oee.quality}%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Work Centers Load Capacity Planners" subtitle="Capacity utilizations and queue recommendation warnings." />
              <div className="p-6 space-y-4">
                {capacityPlanning.length === 0 ? (
                  <p className="text-xs text-ag-ink-3">No work centers load recorded.</p>
                ) : (
                  capacityPlanning.map((cap, idx) => (
                    <div key={idx} className="p-4 bg-ag-surface-2 border border-ag-border rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-ag-ink">{cap.workCenterName} ({cap.workCenterCode})</span>
                        <span className={`text-[10px] ${
                          cap.utilization > 100 ? 'text-ag-coral font-bold' : 'text-ag-ink-2'
                        }`}>Load: {cap.load} / Limit: {cap.capacity} ({cap.utilization.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-ag-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cap.utilization > 100 ? 'bg-ag-accent-coral' : 'bg-ag-primary'
                          }`}
                          style={{ width: `${Math.min(cap.utilization, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-ag-ink-3 italic mt-1">{cap.recommendation}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
