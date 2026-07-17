import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { supplyChainService } from '@/services/api.service';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import {
  Truck, Factory, Calendar, ClipboardText, FileText, CheckSquare,
  Percent, Warning, Sparkle, Plus, Trash, ArrowsClockwise,
  ArrowUpRight, ArrowDownRight, User, Cpu, Calculator, ChartBar,
  MapPin, Barcode, Users, Signature, ArrowsLeftRight, Bell
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function SupplyChainPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shipments' | 'dispatch' | 'fleet' | 'tracking' | 'returns' | 'rates' | 'loading'>('dashboard');

  // Data States
  const [dashboard, setDashboard] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [dcs, setDcs] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [trackingList, setTrackingList] = useState<any[]>([]);
  const [costs, setCosts] = useState<any>(null);
  const [optimization, setOptimization] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  // SCM Upgrades States
  const [carrierRates, setCarrierRates] = useState<any[]>([]);
  const [shipmentDelays, setShipmentDelays] = useState<any[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);

  // Forms States
  const [carrierRateForm, setCarrierRateForm] = useState({
    carrierId: '',
    originZone: 'North',
    destinationZone: 'South',
    ratePerKm: 15.0,
    ratePerKg: 2.5,
    baseCharge: 500.0,
    status: 'active'
  });

  const [delayAlertForm, setDelayAlertForm] = useState({
    delayType: 'breakdown',
    durationMinutes: 60,
    severity: 'medium',
    remarks: ''
  });

  const [containerLoadingForm, setContainerLoadingForm] = useState({
    shipmentId: '',
    vehicleId: ''
  });

  // Forms States
  const [nodeForm, setNodeForm] = useState({
    nodeCode: '',
    name: '',
    nodeType: 'warehouse',
    address: '',
    latitude: 19.0,
    longitude: 72.0
  });

  const [dcForm, setDcForm] = useState({
    centerCode: '',
    name: '',
    address: '',
    capacity: 2000.0,
    managerName: '',
    operatingHours: '08:00 - 20:00'
  });

  const [partnerForm, setPartnerForm] = useState({
    partnerCode: '',
    companyName: '',
    contactDetails: '',
    serviceAreas: 'Domestic',
    supportedVehicles: 'Truck, Van',
    slaTerms: '95% On-Time',
    insuranceInfo: 'Liability Cover',
    performanceRating: 5.0
  });

  const [carrierForm, setCarrierForm] = useState({
    carrierCode: '',
    name: '',
    carrierType: '3PL',
    contractVersion: 'v1.0',
    status: 'active'
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: 'Truck',
    capacityWeight: 5000.0,
    capacityVolume: 120.0,
    fuelType: 'Diesel',
    gpsDeviceId: '',
    driverId: '',
    status: 'available',
    maintenanceStatus: 'good'
  });

  const [driverForm, setDriverForm] = useState({
    driverNumber: '',
    name: '',
    licenseNumber: '',
    licenseExpiry: '',
    certifications: 'Heavy Transport License',
    contactPhone: '',
    assignedVehicleId: '',
    availabilityStatus: 'active',
    performanceRating: 5.0
  });

  const [shipmentForm, setShipmentForm] = useState({
    customerName: '',
    warehouseCode: 'WH-MUM',
    destinationAddress: '',
    carrierId: '',
    vehicleId: '',
    driverId: '',
    priority: 'medium',
    deliveryWindowStart: '',
    deliveryWindowEnd: '',
    itemCode: '',
    quantity: 1.0,
    weight: 0.0,
    volume: 0.0
  });

  const [dispatchForm, setDispatchForm] = useState({
    vehicleId: '',
    driverId: '',
    departureTime: '',
    expectedArrival: '',
    gatePassNumber: ''
  });

  const [routeForm, setRouteForm] = useState({
    legsSequence: 'WH-MUM -> HUB-PUNE -> CUSTOMER',
    totalDistance: 150.0,
    estimatedDuration: 4.5,
    optimized: true
  });

  const [telemetryForm, setTelemetryForm] = useState({
    latitude: 18.975,
    longitude: 72.825,
    speed: 55.0,
    status: 'in_transit'
  });

  const [podForm, setPodForm] = useState({
    signatureData: 'CUSTOMER_SIG_OK',
    customerSignerName: '',
    latitude: 19.076,
    longitude: 72.877,
    photoPath: '/uploads/pod_gate_confirm.jpg',
    otpCode: '',
    remarks: ''
  });

  const [returnForm, setReturnForm] = useState({
    originalShipmentId: '',
    itemCode: '',
    quantity: 1.0,
    returnReason: 'damaged_goods',
    inspectionRemarks: 'Box crushed during offloading'
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        dash, shipList, fleetList, driverList, nodeList, dcList, partList, carrList,
        analyticList, trackList, costList, optList, repList, rateList
      ] = await Promise.all([
        supplyChainService.getDashboard().catch(() => null),
        supplyChainService.getShipments().catch(() => []),
        supplyChainService.getVehicles().catch(() => []),
        supplyChainService.getDrivers().catch(() => []),
        supplyChainService.getNetworkNodes().catch(() => []),
        supplyChainService.getDCs().catch(() => []),
        supplyChainService.getPartners().catch(() => []),
        supplyChainService.getCarriers().catch(() => []),
        supplyChainService.getAnalytics().catch(() => null),
        supplyChainService.getTracking().catch(() => []),
        supplyChainService.getCosts().catch(() => null),
        supplyChainService.getOptimization().catch(() => null),
        supplyChainService.getReports().catch(() => []),
        supplyChainService.getCarrierRates().catch(() => [])
      ]);

      setDashboard(dash);
      setShipments(shipList);
      setVehicles(fleetList);
      setDrivers(driverList);
      setNodes(nodeList);
      setDcs(dcList);
      setPartners(partList);
      setCarriers(carrList);
      setAnalytics(analyticList);
      setTrackingList(trackList);
      setCosts(costList);
      setOptimization(optList);
      setReports(repList);
      setCarrierRates(rateList);
    } catch {
      toast.error('Failed to sync SCM database registries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Submissions
  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeForm.nodeCode || !nodeForm.name) {
      toast.error('Node Code and Name required');
      return;
    }
    try {
      await supplyChainService.createNetworkNode(nodeForm);
      toast.success('Supply Chain Network node logged!');
      setNodeForm({ nodeCode: '', name: '', nodeType: 'warehouse', address: '', latitude: 19.0, longitude: 72.0 });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add node');
    }
  };

  const handleCreateDC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dcForm.centerCode || !dcForm.name) {
      toast.error('Center Code and Name required');
      return;
    }
    try {
      await supplyChainService.createDC(dcForm);
      toast.success('Distribution Center catalog record configured!');
      setDcForm({ centerCode: '', name: '', address: '', capacity: 2000.0, managerName: '', operatingHours: '08:00 - 20:00' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add DC');
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.partnerCode || !partnerForm.companyName) {
      toast.error('Partner Code and Company Name required');
      return;
    }
    try {
      await supplyChainService.createPartner(partnerForm);
      toast.success('Logistics Partner SLA catalog details set!');
      setPartnerForm({ partnerCode: '', companyName: '', contactDetails: '', serviceAreas: 'Domestic', supportedVehicles: 'Truck, Van', slaTerms: '95% On-Time', insuranceInfo: 'Liability Cover', performanceRating: 5.0 });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add partner');
    }
  };

  const handleCreateCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierForm.carrierCode || !carrierForm.name) {
      toast.error('Carrier code and name required');
      return;
    }
    try {
      await supplyChainService.createCarrier(carrierForm);
      toast.success('Carrier registry details updated!');
      setCarrierForm({ carrierCode: '', name: '', carrierType: '3PL', contractVersion: 'v1.0', status: 'active' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add carrier');
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicleNumber) {
      toast.error('Vehicle registration number required');
      return;
    }
    try {
      await supplyChainService.createVehicle(vehicleForm);
      toast.success('Fleet vehicle registered and available!');
      setVehicleForm({ vehicleNumber: '', vehicleType: 'Truck', capacityWeight: 5000.0, capacityVolume: 120.0, fuelType: 'Diesel', gpsDeviceId: '', driverId: '', status: 'available', maintenanceStatus: 'good' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add vehicle');
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.driverNumber || !driverForm.name) {
      toast.error('Driver ID number and name required');
      return;
    }
    try {
      await supplyChainService.createDriver(driverForm);
      toast.success('Driver record mapped in ERP system!');
      setDriverForm({ driverNumber: '', name: '', licenseNumber: '', licenseExpiry: '', certifications: 'Heavy Transport License', contactPhone: '', assignedVehicleId: '', availabilityStatus: 'active', performanceRating: 5.0 });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add driver');
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentForm.customerName || !shipmentForm.destinationAddress || !shipmentForm.itemCode) {
      toast.error('Customer details and packaging item required');
      return;
    }
    try {
      await supplyChainService.createShipment({
        customerName: shipmentForm.customerName,
        warehouseCode: shipmentForm.warehouseCode,
        destinationAddress: shipmentForm.destinationAddress,
        carrierId: shipmentForm.carrierId || null,
        vehicleId: shipmentForm.vehicleId || null,
        driverId: shipmentForm.driverId || null,
        priority: shipmentForm.priority,
        deliveryWindowStart: shipmentForm.deliveryWindowStart || null,
        deliveryWindowEnd: shipmentForm.deliveryWindowEnd || null,
        items: [
          {
            itemCode: shipmentForm.itemCode,
            quantity: shipmentForm.quantity,
            weight: shipmentForm.weight,
            volume: shipmentForm.volume
          }
        ]
      });
      toast.success('SCM Shipment created successfully!');
      setShipmentForm({ customerName: '', warehouseCode: 'WH-MUM', destinationAddress: '', carrierId: '', vehicleId: '', driverId: '', priority: 'medium', deliveryWindowStart: '', deliveryWindowEnd: '', itemCode: '', quantity: 1.0, weight: 0.0, volume: 0.0 });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to plan shipment');
    }
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !dispatchForm.vehicleId || !dispatchForm.driverId) {
      toast.error('Select target shipment, vehicle, and driver');
      return;
    }
    try {
      await supplyChainService.confirmDispatch({
        shipmentId: selectedShipment._id,
        vehicleId: dispatchForm.vehicleId,
        driverId: dispatchForm.driverId,
        departureTime: dispatchForm.departureTime || null,
        expectedArrival: dispatchForm.expectedArrival || null,
        gatePassNumber: dispatchForm.gatePassNumber || null
      });
      toast.success('Shipment Dispatched! Inventory stock atomically updated.');
      setSelectedShipment(null);
      setDispatchForm({ vehicleId: '', driverId: '', departureTime: '', expectedArrival: '', gatePassNumber: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Dispatch rejected. Check vehicle status or stock levels.');
    }
  };

  const handleOptimizeRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    try {
      await supplyChainService.createRoute({
        shipmentId: selectedShipment._id,
        ...routeForm
      });
      toast.success('Delivery route sequence optimized with GPS data!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Route config failed');
    }
  };

  const handleTelemetrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !selectedShipment.vehicleId) {
      toast.error('Select active shipment in transit');
      return;
    }
    try {
      await supplyChainService.updateTelemetry({
        vehicleId: selectedShipment.vehicleId,
        shipmentId: selectedShipment._id,
        ...telemetryForm
      });
      toast.success('Live GPS coordinates telemetry logged!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update live coordinates');
    }
  };

  const handlePodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    try {
      await supplyChainService.submitPod({
        shipmentId: selectedShipment._id,
        ...podForm
      });
      toast.success('Proof of Delivery (POD) verified! Shipment closed.');
      setSelectedShipment(null);
      setPodForm({ signatureData: 'CUSTOMER_SIG_OK', customerSignerName: '', latitude: 19.076, longitude: 72.877, photoPath: '/uploads/pod_gate_confirm.jpg', otpCode: '', remarks: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit POD');
    }
  };

  const handleReturnLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForm.itemCode) {
      toast.error('Item code required');
      return;
    }
    try {
      await supplyChainService.processReturn(returnForm);
      toast.success('Reverse return received & restocked in inventory!');
      setReturnForm({ originalShipmentId: '', itemCode: '', quantity: 1.0, returnReason: 'damaged_goods', inspectionRemarks: 'Box crushed during offloading' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to log return');
    }
  };

  const handleRunOptimization = async () => {
    setAiOptimizing(true);
    try {
      await supplyChainService.simulateAI();
      toast.success('AI dynamic route optimizer & consolidation schedules updated!');
    } catch {
      toast.error('AI logistics model run failed');
    } finally {
      setAiOptimizing(false);
    }
  };

  const handleCreateCarrierRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierRateForm.carrierId || !carrierRateForm.originZone || !carrierRateForm.destinationZone) {
      toast.error('Carrier ID, Origin and Destination zones required');
      return;
    }
    try {
      await supplyChainService.createCarrierRate(carrierRateForm);
      toast.success('Carrier Rate contract details set successfully!');
      setCarrierRateForm({ carrierId: '', originZone: 'North', destinationZone: 'South', ratePerKm: 15.0, ratePerKg: 2.5, baseCharge: 500.0, status: 'active' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to map carrier rate sheet');
    }
  };

  const handleGenerateLoadingPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerLoadingForm.shipmentId || !containerLoadingForm.vehicleId) {
      toast.error('Select Shipment and Fleet Vehicle');
      return;
    }
    try {
      const plan = await supplyChainService.generateLoadingPlan(containerLoadingForm);
      setLoadingPlan(plan);
      toast.success('3D Volumetric packing loading instructions calculated!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Packing solver failed');
    }
  };

  const handleSelectShipmentForDelays = async (shipment: any) => {
    setSelectedShipment(shipment);
    try {
      const delays = await supplyChainService.getShipmentDelays(shipment._id);
      setShipmentDelays(delays);
    } catch {
      setShipmentDelays([]);
    }
  };

  const handleCreateDelayAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) {
      toast.error('Select an active shipment first');
      return;
    }
    try {
      await supplyChainService.createShipmentDelay(selectedShipment._id, delayAlertForm);
      toast.success('Delay exception reported! Status set to DELAYED.');
      setDelayAlertForm({ delayType: 'breakdown', durationMinutes: 60, severity: 'medium', remarks: '' });
      handleSelectShipmentForDelays(selectedShipment);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to log delay');
    }
  };

  const handleResolveDelayAlert = async (alertId: string) => {
    try {
      await supplyChainService.resolveShipmentDelay(alertId, { resolved: true, remarks: 'Cleared' });
      toast.success('In-transit delay exception resolved!');
      if (selectedShipment) {
        handleSelectShipmentForDelays(selectedShipment);
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to resolve delay');
    }
  };

  return (
    <PageContainer
      title="Supply Chain, Logistics & Transportation Management System"
      subtitle="Optimize distribution networks, plan shipments, assign vehicle loading scans, track GPS ETAs, and process reverse returns."
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
            Sync Registries
          </Button>
          <Button variant="primary" onClick={handleRunOptimization} loading={aiOptimizing} icon={<Sparkle size={18} />}>
            Run AI Dispatch Optimizer
          </Button>
        </div>
      }
    >
      {/* Tab Selectors */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        {[
          { key: 'dashboard', label: 'Executive Dashboard', icon: <ChartBar size={16} /> },
          { key: 'shipments', label: 'Shipment Planner', icon: <ClipboardText size={16} /> },
          { key: 'dispatch', label: 'Dispatch Center', icon: <Barcode size={16} /> },
          { key: 'fleet', label: 'Fleet & Drivers', icon: <Truck size={16} /> },
          { key: 'tracking', label: 'Route & Tracking', icon: <MapPin size={16} /> },
          { key: 'returns', label: 'Returns & Reverse', icon: <ArrowsLeftRight size={16} /> },
          { key: 'rates', label: 'Carrier Rate Cards', icon: <Percent size={16} /> },
          { key: 'loading', label: 'Volumetric Loading', icon: <Cpu size={16} /> }
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
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Shipments Mapped</p>
                    <h3 className="text-3xl font-extrabold text-ag-primary mt-2">
                      {dashboard?.shipmentsToday ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-primary/10 rounded-xl text-ag-primary">
                    <ClipboardText size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3 font-semibold">
                  Total deliveries logged in system today
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-ag-accent-coral/5 to-transparent border-ag-accent-coral/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Active Deliveries</p>
                    <h3 className="text-3xl font-extrabold text-ag-coral mt-2">
                      {dashboard?.activeDeliveries ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-accent-coral/10 rounded-xl text-ag-coral">
                    <Truck size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3 font-semibold">
                  Vehicles currently on road
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Total Freight cost</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      ₹{dashboard?.totalFreightCost?.toLocaleString() ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-surface-3 rounded-xl text-ag-ink-2">
                    <Calculator size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3 font-semibold">
                  Logged transportation expenditure
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Success Rate</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {dashboard?.deliverySuccessRate?.toFixed(1) ?? 99.2}%
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-surface-3 rounded-xl text-ag-ink-2">
                    <CheckSquare size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3 font-semibold">
                  SLA compliance rate
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-2">
              <CardHeader title="AI Consolidation Suggestions" subtitle="Optimization recommendations from SCM Intelligent agent." />
              <div className="p-6 space-y-4">
                {optimization?.suggestedConsolidations?.map((s: any, idx: number) => (
                  <div key={idx} className="p-4 bg-ag-surface-2 rounded-xl border border-ag-border text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ag-ink">Consolidate: {s.shipmentIds.join(' + ')}</p>
                      <p className="text-ag-ink-3 mt-1">{s.reason}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-ag-primary">Save ₹{s.savingsEstimate}</span>
                      <Button variant="secondary" size="sm" className="block mt-2">Apply Plan</Button>
                    </div>
                  </div>
                )) || <p className="text-xs text-ag-ink-3">No suggestions found. Run AI Dispatch Optimizer to recalibrate.</p>}
              </div>
            </Card>

            <Card>
              <CardHeader title="SCM Reports Index" subtitle="Audit SCM and driver SLA details." />
              <div className="p-6 space-y-3">
                {reports.map((report, idx) => (
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

      {/* ── 2. SHIPMENT PLANNER ── */}
      {activeTab === 'shipments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Planned Shipment Console" subtitle="Plan and organize sales order packaging logs." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Shipment No</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Destination</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-ag-ink-3">No shipments planned yet.</td>
                      </tr>
                    ) : (
                      shipments.map((s) => (
                        <tr key={s._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{s.shipmentNumber}</td>
                          <td className="p-4 font-bold text-ag-ink">{s.customerName}</td>
                          <td className="p-4 text-ag-ink-2 truncate max-w-[200px]">{s.destinationAddress}</td>
                          <td className="p-4 font-bold uppercase">{s.priority}</td>
                          <td className="p-4"><StatusBadge status={s.status} /></td>
                          <td className="p-4">
                            {s.status === 'planned' && (
                              <Button variant="secondary" size="sm" onClick={() => { setSelectedShipment(s); setActiveTab('dispatch'); }}>
                                Dispatch
                              </Button>
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
              <CardHeader title="Plan New Shipment" subtitle="Register outbound shipment request." />
              <form className="p-6 space-y-4" onSubmit={handleCreateShipment}>
                <Input
                  label="Customer Name *"
                  placeholder="e.g. Acme Corp"
                  value={shipmentForm.customerName}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, customerName: e.target.value })}
                />
                <Input
                  label="Warehouse Code *"
                  placeholder="e.g. WH-MUM"
                  value={shipmentForm.warehouseCode}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, warehouseCode: e.target.value })}
                />
                <Input
                  label="Destination Address *"
                  placeholder="e.g. 101 Corporate Hub, Pune"
                  value={shipmentForm.destinationAddress}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, destinationAddress: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Item Code *"
                    placeholder="e.g. ITEM-0001"
                    value={shipmentForm.itemCode}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, itemCode: e.target.value })}
                  />
                  <Input
                    label="Quantity *"
                    type="number"
                    value={shipmentForm.quantity}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, quantity: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Weight (kg)"
                    type="number"
                    value={shipmentForm.weight}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, weight: parseFloat(e.target.value) })}
                  />
                  <Input
                    label="Volume (m³)"
                    type="number"
                    value={shipmentForm.volume}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, volume: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Priority</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={shipmentForm.priority}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Plan Shipment</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 3. DISPATCH CENTER ── */}
      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Dispatch Controller Queue" subtitle="Assign drivers, scan loading confirmations, and print Gate Passes." />
              <div className="p-6 space-y-4">
                {shipments.filter(s => s.status === 'planned').map((s) => (
                  <div key={s._id} className={`p-4 border rounded-xl flex justify-between items-center ${selectedShipment?._id === s._id ? 'border-ag-primary bg-ag-primary/5' : 'border-ag-border bg-ag-surface'}`}>
                    <div>
                      <span className="font-mono text-xs font-bold text-ag-primary">{s.shipmentNumber}</span>
                      <h4 className="text-sm font-bold text-ag-ink mt-1">Shipment to {s.customerName}</h4>
                      <p className="text-xs text-ag-ink-3 mt-1">Destination: {s.destinationAddress}</p>
                    </div>
                    <Button variant={selectedShipment?._id === s._id ? 'primary' : 'secondary'} size="sm" onClick={() => setSelectedShipment(s)}>
                      {selectedShipment?._id === s._id ? 'Selected' : 'Select for Dispatch'}
                    </Button>
                  </div>
                ))}
                {shipments.filter(s => s.status === 'planned').length === 0 && (
                  <p className="text-xs text-ag-ink-3 text-center py-4">No shipments ready for dispatch in queue.</p>
                )}
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Loading Confirmation Scan" subtitle="Assign fleet vehicles and drivers." />
              <form className="p-6 space-y-4" onSubmit={handleConfirmDispatch}>
                {selectedShipment && (
                  <div className="p-3 bg-ag-surface-2 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-ag-ink">Selected: {selectedShipment.shipmentNumber}</p>
                    <p className="text-ag-ink-2">To: {selectedShipment.customerName}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Vehicle *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={dispatchForm.vehicleId}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleId: e.target.value })}
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber} ({v.vehicleType} - {v.status})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Driver *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={dispatchForm.driverId}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, driverId: e.target.value })}
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.driverNumber})</option>)}
                  </select>
                </div>
                <Input
                  label="Gate Pass Number"
                  placeholder="e.g. GATE-MUM-88"
                  value={dispatchForm.gatePassNumber}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, gatePassNumber: e.target.value })}
                />
                <Button type="submit" className="w-full" disabled={!selectedShipment}>Confirm Loading & Dispatch</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 4. FLEET & DRIVERS ── */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Enterprise Fleet Registry" subtitle="Asset registry details for company and third-party logistics." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Vehicle No</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Maintenance status</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-ag-ink-3">No vehicles registered.</td>
                      </tr>
                    ) : (
                      vehicles.map((v) => (
                        <tr key={v._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{v.vehicleNumber}</td>
                          <td className="p-4 font-bold text-ag-ink">{v.vehicleType}</td>
                          <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.maintenanceStatus === 'critical' ? 'bg-ag-accent-coral/10 text-ag-coral' : 'bg-ag-surface-3 text-ag-ink-2'}`}>{v.maintenanceStatus}</span></td>
                          <td className="p-4"><StatusBadge status={v.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Register New Driver" subtitle="Driver licensing verification registry." />
              <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateDriver}>
                <Input
                  label="Driver ID Number *"
                  placeholder="e.g. DRV-889"
                  value={driverForm.driverNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, driverNumber: e.target.value })}
                />
                <Input
                  label="Driver Name *"
                  placeholder="e.g. Ramesh Kumar"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                />
                <Input
                  label="License Number *"
                  placeholder="e.g. DL-MH02-2021"
                  value={driverForm.licenseNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                />
                <Input
                  label="Contact Phone"
                  placeholder="e.g. +91 98765 43210"
                  value={driverForm.contactPhone}
                  onChange={(e) => setDriverForm({ ...driverForm, contactPhone: e.target.value })}
                />
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full">Register Driver</Button>
                </div>
              </form>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Register New Vehicle" subtitle="Log new distribution carrier." />
              <form className="p-6 space-y-4" onSubmit={handleCreateVehicle}>
                <Input
                  label="Vehicle Number *"
                  placeholder="e.g. MH-02-AB-9821"
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Vehicle Type *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Container Truck">Container Truck</option>
                  </select>
                </div>
                <Input
                  label="Capacity Weight (kg) *"
                  type="number"
                  value={vehicleForm.capacityWeight}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, capacityWeight: parseFloat(e.target.value) })}
                />
                <Input
                  label="Capacity Volume (m³) *"
                  type="number"
                  value={vehicleForm.capacityVolume}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, capacityVolume: parseFloat(e.target.value) })}
                />
                <Input
                  label="GPS Device ID"
                  placeholder="e.g. GPS-889021"
                  value={vehicleForm.gpsDeviceId}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, gpsDeviceId: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Maintenance Status</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={vehicleForm.maintenanceStatus}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, maintenanceStatus: e.target.value })}
                  >
                    <option value="good">Good</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical (Blocks dispatch)</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Register Vehicle</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 5. TRACKING & ROUTE OPTIMIZATION ── */}
      {activeTab === 'tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Transit Shipments Telemetry Map" subtitle="Real-time ETA and route sequence tracking." />
              <div className="p-6 space-y-4">
                {shipments.filter(s => s.status === 'dispatched' || s.status === 'in_transit').map((s) => (
                  <div key={s._id} className={`p-4 border rounded-xl flex justify-between items-center ${selectedShipment?._id === s._id ? 'border-ag-primary bg-ag-primary/5' : 'border-ag-border bg-ag-surface'}`}>
                    <div>
                      <span className="font-mono text-xs font-bold text-ag-primary">{s.shipmentNumber}</span>
                      <h4 className="text-sm font-bold text-ag-ink mt-1">To: {s.customerName}</h4>
                      <p className="text-xs text-ag-ink-3 mt-1">Status: <span className="font-bold uppercase text-ag-coral">{s.status}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleSelectShipmentForDelays(s)}>
                        Track / POD
                      </Button>
                    </div>
                  </div>
                ))}
                {shipments.filter(s => s.status === 'dispatched' || s.status === 'in_transit').length === 0 && (
                  <p className="text-xs text-ag-ink-3 text-center py-4">No shipments currently in transit.</p>
                )}
              </div>
            </Card>

            {selectedShipment && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Route Leg optimization */}
                  <Card>
                    <CardHeader title="Optimize Route sequence" subtitle="Calculate leg sequences." />
                    <form className="p-6 space-y-4" onSubmit={handleOptimizeRoute}>
                      <Input
                        label="Route Stops sequence"
                        value={routeForm.legsSequence}
                        onChange={(e) => setRouteForm({ ...routeForm, legsSequence: e.target.value })}
                      />
                      <Input
                        label="Total Distance (km)"
                        type="number"
                        value={routeForm.totalDistance}
                        onChange={(e) => setRouteForm({ ...routeForm, totalDistance: parseFloat(e.target.value) })}
                      />
                      <Button type="submit" variant="secondary" className="w-full">Optimize Sequence</Button>
                    </form>
                  </Card>

                  {/* GPS updates */}
                  <Card>
                    <CardHeader title="Transmit Mock GPS Coordinates" subtitle="Simulate device telemetry update." />
                    <form className="p-6 space-y-4" onSubmit={handleTelemetrySubmit}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Latitude"
                          type="number"
                          step="0.001"
                          value={telemetryForm.latitude}
                          onChange={(e) => setTelemetryForm({ ...telemetryForm, latitude: parseFloat(e.target.value) })}
                        />
                        <Input
                          label="Longitude"
                          type="number"
                          step="0.001"
                          value={telemetryForm.longitude}
                          onChange={(e) => setTelemetryForm({ ...telemetryForm, longitude: parseFloat(e.target.value) })}
                        />
                      </div>
                      <Input
                        label="Speed (km/h)"
                        type="number"
                        value={telemetryForm.speed}
                        onChange={(e) => setTelemetryForm({ ...telemetryForm, speed: parseFloat(e.target.value) })}
                      />
                      <Button type="submit" variant="secondary" className="w-full">Send GPS update</Button>
                    </form>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Log SCM Delay Alerts */}
                  <Card>
                    <CardHeader title="Report In-Transit Delay / Exception" subtitle="Log roadside breakdown, accident or weather delay" />
                    <form className="p-6 space-y-4" onSubmit={handleCreateDelayAlert}>
                      <div>
                        <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Delay Type</label>
                        <select
                          className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                          value={delayAlertForm.delayType}
                          onChange={(e) => setDelayAlertForm({ ...delayAlertForm, delayType: e.target.value })}
                        >
                          <option value="breakdown">Breakdown</option>
                          <option value="accident">Accident</option>
                          <option value="traffic">Traffic Congestion</option>
                          <option value="weather">Severe Weather</option>
                          <option value="customs">Customs Delay</option>
                        </select>
                      </div>
                      <Input
                        label="Estimated Duration (Minutes)"
                        type="number"
                        value={delayAlertForm.durationMinutes}
                        onChange={(e) => setDelayAlertForm({ ...delayAlertForm, durationMinutes: parseInt(e.target.value) })}
                      />
                      <div>
                        <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Severity</label>
                        <select
                          className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                          value={delayAlertForm.severity}
                          onChange={(e) => setDelayAlertForm({ ...delayAlertForm, severity: e.target.value })}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <Input
                        label="Remarks / Description"
                        placeholder="e.g. Engine overheat at Highway NH4"
                        value={delayAlertForm.remarks}
                        onChange={(e) => setDelayAlertForm({ ...delayAlertForm, remarks: e.target.value })}
                      />
                      <Button type="submit" className="w-full" variant="secondary">Log Delay Alert</Button>
                    </form>
                  </Card>

                  {/* Active Delay Alerts List */}
                  <Card>
                    <CardHeader title="Active Delay Alerts" subtitle="Track and resolve transit exceptions" />
                    <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
                      {shipmentDelays.length === 0 ? (
                        <p className="text-xs text-ag-ink-3 text-center py-4">No active delays reported for this shipment.</p>
                      ) : (
                        shipmentDelays.map((a) => (
                          <div key={a._id} className="p-3 bg-ag-surface rounded-xl border border-ag-border flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-ag-ink capitalize">{a.delayType} ({a.durationMinutes} mins)</p>
                              <p className="text-ag-ink-3 mt-1">Severity: <span className="font-bold uppercase">{a.severity}</span></p>
                              {a.remarks && <p className="text-ag-ink-3 mt-0.5">{a.remarks}</p>}
                              <p className="mt-1 font-semibold">
                                Status: {a.resolved ? (
                                  <span className="text-green-500 font-bold">Resolved</span>
                                ) : (
                                  <span className="text-ag-coral font-bold">Active Exception</span>
                                )}
                              </p>
                            </div>
                            {!a.resolved && (
                              <Button variant="secondary" size="sm" onClick={() => handleResolveDelayAlert(a._id)}>
                                Resolve
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>

          <div>
            <Card>
              <CardHeader title="Record Proof of Delivery (POD)" subtitle="Capture customer signature parameters." />
              <form className="p-6 space-y-4" onSubmit={handlePodSubmit}>
                {selectedShipment && (
                  <div className="p-3 bg-ag-surface-2 rounded-xl text-xs">
                    <p className="font-bold text-ag-ink">Active: {selectedShipment.shipmentNumber}</p>
                    <p className="text-ag-ink-2">Receiver: {selectedShipment.customerName}</p>
                  </div>
                )}
                <Input
                  label="Customer Signer Name *"
                  placeholder="e.g. Ramesh Kumar"
                  value={podForm.customerSignerName}
                  onChange={(e) => setPodForm({ ...podForm, customerSignerName: e.target.value })}
                />
                <Input
                  label="OTP Verification Code *"
                  placeholder="e.g. 556122"
                  value={podForm.otpCode}
                  onChange={(e) => setPodForm({ ...podForm, otpCode: e.target.value })}
                />
                <Input
                  label="Remarks / Comments"
                  placeholder="e.g. Delivery completed, no missing items"
                  value={podForm.remarks}
                  onChange={(e) => setPodForm({ ...podForm, remarks: e.target.value })}
                />
                <Button type="submit" className="w-full" disabled={!selectedShipment}>Submit POD & Close Delivery</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 6. RETURNS & REVERSE LOGISTICS ── */}
      {activeTab === 'returns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Reverse Logistics Returns Log" subtitle="Process client returns and restock items." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Return No</th>
                      <th className="p-4">Item Code</th>
                      <th className="p-4">Quantity</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-ag-border hover:bg-ag-surface-2/40">
                      <td className="p-4 font-mono font-bold text-ag-primary">RET-SCM-0001</td>
                      <td className="p-4 font-bold text-ag-ink">ITEM-0001</td>
                      <td className="p-4 text-ag-ink-2">2.0</td>
                      <td className="p-4 text-ag-ink-2 text-ag-coral uppercase font-bold">damaged_goods</td>
                      <td className="p-4"><span className="px-2 py-1 bg-green-500/10 text-green-500 rounded font-bold">restocked</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Log Customer Return" subtitle="Enter details of returned shipment items." />
              <form className="p-6 space-y-4" onSubmit={handleReturnLog}>
                <Input
                  label="Original Shipment ID (Optional)"
                  placeholder="e.g. UUID string"
                  value={returnForm.originalShipmentId}
                  onChange={(e) => setReturnForm({ ...returnForm, originalShipmentId: e.target.value })}
                />
                <Input
                  label="Item Code *"
                  placeholder="e.g. ITEM-0001"
                  value={returnForm.itemCode}
                  onChange={(e) => setReturnForm({ ...returnForm, itemCode: e.target.value })}
                />
                <Input
                  label="Quantity *"
                  type="number"
                  value={returnForm.quantity}
                  onChange={(e) => setReturnForm({ ...returnForm, quantity: parseFloat(e.target.value) })}
                />
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Reason</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={returnForm.returnReason}
                    onChange={(e) => setReturnForm({ ...returnForm, returnReason: e.target.value })}
                  >
                    <option value="damaged_goods">Damaged Goods</option>
                    <option value="customer_return">Customer Return</option>
                    <option value="recall">Recall</option>
                  </select>
                </div>
                <Input
                  label="Inspection Remarks"
                  value={returnForm.inspectionRemarks}
                  onChange={(e) => setReturnForm({ ...returnForm, inspectionRemarks: e.target.value })}
                />
                <Button type="submit" className="w-full">Log Return & Restock</Button>
              </form>
            </Card>
          </div>
        </div>
      )}
      {/* ── 7. CARRIER RATE CARDS ── */}
      {activeTab === 'rates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Carrier Rates Sheets Grid" subtitle="Configure and list zone-based contract shipping rates" />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Carrier ID</th>
                      <th className="p-4">Origin Zone</th>
                      <th className="p-4">Destination Zone</th>
                      <th className="p-4">Base Charge</th>
                      <th className="p-4">Rate per KM</th>
                      <th className="p-4">Rate per KG</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierRates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-ag-ink-3">No rate sheets configured yet.</td>
                      </tr>
                    ) : (
                      carrierRates.map((r) => (
                        <tr key={r._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{r.carrierId}</td>
                          <td className="p-4 font-bold text-ag-ink">{r.originZone}</td>
                          <td className="p-4 text-ag-ink-2">{r.destinationZone}</td>
                          <td className="p-4 font-bold">₹{r.baseCharge}</td>
                          <td className="p-4">₹{r.ratePerKm}/km</td>
                          <td className="p-4">₹{r.ratePerKg}/kg</td>
                          <td className="p-4"><StatusBadge status={r.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Configure Rate Sheet" subtitle="Set shipping charges sheet coefficients" />
              <form className="p-6 space-y-4" onSubmit={handleCreateCarrierRate}>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Carrier *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={carrierRateForm.carrierId}
                    onChange={(e) => setCarrierRateForm({ ...carrierRateForm, carrierId: e.target.value })}
                  >
                    <option value="">-- Choose Carrier --</option>
                    {carriers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.carrierCode})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Origin Zone *"
                    value={carrierRateForm.originZone}
                    onChange={(e) => setCarrierRateForm({ ...carrierRateForm, originZone: e.target.value })}
                  />
                  <Input
                    label="Destination Zone *"
                    value={carrierRateForm.destinationZone}
                    onChange={(e) => setCarrierRateForm({ ...carrierRateForm, destinationZone: e.target.value })}
                  />
                </div>
                <Input
                  label="Base Charge (₹) *"
                  type="number"
                  value={carrierRateForm.baseCharge}
                  onChange={(e) => setCarrierRateForm({ ...carrierRateForm, baseCharge: parseFloat(e.target.value) })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Rate per KM (₹) *"
                    type="number"
                    value={carrierRateForm.ratePerKm}
                    onChange={(e) => setCarrierRateForm({ ...carrierRateForm, ratePerKm: parseFloat(e.target.value) })}
                  />
                  <Input
                    label="Rate per KG (₹) *"
                    type="number"
                    value={carrierRateForm.ratePerKg}
                    onChange={(e) => setCarrierRateForm({ ...carrierRateForm, ratePerKg: parseFloat(e.target.value) })}
                  />
                </div>
                <Button type="submit" className="w-full">Create Rate Card</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── 8. VOLUMETRIC PACKING SOLVER ── */}
      {activeTab === 'loading' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="3D packing Instructions and cubing solver" subtitle="Optimal positioning of parcel boxes inside vehicle container capacity limit" />
              <div className="p-6 space-y-6">
                {loadingPlan ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-ag-primary/5 rounded-xl border border-ag-primary/20">
                      <h4 className="text-sm font-bold text-ag-primary">Loading plan generated successfully!</h4>
                      <p className="text-xs text-ag-ink-2 mt-1">Vehicle Volumetric Utilization rate: <span className="font-bold text-lg text-ag-primary">{loadingPlan.utilizationPercentage.toFixed(1)}%</span></p>
                      
                      <div className="w-full bg-ag-surface-3 h-2 rounded-full mt-3 overflow-hidden">
                        <div className="bg-ag-primary h-full rounded-full transition-all" style={{ width: `${loadingPlan.utilizationPercentage}%` }} />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-ag-ink uppercase tracking-wider mb-3">Stacking instructions & coordinates sequence</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                              <th className="p-3">Sequence</th>
                              <th className="p-3">Item Code</th>
                              <th className="p-3">Quantity</th>
                              <th className="p-3">Relative 3D coordinate box position [X, Y, Z]</th>
                            </tr>
                          </thead>
                          <tbody>
                            {JSON.parse(loadingPlan.packingInstructions).map((item: any) => (
                              <tr key={item.stackingSequence} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                                <td className="p-3 font-mono font-bold text-ag-primary">#{item.stackingSequence}</td>
                                <td className="p-3 font-bold text-ag-ink">{item.itemCode}</td>
                                <td className="p-3 text-ag-ink-2">{item.quantity}</td>
                                <td className="p-3 font-mono font-semibold text-ag-primary">[{item.boxCoordinates.join(', ')}]</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center border border-dashed border-ag-border rounded-xl">
                    <Cpu size={48} className="mx-auto text-ag-ink-3 mb-4" />
                    <h3 className="text-sm font-bold text-ag-ink">No Active Loading Plan</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Select an active planned shipment and target vehicle carrier to calculate stacking sequence.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Plan Container Packing" subtitle="Solve volumetric cubing consolidation" />
              <form className="p-6 space-y-4" onSubmit={handleGenerateLoadingPlan}>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Shipment *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={containerLoadingForm.shipmentId}
                    onChange={(e) => setContainerLoadingForm({ ...containerLoadingForm, shipmentId: e.target.value })}
                  >
                    <option value="">-- Choose Shipment --</option>
                    {shipments.map(s => <option key={s._id} value={s._id}>{s.shipmentNumber} (To: {s.customerName})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Vehicle *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={containerLoadingForm.vehicleId}
                    onChange={(e) => setContainerLoadingForm({ ...containerLoadingForm, vehicleId: e.target.value })}
                  >
                    <option value="">-- Choose Fleet Vehicle --</option>
                    {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber} ({v.vehicleType} - Vol: {v.capacityVolume} m³)</option>)}
                  </select>
                </div>
                <Button type="submit" className="w-full">Solve Packing Plan</Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

