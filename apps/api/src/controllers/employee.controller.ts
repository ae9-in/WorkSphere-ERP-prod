import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Employee } from '../models/Employee.model';
import { User } from '../models/User.model';

// GET /api/employees
export async function listEmployees(req: Request, res: Response): Promise<void> {
  try {
    const page   = Math.max(1, Number(req.query.page)  || 1);
    const limit  = Math.min(100, Number(req.query.limit) || 10);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || 'all').trim();

    const filter: Record<string, unknown> = {
      isArchived: false,
      companyId: req.user?.companyId || 'company_01'
    };

    if (search) {
      filter['$text'] = { $search: search };
    }

    if (status && status !== 'all') {
      filter['official.status'] = status;
    }

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .select('employeeId fullName personal.firstName personal.lastName personal.photo official.status official.workEmail official.employeeType official.dateOfJoining job.departmentName job.designationName job.locationName job.workMode')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        employees,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to list employees' });
  }
}

// GET /api/employees/:id
export async function getEmployee(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId || 'company_01';
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, companyId }
      : { employeeId: id, companyId };

    const employee = await Employee.findOne({ ...query, isArchived: false }).lean();

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // Role restriction: Employees can only view their own profile
    if (req.user?.role === 'employee' && req.user.employeeId !== employee.employeeId) {
      res.status(403).json({ success: false, message: 'Forbidden. Access restricted to own profile.' });
      return;
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get employee' });
  }
}

// POST /api/employees
export async function createEmployee(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;

    // Auto-generate employeeId
    const count = await Employee.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(3, '0')}`;
    const fullName = `${body.personal?.firstName ?? ''} ${body.personal?.lastName ?? ''}`.trim();

    const employee = await Employee.create({
      ...body,
      employeeId,
      fullName,
      companyId:          req.user?.companyId || 'company_01',
      'official.status':  'active',
    });

    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
}

// PATCH /api/employees/:id
export async function updateEmployee(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId || 'company_01';
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, companyId }
      : { employeeId: id, companyId };

    const employee = await Employee.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // Sync updates to corresponding User document if applicable
    const userUpdate: Record<string, any> = {};
    if (req.body.fullName) {
      userUpdate.fullName = req.body.fullName;
    }
    
    // Check both flat path and nested path for work email
    const newEmail = req.body['official.workEmail'] || req.body.official?.workEmail;
    if (newEmail) {
      userUpdate.email = newEmail.toLowerCase();
    }

    // Check both flat path and nested path for photo
    const newPhoto = req.body['personal.photo'] || req.body.personal?.photo;
    if (newPhoto) {
      userUpdate.photo = newPhoto;
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.updateOne(
        { employeeId: employee.employeeId, companyId },
        { $set: userUpdate }
      );
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
}
