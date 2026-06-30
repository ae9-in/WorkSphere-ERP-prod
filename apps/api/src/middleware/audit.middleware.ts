import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.model';

export async function auditLog(action: string, details: string, req: Request) {
  try {
    if (!req.user) return;
    await AuditLog.create({
      companyId: req.user.companyId || 'company_01',
      userId: req.user.sub,
      email: req.user.email,
      action,
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || ''
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
export function auditMiddleware(actionName: string, moduleName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fire and forget or trigger on finish
    const originalJson = res.json;
    res.json = function (body: any) {
      res.json = originalJson;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        auditLog(actionName, `Performed action on module ${moduleName}: ${req.method} ${req.originalUrl}`, req);
      }
      return res.json(body);
    };
    next();
  };
}
export default auditMiddleware;
