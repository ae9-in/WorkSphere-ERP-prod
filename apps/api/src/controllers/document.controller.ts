import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DocumentModel } from '../models/Document.model';
import { auditLog } from '../middleware/audit.middleware';

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const { name, category, employeeId, size, mimeType, expiryDate, url } = req.body;

    const doc = await DocumentModel.create({
      companyId,
      employeeId,
      category,
      type: mimeType?.split('/')[1] || 'pdf',
      name,
      version: 1,
      url: url || 'https://cloudinary.com/placeholder-doc.pdf',
      size: size || 1024,
      mimeType: mimeType || 'application/pdf',
      expiryDate,
      uploadedBy: req.user?.sub || 'user_id',
      isExpired: false
    });

    await auditLog('DOCUMENT_UPLOADED', `Uploaded document ${name} to category ${category}`, req);
    res.status(201).json({ success: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDocuments(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const filter: Record<string, any> = { companyId };
    
    if (req.query.category) filter.category = req.query.category;
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;

    const docs = await DocumentModel.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function downloadDocument(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const doc = await DocumentModel.findOne({ _id: req.params.id, companyId });
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    // Return signed URL or standard URL
    res.json({ success: true, data: { url: doc.url } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyDocument(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const doc = await DocumentModel.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { $set: { verifiedBy: req.user?.sub, verifiedAt: new Date() } },
      { new: true }
    );
    res.json({ success: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteDocument(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    await DocumentModel.findOneAndDelete({ _id: req.params.id, companyId });
    await auditLog('DOCUMENT_DELETED', `Deleted document ID ${req.params.id}`, req);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getExpiringDocuments(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const days = Number(req.query.days) || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    const docs = await DocumentModel.find({
      companyId,
      expiryDate: { $gte: new Date(), $lte: thresholdDate }
    }).lean();

    res.json({ success: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
