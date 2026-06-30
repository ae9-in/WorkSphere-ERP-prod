import { Request, Response } from 'express';
import { Settings } from '../models/Settings.model';
import { Company } from '../models/Company.model';
import { LeaveType } from '../models/LeaveType.model';
import { Shift } from '../models/Shift.model';
import { HolidayCalendar } from '../models/HolidayCalendar.model';
import { NotificationTemplate } from '../models/NotificationTemplate.model';
import { WorkflowDefinition } from '../models/WorkflowDefinition.model';
import { SalaryStructure } from '../models/SalaryStructure.model';
import { auditLog } from '../middleware/audit.middleware';

// Helper to ensure settings exist for a company
async function getOrCreateSettings(companyId: string) {
  let settings = await Settings.findOne({ companyId });
  if (!settings) {
    settings = await Settings.create({
      companyId,
      departments: [
        { name: 'Engineering', code: 'ENG' },
        { name: 'Operations', code: 'OPS' },
        { name: 'Product', code: 'PRD' },
        { name: 'Human Resources', code: 'HR' }
      ],
      designations: [
        { name: 'Software Engineer', code: 'SWE' },
        { name: 'Product Manager', code: 'PM' },
        { name: 'HR Manager', code: 'HRM' }
      ],
      employmentTypes: [
        { name: 'Full Time', code: 'FT' },
        { name: 'Part Time', code: 'PT' },
        { name: 'Contract', code: 'CT' },
        { name: 'Intern', code: 'IN' }
      ],
      branches: [
        { name: 'Headquarters', code: 'HQ', lat: 12.9716, lng: 77.5946, geofenceRadius: 500 }
      ]
    });
  }
  return settings;
}

export async function getCompanySettings(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const company = await Company.findOne({ slug: companyId });
    const settings = await getOrCreateSettings(companyId);
    res.json({ success: true, data: { company, settings } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateCompanySettings(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const settings = await Settings.findOneAndUpdate(
      { companyId },
      { $set: req.body },
      { new: true, upsert: true }
    );
    await auditLog('SETTINGS_UPDATE', `Updated general settings for company ${companyId}`, req);
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDepartments(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const settings = await getOrCreateSettings(companyId);
    res.json({ success: true, data: settings.departments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function addDepartment(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const settings = await Settings.findOneAndUpdate(
      { companyId },
      { $push: { departments: req.body } },
      { new: true }
    );
    res.json({ success: true, data: settings?.departments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateDepartment(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const { id } = req.params;
    const settings = await Settings.findOneAndUpdate(
      { companyId, 'departments._id': id },
      { $set: { 'departments.$': req.body } },
      { new: true }
    );
    res.json({ success: true, data: settings?.departments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const { id } = req.params;
    const settings = await Settings.findOneAndUpdate(
      { companyId },
      { $pull: { departments: { _id: id } } },
      { new: true }
    );
    res.json({ success: true, data: settings?.departments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Similar CRUD wrappers for designations, employment-types and branches
export async function getDesignations(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const settings = await getOrCreateSettings(companyId);
    res.json({ success: true, data: settings.designations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function addDesignation(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const settings = await Settings.findOneAndUpdate(
      { companyId },
      { $push: { designations: req.body } },
      { new: true }
    );
    res.json({ success: true, data: settings?.designations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateDesignation(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const { id } = req.params;
    const settings = await Settings.findOneAndUpdate(
      { companyId, 'designations._id': id },
      { $set: { 'designations.$': req.body } },
      { new: true }
    );
    res.json({ success: true, data: settings?.designations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteDesignation(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const { id } = req.params;
    const settings = await Settings.findOneAndUpdate(
      { companyId },
      { $pull: { designations: { _id: id } } },
      { new: true }
    );
    res.json({ success: true, data: settings?.designations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Holiday Calendars, Leave Policies, Shift Policies
export async function getHolidayCalendars(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const calendars = await HolidayCalendar.find({ companyId });
    res.json({ success: true, data: calendars });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function saveHolidayCalendar(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const calendar = await HolidayCalendar.findOneAndUpdate(
      { companyId, year: req.body.year },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: calendar });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Initializer: Seeding all standard erp configurations per company
export async function initializeCompanySettings(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    
    // 1. Settings Document
    await getOrCreateSettings(companyId);

    // 2. Default Leave Types
    const leaveTypes = [
      { companyId, name: 'Annual Leave', code: 'AL', isPaid: true, accrualBased: true, maxDays: 15, carryForward: true, requiresApproval: true },
      { companyId, name: 'Sick Leave', code: 'SL', isPaid: true, accrualBased: false, maxDays: 7, carryForward: false, requiresApproval: true },
      { companyId, name: 'Casual Leave', code: 'CL', isPaid: true, accrualBased: false, maxDays: 7, carryForward: false, requiresApproval: true },
      { companyId, name: 'Maternity Leave', code: 'ML', isPaid: true, accrualBased: false, maxDays: 90, carryForward: false, gender: 'female', requiresApproval: true },
      { companyId, name: 'Paternity Leave', code: 'PL', isPaid: true, accrualBased: false, maxDays: 10, carryForward: false, gender: 'male', requiresApproval: true },
      { companyId, name: 'Loss Of Pay', code: 'LOP', isPaid: false, accrualBased: false, maxDays: 365, carryForward: false, requiresApproval: true }
    ];
    for (const lt of leaveTypes) {
      await LeaveType.findOneAndUpdate({ companyId, code: lt.code }, { $set: lt }, { upsert: true });
    }

    // 3. Default Shift
    await Shift.findOneAndUpdate(
      { companyId, code: 'GEN' },
      {
        $set: {
          companyId,
          name: 'General Shift',
          code: 'GEN',
          type: 'fixed',
          startTime: '09:00',
          endTime: '18:00',
          graceMinutes: 15,
          workDays: [1, 2, 3, 4, 5],
          weeklyOff: [0, 6],
          isNightShift: false,
          overtimeAfterMinutes: 30
        }
      },
      { upsert: true }
    );

    // 4. Default Salary Structure
    await SalaryStructure.findOneAndUpdate(
      { companyId, name: 'Default Structure' },
      {
        $set: {
          companyId,
          name: 'Default Structure',
          components: [
            { code: 'BASIC', name: 'Basic Salary', type: 'earning', calcType: 'pct_ctc', value: 40, isTaxable: true, isStatutory: false, displayOrder: 1 },
            { code: 'HRA', name: 'House Rent Allowance', type: 'earning', calcType: 'pct_basic', value: 50, isTaxable: true, isStatutory: false, displayOrder: 2 },
            { code: 'SPECIAL', name: 'Special Allowance', type: 'earning', calcType: 'formula', value: 0, isTaxable: true, isStatutory: false, displayOrder: 3 },
            { code: 'PF_EMP', name: 'Provident Fund (Employee)', type: 'deduction', calcType: 'fixed', value: 1800, isTaxable: false, isStatutory: true, displayOrder: 4 }
          ]
        }
      },
      { upsert: true }
    );

    // 5. Default Notifications Templates
    const templates = [
      { code: 'leave_applied', name: 'Leave Application Filed', module: 'leave', inApp: { title: 'Leave Applied', body: '{{employee_name}} has applied for {{leave_type}} from {{from_date}} to {{to_date}}.' } },
      { code: 'leave_approved', name: 'Leave Approved', module: 'leave', inApp: { title: 'Leave Approved', body: 'Your {{leave_type}} from {{from_date}} to {{to_date}} has been approved.' } },
      { code: 'leave_rejected', name: 'Leave Rejected', module: 'leave', inApp: { title: 'Leave Rejected', body: 'Your {{leave_type}} from {{from_date}} to {{to_date}} has been rejected.' } },
      { code: 'payslip_published', name: 'Payslip Published', module: 'payroll', inApp: { title: 'Payslip Published', body: 'Your payslip for {{period}} has been published. You can now download it.' } },
      { code: 'approval_required', name: 'Approval Task Assigned', module: 'workflow', inApp: { title: 'Action Required', body: 'A pending approval request requires your review.' } }
    ];
    for (const tpl of templates) {
      await NotificationTemplate.findOneAndUpdate(
        { companyId, code: tpl.code },
        {
          $set: {
            companyId,
            code: tpl.code,
            name: tpl.name,
            module: tpl.module,
            channels: {
              inApp: tpl.inApp
            },
            variables: ['{{employee_name}}', '{{leave_type}}', '{{from_date}}', '{{to_date}}', '{{period}}']
          }
        },
        { upsert: true }
      );
    }

    // 6. Default Workflow Definition for Leaves
    await WorkflowDefinition.findOneAndUpdate(
      { companyId, module: 'leave' },
      {
        $set: {
          companyId,
          module: 'leave',
          trigger: 'submitted',
          isActive: true,
          steps: [
            { stepNo: 1, approverType: 'reporting_manager', slaHours: 48, canDelegate: true }
          ]
        }
      },
      { upsert: true }
    );

    await auditLog('COMPANY_INITIALIZE', `Seeded defaults for company ${companyId}`, req);
    res.json({ success: true, message: 'Settings successfully initialized' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
