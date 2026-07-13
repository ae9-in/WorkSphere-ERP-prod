import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { inventoryService } from '@/services/api.service';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import {
  Package, Archive, ArrowsClockwise, CheckSquare, Sparkle, Warning,
  Plus, Calculator, ChartLine, ArrowUpRight, ArrowDownRight, ArrowsHorizontal, ClipboardText
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'warehouses' | 'operations' | 'counting' | 'ai'>('overview');
  
  // Data States
  const [dashboard, setDashboard] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [reorders, setReorders] = useState<any[]>([]);
  const [valuations, setValuations] = useState<any[]>([]);
  const [optimizationRecs, setOptimizationRecs] = useState<any[]>([]);
  const [selectedCountDetails, setSelectedCountDetails] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    brand: '',
    manufacturer: '',
    description: '',
    categoryCode: '',
    uom: 'piece',
    taxCategory: 'GST 18%',
    minStock: 10,
    maxStock: 500,
    safetyStock: 15,
    reorderPoint: 20,
    preferredVendor: '',
    defaultWarehouseCode: ''
  });

  const [warehouseForm, setWarehouseForm] = useState({
    code: '',
    name: '',
    address: '',
    capacity: 2000,
    type: 'distribution',
    currency: 'INR'
  });

  const [locationForm, setLocationForm] = useState({
    warehouseCode: '',
    code: '',
    zone: 'Z1',
    aisle: 'A1',
    rack: 'R1',
    shelf: 'S1',
    bin: 'B1'
  });

  const [categoryForm, setCategoryForm] = useState({
    code: '',
    name: '',
    description: ''
  });

  const [stockForm, setStockForm] = useState({
    type: 'in', // in, out, transfer
    itemCode: '',
    warehouseCode: '',
    locationCode: '',
    toWarehouseCode: '',
    toLocationCode: '',
    quantity: 10,
    unitCost: 150.0,
    batchNumber: '',
    expiryDate: '',
    serialNumbers: '',
    remarks: ''
  });

  const [countForm, setCountForm] = useState<{
    warehouseCode: string;
    items: { itemCode: string; countedQuantity: number; remarks: string }[];
  }>({
    warehouseCode: '',
    items: [{ itemCode: '', countedQuantity: 0, remarks: '' }]
  });

  const [valuationMethod, setValuationMethod] = useState<'FIFO' | 'LIFO' | 'AVERAGE'>('AVERAGE');
  const [forecastItemCode, setForecastItemCode] = useState('');
  const [forecastData, setForecastData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dash, itemList, catList, whList, locList, adjList, countList, reorderList, valList, optList] = await Promise.all([
        inventoryService.getDashboard().catch(() => null),
        inventoryService.getItems().catch(() => []),
        inventoryService.getCategories().catch(() => []),
        inventoryService.getWarehouses().catch(() => []),
        inventoryService.getLocations().catch(() => []),
        inventoryService.getAdjustments().catch(() => []),
        inventoryService.getCounts().catch(() => []),
        inventoryService.getReorders().catch(() => []),
        inventoryService.getValuation(valuationMethod).catch(() => []),
        inventoryService.getOptimization().catch(() => [])
      ]);
      
      setDashboard(dash);
      setItems(itemList);
      setCategories(catList);
      setWarehouses(whList);
      setLocations(locList);
      setAdjustments(adjList);
      setCounts(countList);
      setReorders(reorderList);
      setValuations(valList);
      setOptimizationRecs(optList);

      if (itemList.length > 0 && !forecastItemCode) {
        setForecastItemCode(itemList[0].itemCode);
      }
    } catch {
      toast.error('Failed to reload inventory registries');
    } finally {
      setIsLoading(false);
    }
  }, [valuationMethod, forecastItemCode]);

  useEffect(() => {
    fetchData();
  }, [valuationMethod]);

  const loadForecast = async () => {
    if (!forecastItemCode) return;
    try {
      const fc = await inventoryService.getForecast(forecastItemCode, 15);
      setForecastData(fc);
      toast.success('AI demand forecast computed!');
    } catch {
      toast.error('Could not fetch AI predictions for this item');
    }
  };

  useEffect(() => {
    if (forecastItemCode && activeTab === 'ai') {
      loadForecast();
    }
  }, [forecastItemCode, activeTab]);

  // Form Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.code || !categoryForm.name) {
      toast.error('Enter category code and name');
      return;
    }
    try {
      await inventoryService.createCategory(categoryForm);
      toast.success('Category created!');
      setCategoryForm({ code: '', name: '', description: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create category');
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name) {
      toast.error('Item name is required');
      return;
    }
    try {
      await inventoryService.createItem(itemForm);
      toast.success('Item registered in Master catalog!');
      setItemForm({
        name: '',
        sku: '',
        brand: '',
        manufacturer: '',
        description: '',
        categoryCode: '',
        uom: 'piece',
        taxCategory: 'GST 18%',
        minStock: 10,
        maxStock: 500,
        safetyStock: 15,
        reorderPoint: 20,
        preferredVendor: '',
        defaultWarehouseCode: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create item');
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseForm.code || !warehouseForm.name) {
      toast.error('Enter code and name');
      return;
    }
    try {
      await inventoryService.createWarehouse(warehouseForm);
      toast.success('Warehouse registry added!');
      setWarehouseForm({ code: '', name: '', address: '', capacity: 2000, type: 'distribution', currency: 'INR' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add warehouse');
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.warehouseCode || !locationForm.code) {
      toast.error('Warehouse code and location code required');
      return;
    }
    try {
      await inventoryService.createLocation(locationForm);
      toast.success('Storage location bin configured!');
      setLocationForm({ warehouseCode: '', code: '', zone: 'Z1', aisle: 'A1', rack: 'R1', shelf: 'S1', bin: 'B1' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create bin location');
    }
  };

  const handleStockOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.itemCode || !stockForm.warehouseCode) {
      toast.error('Item code and Warehouse code are required');
      return;
    }
    try {
      const serials = stockForm.serialNumbers
        ? stockForm.serialNumbers.split(',').map(s => s.trim()).filter(Boolean)
        : undefined;
      const payload = {
        itemCode: stockForm.itemCode,
        warehouseCode: stockForm.warehouseCode,
        locationCode: stockForm.locationCode || undefined,
        quantity: Number(stockForm.quantity),
        unitCost: Number(stockForm.unitCost),
        remarks: stockForm.remarks || undefined,
        batchNumber: stockForm.batchNumber || undefined,
        expiryDate: stockForm.expiryDate || undefined,
        serialNumbers: serials
      };

      if (stockForm.type === 'in') {
        await inventoryService.stockIn(payload);
        toast.success('Stock-in logged in immutable journal!');
      } else if (stockForm.type === 'out') {
        await inventoryService.stockOut(payload);
        toast.success('Stock-out logged in immutable journal!');
      } else {
        await inventoryService.transfer({
          ...payload,
          fromWarehouseCode: stockForm.warehouseCode,
          fromLocationCode: stockForm.locationCode || undefined,
          toWarehouseCode: stockForm.toWarehouseCode,
          toLocationCode: stockForm.toLocationCode || undefined
        });
        toast.success('Inter-location transfer recorded!');
      }
      
      setStockForm({
        type: 'in',
        itemCode: '',
        warehouseCode: '',
        locationCode: '',
        toWarehouseCode: '',
        toLocationCode: '',
        quantity: 10,
        unitCost: 150.0,
        batchNumber: '',
        expiryDate: '',
        serialNumbers: '',
        remarks: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Stock operation failed due to registry boundaries');
    }
  };

  const handleCreateAdjustment = async (itemCode: string, whCode: string, qty: number, type: 'in' | 'out') => {
    const reason = prompt('Enter adjustment reason (e.g. Broken packaging, counting correction):');
    if (!reason) return;
    try {
      await inventoryService.createAdjustment({
        itemCode,
        warehouseCode: whCode,
        quantityAdjusted: qty,
        type,
        reason
      });
      toast.success('Adjustment request queued for approvals!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to request stock write-off');
    }
  };

  const handleActionAdjustment = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await inventoryService.approveAdjustment(id, status);
      toast.success(`Adjustment ${status} successfully!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Adjustment action verification failed');
    }
  };

  const handleActionCount = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await inventoryService.approveCount(id, status);
      toast.success(`Cycle count session ${status} and system ledger reconciled!`);
      setSelectedCountDetails(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Verification approval failed');
    }
  };

  const handleAddCountItem = () => {
    setCountForm(prev => ({
      ...prev,
      items: [...prev.items, { itemCode: '', countedQuantity: 0, remarks: '' }]
    }));
  };

  const handleCountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countForm.warehouseCode || countForm.items.some(i => !i.itemCode)) {
      toast.error('Warehouse code and all counted item codes are required');
      return;
    }
    try {
      await inventoryService.submitCount(countForm);
      toast.success('Physical count data recorded and queued for verification reviews!');
      setCountForm({
        warehouseCode: '',
        items: [{ itemCode: '', countedQuantity: 0, remarks: '' }]
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Count submission validation error');
    }
  };

  const fetchCountDetails = async (id: string) => {
    try {
      const details = await inventoryService.getCountDetails(id);
      setSelectedCountDetails(details);
    } catch {
      toast.error('Could not load detailed count items');
    }
  };

  return (
    <PageContainer
      title="Inventory, Warehouse & Assets Operations"
      subtitle="Enterprise SKU master logs, multi-warehouse zones, cycle checks, valuations and AI predictors."
      actions={
        <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
          Sync Registry
        </Button>
      }
    >
      {/* Premium Glassmorphic Tab Selector */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        {[
          { key: 'overview', label: 'Dashboard', icon: <Package size={16} /> },
          { key: 'items', label: 'Items Master', icon: <ClipboardText size={16} /> },
          { key: 'warehouses', label: 'Warehouses & Bins', icon: <Archive size={16} /> },
          { key: 'operations', label: 'Stock Operations', icon: <ArrowUpRight size={16} /> },
          { key: 'counting', label: 'Cycle Verify', icon: <CheckSquare size={16} /> },
          { key: 'ai', label: 'AI Planner & Valuations', icon: <ChartLine size={16} /> }
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

      {/* 1. OVERVIEW / DASHBOARD TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-ag-primary/5 to-transparent border-ag-primary/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Total Value (AVERAGE)</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      ₹{(dashboard?.totalValuation ?? 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-primary/10 rounded-xl text-ag-primary">
                    <Calculator size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[11px] text-ag-ink-3">
                  <span className="font-semibold text-ag-primary">{(dashboard?.totalQuantity ?? 0).toLocaleString()}</span> units overall
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-ag-accent-coral/5 to-transparent border-ag-accent-coral/20">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Low Stock Warnings</p>
                    <h3 className="text-3xl font-extrabold text-ag-coral mt-2">
                      {dashboard?.lowStockAlertsCount ?? 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-accent-coral/10 rounded-xl text-ag-coral">
                    <Warning size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Items requiring immediate reorder action
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Active Warehouses</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {warehouses.length}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-surface-3 rounded-xl text-ag-ink-2">
                    <Archive size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Configured structural distribution spaces
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Storage Bins</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {locations.length}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-surface-3 rounded-xl text-ag-ink-2">
                    <ClipboardText size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Unique aisle/shelf location points mapped
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Warehouse Capacity utilization */}
            <Card className="col-span-2">
              <CardHeader title="Warehouse Storage Occupancy" subtitle="Utilization ratios calculated from current bin counts vs limits." />
              <div className="p-6 space-y-5">
                {(dashboard?.warehouseCapacities ?? []).length === 0 ? (
                  <p className="text-xs text-ag-ink-3">No warehouse utilization logged.</p>
                ) : (
                  (dashboard?.warehouseCapacities ?? []).map((w: any) => (
                    <div key={w.warehouseCode} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-ag-ink">{w.warehouseName} ({w.warehouseCode})</span>
                        <span className="text-ag-ink-2">{w.occupied.toLocaleString()} / {w.capacity.toLocaleString()} units ({w.utilization.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-ag-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            w.utilization > 80 ? 'bg-ag-accent-coral' : 'bg-ag-primary'
                          }`}
                          style={{ width: `${w.utilization}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent movements timeline logs */}
            <Card>
              <CardHeader title="Recent Movements journal" subtitle="Latest inputs/outputs registered in the database ledger." />
              <div className="p-6">
                <div className="space-y-4">
                  {(dashboard?.recentActivities ?? []).length === 0 ? (
                    <p className="text-xs text-ag-ink-3">No movements recorded yet.</p>
                  ) : (
                    (dashboard?.recentActivities ?? []).map((act: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start text-xs border-b border-ag-border/50 pb-3 last:border-0 last:pb-0">
                        <span className={`p-1.5 rounded-lg ${
                          act.type.includes('in') ? 'bg-ag-primary/10 text-ag-primary' : 'bg-ag-accent-coral/10 text-ag-accent-coral'
                        }`}>
                          {act.type.includes('in') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </span>
                        <div className="flex-1">
                          <p className="font-bold text-ag-ink">{act.itemName} ({act.itemCode})</p>
                          <p className="text-ag-ink-3">{act.type.toUpperCase()} • Qty: {Math.abs(act.quantity)}</p>
                        </div>
                        <span className="text-[10px] text-ag-ink-3">{act.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. ITEMS MASTER TAB */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of registered inventory items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Item Master Catalog" subtitle="Master register containing all enterprise-grade product catalog lines." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                      <th className="p-4">Item Details</th>
                      <th className="p-4">SKU / Code</th>
                      <th className="p-4">Governance Rules</th>
                      <th className="p-4">Identification</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No inventory items configured. Create one in the form panel.</td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4">
                            <span className="font-bold text-ag-ink block">{item.name}</span>
                            <span className="text-[10px] text-ag-ink-3">{item.categoryName} • Brand: {item.brand || 'N/A'}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-ag-primary font-semibold block">{item.sku}</span>
                            <span className="text-[10px] text-ag-ink-3">Code: {item.itemCode}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-ag-ink-2 block">Min: {item.minStock} / Max: {item.maxStock}</span>
                            <span className="text-[10px] text-ag-ink-3">Reorder Point: {item.reorderPoint}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-[10px] block">Barcode: {item.barcode}</span>
                            <span className="text-[10px] text-ag-ink-3">UOM: {item.uom}</span>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Creation panels */}
          <div className="space-y-8">
            <Card>
              <CardHeader title="Register Catalog Item" subtitle="Create structural Item master registries with SKU triggers." />
              <form className="p-6 space-y-4" onSubmit={handleCreateItem}>
                <Input
                  label="Item Name *"
                  placeholder="e.g. Raw Copper Cables"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Brand"
                    placeholder="e.g. Polycab"
                    value={itemForm.brand}
                    onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })}
                  />
                  <Input
                    label="Manufacturer"
                    placeholder="e.g. Polycab India"
                    value={itemForm.manufacturer}
                    onChange={(e) => setItemForm({ ...itemForm, manufacturer: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Category Code</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={itemForm.categoryCode}
                      onChange={(e) => setItemForm({ ...itemForm, categoryCode: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.code}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="UOM"
                    placeholder="e.g. piece, kg, box"
                    value={itemForm.uom}
                    onChange={(e) => setItemForm({ ...itemForm, uom: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Min Stock"
                    type="number"
                    value={itemForm.minStock}
                    onChange={(e) => setItemForm({ ...itemForm, minStock: Number(e.target.value) })}
                  />
                  <Input
                    label="Reorder Point"
                    type="number"
                    value={itemForm.reorderPoint}
                    onChange={(e) => setItemForm({ ...itemForm, reorderPoint: Number(e.target.value) })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Safety Stock"
                    type="number"
                    value={itemForm.safetyStock}
                    onChange={(e) => setItemForm({ ...itemForm, safetyStock: Number(e.target.value) })}
                  />
                  <Input
                    label="Max Stock"
                    type="number"
                    value={itemForm.maxStock}
                    onChange={(e) => setItemForm({ ...itemForm, maxStock: Number(e.target.value) })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Default WH</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={itemForm.defaultWarehouseCode}
                      onChange={(e) => setItemForm({ ...itemForm, defaultWarehouseCode: e.target.value })}
                    >
                      <option value="">Choose WH</option>
                      {warehouses.map((w) => (
                        <option key={w._id} value={w.code}>{w.name} ({w.code})</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Preferred Vendor"
                    placeholder="e.g. Allied Metals Ltd"
                    value={itemForm.preferredVendor}
                    onChange={(e) => setItemForm({ ...itemForm, preferredVendor: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full">Create Item</Button>
              </form>
            </Card>

            <Card>
              <CardHeader title="Define Category Code" subtitle="Register category nodes for classifications." />
              <form className="p-6 space-y-4" onSubmit={handleCreateCategory}>
                <Input
                  label="Category Code *"
                  placeholder="e.g. RAW"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                />
                <Input
                  label="Category Name *"
                  placeholder="e.g. Raw Materials"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
                <Button type="submit" className="w-full">Create Category</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* 3. WAREHOUSES & LOCATIONS TAB */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Warehouses list */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Registered Warehouses" subtitle="Structural layout definitions of corporate spaces." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">WH Details</th>
                      <th className="p-4">Capacity limit</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Currency</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No warehouses registered.</td>
                      </tr>
                    ) : (
                      warehouses.map((wh) => (
                        <tr key={wh._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-bold text-ag-ink">{wh.name} ({wh.code})</td>
                          <td className="p-4 text-ag-ink-2">{wh.capacity ? `${wh.capacity.toLocaleString()} units` : 'Infinite'}</td>
                          <td className="p-4 text-ag-ink-2 capitalize">{wh.type}</td>
                          <td className="p-4 text-ag-ink-2">{wh.currency}</td>
                          <td className="p-4"><StatusBadge status={wh.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Configure Storage Location Bins" subtitle="Granular bin hierarchies mapped within warehouses." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Warehouse Code</th>
                      <th className="p-4">Bin Code</th>
                      <th className="p-4">Zone / Aisle</th>
                      <th className="p-4">Rack / Shelf / Bin</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No storage locations configured.</td>
                      </tr>
                    ) : (
                      locations.map((loc) => (
                        <tr key={loc._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{loc.warehouseCode}</td>
                          <td className="p-4 font-mono text-ag-ink font-semibold">{loc.code}</td>
                          <td className="p-4 text-ag-ink-2">Zone: {loc.zone || 'N/A'} • Aisle: {loc.aisle || 'N/A'}</td>
                          <td className="p-4 text-ag-ink-2">R: {loc.rack || '-'} / S: {loc.shelf || '-'} / B: {loc.bin || '-'}</td>
                          <td className="p-4"><StatusBadge status={loc.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Setup Form Panels */}
          <div className="space-y-8">
            <Card>
              <CardHeader title="Register Warehouse" subtitle="Create structural warehouse entries." />
              <form className="p-6 space-y-4" onSubmit={handleCreateWarehouse}>
                <Input
                  label="Warehouse Code *"
                  placeholder="e.g. WH-MUM-01"
                  value={warehouseForm.code}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                />
                <Input
                  label="Warehouse Name *"
                  placeholder="e.g. Mumbai Main Hub"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                />
                <Input
                  label="Address"
                  placeholder="Street details..."
                  value={warehouseForm.address}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                />
                <Input
                  label="Volumetric Capacity Limit (units)"
                  type="number"
                  value={warehouseForm.capacity}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, capacity: Number(e.target.value) })}
                />
                <Button type="submit" className="w-full">Save Warehouse</Button>
              </form>
            </Card>

            <Card>
              <CardHeader title="Register Storage Bin" subtitle="Define physical aisles and racks." />
              <form className="p-6 space-y-4" onSubmit={handleCreateLocation}>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Warehouse Code *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={locationForm.warehouseCode}
                    onChange={(e) => setLocationForm({ ...locationForm, warehouseCode: e.target.value })}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w.code}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Bin / Location Code *"
                  placeholder="e.g. LOC-Z1-A1-R1"
                  value={locationForm.code}
                  onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Zone"
                    placeholder="Z1"
                    value={locationForm.zone}
                    onChange={(e) => setLocationForm({ ...locationForm, zone: e.target.value })}
                  />
                  <Input
                    label="Aisle"
                    placeholder="A1"
                    value={locationForm.aisle}
                    onChange={(e) => setLocationForm({ ...locationForm, aisle: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="Rack"
                    placeholder="R1"
                    value={locationForm.rack}
                    onChange={(e) => setLocationForm({ ...locationForm, rack: e.target.value })}
                  />
                  <Input
                    label="Shelf"
                    placeholder="S1"
                    value={locationForm.shelf}
                    onChange={(e) => setLocationForm({ ...locationForm, shelf: e.target.value })}
                  />
                  <Input
                    label="Bin"
                    placeholder="B1"
                    value={locationForm.bin}
                    onChange={(e) => setLocationForm({ ...locationForm, bin: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full">Save Storage Bin</Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* 4. STOCK OPERATIONS TAB */}
      {activeTab === 'operations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transaction logger form */}
          <Card>
            <CardHeader title="Stock Operations Logger" subtitle="Post stock transactions directly into the immutable ledger." />
            <form className="p-6 space-y-4" onSubmit={handleStockOperation}>
              <div>
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Operation Type</label>
                <div className="flex gap-2 p-1 bg-ag-surface-2 border border-ag-border rounded-lg">
                  {[
                    { key: 'in', label: 'Stock In' },
                    { key: 'out', label: 'Stock Out' },
                    { key: 'transfer', label: 'Transfer' }
                  ].map(op => (
                    <button
                      key={op.key}
                      type="button"
                      onClick={() => setStockForm(prev => ({ ...prev, type: op.key }))}
                      className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
                        stockForm.type === op.key ? 'bg-ag-primary text-white' : 'text-ag-ink-3 hover:text-ag-ink'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Select Item *</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                  value={stockForm.itemCode}
                  onChange={(e) => setStockForm({ ...stockForm, itemCode: e.target.value })}
                >
                  <option value="">Choose item</option>
                  {items.map((i) => (
                    <option key={i._id} value={i.itemCode}>{i.name} ({i.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">
                    {stockForm.type === 'transfer' ? 'From Warehouse *' : 'Warehouse *'}
                  </label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={stockForm.warehouseCode}
                    onChange={(e) => setStockForm({ ...stockForm, warehouseCode: e.target.value })}
                  >
                    <option value="">Select WH</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w.code}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">
                    {stockForm.type === 'transfer' ? 'From Bin' : 'Storage Bin'}
                  </label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={stockForm.locationCode}
                    onChange={(e) => setStockForm({ ...stockForm, locationCode: e.target.value })}
                  >
                    <option value="">Select Location</option>
                    {locations.filter(l => l.warehouseCode === stockForm.warehouseCode).map((l) => (
                      <option key={l._id} value={l.code}>{l.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {stockForm.type === 'transfer' && (
                <div className="grid grid-cols-2 gap-4 bg-ag-surface-2 p-3 rounded-xl border border-ag-border border-dashed">
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">To Warehouse *</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={stockForm.toWarehouseCode}
                      onChange={(e) => setStockForm({ ...stockForm, toWarehouseCode: e.target.value })}
                    >
                      <option value="">Select WH</option>
                      {warehouses.map((w) => (
                        <option key={w._id} value={w.code}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">To Storage Bin</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={stockForm.toLocationCode}
                      onChange={(e) => setStockForm({ ...stockForm, toLocationCode: e.target.value })}
                    >
                      <option value="">Select Location</option>
                      {locations.filter(l => l.warehouseCode === stockForm.toWarehouseCode).map((l) => (
                        <option key={l._id} value={l.code}>{l.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantity *"
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
                />
                <Input
                  label="Unit Cost (INR)"
                  type="number"
                  value={stockForm.unitCost}
                  disabled={stockForm.type !== 'in'}
                  onChange={(e) => setStockForm({ ...stockForm, unitCost: Number(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Batch Number"
                  placeholder="e.g. BATCH-01"
                  value={stockForm.batchNumber}
                  onChange={(e) => setStockForm({ ...stockForm, batchNumber: e.target.value })}
                />
                <Input
                  label="Batch Expiry Date"
                  type="date"
                  value={stockForm.expiryDate}
                  onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })}
                />
              </div>

              <Input
                label="Serial Numbers (comma separated)"
                placeholder="S/N-001, S/N-002..."
                value={stockForm.serialNumbers}
                onChange={(e) => setStockForm({ ...stockForm, serialNumbers: e.target.value })}
              />

              <Input
                label="Remarks"
                placeholder="Purchase Order, Sales reference details..."
                value={stockForm.remarks}
                onChange={(e) => setStockForm({ ...stockForm, remarks: e.target.value })}
              />

              <Button type="submit" className="w-full">Log Transaction</Button>
            </form>
          </Card>

          {/* Adjustments Approval matrix ledger */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Stock Adjustments approvals ledger" subtitle="Verification logs and multi-level action matrix." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Item Code</th>
                      <th className="p-4">Qty adjusted</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Reason / Comments</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-ag-ink-3">No adjustments pending or approved.</td>
                      </tr>
                    ) : (
                      adjustments.map((adj) => (
                        <tr key={adj._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4">
                            <span className="font-bold text-ag-ink block">{adj.itemName}</span>
                            <span className="text-[10px] text-ag-ink-3">Code: {adj.itemCode} • WH: {adj.warehouseCode}</span>
                          </td>
                          <td className="p-4 font-bold text-ag-ink">
                            {adj.type === 'in' ? '+' : '-'}{adj.quantityAdjusted}
                          </td>
                          <td className="p-4 font-semibold text-ag-ink capitalize">{adj.type}</td>
                          <td className="p-4 text-ag-ink-2">{adj.reason}</td>
                          <td className="p-4"><StatusBadge status={adj.status} /></td>
                          <td className="p-4">
                            {adj.status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleActionAdjustment(adj._id, 'approved')}>Approve</Button>
                                <Button size="sm" variant="secondary" onClick={() => handleActionAdjustment(adj._id, 'rejected')}>Reject</Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-ag-ink-3 font-semibold">Processed</span>
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
              <CardHeader title="Trigger Manual Adjustment Request" subtitle="Fast verification tools to write off damaged items." />
              <div className="p-6">
                <p className="text-xs text-ag-ink-3 mb-4">You can request manual inventory adjustments on any registered item, which will go to the administrative review list above.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {items.slice(0, 4).map(item => (
                    <div key={item._id} className="border border-ag-border p-4 rounded-xl space-y-3">
                      <span className="font-bold text-ag-ink block truncate">{item.name}</span>
                      <span className="text-[10px] text-ag-ink-3 block">Code: {item.itemCode}</span>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleCreateAdjustment(item.itemCode, 'WH-MUM-01', 5, 'in')}>+5</Button>
                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleCreateAdjustment(item.itemCode, 'WH-MUM-01', 5, 'out')}>-5</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 5. CYCLE COUNTING TAB */}
      {activeTab === 'counting' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submit count sheet */}
          <Card>
            <CardHeader title="Schedule & Submit Physical Count" subtitle="Reconcile database quantities against physical audit numbers." />
            <form className="p-6 space-y-4" onSubmit={handleCountSubmit}>
              <div>
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Choose Warehouse *</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                  value={countForm.warehouseCode}
                  onChange={(e) => setCountForm({ ...countForm, warehouseCode: e.target.value })}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w.code}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider">Counted Items</label>
                  <Button size="sm" type="button" onClick={handleAddCountItem}>+ Add Item</Button>
                </div>

                {countForm.items.map((item, idx) => (
                  <div key={idx} className="border border-ag-border/50 p-3 rounded-lg space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-ag-ink-3 uppercase mb-1">Item *</label>
                      <select
                        className="w-full h-9 px-2 bg-ag-surface border border-ag-border rounded-lg text-xs text-ag-ink focus:outline-none"
                        value={item.itemCode}
                        onChange={(e) => {
                          const newItems = [...countForm.items];
                          newItems[idx].itemCode = e.target.value;
                          setCountForm({ ...countForm, items: newItems });
                        }}
                      >
                        <option value="">Select Item</option>
                        {items.map((i) => (
                          <option key={i._id} value={i.itemCode}>{i.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Physical Count Qty"
                        type="number"
                        value={item.countedQuantity}
                        onChange={(e) => {
                          const newItems = [...countForm.items];
                          newItems[idx].countedQuantity = Number(e.target.value);
                          setCountForm({ ...countForm, items: newItems });
                        }}
                      />
                      <Input
                        label="Remarks"
                        placeholder="Condition..."
                        value={item.remarks}
                        onChange={(e) => {
                          const newItems = [...countForm.items];
                          newItems[idx].remarks = e.target.value;
                          setCountForm({ ...countForm, items: newItems });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full">Submit Count Sheet</Button>
            </form>
          </Card>

          {/* Counts Ledger */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Physical Counts Verification Ledger" subtitle="Review scheduled audits, deviations, and apply reconciliation rules." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">WH Code</th>
                      <th className="p-4">Checked Date</th>
                      <th className="p-4">Counted Lines</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No counts verified yet.</td>
                      </tr>
                    ) : (
                      counts.map((c) => (
                        <tr key={c._id} className="border-b border-ag-border hover:bg-ag-surface-2/40">
                          <td className="p-4 font-mono font-bold text-ag-primary">{c.warehouseCode}</td>
                          <td className="p-4 text-ag-ink-2">{c.countDate}</td>
                          <td className="p-4 text-ag-ink-2 font-semibold">{c.itemsCheckedCount} entries</td>
                          <td className="p-4"><StatusBadge status={c.status} /></td>
                          <td className="p-4 flex gap-2">
                            <Button size="sm" onClick={() => fetchCountDetails(c._id)}>View Details</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Selected Count Details Panel */}
            {selectedCountDetails && (
              <Card className="border-ag-primary/20">
                <CardHeader
                  title={`Count Sheet Details: ${selectedCountDetails.warehouseCode}`}
                  subtitle={`Audited on ${selectedCountDetails.countDate} • Status: ${selectedCountDetails.status.toUpperCase()}`}
                />
                <div className="p-6 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                          <th className="p-2">Item Name (Code)</th>
                          <th className="p-2 text-right">System Qty</th>
                          <th className="p-2 text-right">Counted Qty</th>
                          <th className="p-2 text-right">Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCountDetails.items.map((ci: any, idx: number) => (
                          <tr key={idx} className="border-b border-ag-border last:border-0">
                            <td className="p-2 font-bold text-ag-ink">{ci.itemName} ({ci.itemCode})</td>
                            <td className="p-2 text-right text-ag-ink-2">{ci.systemQuantity}</td>
                            <td className="p-2 text-right text-ag-ink-2">{ci.countedQuantity}</td>
                            <td className={`p-2 text-right font-bold ${
                              ci.variance > 0 ? 'text-ag-primary' : ci.variance < 0 ? 'text-ag-coral' : 'text-ag-ink-3'
                            }`}>
                              {ci.variance > 0 ? `+${ci.variance}` : ci.variance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedCountDetails.status === 'pending' && (
                    <div className="flex gap-3 justify-end">
                      <Button onClick={() => handleActionCount(selectedCountDetails._id, 'approved')}>
                        Approve & Apply Adjustments
                      </Button>
                      <Button variant="secondary" onClick={() => handleActionCount(selectedCountDetails._id, 'rejected')}>
                        Reject Sheet
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 6. AI PLANNER & VALUATION TAB */}
      {activeTab === 'ai' && (
        <div className="space-y-8">
          {/* Valuation switch methods */}
          <Card>
            <CardHeader
              title="Inventory Valuation ledger"
              subtitle="Dynamically compute costing levels across different inventory accounting methodologies."
            />
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                {[
                  { key: 'AVERAGE', label: 'Weighted Average cost' },
                  { key: 'FIFO', label: 'FIFO (First-In, First-Out)' },
                  { key: 'LIFO', label: 'LIFO (Last-In, First-Out)' }
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setValuationMethod(m.key as any)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      valuationMethod === m.key
                        ? 'bg-ag-primary text-white border-ag-primary'
                        : 'border-ag-border text-ag-ink-3 hover:text-ag-ink'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto border border-ag-border rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">Item Details</th>
                      <th className="p-4">SKU Code</th>
                      <th className="p-4 text-right">In-Stock Qty</th>
                      <th className="p-4 text-right">Method Unit Cost</th>
                      <th className="p-4 text-right">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No valuation records available.</td>
                      </tr>
                    ) : (
                      valuations.map((val, idx) => (
                        <tr key={idx} className="border-b border-ag-border last:border-0 hover:bg-ag-surface-2/40">
                          <td className="p-4 font-bold text-ag-ink">{val.itemName} ({val.itemCode})</td>
                          <td className="p-4 font-mono text-ag-primary">{val.sku}</td>
                          <td className="p-4 text-right text-ag-ink-2">{val.totalQuantity} {val.uom}s</td>
                          <td className="p-4 text-right text-ag-ink-2">₹{val.averageUnitCost.toFixed(2)}</td>
                          <td className="p-4 text-right font-extrabold text-ag-ink">₹{val.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Auto-reorder warnings recommendations */}
            <Card>
              <CardHeader title="AI Automated Reorder Suggestions" subtitle="Dynamic Economic Order Quantities (EOQ) suggested based on lead times." />
              <div className="p-6 space-y-4">
                {reorders.length === 0 ? (
                  <p className="text-xs text-ag-ink-3">All item levels nominal. No reorders needed.</p>
                ) : (
                  reorders.map((r, idx) => (
                    <div key={idx} className="border border-ag-border/60 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-ag-ink text-sm block">{r.itemName}</span>
                        <span className="text-xs text-ag-ink-3 block">Current: {r.currentStock} units • Reorder point: {r.reorderPoint}</span>
                        <span className="text-[10px] text-ag-primary font-bold block mt-1">Recommended Purchase: {r.recommendedOrderQuantity} units</span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          r.priority === 'high' ? 'bg-ag-accent-coral/10 text-ag-accent-coral' : 'bg-ag-primary/10 text-ag-primary'
                        }`}>
                          {r.priority} Priority
                        </span>
                        <span className="text-[10px] text-ag-ink-3 block mt-2">{r.preferredVendor}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* AI demand forecast cosine simulation */}
            <Card>
              <CardHeader title="AI Demand Forecasting" subtitle="Cosine-factor seasonality predictive analysis on consumption histories." />
              <div className="p-6 space-y-6">
                <div className="flex gap-3">
                  <select
                    className="flex-1 h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={forecastItemCode}
                    onChange={(e) => setForecastItemCode(e.target.value)}
                  >
                    <option value="">Choose item for forecast</option>
                    {items.map((i) => (
                      <option key={i._id} value={i.itemCode}>{i.name}</option>
                    ))}
                  </select>
                  <Button onClick={loadForecast}>Compute Forecast</Button>
                </div>

                {forecastData ? (
                  <div className="space-y-4">
                    <div className="bg-ag-surface-2 p-4 rounded-xl text-xs flex justify-between border border-ag-border">
                      <div>
                        <span className="text-ag-ink-3 block">Average Daily Demand</span>
                        <span className="text-lg font-bold text-ag-ink">{forecastData.averageDailyDemand.toFixed(2)} units</span>
                      </div>
                      <div className="text-right">
                        <span className="text-ag-ink-3 block">Confidence Threshold</span>
                        <span className="text-lg font-bold text-ag-primary">92.4% max</span>
                      </div>
                    </div>

                    <div className="h-48 overflow-y-auto space-y-2 border border-ag-border p-3 rounded-xl no-scrollbar">
                      {forecastData.points.map((pt: any) => (
                        <div key={pt.day} className="flex justify-between items-center text-xs border-b border-ag-border/50 pb-2 last:border-0 last:pb-0">
                          <span className="text-ag-ink-2 font-medium">Day +{pt.day}</span>
                          <span className="text-ag-ink font-bold">{pt.predictedQuantity} units</span>
                          <span className="text-[10px] text-ag-ink-3">Confidence: {pt.confidenceScore}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-ag-ink-3">Select an item and trigger forecasting computation.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Spatial Capacity warnings */}
          <Card>
            <CardHeader title="AI Spatial Capacity Suggestions" subtitle="Automated alerts and routing optimization recommenders." />
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optimizationRecs.map((rec, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-ag-primary/5 to-transparent border border-ag-border p-4 rounded-xl flex gap-3 items-start">
                    <span className="p-2 bg-ag-primary/10 rounded-lg text-ag-primary">
                      <Sparkle size={18} />
                    </span>
                    <div>
                      <span className="font-bold text-xs text-ag-ink block mb-1">Warehouse {rec.warehouseCode}</span>
                      <p className="text-[11px] text-ag-ink-3 leading-relaxed">{rec.recommendation}</p>
                      <span className="text-[9px] font-mono text-ag-primary bg-ag-primary/5 px-2 py-0.5 rounded-full inline-block mt-2">{rec.action.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
