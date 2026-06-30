import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { Employee } from '../models/Employee.model';
import { Company } from '../models/Company.model';
import { env } from '../config/env';

function generateAccessToken(payload: object): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as any,
  });
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, portal } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+passwordHash');

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Portal-based authorization check
    if (portal) {
      if (portal === 'super_admin') {
        if (user.role !== 'super_admin') {
          res.status(401).json({ success: false, message: 'Access denied. Please use the HR Admin or Employee login portal.' });
          return;
        }
      } else if (portal === 'employee') {
        if (user.role !== 'employee') {
          res.status(401).json({ success: false, message: 'Access denied. Please use the HR Admin portal at /login.' });
          return;
        }
      } else if (portal === 'tenant_admin') {
        if (user.role === 'super_admin') {
          res.status(401).json({ success: false, message: 'Access denied. Please use the Super Admin portal at /admin/login.' });
          return;
        }
        if (user.role === 'employee') {
          res.status(401).json({ success: false, message: 'Access denied. Please use the Employee portal at /employee/login.' });
          return;
        }
      }
    }

    // Tenant active check
    if (user.role !== 'super_admin' && user.companyId) {
      const company = await Company.findOne({ slug: user.companyId }).lean();
      if (company && company.status === 'suspended') {
        res.status(403).json({
          success: false,
          message: 'Your organization has been suspended. Please contact platform support.'
        });
        return;
      }
    }

    const tokenPayload = {
      sub:         user._id.toString(),
      employeeId:  user.employeeId,
      companyId:   user.companyId,
      role:        user.role,
      permissions: user.permissions,
      sessionId:   user._id.toString(),
      email:       user.email,
      fullName:    user.fullName,
    };

    const accessToken = generateAccessToken(tokenPayload);

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          userId:      user._id.toString(),
          employeeId:  user.employeeId,
          companyId:   user.companyId,
          role:        user.role,
          permissions: user.permissions,
          email:       user.email,
          fullName:    user.fullName,
          photo:       user.photo,
          sessionId:   user._id.toString(),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: 'Logged out' });
}

// GET /api/auth/me
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.sub);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        userId:      user._id.toString(),
        employeeId:  user.employeeId,
        companyId:   user.companyId,
        role:        user.role,
        permissions: user.permissions,
        email:       user.email,
        fullName:    user.fullName,
        photo:       user.photo,
        sessionId:   user._id.toString(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /api/auth/refresh — simplified: just re-sign
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      res.status(401).json({ success: false, message: 'No token' });
      return;
    }

    // Verify even if expired to extract payload
    const payload = jwt.decode(token) as jwt.JwtPayload | null;
    if (!payload?.sub) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    const newToken = generateAccessToken({
      sub:         user._id.toString(),
      employeeId:  user.employeeId,
      companyId:   user.companyId,
      role:        user.role,
      permissions: user.permissions,
      sessionId:   user._id.toString(),
      email:       user.email,
      fullName:    user.fullName,
    });

    res.json({ success: true, data: { accessToken: newToken } });
  } catch {
    res.status(401).json({ success: false, message: 'Token refresh failed' });
  }
}

// POST /api/auth/signup
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const {
      firstName,
      lastName,
      companyName,
      email,
      phone,
      companySize,
      country,
      password,
      workspaceSlug,
      industry,
      roleDept,
    } = req.body;

    if (!email || !password || !firstName || !lastName || !companyName) {
      res.status(400).json({ success: false, message: 'Missing required signup fields' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const slug = workspaceSlug || companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existingCompany = await Company.findOne({ slug }).lean();
    if (existingCompany) {
      res.status(400).json({ success: false, message: 'Workspace URL slug is already taken' });
      return;
    }

    // 1. Create Tenant Company
    const company = new Company({
      name: companyName,
      slug,
      status: 'active',
      industry,
      size: companySize,
      country,
      subscriptionPlan: 'free',
      subscriptionStatus: 'active',
    });
    await company.save();

    // 2. Create Employee Profile
    const count = await Employee.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(3, '0')}`;

    const employee = new Employee({
      employeeId,
      companyId: slug,
      fullName: `${firstName} ${lastName}`,
      personal: {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        personalEmail: email,
        personalPhone: phone,
        nationality: 'Indian',
      },
      official: {
        workEmail: email,
        workPhone: phone,
        employeeType: 'full_time',
        dateOfJoining: new Date().toISOString().split('T')[0],
        status: 'active',
      },
      job: {
        departmentName: roleDept || 'Management',
        designationName: 'Company Admin / Founder',
        workMode: 'hybrid',
        locationName: country || 'India',
      },
      salary: {
        ctc: 0,
        basicPercent: 40,
        currency: 'INR',
        effectiveDate: new Date().toISOString().split('T')[0],
        paymentMode: 'bank_transfer',
      }
    });
    await employee.save();

    // 3. Create User Account
    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password,
      fullName: `${firstName} ${lastName}`,
      role: 'hr_head',
      permissions: ['employee:*', 'onboarding:*', 'offboarding:*', 'payroll:*', 'attendance:*', 'reports:*', 'documents:*', 'workflow:*'],
      employeeId,
      companyId: slug,
      isActive: true,
    });
    await user.save();

    const tokenPayload = {
      sub:         user._id.toString(),
      employeeId:  user.employeeId,
      companyId:   user.companyId,
      role:        user.role,
      permissions: user.permissions,
      sessionId:   user._id.toString(),
      email:       user.email,
      fullName:    user.fullName,
    };

    const accessToken = generateAccessToken(tokenPayload);

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          userId:      user._id.toString(),
          employeeId:  user.employeeId,
          companyId:   user.companyId,
          role:        user.role,
          permissions: user.permissions,
          email:       user.email,
          fullName:    user.fullName,
          photo:       user.photo,
          sessionId:   user._id.toString(),
        },
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
}
