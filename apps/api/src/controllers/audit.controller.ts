import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog.model';

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const filter: Record<string, any> = { companyId };
    if (req.query.action) filter.action = req.query.action;
    if (req.query.email) filter.email = new RegExp(String(req.query.email), 'i');

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
