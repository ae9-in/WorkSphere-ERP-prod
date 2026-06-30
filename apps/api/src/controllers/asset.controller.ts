import { Request, Response } from 'express';
import { Asset } from '../models/Asset.model';
import { AssetHistory } from '../models/AssetHistory.model';
import { auditLog } from '../middleware/audit.middleware';

export async function createAsset(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const asset = await Asset.create({ ...req.body, companyId });
    await auditLog('ASSET_CREATED', `Created asset tag ${req.body.assetTag}`, req);
    res.status(201).json({ success: true, data: asset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAssets(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const filter: Record<string, any> = { companyId };
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.employeeId) filter.currentEmployeeId = req.query.employeeId;

    const assets = await Asset.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: assets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function assignAsset(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const { id } = req.params;
    const { employeeId, condition, remarks } = req.body;

    const asset = await Asset.findOne({ _id: id, companyId });
    if (!asset) {
      res.status(404).json({ success: false, message: 'Asset not found' });
      return;
    }

    asset.status = 'assigned';
    asset.currentEmployeeId = employeeId;
    asset.assignedAt = new Date();
    asset.condition = condition;
    if (remarks) asset.notes = remarks;
    await asset.save();

    // Log history
    await AssetHistory.create({
      assetId: asset._id,
      employeeId,
      action: 'assigned',
      condition,
      remarks,
      by: req.user?.sub || 'user_id'
    });

    await auditLog('ASSET_ASSIGNED', `Assigned asset tag ${asset.assetTag} to employee ${employeeId}`, req);
    res.json({ success: true, data: asset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function returnAsset(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const { id } = req.params;
    const { condition, remarks } = req.body;

    const asset = await Asset.findOne({ _id: id, companyId });
    if (!asset) {
      res.status(404).json({ success: false, message: 'Asset not found' });
      return;
    }

    const previousEmployee = asset.currentEmployeeId;

    asset.status = 'available';
    asset.currentEmployeeId = undefined;
    asset.returnedAt = new Date();
    asset.condition = condition;
    if (remarks) asset.notes = remarks;
    await asset.save();

    // Log history
    await AssetHistory.create({
      assetId: asset._id,
      employeeId: previousEmployee,
      action: 'returned',
      condition,
      remarks,
      by: req.user?.sub || 'user_id'
    });

    await auditLog('ASSET_RETURNED', `Returned asset tag ${asset.assetTag} from employee ${previousEmployee}`, req);
    res.json({ success: true, data: asset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAssetsByEmployee(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const assets = await Asset.find({ companyId, currentEmployeeId: req.params.employeeId }).lean();
    res.json({ success: true, data: assets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAssetSummaryReport(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const summary = await Asset.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
