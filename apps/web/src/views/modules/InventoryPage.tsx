import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { inventoryService, employeeService } from '@/services/api.service';
import { StatusBadge } from '@/components/ui/Badge/Badge';
import {
  Package, Archive, ArrowsClockwise, CheckSquare, Sparkle, Warning,
  Plus, Calculator, ChartLine, ArrowUpRight, ArrowDownRight, ArrowsHorizontal, ClipboardText,
  User, Barcode, ShieldCheck, Coins, FileArrowDown, X
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InventoryPage() {
  const params = useParams();
  const navigate = useNavigate();
  const moduleKey = params['*'] || 'overview';
  
  const [activeTab, setActiveTab] = useState<string>(moduleKey);
  const [activeOpSubTab, setActiveOpSubTab] = useState<'journal' | 'qa' | 'landed'>('journal');
  
  // Data States
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<any[]>([]);

  // Modals / Forms Trigger
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPOForm, setShowPOForm] = useState(false);
  const [showGRNForm, setShowGRNForm] = useState(false);

  // Forms States
  const [supplierForm, setSupplierForm] = useState({
    companyName: '',
    supplierCode: '',
    gst: '',
    pan: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: 'Net 30',
    leadTimeDays: 7
  });

  const [poForm, setPoForm] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    shippingAddress: '',
    items: [{ itemId: '', quantity: 1, unitPrice: 0 }]
  });

  const [grnForm, setGrnForm] = useState({
    purchaseOrderId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });
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
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeReservations, setActiveReservations] = useState<any[]>([]);
  
  // Master Detail Item state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
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
    currency: 'INR',
    parentCode: ''
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

  // QA Inspection Form State
  const [qaInspectionForm, setQaInspectionForm] = useState({
    itemCode: '',
    batchNumber: '',
    sampleSize: 1,
    failedQuantity: 0,
    checklistJson: '{"packaging_intact": true, "dimensions_correct": true}',
    status: 'passed',
    remarks: ''
  });

  // Landed Cost Form State
  const [landedCostForm, setLandedCostForm] = useState({
    voucherNumber: 'LCV-' + Math.floor(1000 + Math.random() * 9000),
    distributeBy: 'quantity',
    totalExpenses: 500,
    items: [] as { itemCode: string; purchaseReceiptId: string; receiptQuantity: number; allocatedExpense: number }[]
  });

  const [newLandedCostItem, setNewLandedCostItem] = useState({
    itemCode: '',
    purchaseReceiptId: 'PR-' + Math.floor(1000 + Math.random() * 9000),
    receiptQuantity: 50,
    allocatedExpense: 0
  });

  // Reservation form state
  const [reservationForm, setReservationForm] = useState({
    itemCode: '',
    warehouseCode: '',
    locationCode: '',
    quantity: 5,
    referenceType: 'sales_order',
    referenceId: 'SO-101',
    expiryDate: ''
  });

  // Serial Checkout form states
  const [serialAssignmentForm, setSerialAssignmentForm] = useState({
    itemCode: '',
    serialNumber: '',
    employeeId: '',
    conditionOnAssign: 'good'
  });

  const [serialReturnForm, setSerialReturnForm] = useState({
    itemCode: '',
    serialNumber: '',
    conditionOnReturn: 'good'
  });

  const [valuationMethod, setValuationMethod] = useState<'FIFO' | 'LIFO' | 'AVERAGE'>('AVERAGE');
  const [forecastItemCode, setForecastItemCode] = useState('');
  const [forecastData, setForecastData] = useState<any>(null);

  const [scanMockCode, setScanMockCode] = useState('');

  useEffect(() => {
    if (moduleKey) {
      setActiveTab(moduleKey);
    }
  }, [moduleKey]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dash, itemList, catList, whList, locList, adjList, countList, reorderList, valList, optList, activeResList, empList, supplierList, poList, grnList] = await Promise.all([
        inventoryService.getDashboard().catch(() => null),
        inventoryService.getItems().catch(() => []),
        inventoryService.getCategories().catch(() => []),
        inventoryService.getWarehouses().catch(() => []),
        inventoryService.getLocations().catch(() => []),
        inventoryService.getAdjustments().catch(() => []),
        inventoryService.getCounts().catch(() => []),
        inventoryService.getReorders().catch(() => []),
        inventoryService.getValuation(valuationMethod).catch(() => []),
        inventoryService.getOptimization().catch(() => []),
        inventoryService.getReservations().catch(() => []),
        employeeService.list({ limit: 100 }).then(res => res.employees).catch(() => []),
        inventoryService.getSuppliers().catch(() => []),
        inventoryService.getPurchaseOrders().catch(() => []),
        inventoryService.getGoodsReceipts().catch(() => [])
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
      setActiveReservations(activeResList);
      setEmployees(empList);
      setSuppliers(supplierList);
      setPurchaseOrders(poList);
      setGoodsReceipts(grnList);

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

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const updated = await inventoryService.updateItem(selectedItem._id, {
        name: selectedItem.name,
        brand: selectedItem.brand,
        manufacturer: selectedItem.manufacturer,
        description: selectedItem.description,
        minStock: Number(selectedItem.minStock),
        maxStock: Number(selectedItem.maxStock),
        safetyStock: Number(selectedItem.safetyStock),
        reorderPoint: Number(selectedItem.reorderPoint),
        preferredVendor: selectedItem.preferredVendor,
        defaultWarehouseCode: selectedItem.defaultWarehouseCode,
        status: selectedItem.status
      });
      toast.success('Item Master settings updated!');
      setSelectedItem(updated);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update item settings');
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    if (!confirm('Are you sure you want to deactivate this product SKU?')) return;
    try {
      await inventoryService.deleteItem(selectedItem._id);
      toast.success('SKU marked as deactivated.');
      setSelectedItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete item');
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
      toast.success('Warehouse hub configured!');
      setWarehouseForm({ code: '', name: '', address: '', capacity: 2000, type: 'distribution', currency: 'INR', parentCode: '' });
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
      toast.success('Storage bin mapped successfully!');
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
      toast.error(err.response?.data?.detail || 'Stock operation failed due to bounds or reservations');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationForm.itemCode || !reservationForm.warehouseCode) {
      toast.error('Reservation requires item code and warehouse code');
      return;
    }
    try {
      await inventoryService.createReservation({
        ...reservationForm,
        quantity: Number(reservationForm.quantity),
        expiryDate: reservationForm.expiryDate || undefined
      });
      toast.success('Stock reserved and held!');
      setReservationForm({
        itemCode: '',
        warehouseCode: '',
        locationCode: '',
        quantity: 5,
        referenceType: 'sales_order',
        referenceId: 'SO-101',
        expiryDate: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to place reservation lock');
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      await inventoryService.cancelReservation(id);
      toast.success('Stock reservation lock released!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Release failed');
    }
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaInspectionForm.itemCode || !qaInspectionForm.batchNumber) {
      toast.error('Item and Batch Number are required');
      return;
    }
    try {
      let checklist = {};
      try {
        checklist = JSON.parse(qaInspectionForm.checklistJson);
      } catch {
        toast.error('Invalid checklist JSON syntax');
        return;
      }
      await inventoryService.submitInspection({
        itemCode: qaInspectionForm.itemCode,
        batchNumber: qaInspectionForm.batchNumber,
        sampleSize: Number(qaInspectionForm.sampleSize),
        failedQuantity: Number(qaInspectionForm.failedQuantity),
        checklist,
        status: qaInspectionForm.status,
        remarks: qaInspectionForm.remarks
      });
      toast.success('Inspection results posted. Batch status updated!');
      setQaInspectionForm({
        itemCode: '',
        batchNumber: '',
        sampleSize: 1,
        failedQuantity: 0,
        checklistJson: '{"packaging_intact": true, "dimensions_correct": true}',
        status: 'passed',
        remarks: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Inspection posting failed');
    }
  };

  const handleAddLandedCostItem = () => {
    if (!newLandedCostItem.itemCode) return;
    setLandedCostForm(prev => ({
      ...prev,
      items: [...prev.items, { ...newLandedCostItem }]
    }));
    setNewLandedCostItem({
      itemCode: '',
      purchaseReceiptId: 'PR-' + Math.floor(1000 + Math.random() * 9000),
      receiptQuantity: 50,
      allocatedExpense: 0
    });
  };

  const handlePostLandedCosts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!landedCostForm.voucherNumber || landedCostForm.items.length === 0) {
      toast.error('Enter voucher details and add at least one item');
      return;
    }
    try {
      await inventoryService.postLandedCosts(landedCostForm);
      toast.success('Landed Cost Voucher posted! Unit costs updated.');
      setLandedCostForm({
        voucherNumber: 'LCV-' + Math.floor(1000 + Math.random() * 9000),
        distributeBy: 'quantity',
        totalExpenses: 500,
        items: []
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to distribute landed costs');
    }
  };

  const handleAssignSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialAssignmentForm.itemCode || !serialAssignmentForm.serialNumber || !serialAssignmentForm.employeeId) {
      toast.error('Enter all assignment checkout parameters');
      return;
    }
    try {
      await inventoryService.assignSerial(serialAssignmentForm);
      toast.success('Serial asset checked out and assigned to employee!');
      setSerialAssignmentForm({
        itemCode: '',
        serialNumber: '',
        employeeId: '',
        conditionOnAssign: 'good'
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Checkout failed');
    }
  };

  const handleReturnSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialReturnForm.itemCode || !serialReturnForm.serialNumber) {
      toast.error('Item and Serial Number are required');
      return;
    }
    try {
      await inventoryService.returnSerial(serialReturnForm);
      toast.success('Serial asset return logged. Back in stock!');
      setSerialReturnForm({
        itemCode: '',
        serialNumber: '',
        conditionOnReturn: 'good'
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Return check-in failed');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.companyName || !supplierForm.supplierCode) {
      toast.error('Company Name and Supplier Code are required');
      return;
    }
    try {
      await inventoryService.createSupplier(supplierForm);
      toast.success('Supplier account registered successfully!');
      setShowSupplierForm(false);
      setSupplierForm({
        companyName: '',
        supplierCode: '',
        gst: '',
        pan: '',
        email: '',
        phone: '',
        address: '',
        paymentTerms: 'Net 30',
        leadTimeDays: 7
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create supplier profile');
    }
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.supplierId || poForm.items.some(i => !i.itemId)) {
      toast.error('Supplier and line items itemId are required');
      return;
    }
    try {
      await inventoryService.createPurchaseOrder(poForm);
      toast.success('Purchase Order issued successfully!');
      setShowPOForm(false);
      setPoForm({
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDelivery: '',
        shippingAddress: '',
        items: [{ itemId: '', quantity: 1, unitPrice: 0 }]
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to generate Purchase Order');
    }
  };

  const handleCreateGoodsReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnForm.purchaseOrderId) {
      toast.error('Select a Purchase Order to receive');
      return;
    }
    try {
      await inventoryService.createGoodsReceipt(grnForm);
      toast.success('Goods Receipt Note issued. Inventory updated!');
      setShowGRNForm(false);
      setGrnForm({
        purchaseOrderId: '',
        receiptDate: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to post Goods Receipt');
    }
  };

  const handleMockCSVImport = async () => {
    try {
      const mockItems = [
        { name: 'Pneumatic Cylinder P1', sku: 'PNM-CYL-001', categoryCode: 'RAW', uom: 'piece', minStock: 5, maxStock: 50, reorderPoint: 8 },
        { name: 'Industrial Filter G2', sku: 'IND-FLT-002', categoryCode: 'RAW', uom: 'piece', minStock: 10, maxStock: 100, reorderPoint: 15 }
      ];
      const res = await inventoryService.importItems({ items: mockItems });
      toast.success(`Bulk CSV simulated import complete. Registered ${res.importedCount} items!`);
      fetchData();
    } catch {
      toast.error('Bulk import parser failed');
    }
  };

  const handleScanMockInput = () => {
    if (!scanMockCode) return;
    const matched = items.find(i => i.barcode === scanMockCode || i.sku === scanMockCode);
    if (matched) {
      setSelectedItem(matched);
      setActiveTab('items');
      toast.success(`SKU scan match found: ${matched.name}`);
    } else {
      toast.error('Barcode not found in registry catalog.');
    }
    setScanMockCode('');
  };

  const handleCreateAdjustment = async (itemCode: string, whCode: string, qty: number, type: 'in' | 'out') => {
    const reason = prompt('Enter adjustment reason (e.g. Obsolete stock, broken packaging):');
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

  // Dynamic historical data for Area chart based on database valuation
  const historyData = dashboard?.totalValuation 
    ? [
        { name: 'Initial', value: 0 },
        { name: 'Current Valuation', value: dashboard.totalValuation }
      ]
    : [];

  return (
    <PageContainer
      title="Inventory, Warehouse & Assets Operations"
      subtitle="Enterprise SKU master logs, multi-warehouse zones, cycle checks, valuations and AI predictors."
      actions={
        <div className="flex gap-2">
          {activeTab === 'items' && (
            <Button variant="secondary" onClick={handleMockCSVImport} icon={<FileArrowDown size={18} />}>
              Import CSV Catalog
            </Button>
          )}
          {activeTab === 'suppliers' && (
            <Button onClick={() => setShowSupplierForm(true)} icon={<Plus size={16} />}>Register Supplier</Button>
          )}
          {activeTab === 'purchase-orders' && (
            <>
              <Button onClick={() => setShowPOForm(true)} icon={<Plus size={16} />}>New PO</Button>
              <Button variant="secondary" onClick={() => setShowGRNForm(true)} icon={<CheckSquare size={16} />}>Log Goods Receipt</Button>
            </>
          )}
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
            Sync Registry
          </Button>
        </div>
      }
    >
      {/* Search barcode simulator */}
      <div className="flex gap-2 mb-6 p-4 bg-ag-surface-2 rounded-xl border border-ag-border max-w-md items-center">
        <Barcode size={24} className="text-ag-primary" />
        <Input
          placeholder="Simulate SKU / Barcode Scan..."
          value={scanMockCode}
          onChange={(e) => setScanMockCode(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleScanMockInput}>Scan</Button>
      </div>

      {/* Glassmorphic Tab Selector */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8 overflow-x-auto max-w-full">
        {[
          { key: 'overview', label: 'Dashboard', icon: <Package size={16} /> },
          { key: 'items', label: 'Items Master', icon: <ClipboardText size={16} /> },
          { key: 'warehouses', label: 'Warehouses & Bins', icon: <Archive size={16} /> },
          { key: 'purchase-orders', label: 'Purchase Orders', icon: <FileArrowDown size={16} /> },
          { key: 'suppliers', label: 'Supplier Profiles', icon: <User size={16} /> },
          { key: 'operations', label: 'Stock Transactions', icon: <ArrowUpRight size={16} /> },
          { key: 'counting', label: 'Cycle Verify', icon: <CheckSquare size={16} /> },
          { key: 'ai', label: 'AI Planner & Valuations', icon: <ChartLine size={16} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              navigate(`/inventory/${tab.key}`);
              if (tab.key !== 'items') setSelectedItem(null);
            }}
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
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Stock Holds (Reservations)</p>
                    <h3 className="text-3xl font-extrabold text-ag-ink mt-2">
                      {activeReservations.length}
                    </h3>
                  </div>
                  <div className="p-3 bg-ag-surface-3 rounded-xl text-ag-ink-2">
                    <Archive size={24} />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-ag-ink-3">
                  Quantities locked for sales & projects
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider">Active Bins</p>
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
            {/* Historical Valuation Trend Area Chart */}
            <Card className="col-span-2">
              <CardHeader title="Inventory Financial Valuation Trend" subtitle="Calculated monthly aggregate asset levels." />
              <div className="p-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B3CF5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#5B3CF5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Valuation']} />
                    <Area type="monotone" dataKey="value" stroke="#5B3CF5" strokeWidth={2} fillOpacity={1} fill="url(#valGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Warehouse Capacity occupancy */}
            <Card>
              <CardHeader title="Warehouse Storage Occupancy" subtitle="Utilization ratios calculated from current bin counts vs limits." />
              <div className="p-6 space-y-5 overflow-y-auto h-64 no-scrollbar">
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
          </div>
        </div>
      )}

      {/* PURCHASE ORDERS TAB */}
      {activeTab === 'purchase-orders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Total Purchase Orders</p>
                <h3 className="text-2xl font-black mt-1 text-ag-ink">{purchaseOrders.length}</h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Pending Delivery</p>
                <h3 className="text-2xl font-black mt-1 text-ag-primary">
                  {purchaseOrders.filter(p => p.status === 'draft' || p.status === 'pending').length}
                </h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Fulfilled Orders</p>
                <h3 className="text-2xl font-black mt-1 text-green-600">
                  {purchaseOrders.filter(p => p.status === 'delivered').length}
                </h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Procurement Value</p>
                <h3 className="text-2xl font-black mt-1 text-ag-ink">
                  ₹{purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0).toLocaleString()}
                </h3>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Procurement Purchase Orders" subtitle="Track replenishment cycles, goods receipt notes, and billing verification." />
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                    <th className="p-4">PO Number</th>
                    <th className="p-4">Supplier Account</th>
                    <th className="p-4">Order Date</th>
                    <th className="p-4">Expected Delivery</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-ag-ink-3">No Purchase Orders logged. Create one using the "+ New PO" action.</td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po._id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-ag-primary">{po.poNumber}</td>
                        <td className="p-4 font-semibold text-ag-ink">{po.supplierName}</td>
                        <td className="p-4">{po.orderDate}</td>
                        <td className="p-4">{po.expectedDelivery || 'N/A'}</td>
                        <td className="p-4 font-mono font-bold">₹{(po.totalAmount || 0).toLocaleString()}</td>
                        <td className="p-4">
                          <StatusBadge status={po.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Goods Receipt (GRN) History" subtitle="Track received inventory shipments, quality inspection status, and stock updates." />
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                    <th className="p-4">GRN Number</th>
                    <th className="p-4">Reference PO</th>
                    <th className="p-4">Receipt Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">QA Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {goodsReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-ag-ink-3">No Goods Receipt Notes registered. Log a GRN from the action panel.</td>
                    </tr>
                  ) : (
                    goodsReceipts.map((grn) => (
                      <tr key={grn._id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-ag-primary">{grn.grnNumber}</td>
                        <td className="p-4 font-mono font-semibold">{grn.poNumber}</td>
                        <td className="p-4">{grn.receiptDate}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full inline-block">
                            {grn.status}
                          </span>
                        </td>
                        <td className="p-4 text-ag-ink-3 font-medium">{grn.remarks || 'No QA inspection issues logged.'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Total Suppliers</p>
                <h3 className="text-2xl font-black mt-1 text-ag-ink">{suppliers.length}</h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Preferred Suppliers</p>
                <h3 className="text-2xl font-black mt-1 text-ag-primary">
                  {suppliers.filter(s => s.rating >= 4.5).length}
                </h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Average Lead Time</p>
                <h3 className="text-2xl font-black mt-1 text-ag-ink">
                  {suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + s.leadTimeDays, 0) / suppliers.length).toFixed(1) : 0} Days
                </h3>
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-ag-ink-3 uppercase font-extrabold tracking-wider">Average Quality Rating</p>
                <h3 className="text-2xl font-black mt-1 text-green-600">
                  ★ {suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1) : '5.0'} / 5.0
                </h3>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Corporate Vendor & Suppliers Registry" subtitle="Review procurement terms, GST certificates, lead timelines, and ratings scorecards." />
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase tracking-wider">
                    <th className="p-4">Company Name</th>
                    <th className="p-4">Supplier Code</th>
                    <th className="p-4">GSTIN Details</th>
                    <th className="p-4">Contact Profile</th>
                    <th className="p-4">Terms</th>
                    <th className="p-4">Lead Time</th>
                    <th className="p-4">SLA Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-ag-ink-3">No registered corporate suppliers. Click "+ Register Supplier" to create.</td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s._id} className="border-b border-ag-border hover:bg-ag-surface-2/40 transition-colors">
                        <td className="p-4 font-extrabold text-ag-ink">{s.companyName}</td>
                        <td className="p-4 font-mono text-ag-primary font-semibold">{s.supplierCode}</td>
                        <td className="p-4 font-mono">{s.gst || 'N/A'}</td>
                        <td className="p-4">
                          <span className="block font-medium">{s.email || 'N/A'}</span>
                          <span className="text-[10px] text-ag-ink-3">{s.phone || 'N/A'}</span>
                        </td>
                        <td className="p-4 font-medium text-ag-ink-2">{s.paymentTerms}</td>
                        <td className="p-4 font-semibold">{s.leadTimeDays} Days</td>
                        <td className="p-4 text-green-600 font-bold">★ {s.rating.toFixed(1)} / 5.0</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 2. ITEMS MASTER TAB (MASTER DETAIL LAYOUT) */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: SKU lists (Master) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Item Master Catalog" subtitle="Master register containing all active enterprise-grade products." />
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
                        <td colSpan={5} className="p-4 text-center text-ag-ink-3">No items. Create one in the right panel.</td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr
                          key={item._id}
                          onClick={() => setSelectedItem(item)}
                          className={`border-b border-ag-border cursor-pointer transition-all ${
                            selectedItem?._id === item._id ? 'bg-ag-primary/5 hover:bg-ag-primary/10' : 'hover:bg-ag-surface-2/40'
                          }`}
                        >
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

          {/* Right panel: Details (Detail Panel or creation form) */}
          <div className="space-y-8">
            {selectedItem ? (
              // Selected Item Detail view
              <div className="space-y-8">
                <Card className="border-ag-primary/30">
                  <div className="p-4 bg-ag-primary/5 border-b border-ag-border flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-ag-ink">SKU Master details</h4>
                      <p className="text-[10px] text-ag-ink-3">Editing configuration for {selectedItem.itemCode}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedItem(null)}>Close</Button>
                  </div>
                  <form className="p-6 space-y-4" onSubmit={handleUpdateItem}>
                    <Input
                      label="Item Name"
                      value={selectedItem.name}
                      onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Brand"
                        value={selectedItem.brand || ''}
                        onChange={(e) => setSelectedItem({ ...selectedItem, brand: e.target.value })}
                      />
                      <Input
                        label="Manufacturer"
                        value={selectedItem.manufacturer || ''}
                        onChange={(e) => setSelectedItem({ ...selectedItem, manufacturer: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Min Stock"
                        type="number"
                        value={selectedItem.minStock}
                        onChange={(e) => setSelectedItem({ ...selectedItem, minStock: Number(e.target.value) })}
                      />
                      <Input
                        label="Reorder Point"
                        type="number"
                        value={selectedItem.reorderPoint}
                        onChange={(e) => setSelectedItem({ ...selectedItem, reorderPoint: Number(e.target.value) })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Safety Stock"
                        type="number"
                        value={selectedItem.safetyStock}
                        onChange={(e) => setSelectedItem({ ...selectedItem, safetyStock: Number(e.target.value) })}
                      />
                      <Input
                        label="Max Stock"
                        type="number"
                        value={selectedItem.maxStock}
                        onChange={(e) => setSelectedItem({ ...selectedItem, maxStock: Number(e.target.value) })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Status</label>
                        <select
                          className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                          value={selectedItem.status}
                          onChange={(e) => setSelectedItem({ ...selectedItem, status: e.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <Input
                        label="Preferred Vendor"
                        value={selectedItem.preferredVendor || ''}
                        onChange={(e) => setSelectedItem({ ...selectedItem, preferredVendor: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Save Configuration</Button>
                      <Button variant="secondary" type="button" onClick={handleDeleteItem} className="text-ag-coral border-ag-coral/35">Deactivate</Button>
                    </div>
                  </form>
                </Card>

                {/* Printable barcode layout */}
                <Card>
                  <CardHeader title="System Label Output" subtitle="Rendered barcode representation." />
                  <div className="p-6 flex flex-col items-center justify-center bg-ag-surface-2 rounded-xl m-4 border border-dashed border-ag-border">
                    <Barcode size={48} className="text-ag-ink" />
                    <span className="font-mono text-xs font-bold mt-2">{selectedItem.sku}</span>
                    <span className="text-[10px] text-ag-ink-3 uppercase mt-1">{selectedItem.name}</span>
                    <Button size="sm" variant="secondary" className="mt-4" onClick={() => window.print()}>Print Label PDF</Button>
                  </div>
                </Card>

                {/* Stock Reservations for this specific item */}
                <Card>
                  <CardHeader title="Item Reservations Lock" subtitle="Create active quantity holds." />
                  <div className="p-6 space-y-4">
                    <form onSubmit={handleCreateReservation} className="space-y-4 border-b border-ag-border pb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Qty to Reserve"
                          type="number"
                          value={reservationForm.quantity}
                          onChange={(e) => setReservationForm({ ...reservationForm, quantity: Number(e.target.value), itemCode: selectedItem.itemCode })}
                        />
                        <div>
                          <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">WH Code</label>
                          <select
                            className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                            value={reservationForm.warehouseCode}
                            onChange={(e) => setReservationForm({ ...reservationForm, warehouseCode: e.target.value, itemCode: selectedItem.itemCode })}
                          >
                            <option value="">Select WH</option>
                            {warehouses.map(w => (
                              <option key={w._id} value={w.code}>{w.code}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Doc Reference</label>
                          <select
                            className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                            value={reservationForm.referenceType}
                            onChange={(e) => setReservationForm({ ...reservationForm, referenceType: e.target.value })}
                          >
                            <option value="sales_order">Sales Order</option>
                            <option value="work_order">Work Order</option>
                            <option value="project">Project Lock</option>
                          </select>
                        </div>
                        <Input
                          label="Doc ID #"
                          value={reservationForm.referenceId}
                          onChange={(e) => setReservationForm({ ...reservationForm, referenceId: e.target.value })}
                        />
                      </div>
                      <Input
                        label="Expiry Date"
                        type="date"
                        value={reservationForm.expiryDate}
                        onChange={(e) => setReservationForm({ ...reservationForm, expiryDate: e.target.value })}
                      />
                      <Button type="submit" className="w-full">Reserve Stock Hold</Button>
                    </form>

                    {/* Active reservations details */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-ag-ink">Active Hold List</span>
                      {activeReservations.filter(r => r.itemCode === selectedItem.itemCode).length === 0 ? (
                        <p className="text-[10px] text-ag-ink-3">No active holds for this SKU.</p>
                      ) : (
                        activeReservations.filter(r => r.itemCode === selectedItem.itemCode).map((r) => (
                          <div key={r._id} className="p-3 bg-ag-surface-2 rounded-xl flex justify-between items-center text-[11px] border border-ag-border">
                            <div>
                              <p className="font-bold text-ag-ink">Qty: {r.quantity} ({r.warehouseCode})</p>
                              <p className="text-[9px] text-ag-ink-3">{r.referenceType.toUpperCase()} #{r.referenceId}</p>
                            </div>
                            <Button size="sm" variant="secondary" className="text-ag-coral border-ag-coral/20 px-2 py-1" onClick={() => handleCancelReservation(r._id)}>Cancel</Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              // Standard catalog creation forms
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            )}
          </div>
        </div>
      )}

      {/* 3. WAREHOUSES & LOCATIONS TAB */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader title="Registered Warehouses & Hubs" subtitle="Structural layout definitions including hierarchies." />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2 text-ag-ink-2 font-bold uppercase">
                      <th className="p-4">WH Details</th>
                      <th className="p-4">Parent Hub</th>
                      <th className="p-4">Capacity limit</th>
                      <th className="p-4">Type</th>
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
                          <td className="p-4 font-semibold text-ag-primary">{wh.parentCode || 'Main Hub'}</td>
                          <td className="p-4 text-ag-ink-2">{wh.capacity ? `${wh.capacity.toLocaleString()} units` : 'Infinite'}</td>
                          <td className="p-4 text-ag-ink-2 capitalize">{wh.type}</td>
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

          {/* Warehouse creations */}
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
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Parent Warehouse Hub</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={warehouseForm.parentCode}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, parentCode: e.target.value })}
                  >
                    <option value="">No Parent (Root Hub)</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w.code}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="space-y-8">
          {/* Sub menu tabs inside operations */}
          <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border">
            {[
              { key: 'journal', label: 'Stock Journal Ledger', icon: <ArrowUpRight size={14} /> },
              { key: 'qa', label: 'Quality Control Gate', icon: <ShieldCheck size={14} /> },
              { key: 'landed', label: 'Landed Cost Worksheets', icon: <Coins size={14} /> }
            ].map(sub => (
              <button
                key={sub.key}
                type="button"
                onClick={() => setActiveOpSubTab(sub.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeOpSubTab === sub.key ? 'bg-ag-primary text-white' : 'text-ag-ink-3 hover:text-ag-ink'
                }`}
              >
                {sub.icon}
                {sub.label}
              </button>
            ))}
          </div>

          {activeOpSubTab === 'journal' && (
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <CardHeader title="Stock Adjustments approvals ledger" subtitle="Verification logs and verification review lists." />
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
                  <CardHeader title="Trigger Manual Adjustment Request" subtitle="Verification tools to adjust item volumes." />
                  <div className="p-6">
                    <p className="text-xs text-ag-ink-3 mb-4">You can request manual inventory adjustments on any registered item, which will go to the administrative review list above.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {items.slice(0, 4).map(item => (
                        <div key={item._id} className="border border-ag-border p-4 rounded-xl space-y-3">
                          <span className="font-bold text-xs text-ag-ink block truncate">{item.name}</span>
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

          {activeOpSubTab === 'qa' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quality inspection Gate Form */}
              <Card>
                <CardHeader title="Record QA inspection Checklist" subtitle="Approve quarantined batch lines into usable stock." />
                <form onSubmit={handleSubmitInspection} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Item *</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={qaInspectionForm.itemCode}
                      onChange={(e) => setQaInspectionForm({ ...qaInspectionForm, itemCode: e.target.value })}
                    >
                      <option value="">Select Item</option>
                      {items.map(i => (
                        <option key={i._id} value={i.itemCode}>{i.name} ({i.sku})</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Batch Number *"
                    placeholder="e.g. BATCH-01"
                    value={qaInspectionForm.batchNumber}
                    onChange={(e) => setQaInspectionForm({ ...qaInspectionForm, batchNumber: e.target.value })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Sample Size"
                      type="number"
                      value={qaInspectionForm.sampleSize}
                      onChange={(e) => setQaInspectionForm({ ...qaInspectionForm, sampleSize: Number(e.target.value) })}
                    />
                    <Input
                      label="Failed Qty"
                      type="number"
                      value={qaInspectionForm.failedQuantity}
                      onChange={(e) => setQaInspectionForm({ ...qaInspectionForm, failedQuantity: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Checklist JSON</label>
                    <textarea
                      rows={3}
                      className="w-full p-3 bg-ag-surface border border-ag-border rounded-lg text-xs font-mono text-ag-ink focus:outline-none"
                      value={qaInspectionForm.checklistJson}
                      onChange={(e) => setQaInspectionForm({ ...qaInspectionForm, checklistJson: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">QA Status Decision</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={qaInspectionForm.status}
                      onChange={(e) => setQaInspectionForm({ ...qaInspectionForm, status: e.target.value })}
                    >
                      <option value="passed">Passed (Release from Quarantine)</option>
                      <option value="failed">Failed (Mark Rejected)</option>
                    </select>
                  </div>
                  <Input
                    label="Remarks"
                    placeholder="QC testing details..."
                    value={qaInspectionForm.remarks}
                    onChange={(e) => setQaInspectionForm({ ...qaInspectionForm, remarks: e.target.value })}
                  />
                  <Button type="submit" className="w-full">Post Inspection Decision</Button>
                </form>
              </Card>

              {/* QA inspection standards summary */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader title="Active Quality Quarantine Batches" subtitle="Batches received and currently locked in quarantine status." />
                  <div className="p-6">
                    <p className="text-xs text-ag-ink-3 mb-4">Quarantined batches cannot be shipped or transferred until inspected by a quality engineer.</p>
                    <div className="space-y-4">
                      {items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="p-4 bg-ag-surface-2 rounded-xl border border-ag-border flex justify-between items-center">
                          <div>
                            <span className="font-bold text-xs text-ag-ink">{item.name}</span>
                            <span className="text-[10px] text-ag-ink-3 block mt-1">Batch: BATCH-MOCK-{idx+1} • Status: QUARANTINE</span>
                          </div>
                          <Button size="sm" onClick={() => setQaInspectionForm({ ...qaInspectionForm, itemCode: item.itemCode, batchNumber: `BATCH-MOCK-${idx+1}` })}>Load QA Form</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeOpSubTab === 'landed' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Landed cost worksheet creation */}
              <Card>
                <CardHeader title="Landed Cost Voucher worksheet" subtitle="Distribute freight invoice expenses onto receipt items." />
                <form onSubmit={handlePostLandedCosts} className="p-6 space-y-4">
                  <Input
                    label="Voucher Number *"
                    value={landedCostForm.voucherNumber}
                    onChange={(e) => setLandedCostForm({ ...landedCostForm, voucherNumber: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Distribute Cost By</label>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={landedCostForm.distributeBy}
                      onChange={(e) => setLandedCostForm({ ...landedCostForm, distributeBy: e.target.value })}
                    >
                      <option value="quantity">Item Quantity</option>
                      <option value="value">Item Value Share</option>
                    </select>
                  </div>
                  <Input
                    label="Total External Expenses (₹) *"
                    type="number"
                    value={landedCostForm.totalExpenses}
                    onChange={(e) => setLandedCostForm({ ...landedCostForm, totalExpenses: Number(e.target.value) })}
                  />
                  
                  <div className="border-t border-ag-border pt-4 space-y-3">
                    <span className="text-xs font-bold text-ag-ink block">Add Receipt Items</span>
                    <select
                      className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                      value={newLandedCostItem.itemCode}
                      onChange={(e) => setNewLandedCostItem({ ...newLandedCostItem, itemCode: e.target.value })}
                    >
                      <option value="">Select SKU</option>
                      {items.map(i => (
                        <option key={i._id} value={i.itemCode}>{i.name}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Receipt Qty"
                        type="number"
                        value={newLandedCostItem.receiptQuantity}
                        onChange={(e) => setNewLandedCostItem({ ...newLandedCostItem, receiptQuantity: Number(e.target.value) })}
                      />
                      <Input
                        label="PO receipt ID"
                        value={newLandedCostItem.purchaseReceiptId}
                        onChange={(e) => setNewLandedCostItem({ ...newLandedCostItem, purchaseReceiptId: e.target.value })}
                      />
                    </div>
                    <Button variant="secondary" type="button" onClick={handleAddLandedCostItem} className="w-full text-xs">+ Add to worksheet</Button>
                  </div>

                  <Button type="submit" className="w-full">Post Cost Distributions</Button>
                </form>
              </Card>

              {/* Landed cost worksheet item grids */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader title="Landed Cost items Worksheet" subtitle="SKUs and receipts awaiting distribution calculations." />
                  <div className="p-6">
                    {landedCostForm.items.length === 0 ? (
                      <p className="text-xs text-ag-ink-3">No receipt lines added to this voucher worksheet yet.</p>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-ag-border text-ag-ink-2 font-bold bg-ag-surface-2 uppercase">
                            <th className="p-3">SKU Code</th>
                            <th className="p-3">PO Receipt ID</th>
                            <th className="p-3 text-right">Receipt Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {landedCostForm.items.map((it, idx) => (
                            <tr key={idx} className="border-b border-ag-border">
                              <td className="p-3 font-bold text-ag-ink">{it.itemCode}</td>
                              <td className="p-3 text-ag-ink-2 font-mono">{it.purchaseReceiptId}</td>
                              <td className="p-3 text-right font-medium">{it.receiptQuantity} units</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}
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
          {/* Valuation methods */}
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

          {/* Serialized Asset Assignments checkout logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader title="Serial Asset checkout" subtitle="Assign serial numbers (Laptops, Tools) to Employees." />
              <form onSubmit={handleAssignSerial} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Choose SKU *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={serialAssignmentForm.itemCode}
                    onChange={(e) => setSerialAssignmentForm({ ...serialAssignmentForm, itemCode: e.target.value })}
                  >
                    <option value="">Select Item</option>
                    {items.map(i => (
                      <option key={i._id} value={i.itemCode}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Serial Number *"
                  placeholder="e.g. S/N-7734"
                  value={serialAssignmentForm.serialNumber}
                  onChange={(e) => setSerialAssignmentForm({ ...serialAssignmentForm, serialNumber: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Assign to Employee *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={serialAssignmentForm.employeeId}
                    onChange={(e) => setSerialAssignmentForm({ ...serialAssignmentForm, employeeId: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.code})</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Condition on Assignment"
                  value={serialAssignmentForm.conditionOnAssign}
                  onChange={(e) => setSerialAssignmentForm({ ...serialAssignmentForm, conditionOnAssign: e.target.value })}
                />
                <Button type="submit" className="w-full">Assign & Checkout Asset</Button>
              </form>
            </Card>

            <Card>
              <CardHeader title="Serial Asset return check-in" subtitle="Record return details of serial asset lines." />
              <form onSubmit={handleReturnSerial} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider mb-2">Choose SKU *</label>
                  <select
                    className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                    value={serialReturnForm.itemCode}
                    onChange={(e) => setSerialReturnForm({ ...serialReturnForm, itemCode: e.target.value })}
                  >
                    <option value="">Select Item</option>
                    {items.map(i => (
                      <option key={i._id} value={i.itemCode}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Serial Number *"
                  placeholder="e.g. S/N-7734"
                  value={serialReturnForm.serialNumber}
                  onChange={(e) => setSerialReturnForm({ ...serialReturnForm, serialNumber: e.target.value })}
                />
                <Input
                  label="Condition on Return *"
                  placeholder="e.g. Good, Damaged, Needs Calibration"
                  value={serialReturnForm.conditionOnReturn}
                  onChange={(e) => setSerialReturnForm({ ...serialReturnForm, conditionOnReturn: e.target.value })}
                />
                <Button type="submit" className="w-full">Process Asset Return</Button>
              </form>
            </Card>

            {/* Active Asset assignments listing */}
            <Card>
              <CardHeader title="Checked-out Serial Assets" subtitle="Summary of serial assets currently in custody." />
              <div className="p-6 space-y-4 overflow-y-auto max-h-[350px] no-scrollbar">
                {items.slice(0, 1).map((item) => (
                  <div key={item._id} className="p-4 bg-ag-surface-2 rounded-xl border border-ag-border space-y-2">
                    <span className="font-bold text-xs text-ag-ink">{item.name}</span>
                    <span className="font-mono text-[10px] text-ag-primary block">S/N: SN-MOCK-1002</span>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-ag-ink-3">
                      <span>Custodian: Amit Sharma</span>
                      <span className="px-2 py-0.5 bg-ag-primary/10 text-ag-primary rounded-full">Checked Out</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Auto-reorder suggestions */}
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

            {/* AI demand forecast */}
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
      {/* ── Modal: Register Supplier ── */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80 text-left">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Register Corporate Supplier Profile</span>
              <Button variant="ghost" size="sm" onClick={() => setShowSupplierForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateSupplier} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Supplier Company Name"
                  value={supplierForm.companyName}
                  onChange={e => setSupplierForm({ ...supplierForm, companyName: e.target.value })}
                  required
                />
                <Input
                  label="Unique Supplier Code"
                  value={supplierForm.supplierCode}
                  onChange={e => setSupplierForm({ ...supplierForm, supplierCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. SPL-MUMBAI-01"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="GSTIN Number (Taxation)"
                  value={supplierForm.gst}
                  onChange={e => setSupplierForm({ ...supplierForm, gst: e.target.value.toUpperCase() })}
                  placeholder="27AAAAA1111A1Z1"
                />
                <Input
                  label="PAN Card Number"
                  value={supplierForm.pan}
                  onChange={e => setSupplierForm({ ...supplierForm, pan: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Contact Email Address"
                  type="email"
                  value={supplierForm.email}
                  onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                />
                <Input
                  label="Contact Telephone"
                  value={supplierForm.phone}
                  onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Input
                  label="Payment Terms"
                  value={supplierForm.paymentTerms}
                  onChange={e => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                  placeholder="e.g. Net 30, Net 60"
                />
                <Input
                  label="Lead Time (Days)"
                  type="number"
                  value={supplierForm.leadTimeDays}
                  onChange={e => setSupplierForm({ ...supplierForm, leadTimeDays: parseInt(e.target.value || '7') })}
                />
              </div>
              <Input
                label="Billing/HQ Address"
                value={supplierForm.address}
                onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Save Supplier</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Create Purchase Order ── */}
      {showPOForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80 text-left">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Issue Purchase Order (PO)</span>
              <Button variant="ghost" size="sm" onClick={() => setShowPOForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreatePurchaseOrder} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="ag-label ag-label--required">Select Supplier Account</label>
                  <select
                    className="ag-input"
                    value={poForm.supplierId}
                    onChange={e => setPoForm({ ...poForm, supplierId: e.target.value })}
                    required
                  >
                    <option value="">Choose supplier...</option>
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.companyName} ({s.supplierCode})</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="PO Order Date"
                  type="date"
                  value={poForm.orderDate}
                  onChange={e => setPoForm({ ...poForm, orderDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Expected Delivery Date"
                  type="date"
                  value={poForm.expectedDelivery}
                  onChange={e => setPoForm({ ...poForm, expectedDelivery: e.target.value })}
                />
                <Input
                  label="Delivery Shipping Address"
                  value={poForm.shippingAddress}
                  onChange={e => setPoForm({ ...poForm, shippingAddress: e.target.value })}
                  placeholder="HQ Warehousing hub"
                />
              </div>

              <div className="space-y-4 border-t border-ag-border pt-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-ag-ink">Items Calculation Lines</h4>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => setPoForm({
                      ...poForm,
                      items: [...poForm.items, { itemId: '', quantity: 1, unitPrice: 0 }]
                    })}
                  >
                    + Add Row
                  </Button>
                </div>
                {poForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-end border-b border-dashed border-ag-border pb-4">
                    <div className="flex-1">
                      <div className="w-full flex flex-col gap-1.5">
                        <label className="ag-label ag-label--required">Product Item</label>
                        <select
                          className="ag-input"
                          value={item.itemId}
                          onChange={e => {
                            const newItems = [...poForm.items];
                            newItems[idx].itemId = e.target.value;
                            setPoForm({ ...poForm, items: newItems });
                          }}
                          required
                        >
                          <option value="">Choose item...</option>
                          {items.map(i => (
                            <option key={i._id} value={i._id}>{i.name} ({i.sku})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="w-20">
                      <Input
                        label="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...poForm.items];
                          newItems[idx].quantity = parseFloat(e.target.value || '1');
                          setPoForm({ ...poForm, items: newItems });
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
                          const newItems = [...poForm.items];
                          newItems[idx].unitPrice = parseFloat(e.target.value || '0');
                          setPoForm({ ...poForm, items: newItems });
                        }}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPoForm({
                        ...poForm,
                        items: poForm.items.filter((_, i) => i !== idx)
                      })}
                      className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full py-3 text-sm font-bold">Generate Purchase Order</Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Goods Receipt GRN ── */}
      {showGRNForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <Card className="p-8 max-w-2xl w-full my-8 shadow-2xl border border-ag-border/80 text-left">
            <h3 className="font-extrabold text-base text-ag-ink border-b border-ag-border pb-4 mb-6 flex justify-between items-center">
              <span>Log Goods Receipt (GRN)</span>
              <Button variant="ghost" size="sm" onClick={() => setShowGRNForm(false)} icon={<X size={16} />} />
            </h3>
            <form onSubmit={handleCreateGoodsReceipt} className="space-y-6">
              <div className="w-full flex flex-col gap-1.5">
                <label className="ag-label ag-label--required">Select Purchase Order Reference</label>
                <select
                  className="ag-input"
                  value={grnForm.purchaseOrderId}
                  onChange={e => setGrnForm({ ...grnForm, purchaseOrderId: e.target.value })}
                  required
                >
                  <option value="">Choose pending PO...</option>
                  {purchaseOrders.filter(p => p.status === 'draft' || p.status === 'pending').map(po => (
                    <option key={po._id} value={po._id}>{po.poNumber} - {po.supplierName}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Receipt Date"
                type="date"
                value={grnForm.receiptDate}
                onChange={e => setGrnForm({ ...grnForm, receiptDate: e.target.value })}
                required
              />
              <Input
                label="QA Inspection Remarks / Notes"
                value={grnForm.remarks}
                onChange={e => setGrnForm({ ...grnForm, remarks: e.target.value })}
                placeholder="Check packaging seal integrity and dimensional QA parameters."
              />
              <Button type="submit" className="w-full py-3 text-sm font-bold">Process Goods Receipt Note</Button>
            </form>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

