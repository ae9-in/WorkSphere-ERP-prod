import { Request, Response } from 'express';
import { Notification } from '../models/Notification.model';

// GET /api/notifications
export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId ?? 'company_01';
    const query: Record<string, any> = { companyId };

    // Employees can only fetch notifications for themselves (or general public company notifications)
    if (req.user?.role === 'employee') {
      query['$or'] = [
        { recipientId: req.user.employeeId },
        { recipientId: { $exists: false } },
        { recipientId: null },
        { recipientId: '' }
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
}

// PATCH /api/notifications/:id/read
export async function markRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId ?? 'company_01';

    const query: Record<string, any> = { _id: id, companyId };
    if (req.user?.role === 'employee') {
      query.recipientId = req.user.employeeId;
    }

    const record = await Notification.findOneAndUpdate(query, { read: true });
    if (!record) {
      res.status(404).json({ success: false, message: 'Notification not found or access denied.' });
      return;
    }
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
}

// PATCH /api/notifications/read-all
export async function markAllRead(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId ?? 'company_01';
    const query: Record<string, any> = { companyId, read: false };
    if (req.user?.role === 'employee') {
      query.recipientId = req.user.employeeId;
    }

    await Notification.updateMany(query, { read: true });
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
}
