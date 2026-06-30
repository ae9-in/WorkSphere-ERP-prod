import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PayrollRun } from '../models/PayrollRun.model';
import { Payslip } from '../models/Payslip.model';
import { SalaryStructure } from '../models/SalaryStructure.model';
import { Employee } from '../models/Employee.model';
import { Settings } from '../models/Settings.model';
import { Attendance } from '../models/Attendance.model';
import { auditLog } from '../middleware/audit.middleware';
import { Notification } from '../models/Notification.model';

// GET /api/payroll/runs
export async function getPayrollRuns(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const runs = await PayrollRun.find({ companyId }).sort({ year: -1, month: -1 }).lean();
    res.json({ success: true, data: runs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/payroll/runs
export async function createPayrollRun(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const { month, year } = req.body;
    
    // Check if run already exists
    const existing = await PayrollRun.findOne({ companyId, month, year });
    if (existing) {
      res.status(400).json({ success: false, message: 'Payroll run already exists for this period' });
      return;
    }

    const run = await PayrollRun.create({
      companyId,
      month,
      year,
      period: `${month}/${year}`,
      status: 'draft',
      createdBy: req.user?.sub || 'admin'
    });

    await auditLog('PAYROLL_RUN_CREATED', `Created payroll run for period ${month}/${year}`, req);
    res.status(201).json({ success: true, data: run });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/payroll/runs/:id/process
export async function processPayrollRun(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const { id } = req.params;

    const run = await PayrollRun.findOne({ _id: id, companyId });
    if (!run) {
      res.status(404).json({ success: false, message: 'Payroll run not found' });
      return;
    }

    run.status = 'processing';
    await run.save();

    // Async run processing
    processBackground(run._id.toString(), companyId, req.user?.sub || 'system');

    res.json({ success: true, message: 'Payroll processing started' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function processBackground(runId: string, companyId: string, authorId: string) {
  try {
    const run = await PayrollRun.findById(runId);
    if (!run) return;

    const employees = await Employee.find({ companyId, 'official.status': 'active' });
    const settings = await Settings.findOne({ companyId });
    const structure = await SalaryStructure.findOne({ companyId });

    let totalEmployees = 0;
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;

    // Clear old draft payslips
    await Payslip.deleteMany({ payrollRunId: runId });

    for (const emp of employees) {
      // Calculate LOP days from Attendance records
      const fromDate = new Date(run.year, run.month - 1, 1);
      const toDate = new Date(run.year, run.month, 0);
      const workingDays = toDate.getDate();

      const attendanceCount = await Attendance.countDocuments({
        companyId,
        employeeId: emp.employeeId,
        date: { $gte: fromDate, $lte: toDate },
        status: 'absent'
      });

      const lopDays = attendanceCount;
      const presentDays = workingDays - lopDays;

      // Base CTC from employee salary
      const ctc = emp.salary?.ctc || 600000; // default 6L CTC
      const monthlyGross = ctc / 12;
      const basePerDay = monthlyGross / workingDays;
      const actualGross = basePerDay * presentDays;

      // Compute standard components
      const basicPercent = settings?.payrollRules.basicPercent || 40;
      const hraPercent = settings?.payrollRules.hraPercent || 50;

      const basic = (actualGross * (basicPercent / 100));
      const hra = (basic * (hraPercent / 100));
      const special = actualGross - basic - hra;

      // Deductions
      let pf = 0;
      if (settings?.payrollRules.pfEnabled) {
        pf = Math.min(basic, 15000) * 0.12;
      }
      let esi = 0;
      if (settings?.payrollRules.esiEnabled && actualGross <= 21000) {
        esi = actualGross * 0.0075;
      }

      const totalDeds = pf + esi;
      const net = actualGross - totalDeds;

      await Payslip.create({
        companyId,
        payrollRunId: runId,
        employeeId: emp.employeeId,
        employeeSnapshot: {
          fullName: emp.fullName,
          designation: emp.job?.designationName,
          department: emp.job?.departmentName,
          pan: emp.personal?.personalPhone // fallback placeholder
        },
        payPeriod: {
          workingDays,
          presentDays,
          lopDays,
          overtimeHours: 0
        },
        earnings: [
          { code: 'BASIC', name: 'Basic Salary', amount: basic },
          { code: 'HRA', name: 'House Rent Allowance', amount: hra },
          { code: 'SPECIAL', name: 'Special Allowance', amount: special }
        ],
        deductions: [
          { code: 'PF', name: 'Provident Fund', amount: pf },
          { code: 'ESI', name: 'Employee State Insurance', amount: esi }
        ],
        totals: {
          gross: actualGross,
          deductions: totalDeds,
          net,
          ctc: ctc / 12
        },
        ytd: {
          gross: actualGross,
          deductions: totalDeds,
          net
        },
        status: 'draft'
      });

      totalEmployees++;
      totalGross += actualGross;
      totalDeductions += totalDeds;
      totalNetPay += net;
    }

    run.status = 'completed';
    run.totalEmployees = totalEmployees;
    run.totalGross = totalGross;
    run.totalDeductions = totalDeductions;
    run.totalNetPay = totalNetPay;
    run.processedAt = new Date();
    await run.save();
  } catch (err) {
    console.error('Payroll processing background job failed:', err);
  }
}

export async function approvePayrollRun(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const run = await PayrollRun.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { $set: { status: 'approved', approvedAt: new Date() } },
      { new: true }
    );
    await auditLog('PAYROLL_RUN_APPROVED', `Approved payroll run ID ${req.params.id}`, req);
    res.json({ success: true, data: run });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function lockPayrollRun(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const run = await PayrollRun.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { $set: { status: 'paid', paidAt: new Date() } },
      { new: true }
    );
    
    // In production, finalize all employee payslips status
    await Payslip.updateMany({ payrollRunId: run?._id }, { $set: { status: 'published' } });

    await auditLog('PAYROLL_RUN_LOCKED', `Locked & paid payroll run ID ${req.params.id}`, req);
    res.json({ success: true, data: run });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPayslipsForRun(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const payslips = await Payslip.find({ payrollRunId: req.params.id, companyId }).lean();
    res.json({ success: true, data: payslips });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPayslipPdf(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const payslip = await Payslip.findOne({ _id: req.params.id, companyId }).lean();
    if (!payslip) {
      res.status(404).json({ success: false, message: 'Payslip not found' });
      return;
    }
    // Return a mock base64/pdf layout or clean HTML representation that the frontend renders directly
    res.json({ success: true, data: payslip });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getSalaryStructures(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const structures = await SalaryStructure.find({ companyId });
    res.json({ success: true, data: structures });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createSalaryStructure(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const structure = await SalaryStructure.create({ ...req.body, companyId });
    res.status(201).json({ success: true, data: structure });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateSalaryStructure(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId || 'company_01';
    const structure = await SalaryStructure.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { $set: req.body },
      { new: true }
    );
    res.json({ success: true, data: structure });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
