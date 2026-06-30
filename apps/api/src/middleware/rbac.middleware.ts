import { Request, Response, NextFunction } from 'express';
import { Company } from '../models/Company.model';

/**
 * Checks if the user has one of the allowed roles.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. No user session found.' });
      return;
    }

    if (req.user.role === 'super_admin') {
      return next(); // Super Admin has global override
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: `Forbidden. Role '${req.user.role}' does not have access.` });
      return;
    }

    next();
  };
}

/**
 * Checks if the user has the required permission (supports wildcards, e.g., 'employee:*').
 */
export function requirePermission(requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. No user session found.' });
      return;
    }

    const userPerms = req.user.permissions || [];

    // Super Admin or global permission override
    if (req.user.role === 'super_admin' || userPerms.includes('*')) {
      return next();
    }

    const hasPermission = requiredPermissions.every(reqPerm => {
      // Direct match
      if (userPerms.includes(reqPerm)) return true;

      // Wildcard check (e.g. employee:read matches employee:*)
      const [reqDomain] = reqPerm.split(':');
      return userPerms.some(userPerm => {
        const [userDomain, userAction] = userPerm.split(':');
        return userDomain === reqDomain && userAction === '*';
      });
    });

    if (!hasPermission) {
      res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if the company tenant is active and matches the user's token.
 */
export async function verifyTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. No user session found.' });
      return;
    }

    // Platform Super Admin does not operate under a tenant scope
    if (req.user.role === 'super_admin') {
      return next();
    }

    const companyId = req.user.companyId;
    if (!companyId || companyId === 'platform') {
      res.status(400).json({ success: false, message: 'Bad Request. Missing tenant context.' });
      return;
    }

    // Fetch tenant status from MongoDB
    const company = await Company.findOne({ slug: companyId }).lean();
    if (!company) {
      res.status(404).json({ success: false, message: 'Tenant company not found.' });
      return;
    }

    if (company.status === 'suspended') {
      res.status(403).json({
        success: false,
        message: 'Your company organization has been suspended. Please contact platform support.'
      });
      return;
    }

    next();
  } catch (err) {
    console.error('Tenant verification error:', err);
    res.status(500).json({ success: false, message: 'Server error during tenant verification.' });
  }
}
