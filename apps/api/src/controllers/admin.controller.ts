import { Request, Response } from 'express';
import { Company } from '../models/Company.model';
import { User } from '../models/User.model';
import { Employee } from '../models/Employee.model';

// GET /api/admin/companies
export async function listCompanies(req: Request, res: Response): Promise<void> {
  try {
    const companies = await Company.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: companies });
  } catch (err) {
    console.error('List companies error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve companies list.' });
  }
}

// PATCH /api/admin/companies/:id/status
export async function updateCompanyStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status value.' });
      return;
    }

    const company = await Company.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    res.json({ success: true, data: company });
  } catch (err) {
    console.error('Update company status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update company status.' });
  }
}

// PATCH /api/admin/companies/:id/subscription
export async function updateCompanySubscription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { subscriptionPlan, subscriptionStatus } = req.body;

    const updates: Record<string, any> = {};
    if (subscriptionPlan) {
      if (!['free', 'growth', 'enterprise'].includes(subscriptionPlan)) {
        res.status(400).json({ success: false, message: 'Invalid subscription plan.' });
        return;
      }
      updates.subscriptionPlan = subscriptionPlan;
    }

    if (subscriptionStatus) {
      if (!['active', 'canceled'].includes(subscriptionStatus)) {
        res.status(400).json({ success: false, message: 'Invalid subscription status.' });
        return;
      }
      updates.subscriptionStatus = subscriptionStatus;
    }

    const company = await Company.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    res.json({ success: true, data: company });
  } catch (err) {
    console.error('Update company plan error:', err);
    res.status(500).json({ success: false, message: 'Failed to update company subscription plan.' });
  }
}

// GET /api/admin/stats
export async function getPlatformStats(req: Request, res: Response): Promise<void> {
  try {
    const [
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      totalUsers,
      totalEmployees,
      freePlans,
      growthPlans,
      enterprisePlans,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ status: 'active' }),
      Company.countDocuments({ status: 'suspended' }),
      User.countDocuments({ role: { $ne: 'super_admin' } }),
      Employee.countDocuments(),
      Company.countDocuments({ subscriptionPlan: 'free' }),
      Company.countDocuments({ subscriptionPlan: 'growth' }),
      Company.countDocuments({ subscriptionPlan: 'enterprise' }),
    ]);

    res.json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        suspendedCompanies,
        totalUsers,
        totalEmployees,
        plans: {
          free: freePlans,
          growth: growthPlans,
          enterprise: enterprisePlans,
        },
      },
    });
  } catch (err) {
    console.error('Get platform stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve platform statistics.' });
  }
}
