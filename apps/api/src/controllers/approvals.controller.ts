import { Request, Response } from 'express';
import { Approval } from '../models/Approval.model';
import { Notification } from '../models/Notification.model';

// GET /api/approvals?status=pending
export async function getApprovals(req: Request, res: Response): Promise<void> {
  try {
    const status = String(req.query.status || 'pending').trim();
    const companyId = req.user?.companyId || 'company_01';
    const filter: Record<string, unknown> = { companyId };
    if (status !== 'all') filter['status'] = status;

    // Employees can only view their own requests
    if (req.user?.role === 'employee') {
      filter['employeeId'] = req.user.employeeId;
    }

    const approvals = await Approval.find(filter).sort({ requestedAt: -1 }).lean();
    res.json({ success: true, data: approvals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch approvals' });
  }
}

// PATCH /api/approvals/:id/approve
export async function approveRequest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId || 'company_01';

    const approval = await Approval.findOneAndUpdate(
      { _id: id, companyId },
      { status: 'approved', resolvedAt: new Date() },
      { new: true }
    );

    if (!approval) {
      res.status(404).json({ success: false, message: 'Approval not found or access denied.' });
      return;
    }

    // Create confirmation notification
    await Notification.create({
      type:      'approval_granted',
      companyId,
      title:     `${approval.type} Approved`,
      message:   `${approval.fullName}'s ${approval.type.toLowerCase()} has been approved.`,
      read:      false,
      url:       '/approvals',
      actor:     { name: approval.fullName },
    });

    res.json({ success: true, data: approval });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Approval failed' });
  }
}

// PATCH /api/approvals/:id/reject
export async function rejectRequest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId || 'company_01';

    const approval = await Approval.findOneAndUpdate(
      { _id: id, companyId },
      { status: 'rejected', resolvedAt: new Date() },
      { new: true }
    );

    if (!approval) {
      res.status(404).json({ success: false, message: 'Approval not found or access denied.' });
      return;
    }

    await Notification.create({
      type:      'approval_rejected',
      companyId,
      title:     `${approval.type} Rejected`,
      message:   `${approval.fullName}'s ${approval.type.toLowerCase()} has been rejected.`,
      read:      false,
      url:       '/approvals',
      actor:     { name: approval.fullName },
    });

    res.json({ success: true, data: approval });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Rejection failed' });
  }
}

// POST /api/approvals — submit new approval request
export async function createApproval(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const employeeId = req.user?.role === 'employee' ? req.user.employeeId : req.body.employeeId;
    const fullName = req.user?.role === 'employee' ? req.user.fullName : req.body.fullName;

    const approval = await Approval.create({
      ...req.body,
      companyId,
      employeeId,
      fullName,
      status: 'pending',
      requestedAt: new Date()
    });
    res.status(201).json({ success: true, data: approval });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create approval request' });
  }
}
